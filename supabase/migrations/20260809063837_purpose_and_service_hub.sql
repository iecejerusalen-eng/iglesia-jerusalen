-- Centro de propósito y servicio: preferencias del miembro, oportunidades
-- enriquecidas y políticas que evitan exponer asignaciones de otros miembros.

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.current_user_can_manage_service()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = (SELECT auth.uid())
      AND profile.banned IS NOT TRUE
      AND (
        profile.role::text IN ('admin', 'pastor', 'leader')
        OR COALESCE(profile.roles::text[], ARRAY[]::text[]) && ARRAY['admin', 'pastor', 'leader']::text[]
      )
  );
$$;

REVOKE ALL ON FUNCTION private.current_user_can_manage_service() FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_user_can_manage_service() TO authenticated;

ALTER TABLE public.volunteer_shifts
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS effort_level text NOT NULL DEFAULT 'moderado',
  ADD COLUMN IF NOT EXISTS accessibility_notes text,
  ADD COLUMN IF NOT EXISTS skills_needed text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS supplies_provided boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS registration_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'volunteer_shifts_valid_period') THEN
    ALTER TABLE public.volunteer_shifts
      ADD CONSTRAINT volunteer_shifts_valid_period CHECK (end_time > start_time);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'volunteer_shifts_positive_capacity') THEN
    ALTER TABLE public.volunteer_shifts
      ADD CONSTRAINT volunteer_shifts_positive_capacity CHECK (required_volunteers > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'volunteer_shifts_effort_level_check') THEN
    ALTER TABLE public.volunteer_shifts
      ADD CONSTRAINT volunteer_shifts_effort_level_check CHECK (effort_level IN ('ligero', 'moderado', 'fisico'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.member_service_preferences (
  member_id uuid PRIMARY KEY REFERENCES public.members(id) ON DELETE CASCADE,
  preferred_categories text[] NOT NULL DEFAULT '{}'::text[],
  practical_skills text[] NOT NULL DEFAULT '{}'::text[],
  service_interests text[] NOT NULL DEFAULT '{}'::text[],
  unavailable_reasons text[] NOT NULL DEFAULT '{}'::text[],
  max_services_per_month smallint CHECK (max_services_per_month BETWEEN 0 AND 31),
  preferred_frequency text CHECK (preferred_frequency IN ('ocasional', 'mensual', 'quincenal', 'semanal')),
  wants_mentoring boolean NOT NULL DEFAULT false,
  willing_to_lead boolean NOT NULL DEFAULT false,
  consent_to_be_contacted boolean NOT NULL DEFAULT false,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_discernment_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  ministry_id uuid REFERENCES public.ministries(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'sugerida' CHECK (status IN ('sugerida', 'contactado', 'discerniendo', 'prueba', 'integrado', 'pausado')),
  reason text NOT NULL,
  next_step text,
  next_contact_at timestamptz,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS volunteer_shifts_public_schedule_idx
  ON public.volunteer_shifts (start_time)
  WHERE is_published = true;
CREATE INDEX IF NOT EXISTS volunteer_assignments_member_idx
  ON public.volunteer_assignments (member_id, status);
CREATE INDEX IF NOT EXISTS volunteer_assignments_shift_status_idx
  ON public.volunteer_assignments (shift_id, status);
CREATE INDEX IF NOT EXISTS ministry_members_member_created_idx
  ON public.ministry_members (member_id, created_at);
CREATE INDEX IF NOT EXISTS service_discernment_member_status_idx
  ON public.service_discernment_conversations (member_id, status);
CREATE INDEX IF NOT EXISTS service_discernment_next_contact_idx
  ON public.service_discernment_conversations (next_contact_at)
  WHERE next_contact_at IS NOT NULL AND status NOT IN ('integrado', 'pausado');

ALTER TABLE public.member_service_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_discernment_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shifts_public_read" ON public.volunteer_shifts;
CREATE POLICY "Published service opportunities are public"
  ON public.volunteer_shifts FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "shifts_admin_all" ON public.volunteer_shifts;
CREATE POLICY "Service managers manage opportunities"
  ON public.volunteer_shifts FOR ALL
  TO authenticated
  USING (private.current_user_can_manage_service())
  WITH CHECK (private.current_user_can_manage_service());

DROP POLICY IF EXISTS "assignments_public_read" ON public.volunteer_assignments;
DROP POLICY IF EXISTS "assignments_admin_all" ON public.volunteer_assignments;
CREATE POLICY "Members read their own service assignments"
  ON public.volunteer_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.member_id = volunteer_assignments.member_id
    )
    OR private.current_user_can_manage_service()
  );
CREATE POLICY "Members request their own service assignments"
  ON public.volunteer_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.profiles profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.member_id = volunteer_assignments.member_id
    )
  );
CREATE POLICY "Members cancel their own service assignments"
  ON public.volunteer_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.member_id = volunteer_assignments.member_id
    )
    OR private.current_user_can_manage_service()
  );
CREATE POLICY "Service managers update assignments"
  ON public.volunteer_assignments FOR UPDATE
  TO authenticated
  USING (private.current_user_can_manage_service())
  WITH CHECK (private.current_user_can_manage_service());

CREATE POLICY "Members read their own service preferences"
  ON public.member_service_preferences FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles profile WHERE profile.id = (SELECT auth.uid()) AND profile.member_id = member_service_preferences.member_id)
    OR private.current_user_can_manage_service()
  );
CREATE POLICY "Members create their own service preferences"
  ON public.member_service_preferences FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles profile WHERE profile.id = (SELECT auth.uid()) AND profile.member_id = member_service_preferences.member_id));
CREATE POLICY "Members update their own service preferences"
  ON public.member_service_preferences FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles profile WHERE profile.id = (SELECT auth.uid()) AND profile.member_id = member_service_preferences.member_id) OR private.current_user_can_manage_service())
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles profile WHERE profile.id = (SELECT auth.uid()) AND profile.member_id = member_service_preferences.member_id) OR private.current_user_can_manage_service());

CREATE POLICY "Service managers manage discernment conversations"
  ON public.service_discernment_conversations FOR ALL
  TO authenticated
  USING (private.current_user_can_manage_service())
  WITH CHECK (private.current_user_can_manage_service());

GRANT SELECT ON public.volunteer_shifts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.member_service_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_discernment_conversations TO authenticated;

INSERT INTO public.public_menu_items (label, url, icon, order_index, parent_id, is_visible)
SELECT 'Quiero servir', '/mi-horario', 'HandHeart', 60, community.id, true
FROM public.public_menu_items community
WHERE lower(trim(community.label)) = 'comunidad'
  AND community.parent_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.public_menu_items existing
    WHERE existing.url = '/mi-horario'
  )
ORDER BY community.order_index
LIMIT 1;

COMMENT ON TABLE public.member_service_preferences IS 'Preferencias, límites y consentimiento del miembro para un servicio saludable.';
COMMENT ON TABLE public.service_discernment_conversations IS 'Seguimiento humano y auditable de conversaciones de orientación hacia ministerios; no es una puntuación espiritual.';
