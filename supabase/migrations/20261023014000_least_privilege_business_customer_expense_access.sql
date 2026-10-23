
-- Only the team RPCs may change membership; initial owner membership is maintained by a SECURITY DEFINER trigger.
revoke all privileges on table public.business_members from anon, authenticated;
grant select on table public.business_members to authenticated;
drop policy if exists members_insert_initial_owner on public.business_members;

-- Business creation and the owner settings screen are the only direct writes to businesses.
revoke all privileges on table public.businesses from anon, authenticated;
grant select on table public.businesses to authenticated;
grant insert (id, owner_user_id, name, country_code, currency_code, timezone, theme)
  on table public.businesses to authenticated;
grant update (name, currency_code)
  on table public.businesses to authenticated;
drop policy if exists businesses_delete_owner on public.businesses;

-- Customers may be created and edited, but not deleted or moved to another business.
revoke all privileges on table public.customers from anon, authenticated;
grant select on table public.customers to authenticated;
grant insert (
  business_id, full_name, first_name, last_name, company_name, document_type,
  document_number, email, phone, whatsapp, city, address, notes
) on table public.customers to authenticated;
grant update (
  full_name, first_name, last_name, company_name, document_type,
  document_number, email, phone, whatsapp, city, address, notes
) on table public.customers to authenticated;
drop policy if exists customers_delete_by_permission on public.customers;

-- Expenses are append-only until a dedicated correction/void workflow exists.
revoke all privileges on table public.expenses from anon, authenticated;
grant select on table public.expenses to authenticated;
grant insert (
  business_id, category, description, amount_minor, currency_code,
  expense_date, payment_method, supplier_id, notes
) on table public.expenses to authenticated;
drop policy if exists expenses_update_by_permission on public.expenses;
drop policy if exists expenses_delete_by_permission on public.expenses;

-- Supplier records can be added and read; editing/deletion will require an explicit workflow.
revoke all privileges on table public.suppliers from anon, authenticated;
grant select on table public.suppliers to authenticated;
grant insert (business_id, name, email, phone, tax_id, address, notes)
  on table public.suppliers to authenticated;
drop policy if exists suppliers_update_by_permission on public.suppliers;
drop policy if exists suppliers_delete_by_permission on public.suppliers;

-- Category CRUD remains available, but immutable IDs, business ownership and timestamps cannot be changed.
revoke all privileges on table public.product_categories from anon, authenticated;
grant select on table public.product_categories to authenticated;
grant insert (business_id, name) on table public.product_categories to authenticated;
grant update (name) on table public.product_categories to authenticated;
grant delete on table public.product_categories to authenticated;

notify pgrst, 'reload schema';
