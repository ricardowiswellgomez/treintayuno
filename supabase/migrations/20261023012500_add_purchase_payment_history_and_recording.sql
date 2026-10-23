
create unique index if not exists purchases_id_business_id_unique on public.purchases (id, business_id);

create table if not exists public.purchase_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  purchase_id uuid not null,
  amount_minor bigint not null check (amount_minor > 0),
  payment_method text not null check (payment_method in ('Efectivo','Transferencia','Tarjeta','Otro','No especificado')),
  paid_at timestamptz not null default now(),
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  constraint purchase_payments_purchase_business_fk
    foreign key (purchase_id, business_id)
    references public.purchases (id, business_id) on delete cascade
);

create index if not exists purchase_payments_business_purchase_paid_at_idx
  on public.purchase_payments (business_id, purchase_id, paid_at desc);

alter table public.purchase_payments enable row level security;
drop policy if exists purchase_payments_select_by_permission on public.purchase_payments;
create policy purchase_payments_select_by_permission
  on public.purchase_payments for select to authenticated
  using (private.can_access_business(business_id, 'purchases_view'));
grant select on public.purchase_payments to authenticated;

insert into public.purchase_payments(business_id,purchase_id,amount_minor,payment_method,paid_at,notes,created_by)
select p.business_id,p.id,p.amount_paid_minor,'No especificado',coalesce(p.purchased_at,p.created_at),
  'Abono inicial registrado antes del historial detallado de pagos',p.created_by
from public.purchases p
where p.amount_paid_minor > 0
and not exists (select 1 from public.purchase_payments pp where pp.purchase_id=p.id and pp.business_id=p.business_id);

drop function public.create_purchase(uuid,uuid,text,timestamptz,bigint,bigint,jsonb);

CREATE OR REPLACE FUNCTION public.create_purchase(p_business_id uuid, p_supplier_id uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text, p_purchased_at timestamp with time zone DEFAULT now(), p_tax_minor bigint DEFAULT 0, p_amount_paid_minor bigint DEFAULT 0, p_items jsonb DEFAULT '[]'::jsonb, p_initial_payment_method text DEFAULT 'No especificado'::text)
 RETURNS uuid
 LANGUAGE plpgsql
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
      select p.name, p.track_inventory into v_product_name, v_track_inventory
      from public.products p
      where p.id = v_product_id and p.business_id = p_business_id
      for update;
      if not found then
        raise exception 'Un producto de la compra no pertenece a este negocio.';
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
      select p.name, p.track_inventory into v_product_name, v_track_inventory
      from public.products p
      where p.id = v_product_id and p.business_id = p_business_id
      for update;
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

create or replace function public.record_purchase_payment(
  p_business_id uuid,
  p_purchase_id uuid,
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
  v_purchase public.purchases%ROWTYPE;
  v_new_paid bigint;
  v_balance bigint;
  v_status public.document_status;
  v_payment_id uuid;
begin
  if auth.uid() is null or not private.can_access_business(p_business_id, 'purchases_manage') then
    raise exception 'No tienes permiso para registrar abonos de compras en este negocio.';
  end if;
  if p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'El abono debe ser mayor que cero.';
  end if;
  if p_payment_method not in ('Efectivo','Transferencia','Tarjeta','Otro') then
    raise exception 'Selecciona una forma de pago válida.';
  end if;
  if p_paid_at is not null and p_paid_at > now() + interval '5 minutes' then
    raise exception 'La fecha del pago no puede estar en el futuro.';
  end if;
  select * into v_purchase
  from public.purchases p
  where p.id=p_purchase_id and p.business_id=p_business_id
  for update;
  if not found then raise exception 'No se encontró la compra en este negocio.'; end if;
  if v_purchase.status in ('canceled'::public.document_status,'refunded'::public.document_status,'draft'::public.document_status) then
    raise exception 'No se pueden registrar pagos en una compra anulada, devuelta o en borrador.';
  end if;
  v_balance := v_purchase.total_minor - v_purchase.amount_paid_minor;
  if v_balance <= 0 then raise exception 'Esta compra ya está completamente pagada.'; end if;
  if p_amount_minor > v_balance then raise exception 'El pago supera el saldo pendiente de la compra.'; end if;
  v_new_paid := v_purchase.amount_paid_minor + p_amount_minor;
  v_status := case
    when v_new_paid >= v_purchase.total_minor then 'paid'::public.document_status
    when v_new_paid > 0 then 'partially_paid'::public.document_status
    else 'pending'::public.document_status
  end;
  insert into public.purchase_payments(business_id,purchase_id,amount_minor,payment_method,paid_at,notes,created_by)
  values(p_business_id,p_purchase_id,p_amount_minor,p_payment_method,coalesce(p_paid_at,now()),nullif(btrim(p_notes),''),auth.uid())
  returning id into v_payment_id;
  update public.purchases set amount_paid_minor=v_new_paid,status=v_status,updated_at=now()
  where id=p_purchase_id and business_id=p_business_id;
  return jsonb_build_object('payment_id',v_payment_id,'purchase_id',p_purchase_id,'amount_paid_minor',v_new_paid,
    'balance_minor',v_purchase.total_minor-v_new_paid,'status',v_status);
end;
$function$;

revoke all on function public.create_purchase(uuid,uuid,text,timestamptz,bigint,bigint,jsonb,text) from public, anon;
grant execute on function public.create_purchase(uuid,uuid,text,timestamptz,bigint,bigint,jsonb,text) to authenticated;
revoke all on function public.record_purchase_payment(uuid,uuid,bigint,text,timestamptz,text) from public, anon;
grant execute on function public.record_purchase_payment(uuid,uuid,bigint,text,timestamptz,text) to authenticated;

notify pgrst, 'reload schema';
