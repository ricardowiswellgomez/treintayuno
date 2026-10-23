create or replace function public.upsert_business_employee(
  p_business_id uuid,
  p_email text,
  p_permissions jsonb default '{}'::jsonb
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_target_user uuid;
  v_existing_role public.business_member_role;
  v_permissions jsonb := '{}'::jsonb;
  v_allowed text[] := array['products_view','products_manage','sales_view','sales_manage','customers_view','customers_manage','purchases_view','purchases_manage','suppliers_view','suppliers_manage','expenses_view','expenses_manage'];
  v_key text;
  v_value jsonb;
begin
  if v_actor is null or not private.can_manage_members(p_business_id) then raise exception 'No tienes permiso para administrar el equipo de este negocio.'; end if;
  if p_email is null or length(btrim(p_email)) < 5 or position('@' in btrim(p_email)) < 2 then raise exception 'Escribe un correo electrónico válido.'; end if;
  if p_permissions is null then p_permissions := '{}'::jsonb; end if;
  if jsonb_typeof(p_permissions) <> 'object' then raise exception 'Los permisos deben enviarse como opciones válidas.'; end if;
  for v_key, v_value in select key, value from jsonb_each(p_permissions) loop
    if not (v_key = any(v_allowed)) then raise exception 'Se ha solicitado un permiso que no existe.'; end if;
    if jsonb_typeof(v_value) <> 'boolean' then raise exception 'Cada permiso debe ser verdadero o falso.'; end if;
    if (v_value #>> '{}')::boolean then v_permissions := v_permissions || jsonb_build_object(v_key, true); end if;
  end loop;
  if coalesce((v_permissions->>'products_manage')::boolean, false) then v_permissions := v_permissions || '{"products_view":true}'::jsonb; end if;
  if coalesce((v_permissions->>'sales_view')::boolean, false) then v_permissions := v_permissions || '{"products_view":true,"customers_view":true}'::jsonb; end if;
  if coalesce((v_permissions->>'sales_manage')::boolean, false) then v_permissions := v_permissions || '{"sales_view":true,"products_view":true,"customers_view":true}'::jsonb; end if;
  if coalesce((v_permissions->>'customers_manage')::boolean, false) then v_permissions := v_permissions || '{"customers_view":true}'::jsonb; end if;
  if coalesce((v_permissions->>'purchases_view')::boolean, false) then v_permissions := v_permissions || '{"suppliers_view":true,"products_view":true}'::jsonb; end if;
  if coalesce((v_permissions->>'purchases_manage')::boolean, false) then v_permissions := v_permissions || '{"purchases_view":true,"suppliers_view":true,"suppliers_manage":true,"products_view":true,"products_manage":true}'::jsonb; end if;
  if coalesce((v_permissions->>'suppliers_manage')::boolean, false) then v_permissions := v_permissions || '{"suppliers_view":true}'::jsonb; end if;
  if coalesce((v_permissions->>'expenses_view')::boolean, false) then v_permissions := v_permissions || '{"suppliers_view":true}'::jsonb; end if;
  if coalesce((v_permissions->>'expenses_manage')::boolean, false) then v_permissions := v_permissions || '{"expenses_view":true,"suppliers_view":true}'::jsonb; end if;
  select au.id into v_target_user from auth.users au where lower(au.email)=lower(btrim(p_email)) order by au.created_at asc limit 1;
  if v_target_user is null then raise exception 'Ese correo aún no tiene cuenta en Treintayuno. La persona debe registrarse primero.'; end if;
  if v_target_user = v_actor then raise exception 'No puedes añadir tu propia cuenta como colaborador.'; end if;
  select bm.role into v_existing_role from public.business_members bm where bm.business_id=p_business_id and bm.user_id=v_target_user for update;
  if found then
    if v_existing_role in ('owner'::public.business_member_role,'admin'::public.business_member_role) then raise exception 'No se pueden cambiar permisos de un propietario o administrador desde este formulario.'; end if;
    update public.business_members set role='employee'::public.business_member_role,permissions=v_permissions where business_id=p_business_id and user_id=v_target_user;
  else
    insert into public.business_members(business_id,user_id,role,permissions,invited_by,joined_at) values(p_business_id,v_target_user,'employee'::public.business_member_role,v_permissions,v_actor,now());
  end if;
  return v_target_user;
end; $$;
revoke all on function public.upsert_business_employee(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.upsert_business_employee(uuid,text,jsonb) to authenticated;