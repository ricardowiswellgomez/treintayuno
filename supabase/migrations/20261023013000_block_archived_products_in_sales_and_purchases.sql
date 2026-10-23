CREATE OR REPLACE FUNCTION public.create_sale(p_business_id uuid, p_customer_id uuid DEFAULT NULL::uuid, p_items jsonb DEFAULT '[]'::jsonb, p_amount_paid_minor bigint DEFAULT 0, p_notes text DEFAULT NULL::text, p_initial_payment_method text DEFAULT 'No especificado'::text)
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
  IF coalesce(p_initial_payment_method, 'No especificado') NOT IN ('Efectivo','Transferencia','Tarjeta','Otro','No especificado') THEN
    RAISE EXCEPTION 'La forma de pago inicial no es válida.';
  END IF;
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
    IF NOT coalesce(v_product.is_sellable, false) OR v_product.archived_at IS NOT NULL THEN
      RAISE EXCEPTION 'El producto "%" no está activo para la venta o está archivado.', v_product.name;
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


  IF v_paid > 0 THEN
    INSERT INTO public.sale_payments (
      business_id, sale_id, amount_minor, payment_method, paid_at, notes, created_by
    ) VALUES (
      p_business_id, v_sale_id, v_paid, coalesce(p_initial_payment_method, 'No especificado'), now(),
      'Abono inicial al registrar la venta', auth.uid()
    );
  END IF;

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

