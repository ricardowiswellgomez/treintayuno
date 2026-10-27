-- Resolve stable, readable public catalog URLs such as /wiswellart.
-- Return an ID only when the normalized business name is unique; ambiguous
-- slugs intentionally fail closed rather than opening the wrong business.
create or replace function public.resolve_public_catalog_slug(p_slug text)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $function$
  select case when count(*) = 1 then (array_agg(b.id))[1] else null end
  from public.businesses b
  where p_slug is not null
    and length(p_slug) between 2 and 60
    and p_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and trim(both '-' from regexp_replace(
      translate(
        lower(coalesce(nullif(b.settings #>> '{commercial_profile,tradeName}', ''), b.name)),
        'áéíóúüñ',
        'aeiouun'
      ),
      '[^a-z0-9]+',
      '-',
      'g'
    )) = p_slug;
$function$;

revoke all on function public.resolve_public_catalog_slug(text) from public;
grant execute on function public.resolve_public_catalog_slug(text) to anon, authenticated;
