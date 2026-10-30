
-- Bancos: cuentas, movimientos, transferencias y vínculo automático con pagos existentes.
create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  bank_name text not null check (char_length(trim(bank_name)) between 1 and 120),
  account_name text not null check (char_length(trim(account_name)) between 1 and 120),
  account_type text not null check (account_type in ('savings','checking','wallet','other')),
  account_last4 text,
  account_holder text,
  currency_code character(3) not null,
  opening_balance_minor bigint not null default 0,
  opening_balance_date date not null default (now() at time zone 'America/Bogota')::date,
  notes text,
  is_active boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bank_accounts_last4_check check (account_last4 is null or account_last4 ~ '^[0-9]{4}$'),
  constraint bank_accounts_id_business_unique unique (id, business_id)
);

create table if not exists public.bank_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  bank_account_id uuid not null,
  movement_type text not null check (movement_type in ('income','expense','transfer_in','transfer_out','adjustment_in','adjustment_out')),
  amount_minor bigint not null check (amount_minor > 0),
  movement_date date not null,
  description text not null check (char_length(trim(description)) between 1 and 220),
  category text,
  counterparty text,
  reference text,
  notes text,
  source_type text,
  source_id uuid,
  transfer_id uuid,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bank_movements_account_business_fk
    foreign key (bank_account_id, business_id) references public.bank_accounts(id, business_id) on delete restrict,
  constraint bank_movements_source_type_check
    check (source_type is null or source_type in ('sale_payment','purchase_payment','expense')),
  constraint bank_movements_source_pair_check
    check ((source_type is null and source_id is null) or (source_type is not null and source_id is not null)),
  constraint bank_movements_transfer_source_check
    check (not (transfer_id is not null and source_type is not null))
);

create unique index if not exists bank_movements_source_unique
  on public.bank_movements(source_type, source_id) where source_type is not null;
create index if not exists bank_accounts_business_active_idx
  on public.bank_accounts(business_id, is_active, bank_name, account_name);
create index if not exists bank_movements_business_date_idx
  on public.bank_movements(business_id, movement_date desc, created_at desc);
create index if not exists bank_movements_account_date_idx
  on public.bank_movements(bank_account_id, movement_date desc, created_at desc);
create index if not exists bank_movements_transfer_idx
  on public.bank_movements(transfer_id) where transfer_id is not null;

alter table public.sale_payments add column if not exists bank_account_id uuid;
alter table public.purchase_payments add column if not exists bank_account_id uuid;
alter table public.expenses add column if not exists bank_account_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='sale_payments_bank_account_business_fk') then
    alter table public.sale_payments add constraint sale_payments_bank_account_business_fk
      foreign key (bank_account_id, business_id) references public.bank_accounts(id, business_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='purchase_payments_bank_account_business_fk') then
    alter table public.purchase_payments add constraint purchase_payments_bank_account_business_fk
      foreign key (bank_account_id, business_id) references public.bank_accounts(id, business_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='expenses_bank_account_business_fk') then
    alter table public.expenses add constraint expenses_bank_account_business_fk
      foreign key (bank_account_id, business_id) references public.bank_accounts(id, business_id) on delete restrict;
  end if;
end $$;

alter table public.bank_accounts enable row level security;
alter table public.bank_movements enable row level security;

revoke all on public.bank_accounts from anon;
revoke all on public.bank_movements from anon;
grant select, insert on public.bank_accounts to authenticated;
revoke update on public.bank_accounts from authenticated;
grant update (bank_name, account_name, account_type, account_last4, account_holder, notes, is_active, updated_at)
  on public.bank_accounts to authenticated;
grant select, insert on public.bank_movements to authenticated;

drop policy if exists bank_accounts_select_managers on public.bank_accounts;
create policy bank_accounts_select_managers on public.bank_accounts for select to authenticated
  using ((select private.can_manage_members(business_id)));
drop policy if exists bank_accounts_insert_managers on public.bank_accounts;
create policy bank_accounts_insert_managers on public.bank_accounts for insert to authenticated
  with check (
    (select private.can_manage_members(bank_accounts.business_id))
    and bank_accounts.created_by = (select auth.uid())
    and bank_accounts.opening_balance_date <= (now() at time zone 'America/Bogota')::date
    and bank_accounts.currency_code = (
      select b.currency_code from public.businesses b where b.id = bank_accounts.business_id
    )
  );
