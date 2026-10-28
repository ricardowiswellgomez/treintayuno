-- Variant photos (maximum two), cash drawer sessions, custom catalogue links and stock visibility.
alter table public.product_variants add column if not exists image_paths text[] not null default '{}'::text[];
alter table public.product_variants drop constraint if exists product_variants_image_paths_limit;
alter table public.product_variants add constraint product_variants_image_paths_limit check (cardinality(image_paths)<=2);
create unique index if not exists product_variants_business_product_id_unique on public.product_variants(business_id,product_id,id);
alter table public.product_images add column if not exists variant_id uuid;
alter table public.product_images drop constraint if exists product_images_variant_fk;
alter table public.product_images add constraint product_images_variant_fk foreign key(business_id,product_id,variant_id) references public.product_variants(business_id,product_id,id) on delete cascade;
create index if not exists product_images_variant_idx on public.product_images(business_id,product_id,variant_id) where variant_id is not null;

create or replace function public.add_product_variant_image_db(p_business_id uuid,p_product_id uuid,p_variant_id uuid,p_image_data text,p_image_size_bytes integer)
returns text language plpgsql security definer set search_path to 'public','private','pg_temp' as $function$
declare v_paths text[]; v_key text;
begin
 if auth.uid() is null or not private.can_access_business(p_business_id,'products_manage') then raise exception 'No tienes permiso para administrar las fotos de esta variante.'; end if;
 if p_image_data is null or p_image_data !~ '^[A-Za-z0-9+/]+={0,2}$' then raise exception 'La foto no tiene un formato válido.'; end if;
 if p_image_size_bytes is null or p_image_size_bytes<1 or p_image_size_bytes>1500000 or length(p_image_data)>2000000 or length(p_image_data)<>(4*ceil(p_image_size_bytes/3.0))::integer then raise exception 'La foto optimizada debe pesar 1,5 MB o menos.'; end if;
 select coalesce(image_paths,array[]::text[]) into v_paths from public.product_variants where id=p_variant_id and business_id=p_business_id and product_id=p_product_id for update;
 if not found then raise exception 'La variante no existe o no pertenece a este producto.'; end if;
 if cardinality(v_paths)>=2 then raise exception 'Cada variante admite como máximo dos fotos.'; end if;
 v_key:=p_business_id::text||'/'||p_product_id::text||'/'||gen_random_uuid()::text||'.webp';
 insert into public.product_images(image_key,business_id,product_id,variant_id,image_data,image_size_bytes,content_type,created_by) values(v_key,p_business_id,p_product_id,p_variant_id,p_image_data,p_image_size_bytes,'image/webp',auth.uid());
 update public.product_variants set image_paths=array_append(v_paths,v_key),updated_at=now() where id=p_variant_id and business_id=p_business_id and product_id=p_product_id;
 return v_key;
end;$function$;
revoke all on function public.add_product_variant_image_db(uuid,uuid,uuid,text,integer) from public,anon;
grant execute on function public.add_product_variant_image_db(uuid,uuid,uuid,text,integer) to authenticated;

create or replace function public.remove_product_variant_image_db(p_business_id uuid,p_product_id uuid,p_variant_id uuid,p_image_key text)
returns boolean language plpgsql security definer set search_path to 'public','private','pg_temp' as $function$
declare v_paths text[];
begin
 if auth.uid() is null or not private.can_access_business(p_business_id,'products_manage') then raise exception 'No tienes permiso para administrar las fotos de esta variante.'; end if;
 select coalesce(image_paths,array[]::text[]) into v_paths from public.product_variants where id=p_variant_id and business_id=p_business_id and product_id=p_product_id for update;
 if not found then raise exception 'La variante no existe o no pertenece a este producto.'; end if;
 if p_image_key is null or not (p_image_key=any(v_paths)) then raise exception 'La foto no pertenece a esta variante.'; end if;
 update public.product_variants set image_paths=array_remove(coalesce(image_paths,array[]::text[]),p_image_key),updated_at=now() where id=p_variant_id and business_id=p_business_id and product_id=p_product_id;
 delete from public.product_images where image_key=p_image_key and business_id=p_business_id and product_id=p_product_id and variant_id=p_variant_id;
 return true;
end;$function$;
revoke all on function public.remove_product_variant_image_db(uuid,uuid,uuid,text) from public,anon;
grant execute on function public.remove_product_variant_image_db(uuid,uuid,uuid,text) to authenticated;

