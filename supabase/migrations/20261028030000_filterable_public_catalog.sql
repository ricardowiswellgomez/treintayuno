-- Filterable public catalogue with bounded, indexed-friendly server-side paging.
drop function if exists public.get_public_catalog(uuid,integer,integer);
create or replace function public.get_public_catalog(
  p_business_id uuid,
  p_limit integer default 24,
  p_offset integer default 0,
  p_search text default null,
  p_category_id uuid default null,
  p_sort text default 'name_asc'
) returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_business jsonb;
  v_products jsonb;
  v_categories jsonb;
  v_profile jsonb;
  v_total bigint;
  v_stock_behavior text;
  v_search text := left(trim(coalesce(p_search,'')),100);
  v_sort text := case when p_sort in ('name_asc','name_desc','price_asc','price_desc') then p_sort else 'name_asc' end;
begin
  if p_business_id is null then
    return jsonb_build_object('business',null,'products','[]'::jsonb,'categories','[]'::jsonb,'total',0);
  end if;
  if p_limit is null or p_limit<1 or p_limit>24 or p_offset is null or p_offset<0 then
    raise exception 'La página del catálogo no es válida.';
  end if;

  select jsonb_build_object(
    'tradeName',coalesce(nullif(b.settings #>> '{commercial_profile,tradeName}',''),b.name),
    'email',nullif(b.settings #>> '{commercial_profile,email}',''),
    'phone',nullif(b.settings #>> '{commercial_profile,phone}',''),
    'address',nullif(b.settings #>> '{commercial_profile,address}',''),
    'city',nullif(b.settings #>> '{commercial_profile,city}',''),
    'website',nullif(b.settings #>> '{commercial_profile,website}',''),
    'publicDescription',nullif(b.settings #>> '{commercial_profile,publicDescription}',''),
    'hours',nullif(b.settings #>> '{commercial_profile,hours}',''),
    'hoursSchedule',coalesce(b.settings #> '{commercial_profile,hoursSchedule}','{}'::jsonb),
    'orderChannel',case when b.settings #>> '{commercial_profile,orderChannel}'='whatsapp' then 'whatsapp' else 'wompi' end,
    'deliveryMethods',coalesce(b.settings #> '{commercial_profile,deliveryMethods}','["pickup","delivery"]'::jsonb),
    'stockVisibility',case when b.settings #>> '{commercial_profile,stockVisibility}' in ('show_all','hide','show_unavailable') then b.settings #>> '{commercial_profile,stockVisibility}' else 'hide' end
  ) into v_profile from public.businesses b where b.id=p_business_id;

  if v_profile is null then
    return jsonb_build_object('business',null,'products','[]'::jsonb,'categories','[]'::jsonb,'total',0);
  end if;
  v_stock_behavior:=coalesce(v_profile->>'stockVisibility','hide');

  select jsonb_build_object(
    'id',b.id,'name',b.name,'slug',b.slug,'currency_code',b.currency_code,
    'logo_path',b.logo_path,'theme',b.theme,'commercial_profile',v_profile
  ) into v_business from public.businesses b where b.id=p_business_id;

  select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'name',c.name) order by c.name),'[]'::jsonb)
    into v_categories
  from public.product_categories c
  where c.business_id=p_business_id and exists (
    select 1 from public.products p where p.business_id=c.business_id and p.category_id=c.id
      and p.is_published=true and p.is_sellable=true and p.archived_at is null
      and (v_stock_behavior<>'hide' or not p.track_inventory or p.stock_on_hand>0)
  );

  select count(*) into v_total from public.products p
  where p.business_id=p_business_id and p.is_published=true and p.is_sellable=true and p.archived_at is null
    and (v_stock_behavior<>'hide' or not p.track_inventory or p.stock_on_hand>0)
    and (p_category_id is null or p.category_id=p_category_id)
    and (v_search='' or
      p.name ilike '%'||replace(replace(replace(v_search,'\','\\'),'%','\%'),'_','\_')||'%' escape '\'
      or coalesce(p.description,'') ilike '%'||replace(replace(replace(v_search,'\','\\'),'%','\%'),'_','\_')||'%' escape '\'
      or coalesce(p.sku,'') ilike '%'||replace(replace(replace(v_search,'\','\\'),'%','\%'),'_','\_')||'%' escape '\'
    );

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',page.id,'name',page.name,'description',page.description,
    'category_id',page.category_id,'category_name',page.category_name,
    'sale_price_minor',page.sale_price_minor,'unit_name',page.unit_name,
    'commercial_presentation',page.commercial_presentation,'image_paths',page.image_paths,
    'track_inventory',page.track_inventory,'stock_on_hand',page.stock_on_hand,
    'is_out_of_stock',(page.track_inventory and page.stock_on_hand<=0),
    'tax_code',coalesce(page.metadata->>'tax_code','none'),'variants',page.variants
  ) order by
    case when v_sort='name_asc' then page.name end asc,
    case when v_sort='name_desc' then page.name end desc,
    case when v_sort='price_asc' then page.sale_price_minor end asc,
    case when v_sort='price_desc' then page.sale_price_minor end desc,
    page.name asc
  ),'[]'::jsonb) into v_products
  from (
    select p.id,p.name,p.description,p.category_id,c.name as category_name,p.sale_price_minor,
      p.unit_name,p.commercial_presentation,p.image_paths,p.track_inventory,p.stock_on_hand,p.metadata,
      coalesce((select jsonb_agg(jsonb_build_object(
        'id',v.id,'variant_name',v.variant_name,'variant_value',v.variant_value,
        'sku',v.sku,'sale_price_minor',v.sale_price_minor,'stock_on_hand',v.stock_on_hand,
        'is_active',v.is_active,'image_paths',v.image_paths
      ) order by v.variant_name,v.variant_value) from public.product_variants v
        where v.business_id=p.business_id and v.product_id=p.id and v.is_active=true),'[]'::jsonb) as variants
    from public.products p
    left join public.product_categories c on c.id=p.category_id and c.business_id=p.business_id
    where p.business_id=p_business_id and p.is_published=true and p.is_sellable=true and p.archived_at is null
      and (v_stock_behavior<>'hide' or not p.track_inventory or p.stock_on_hand>0)
      and (p_category_id is null or p.category_id=p_category_id)
      and (v_search='' or
        p.name ilike '%'||replace(replace(replace(v_search,'\','\\'),'%','\%'),'_','\_')||'%' escape '\'
        or coalesce(p.description,'') ilike '%'||replace(replace(replace(v_search,'\','\\'),'%','\%'),'_','\_')||'%' escape '\'
        or coalesce(p.sku,'') ilike '%'||replace(replace(replace(v_search,'\','\\'),'%','\%'),'_','\_')||'%' escape '\'
      )
    order by
      case when v_sort='name_asc' then p.name end asc,
      case when v_sort='name_desc' then p.name end desc,
      case when v_sort='price_asc' then p.sale_price_minor end asc,
      case when v_sort='price_desc' then p.sale_price_minor end desc,
      p.name asc
    limit p_limit offset p_offset
  ) page;

  return jsonb_build_object(
    'business',v_business,'products',v_products,'categories',v_categories,
    'total',v_total,'limit',p_limit,'offset',p_offset
  );
end;$function$;
revoke all on function public.get_public_catalog(uuid,integer,integer,text,uuid,text) from public;
grant execute on function public.get_public_catalog(uuid,integer,integer,text,uuid,text) to anon,authenticated;
