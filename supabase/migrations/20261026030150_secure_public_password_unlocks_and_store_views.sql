-- Keep private store data and password-protected content behind narrow, reviewed
-- database functions while public views follow the caller's RLS policies.

CREATE TABLE IF NOT EXISTS private.public_password_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  resource_kind text NOT NULL CHECK (resource_kind IN ('ministry_page', 'editorial_document')),
  resource_id uuid NOT NULL,
  client_ip_hash text NOT NULL CHECK (client_ip_hash ~ '^[0-9a-f]{64}$'),
  attempted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE private.public_password_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.public_password_attempts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE private.public_password_attempts_id_seq FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS public_password_attempts_lookup_idx
  ON private.public_password_attempts (resource_kind, resource_id, client_ip_hash, attempted_at DESC);
CREATE INDEX IF NOT EXISTS public_password_attempts_cleanup_idx
  ON private.public_password_attempts (attempted_at);

CREATE OR REPLACE FUNCTION private.current_request_ip_hash()
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  forwarded_for text;
  client_ip text;
BEGIN
  forwarded_for := nullif(current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for', '');
  client_ip := nullif(btrim(split_part(COALESCE(forwarded_for, ''), ',', 1)), '');

  IF client_ip IS NULL THEN
    RAISE EXCEPTION 'No se pudo verificar el origen de la solicitud.' USING ERRCODE = '42501';
  END IF;

  BEGIN
    client_ip := client_ip::inet::text;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'No se pudo verificar el origen de la solicitud.' USING ERRCODE = '42501';
  END;

  RETURN encode(extensions.digest(convert_to(client_ip, 'UTF8'), 'sha256'), 'hex');
END;
$$;

COMMENT ON FUNCTION private.current_request_ip_hash() IS
  'Returns a SHA-256 pseudonym for the trusted client IP supplied in Supabase PostgREST X-Forwarded-For headers.';
REVOKE ALL ON FUNCTION private.current_request_ip_hash() FROM PUBLIC, anon, authenticated;

-- This legacy verifier is not routed anywhere in the current application.
-- Public certificate verification uses opaque certificate validation codes instead.
ALTER FUNCTION public.verify_student_status(uuid) SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.verify_student_status(uuid) FROM PUBLIC, anon, authenticated;

-- Anonymous reads must only include products and variants that are actually
-- visible in the public catalog. The existing admin policy continues to allow
-- authorized staff to read inactive records.
DROP POLICY IF EXISTS "Consolidated read access" ON public.products;
CREATE POLICY "Public read active products"
  ON public.products FOR SELECT TO public
  USING (is_active IS TRUE AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Consolidated read access" ON public.product_variants;
CREATE POLICY "Public read variants of active products"
  ON public.product_variants FOR SELECT TO public
  USING (EXISTS (
    SELECT 1
    FROM public.products product
    WHERE product.id = product_variants.product_id
      AND product.is_active IS TRUE
      AND product.deleted_at IS NULL
  ));

CREATE OR REPLACE FUNCTION private.available_public_product_stock(p_product_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT GREATEST(0::bigint, product.stock - COALESCE(sum(reservation.quantity), 0::bigint))::integer
  FROM public.products product
  LEFT JOIN private.store_reservations reservation
    ON reservation.product_id = product.id
   AND reservation.variant_id IS NULL
   AND (reservation.state = 'held' OR (reservation.state = 'active' AND reservation.expires_at > now()))
  WHERE product.id = p_product_id
    AND product.is_active IS TRUE
    AND product.deleted_at IS NULL
  GROUP BY product.id;
$$;

CREATE OR REPLACE FUNCTION private.available_public_variant_stock(p_product_id uuid, p_variant_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT GREATEST(0::bigint, variant.stock - COALESCE(sum(reservation.quantity), 0::bigint))::integer
  FROM public.product_variants variant
  JOIN public.products product ON product.id = variant.product_id
  LEFT JOIN private.store_reservations reservation
    ON reservation.variant_id = variant.id
   AND (reservation.state = 'held' OR (reservation.state = 'active' AND reservation.expires_at > now()))
  WHERE product.id = p_product_id
    AND variant.id = p_variant_id
    AND product.is_active IS TRUE
    AND product.deleted_at IS NULL
  GROUP BY variant.id;
$$;

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
  WHERE settings.id;
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
  WHERE settings.id;
$$;

REVOKE ALL ON FUNCTION private.available_public_product_stock(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.available_public_variant_stock(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.public_store_checkout_options() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.public_store_pickup_options() FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO anon, authenticated;
-- Existing internal-read RLS policies call this helper even for anonymous
-- queries. It returns false without auth.uid(), allowing the public RLS policy
-- to be evaluated without granting anonymous administrative visibility.
GRANT EXECUTE ON FUNCTION private.current_user_has_admin_permission(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.available_public_product_stock(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.available_public_variant_stock(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.public_store_checkout_options() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.public_store_pickup_options() TO anon, authenticated;

CREATE OR REPLACE VIEW public.store_catalog
WITH (security_barrier = true, security_invoker = true)
AS
SELECT
  product.id,
  product.name,
  product.description,
  product.price,
  product.discount_price,
  product.promo_tag,
  product.sku,
  product.tax_rate,
  product.sold_count,
  product.is_active,
  product.thumbnail_url,
  product.image_url,
  product.category,
  product.type,
  product.ecommerce_product_type,
  product.features,
  product.cover_image_url,
  product.deleted_at,
  product.created_at,
  jsonb_build_object(
    'tags', product.metadata -> 'tags',
    'media', product.metadata -> 'media',
    'attributes', product.metadata -> 'attributes',
    'specifications', product.metadata -> 'specifications',
    'price_tiers', product.metadata -> 'price_tiers'
  ) AS metadata,
  private.available_public_product_stock(product.id) AS stock,
  COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', variant.id,
      'product_id', variant.product_id,
      'color_name', variant.color_name,
      'color_hex', variant.color_hex,
      'size', variant.size,
      'cloudinary_image_url', variant.cloudinary_image_url,
      'sku', variant.sku,
      'stock', private.available_public_variant_stock(product.id, variant.id),
      'price_adjustment', variant.price_adjustment
    ) ORDER BY variant.id)
    FROM public.product_variants variant
    WHERE variant.product_id = product.id
  ), '[]'::jsonb) AS product_variants
FROM public.products product
WHERE product.is_active IS TRUE
  AND product.deleted_at IS NULL;

CREATE OR REPLACE VIEW public.store_checkout_options
WITH (security_barrier = true, security_invoker = true)
AS
SELECT options.enabled, options.transfer_fee_percent
FROM private.public_store_checkout_options() options;

CREATE OR REPLACE VIEW public.store_pickup_options
WITH (security_barrier = true, security_invoker = true)
AS
SELECT
  options.pickup_name,
  options.pickup_days,
  options.pickup_start,
  options.pickup_end,
  options.pickup_notes,
  options.timezone
FROM private.public_store_pickup_options() options;

-- Password checks are recorded against Supabase's trusted X-Forwarded-For IP,
-- never the caller-controlled browser UUID. Eight failures per resource/IP in
-- 15 minutes trigger a temporary block.
CREATE OR REPLACE FUNCTION public.unlock_editorial_document(
  p_document_id uuid,
  p_password text,
  p_client_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  document_row public.editorial_documents%ROWTYPE;
  v_client_ip_hash text;
  new_token uuid;
  new_expiry timestamptz := now() + interval '12 hours';
BEGIN
  SELECT document.* INTO document_row
  FROM public.editorial_documents document
  JOIN public.editorial_spaces space ON space.id = document.space_id
  WHERE document.id = p_document_id
    AND document.status = 'published'
    AND document.visibility = 'password'
    AND space.is_published;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid');
  END IF;

  v_client_ip_hash := private.current_request_ip_hash();
  PERFORM pg_advisory_xact_lock(hashtextextended('editorial_document:' || p_document_id::text || ':' || v_client_ip_hash, 0));

  DELETE FROM private.public_password_attempts
  WHERE id IN (
    SELECT attempt.id
    FROM private.public_password_attempts attempt
    WHERE attempt.attempted_at < now() - interval '1 day'
    ORDER BY attempt.attempted_at
    LIMIT 100
  );

  IF (SELECT count(*)
      FROM private.public_password_attempts attempt
      WHERE attempt.resource_kind = 'editorial_document'
        AND attempt.resource_id = p_document_id
        AND attempt.client_ip_hash = v_client_ip_hash
        AND attempt.attempted_at > now() - interval '15 minutes') >= 8 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'rate_limited');
  END IF;

  IF extensions.crypt(p_password, document_row.password_hash) IS DISTINCT FROM document_row.password_hash THEN
    INSERT INTO private.public_password_attempts (resource_kind, resource_id, client_ip_hash)
    VALUES ('editorial_document', p_document_id, v_client_ip_hash);
    RETURN jsonb_build_object('success', false, 'reason', 'incorrect');
  END IF;

  DELETE FROM private.public_password_attempts
  WHERE resource_kind = 'editorial_document'
    AND resource_id = p_document_id
    AND client_ip_hash = v_client_ip_hash;
  DELETE FROM public.editorial_access_sessions WHERE expires_at <= now();
  INSERT INTO public.editorial_access_sessions (document_id, expires_at)
  VALUES (p_document_id, new_expiry)
  RETURNING token INTO new_token;

  RETURN jsonb_build_object('success', true, 'token', new_token, 'expires_at', new_expiry);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ministry_page_content(p_page_id uuid, p_password text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_page public.ministry_pages%ROWTYPE;
  target_content public.ministry_page_contents%ROWTYPE;
  stored_hash text;
  v_client_ip_hash text;
BEGIN
  SELECT * INTO target_page
  FROM public.ministry_pages
  WHERE id = p_page_id AND status = 'published';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Página no disponible.' USING ERRCODE = 'P0002';
  END IF;

  IF target_page.is_password_protected THEN
    v_client_ip_hash := private.current_request_ip_hash();
    PERFORM pg_advisory_xact_lock(hashtextextended('ministry_page:' || p_page_id::text || ':' || v_client_ip_hash, 0));

    DELETE FROM private.public_password_attempts
    WHERE id IN (
      SELECT attempt.id
      FROM private.public_password_attempts attempt
      WHERE attempt.attempted_at < now() - interval '1 day'
      ORDER BY attempt.attempted_at
      LIMIT 100
    );

    IF (SELECT count(*)
        FROM private.public_password_attempts attempt
        WHERE attempt.resource_kind = 'ministry_page'
          AND attempt.resource_id = p_page_id
          AND attempt.client_ip_hash = v_client_ip_hash
          AND attempt.attempted_at > now() - interval '15 minutes') >= 8 THEN
      RETURN jsonb_build_object('error', 'rate_limited');
    END IF;

    SELECT secret.password_hash INTO stored_hash
    FROM private.ministry_page_secrets secret
    WHERE secret.page_id = p_page_id;
    IF stored_hash IS NULL OR p_password IS NULL
      OR extensions.crypt(p_password, stored_hash) <> stored_hash THEN
      INSERT INTO private.public_password_attempts (resource_kind, resource_id, client_ip_hash)
      VALUES ('ministry_page', p_page_id, v_client_ip_hash);
      RETURN jsonb_build_object('error', 'incorrect');
    END IF;

    DELETE FROM private.public_password_attempts
    WHERE resource_kind = 'ministry_page'
      AND resource_id = p_page_id
      AND client_ip_hash = v_client_ip_hash;
  END IF;

  SELECT * INTO target_content
  FROM public.ministry_page_contents
  WHERE page_id = p_page_id;

  RETURN jsonb_build_object(
    'content_blocks', COALESCE(target_content.content_blocks, '[]'::jsonb),
    'gallery', COALESCE(target_content.gallery, '[]'::jsonb),
    'updated_at', target_content.updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.unlock_editorial_document(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_editorial_document(uuid, text, uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.get_ministry_page_content(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ministry_page_content(uuid, text) TO anon, authenticated;