create or replace function public.get_public_catalog_variant_image(p_business_id uuid,p_product_id uuid,p_variant_id uuid,p_image_key text)
returns table(content_type text,image_data text) language sql stable security definer set search_path to 'public','pg_temp' as $function$
 select i.content_type,i.image_data from public.product_images i
 join public.products p on p.id=i.product_id and p.business_id=i.business_id
 join public.product_variants v on v.id=i.variant_id and v.product_id=i.product_id and v.business_id=i.business_id
 where i.business_id=p_business_id and i.product_id=p_product_id and i.variant_id=p_variant_id and i.image_key=p_image_key
 and p.is_published=true and p.is_sellable=true and p.archived_at is null and v.is_active=true and p_image_key=any(v.image_paths) and i.content_type='image/webp' limit 1;
$function$;
revoke all on function public.get_public_catalog_variant_image(uuid,uuid,uuid,text) from public;
grant execute on function public.get_public_catalog_variant_image(uuid,uuid,uuid,text) to anon,authenticated;

create table if not exists public.cash_register_sessions(
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 opened_by uuid not null references auth.users(id) on delete restrict,
 closed_by uuid references auth.users(id) on delete set null,
 currency_code character(3) not null default 'COP',
 opening_cash_minor bigint not null default 0 check(opening_cash_minor>=0),
 closing_cash_minor bigint check(closing_cash_minor is null or closing_cash_minor>=0),
 expected_cash_minor bigint check(expected_cash_minor is null or expected_cash_minor>=0),
 difference_minor bigint,
 close_notes text,
 status text not null default 'open' check(status in ('open','closed')),
 opened_at timestamptz not null default now(),
 closed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint cash_register_session_close_state check((status='open' and closed_at is null and closing_cash_minor is null) or (status='closed' and closed_at is not null and closing_cash_minor is not null))
);
create index if not exists cash_register_sessions_business_time_idx on public.cash_register_sessions(business_id,opened_at desc);
create unique index if not exists cash_register_one_open_per_user_business on public.cash_register_sessions(business_id,opened_by) where status='open';
alter table public.cash_register_sessions enable row level security;
drop policy if exists cash_register_sessions_select_by_permission on public.cash_register_sessions;
create policy cash_register_sessions_select_by_permission on public.cash_register_sessions for select to authenticated using(private.can_access_business(business_id,'sales_view'));
drop policy if exists cash_register_sessions_insert_by_permission on public.cash_register_sessions;
create policy cash_register_sessions_insert_by_permission on public.cash_register_sessions for insert to authenticated with check(opened_by=auth.uid() and private.can_access_business(business_id,'sales_manage'));
drop policy if exists cash_register_sessions_update_by_permission on public.cash_register_sessions;
create policy cash_register_sessions_update_by_permission on public.cash_register_sessions for update to authenticated using(private.can_access_business(business_id,'sales_manage')) with check(private.can_access_business(business_id,'sales_manage'));
grant select,insert,update on public.cash_register_sessions to authenticated;

create unique index if not exists businesses_slug_unique_lower on public.businesses(lower(slug)) where slug is not null and btrim(slug)<>'';
create or replace function public.set_business_catalog_slug(p_business_id uuid,p_slug text)
returns text language plpgsql security definer set search_path to 'public','private','pg_temp' as $function$
declare v_slug text:=lower(trim(coalesce(p_slug,'')));
begin
 if auth.uid() is null or not exists(select 1 from public.businesses b where b.id=p_business_id and b.owner_user_id=auth.uid()) then raise exception 'Solo el propietario puede cambiar el enlace del catálogo.'; end if;
 if length(v_slug)<2 or length(v_slug)>60 or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'Usa entre 2 y 60 caracteres: letras sin tildes, números y guiones entre palabras.'; end if;
 if v_slug in ('admin','api','auth','login','signup','settings','catalog','catalogo','productos','ventas','c','assets','sw.js','manifest.webmanifest') then raise exception 'Ese enlace está reservado. Prueba con otra palabra.'; end if;
 if exists(select 1 from public.businesses b where lower(b.slug)=v_slug and b.id<>p_business_id) then raise exception 'Ese enlace ya está en uso. Prueba con una versión diferente.'; end if;
 update public.businesses set slug=v_slug,updated_at=now() where id=p_business_id and owner_user_id=auth.uid();
 return v_slug;
