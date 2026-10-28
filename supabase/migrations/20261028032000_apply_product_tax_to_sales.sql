-- Apply each product's stored tax code to manual sales while preserving inclusive/exclusive price mode.
create or replace function public.create_sale(
  p_business_id uuid,
  p_customer_id uuid default null,
  p_items jsonb default '[]'::jsonb,
  p_amount_paid_minor bigint default 0,
  p_notes text default null,
  p_initial_payment_method text default 'No especificado'
) returns jsonb
language plpgsql
security definer
set search_path to 'public','private'
as $function$
declare
  v_item jsonb;
  v_line record;
  v_product public.products%rowtype;
  v_lines jsonb := '[]'::jsonb;
  v_line_subtotal bigint;
  v_line_tax bigint;
  v_line_total bigint;
  v_subtotal bigint := 0;
  v_tax_total bigint := 0;
  v_total bigint := 0;
  v_tax_code text;
  v_tax_rate numeric := 0;
  v_prices_include_vat boolean := false;
  v_sale_id uuid := gen_random_uuid();
  v_sale_number text;
  v_status public.document_status;
  v_paid bigint := coalesce(p_amount_paid_minor,0);
  v_count integer;
  v_distinct_count integer;
begin
  if coalesce(p_initial_payment_method,'No especificado') not in ('Efectivo','Transferencia','Tarjeta','Otro','No especificado') then
    raise exception 'La forma de pago inicial no es válida.';
  end if;
  if auth.uid() is null or not private.can_access_business(p_business_id,'sales_manage') then
    raise exception 'No tienes permiso para registrar ventas en este negocio.';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' then raise exception 'La lista de artículos no tiene un formato válido.'; end if;
  if jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>50 then raise exception 'Añade entre 1 y 50 artículos a la venta.'; end if;
  if v_paid<0 then raise exception 'El abono no puede ser negativo.'; end if;
  if p_customer_id is not null and not exists(select 1 from public.customers c where c.id=p_customer_id and c.business_id=p_business_id) then
    raise exception 'El cliente seleccionado no pertenece a este negocio.';
  end if;
  select coalesce((b.settings #>> '{tax_profile,pricesIncludeVat}')::boolean,false)
    into v_prices_include_vat from public.businesses b where b.id=p_business_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if coalesce(v_item->>'product_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'Hay un artículo sin producto válido.';
    end if;
    if coalesce(v_item->>'quantity','') !~ '^[0-9]+(\.[0-9]{1,3})?$' or (v_item->>'quantity')::numeric<=0 then
      raise exception 'Cada cantidad debe ser mayor que cero y tener máximo tres decimales.';
    end if;
  end loop;

  perform p.id from public.products p
    join (select distinct (item->>'product_id')::uuid as product_id from jsonb_array_elements(p_items) as item) requested on requested.product_id=p.id
    where p.business_id=p_business_id order by p.id for update of p;

  select count(*) into v_count from
    (select distinct (item->>'product_id')::uuid as product_id from jsonb_array_elements(p_items) as item) requested
    join public.products p on p.id=requested.product_id and p.business_id=p_business_id;
  select count(*) into v_distinct_count from
    (select distinct (item->>'product_id')::uuid as product_id from jsonb_array_elements(p_items) as item) requested;
  if v_count<>v_distinct_count then raise exception 'Uno de los productos no existe o pertenece a otro negocio.'; end if;

  for v_line in
    select (item->>'product_id')::uuid as product_id,sum((item->>'quantity')::numeric) as quantity
    from jsonb_array_elements(p_items) as item group by (item->>'product_id')::uuid order by (item->>'product_id')::uuid
  loop
    select * into v_product from public.products p where p.id=v_line.product_id and p.business_id=p_business_id for update;
    if not coalesce(v_product.is_sellable,false) or v_product.archived_at is not null then
      raise exception 'El producto "%" no está activo para la venta o está archivado.',v_product.name;
    end if;
    if v_product.track_inventory and v_line.quantity>v_product.stock_on_hand then
      raise exception 'No hay existencias suficientes de "%". Disponibles: %, solicitadas: %.',v_product.name,v_product.stock_on_hand,v_line.quantity;
    end if;

    v_tax_code := coalesce(v_product.metadata->>'tax_code','none');
    v_tax_rate := case v_tax_code
      when 'iva_19' then 19
      when 'iva_5' then 5
      when 'impoconsumo_8' then 8
      else 0
    end;
    v_line_subtotal := round(v_product.sale_price_minor*v_line.quantity)::bigint;
    if v_tax_rate>0 and v_prices_include_vat then
      v_line_tax := round(v_line_subtotal::numeric*v_tax_rate/(100+v_tax_rate))::bigint;
      v_line_total := v_line_subtotal;
      v_line_subtotal := v_line_total-v_line_tax;
    else
      v_line_tax := round(v_line_subtotal::numeric*v_tax_rate/100)::bigint;
      v_line_total := v_line_subtotal+v_line_tax;
    end if;
    v_subtotal := v_subtotal+v_line_subtotal;
    v_tax_total := v_tax_total+v_line_tax;
    v_total := v_total+v_line_total;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id',v_product.id,'name',v_product.name,'sku',v_product.sku,'quantity',v_line.quantity,
      'unit_price_minor',v_product.sale_price_minor,'unit_cost_minor',v_product.cost_price_minor,
      'subtotal_minor',v_line_subtotal,'tax_minor',v_line_tax,'tax_code',v_tax_code,'tax_rate',v_tax_rate,
      'line_total_minor',v_line_total,'track_inventory',v_product.track_inventory
    ));
  end loop;

  if v_paid>v_total then raise exception 'El abono no puede superar el total de la venta.'; end if;
  v_status := case when v_paid>=v_total then 'paid'::public.document_status when v_paid>0 then 'partially_paid'::public.document_status else 'pending'::public.document_status end;
  v_sale_number := 'VTA-' || to_char(now() at time zone coalesce((select nullif(b.timezone,'') from public.businesses b where b.id=p_business_id),'America/Bogota'),'YYYYMMDD')
    || '-' || upper(substr(replace(v_sale_id::text,'-',''),1,8));

  insert into public.sales(id,business_id,customer_id,sale_number,status,currency_code,subtotal_minor,discount_minor,tax_minor,total_minor,amount_paid_minor,notes,sold_at,created_by)
  values(v_sale_id,p_business_id,p_customer_id,v_sale_number,v_status,(select b.currency_code from public.businesses b where b.id=p_business_id),
    v_subtotal,0,v_tax_total,v_total,v_paid,nullif(btrim(p_notes),''),now(),auth.uid());

  if v_paid>0 then
    insert into public.sale_payments(business_id,sale_id,amount_minor,payment_method,paid_at,notes,created_by)
    values(p_business_id,v_sale_id,v_paid,coalesce(p_initial_payment_method,'No especificado'),now(),'Abono inicial al registrar la venta',auth.uid());
  end if;

  for v_item in select value from jsonb_array_elements(v_lines)
  loop
    insert into public.sale_items(business_id,sale_id,product_id,item_name,sku_snapshot,quantity,unit_price_minor,unit_cost_minor,discount_minor,tax_minor,line_total_minor)
    values(p_business_id,v_sale_id,(v_item->>'product_id')::uuid,v_item->>'name',v_item->>'sku',(v_item->>'quantity')::numeric,
      (v_item->>'unit_price_minor')::bigint,(v_item->>'unit_cost_minor')::bigint,0,(v_item->>'tax_minor')::bigint,(v_item->>'line_total_minor')::bigint);
    if (v_item->>'track_inventory')::boolean then
      update public.products set stock_on_hand=stock_on_hand-(v_item->>'quantity')::numeric,updated_at=now()
        where id=(v_item->>'product_id')::uuid and business_id=p_business_id;
      insert into public.stock_movements(business_id,product_id,movement_type,quantity_delta,reference_type,reference_id,idempotency_key,notes,created_by)
      values(p_business_id,(v_item->>'product_id')::uuid,'sale',-((v_item->>'quantity')::numeric),'sale',v_sale_id,
        'sale:'||v_sale_id::text||':'||(v_item->>'product_id'),'Salida por '||v_sale_number,auth.uid());
    end if;
  end loop;
  return jsonb_build_object('id',v_sale_id,'sale_number',v_sale_number,'subtotal_minor',v_subtotal,'tax_minor',v_tax_total,'total_minor',v_total,'amount_paid_minor',v_paid,'status',v_status);
end;
$function$;
revoke all on function public.create_sale(uuid,uuid,jsonb,bigint,text,text) from public,anon;
grant execute on function public.create_sale(uuid,uuid,jsonb,bigint,text,text) to authenticated;