drop policy if exists bank_accounts_update_managers on public.bank_accounts;
create policy bank_accounts_update_managers on public.bank_accounts for update to authenticated
  using ((select private.can_manage_members(business_id)))
  with check ((select private.can_manage_members(business_id)));

drop policy if exists bank_movements_select_managers on public.bank_movements;
create policy bank_movements_select_managers on public.bank_movements for select to authenticated
  using ((select private.can_manage_members(business_id)));
drop policy if exists bank_movements_insert_manual on public.bank_movements;
create policy bank_movements_insert_manual on public.bank_movements for insert to authenticated
  with check (
    (select private.can_manage_members(bank_movements.business_id))
    and created_by = (select auth.uid())
    and source_type is null and source_id is null and transfer_id is null
    and movement_type in ('income','expense','adjustment_in','adjustment_out')
    and movement_date <= (now() at time zone 'America/Bogota')::date
    and exists (
      select 1 from public.bank_accounts a
      where a.id = bank_movements.bank_account_id
        and a.business_id = bank_movements.business_id
        and a.is_active
        and a.currency_code = (select b.currency_code from public.businesses b where b.id = bank_movements.business_id)
        and bank_movements.movement_date >= a.opening_balance_date
    )
  );

create or replace function private.block_business_currency_change_with_bank_accounts()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $function$
begin
  if new.currency_code is distinct from old.currency_code
     and exists (select 1 from public.bank_accounts a where a.business_id = old.id) then
    raise exception 'No puedes cambiar la moneda mientras el negocio tenga cuentas bancarias registradas. Desactiva o concilia esas cuentas y solicita la conversión.';
  end if;
  return new;
end;
$function$;

drop trigger if exists block_business_currency_change_with_bank_accounts on public.businesses;
create trigger block_business_currency_change_with_bank_accounts
  before update of currency_code on public.businesses
  for each row execute function private.block_business_currency_change_with_bank_accounts();

create or replace function private.sync_bank_movement_from_source()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public, private, auth
as $function$
declare
  v_source_type text;
  v_source_id uuid;
  v_business_id uuid;
  v_bank_account_id uuid;
  v_amount_minor bigint;
  v_movement_date date;
  v_description text;
  v_category text;
  v_notes text;
  v_created_by uuid;
  v_currency_code character(3);
  v_account_currency character(3);
  v_account_opening_date date;
