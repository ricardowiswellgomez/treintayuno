-- Persist tax details for public orders and apply the stored product tax code at checkout.
alter table public.public_store_orders add column if not exists tax_minor bigint not null default 0;
alter table public.public_store_order_items add column if not exists tax_minor bigint not null default 0;
alter table public.public_store_order_items add column if not exists tax_code text not null default 'none';
alter table public.public_store_order_items add column if not exists tax_rate numeric(5,2) not null default 0;

create or replace function public.create_public_store_order(
  p_business_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text default null,
  p_customer_address text default null,
  p_customer_notes text default null,
  p_items jsonb default '[]'::jsonb,
  p_coupon_code text default null
) returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_coupon public.business_coupons%rowtype;
  v_order_id uuid;
  v_token uuid;
  v_reference text;
  v_subtotal bigint := 0;
  v_tax_total bigint := 0;
  v_discount bigint := 0;
  v_quantity numeric(14,3);
  v_accumulated_quantity numeric(14,3);
  v_product_key text;
  v_seen_quantities jsonb := '{}'::jsonb;
  v_line_base bigint;
  v_line_tax bigint;
  v_line_total bigint;
  v_line_net bigint;
  v_tax_code text;
  v_tax_rate numeric := 0;
  v_prices_include_vat boolean := false;
  v_count integer := 0;
  v_currency char(3);
  v_code text;
