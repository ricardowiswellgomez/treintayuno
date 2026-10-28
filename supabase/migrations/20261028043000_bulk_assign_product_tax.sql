create or replace function public.set_products_tax_code(p_business_id uuid,p_product_ids uuid[],p_tax_code text)
returns integer
language plpgsql
security definer
set search_path to 'public','private','pg_temp'
as $function$
declare v_updated integer;
begin
  if auth.uid() is null or not private.can_access_business(p_business_id,'products_manage') then
    raise exception 'No tienes permiso para cambiar los impuestos de estos productos.';
  end if;
  if p_tax_code not in ('iva_19','iva_5','impoconsumo_8','iva_exento','iva_excluido','none') then
    raise exception 'El impuesto seleccionado no es válido.';
  end if;
  if p_product_ids is null or cardinality(p_product_ids)<1 or cardinality(p_product_ids)>250 then
    raise exception 'Selecciona entre 1 y 250 productos.';
  end if;
  if exists(select 1 from unnest(p_product_ids) as picked(id) where id is null) then
    raise exception 'La selección contiene un producto no válido.';
  end if;
  update public.products p
  set metadata=jsonb_set(coalesce(p.metadata,'{}'::jsonb),'{tax_code}',to_jsonb(p_tax_code),true),
      updated_at=now()
  where p.business_id=p_business_id and p.id=any(p_product_ids) and p.archived_at is null;
  get diagnostics v_updated=row_count;
  if v_updated<>cardinality(p_product_ids) then
    raise exception 'Alguno de los productos seleccionados no pertenece a este negocio o no está disponible.';
  end if;
  return v_updated;
end;
$function$;
revoke all on function public.set_products_tax_code(uuid,uuid[],text) from public,anon;
grant execute on function public.set_products_tax_code(uuid,uuid[],text) to authenticated;