begin
  v_source_type := case tg_table_name
    when 'sale_payments' then 'sale_payment'
    when 'purchase_payments' then 'purchase_payment'
    when 'expenses' then 'expense'
    else null end;
  if v_source_type is null then raise exception 'Origen bancario no soportado.'; end if;

  if tg_op = 'DELETE' then
    delete from public.bank_movements
    where source_type = v_source_type and source_id = old.id and business_id = old.business_id;
    return old;
  end if;

  v_source_id := new.id;
  v_business_id := new.business_id;
  v_bank_account_id := new.bank_account_id;
  v_amount_minor := new.amount_minor;
  v_created_by := new.created_by;

  if tg_table_name = 'sale_payments' then
    v_movement_date := (new.paid_at at time zone 'America/Bogota')::date;
    v_category := 'Ventas'; v_notes := new.notes;
    select 'Abono de venta · ' || coalesce(s.sale_number, 'Venta') into v_description
      from public.sales s where s.id = new.sale_id and s.business_id = new.business_id;
  elsif tg_table_name = 'purchase_payments' then
    v_movement_date := (new.paid_at at time zone 'America/Bogota')::date;
    v_category := 'Compras'; v_notes := new.notes;
    select 'Pago de compra · ' || coalesce(p.purchase_number, 'Compra') into v_description
      from public.purchases p where p.id = new.purchase_id and p.business_id = new.business_id;
  else
    v_movement_date := new.expense_date;
    v_category := coalesce(nullif(trim(new.category), ''), 'Gastos');
    v_description := new.description; v_notes := new.notes;
  end if;

  if v_bank_account_id is null then
    delete from public.bank_movements
    where source_type = v_source_type and source_id = v_source_id and business_id = v_business_id;
    return new;
  end if;

  if not (select private.can_manage_members(v_business_id)) then
    raise exception 'Solo propietarios y administradores pueden asociar movimientos a cuentas bancarias.';
  end if;

  select a.currency_code, a.opening_balance_date into v_account_currency, v_account_opening_date
    from public.bank_accounts a
    where a.id = v_bank_account_id and a.business_id = v_business_id and a.is_active;
  if not found then raise exception 'La cuenta bancaria no pertenece a este negocio o está inactiva.'; end if;

  select b.currency_code into v_currency_code from public.businesses b where b.id = v_business_id;
  if v_account_currency is distinct from v_currency_code then
    raise exception 'La cuenta bancaria tiene una moneda distinta a la moneda actual del negocio.';
  end if;
  if v_movement_date < v_account_opening_date then
    raise exception 'La fecha del movimiento es anterior a la fecha del saldo inicial de la cuenta.';
  end if;
  if v_movement_date > (now() at time zone 'America/Bogota')::date then
    raise exception 'La fecha del movimiento bancario no puede estar en el futuro.';
  end if;

  insert into public.bank_movements (
    business_id, bank_account_id, movement_type, amount_minor, movement_date,
    description, category, reference, notes, source_type, source_id, created_by
  ) values (
    v_business_id, v_bank_account_id,
    case when v_source_type = 'sale_payment' then 'income' else 'expense' end,
    v_amount_minor, v_movement_date,
    coalesce(nullif(trim(v_description), ''), 'Movimiento vinculado'),
    v_category, null, v_notes, v_source_type, v_source_id, coalesce(v_created_by, auth.uid())
  )
  on conflict (source_type, source_id) where source_type is not null
  do update set bank_account_id=excluded.bank_account_id, amount_minor=excluded.amount_minor,
    movement_date=excluded.movement_date, description=excluded.description, category=excluded.category,
    notes=excluded.notes, updated_at=now();

  return new;
end;
$function$;

drop trigger if exists sync_bank_movement_sale_payment on public.sale_payments;
create trigger sync_bank_movement_sale_payment after insert or update or delete on public.sale_payments
  for each row execute function private.sync_bank_movement_from_source();
drop trigger if exists sync_bank_movement_purchase_payment on public.purchase_payments;
create trigger sync_bank_movement_purchase_payment after insert or update or delete on public.purchase_payments
  for each row execute function private.sync_bank_movement_from_source();
drop trigger if exists sync_bank_movement_expense on public.expenses;
create trigger sync_bank_movement_expense after insert or update or delete on public.expenses
  for each row execute function private.sync_bank_movement_from_source();

create or replace function public.bank_dashboard(p_business_id uuid, p_limit integer default 100, p_offset integer default 0)
returns jsonb language plpgsql stable security definer
set search_path = pg_catalog, public, private
as $function$
declare
  v_month_start date := date_trunc('month', now() at time zone 'America/Bogota')::date;
  v_today date := (now() at time zone 'America/Bogota')::date;
  v_limit integer := greatest(1, least(coalesce(p_limit, 100), 200));
  v_offset integer := greatest(0, coalesce(p_offset, 0));
  v_result jsonb;
