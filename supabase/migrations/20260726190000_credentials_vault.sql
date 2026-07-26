-- Migration: Create credential_vault table for storing social media accounts, logins, and passwords per department

CREATE TABLE IF NOT EXISTS public.credential_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'redes_sociales', -- redes_sociales, streaming, correos, plataformas, otros
  department_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL, -- Null = Iglesia General, de lo contrario id del ministerio
  platform_name TEXT NOT NULL, -- Instagram, Facebook, TikTok, YouTube, Zoom, Gmail, Canva, Spotify, etc.
  account_handle TEXT, -- @jovenesjerusalen, etc.
  login_url TEXT,
  username_email TEXT NOT NULL,
  password_encrypted TEXT,
  recovery_email TEXT,
  security_notes TEXT,
  assigned_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credential_vault ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "vault_authenticated_read" ON public.credential_vault;
CREATE POLICY "vault_authenticated_read" ON public.credential_vault
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "vault_admin_all" ON public.credential_vault;
CREATE POLICY "vault_admin_all" ON public.credential_vault
  FOR ALL TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role IN ('admin', 'pastor', 'leader', 'secretary')
    )
  )
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role IN ('admin', 'pastor', 'leader', 'secretary')
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_credential_vault_department ON public.credential_vault(department_id);
CREATE INDEX IF NOT EXISTS idx_credential_vault_category ON public.credential_vault(category);
