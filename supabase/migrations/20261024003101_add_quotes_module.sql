create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  quote_number text not null,
  customer_id uuid null references public.customers(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  status text not null default 'draft'
    check (status in ('draft','sent','accepted','rejected','expired','converted','cancelled')),
  currency_code character(3) not null default 'COP',
  subtotal_minor bigint not null default 0 check (subtotal_minor >= 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  tax_minor bigint not null default 0 check (tax_minor >= 0),
  total_minor bigint not null default 0 check (total_minor >= 0),
  valid_until date,
  notes text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotes_business_quote_number_unique unique (business_id, quote_number)
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  item_name text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  line_total_minor bigint not null check (line_total_minor >= 0),
  created_at timestamptz not null default now()
);

create index if not exists quotes_business_created_idx
  on public.quotes (business_id, created_at desc);
create index if not exists quotes_business_status_idx
  on public.quotes (business_id, status);
create index if not exists quote_items_business_quote_idx
  on public.quote_items (business_id, quote_id, created_at);

alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

grant select, insert, update, delete on public.quotes to authenticated;
grant select, insert, update, delete on public.quote_items to authenticated;

drop policy if exists quotes_select_by_sales_permission on public.quotes;
create policy quotes_select_by_sales_permission on public.quotes
  for select to authenticated
  using (private.can_access_business(business_id, 'sales_view'));

drop policy if exists quotes_insert_by_sales_permission on public.quotes;
create policy quotes_insert_by_sales_permission on public.quotes
  for insert to authenticated
  with check (private.can_access_business(business_id, 'sales_manage'));

drop policy if exists quotes_update_by_sales_permission on public.quotes;
create policy quotes_update_by_sales_permission on public.quotes
  for update to authenticated
  using (private.can_access_business(business_id, 'sales_manage'))
  with check (private.can_access_business(business_id, 'sales_manage'));

drop policy if exists quotes_delete_by_sales_permission on public.quotes;
create policy quotes_delete_by_sales_permission on public.quotes
  for delete to authenticated
  using (private.can_access_business(business_id, 'sales_manage'));

drop policy if exists quote_items_select_by_sales_permission on public.quote_items;
create policy quote_items_select_by_sales_permission on public.quote_items
  for select to authenticated
  using (private.can_access_business(business_id, 'sales_view'));

drop policy if exists quote_items_insert_by_sales_permission on public.quote_items;
create policy quote_items_insert_by_sales_permission on public.quote_items
  for insert to authenticated
  with check (
    private.can_access_business(business_id, 'sales_manage')
    and exists (select 1 from public.quotes q where q.id = quote_id and q.business_id = business_id)
  );

drop policy if exists quote_items_update_by_sales_permission on public.quote_items;
create policy quote_items_update_by_sales_permission on public.quote_items
  for update to authenticated
  using (private.can_access_business(business_id, 'sales_manage'))
  with check (private.can_access_business(business_id, 'sales_manage'));

drop policy if exists quote_items_delete_by_sales_permission on public.quote_items;
create policy quote_items_delete_by_sales_permission on public.quote_items
  for delete to authenticated
  using (private.can_access_business(business_id, 'sales_manage'));
