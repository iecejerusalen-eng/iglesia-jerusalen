-- Normaliza el historial de actividad y restringe su lectura al módulo Usuarios.
-- Es compatible con la tabla creada por las migraciones antiguas del mapa y del panel.

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS timestamp timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS resource text,
  ADD COLUMN IF NOT EXISTS resource_id text,
  ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'performed_at'
  ) THEN
    EXECUTE 'UPDATE public.audit_logs SET timestamp = COALESCE(timestamp, performed_at) WHERE timestamp IS NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'table_name'
  ) THEN
    EXECUTE 'UPDATE public.audit_logs SET resource = COALESCE(resource, table_name) WHERE resource IS NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'record_id'
  ) THEN
    EXECUTE 'UPDATE public.audit_logs SET resource_id = COALESCE(resource_id, record_id::text) WHERE resource_id IS NULL';
  END IF;
END;
$$;

UPDATE public.audit_logs
SET timestamp = COALESCE(timestamp, now()),
    resource = COALESCE(NULLIF(resource, ''), 'system')
WHERE timestamp IS NULL OR resource IS NULL OR resource = '';

ALTER TABLE public.audit_logs
  ALTER COLUMN timestamp SET NOT NULL,
  ALTER COLUMN resource SET NOT NULL;

CREATE INDEX IF NOT EXISTS audit_logs_timestamp_id_idx
  ON public.audit_logs (timestamp DESC, id DESC);

CREATE INDEX IF NOT EXISTS audit_logs_action_timestamp_idx
  ON public.audit_logs (action, timestamp DESC);

CREATE INDEX IF NOT EXISTS audit_logs_resource_timestamp_idx
  ON public.audit_logs (resource, timestamp DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to view their own logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow admins to view all logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authorized users view audit activity" ON public.audit_logs;
CREATE POLICY "Authorized users view audit activity"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    private.current_user_has_admin_permission('users', 'view')
    OR private.current_user_has_admin_permission('users', 'edit')
  );

DROP POLICY IF EXISTS "Allow authenticated users to insert logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users record own activity" ON public.audit_logs;
CREATE POLICY "Authenticated users record own activity"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

COMMENT ON TABLE public.audit_logs IS
  'Registro de actividad administrativa. La lectura está limitada al permiso users.view o users.edit.';
