-- The public catalog and checkout details must stay unavailable while the
-- public store feature is hidden. Missing visibility rows are treated as off.
DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Public read active products"
  ON public.products FOR SELECT TO public
  USING (
    is_active IS TRUE
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.site_feature_visibility visibility
      WHERE visibility.feature_key = 'store'
        AND visibility.is_enabled IS TRUE
    )
  );

DROP POLICY IF EXISTS "Public read variants of active products" ON public.product_variants;
CREATE POLICY "Public read variants of active products"
  ON public.product_variants FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.products product
      JOIN public.site_feature_visibility visibility
        ON visibility.feature_key = 'store'
       AND visibility.is_enabled IS TRUE
      WHERE product.id = product_variants.product_id
        AND product.is_active IS TRUE
        AND product.deleted_at IS NULL
    )
  );

CREATE OR REPLACE FUNCTION private.public_store_checkout_options()
RETURNS TABLE (enabled boolean, transfer_fee_percent numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT settings.enabled,
    COALESCE((
      SELECT (method.value ->> 'fee_percent')::numeric
      FROM jsonb_array_elements(church.payment_methods) method(value)
      WHERE method.value ->> 'id' = 'transfer'
        AND method.value ->> 'active' = 'true'
      LIMIT 1
    ), 0::numeric)
  FROM private.store_checkout_settings settings
  JOIN public.church_settings church ON church.id = 1
  WHERE settings.id
    AND EXISTS (
      SELECT 1
      FROM public.site_feature_visibility visibility
      WHERE visibility.feature_key = 'store'
        AND visibility.is_enabled IS TRUE
    );
$$;

CREATE OR REPLACE FUNCTION private.public_store_pickup_options()
RETURNS TABLE (
  pickup_name text,
  pickup_days jsonb,
  pickup_start text,
  pickup_end text,
  pickup_notes text,
  timezone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    settings.config ->> 'pickup_name',
    settings.config -> 'pickup_days',
    settings.config ->> 'pickup_start',
    settings.config ->> 'pickup_end',
    settings.config ->> 'pickup_notes',
    settings.config ->> 'timezone'
  FROM private.store_operation_settings settings
  WHERE settings.id
    AND EXISTS (
      SELECT 1
      FROM public.site_feature_visibility visibility
      WHERE visibility.feature_key = 'store'
        AND visibility.is_enabled IS TRUE
    );
$$;
