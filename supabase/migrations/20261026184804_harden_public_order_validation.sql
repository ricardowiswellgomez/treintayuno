-- Reconciles the public order RPC with the live hardening applied on 2026-10-26.
-- Rejects null/non-array item lists, oversized contact fields, duplicate-product stock overcommit, non-COP online checkout, and zero-value orders.
CREATE OR REPLACE FUNCTION public.create_public_store_order(p_business_id uuid, p_customer_name text, p_customer_phone text, p_customer_email text DEFAULT NULL::text, p_customer_address text DEFAULT NULL::text, p_customer_notes text DEFAULT NULL::text, p_items jsonb DEFAULT '[]'::jsonb, p_coupon_code text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_coupon public.business_coupons%rowtype;
  v_order_id uuid;
  v_token uuid;
  v_reference text;
  v_subtotal bigint := 0;
  v_discount bigint := 0;
  v_quantity numeric(14,3);
  v_accumulated_quantity numeric(14,3);
  v_product_key text;
  v_seen_quantities jsonb := '{}'::jsonb;
  v_line_total bigint;
  v_count integer := 0;
  v_currency char(3);
  v_code text;
begin
  if p_business_id is null
    or char_length(btrim(coalesce(p_customer_name,''))) < 2
    or char_length(btrim(coalesce(p_customer_name,''))) > 160
    or char_length(btrim(coalesce(p_customer_phone,''))) < 5
    or char_length(btrim(coalesce(p_customer_phone,''))) > 40
    or char_length(coalesce(p_customer_email,'')) > 254
    or char_length(coalesce(p_customer_address,'')) > 250
    or char_length(coalesce(p_customer_notes,'')) > 1000
    or char_length(coalesce(p_coupon_code,'')) > 32 then
    raise exception 'Revisa los datos de contacto y del cupón del pedido.';
  end if;

  if p_items is null or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'El pedido debe incluir una lista válida de productos.';
  end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 50 then
    raise exception 'El pedido debe incluir entre 1 y 50 líneas de productos.';
  end if;

  select b.currency_code into v_currency
  from public.businesses b
  where b.id = p_business_id;
  if v_currency is null then
    raise exception 'El catálogo no está disponible.';
  end if;
  if v_currency <> 'COP' then
    raise exception 'El pago en línea del catálogo solo está disponible en COP. Elige pedidos por WhatsApp para otra moneda.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_count := v_count + 1;
    if coalesce(v_item->>'product_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'Uno de los productos del pedido no es válido.';
    end if;
    begin
      v_quantity := (v_item->>'quantity')::numeric;
    exception when others then
      raise exception 'Una cantidad del pedido no es válida.';
    end;
    if v_quantity is null or v_quantity <= 0 or v_quantity > 1000 or v_quantity <> round(v_quantity,3) then
      raise exception 'Las cantidades deben ser mayores que cero y tener máximo tres decimales.';
    end if;

    select * into v_product
    from public.products p
    where p.id = (v_item->>'product_id')::uuid
      and p.business_id = p_business_id
      and p.is_published = true
      and p.is_sellable = true
      and p.archived_at is null
    for share;
    if not found then
      raise exception 'Un producto ya no está disponible para la venta.';
    end if;

    v_product_key := v_product.id::text;
    v_accumulated_quantity := coalesce((v_seen_quantities->>v_product_key)::numeric, 0) + v_quantity;
    if v_product.track_inventory and v_product.stock_on_hand < v_accumulated_quantity then
      raise exception 'No hay existencias suficientes de % para la cantidad solicitada.', v_product.name;
    end if;
    v_seen_quantities := jsonb_set(v_seen_quantities, array[v_product_key], to_jsonb(v_accumulated_quantity), true);

    v_line_total := round(v_product.sale_price_minor * v_quantity)::bigint;
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  if v_subtotal <= 0 then
    raise exception 'El pedido debe tener un total mayor que cero para pagar en línea.';
  end if;

  v_code := upper(btrim(coalesce(p_coupon_code,'')));
  if v_code <> '' then
    perform pg_advisory_xact_lock(hashtextextended(p_business_id::text || ':' || v_code, 0));
    select * into v_coupon
    from public.business_coupons c
    where c.business_id = p_business_id
      and upper(c.code) = v_code
      and c.is_active = true
      and (c.starts_at is null or c.starts_at <= now())
      and (c.ends_at is null or c.ends_at >= now())
      and (c.usage_limit is null or c.usage_count + (
        select count(*) from public.public_store_orders o
        where o.coupon_id = c.id
          and o.payment_status = 'pending'
          and o.created_at > now() - interval '24 hours'
      ) < c.usage_limit)
    for update;
    if not found then
      raise exception 'El cupón no existe, está vencido o ya alcanzó su límite.';
    end if;
    if v_subtotal < v_coupon.minimum_subtotal_minor then
      raise exception 'El pedido no alcanza el mínimo requerido para este cupón.';
    end if;
    if v_coupon.discount_type = 'percentage' then
      v_discount := floor(v_subtotal * v_coupon.discount_value / 100.0)::bigint;
    else
      v_discount := v_coupon.discount_value;
    end if;
    if v_coupon.maximum_discount_minor is not null then
      v_discount := least(v_discount, v_coupon.maximum_discount_minor);
    end if;
    v_discount := least(v_subtotal, greatest(0, v_discount));
    if v_discount >= v_subtotal then
      raise exception 'El cupón debe dejar un saldo por pagar.';
    end if;
  end if;

  v_order_id := gen_random_uuid();
  v_token := gen_random_uuid();
  v_reference := 'T31-' || upper(replace(v_order_id::text,'-',''));

  insert into public.public_store_orders(
    id,business_id,order_reference,checkout_token,customer_name,customer_phone,
    customer_email,customer_address,customer_notes,currency_code,subtotal_minor,
    total_minor,coupon_id,coupon_code,discount_minor
  ) values (
    v_order_id,p_business_id,v_reference,v_token,btrim(p_customer_name),btrim(p_customer_phone),
    nullif(btrim(coalesce(p_customer_email,'')),''),nullif(btrim(coalesce(p_customer_address,'')), ''),
    nullif(btrim(coalesce(p_customer_notes,'')),''),v_currency,v_subtotal,
    greatest(0,v_subtotal-v_discount),case when v_code='' then null else v_coupon.id end,
    case when v_code='' then null else v_coupon.code end,v_discount
  );

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::numeric;
    select * into v_product
    from public.products p
    where p.id = (v_item->>'product_id')::uuid
      and p.business_id = p_business_id;
    v_line_total := round(v_product.sale_price_minor * v_quantity)::bigint;
    insert into public.public_store_order_items(
      order_id,business_id,product_id,item_name,quantity,unit_price_minor,line_total_minor
    ) values (
      v_order_id,p_business_id,v_product.id,v_product.name,v_quantity,
      v_product.sale_price_minor,v_line_total
    );
  end loop;

  return jsonb_build_object(
    'order_id',v_order_id,'order_reference',v_reference,'checkout_token',v_token,
    'subtotal_minor',v_subtotal,'discount_minor',v_discount,
    'total_minor',greatest(0,v_subtotal-v_discount),
    'coupon_code',case when v_code='' then null else v_coupon.code end,
    'currency_code',v_currency,'payment_status','pending'
  );
end;
$function$
