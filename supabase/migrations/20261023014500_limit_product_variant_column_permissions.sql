
-- Keep variant ownership immutable from the browser while allowing legitimate variant maintenance.
revoke all privileges on table public.product_variants from anon, authenticated;
grant select on table public.product_variants to authenticated;
grant insert (
  business_id, product_id, variant_name, variant_value, sku,
  sale_price_minor, stock_on_hand, is_active
) on table public.product_variants to authenticated;
grant update (
  variant_name, variant_value, sku, sale_price_minor,
  stock_on_hand, is_active, updated_at
) on table public.product_variants to authenticated;
grant delete on table public.product_variants to authenticated;

notify pgrst, 'reload schema';
