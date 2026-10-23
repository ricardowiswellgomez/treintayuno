-- Treintayuno: venta transaccional. La venta, sus artículos y los movimientos
-- de inventario se confirman o revierten juntos.
CREATE OR REPLACE FUNCTION public.create_sale(
  p_business_id uuid,
  p_customer_id uuid DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_amount_paid_minor bigint DEFAULT 0,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $function$
DECLARE
  v_item jsonb;
  v_line record;
  v_product public.products%ROWTYPE;
  v_lines jsonb := '[]'::jsonb;
  v_line_total bigint;
  v_total bigint := 0;
  v_sale_id uuid := gen_random_uuid();
  v_sale_number text;
  v_status public.document_status;
  v_paid bigint := coalesce(p_amount_paid_minor, 0);
  v_count integer;
  v_distinct_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT private.can_access_business(p_business_id, 'sales_manage') THEN
    RAISE EXCEPTION 'No tienes permiso para registrar ventas en este negocio.';
  END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'La lista de artículos no tiene un formato válido.';
  END IF;
  IF jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Añade entre 1 y 50 artículos a la venta.';
  END IF;
  IF v_paid < 0 THEN RAISE EXCEPTION 'El abono no puede ser negativo.'; END IF;
  IF p_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.customers c WHERE c.id = p_customer_id AND c.business_id = p_business_id
  ) THEN RAISE EXCEPTION 'El cliente seleccionado no pertenece a este negocio.'; END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    IF coalesce(v_item->>'product_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'Hay un artículo sin producto válido.';
    END IF;
    IF coalesce(v_item->>'quantity','') !~ '^[0-9]+(\.[0-9]{1,3})?$'
       OR (v_item->>'quantity')::numeric <= 0 THEN
      RAISE EXCEPTION 'Cada cantidad debe ser mayor que cero y tener máximo tres decimales.';
    END IF;
  END LOOP;

  PERFORM p.id
  FROM public.products p
  JOIN (
    SELECT DISTINCT (item->>'product_id')::uuid AS product_id
    FROM jsonb_array_elements(p_items) AS item
  ) requested ON requested.product_id = p.id
  WHERE p.business_id = p_business_id
  ORDER BY p.id
  FOR UPDATE OF p;

  SELECT count(*) INTO v_count
  FROM (
    SELECT DISTINCT (item->>'product_id')::uuid AS product_id
    FROM jsonb_array_elements(p_items) AS item
  ) requested
  JOIN public.products p ON p.id = requested.product_id AND p.business_id = p_business_id;
  SELECT count(*) INTO v_distinct_count
  FROM (
    SELECT DISTINCT (item->>'product_id')::uuid AS product_id
    FROM jsonb_array_elements(p_items) AS item
  ) requested;
  IF v_count <> v_distinct_count THEN
    RAISE EXCEPTION 'Uno de los productos no existe o pertenece a otro negocio.';
  END IF;

  FOR v_line IN
    SELECT (item->>'product_id')::uuid AS product_id, sum((item->>'quantity')::numeric) AS quantity
    FROM jsonb_array_elements(p_items) AS item
    GROUP BY (item->>'product_id')::uuid
    ORDER BY (item->>'product_id')::uuid
  LOOP
    SELECT * INTO v_product FROM public.products p
    WHERE p.id = v_line.product_id AND p.business_id = p_business_id FOR UPDATE;
    IF NOT coalesce(v_product.is_sellable, false) THEN
      RAISE EXCEPTION 'El producto "%" no está activo para la venta.', v_product.name;
    END IF;
    IF v_product.track_inventory AND v_line.quantity > v_product.stock_on_hand THEN
      RAISE EXCEPTION 'No hay existencias suficientes de "%". Disponibles: %, solicitadas: %.',
        v_product.name, v_product.stock_on_hand, v_line.quantity;
    END IF;
    v_line_total := round(v_product.sale_price_minor * v_line.quantity)::bigint;
    v_total := v_total + v_line_total;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id, 'name', v_product.name, 'sku', v_product.sku,
      'quantity', v_line.quantity, 'unit_price_minor', v_product.sale_price_minor,
      'unit_cost_minor', v_product.cost_price_minor, 'line_total_minor', v_line_total,
      'track_inventory', v_product.track_inventory
    ));
  END LOOP;

  IF v_paid > v_total THEN RAISE EXCEPTION 'El abono no puede superar el total de la venta.'; END IF;
  v_status := CASE
    WHEN v_paid >= v_total THEN 'paid'::public.document_status
    WHEN v_paid > 0 THEN 'partially_paid'::public.document_status
    ELSE 'pending'::public.document_status
  END;
  v_sale_number := 'VTA-' || to_char(
    now() AT TIME ZONE coalesce(
      (SELECT nullif(b.timezone, '') FROM public.businesses b WHERE b.id = p_business_id),
      'America/Bogota'
    ),
    'YYYYMMDD'
  ) || '-' || upper(substr(replace(v_sale_id::text, '-', ''), 1, 8));

  INSERT INTO public.sales (
    id,business_id,customer_id,sale_number,status,currency_code,subtotal_minor,
    discount_minor,tax_minor,total_minor,amount_paid_minor,notes,sold_at,created_by
  ) VALUES (
    v_sale_id,p_business_id,p_customer_id,v_sale_number,v_status,
    (SELECT b.currency_code FROM public.businesses b WHERE b.id=p_business_id),
    v_total,0,0,v_total,v_paid,nullif(btrim(p_notes),''),now(),auth.uid()
  );

  FOR v_item IN SELECT value FROM jsonb_array_elements(v_lines)
  LOOP
    INSERT INTO public.sale_items (
      business_id,sale_id,product_id,item_name,sku_snapshot,quantity,unit_price_minor,
      unit_cost_minor,discount_minor,tax_minor,line_total_minor
    ) VALUES (
      p_business_id,v_sale_id,(v_item->>'product_id')::uuid,v_item->>'name',v_item->>'sku',
      (v_item->>'quantity')::numeric,(v_item->>'unit_price_minor')::bigint,
      (v_item->>'unit_cost_minor')::bigint,0,0,(v_item->>'line_total_minor')::bigint
    );
    IF (v_item->>'track_inventory')::boolean THEN
      UPDATE public.products SET stock_on_hand=stock_on_hand-(v_item->>'quantity')::numeric,updated_at=now()
      WHERE id=(v_item->>'product_id')::uuid AND business_id=p_business_id;
      INSERT INTO public.stock_movements (
        business_id,product_id,movement_type,quantity_delta,reference_type,reference_id,
        idempotency_key,notes,created_by
      ) VALUES (
        p_business_id,(v_item->>'product_id')::uuid,'sale',-((v_item->>'quantity')::numeric),
        'sale',v_sale_id,'sale:'||v_sale_id::text||':'||(v_item->>'product_id'),
        'Salida por '||v_sale_number,auth.uid()
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('id',v_sale_id,'sale_number',v_sale_number,'total_minor',v_total,
    'amount_paid_minor',v_paid,'status',v_status);
END;
$function$;

REVOKE ALL ON FUNCTION public.create_sale(uuid,uuid,jsonb,bigint,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_sale(uuid,uuid,jsonb,bigint,text) TO authenticated;
