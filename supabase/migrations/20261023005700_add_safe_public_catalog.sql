create or replace function public.get_public_catalog(
  p_business_id uuid,
  p_limit integer default 12,
  p_offset integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_business jsonb;
  v_products jsonb;
  v_total bigint;
begin
  if p_business_id is null then
    return jsonb_build_object('business', null, 'products', '[]'::jsonb, 'total', 0);
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 24 or p_offset is null or p_offset < 0 then
    raise exception 'La página del catálogo no es válida.';
  end if;

  select jsonb_build_object('id', b.id, 'name', b.name, 'currency_code', b.currency_code)
    into v_business
  from public.businesses b
  where b.id = p_business_id;

  if v_business is null then
    return jsonb_build_object('business', null, 'products', '[]'::jsonb, 'total', 0);
  end if;

  select count(*) into v_total
  from public.products p
  where p.business_id = p_business_id
    and p.is_published = true
    and p.is_sellable = true
    and p.archived_at is null;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', page.id,
      'name', page.name,
      'description', page.description,
      'category_name', page.category_name,
      'sale_price_minor', page.sale_price_minor,
      'unit_name', page.unit_name,
      'commercial_presentation', page.commercial_presentation,
      'image_paths', page.image_paths
    ) order by page.name
  ), '[]'::jsonb) into v_products
  from (
    select p.id, p.name, p.description, c.name as category_name,
      p.sale_price_minor, p.unit_name, p.commercial_presentation, p.image_paths
    from public.products p
    left join public.product_categories c
      on c.id = p.category_id and c.business_id = p.business_id
    where p.business_id = p_business_id
      and p.is_published = true
      and p.is_sellable = true
      and p.archived_at is null
    order by p.name
    limit p_limit offset p_offset
  ) page;

  return jsonb_build_object(
    'business', v_business,
    'products', v_products,
    'total', v_total,
    'limit', p_limit,
    'offset', p_offset
  );
end;
$$;

create or replace function public.get_public_catalog_image(
  p_business_id uuid,
  p_product_id uuid,
  p_image_key text
)
returns table(content_type text, image_data text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select i.content_type, i.image_data
  from public.product_images i
  join public.products p
    on p.id = i.product_id and p.business_id = i.business_id
  where p.business_id = p_business_id
    and p.id = p_product_id
    and p.is_published = true
    and p.is_sellable = true
    and p.archived_at is null
    and p_image_key = any(p.image_paths)
    and i.image_key = p_image_key
    and i.content_type = 'image/webp'
  limit 1;
$$;

revoke all on function public.get_public_catalog(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.get_public_catalog(uuid, integer, integer) to anon, authenticated;
revoke all on function public.get_public_catalog_image(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.get_public_catalog_image(uuid, uuid, text) to anon, authenticated;
