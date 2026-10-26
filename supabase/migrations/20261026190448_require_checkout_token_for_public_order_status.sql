-- Require both the high-entropy public reference and the private checkout token
-- before revealing the status of a public catalog order.
drop function if exists public.get_public_store_order_status(text);

create function public.get_public_store_order_status(
  p_order_reference text,
  p_checkout_token uuid
)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $function$
  select case when o.id is null then null else jsonb_build_object(
    'order_reference', o.order_reference,
    'payment_status', o.payment_status,
    'sale_number', s.sale_number,
    'currency_code', o.currency_code,
    'total_minor', o.total_minor
  ) end
  from (select 1) seed
  left join public.public_store_orders o
    on o.order_reference = p_order_reference
   and o.checkout_token = p_checkout_token
  left join public.sales s on s.id = o.sale_id
  limit 1;
$function$;

revoke all on function public.get_public_store_order_status(text, uuid) from public, anon, authenticated;
grant execute on function public.get_public_store_order_status(text, uuid) to anon, authenticated, service_role;
