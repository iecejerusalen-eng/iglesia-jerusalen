-- Apply only after the frontend calls the public certificate lookup RPCs.
-- The RPCs were added in 20261021010825_add_public_certificate_lookup_rpcs.sql.
DROP POLICY IF EXISTS "Anyone can verify certificate by ID" ON public.lms_certificates;
CREATE POLICY "Students can read their own certificates"
  ON public.lms_certificates
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
REVOKE ALL PRIVILEGES ON TABLE public.lms_certificates FROM anon;

DROP POLICY IF EXISTS "Anyone can verify certificate by hash" ON public.lms_certificates_issued;
REVOKE ALL PRIVILEGES ON TABLE public.lms_certificates_issued FROM anon;
