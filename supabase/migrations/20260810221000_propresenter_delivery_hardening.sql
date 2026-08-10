-- Entrega segura de contenido a ProPresenter.
-- Separa secretos de los metadatos visibles, añade emparejamiento temporal y
-- convierte la cola en un sistema con claim atómico, lease y reintentos.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

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
        OR 'superadmin' = ANY(COALESCE(profile.roles::text[], ARRAY[]::text[]))
        OR COALESCE((profile.permissions_override->'propresenter'->>p_action)::boolean, false)
        OR EXISTS (
          SELECT 1
          FROM public.role_permissions permission
          WHERE permission.role::text = ANY(
            array_prepend(profile.role::text, COALESCE(profile.roles::text[], ARRAY[]::text[]))
          )
            AND COALESCE((permission.permissions->'propresenter'->>p_action)::boolean, false)
        )
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

CREATE TABLE IF NOT EXISTS public.propresenter_connection_secrets (
  connection_id uuid PRIMARY KEY REFERENCES public.propresenter_connections(id) ON DELETE CASCADE,
  pairing_code_hash text,
  pairing_expires_at timestamptz,
  pairing_attempts smallint NOT NULL DEFAULT 0 CHECK (pairing_attempts BETWEEN 0 AND 20),
  device_token_hash text,
  device_token_issued_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS propresenter_secrets_pairing_hash_idx
  ON public.propresenter_connection_secrets (pairing_code_hash)
  WHERE pairing_code_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS propresenter_secrets_device_hash_idx
  ON public.propresenter_connection_secrets (device_token_hash)
  WHERE device_token_hash IS NOT NULL;

-- Conserva dispositivos ya emparejados y da una ventana corta a códigos creados
-- con la versión anterior antes de retirar el secreto de la tabla visible.
INSERT INTO public.propresenter_connection_secrets (
  connection_id,
  pairing_code_hash,
  pairing_expires_at,
  device_token_hash,
  device_token_issued_at
)
SELECT
  connection.id,
  CASE WHEN connection.device_token_issued_at IS NULL THEN connection.device_token_hash ELSE NULL END,
  CASE WHEN connection.device_token_issued_at IS NULL AND connection.device_token_hash IS NOT NULL THEN now() + interval '15 minutes' ELSE NULL END,
  CASE WHEN connection.device_token_issued_at IS NOT NULL THEN connection.device_token_hash ELSE NULL END,
  connection.device_token_issued_at
FROM public.propresenter_connections connection
WHERE connection.device_token_hash IS NOT NULL
ON CONFLICT (connection_id) DO NOTHING;

UPDATE public.propresenter_connections
SET device_token_hash = NULL,
    device_token_issued_at = NULL
WHERE device_token_hash IS NOT NULL OR device_token_issued_at IS NOT NULL;

DROP INDEX IF EXISTS public.propresenter_connections_device_token_idx;

ALTER TABLE public.propresenter_connection_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.propresenter_connection_secrets FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_propresenter_connection(
  p_name text,
  p_mode text,
  p_description text,
  p_pairing_code text
)
RETURNS SETOF public.propresenter_connections
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  created_id uuid;
BEGIN
  IF NOT public.current_user_can_propresenter('edit') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  IF char_length(trim(COALESCE(p_name, ''))) NOT BETWEEN 2 AND 80 THEN
    RAISE EXCEPTION 'Connection name must contain between 2 and 80 characters';
  END IF;
  IF p_mode NOT IN ('alpha', 'ndi', 'web') THEN
    RAISE EXCEPTION 'Unsupported output mode';
  END IF;
  IF p_pairing_code !~ '^JER-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$' THEN
    RAISE EXCEPTION 'Invalid pairing code format';
  END IF;

  INSERT INTO public.propresenter_connections (name, mode, description, created_by)
  VALUES (trim(p_name), p_mode, left(trim(COALESCE(p_description, '')), 500), (SELECT auth.uid()))
  RETURNING id INTO created_id;

  INSERT INTO public.propresenter_connection_secrets (
    connection_id,
    pairing_code_hash,
    pairing_expires_at
  ) VALUES (
    created_id,
    encode(extensions.digest(convert_to(upper(trim(p_pairing_code)), 'UTF8'), 'sha256'), 'hex'),
    now() + interval '15 minutes'
  );

  RETURN QUERY
  SELECT connection.*
  FROM public.propresenter_connections connection
  WHERE connection.id = created_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_propresenter_connection(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_propresenter_connection(text, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.pair_propresenter_device(
  p_connection_id uuid,
  p_pairing_code text,
  p_device_token_hash text
)
RETURNS TABLE (id uuid, name text, mode text, is_enabled boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  supplied_hash text;
  secret_row public.propresenter_connection_secrets%ROWTYPE;
BEGIN
  supplied_hash := encode(
    extensions.digest(convert_to(upper(trim(COALESCE(p_pairing_code, ''))), 'UTF8'), 'sha256'),
    'hex'
  );

  SELECT secret.* INTO secret_row
  FROM public.propresenter_connection_secrets secret
  WHERE secret.connection_id = p_connection_id
  FOR UPDATE;

  IF NOT FOUND
    OR secret_row.pairing_code_hash IS NULL
    OR secret_row.pairing_expires_at <= now()
    OR secret_row.pairing_attempts >= 5
    OR secret_row.pairing_code_hash <> supplied_hash THEN
    IF FOUND THEN
      UPDATE public.propresenter_connection_secrets
      SET pairing_attempts = LEAST(pairing_attempts + 1, 20),
          updated_at = now()
      WHERE connection_id = p_connection_id;
    END IF;
    RETURN;
  END IF;

  UPDATE public.propresenter_connection_secrets
  SET pairing_code_hash = NULL,
      pairing_expires_at = NULL,
      pairing_attempts = 0,
      device_token_hash = p_device_token_hash,
      device_token_issued_at = now(),
      updated_at = now()
  WHERE connection_id = p_connection_id;

  UPDATE public.propresenter_connections connection
  SET last_seen_at = now(),
      last_error = NULL
  WHERE connection.id = p_connection_id;

  RETURN QUERY
  SELECT connection.id, connection.name, connection.mode, connection.is_enabled
  FROM public.propresenter_connections connection
  WHERE connection.id = p_connection_id
    AND connection.is_enabled;
END;
$$;

REVOKE ALL ON FUNCTION public.pair_propresenter_device(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pair_propresenter_device(uuid, text, text) TO service_role;

ALTER TABLE public.propresenter_commands
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS claim_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempt_count smallint NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 20),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours');

DROP INDEX IF EXISTS public.propresenter_commands_pending_idx;
CREATE INDEX IF NOT EXISTS propresenter_commands_claim_idx
  ON public.propresenter_commands (connection_id, status, claim_expires_at, created_at)
  WHERE status IN ('pending', 'sent');

CREATE OR REPLACE FUNCTION public.prepare_propresenter_command()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.requested_by := (SELECT auth.uid());
  NEW.status := 'pending';
  NEW.error_message := NULL;
  NEW.acknowledged_at := NULL;
  NEW.claimed_at := NULL;
  NEW.claim_expires_at := NULL;
  NEW.attempt_count := 0;
  NEW.expires_at := LEAST(COALESCE(NEW.expires_at, now() + interval '24 hours'), now() + interval '24 hours');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prepare_propresenter_command ON public.propresenter_commands;
CREATE TRIGGER prepare_propresenter_command
  BEFORE INSERT ON public.propresenter_commands
  FOR EACH ROW
  EXECUTE FUNCTION public.prepare_propresenter_command();

CREATE OR REPLACE FUNCTION public.claim_propresenter_commands(
  p_connection_id uuid,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  command_type text,
  payload jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.propresenter_commands command
  SET status = 'failed',
      error_message = CASE
        WHEN command.expires_at <= now() THEN 'Command expired before delivery'
        ELSE 'Maximum delivery attempts reached'
      END,
      acknowledged_at = now(),
      claim_expires_at = NULL
  WHERE command.connection_id = p_connection_id
    AND command.status IN ('pending', 'sent')
    AND (command.expires_at <= now() OR command.attempt_count >= 3);

  RETURN QUERY
  WITH candidates AS (
    SELECT command.id
    FROM public.propresenter_commands command
    WHERE command.connection_id = p_connection_id
      AND command.expires_at > now()
      AND command.attempt_count < 3
      AND (
        command.status = 'pending'
        OR (command.status = 'sent' AND command.claim_expires_at < now())
      )
    ORDER BY command.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit, 1), 20)
  ), claimed AS (
    UPDATE public.propresenter_commands command
    SET status = 'sent',
        claimed_at = now(),
        claim_expires_at = now() + interval '30 seconds',
        attempt_count = command.attempt_count + 1
    FROM candidates
    WHERE command.id = candidates.id
    RETURNING command.id, command.command_type, command.payload, command.created_at
  )
  SELECT claimed.id, claimed.command_type, claimed.payload, claimed.created_at
  FROM claimed
  ORDER BY claimed.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_propresenter_commands(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_propresenter_commands(uuid, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.ack_propresenter_command(
  p_connection_id uuid,
  p_command_id uuid,
  p_status text,
  p_error_message text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected_rows integer;
BEGIN
  IF p_status NOT IN ('acknowledged', 'failed') THEN
    RAISE EXCEPTION 'Invalid acknowledgement status';
  END IF;

  UPDATE public.propresenter_commands command
  SET status = p_status,
      error_message = CASE WHEN p_status = 'failed' THEN left(COALESCE(p_error_message, 'Unknown device error'), 500) ELSE NULL END,
      acknowledged_at = now(),
      claim_expires_at = NULL
  WHERE command.id = p_command_id
    AND command.connection_id = p_connection_id
    AND command.status = 'sent';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.ack_propresenter_command(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ack_propresenter_command(uuid, uuid, text, text) TO service_role;

DROP POLICY IF EXISTS "ProPresenter editors manage connections" ON public.propresenter_connections;
DROP POLICY IF EXISTS "ProPresenter editors insert connections" ON public.propresenter_connections;
DROP POLICY IF EXISTS "ProPresenter editors update connections" ON public.propresenter_connections;
DROP POLICY IF EXISTS "ProPresenter editors delete connections" ON public.propresenter_connections;

CREATE POLICY "ProPresenter editors update connections"
  ON public.propresenter_connections FOR UPDATE TO authenticated
  USING (public.current_user_can_propresenter('edit'))
  WITH CHECK (public.current_user_can_propresenter('edit'));

CREATE POLICY "ProPresenter editors delete connections"
  ON public.propresenter_connections FOR DELETE TO authenticated
  USING (public.current_user_can_propresenter('edit'));

DROP POLICY IF EXISTS "ProPresenter editors create commands" ON public.propresenter_commands;
CREATE POLICY "ProPresenter editors create commands"
  ON public.propresenter_commands FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_can_propresenter('edit')
    AND requested_by = (SELECT auth.uid())
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "ProPresenter editors update commands" ON public.propresenter_commands;
REVOKE INSERT, UPDATE, DELETE ON public.propresenter_connections FROM authenticated;
GRANT UPDATE (name, mode, description, is_enabled) ON public.propresenter_connections TO authenticated;
GRANT DELETE ON public.propresenter_connections TO authenticated;
REVOKE UPDATE, DELETE ON public.propresenter_commands FROM authenticated;
GRANT SELECT, INSERT ON public.propresenter_commands TO authenticated;

COMMENT ON TABLE public.propresenter_connection_secrets IS
  'Secretos del conector local. No se exponen a usuarios autenticados ni a Realtime.';
COMMENT ON FUNCTION public.claim_propresenter_commands(uuid, integer) IS
  'Reserva comandos de forma atómica con lease y máximo de tres intentos.';

NOTIFY pgrst, 'reload schema';
