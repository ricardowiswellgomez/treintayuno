
create unique index if not exists sales_id_business_id_unique on public.sales (id, business_id);

create table if not exists public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  sale_id uuid not null,
  amount_minor bigint not null check (amount_minor > 0),
  payment_method text not null check (payment_method in ('Efectivo','Transferencia','Tarjeta','Otro','No especificado')),
  paid_at timestamptz not null default now(),
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  constraint sale_payments_sale_business_fk
    foreign key (sale_id, business_id)
    references public.sales (id, business_id) on delete cascade
);

create index if not exists sale_payments_business_sale_paid_at_idx
  on public.sale_payments (business_id, sale_id, paid_at desc);

alter table public.sale_payments enable row level security;
drop policy if exists sale_payments_select_by_permission on public.sale_payments;
create policy sale_payments_select_by_permission
  on public.sale_payments for select to authenticated
  using (private.can_access_business(business_id, 'sales_view'));
grant select on public.sale_payments to authenticated;

insert into public.sale_payments(business_id,sale_id,amount_minor,payment_method,paid_at,notes,created_by)
select s.business_id,s.id,s.amount_paid_minor,'No especificado',coalesce(s.sold_at,s.created_at),
  'Abono inicial registrado antes del historial detallado de pagos',s.created_by
from public.sales s
where s.amount_paid_minor > 0
and not exists (select 1 from public.sale_payments p where p.sale_id=s.id and p.business_id=s.business_id);

drop function public.create_sale(uuid,uuid,jsonb,bigint,text);

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

create or replace function public.record_sale_payment(
  p_business_id uuid,
  p_sale_id uuid,
  p_amount_minor bigint,
  p_payment_method text,
  p_paid_at timestamptz default now(),
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $function$
declare
  v_sale public.sales%ROWTYPE;
  v_new_paid bigint;
  v_balance bigint;
  v_status public.document_status;
  v_payment_id uuid;
begin
  if auth.uid() is null or not private.can_access_business(p_business_id, 'sales_manage') then
    raise exception 'No tienes permiso para registrar abonos en este negocio.';
  end if;
  if p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'El abono debe ser mayor que cero.';
  end if;
  if p_payment_method not in ('Efectivo','Transferencia','Tarjeta','Otro') then
    raise exception 'Selecciona una forma de pago válida.';
  end if;
  if p_paid_at is not null and p_paid_at > now() + interval '5 minutes' then
    raise exception 'La fecha del abono no puede estar en el futuro.';
  end if;
  select * into v_sale
  from public.sales s
  where s.id=p_sale_id and s.business_id=p_business_id
  for update;
  if not found then raise exception 'No se encontró la venta en este negocio.'; end if;
  if v_sale.status in ('canceled'::public.document_status,'refunded'::public.document_status,'draft'::public.document_status) then
    raise exception 'No se pueden registrar abonos en una venta anulada, devuelta o en borrador.';
  end if;
  v_balance := v_sale.total_minor - v_sale.amount_paid_minor;
  if v_balance <= 0 then raise exception 'Esta venta ya está completamente pagada.'; end if;
  if p_amount_minor > v_balance then raise exception 'El abono supera el saldo pendiente de la venta.'; end if;
  v_new_paid := v_sale.amount_paid_minor + p_amount_minor;
  v_status := case
    when v_new_paid >= v_sale.total_minor then 'paid'::public.document_status
    when v_new_paid > 0 then 'partially_paid'::public.document_status
    else 'pending'::public.document_status
  end;
  insert into public.sale_payments(business_id,sale_id,amount_minor,payment_method,paid_at,notes,created_by)
  values(p_business_id,p_sale_id,p_amount_minor,p_payment_method,coalesce(p_paid_at,now()),nullif(btrim(p_notes),''),auth.uid())
  returning id into v_payment_id;
  update public.sales set amount_paid_minor=v_new_paid,status=v_status,updated_at=now()
  where id=p_sale_id and business_id=p_business_id;
  return jsonb_build_object('payment_id',v_payment_id,'sale_id',p_sale_id,'amount_paid_minor',v_new_paid,
    'balance_minor',v_sale.total_minor-v_new_paid,'status',v_status);
end;
$function$;

revoke all on function public.create_sale(uuid,uuid,jsonb,bigint,text,text) from public, anon;
grant execute on function public.create_sale(uuid,uuid,jsonb,bigint,text,text) to authenticated;
revoke all on function public.record_sale_payment(uuid,uuid,bigint,text,timestamptz,text) from public, anon;
grant execute on function public.record_sale_payment(uuid,uuid,bigint,text,timestamptz,text) to authenticated;

notify pgrst, 'reload schema';
