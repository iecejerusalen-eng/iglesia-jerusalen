-- Centro de control ProPresenter: conexiones autorizadas y cola de comandos.
-- El sitio nunca expone el puerto local de ProPresenter; el conector instalado
-- en la computadora abre una conexión saliente y consume esta cola.

CREATE OR REPLACE FUNCTION public.current_user_can_propresenter(p_action text DEFAULT 'view')
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
        profile.role::text IN ('admin', 'superadmin')
        OR 'admin' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[]))
        OR COALESCE((profile.permissions_override->'propresenter'->>p_action)::boolean, false)
        OR EXISTS (
          SELECT 1
          FROM public.access_roles access_role
          WHERE access_role.id = ANY(COALESCE(profile.custom_role_ids, ARRAY[]::uuid[]))
            AND access_role.is_active
            AND COALESCE((access_role.permissions->'propresenter'->>p_action)::boolean, false)
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_can_propresenter(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_can_propresenter(text) TO authenticated;

CREATE TABLE IF NOT EXISTS public.propresenter_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 80),
  mode text NOT NULL DEFAULT 'ndi' CHECK (mode IN ('alpha', 'ndi', 'web')),
  description text NOT NULL DEFAULT '',
  computer_name text,
  app_version text,
  device_token_hash text,
  device_token_issued_at timestamptz,
  last_seen_at timestamptz,
  last_error text,
  is_enabled boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.propresenter_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.propresenter_connections(id) ON DELETE CASCADE,
  command_type text NOT NULL CHECK (command_type IN (
    'test_connection', 'show_lyrics', 'show_chords', 'clear_output',
    'next_slide', 'previous_slide', 'trigger_slide', 'sync_service'
  )),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'failed', 'cancelled')),
  error_message text,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS propresenter_connections_enabled_idx
  ON public.propresenter_connections (is_enabled, last_seen_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS propresenter_connections_device_token_idx
  ON public.propresenter_connections (device_token_hash)
  WHERE device_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS propresenter_commands_pending_idx
  ON public.propresenter_commands (connection_id, status, created_at);

CREATE OR REPLACE FUNCTION public.set_propresenter_connection_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_propresenter_connection_updated_at ON public.propresenter_connections;
CREATE TRIGGER set_propresenter_connection_updated_at
  BEFORE UPDATE ON public.propresenter_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_propresenter_connection_updated_at();

ALTER TABLE public.propresenter_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propresenter_commands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ProPresenter users can view connections" ON public.propresenter_connections;
CREATE POLICY "ProPresenter users can view connections"
  ON public.propresenter_connections FOR SELECT TO authenticated
  USING (public.current_user_can_propresenter('view'));

DROP POLICY IF EXISTS "ProPresenter editors manage connections" ON public.propresenter_connections;
CREATE POLICY "ProPresenter editors manage connections"
  ON public.propresenter_connections FOR ALL TO authenticated
  USING (public.current_user_can_propresenter('edit'))
  WITH CHECK (public.current_user_can_propresenter('edit'));

DROP POLICY IF EXISTS "ProPresenter users view commands" ON public.propresenter_commands;
CREATE POLICY "ProPresenter users view commands"
  ON public.propresenter_commands FOR SELECT TO authenticated
  USING (public.current_user_can_propresenter('view'));

DROP POLICY IF EXISTS "ProPresenter editors create commands" ON public.propresenter_commands;
CREATE POLICY "ProPresenter editors create commands"
  ON public.propresenter_commands FOR INSERT TO authenticated
  WITH CHECK (public.current_user_can_propresenter('edit'));

DROP POLICY IF EXISTS "ProPresenter editors update commands" ON public.propresenter_commands;
CREATE POLICY "ProPresenter editors update commands"
  ON public.propresenter_commands FOR UPDATE TO authenticated
  USING (public.current_user_can_propresenter('edit'))
  WITH CHECK (public.current_user_can_propresenter('edit'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propresenter_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.propresenter_commands TO authenticated;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.propresenter_connections;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.propresenter_commands;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

COMMENT ON TABLE public.propresenter_connections IS
  'Computadoras autorizadas para el conector local de ProPresenter.';
COMMENT ON TABLE public.propresenter_commands IS
  'Cola auditable de órdenes entre el panel y el conector local de ProPresenter.';
