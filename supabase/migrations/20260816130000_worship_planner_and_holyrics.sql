-- Planificador de Tiempo de Culto y cola segura para Holyrics.
-- La planificación vive en la iglesia; Holyrics y ProPresenter son destinos de ejecución.

CREATE OR REPLACE FUNCTION public.current_user_can_worship_manager()
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

REVOKE ALL ON FUNCTION public.current_user_can_worship_manager() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_can_worship_manager() TO authenticated;

CREATE TABLE IF NOT EXISTS public.worship_service_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  frequency text NOT NULL CHECK (frequency IN ('monthly_nth_weekday', 'weekly')),
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  week_of_month smallint CHECK (week_of_month IS NULL OR week_of_month BETWEEN 1 AND 5),
  month_of_year smallint CHECK (month_of_year IS NULL OR month_of_year BETWEEN 1 AND 12),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 160),
  service_type text NOT NULL DEFAULT 'general' CHECK (char_length(trim(service_type)) BETWEEN 2 AND 60),
  start_time time NOT NULL,
  end_time time NOT NULL,
  priority smallint NOT NULL DEFAULT 0 CHECK (priority BETWEEN -100 AND 100),
  is_active boolean NOT NULL DEFAULT true,
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT worship_service_rules_period CHECK (end_time > start_time),
  CONSTRAINT worship_service_rules_monthly_shape CHECK (
    (frequency = 'weekly' AND week_of_month IS NULL)
    OR (frequency = 'monthly_nth_weekday' AND week_of_month IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.worship_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_date date NOT NULL,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 160),
  service_type text NOT NULL DEFAULT 'general' CHECK (char_length(trim(service_type)) BETWEEN 2 AND 60),
  start_time time NOT NULL,
  end_time time NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Bogota',
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('draft', 'planned', 'confirmed', 'completed', 'cancelled')),
  rule_id uuid REFERENCES public.worship_service_rules(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  notes text,
  generated_by_rule boolean NOT NULL DEFAULT false,
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT worship_services_period CHECK (end_time > start_time),
  CONSTRAINT worship_services_timezone CHECK (char_length(trim(timezone)) BETWEEN 3 AND 80)
);

CREATE UNIQUE INDEX IF NOT EXISTS worship_services_unique_slot_idx
  ON public.worship_services (service_date, start_time, service_type)
  WHERE status <> 'cancelled';
CREATE INDEX IF NOT EXISTS worship_services_date_idx
  ON public.worship_services (service_date, start_time)
  WHERE status <> 'cancelled';
CREATE INDEX IF NOT EXISTS worship_services_event_idx
  ON public.worship_services (event_id)
  WHERE event_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.worship_service_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.worship_services(id) ON DELETE CASCADE,
  role_key text NOT NULL CHECK (char_length(trim(role_key)) BETWEEN 2 AND 80),
  role_label text NOT NULL CHECK (char_length(trim(role_label)) BETWEEN 2 AND 120),
  slot_index smallint NOT NULL DEFAULT 1 CHECK (slot_index > 0),
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'invited', 'confirmed', 'declined', 'unassigned')),
  notes text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'suggested', 'imported')),
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_id, role_key, slot_index)
);

CREATE INDEX IF NOT EXISTS worship_service_assignments_member_idx
  ON public.worship_service_assignments (member_id, status)
  WHERE member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS worship_service_assignments_service_idx
  ON public.worship_service_assignments (service_id, role_key, slot_index);

CREATE TABLE IF NOT EXISTS public.worship_service_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.worship_services(id) ON DELETE CASCADE,
  position smallint NOT NULL CHECK (position > 0),
  item_type text NOT NULL CHECK (item_type IN ('welcome', 'song', 'prayer', 'bible', 'offering', 'sermon', 'communion', 'announcement', 'media', 'custom')),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 180),
  duration_minutes smallint CHECK (duration_minutes IS NULL OR duration_minutes BETWEEN 1 AND 600),
  song_id uuid REFERENCES public.songs(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  holyrics_item_id text,
  propresenter_item_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_id, position)
);