end;$function$;
revoke all on function public.set_business_catalog_slug(uuid,text) from public,anon;
grant execute on function public.set_business_catalog_slug(uuid,text) to authenticated;

create or replace function public.resolve_public_catalog_slug(p_slug text)
returns uuid language plpgsql stable security definer set search_path to 'public','pg_temp' as $function$
declare v_id uuid; v_match_count integer;
begin
 if p_slug is null or length(p_slug)<2 or length(p_slug)>60 or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then return null; end if;
 select b.id into v_id from public.businesses b where lower(b.slug)=p_slug limit 1;
 if v_id is not null then return v_id; end if;
 select count(*),(array_agg(b.id))[1] into v_match_count,v_id from public.businesses b
 where trim(both '-' from regexp_replace(translate(lower(coalesce(nullif(b.settings #>> '{commercial_profile,tradeName}',''),b.name)),'áéíóúüñ','aeiouun'),'[^a-z0-9]+','-','g'))=p_slug;
 if v_match_count=1 then return v_id; end if;
 return null;
end;$function$;
revoke all on function public.resolve_public_catalog_slug(text) from public;
grant execute on function public.resolve_public_catalog_slug(text) to anon,authenticated;

create or replace function public.get_public_catalog(p_business_id uuid,p_limit integer default 12,p_offset integer default 0)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp' as $function$
declare v_business jsonb; v_products jsonb; v_total bigint; v_profile jsonb; v_stock_behavior text;
begin
 if p_business_id is null then return jsonb_build_object('business',null,'products','[]'::jsonb,'total',0); end if;
 if p_limit is null or p_limit<1 or p_limit>24 or p_offset is null or p_offset<0 then raise exception 'La página del catálogo no es válida.'; end if;
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
 v_stock_behavior:=coalesce(v_profile->>'stockVisibility','hide');
 select jsonb_build_object('id',b.id,'name',b.name,'slug',b.slug,'currency_code',b.currency_code,'logo_path',b.logo_path,'theme',b.theme,'commercial_profile',v_profile)
 into v_business from public.businesses b where b.id=p_business_id;
 if v_business is null then return jsonb_build_object('business',null,'products','[]'::jsonb,'total',0); end if;
 select count(*) into v_total from public.products p where p.business_id=p_business_id and p.is_published=true and p.is_sellable=true and p.archived_at is null and (v_stock_behavior<>'hide' or not p.track_inventory or p.stock_on_hand>0);
 select coalesce(jsonb_agg(jsonb_build_object(
   'id',page.id,'name',page.name,'description',page.description,'category_id',page.category_id,'category_name',page.category_name,
   'sale_price_minor',page.sale_price_minor,'unit_name',page.unit_name,'commercial_presentation',page.commercial_presentation,'image_paths',page.image_paths,
   'track_inventory',page.track_inventory,'stock_on_hand',page.stock_on_hand,'is_out_of_stock',(page.track_inventory and page.stock_on_hand<=0),
   'tax_code',coalesce(page.metadata->>'tax_code','none'),'variants',page.variants
 ) order by page.name),'[]'::jsonb) into v_products
 from (
   select p.id,p.name,p.description,p.category_id,c.name as category_name,p.sale_price_minor,p.unit_name,p.commercial_presentation,p.image_paths,p.track_inventory,p.stock_on_hand,p.metadata,
    coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'variant_name',v.variant_name,'variant_value',v.variant_value,'sku',v.sku,'sale_price_minor',v.sale_price_minor,'stock_on_hand',v.stock_on_hand,'is_active',v.is_active,'image_paths',v.image_paths) order by v.variant_name,v.variant_value) from public.product_variants v where v.business_id=p.business_id and v.product_id=p.id and v.is_active=true),'[]'::jsonb) as variants
   from public.products p left join public.product_categories c on c.id=p.category_id and c.business_id=p.business_id
   where p.business_id=p_business_id and p.is_published=true and p.is_sellable=true and p.archived_at is null and (v_stock_behavior<>'hide' or not p.track_inventory or p.stock_on_hand>0)
   order by p.name limit p_limit offset p_offset
 ) page;
 return jsonb_build_object('business',v_business,'products',v_products,'total',v_total,'limit',p_limit,'offset',p_offset);
end;$function$;
revoke all on function public.get_public_catalog(uuid,integer,integer) from public;
grant execute on function public.get_public_catalog(uuid,integer,integer) to anon,authenticated;
