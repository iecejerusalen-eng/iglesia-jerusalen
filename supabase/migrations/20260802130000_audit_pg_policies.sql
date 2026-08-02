-- Migration: Audit pg_policies securely
-- Exposes pg_policies temporarily via a view to allow inspection by the Service Role

CREATE OR REPLACE VIEW public.audit_pg_policies AS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public';

-- Policy definitions are security-sensitive and must only be visible to the service role.
REVOKE ALL ON public.audit_pg_policies FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.audit_pg_policies TO service_role;