CREATE INDEX IF NOT EXISTS worship_service_items_service_idx
  ON public.worship_service_items (service_id, position);

CREATE TABLE IF NOT EXISTS public.holyrics_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 80),
  mode text NOT NULL CHECK (mode IN ('local', 'internet')),
  base_url text,
  computer_name text,
  app_version text,
  capabilities jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_seen_at timestamptz,
  last_error text,
  is_enabled boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT holyrics_connections_base_url_shape CHECK (
    (mode = 'local' AND base_url IS NOT NULL AND base_url LIKE 'http%')
    OR mode = 'internet'
  )
);

CREATE TABLE IF NOT EXISTS public.holyrics_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.holyrics_connections(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (char_length(trim(action)) BETWEEN 2 AND 100),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'failed', 'cancelled')),
  response jsonb,
  error_message text,
  idempotency_key text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  acknowledged_at timestamptz
);

CREATE INDEX IF NOT EXISTS holyrics_commands_pending_idx
  ON public.holyrics_commands (connection_id, status, created_at)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.worship_sync_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('holyrics', 'propresenter')),
  local_type text NOT NULL CHECK (local_type IN ('service', 'item', 'event', 'song', 'announcement')),
  local_id uuid NOT NULL,
  remote_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, local_type, local_id),
  UNIQUE (provider, local_type, remote_id)
);

