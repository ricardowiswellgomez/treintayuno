-- Add customer attribution and server-side stock control for multi-item bundles.
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS advisor_name text;
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS advisor_name text;

-- New overload keeps existing clients functional while supporting an advisor snapshot
-- and bundles whose component inventory is consumed atomically with the sale.
CREATE OR REPLACE FUNCTION public.create_sale(
  p_business_id uuid,
  p_customer_id uuid,
  p_items jsonb,
  p_amount_paid_minor bigint,
  p_notes text,
  p_initial_payment_method text,
  p_advisor_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
DECLARE
  v_item jsonb;
  v_component jsonb;
  v_product public.products%ROWTYPE;
  v_component_product public.products%ROWTYPE;
  v_requirement record;
  v_required jsonb := '{}'::jsonb;
  v_bundle_required jsonb := '{}'::jsonb;
  v_bundle_costs jsonb := '{}'::jsonb;
  v_components jsonb;
  v_product_id uuid;
  v_component_id uuid;
  v_quantity numeric;
  v_bundle_quantity numeric;
  v_component_quantity numeric;
  v_subtotal bigint;
  v_discount bigint;
  v_bundle_cost bigint;
  v_result jsonb;
  v_sale_id uuid;
  v_sale_number text;
BEGIN
  IF auth.uid() IS NULL OR NOT private.can_access_business(p_business_id, 'sales_manage') THEN
    RAISE EXCEPTION 'No tienes permiso para registrar ventas en este negocio.';
  END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Añade entre 1 y 50 artículos a la venta.';
  END IF;
  IF coalesce(p_amount_paid_minor, 0) < 0 THEN
    RAISE EXCEPTION 'El abono no puede ser negativo.';
  END IF;
  IF coalesce(p_initial_payment_method, 'No especificado') NOT IN
    ('Efectivo','Transferencia','Tarjeta','Nequi','Daviplata','Otro','No especificado') THEN
    RAISE EXCEPTION 'La forma de pago inicial no es válida.';
  END IF;
  IF p_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = p_customer_id AND c.business_id = p_business_id
  ) THEN
    RAISE EXCEPTION 'El cliente seleccionado no pertenece a este negocio.';
  END IF;

  -- Validate IDs and quantities before casting JSON values to database types.
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    IF coalesce(v_item->>'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'Hay un artículo sin producto válido.';
    END IF;
    IF coalesce(v_item->>'quantity', '') !~ '^[0-9]+(\.[0-9]{1,3})?$'
      OR (v_item->>'quantity')::numeric <= 0 THEN
      RAISE EXCEPTION 'Cada cantidad debe ser mayor que cero y tener máximo tres decimales.';
    END IF;
  END LOOP;

  -- Lock products in deterministic ID order: sale items and bundle components.
  PERFORM p.id
  FROM public.products p
  WHERE p.business_id = p_business_id
    AND p.id IN (
      SELECT (item->>'product_id')::uuid
      FROM jsonb_array_elements(p_items) AS requested(item)
      UNION
      SELECT (component->>'product_id')::uuid
      FROM jsonb_array_elements(p_items) AS requested(item)
      JOIN public.products bundle
        ON bundle.id = (item->>'product_id')::uuid
       AND bundle.business_id = p_business_id
       AND bundle.metadata->>'is_bundle' = 'true'
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(bundle.metadata->'bundle_components') = 'array'
          THEN bundle.metadata->'bundle_components' ELSE '[]'::jsonb END
      ) AS component
      WHERE coalesce(component->>'product_id','') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    )
  ORDER BY p.id
  FOR UPDATE OF p;

  -- Precalculate combined stock requirements across stand-alone items and all bundles.
  -- This prevents a bundle from selling the same remaining unit twice in one cart.
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::numeric;
    SELECT * INTO v_product
    FROM public.products p
    WHERE p.id = v_product_id AND p.business_id = p_business_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Uno de los productos no existe o pertenece a otro negocio.';
    END IF;
    IF NOT coalesce(v_product.is_sellable, false) OR v_product.archived_at IS NOT NULL THEN
      RAISE EXCEPTION 'El producto "%" no está activo para la venta o está archivado.', v_product.name;
    END IF;

    v_required := jsonb_set(
      v_required, ARRAY[v_product_id::text],
      to_jsonb(coalesce((v_required->>v_product_id::text)::numeric, 0) + v_quantity), true
    );

    IF coalesce(v_product.metadata->>'is_bundle','false') = 'true' THEN
      v_components := v_product.metadata->'bundle_components';
      IF jsonb_typeof(v_components) IS DISTINCT FROM 'array'
        OR jsonb_array_length(v_components) < 2 OR jsonb_array_length(v_components) > 20 THEN
        RAISE EXCEPTION 'El conjunto "%" debe tener entre 2 y 20 prendas configuradas.', v_product.name;
      END IF;
      IF coalesce(v_product.track_inventory, false) THEN
        RAISE EXCEPTION 'El conjunto "%" debe manejar las existencias de sus prendas, no un stock independiente.', v_product.name;
      END IF;
      IF coalesce(v_product.metadata->>'bundle_discount_minor','0') !~ '^[0-9]+$' THEN
        RAISE EXCEPTION 'El descuento del conjunto "%" no es válido.', v_product.name;
      END IF;
      SELECT count(*), count(DISTINCT coalesce(component->>'product_id',''))
        INTO v_subtotal, v_discount
      FROM jsonb_array_elements(v_components) AS component;
      IF v_subtotal <> v_discount THEN
        RAISE EXCEPTION 'El conjunto "%" contiene prendas repetidas. Corrígelo en Productos.', v_product.name;
      END IF;

      v_subtotal := 0;
      v_bundle_cost := 0;
      v_discount := coalesce((v_product.metadata->>'bundle_discount_minor')::bigint, 0);
      FOR v_component IN SELECT value FROM jsonb_array_elements(v_components)
      LOOP
        IF coalesce(v_component->>'product_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
          RAISE EXCEPTION 'Una prenda del conjunto "%" no tiene un producto válido.', v_product.name;
        END IF;
        IF coalesce(v_component->>'quantity','') !~ '^[0-9]+(\.[0-9]{1,3})?$'
          OR (v_component->>'quantity')::numeric <= 0 THEN
          RAISE EXCEPTION 'Una cantidad del conjunto "%" no es válida.', v_product.name;
        END IF;
        v_component_id := (v_component->>'product_id')::uuid;
        v_component_quantity := (v_component->>'quantity')::numeric;
        SELECT * INTO v_component_product FROM public.products c
        WHERE c.id = v_component_id AND c.business_id = p_business_id;
        IF NOT FOUND OR NOT coalesce(v_component_product.is_sellable,false)
          OR v_component_product.archived_at IS NOT NULL THEN
          RAISE EXCEPTION 'Una prenda del conjunto "%" ya no está disponible. Edita el conjunto antes de venderlo.', v_product.name;
        END IF;
        IF coalesce(v_component_product.metadata->>'is_bundle','false') = 'true' THEN
          RAISE EXCEPTION 'No se pueden incluir conjuntos dentro de otros conjuntos.';
        END IF;

        v_subtotal := v_subtotal + round(v_component_product.sale_price_minor * v_component_quantity)::bigint;
        v_bundle_cost := v_bundle_cost + round(v_component_product.cost_price_minor * v_component_quantity)::bigint;
        v_required := jsonb_set(
          v_required, ARRAY[v_component_id::text],
          to_jsonb(coalesce((v_required->>v_component_id::text)::numeric,0) + v_quantity * v_component_quantity), true
        );
        v_bundle_required := jsonb_set(
          v_bundle_required, ARRAY[v_component_id::text],
          to_jsonb(coalesce((v_bundle_required->>v_component_id::text)::numeric,0) + v_quantity * v_component_quantity), true
        );
      END LOOP;

      IF v_discount > v_subtotal THEN
        RAISE EXCEPTION 'El descuento del conjunto "%" no puede superar el valor de sus prendas.', v_product.name;
      END IF;
      IF v_product.sale_price_minor <> v_subtotal - v_discount THEN
        RAISE EXCEPTION 'El precio de las prendas del conjunto "%" cambió. Edita y guarda el conjunto antes de venderlo.', v_product.name;
      END IF;
      v_bundle_costs := jsonb_set(v_bundle_costs, ARRAY[v_product_id::text], to_jsonb(v_bundle_cost), true);
    END IF;
  END LOOP;

  FOR v_requirement IN SELECT key, value FROM jsonb_each_text(v_required)
  LOOP
    SELECT * INTO v_component_product
    FROM public.products p
    WHERE p.id = v_requirement.key::uuid AND p.business_id = p_business_id;
    IF FOUND AND coalesce(v_component_product.track_inventory,false)
      AND v_requirement.value::numeric > v_component_product.stock_on_hand THEN
      RAISE EXCEPTION 'No hay existencias suficientes de "%". Disponibles: %, solicitadas entre prendas y conjuntos: %.',
        v_component_product.name, v_component_product.stock_on_hand, v_requirement.value::numeric;
    END IF;
  END LOOP;

  -- Reuse the existing transactional sale function for documents, payments, taxes,
  -- stand-alone stock movements, and its existing permission checks.
  v_result := public.create_sale(
    p_business_id, p_customer_id, p_items, p_amount_paid_minor, p_notes, p_initial_payment_method
  );
  v_sale_id := (v_result->>'id')::uuid;
  v_sale_number := v_result->>'sale_number';

  UPDATE public.sales
  SET advisor_name = nullif(btrim(p_advisor_name),'')
  WHERE id = v_sale_id AND business_id = p_business_id;

  -- The cost of a bundle is the sum of the current costs of its component garments.
  FOR v_requirement IN SELECT key, value FROM jsonb_each_text(v_bundle_costs)
  LOOP
    UPDATE public.sale_items
    SET unit_cost_minor = v_requirement.value::bigint
    WHERE business_id = p_business_id AND sale_id = v_sale_id
      AND product_id = v_requirement.key::uuid;
  END LOOP;

  -- Deduct the bundle components after the original sale function has deducted direct
  -- items. The precheck above counted both types together while their rows were locked.
  FOR v_requirement IN SELECT key, value FROM jsonb_each_text(v_bundle_required)
  LOOP
    SELECT * INTO v_component_product
    FROM public.products p
    WHERE p.id = v_requirement.key::uuid AND p.business_id = p_business_id;
    IF FOUND AND coalesce(v_component_product.track_inventory,false) THEN
      UPDATE public.products
      SET stock_on_hand = stock_on_hand - v_requirement.value::numeric,
          updated_at = now()
      WHERE id = v_requirement.key::uuid AND business_id = p_business_id;
      INSERT INTO public.stock_movements (
        business_id, product_id, movement_type, quantity_delta, reference_type,
        reference_id, idempotency_key, notes, created_by
      ) VALUES (
        p_business_id, v_requirement.key::uuid, 'sale', -v_requirement.value::numeric,
        'sale', v_sale_id, 'sale:'||v_sale_id::text||':bundle:'||v_requirement.key,
        'Salida de prendas por conjunto en '||coalesce(v_sale_number,'la venta'), auth.uid()
      );
    END IF;
  END LOOP;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_sale(uuid,uuid,jsonb,bigint,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_sale(uuid,uuid,jsonb,bigint,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_sale_with_date(
  p_business_id uuid,
  p_customer_id uuid,
  p_items jsonb,
  p_amount_paid_minor bigint,
  p_notes text,
  p_initial_payment_method text,
  p_sold_at timestamptz,
  p_advisor_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
DECLARE
  v_result jsonb;
  v_sale_id uuid;
  v_sale_number text;
  v_timezone text;
BEGIN
  IF auth.uid() IS NULL OR NOT private.can_access_business(p_business_id,'sales_manage') THEN
    RAISE EXCEPTION 'No tienes permiso para registrar ventas en este negocio.';
  END IF;
  SELECT coalesce(nullif(b.timezone,''),'America/Bogota') INTO v_timezone
  FROM public.businesses b WHERE b.id=p_business_id;
  IF v_timezone IS NULL THEN
    RAISE EXCEPTION 'No se encontró el negocio seleccionado.';
  END IF;
  IF p_sold_at IS NULL OR
    (p_sold_at AT TIME ZONE v_timezone)::date > (now() AT TIME ZONE v_timezone)::date THEN
    RAISE EXCEPTION 'La fecha de venta no puede ser posterior al día de hoy.';
  END IF;

  v_result := public.create_sale(
    p_business_id, p_customer_id, p_items, p_amount_paid_minor,
    p_notes, p_initial_payment_method, p_advisor_name
  );
  v_sale_id := (v_result->>'id')::uuid;
  v_sale_number := 'VTA-'||to_char(p_sold_at AT TIME ZONE v_timezone,'YYYYMMDD')||
    '-'||upper(substr(replace(v_sale_id::text,'-',''),1,8));

  UPDATE public.sales
  SET sold_at=p_sold_at, sale_number=v_sale_number, updated_at=now()
  WHERE id=v_sale_id AND business_id=p_business_id;
  UPDATE public.sale_payments SET paid_at=p_sold_at
  WHERE business_id=p_business_id AND sale_id=v_sale_id
    AND notes='Abono inicial al registrar la venta';
  UPDATE public.stock_movements
  SET created_at=p_sold_at, notes='Salida por '||v_sale_number
  WHERE business_id=p_business_id AND reference_type='sale' AND reference_id=v_sale_id
    AND idempotency_key NOT LIKE 'sale:'||v_sale_id::text||':bundle:%';

  RETURN jsonb_set(v_result,'{sale_number}',to_jsonb(v_sale_number),true);
END;
$function$;

REVOKE ALL ON FUNCTION public.create_sale_with_date(uuid,uuid,jsonb,bigint,text,text,timestamptz,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_sale_with_date(uuid,uuid,jsonb,bigint,text,text,timestamptz,text) TO authenticated;
