-- Gestión centralizada de la página pública de donaciones.
-- El contenido editable vive en JSONB; los datos bancarios existentes siguen
-- siendo la fuente única para cuenta, banco y RUC.

ALTER TABLE public.church_settings
  ADD COLUMN IF NOT EXISTS donation_page_config jsonb NOT NULL DEFAULT '{
    "eyebrow":"Mayordomía cristiana",
    "title":"Cada aporte impulsa una obra que transforma vidas",
    "description":"Tus diezmos, ofrendas y donaciones sostienen la proclamación del evangelio, el cuidado pastoral y el servicio a nuestra comunidad.",
    "verse":"Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre.",
    "verse_reference":"2 Corintios 9:7",
    "beneficiary":"Iglesia del Evangelio Cuadrangular del Ecuador",
    "account_type":"Cuenta corriente",
    "whatsapp_label":"Secretaría de la iglesia",
    "preset_amounts":[10,25,50,100],
    "transfer_enabled":true,
    "volunteer_enabled":true,
    "transparency_title":"Administración responsable",
    "transparency_text":"Cada aporte se registra para su revisión y conciliación por el equipo administrativo autorizado.",
    "transfer_instructions":["Registra el aporte con tus datos.","Realiza la transferencia a la cuenta indicada.","Envía el comprobante por WhatsApp usando el número de referencia."]
  }'::jsonb;

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Permitir actualizar donaciones a personal financiero" ON public.donations;
CREATE POLICY "Permitir actualizar donaciones a personal financiero"
  ON public.donations FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role::text IN ('admin', 'superadmin', 'pastor', 'secretary', 'secretaria')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role::text IN ('admin', 'superadmin', 'pastor', 'secretary', 'secretaria')
    )
  );

CREATE INDEX IF NOT EXISTS donations_status_created_at_idx
  ON public.donations (status, created_at DESC);

COMMENT ON COLUMN public.church_settings.donation_page_config IS
  'Configuración pública editable de donaciones. No debe contener secretos ni credenciales de pasarelas.';
COMMENT ON COLUMN public.donations.verified_at IS
  'Momento en que un administrador verificó o rechazó el aporte reportado.';

-- Alinear RLS con el módulo RBAC "finances". Las políticas son adicionales y
-- PostgreSQL las combina con OR; no eliminan el acceso administrativo existente.
DROP POLICY IF EXISTS "Editores financieros actualizan configuracion de donaciones" ON public.church_settings;
CREATE POLICY "Editores financieros actualizan configuracion de donaciones"
  ON public.church_settings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles profile
      JOIN public.role_permissions permission ON permission.role::text = profile.role::text
      WHERE profile.id = (SELECT auth.uid())
        AND COALESCE((permission.permissions->'finances'->>'edit')::boolean, false)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles profile
      JOIN public.role_permissions permission ON permission.role::text = profile.role::text
      WHERE profile.id = (SELECT auth.uid())
        AND COALESCE((permission.permissions->'finances'->>'edit')::boolean, false)
    )
  );

DROP POLICY IF EXISTS "Usuarios financieros leen donaciones" ON public.donations;
CREATE POLICY "Usuarios financieros leen donaciones"
  ON public.donations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles profile
      JOIN public.role_permissions permission ON permission.role::text = profile.role::text
      WHERE profile.id = (SELECT auth.uid())
        AND COALESCE((permission.permissions->'finances'->>'view')::boolean, false)
    )
  );

DROP POLICY IF EXISTS "Editores financieros verifican donaciones" ON public.donations;
CREATE POLICY "Editores financieros verifican donaciones"
  ON public.donations FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles profile
      JOIN public.role_permissions permission ON permission.role::text = profile.role::text
      WHERE profile.id = (SELECT auth.uid())
        AND COALESCE((permission.permissions->'finances'->>'edit')::boolean, false)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles profile
      JOIN public.role_permissions permission ON permission.role::text = profile.role::text
      WHERE profile.id = (SELECT auth.uid())
        AND COALESCE((permission.permissions->'finances'->>'edit')::boolean, false)
    )
  );

DROP POLICY IF EXISTS "Editores financieros gestionan destinos" ON public.donation_categories;
CREATE POLICY "Editores financieros gestionan destinos"
  ON public.donation_categories FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles profile
      JOIN public.role_permissions permission ON permission.role::text = profile.role::text
      WHERE profile.id = (SELECT auth.uid())
        AND COALESCE((permission.permissions->'finances'->>'edit')::boolean, false)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles profile
      JOIN public.role_permissions permission ON permission.role::text = profile.role::text
      WHERE profile.id = (SELECT auth.uid())
        AND COALESCE((permission.permissions->'finances'->>'edit')::boolean, false)
    )
  );
