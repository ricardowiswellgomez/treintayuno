-- Cover foreign-key lookups identified by the Supabase performance advisor.
-- These indexes are additive and do not change business data.
create index if not exists product_images_created_by_idx
  on public.product_images (created_by);

create index if not exists product_variants_product_business_fk_idx
  on public.product_variants (product_id, business_id);

create index if not exists public_store_order_items_business_id_idx
  on public.public_store_order_items (business_id);

create index if not exists public_store_order_items_product_id_idx
  on public.public_store_order_items (product_id);

create index if not exists public_store_orders_coupon_id_idx
  on public.public_store_orders (coupon_id);

create index if not exists public_store_orders_sale_id_idx
  on public.public_store_orders (sale_id);

create index if not exists purchase_payments_purchase_business_fk_idx
  on public.purchase_payments (purchase_id, business_id);

create index if not exists sale_payments_sale_business_fk_idx
  on public.sale_payments (sale_id, business_id);
