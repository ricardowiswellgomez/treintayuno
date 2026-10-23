
-- Route financial and inventory mutations through validated transactional functions.
CREATE OR REPLACE FUNCTION public.create_product_with_opening_stock(p_business_id uuid, p_name text, p_category_id uuid DEFAULT NULL::uuid, p_sku text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_product_type text DEFAULT 'physical'::text, p_unit_name text DEFAULT 'unidad'::text, p_sale_price_minor bigint DEFAULT 0, p_cost_price_minor bigint DEFAULT 0, p_opening_stock numeric DEFAULT 0, p_low_stock_threshold numeric DEFAULT NULL::numeric, p_commercial_presentation text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
DECLARE
  v_product_id uuid;
  v_opening numeric := coalesce(p_opening_stock, 0);
BEGIN
  IF NOT private.can_access_business(p_business_id, 'products_manage') THEN
    RAISE EXCEPTION 'No tienes permiso para administrar productos de este negocio.';
  END IF;
  IF nullif(trim(p_name), '') IS NULL THEN RAISE EXCEPTION 'Escribe el nombre del producto.'; END IF;
  IF p_product_type NOT IN ('physical','service','digital') THEN RAISE EXCEPTION 'Tipo de producto no válido.'; END IF;
  IF coalesce(p_sale_price_minor,0) < 0 OR coalesce(p_cost_price_minor,0) < 0 THEN RAISE EXCEPTION 'Los precios no pueden ser negativos.'; END IF;
  IF v_opening < 0 THEN RAISE EXCEPTION 'Las existencias iniciales no pueden ser negativas.'; END IF;
  IF p_product_type <> 'physical' THEN v_opening := 0; END IF;

  INSERT INTO public.products (
    business_id, category_id, sku, name, description, product_type, unit_name,
    sale_price_minor, cost_price_minor, stock_on_hand, low_stock_threshold, track_inventory,
    commercial_presentation
  ) VALUES (
    p_business_id, p_category_id, nullif(trim(p_sku), ''), trim(p_name), nullif(trim(p_description), ''),
    p_product_type, coalesce(nullif(trim(p_unit_name), ''), 'unidad'),
    coalesce(p_sale_price_minor,0), coalesce(p_cost_price_minor,0), v_opening,
    p_low_stock_threshold, p_product_type = 'physical',
    nullif(trim(p_commercial_presentation), '')
  ) RETURNING id INTO v_product_id;

  IF v_opening > 0 THEN
    INSERT INTO public.stock_movements (business_id, product_id, movement_type, quantity_delta, notes, created_by)
    VALUES (p_business_id, v_product_id, 'opening', v_opening, 'Existencias iniciales', auth.uid());
  END IF;
  RETURN v_product_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.adjust_product_stock(p_business_id uuid, p_product_id uuid, p_quantity_delta numeric, p_notes text DEFAULT NULL::text)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
declare
  v_current numeric;
  v_next numeric;
  v_type text;
begin
  if not private.can_access_business(p_business_id, 'products_manage') then
    raise exception 'No tienes permiso para modificar existencias de este negocio.';
  end if;
  if p_quantity_delta is null or p_quantity_delta = 0 then raise exception 'Indica una cantidad distinta de cero.'; end if;
  select stock_on_hand into v_current
  from public.products
  where id = p_product_id and business_id = p_business_id and track_inventory = true
  for update;
  if not found then raise exception 'No encontramos un producto con inventario en este negocio.'; end if;
  v_next := v_current + p_quantity_delta;
  if v_next < 0 then raise exception 'No puedes dejar las existencias por debajo de cero.'; end if;
  update public.products set stock_on_hand = v_next, updated_at = now()
  where id = p_product_id and business_id = p_business_id;
  v_type := case when p_quantity_delta > 0 then 'adjustment_in' else 'adjustment_out' end;
  insert into public.stock_movements (business_id, product_id, movement_type, quantity_delta, notes, created_by)
  values (p_business_id, p_product_id, v_type, p_quantity_delta, nullif(trim(p_notes), ''), auth.uid());
  return v_next;
end;
$function$;

revoke all privileges on table public.sales, public.sale_items,
  public.purchases, public.purchase_items, public.stock_movements,
  public.products
from anon, authenticated;

grant select on table public.sales, public.sale_items,
  public.purchases, public.purchase_items, public.stock_movements,
  public.products
to authenticated;

-- Product edits remain possible, but stock is only changed by RPCs that append movements.
grant update (
  name, category_id, description, commercial_presentation, unit_name,
  sale_price_minor, cost_price_minor, low_stock_threshold,
  is_sellable, is_published, archived_at
) on table public.products to authenticated;

drop policy if exists sales_insert_by_permission on public.sales;
drop policy if exists sales_update_by_permission on public.sales;
drop policy if exists sales_delete_by_permission on public.sales;

drop policy if exists sale_items_insert_by_permission on public.sale_items;
drop policy if exists sale_items_update_by_permission on public.sale_items;
drop policy if exists sale_items_delete_by_permission on public.sale_items;

drop policy if exists purchases_insert_by_permission on public.purchases;
drop policy if exists purchases_update_by_permission on public.purchases;
drop policy if exists purchases_delete_by_permission on public.purchases;

drop policy if exists purchase_items_insert_by_permission on public.purchase_items;
drop policy if exists purchase_items_update_by_permission on public.purchase_items;
drop policy if exists purchase_items_delete_by_permission on public.purchase_items;

drop policy if exists stock_movements_insert_by_permission on public.stock_movements;
drop policy if exists stock_movements_update_by_permission on public.stock_movements;
drop policy if exists stock_movements_delete_by_permission on public.stock_movements;

notify pgrst, 'reload schema';
