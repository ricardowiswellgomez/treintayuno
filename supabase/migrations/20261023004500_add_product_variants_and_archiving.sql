-- Product variants and reversible product archiving.
alter table public.products
  add column if not exists archived_at timestamptz;

create unique index if not exists products_id_business_id_unique
  on public.products (id, business_id);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  product_id uuid not null,
  variant_name text not null check (length(btrim(variant_name)) between 1 and 80),
  variant_value text not null check (length(btrim(variant_value)) between 1 and 120),
  sku text,
  sale_price_minor bigint check (sale_price_minor is null or sale_price_minor >= 0),
  stock_on_hand numeric(14,3) check (stock_on_hand is null or stock_on_hand >= 0),
  is_active boolean not null default true,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_product_business_fk
    foreign key (product_id, business_id)
    references public.products (id, business_id) on delete cascade
);

create unique index if not exists product_variants_name_value_unique
  on public.product_variants (product_id, lower(variant_name), lower(variant_value));

create unique index if not exists product_variants_business_sku_unique
  on public.product_variants (business_id, lower(sku))
  where sku is not null and btrim(sku) <> '';

create index if not exists product_variants_business_product_idx
  on public.product_variants (business_id, product_id);

alter table public.product_variants enable row level security;

drop policy if exists product_variants_select_by_permission on public.product_variants;
create policy product_variants_select_by_permission
  on public.product_variants for select to authenticated
  using (private.can_access_business(business_id, 'products_view'));

drop policy if exists product_variants_insert_by_permission on public.product_variants;
create policy product_variants_insert_by_permission
  on public.product_variants for insert to authenticated
  with check (private.can_access_business(business_id, 'products_manage'));

drop policy if exists product_variants_update_by_permission on public.product_variants;
create policy product_variants_update_by_permission
  on public.product_variants for update to authenticated
  using (private.can_access_business(business_id, 'products_manage'))
  with check (private.can_access_business(business_id, 'products_manage'));

drop policy if exists product_variants_delete_by_permission on public.product_variants;
create policy product_variants_delete_by_permission
  on public.product_variants for delete to authenticated
  using (private.can_access_business(business_id, 'products_manage'));

grant select, insert, update, delete on public.product_variants to authenticated;