begin
  if auth.uid() is null or not private.can_manage_members(p_business_id) then
    raise exception 'Solo propietarios y administradores pueden consultar las cuentas bancarias.';
  end if;
  select jsonb_build_object(
    'accounts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',a.id,'bank_name',a.bank_name,'account_name',a.account_name,'account_type',a.account_type,
        'account_last4',a.account_last4,'account_holder',a.account_holder,'currency_code',a.currency_code,
        'opening_balance_minor',a.opening_balance_minor,'opening_balance_date',a.opening_balance_date,
        'notes',a.notes,'is_active',a.is_active,
        'balance_minor',a.opening_balance_minor + coalesce((
          select sum(case when m.movement_type in ('income','transfer_in','adjustment_in') then m.amount_minor
                          when m.movement_type in ('expense','transfer_out','adjustment_out') then -m.amount_minor else 0 end)
          from public.bank_movements m where m.business_id=a.business_id and m.bank_account_id=a.id
            and m.movement_date >= a.opening_balance_date
        ),0)
      ) order by a.is_active desc,a.bank_name,a.account_name)
      from public.bank_accounts a where a.business_id=p_business_id
    ),'[]'::jsonb),
    'summary',jsonb_build_object(
      'account_count',(select count(*) from public.bank_accounts a where a.business_id=p_business_id and a.is_active),
      'balance_minor',coalesce((
        select sum(a.opening_balance_minor + coalesce((
          select sum(case when m.movement_type in ('income','transfer_in','adjustment_in') then m.amount_minor
                          when m.movement_type in ('expense','transfer_out','adjustment_out') then -m.amount_minor else 0 end)
          from public.bank_movements m where m.business_id=a.business_id and m.bank_account_id=a.id
            and m.movement_date >= a.opening_balance_date
        ),0)) from public.bank_accounts a where a.business_id=p_business_id and a.is_active
      ),0),
      'income_month_minor',coalesce((
        select sum(m.amount_minor) from public.bank_movements m where m.business_id=p_business_id
          and m.movement_type='income' and m.movement_date between v_month_start and v_today
      ),0),
      'expenses_month_minor',coalesce((
        select sum(m.amount_minor) from public.bank_movements m where m.business_id=p_business_id
          and m.movement_type='expense' and m.movement_date between v_month_start and v_today
      ),0)
    ),
    'movement_count',(select count(*) from public.bank_movements m where m.business_id=p_business_id),
    'movements',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.movement_date desc,x.created_at desc)
      from (
        select m.id,m.business_id,m.bank_account_id,m.movement_type,m.amount_minor,m.movement_date,
          m.description,m.category,m.counterparty,m.reference,m.notes,m.source_type,m.source_id,m.transfer_id,
          m.created_at,a.bank_name,a.account_name,a.currency_code
        from public.bank_movements m join public.bank_accounts a on a.id=m.bank_account_id and a.business_id=m.business_id
        where m.business_id=p_business_id
        order by m.movement_date desc,m.created_at desc limit v_limit offset v_offset
      ) x
    ),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$function$;

create or replace function public.create_bank_transfer(
  p_business_id uuid,p_from_account_id uuid,p_to_account_id uuid,p_amount_minor bigint,p_movement_date date,
  p_description text default null,p_reference text default null,p_notes text default null
)
returns uuid language plpgsql security definer
set search_path = pg_catalog, public, private
as $function$
declare
  v_from public.bank_accounts%rowtype;
  v_to public.bank_accounts%rowtype;
  v_transfer_id uuid := gen_random_uuid();
  v_description text := coalesce(nullif(trim(p_description),''),'Transferencia entre cuentas propias');
  v_date date := coalesce(p_movement_date,(now() at time zone 'America/Bogota')::date);
begin
  if auth.uid() is null or not private.can_manage_members(p_business_id) then raise exception 'Solo propietarios y administradores pueden transferir entre cuentas.'; end if;
  if p_amount_minor is null or p_amount_minor <= 0 then raise exception 'El importe de la transferencia debe ser mayor que cero.'; end if;
  if v_date > (now() at time zone 'America/Bogota')::date then raise exception 'La fecha de la transferencia no puede estar en el futuro.'; end if;
  if p_from_account_id is null or p_to_account_id is null or p_from_account_id=p_to_account_id then raise exception 'Selecciona dos cuentas diferentes.'; end if;
  select * into v_from from public.bank_accounts where id=p_from_account_id and business_id=p_business_id and is_active for update;
  if not found then raise exception 'La cuenta de origen no existe o está inactiva.'; end if;
  select * into v_to from public.bank_accounts where id=p_to_account_id and business_id=p_business_id and is_active for update;
  if not found then raise exception 'La cuenta de destino no existe o está inactiva.'; end if;
  if v_from.currency_code<>v_to.currency_code then raise exception 'Las cuentas deben tener la misma moneda para realizar una transferencia.'; end if;
  if v_date<v_from.opening_balance_date or v_date<v_to.opening_balance_date then raise exception 'La fecha de transferencia es anterior a la fecha de apertura de una de las cuentas.'; end if;
  insert into public.bank_movements(business_id,bank_account_id,movement_type,amount_minor,movement_date,description,category,reference,notes,transfer_id,created_by)
  values(p_business_id,p_from_account_id,'transfer_out',p_amount_minor,v_date,v_description,'Transferencia',nullif(trim(p_reference),''),nullif(trim(p_notes),''),v_transfer_id,auth.uid());
  insert into public.bank_movements(business_id,bank_account_id,movement_type,amount_minor,movement_date,description,category,reference,notes,transfer_id,created_by)
  values(p_business_id,p_to_account_id,'transfer_in',p_amount_minor,v_date,v_description,'Transferencia',nullif(trim(p_reference),''),nullif(trim(p_notes),''),v_transfer_id,auth.uid());
  return v_transfer_id;
