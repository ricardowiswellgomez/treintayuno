-- Convert catalog prices atomically when the business changes its primary currency.
-- Historical sales, purchases, expenses and quotes keep their recorded currency and amounts.
CREATE OR REPLACE FUNCTION public.convert_business_catalog_currency(
  p_business_id uuid, p_target_currency text, p_rate numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $function$
DECLARE
  v_source_currency text;
  v_source_digits integer;
  v_target_digits integer;
  v_minor_factor numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión para cambiar la moneda.'; END IF;
  IF p_target_currency IS NULL OR p_target_currency !~ '^[A-Z]{3}$' THEN
    RAISE EXCEPTION 'La moneda seleccionada no es válida.';
  END IF;
  IF p_rate IS NULL OR p_rate <= 0 OR p_rate > 1000000000 THEN
    RAISE EXCEPTION 'La tasa de conversión debe ser mayor que cero.';
  END IF;
  SELECT b.currency_code INTO v_source_currency
  FROM public.businesses b
  WHERE b.id = p_business_id AND b.owner_user_id = auth.uid()
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solo el propietario puede cambiar la moneda de este negocio.'; END IF;
  IF v_source_currency = p_target_currency THEN RETURN; END IF;
  v_source_digits := CASE v_source_currency
    WHEN 'BIF' THEN 0 WHEN 'CLP' THEN 0 WHEN 'DJF' THEN 0 WHEN 'GNF' THEN 0
    WHEN 'ISK' THEN 0 WHEN 'JPY' THEN 0 WHEN 'KMF' THEN 0 WHEN 'KRW' THEN 0
    WHEN 'PYG' THEN 0 WHEN 'RWF' THEN 0 WHEN 'UGX' THEN 0 WHEN 'UYI' THEN 0
    WHEN 'VND' THEN 0 WHEN 'VUV' THEN 0 WHEN 'XAF' THEN 0 WHEN 'XOF' THEN 0 WHEN 'XPF' THEN 0
    WHEN 'BHD' THEN 3 WHEN 'IQD' THEN 3 WHEN 'JOD' THEN 3 WHEN 'KWD' THEN 3
    WHEN 'LYD' THEN 3 WHEN 'OMR' THEN 3 WHEN 'TND' THEN 3 ELSE 2 END;
  v_target_digits := CASE p_target_currency
    WHEN 'BIF' THEN 0 WHEN 'CLP' THEN 0 WHEN 'DJF' THEN 0 WHEN 'GNF' THEN 0
    WHEN 'ISK' THEN 0 WHEN 'JPY' THEN 0 WHEN 'KMF' THEN 0 WHEN 'KRW' THEN 0
    WHEN 'PYG' THEN 0 WHEN 'RWF' THEN 0 WHEN 'UGX' THEN 0 WHEN 'UYI' THEN 0
    WHEN 'VND' THEN 0 WHEN 'VUV' THEN 0 WHEN 'XAF' THEN 0 WHEN 'XOF' THEN 0 WHEN 'XPF' THEN 0
    WHEN 'BHD' THEN 3 WHEN 'IQD' THEN 3 WHEN 'JOD' THEN 3 WHEN 'KWD' THEN 3
    WHEN 'LYD' THEN 3 WHEN 'OMR' THEN 3 WHEN 'TND' THEN 3 ELSE 2 END;
  v_minor_factor := power(10::numeric, v_target_digits - v_source_digits);
  UPDATE public.products
  SET sale_price_minor = round(sale_price_minor * p_rate * v_minor_factor)::bigint,
      cost_price_minor = round(cost_price_minor * p_rate * v_minor_factor)::bigint,
      updated_at = now()
  WHERE business_id = p_business_id;
  UPDATE public.product_variants
  SET sale_price_minor = round(sale_price_minor * p_rate * v_minor_factor)::bigint,
      updated_at = now()
  WHERE business_id = p_business_id AND sale_price_minor IS NOT NULL;
  UPDATE public.businesses SET currency_code = p_target_currency WHERE id = p_business_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.convert_business_catalog_currency(uuid, text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_business_catalog_currency(uuid, text, numeric) TO authenticated;
