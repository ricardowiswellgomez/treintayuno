create or replace function public.get_business_member_names(p_business_id uuid)
returns table(user_id uuid, display_name text, role text)
language plpgsql
stable
security definer
set search_path to 'public','private','pg_temp'
as $function$
begin
  if auth.uid() is null or not private.can_access_business(p_business_id,'sales_view') then
    raise exception 'No tienes permiso para consultar el equipo de este negocio.';
  end if;
  return query
    select bm.user_id,
      coalesce(nullif(btrim(p.display_name),''),'Usuario del negocio')::text,
      bm.role::text
    from public.business_members bm
    left join public.profiles p on p.user_id=bm.user_id
    where bm.business_id=p_business_id;
end;
$function$;
revoke all on function public.get_business_member_names(uuid) from public,anon;
grant execute on function public.get_business_member_names(uuid) to authenticated;