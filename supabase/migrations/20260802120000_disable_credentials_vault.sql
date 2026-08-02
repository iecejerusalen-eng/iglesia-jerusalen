-- Migration: Disable credential vault due to security audit
-- Temporarily drops wide RLS policies and replaces them with strict rejection (false)

DROP POLICY IF EXISTS "vault_authenticated_read" ON public.credential_vault;
DROP POLICY IF EXISTS "vault_admin_all" ON public.credential_vault;

CREATE POLICY "vault_disabled_read" ON public.credential_vault
  FOR SELECT TO authenticated USING (false);

CREATE POLICY "vault_disabled_write" ON public.credential_vault
  FOR ALL TO authenticated USING (false) WITH CHECK (false);