CREATE OR REPLACE FUNCTION public.create_purchase(p_business_id uuid, p_supplier_id uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text, p_purchased_at timestamp with time zone DEFAULT now(), p_tax_minor bigint DEFAULT 0, p_amount_paid_minor bigint DEFAULT 0, p_items jsonb DEFAULT '[]'::jsonb, p_initial_payment_method text DEFAULT 'No especificado'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
declare
  v_purchase_id uuid;
  v_purchase_number text;
  v_item jsonb;
  v_product_id uuid;
  v_item_name text;
  v_product_name text;
  v_track_inventory boolean;
  v_archived_at timestamptz;
  v_quantity numeric;
  v_unit_cost_minor bigint;
  v_line_total_minor bigint;
  v_subtotal_minor bigint := 0;
  v_total_minor bigint := 0;
  v_status public.document_status;
begin
  if coalesce(p_initial_payment_method, 'No especificado') not in ('Efectivo','Transferencia','Tarjeta','Otro','No especificado') then
    raise exception 'La forma de pago inicial no es válida.';
  end if;
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para registrar una compra.';
  end if;
  if not private.can_access_business(p_business_id, 'purchases_manage') then
    raise exception 'No tienes permiso para registrar compras en este negocio.';
  end if;
  if not private.can_access_business(p_business_id, 'products_manage') then
    raise exception 'Necesitas permiso para actualizar las existencias del negocio.';
  end if;
  if p_supplier_id is not null and not exists (
    select 1 from public.suppliers s
    where s.id = p_supplier_id and s.business_id = p_business_id
  ) then
    raise exception 'El proveedor elegido no pertenece a este negocio.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'La compra necesita al menos un artículo.';
  end if;
  if coalesce(p_tax_minor, 0) < 0 or coalesce(p_amount_paid_minor, 0) < 0 then
    raise exception 'Los importes no pueden ser negativos.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) as x(value) loop
    v_product_id := nullif(v_item->>'product_id', '')::uuid;
    v_item_name := nullif(btrim(v_item->>'item_name'), '');
    v_quantity := nullif(v_item->>'quantity', '')::numeric;
    v_unit_cost_minor := nullif(v_item->>'unit_cost_minor', '')::bigint;
    if v_quantity is null or v_quantity <= 0 or v_unit_cost_minor is null or v_unit_cost_minor < 0 then
      raise exception 'Cada artículo necesita cantidad mayor que cero y costo válido.';
    end if;
    if v_product_id is not null then
      select p.name, p.track_inventory, p.archived_at into v_product_name, v_track_inventory, v_archived_at
      from public.products p
      where p.id = v_product_id and p.business_id = p_business_id
      for update;
      if not found then
        raise exception 'Un producto de la compra no pertenece a este negocio.';
      end if;
      if v_archived_at is not null then
        raise exception 'No puedes registrar una compra para un producto archivado. Restaura primero el producto.';
      end if;
      v_item_name := coalesce(v_item_name, v_product_name);
    end if;
    if v_item_name is null then
      raise exception 'Cada artículo necesita un nombre.';
    end if;
    v_line_total_minor := round(v_quantity * v_unit_cost_minor)::bigint;
    v_subtotal_minor := v_subtotal_minor + v_line_total_minor;
  end loop;

  v_total_minor := v_subtotal_minor + coalesce(p_tax_minor, 0);
  if coalesce(p_amount_paid_minor, 0) > v_total_minor then
    raise exception 'El abono no puede superar el total de la compra.';
  end if;
  v_status := case
    when coalesce(p_amount_paid_minor, 0) >= v_total_minor then 'paid'::public.document_status
    when coalesce(p_amount_paid_minor, 0) > 0 then 'partially_paid'::public.document_status
    else 'pending'::public.document_status
  end;
  v_purchase_number := 'COM-' || to_char(coalesce(p_purchased_at, now()), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.purchases (
    business_id, supplier_id, purchase_number, status, currency_code,
    subtotal_minor, tax_minor, total_minor, amount_paid_minor, notes, purchased_at, created_by
  ) values (
    p_business_id, p_supplier_id, v_purchase_number, v_status,
    coalesce((select b.currency_code from public.businesses b where b.id = p_business_id), 'COP'),
    v_subtotal_minor, coalesce(p_tax_minor, 0), v_total_minor, coalesce(p_amount_paid_minor, 0),
    nullif(btrim(p_notes), ''), coalesce(p_purchased_at, now()), auth.uid()
  ) returning id into v_purchase_id;

  if coalesce(p_amount_paid_minor,0) > 0 then
    insert into public.purchase_payments(
      business_id,purchase_id,amount_minor,payment_method,paid_at,notes,created_by
    ) values (
      p_business_id,v_purchase_id,p_amount_paid_minor,coalesce(p_initial_payment_method,'No especificado'),
      coalesce(p_purchased_at,now()),'Abono inicial al registrar la compra',auth.uid()
    );
  end if;

  for v_item in select value from jsonb_array_elements(p_items) as x(value) loop
    v_product_id := nullif(v_item->>'product_id', '')::uuid;
    v_item_name := nullif(btrim(v_item->>'item_name'), '');
    v_quantity := nullif(v_item->>'quantity', '')::numeric;
    v_unit_cost_minor := nullif(v_item->>'unit_cost_minor', '')::bigint;
    if v_product_id is not null then
      select p.name, p.track_inventory, p.archived_at into v_product_name, v_track_inventory, v_archived_at
      from public.products p
      where p.id = v_product_id and p.business_id = p_business_id
      for update;
      if v_archived_at is not null then
        raise exception 'No puedes registrar una compra para un producto archivado. Restaura primero el producto.';
      end if;
      v_item_name := coalesce(v_item_name, v_product_name);
    end if;
    v_line_total_minor := round(v_quantity * v_unit_cost_minor)::bigint;

    insert into public.purchase_items (
      business_id, purchase_id, product_id, item_name, quantity, unit_cost_minor, line_total_minor
    ) values (
      p_business_id, v_purchase_id, v_product_id, v_item_name, v_quantity, v_unit_cost_minor, v_line_total_minor
    );

    if v_product_id is not null and coalesce(v_track_inventory, false) then
      update public.products
      set stock_on_hand = coalesce(stock_on_hand, 0) + v_quantity,
          cost_price_minor = case
            when coalesce(stock_on_hand, 0) <= 0 or coalesce(cost_price_minor, 0) <= 0
              then v_unit_cost_minor
            else round(
              ((coalesce(stock_on_hand, 0) * coalesce(cost_price_minor, 0)) +
               (v_quantity * v_unit_cost_minor)) /
              (coalesce(stock_on_hand, 0) + v_quantity)
            )::bigint
          end,
          updated_at = now()
      where id = v_product_id and business_id = p_business_id;
      insert into public.stock_movements (
        business_id, product_id, movement_type, quantity_delta, reference_type, reference_id, notes, created_by
      ) values (
        p_business_id, v_product_id, 'purchase', v_quantity, 'purchase', v_purchase_id,
        'Ingreso por compra ' || v_purchase_number, auth.uid()
      );
    end if;
  end loop;

  return v_purchase_id;
end;
$function$;

notify pgrst, 'reload schema';