end;
$function$;

-- Atomic wrappers: save a regular sale/purchase/payment and associate its payment with the selected account.
create or replace function public.create_sale_with_bank_account(
  p_business_id uuid,p_customer_id uuid,p_items jsonb,p_amount_paid_minor bigint,p_notes text,
  p_initial_payment_method text,p_sold_at timestamptz,p_advisor_name text,p_initial_bank_account_id uuid default null
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public, private
as $function$
declare v_result jsonb; v_sale_id uuid;
begin
  if p_initial_bank_account_id is not null then
    if p_amount_paid_minor is null or p_amount_paid_minor <= 0 then raise exception 'Seleccionaste una cuenta bancaria, pero no registraste un abono.'; end if;
    if p_initial_payment_method='Efectivo' then raise exception 'Los pagos en efectivo se controlan desde Caja, no desde Bancos.'; end if;
    if not private.can_manage_members(p_business_id) or not exists(
      select 1 from public.bank_accounts a join public.businesses b on b.id=a.business_id
      where a.id=p_initial_bank_account_id and a.business_id=p_business_id and a.is_active and a.currency_code=b.currency_code
    ) then raise exception 'La cuenta bancaria seleccionada no está disponible para este negocio.'; end if;
  end if;
  v_result := public.create_sale_with_date(p_business_id,p_customer_id,p_items,p_amount_paid_minor,p_notes,p_initial_payment_method,p_sold_at,p_advisor_name);
  v_sale_id := (v_result->>'id')::uuid;
  if p_initial_bank_account_id is not null then
    update public.sale_payments set bank_account_id=p_initial_bank_account_id
    where business_id=p_business_id and sale_id=v_sale_id and notes='Abono inicial al registrar la venta';
  end if;
  return v_result;
end;
$function$;

create or replace function public.record_sale_payment_with_bank_account(
  p_business_id uuid,p_sale_id uuid,p_amount_minor bigint,p_payment_method text,
  p_paid_at timestamptz default now(),p_notes text default null,p_bank_account_id uuid default null
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public, private
as $function$
declare v_result jsonb; v_payment_id uuid;
begin
  if p_bank_account_id is not null and (
    p_payment_method='Efectivo' or not private.can_manage_members(p_business_id) or not exists(
      select 1 from public.bank_accounts a join public.businesses b on b.id=a.business_id
      where a.id=p_bank_account_id and a.business_id=p_business_id and a.is_active and a.currency_code=b.currency_code
    )
  ) then raise exception 'La cuenta bancaria seleccionada no está disponible para este negocio o el medio de pago es efectivo.'; end if;
  v_result := public.record_sale_payment(p_business_id,p_sale_id,p_amount_minor,p_payment_method,p_paid_at,p_notes);
  v_payment_id := (v_result->>'payment_id')::uuid;
  if p_bank_account_id is not null then update public.sale_payments set bank_account_id=p_bank_account_id where id=v_payment_id and business_id=p_business_id; end if;
  return v_result;
end;
$function$;

create or replace function public.create_purchase_with_bank_account(
  p_business_id uuid,p_supplier_id uuid,p_notes text,p_purchased_at timestamptz,p_tax_minor bigint,
  p_amount_paid_minor bigint,p_items jsonb,p_initial_payment_method text,p_initial_bank_account_id uuid default null
)
returns uuid language plpgsql security definer
set search_path = pg_catalog, public, private
as $function$
declare v_purchase_id uuid;
begin
  if p_initial_bank_account_id is not null then
    if p_amount_paid_minor is null or p_amount_paid_minor<=0 then raise exception 'Seleccionaste una cuenta bancaria, pero no registraste un abono.'; end if;
    if p_initial_payment_method='Efectivo' then raise exception 'Los pagos en efectivo se controlan desde Caja, no desde Bancos.'; end if;
    if not private.can_manage_members(p_business_id) or not exists(
      select 1 from public.bank_accounts a join public.businesses b on b.id=a.business_id
      where a.id=p_initial_bank_account_id and a.business_id=p_business_id and a.is_active and a.currency_code=b.currency_code
    ) then raise exception 'La cuenta bancaria seleccionada no está disponible para este negocio.'; end if;
  end if;
  v_purchase_id := public.create_purchase(p_business_id,p_supplier_id,p_notes,p_purchased_at,p_tax_minor,p_amount_paid_minor,p_items,p_initial_payment_method);
  if p_initial_bank_account_id is not null then
    update public.purchase_payments set bank_account_id=p_initial_bank_account_id
    where business_id=p_business_id and purchase_id=v_purchase_id and notes='Abono inicial al registrar la compra';
  end if;
  return v_purchase_id;
end;
$function$;

create or replace function public.record_purchase_payment_with_bank_account(
  p_business_id uuid,p_purchase_id uuid,p_amount_minor bigint,p_payment_method text,
  p_paid_at timestamptz default now(),p_notes text default null,p_bank_account_id uuid default null
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public, private
as $function$
declare v_result jsonb; v_payment_id uuid;
begin
  if p_bank_account_id is not null and (
    p_payment_method='Efectivo' or not private.can_manage_members(p_business_id) or not exists(
      select 1 from public.bank_accounts a join public.businesses b on b.id=a.business_id
      where a.id=p_bank_account_id and a.business_id=p_business_id and a.is_active and a.currency_code=b.currency_code
    )
  ) then raise exception 'La cuenta bancaria seleccionada no está disponible para este negocio o el medio de pago es efectivo.'; end if;
  v_result := public.record_purchase_payment(p_business_id,p_purchase_id,p_amount_minor,p_payment_method,p_paid_at,p_notes);
  v_payment_id := (v_result->>'payment_id')::uuid;
  if p_bank_account_id is not null then update public.purchase_payments set bank_account_id=p_bank_account_id where id=v_payment_id and business_id=p_business_id; end if;
  return v_result;
end;
$function$;


-- Las cuentas y los movimientos bancarios también forman parte del historial de cambios.
create or replace function private.log_business_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $function$
declare
  v_old jsonb; v_new jsonb; v_row jsonb; v_business_id uuid; v_entity_id uuid;
  v_actor uuid := auth.uid(); v_action text; v_label text; v_changes jsonb := '{}'::jsonb;
  v_key text; v_old_value jsonb; v_new_value jsonb; v_member_name text;
begin
  if tg_op = 'DELETE' then v_old:=to_jsonb(old); v_row:=v_old; v_action:='Eliminó';
  elsif tg_op = 'UPDATE' then v_old:=to_jsonb(old); v_new:=to_jsonb(new); v_row:=v_new; v_action:='Actualizó';
  else v_new:=to_jsonb(new); v_row:=v_new; v_action:='Creó'; end if;

  begin
    v_business_id := nullif(v_row->>'business_id','')::uuid;
    if v_business_id is null and tg_table_name='businesses' then v_business_id := nullif(v_row->>'id','')::uuid; end if;
  exception when others then v_business_id:=null; end;
  begin v_entity_id:=nullif(v_row->>'id','')::uuid; exception when others then v_entity_id:=null; end;
  if v_business_id is null then if tg_op='DELETE' then return old; else return new; end if; end if;
  if tg_table_name='business_members' then
    select coalesce(nullif(p.display_name,''),'miembro del equipo') into v_member_name
    from public.profiles p where p.user_id=nullif(v_row->>'user_id','')::uuid;
  end if;

  v_label := coalesce(
    nullif(v_row->>'sale_number',''),nullif(v_row->>'purchase_number',''),nullif(v_row->>'quote_number',''),
    nullif(v_row->>'name',''),nullif(v_row->>'full_name',''),nullif(v_row->>'company_name',''),
    nullif(v_row->>'bank_name',''),nullif(v_row->>'account_name',''),
    nullif(v_row->>'description',''),nullif(v_row->>'item_name',''),nullif(v_row->>'category',''),
    nullif(v_row->>'sku',''),nullif(v_row->>'reference',''),v_member_name,
    case when tg_table_name in ('sale_payments','purchase_payments')
      then 'pago por '||coalesce(v_row->>'amount_minor','importe no indicado') else null end,
    case when tg_table_name='businesses'
      then coalesce(nullif(v_row->>'name',''),'configuración del negocio') else null end,
    left(coalesce(v_row->>'notes',''),100),tg_table_name
  );

  if tg_op='UPDATE' then
    for v_key in select jsonb_object_keys(v_new) loop
      if v_key not in ('updated_at','created_at') then
        v_old_value:=v_old->v_key; v_new_value:=v_new->v_key;
        if v_old_value is distinct from v_new_value then
          v_changes:=v_changes||jsonb_build_object(v_key,jsonb_build_object('antes',v_old_value,'despues',v_new_value));
        end if;
      end if;
    end loop;
    if v_changes='{}'::jsonb then return new; end if;
  elsif tg_op='INSERT' then v_changes:=jsonb_build_object('registro','creado');
  else v_changes:=jsonb_build_object('registro','eliminado'); end if;

  insert into public.audit_logs(business_id,actor_user_id,action,entity_type,entity_id,details,created_at)
  values(v_business_id,v_actor,v_action,tg_table_name,v_entity_id,
    jsonb_build_object('label',v_label,'changes',v_changes,'source','database_trigger'),now());
  if tg_op='DELETE' then return old; else return new; end if;
end;
$function$;

drop trigger if exists audit_business_changes on public.bank_accounts;
create trigger audit_business_changes after insert or update or delete on public.bank_accounts
  for each row execute function private.log_business_audit_event();
drop trigger if exists audit_business_changes on public.bank_movements;
create trigger audit_business_changes after insert or update or delete on public.bank_movements
  for each row execute function private.log_business_audit_event();

revoke all on function public.bank_dashboard(uuid,integer,integer) from public, anon;
revoke all on function public.create_bank_transfer(uuid,uuid,uuid,bigint,date,text,text,text) from public, anon;
revoke all on function public.create_sale_with_bank_account(uuid,uuid,jsonb,bigint,text,text,timestamptz,text,uuid) from public, anon;
revoke all on function public.record_sale_payment_with_bank_account(uuid,uuid,bigint,text,timestamptz,text,uuid) from public, anon;
revoke all on function public.create_purchase_with_bank_account(uuid,uuid,text,timestamptz,bigint,bigint,jsonb,text,uuid) from public, anon;
revoke all on function public.record_purchase_payment_with_bank_account(uuid,uuid,bigint,text,timestamptz,text,uuid) from public, anon;

grant execute on function public.bank_dashboard(uuid,integer,integer) to authenticated;
grant execute on function public.create_bank_transfer(uuid,uuid,uuid,bigint,date,text,text,text) to authenticated;
grant execute on function public.create_sale_with_bank_account(uuid,uuid,jsonb,bigint,text,text,timestamptz,text,uuid) to authenticated;
grant execute on function public.record_sale_payment_with_bank_account(uuid,uuid,bigint,text,timestamptz,text,uuid) to authenticated;
grant execute on function public.create_purchase_with_bank_account(uuid,uuid,text,timestamptz,bigint,bigint,jsonb,text,uuid) to authenticated;
grant execute on function public.record_purchase_payment_with_bank_account(uuid,uuid,bigint,text,timestamptz,text,uuid) to authenticated;
