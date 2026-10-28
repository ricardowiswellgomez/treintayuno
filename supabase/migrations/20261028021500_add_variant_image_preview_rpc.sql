create or replace function public.get_product_variant_image_db(
 p_business_id uuid,p_product_id uuid,p_variant_id uuid,p_image_key text
) returns table(content_type text,image_data text)
language plpgsql stable security definer set search_path to 'public','private','pg_temp'
as $function$
begin
 if auth.uid() is null or not private.can_access_business(p_business_id,'products_view') then
  raise exception 'No tienes permiso para ver estas fotos.';
 end if;
 return query
 select i.content_type,i.image_data
 from public.product_images i
 join public.product_variants v on v.id=i.variant_id and v.business_id=i.business_id and v.product_id=i.product_id
 where i.business_id=p_business_id and i.product_id=p_product_id and i.variant_id=p_variant_id
 and i.image_key=p_image_key and p_image_key=any(v.image_paths) and i.content_type='image/webp'
 limit 1;
end;$function$;
revoke all on function public.get_product_variant_image_db(uuid,uuid,uuid,text) from public,anon;
grant execute on function public.get_product_variant_image_db(uuid,uuid,uuid,text) to authenticated;