CREATE OR REPLACE FUNCTION private.touch_worship_planner_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'worship_service_rules',
    'worship_services',
    'worship_service_assignments',
    'worship_service_items',
    'holyrics_connections',
    'worship_sync_links'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS touch_%I_updated_at ON public.%I', table_name, table_name);
    EXECUTE format(
      'CREATE TRIGGER touch_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.touch_worship_planner_updated_at()',
      table_name,
      table_name
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION private.prevent_worship_member_overlap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  current_service public.worship_services;
BEGIN
  IF NEW.member_id IS NULL OR NEW.status IN ('declined', 'unassigned') THEN RETURN NEW; END IF;

  SELECT * INTO current_service
  FROM public.worship_services
  WHERE id = NEW.service_id;

  IF current_service.status = 'cancelled' THEN RETURN NEW; END IF;

  IF EXISTS (
    SELECT 1
    FROM public.worship_service_assignments assignment
    JOIN public.worship_services service ON service.id = assignment.service_id
    WHERE assignment.member_id = NEW.member_id
      AND assignment.id <> NEW.id
      AND assignment.status NOT IN ('declined', 'unassigned')
      AND service.status <> 'cancelled'
      AND service.service_date = current_service.service_date
      AND service.start_time < current_service.end_time
      AND service.end_time > current_service.start_time
  ) THEN
    RAISE EXCEPTION 'El miembro ya tiene una asignación que se cruza con este culto';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_worship_member_overlap ON public.worship_service_assignments;
CREATE TRIGGER prevent_worship_member_overlap
  BEFORE INSERT OR UPDATE OF service_id, member_id, status
  ON public.worship_service_assignments
  FOR EACH ROW EXECUTE FUNCTION private.prevent_worship_member_overlap();

ALTER TABLE public.worship_service_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worship_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worship_service_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worship_service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holyrics_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holyrics_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worship_sync_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Worship managers read rules" ON public.worship_service_rules;
CREATE POLICY "Worship managers read rules" ON public.worship_service_rules FOR SELECT TO authenticated
  USING (private.current_user_can_manage_service());
DROP POLICY IF EXISTS "Worship managers manage rules" ON public.worship_service_rules;
CREATE POLICY "Worship managers manage rules" ON public.worship_service_rules FOR ALL TO authenticated
  USING (private.current_user_can_manage_service()) WITH CHECK (private.current_user_can_manage_service());

DROP POLICY IF EXISTS "Worship managers read services" ON public.worship_services;
CREATE POLICY "Worship managers read services" ON public.worship_services FOR SELECT TO authenticated
  USING (private.current_user_can_manage_service());
DROP POLICY IF EXISTS "Worship managers manage services" ON public.worship_services;
CREATE POLICY "Worship managers manage services" ON public.worship_services FOR ALL TO authenticated
  USING (private.current_user_can_manage_service()) WITH CHECK (private.current_user_can_manage_service());

DROP POLICY IF EXISTS "Worship managers read assignments" ON public.worship_service_assignments;
CREATE POLICY "Worship managers read assignments" ON public.worship_service_assignments FOR SELECT TO authenticated
  USING (private.current_user_can_manage_service());
DROP POLICY IF EXISTS "Worship managers manage assignments" ON public.worship_service_assignments;
CREATE POLICY "Worship managers manage assignments" ON public.worship_service_assignments FOR ALL TO authenticated
  USING (private.current_user_can_manage_service()) WITH CHECK (private.current_user_can_manage_service());

DROP POLICY IF EXISTS "Worship managers read items" ON public.worship_service_items;
CREATE POLICY "Worship managers read items" ON public.worship_service_items FOR SELECT TO authenticated
  USING (private.current_user_can_manage_service());
DROP POLICY IF EXISTS "Worship managers manage items" ON public.worship_service_items;
CREATE POLICY "Worship managers manage items" ON public.worship_service_items FOR ALL TO authenticated
  USING (private.current_user_can_manage_service()) WITH CHECK (private.current_user_can_manage_service());

DROP POLICY IF EXISTS "Worship managers read Holyrics connections" ON public.holyrics_connections;
CREATE POLICY "Worship managers read Holyrics connections" ON public.holyrics_connections FOR SELECT TO authenticated
  USING (private.current_user_can_manage_service());
DROP POLICY IF EXISTS "Worship managers manage Holyrics connections" ON public.holyrics_connections;
CREATE POLICY "Worship managers manage Holyrics connections" ON public.holyrics_connections FOR ALL TO authenticated
  USING (private.current_user_can_manage_service()) WITH CHECK (private.current_user_can_manage_service());

DROP POLICY IF EXISTS "Worship managers read Holyrics commands" ON public.holyrics_commands;
CREATE POLICY "Worship managers read Holyrics commands" ON public.holyrics_commands FOR SELECT TO authenticated
  USING (private.current_user_can_manage_service());
DROP POLICY IF EXISTS "Worship managers create Holyrics commands" ON public.holyrics_commands;
CREATE POLICY "Worship managers create Holyrics commands" ON public.holyrics_commands FOR INSERT TO authenticated
  WITH CHECK (private.current_user_can_manage_service());

DROP POLICY IF EXISTS "Worship managers read sync links" ON public.worship_sync_links;
CREATE POLICY "Worship managers read sync links" ON public.worship_sync_links FOR SELECT TO authenticated
  USING (private.current_user_can_manage_service());
DROP POLICY IF EXISTS "Worship managers manage sync links" ON public.worship_sync_links;
CREATE POLICY "Worship managers manage sync links" ON public.worship_sync_links FOR ALL TO authenticated
  USING (private.current_user_can_manage_service()) WITH CHECK (private.current_user_can_manage_service());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.worship_service_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.worship_services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.worship_service_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.worship_service_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.holyrics_connections TO authenticated;
GRANT SELECT, INSERT ON public.holyrics_commands TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.worship_sync_links TO authenticated;

INSERT INTO public.worship_service_rules (
  name, frequency, weekday, week_of_month, title, service_type, start_time, end_time, priority, is_active
)
SELECT
  'Santa Cena · primer domingo', 'monthly_nth_weekday', 0, 1,
  'Culto dominical · Santa Cena', 'santa_cena', '10:00', '12:00', 20, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.worship_service_rules WHERE service_type = 'santa_cena' AND week_of_month = 1 AND weekday = 0
);

INSERT INTO public.worship_service_rules (
  name, frequency, weekday, week_of_month, title, service_type, start_time, end_time, priority, is_active
)
SELECT
  'Culto misionero · tercer domingo', 'monthly_nth_weekday', 0, 3,
  'Culto dominical · Misiones', 'misionero', '10:00', '12:00', 20, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.worship_service_rules WHERE service_type = 'misionero' AND week_of_month = 3 AND weekday = 0
);
