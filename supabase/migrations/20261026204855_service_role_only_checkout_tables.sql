-- Keep checkout orders, order items, rate limits and payment credentials
-- inaccessible to browser roles. Edge Functions access them with service_role.
revoke all privileges on table public.business_payment_integrations from anon, authenticated;
revoke all privileges on table public.public_checkout_rate_limits from anon, authenticated;
revoke all privileges on table public.public_store_orders from anon, authenticated;
revoke all privileges on table public.public_store_order_items from anon, authenticated;

drop policy if exists service_role_only_business_payment_integrations on public.business_payment_integrations;
create policy service_role_only_business_payment_integrations
  on public.business_payment_integrations for all to service_role
  using (true) with check (true);

drop policy if exists service_role_only_public_checkout_rate_limits on public.public_checkout_rate_limits;
create policy service_role_only_public_checkout_rate_limits
  on public.public_checkout_rate_limits for all to service_role
  using (true) with check (true);

drop policy if exists service_role_only_public_store_orders on public.public_store_orders;
create policy service_role_only_public_store_orders
  on public.public_store_orders for all to service_role
  using (true) with check (true);

drop policy if exists service_role_only_public_store_order_items on public.public_store_order_items;
create policy service_role_only_public_store_order_items
  on public.public_store_order_items for all to service_role
  using (true) with check (true);
