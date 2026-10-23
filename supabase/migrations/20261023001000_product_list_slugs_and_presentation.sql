-- Treintayuno: ampliar la ficha de producto para la tabla de datos.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS commercial_presentation text;

CREATE OR REPLACE FUNCTION private.assign_product_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_base text;
BEGIN
  IF TG_OP = 'INSERT' AND NULLIF(btrim(NEW.slug), '') IS NULL THEN
    v_base := translate(lower(btrim(coalesce(NEW.name, 'producto'))), 'áéíóúüñ', 'aeiouun');
    v_base := regexp_replace(v_base, '[^a-z0-9]+', '-', 'g');
    v_base := trim(both '-' from v_base);
    IF v_base = '' THEN v_base := 'producto'; END IF;
    NEW.slug := left(v_base, 80) || '-' || substr(replace(NEW.id::text, '-', ''), 1, 8);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS products_assign_slug ON public.products;
CREATE TRIGGER products_assign_slug
BEFORE INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION private.assign_product_slug();

UPDATE public.products
SET slug = (
  left(
    trim(both '-' from regexp_replace(
      regexp_replace(translate(lower(btrim(coalesce(name, 'producto'))), 'áéíóúüñ', 'aeiouun'), '[^a-z0-9]+', '-', 'g'),
      '(^-+|-+$)', '', 'g'
    )),
    80
  ) || '-' || substr(replace(id::text, '-', ''), 1, 8)
)
WHERE slug IS NULL OR btrim(slug) = '';

ALTER TABLE public.products ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS products_business_slug_uidx
  ON public.products (business_id, slug);

-- Nueva presentación opcional dentro de la misma transacción de alta de producto.
DROP FUNCTION IF EXISTS public.create_product_with_opening_stock(uuid, text, uuid, text, text, text, text, bigint, bigint, numeric, numeric);

CREATE FUNCTION public.create_product_with_opening_stock(
  p_business_id uuid,
  p_name text,
  p_category_id uuid DEFAULT NULL,
  p_sku text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_product_type text DEFAULT 'physical',
  p_unit_name text DEFAULT 'unidad',
  p_sale_price_minor bigint DEFAULT 0,
  p_cost_price_minor bigint DEFAULT 0,
  p_opening_stock numeric DEFAULT 0,
  p_low_stock_threshold numeric DEFAULT NULL,
  p_commercial_presentation text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path TO 'public', 'private'
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

REVOKE ALL ON FUNCTION public.create_product_with_opening_stock(uuid, text, uuid, text, text, text, text, bigint, bigint, numeric, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_product_with_opening_stock(uuid, text, uuid, text, text, text, text, bigint, bigint, numeric, numeric, text) TO authenticated;
