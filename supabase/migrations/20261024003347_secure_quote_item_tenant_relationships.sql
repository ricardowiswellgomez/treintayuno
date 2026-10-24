drop policy if exists quote_items_insert_by_sales_permission on public.quote_items;
create policy quote_items_insert_by_sales_permission on public.quote_items
  for insert to authenticated
  with check (
    private.can_access_business(quote_items.business_id, 'sales_manage')
    and exists (
      select 1 from public.quotes q
      where q.id = quote_items.quote_id
        and q.business_id = quote_items.business_id
    )
  );

drop policy if exists quote_items_update_by_sales_permission on public.quote_items;
create policy quote_items_update_by_sales_permission on public.quote_items
  for update to authenticated
  using (
    private.can_access_business(quote_items.business_id, 'sales_manage')
    and exists (
      select 1 from public.quotes q
      where q.id = quote_items.quote_id
        and q.business_id = quote_items.business_id
    )
  )
  with check (
    private.can_access_business(quote_items.business_id, 'sales_manage')
    and exists (
      select 1 from public.quotes q
      where q.id = quote_items.quote_id
        and q.business_id = quote_items.business_id
    )
  );

drop policy if exists quote_items_delete_by_sales_permission on public.quote_items;
create policy quote_items_delete_by_sales_permission on public.quote_items
  for delete to authenticated
  using (
    private.can_access_business(quote_items.business_id, 'sales_manage')
    and exists (
      select 1 from public.quotes q
      where q.id = quote_items.quote_id
        and q.business_id = quote_items.business_id
    )
  );

create or replace function private.enforce_quote_customer_business()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.customer_id is not null and not exists (
    select 1 from public.customers c
    where c.id = new.customer_id and c.business_id = new.business_id
  ) then
    raise exception 'El cliente debe pertenecer al mismo negocio de la cotización';
  end if;
  return new;
end;
$function$;

revoke all on function private.enforce_quote_customer_business() from public, anon, authenticated;
drop trigger if exists quotes_customer_same_business on public.quotes;
create trigger quotes_customer_same_business
  before insert or update of customer_id, business_id on public.quotes
  for each row execute function private.enforce_quote_customer_business();
