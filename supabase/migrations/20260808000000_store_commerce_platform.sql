-- Plataforma de comercio: datos financieros verificables + campos dinámicos JSONB.
-- Las credenciales privadas de PayPhone/PayPal NO se almacenan aquí; deben vivir
-- en Supabase Secrets y ser usadas exclusivamente desde Edge Functions.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS cost_price numeric(12,2),
  ADD COLUMN IF NOT EXISTS tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_margin numeric(7,2),
  ADD COLUMN IF NOT EXISTS sold_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{"tags":[],"attributes":{},"specifications":{},"media":[],"price_tiers":[],"custom_fields":{}}'::jsonb;

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.church_settings
  ADD COLUMN IF NOT EXISTS payment_providers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS store_metadata jsonb NOT NULL DEFAULT '{"currency":"USD","prices_include_tax":false}'::jsonb;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_tax_rate_range,
  ADD CONSTRAINT products_tax_rate_range CHECK (tax_rate >= 0 AND tax_rate <= 100),
  DROP CONSTRAINT IF EXISTS products_cost_price_positive,
  ADD CONSTRAINT products_cost_price_positive CHECK (cost_price IS NULL OR cost_price >= 0),
  DROP CONSTRAINT IF EXISTS products_sold_count_positive,
  ADD CONSTRAINT products_sold_count_positive CHECK (sold_count >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique
  ON public.products (lower(sku)) WHERE sku IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS product_variants_sku_unique
  ON public.product_variants (lower(sku)) WHERE sku IS NOT NULL;

-- El precio final se vuelve a validar en servidor al crear la orden.
CREATE OR REPLACE FUNCTION public.store_unit_price(
  product_row public.products,
  requested_quantity integer
) RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  calculated_price numeric;
  tier jsonb;
BEGIN
  calculated_price := COALESCE(
    CASE WHEN product_row.discount_price IS NOT NULL AND product_row.discount_price < product_row.price
      THEN product_row.discount_price ELSE product_row.price END,
    0
  );

  FOR tier IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(product_row.metadata->'price_tiers', '[]'::jsonb))
    WHERE (value->>'min_quantity')::integer <= requested_quantity
    ORDER BY (value->>'min_quantity')::integer ASC
  LOOP
    calculated_price := LEAST(calculated_price, (tier->>'unit_price')::numeric);
  END LOOP;

  RETURN calculated_price;
END;
$$;

COMMENT ON COLUMN public.products.metadata IS
  'JSONB dinámico: tags, attributes, specifications, media, price_tiers y custom_fields.';

COMMENT ON COLUMN public.church_settings.payment_providers IS
  'Configuración pública no sensible. Las credenciales viven en Supabase Secrets.';
