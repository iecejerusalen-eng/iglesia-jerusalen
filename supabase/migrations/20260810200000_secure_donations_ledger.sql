-- Migration: Secure Donations Ledger, Receipt Number Sequence, Audit Logging and Storage
-- Created: 2026-08-10

-- -----------------------------------------------------------------------------
-- 1. ADD COLUMNS TO PUBLIC.DONATIONS
-- -----------------------------------------------------------------------------
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS receipt_number text,
  ADD COLUMN IF NOT EXISTS proof_url text,
  ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS donor_phone text,
  ADD COLUMN IF NOT EXISTS currency varchar(3) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES public.members(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'donations_receipt_number_key'
  ) THEN
    ALTER TABLE public.donations ADD CONSTRAINT donations_receipt_number_key UNIQUE (receipt_number);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_donations_member_id ON public.donations(member_id);

-- -----------------------------------------------------------------------------
-- 2. RECEIPT NUMBER SEQUENCE, GENERATOR FUNCTION AND INSERT TRIGGER
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.donation_receipt_seq START WITH 1001;

CREATE OR REPLACE FUNCTION public.generate_donation_receipt_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_val bigint;
BEGIN
  next_val := nextval('public.donation_receipt_seq');
  RETURN 'REC-2026-' || lpad(next_val::text, 6, '0');
END;
$$;

ALTER TABLE public.donations 
  ALTER COLUMN receipt_number SET DEFAULT public.generate_donation_receipt_number();

CREATE OR REPLACE FUNCTION public.assign_donation_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := public.generate_donation_receipt_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_donation_receipt_number_trigger ON public.donations;
CREATE TRIGGER set_donation_receipt_number_trigger
  BEFORE INSERT ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_donation_receipt_number();

-- -----------------------------------------------------------------------------
-- 3. AUDIT LOGS TABLE FOR DONATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.donation_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action varchar(50) NOT NULL,
  previous_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donation_audit_logs_donation_id ON public.donation_audit_logs(donation_id);
CREATE INDEX IF NOT EXISTS idx_donation_audit_logs_created_at ON public.donation_audit_logs(created_at DESC);

-- -----------------------------------------------------------------------------
-- 4. AFTER UPDATE TRIGGER TO RECORD AUDIT LOG ENTRIES
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_donation_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_actor uuid;
  client_ip text;
BEGIN
  SELECT id INTO current_actor
  FROM public.profiles
  WHERE id = auth.uid();

  BEGIN
    client_ip := inet_client_addr()::text;
    IF client_ip IS NULL THEN
      client_ip := nullif(current_setting('request.headers', true)::json->>'x-forwarded-for', '');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    client_ip := NULL;
  END;

  INSERT INTO public.donation_audit_logs (
    donation_id,
    actor_id,
    action,
    previous_data,
    new_data,
    ip_address,
    created_at
  ) VALUES (
    NEW.id,
    current_actor,
    'UPDATE',
    to_jsonb(OLD),
    to_jsonb(NEW),
    client_ip,
    now()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_donation_changes_trigger ON public.donations;
CREATE TRIGGER audit_donation_changes_trigger
  AFTER UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_donation_changes();

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) FOR DONATION AUDIT LOGS
-- -----------------------------------------------------------------------------
ALTER TABLE public.donation_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de auditoria a personal financiero" ON public.donation_audit_logs;
CREATE POLICY "Permitir lectura de auditoria a personal financiero"
  ON public.donation_audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles profile
      LEFT JOIN public.role_permissions permission ON permission.role::text = profile.role::text
      WHERE profile.id = (SELECT auth.uid())
        AND (
          profile.role::text IN ('admin', 'superadmin', 'pastor', 'secretary', 'secretaria')
          OR COALESCE((permission.permissions->'finances'->>'view')::boolean, false) = true
          OR COALESCE((permission.permissions->'finances'->>'edit')::boolean, false) = true
          OR COALESCE((permission.permissions->>'finances')::boolean, false) = true
        )
    )
  );

-- Direct INSERT / UPDATE / DELETE are intentionally disabled for authenticated and public users.
-- Only database triggers (SECURITY DEFINER) write to donation_audit_logs.

-- -----------------------------------------------------------------------------
-- 6. STORAGE BUCKET AND RLS POLICIES FOR DONATION PROOFS
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'donation-proofs',
  'donation-proofs',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Public inserts for donation proofs
DROP POLICY IF EXISTS "Permitir carga publica de comprobantes de donacion" ON storage.objects;
CREATE POLICY "Permitir carga publica de comprobantes de donacion"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'donation-proofs');

-- Authenticated finance users SELECT access to donation proofs
DROP POLICY IF EXISTS "Permitir lectura de comprobantes de donacion a personal financiero" ON storage.objects;
CREATE POLICY "Permitir lectura de comprobantes de donacion a personal financiero"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'donation-proofs' AND EXISTS (
      SELECT 1 FROM public.profiles profile
      LEFT JOIN public.role_permissions permission ON permission.role::text = profile.role::text
      WHERE profile.id = (SELECT auth.uid())
        AND (
          profile.role::text IN ('admin', 'superadmin', 'pastor', 'secretary', 'secretaria')
          OR COALESCE((permission.permissions->'finances'->>'view')::boolean, false) = true
          OR COALESCE((permission.permissions->'finances'->>'edit')::boolean, false) = true
          OR COALESCE((permission.permissions->>'finances')::boolean, false) = true
        )
    )
  );

-- Authenticated finance users UPDATE access to donation proofs
DROP POLICY IF EXISTS "Permitir gestion de comprobantes de donacion a personal financiero" ON storage.objects;
CREATE POLICY "Permitir gestion de comprobantes de donacion a personal financiero"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'donation-proofs' AND EXISTS (
      SELECT 1 FROM public.profiles profile
      LEFT JOIN public.role_permissions permission ON permission.role::text = profile.role::text
      WHERE profile.id = (SELECT auth.uid())
        AND (
          profile.role::text IN ('admin', 'superadmin', 'pastor', 'secretary', 'secretaria')
          OR COALESCE((permission.permissions->'finances'->>'edit')::boolean, false) = true
        )
    )
  );

-- Authenticated finance users DELETE access to donation proofs
DROP POLICY IF EXISTS "Permitir eliminacion de comprobantes de donacion a personal financiero" ON storage.objects;
CREATE POLICY "Permitir eliminacion de comprobantes de donacion a personal financiero"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'donation-proofs' AND EXISTS (
      SELECT 1 FROM public.profiles profile
      LEFT JOIN public.role_permissions permission ON permission.role::text = profile.role::text
      WHERE profile.id = (SELECT auth.uid())
        AND (
          profile.role::text IN ('admin', 'superadmin', 'pastor', 'secretary', 'secretaria')
          OR COALESCE((permission.permissions->'finances'->>'edit')::boolean, false) = true
        )
    )
  );
