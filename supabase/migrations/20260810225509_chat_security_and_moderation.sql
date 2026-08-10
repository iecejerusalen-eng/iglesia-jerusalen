-- Secure chat creation, sending, retention, and administrative broadcasts.

UPDATE public.church_settings
SET chat_retention_days = LEAST(90, GREATEST(1, chat_retention_days))
WHERE chat_retention_days NOT BETWEEN 1 AND 90;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'church_settings_chat_retention_days_check'
      AND conrelid = 'public.church_settings'::regclass
  ) THEN
    ALTER TABLE public.church_settings
      ADD CONSTRAINT church_settings_chat_retention_days_check
      CHECK (chat_retention_days BETWEEN 1 AND 90);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chats_name_length_check'
      AND conrelid = 'public.chats'::regclass
  ) THEN
    ALTER TABLE public.chats
      ADD CONSTRAINT chats_name_length_check
      CHECK (name IS NULL OR char_length(btrim(name)) BETWEEN 1 AND 120)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'messages_content_length_check'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_content_length_check
      CHECK (char_length(btrim(content)) BETWEEN 1 AND 1000)
      NOT VALID;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS messages_chat_created_idx
  ON public.messages (chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_created_idx
  ON public.messages (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_participants_user_chat_idx
  ON public.chat_participants (user_id, chat_id);

CREATE OR REPLACE FUNCTION private.enforce_chat_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor_id uuid := (SELECT auth.uid());
  recent_count integer;
  latest_message_at timestamptz;
  is_broadcast boolean := COALESCE(current_setting('app.chat_broadcast', true), '') = 'on';
BEGIN
  NEW.content := btrim(NEW.content);

  IF actor_id IS NULL OR NEW.sender_id <> actor_id THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'El remitente no coincide con la sesión activa.';
  END IF;

  IF NOT public.is_chat_participant(NEW.chat_id, actor_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'No perteneces a esta conversación.';
  END IF;

  IF NOT is_broadcast THEN
    SELECT count(*), max(created_at)
      INTO recent_count, latest_message_at
    FROM public.messages
    WHERE sender_id = actor_id
      AND created_at >= clock_timestamp() - interval '1 minute';

    IF recent_count >= 30 THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'Has alcanzado el límite de 30 mensajes por minuto.';
    END IF;

    IF latest_message_at IS NOT NULL
       AND latest_message_at > clock_timestamp() - interval '750 milliseconds' THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'Espera un momento antes de enviar otro mensaje.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_chat_message_insert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_chat_message_insert_trigger ON public.messages;
CREATE TRIGGER enforce_chat_message_insert_trigger
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION private.enforce_chat_message_insert();

CREATE OR REPLACE FUNCTION public.get_or_create_direct_chat(target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor_id uuid := (SELECT auth.uid());
  direct_chat_id uuid;
  lock_key text;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Debes iniciar sesión.';
  END IF;
  IF target_user_id IS NULL OR target_user_id = actor_id THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Selecciona otro contacto.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = actor_id AND NOT COALESCE(banned, false)
  ) OR NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = target_user_id AND NOT COALESCE(banned, false)
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'El contacto no está disponible para chat.';
  END IF;

  lock_key := LEAST(actor_id::text, target_user_id::text) || ':' || GREATEST(actor_id::text, target_user_id::text);
  PERFORM pg_advisory_xact_lock(hashtextextended(lock_key, 0));

  SELECT chat.id INTO direct_chat_id
  FROM public.chats AS chat
  WHERE chat.is_group = false
    AND EXISTS (
      SELECT 1 FROM public.chat_participants AS participant
      WHERE participant.chat_id = chat.id AND participant.user_id = actor_id
    )
    AND EXISTS (
      SELECT 1 FROM public.chat_participants AS participant
      WHERE participant.chat_id = chat.id AND participant.user_id = target_user_id
    )
    AND (SELECT count(*) FROM public.chat_participants AS participant WHERE participant.chat_id = chat.id) = 2
  ORDER BY chat.created_at
  LIMIT 1;

  IF direct_chat_id IS NULL THEN
    INSERT INTO public.chats (name, is_group)
    VALUES (NULL, false)
    RETURNING id INTO direct_chat_id;

    INSERT INTO public.chat_participants (chat_id, user_id)
    VALUES (direct_chat_id, actor_id), (direct_chat_id, target_user_id);
  END IF;

  RETURN direct_chat_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.current_user_can_broadcast_chat()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = (SELECT auth.uid())
      AND NOT COALESCE(profile.banned, false)
      AND profile.role::text IN ('admin', 'pastor', 'leader')
  );
$$;

REVOKE ALL ON FUNCTION private.current_user_can_broadcast_chat() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.send_chat_broadcast(
  target_profile_ids uuid[],
  message_content text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor_id uuid := (SELECT auth.uid());
  target_id uuid;
  direct_chat_id uuid;
  normalized_content text := btrim(message_content);
  sent_count integer := 0;
  unique_target_ids uuid[];
BEGIN
  IF actor_id IS NULL OR NOT private.current_user_can_broadcast_chat() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'No tienes permiso para realizar difusiones.';
  END IF;

  SELECT array_agg(DISTINCT candidate)
    INTO unique_target_ids
  FROM unnest(target_profile_ids) AS targets(candidate)
  WHERE candidate IS NOT NULL AND candidate <> actor_id;

  IF COALESCE(cardinality(unique_target_ids), 0) = 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'La difusión no tiene destinatarios válidos.';
  END IF;
  IF cardinality(unique_target_ids) > 100 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Una difusión admite como máximo 100 destinatarios.';
  END IF;
  IF normalized_content IS NULL OR char_length(normalized_content) NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'El mensaje debe contener entre 1 y 1000 caracteres.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(unique_target_ids) AS targets(candidate)
    LEFT JOIN public.profiles AS profile ON profile.id = candidate
    WHERE profile.id IS NULL OR COALESCE(profile.banned, false)
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Uno o más destinatarios no están disponibles.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(actor_id::text, 0));
  PERFORM set_config('app.chat_broadcast', 'on', true);

  FOREACH target_id IN ARRAY unique_target_ids LOOP
    SELECT chat.id INTO direct_chat_id
    FROM public.chats AS chat
    WHERE chat.is_group = false
      AND EXISTS (
        SELECT 1 FROM public.chat_participants AS participant
        WHERE participant.chat_id = chat.id AND participant.user_id = actor_id
      )
      AND EXISTS (
        SELECT 1 FROM public.chat_participants AS participant
        WHERE participant.chat_id = chat.id AND participant.user_id = target_id
      )
      AND (SELECT count(*) FROM public.chat_participants AS participant WHERE participant.chat_id = chat.id) = 2
    ORDER BY chat.created_at
    LIMIT 1;

    IF direct_chat_id IS NULL THEN
      INSERT INTO public.chats (name, is_group)
      VALUES (NULL, false)
      RETURNING id INTO direct_chat_id;

      INSERT INTO public.chat_participants (chat_id, user_id)
      VALUES (direct_chat_id, actor_id), (direct_chat_id, target_id);
    END IF;

    INSERT INTO public.messages (chat_id, sender_id, content)
    VALUES (direct_chat_id, actor_id, normalized_content);
    sent_count := sent_count + 1;
  END LOOP;

  RETURN sent_count;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_direct_chat(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_chat_broadcast(uuid[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_chat(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_chat_broadcast(uuid[], text) TO authenticated;

DROP POLICY IF EXISTS "Permitir creacion de chats a autenticados" ON public.chats;
DROP POLICY IF EXISTS "Permitir unirse o crear participantes" ON public.chat_participants;

REVOKE ALL ON public.chats FROM anon, authenticated;
REVOKE ALL ON public.chat_participants FROM anon, authenticated;
REVOKE ALL ON public.messages FROM anon, authenticated;
GRANT SELECT ON public.chats TO authenticated;
GRANT SELECT, DELETE ON public.chat_participants TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.messages TO authenticated;

COMMENT ON FUNCTION public.get_or_create_direct_chat(uuid) IS
  'Creates or returns a two-person chat atomically. Direct table inserts are intentionally revoked.';
COMMENT ON FUNCTION public.send_chat_broadcast(uuid[], text) IS
  'Sends an atomic administrative broadcast to at most 100 available profiles after checking chat edit permission.';