begin
  if p_business_id is null
    or char_length(btrim(coalesce(p_customer_name,'')))<2
    or char_length(btrim(coalesce(p_customer_name,'')))>160
    or char_length(btrim(coalesce(p_customer_phone,'')))<5
    or char_length(btrim(coalesce(p_customer_phone,'')))>40
    or char_length(coalesce(p_customer_email,''))>254
    or char_length(coalesce(p_customer_address,''))>250
    or char_length(coalesce(p_customer_notes,''))>1000
    or char_length(coalesce(p_coupon_code,''))>32 then
    raise exception 'Revisa los datos de contacto y del cupón del pedido.';
  end if;
  if p_items is null or jsonb_typeof(p_items) is distinct from 'array' then raise exception 'El pedido debe incluir una lista válida de productos.'; end if;
  if jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>50 then raise exception 'El pedido debe incluir entre 1 y 50 líneas de productos.'; end if;

  select b.currency_code,coalesce((b.settings #>> '{tax_profile,pricesIncludeVat}')::boolean,false)
    into v_currency,v_prices_include_vat from public.businesses b where b.id=p_business_id;
  if v_currency is null then raise exception 'El catálogo no está disponible.'; end if;
  if v_currency<>'COP' then raise exception 'El pago en línea del catálogo solo está disponible en COP. Elige pedidos por WhatsApp para otra moneda.'; end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_count:=v_count+1;
    if coalesce(v_item->>'product_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'Uno de los productos del pedido no es válido.'; end if;
    begin v_quantity:=(v_item->>'quantity')::numeric;
    exception when others then raise exception 'Una cantidad del pedido no es válida.'; end;
    if v_quantity is null or v_quantity<=0 or v_quantity>1000 or v_quantity<>round(v_quantity,3) then raise exception 'Las cantidades deben ser mayores que cero y tener máximo tres decimales.'; end if;

    select * into v_product from public.products p where p.id=(v_item->>'product_id')::uuid
      and p.business_id=p_business_id and p.is_published=true and p.is_sellable=true and p.archived_at is null for share;
    if not found then raise exception 'Un producto ya no está disponible para la venta.'; end if;

    v_product_key:=v_product.id::text;
    v_accumulated_quantity:=coalesce((v_seen_quantities->>v_product_key)::numeric,0)+v_quantity;
    if v_product.track_inventory and v_product.stock_on_hand<v_accumulated_quantity then raise exception 'No hay existencias suficientes de % para la cantidad solicitada.',v_product.name; end if;
    v_seen_quantities:=jsonb_set(v_seen_quantities,array[v_product_key],to_jsonb(v_accumulated_quantity),true);

    v_line_base:=round(v_product.sale_price_minor*v_quantity)::bigint;
    v_tax_code:=coalesce(v_product.metadata->>'tax_code','none');
    v_tax_rate:=case v_tax_code when 'iva_19' then 19 when 'iva_5' then 5 when 'impoconsumo_8' then 8 else 0 end;
    if v_tax_rate>0 and v_prices_include_vat then
      v_line_tax:=round(v_line_base::numeric*v_tax_rate/(100+v_tax_rate))::bigint;
      v_line_net:=v_line_base-v_line_tax;
      v_line_total:=v_line_base;
    else
      v_line_net:=v_line_base;
      v_line_tax:=round(v_line_base::numeric*v_tax_rate/100)::bigint;
      v_line_total:=v_line_net+v_line_tax;
    end if;
    v_subtotal:=v_subtotal+v_line_net;
    v_tax_total:=v_tax_total+v_line_tax;
  end loop;

  if v_subtotal+v_tax_total<=0 then raise exception 'El pedido debe tener un total mayor que cero para pagar en línea.'; end if;

  v_code:=upper(btrim(coalesce(p_coupon_code,'')));
  if v_code<>'' then
    perform pg_advisory_xact_lock(hashtextextended(p_business_id::text||':'||v_code,0));
    select * into v_coupon from public.business_coupons c
    where c.business_id=p_business_id and upper(c.code)=v_code and c.is_active=true
      and (c.starts_at is null or c.starts_at<=now()) and (c.ends_at is null or c.ends_at>=now())
      and (c.usage_limit is null or c.usage_count+(
        select count(*) from public.public_store_orders o where o.coupon_id=c.id and o.payment_status='pending' and o.created_at>now()-interval '24 hours'
      )<c.usage_limit) for update;
    if not found then raise exception 'El cupón no existe, está vencido o ya alcanzó su límite.'; end if;
    if v_subtotal<v_coupon.minimum_subtotal_minor then raise exception 'El pedido no alcanza el mínimo requerido para este cupón.'; end if;
    if v_coupon.discount_type='percentage' then v_discount:=floor(v_subtotal*v_coupon.discount_value/100.0)::bigint; else v_discount:=v_coupon.discount_value; end if;
    if v_coupon.maximum_discount_minor is not null then v_discount:=least(v_discount,v_coupon.maximum_discount_minor); end if;
    v_discount:=least(v_subtotal,greatest(0,v_discount));
    if v_discount>=v_subtotal then raise exception 'El cupón debe dejar un saldo por pagar.'; end if;
  end if;

  v_order_id:=gen_random_uuid();
  v_token:=gen_random_uuid();
  v_reference:='T31-'||upper(replace(v_order_id::text,'-',''));

  insert into public.public_store_orders(
    id,business_id,order_reference,checkout_token,customer_name,customer_phone,
    customer_email,customer_address,customer_notes,currency_code,subtotal_minor,tax_minor,
    total_minor,coupon_id,coupon_code,discount_minor
  ) values (
    v_order_id,p_business_id,v_reference,v_token,btrim(p_customer_name),btrim(p_customer_phone),
    nullif(btrim(coalesce(p_customer_email,'')),''),nullif(btrim(coalesce(p_customer_address,'')),''),
    nullif(btrim(coalesce(p_customer_notes,'')),''),v_currency,v_subtotal,v_tax_total,
    greatest(0,v_subtotal+v_tax_total-v_discount),case when v_code='' then null else v_coupon.id end,
    case when v_code='' then null else v_coupon.code end,v_discount
  );

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_quantity:=(v_item->>'quantity')::numeric;
    select * into v_product from public.products p where p.id=(v_item->>'product_id')::uuid and p.business_id=p_business_id;
    v_line_base:=round(v_product.sale_price_minor*v_quantity)::bigint;
    v_tax_code:=coalesce(v_product.metadata->>'tax_code','none');
    v_tax_rate:=case v_tax_code when 'iva_19' then 19 when 'iva_5' then 5 when 'impoconsumo_8' then 8 else 0 end;
    if v_tax_rate>0 and v_prices_include_vat then
      v_line_tax:=round(v_line_base::numeric*v_tax_rate/(100+v_tax_rate))::bigint;
      v_line_total:=v_line_base;
    else
      v_line_tax:=round(v_line_base::numeric*v_tax_rate/100)::bigint;
      v_line_total:=v_line_base+v_line_tax;
    end if;
    insert into public.public_store_order_items(order_id,business_id,product_id,item_name,quantity,unit_price_minor,line_total_minor,tax_minor,tax_code,tax_rate)
    values(v_order_id,p_business_id,v_product.id,v_product.name,v_quantity,v_product.sale_price_minor,v_line_total,v_line_tax,v_tax_code,v_tax_rate);
  end loop;

  return jsonb_build_object(
    'order_id',v_order_id,'order_reference',v_reference,'checkout_token',v_token,
    'subtotal_minor',v_subtotal,'tax_minor',v_tax_total,'discount_minor',v_discount,
    'total_minor',greatest(0,v_subtotal+v_tax_total-v_discount),
    'coupon_code',case when v_code='' then null else v_coupon.code end,
    'currency_code',v_currency,'payment_status','pending'
  );
end;
$function$;
revoke all on function public.create_public_store_order(uuid,text,text,text,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.create_public_store_order(uuid,text,text,text,text,text,jsonb,text) to service_role;

create or replace function public.confirm_public_store_order_payment(
 p_order_reference text,p_transaction_id text,p_amount_minor bigint,p_currency_code text,p_provider_status text
) returns jsonb language plpgsql security definer set search_path to 'public','private','pg_temp' as $function$
declare
 v_order public.public_store_orders%rowtype;
 v_item record;
 v_product public.products%rowtype;
 v_customer_id uuid;
 v_sale_id uuid;
 v_sale_number text;
 v_total bigint;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Operación reservada al servicio de pagos.'; end if;
 select * into v_order from public.public_store_orders where order_reference=p_order_reference for update;
 if not found then return jsonb_build_object('status','not_found'); end if;
 if v_order.payment_status='approved' then return jsonb_build_object('status','approved','sale_id',v_order.sale_id); end if;
 if v_order.payment_status<>'pending' then return jsonb_build_object('status',v_order.payment_status); end if;
 if p_provider_status<>'APPROVED' or p_amount_minor<>v_order.total_minor or p_currency_code<>v_order.currency_code or coalesce(p_transaction_id,'')='' then raise exception 'La transacción no coincide con el pedido.'; end if;

 for v_item in select i.product_id,sum(i.quantity) quantity from public.public_store_order_items i
   where i.order_id=v_order.id and i.product_id is not null group by i.product_id order by i.product_id loop
   select * into v_product from public.products p where p.id=v_item.product_id and p.business_id=v_order.business_id for update;
   if not found or not coalesce(v_product.is_sellable,false) or v_product.archived_at is not null
     or (v_product.track_inventory and v_product.stock_on_hand<v_item.quantity) then
     update public.public_store_orders set payment_status='review',provider_transaction_id=p_transaction_id,provider_status=p_provider_status,updated_at=now() where id=v_order.id;
     return jsonb_build_object('status','review','reason','inventory_changed');
   end if;
 end loop;

 select c.id into v_customer_id from public.customers c
 where c.business_id=v_order.business_id and c.phone=v_order.customer_phone order by c.created_at asc limit 1;
 if v_customer_id is null then
   insert into public.customers(business_id,full_name,email,phone,whatsapp,address,notes)
   values(v_order.business_id,v_order.customer_name,v_order.customer_email,v_order.customer_phone,v_order.customer_phone,v_order.customer_address,
     case when v_order.customer_notes is null then 'Cliente de catálogo público' else 'Pedido web: '||v_order.customer_notes end)
   returning id into v_customer_id;
 end if;

 v_sale_id:=gen_random_uuid();
 v_sale_number:='WEB-'||to_char(now() at time zone coalesce((select nullif(b.timezone,'') from public.businesses b where b.id=v_order.business_id),'America/Bogota'),'YYYYMMDD')
   ||'-'||upper(substr(replace(v_sale_id::text,'-',''),1,8));
 v_total:=v_order.total_minor;

 insert into public.sales(id,business_id,customer_id,sale_number,status,currency_code,subtotal_minor,discount_minor,tax_minor,total_minor,amount_paid_minor,notes,sold_at,created_by)
 values(v_sale_id,v_order.business_id,v_customer_id,v_sale_number,'paid'::public.document_status,v_order.currency_code,
   v_order.subtotal_minor,v_order.discount_minor,v_order.tax_minor,v_total,v_total,
   'Pedido de catálogo público '||v_order.order_reference||' · Pago Wompi verificado'||case when v_order.coupon_code is not null then ' · Cupón '||v_order.coupon_code else '' end,now(),null);

 insert into public.sale_payments(business_id,sale_id,amount_minor,payment_method,paid_at,notes,created_by)
 values(v_order.business_id,v_sale_id,v_total,'Otro',now(),'Wompi · transacción verificada '||p_transaction_id,null);

 for v_item in
   select i.product_id,i.item_name,i.quantity,i.unit_price_minor,i.line_total_minor,i.tax_minor,p.sku,p.cost_price_minor,p.track_inventory
   from public.public_store_order_items i left join public.products p on p.id=i.product_id and p.business_id=i.business_id
   where i.order_id=v_order.id order by i.id loop
   insert into public.sale_items(business_id,sale_id,product_id,item_name,sku_snapshot,quantity,unit_price_minor,unit_cost_minor,discount_minor,tax_minor,line_total_minor)
   values(v_order.business_id,v_sale_id,v_item.product_id,v_item.item_name,v_item.sku,v_item.quantity,v_item.unit_price_minor,
     coalesce(v_item.cost_price_minor,0),0,v_item.tax_minor,v_item.line_total_minor);
   if v_item.product_id is not null and coalesce(v_item.track_inventory,false) then
     update public.products set stock_on_hand=stock_on_hand-v_item.quantity,updated_at=now() where id=v_item.product_id and business_id=v_order.business_id;
     insert into public.stock_movements(business_id,product_id,movement_type,quantity_delta,reference_type,reference_id,idempotency_key,notes,created_by)
     values(v_order.business_id,v_item.product_id,'sale',-v_item.quantity,'sale',v_sale_id,'public-order:'||v_order.id::text||':'||v_item.product_id::text,
       'Salida por pedido público '||v_order.order_reference,null) on conflict(business_id,idempotency_key) do nothing;
   end if;
 end loop;

 if v_order.coupon_id is not null then update public.business_coupons set usage_count=usage_count+1,updated_at=now() where id=v_order.coupon_id and business_id=v_order.business_id; end if;
 update public.public_store_orders set payment_status='approved',provider_transaction_id=p_transaction_id,provider_status=p_provider_status,paid_at=now(),sale_id=v_sale_id,updated_at=now() where id=v_order.id;
 return jsonb_build_object('status','approved','sale_id',v_sale_id,'sale_number',v_sale_number);
end;$function$;
revoke all on function public.confirm_public_store_order_payment(text,text,bigint,text,text) from public,anon,authenticated;
grant execute on function public.confirm_public_store_order_payment(text,text,bigint,text,text) to service_role;
