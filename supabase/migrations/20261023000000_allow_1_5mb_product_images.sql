-- Treintayuno: permitir fotos WebP optimizadas de hasta 1,5 MB.
-- La imagen original que se elige desde el dispositivo no debe superar 5 MB;
-- esa validación se realiza en el frontend antes de convertirla.

ALTER TABLE public.product_images
  DROP CONSTRAINT IF EXISTS product_images_image_size_bytes_check,
  DROP CONSTRAINT IF EXISTS product_images_data_check;

ALTER TABLE public.product_images
  ADD CONSTRAINT product_images_image_size_bytes_check
    CHECK (image_size_bytes BETWEEN 1 AND 1500000),
  ADD CONSTRAINT product_images_data_check
    CHECK (length(image_data) > 100 AND length(image_data) <= 2000000);

CREATE OR REPLACE FUNCTION public.add_product_image_db(
  p_business_id uuid,
  p_product_id uuid,
  p_image_data text,
  p_image_size_bytes integer
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $function$
declare
  v_paths text[];
  v_key text;
begin
  if auth.uid() is null or not private.can_access_business(p_business_id, 'products_manage') then
    raise exception 'No tienes permiso para administrar las fotos de este negocio.';
  end if;

  if p_image_data is null or p_image_data !~ '^[A-Za-z0-9+/]+={0,2}$' then
    raise exception 'La foto no tiene un formato válido.';
  end if;

  if p_image_size_bytes is null or p_image_size_bytes < 1 or p_image_size_bytes > 1500000
     or length(p_image_data) > 2000000 then
    raise exception 'La foto optimizada debe pesar 1,5 MB o menos.';
  end if;

  -- btoa() produces standard base64: four characters per three source bytes.
  if length(p_image_data) <> (4 * ceil(p_image_size_bytes / 3.0))::integer then
    raise exception 'Los datos de la foto no coinciden con su tamaño.';
  end if;

  select image_paths into v_paths
    from public.products
    where id = p_product_id and business_id = p_business_id
    for update;

  if not found then raise exception 'Producto no encontrado o sin permiso.'; end if;
  v_paths := coalesce(v_paths, array[]::text[]);

  if cardinality(v_paths) >= 3 then
    raise exception 'Cada producto puede tener como máximo tres fotos.';
  end if;

  v_key := p_business_id::text || '/' || p_product_id::text || '/' || gen_random_uuid()::text || '.webp';

  insert into public.product_images(
    image_key, business_id, product_id, image_data, image_size_bytes, content_type, created_by
  ) values (
    v_key, p_business_id, p_product_id, p_image_data, p_image_size_bytes, 'image/webp', auth.uid()
  );

  update public.products
    set image_paths = array_append(v_paths, v_key), updated_at = now()
    where id = p_product_id and business_id = p_business_id;

  return v_key;
end;
$function$;
