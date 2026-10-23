create or replace function public.create_purchase(
  p_business_id uuid,
  p_supplier_id uuid default null,
  p_notes text default null,
  p_purchased_at timestamptz default now(),
  p_tax_minor bigint default 0,
  p_amount_paid_minor bigint default 0,
  p_items jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
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
$$;

revoke all on function public.create_purchase(uuid,uuid,text,timestamptz,bigint,bigint,jsonb) from public, anon;
grant execute on function public.create_purchase(uuid,uuid,text,timestamptz,bigint,bigint,jsonb) to authenticated;
