-- Replays get a fresh PIN and independent results while retaining the source activity.

ALTER TABLE public.live_quiz_rooms
  ADD COLUMN settings jsonb NOT NULL DEFAULT '{"shuffle_questions": false, "shuffle_answers": false}'::jsonb,
  ADD COLUMN source_room_id uuid REFERENCES public.live_quiz_rooms(id) ON DELETE SET NULL,
  ADD COLUMN replay_number integer NOT NULL DEFAULT 0 CHECK (replay_number >= 0);

ALTER TABLE public.live_quiz_rooms
  ADD CONSTRAINT live_quiz_rooms_settings_object_check
  CHECK (
    jsonb_typeof(settings) = 'object'
    AND jsonb_typeof(settings -> 'shuffle_questions') = 'boolean'
    AND jsonb_typeof(settings -> 'shuffle_answers') = 'boolean'
  );

CREATE INDEX live_quiz_rooms_replay_source_idx
  ON public.live_quiz_rooms (source_room_id, replay_number)
  WHERE source_room_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.live_quiz_create_room_with_settings(
  p_title text,
  p_question_count integer,
  p_question_seconds integer,
  p_lifetime_days integer,
  p_team_mode boolean,
  p_team_count integer,
  p_score_mode text,
  p_reflection_prompt text,
  p_settings jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_created jsonb;
  v_room_id uuid;
BEGIN
  IF jsonb_typeof(p_settings) IS DISTINCT FROM 'object'
    OR jsonb_typeof(p_settings -> 'shuffle_questions') IS DISTINCT FROM 'boolean'
    OR jsonb_typeof(p_settings -> 'shuffle_answers') IS DISTINCT FROM 'boolean' THEN
    RAISE EXCEPTION 'La configuración de mezcla no es válida.' USING ERRCODE = '22023';
  END IF;

  v_created := public.live_quiz_create_room(
    p_title, p_question_count, p_question_seconds, p_lifetime_days,
    p_team_mode, p_team_count, p_score_mode, p_reflection_prompt
  );
  v_room_id := (v_created ->> 'id')::uuid;

  UPDATE public.live_quiz_rooms
  SET settings = p_settings, updated_at = now()
  WHERE id = v_room_id AND host_user_id = (SELECT auth.uid());

  RETURN v_created || jsonb_build_object('settings', p_settings);
END;
$$;

CREATE OR REPLACE FUNCTION public.live_quiz_replay_room(
  p_room_id uuid,
  p_lifetime_days integer,
  p_configuration jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_source public.live_quiz_rooms%ROWTYPE;
  v_root_id uuid;
  v_root_title text;
  v_replay_number integer;
  v_suffix text;
  v_title text;
  v_team_mode boolean;
  v_team_count integer;
  v_score_mode text;
  v_reflection_prompt text;
  v_settings jsonb;
  v_created jsonb;
  v_room_id uuid;
BEGIN
  IF v_user_id IS NULL OR NOT private.live_quiz_can_host() THEN
    RAISE EXCEPTION 'Tu rol no tiene permiso para reactivar salas.' USING ERRCODE = '42501';
  END IF;
  IF p_lifetime_days IS NULL OR p_lifetime_days NOT BETWEEN 1 AND 365 THEN
    RAISE EXCEPTION 'La vigencia debe estar entre 1 y 365 días.' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_configuration) IS DISTINCT FROM 'object'
    OR jsonb_typeof(p_configuration -> 'shuffle_questions') IS DISTINCT FROM 'boolean'
    OR jsonb_typeof(p_configuration -> 'shuffle_answers') IS DISTINCT FROM 'boolean'
    OR jsonb_typeof(p_configuration -> 'team_mode') IS DISTINCT FROM 'boolean'
    OR jsonb_typeof(p_configuration -> 'team_count') IS DISTINCT FROM 'number'
    OR jsonb_typeof(p_configuration -> 'score_mode') IS DISTINCT FROM 'string'
    OR NOT (p_configuration ? 'reflection_prompt')
    OR (jsonb_typeof(p_configuration -> 'reflection_prompt') IS DISTINCT FROM 'string'
      AND jsonb_typeof(p_configuration -> 'reflection_prompt') IS DISTINCT FROM 'null') THEN
    RAISE EXCEPTION 'La configuración de la repetición no es válida.' USING ERRCODE = '22023';
  END IF;

  v_team_mode := (p_configuration ->> 'team_mode')::boolean;
  IF (p_configuration ->> 'team_count') !~ '^[0-9]{1,2}$' THEN
    RAISE EXCEPTION 'La cantidad de equipos no es válida.' USING ERRCODE = '22023';
  END IF;
  v_team_count := (p_configuration ->> 'team_count')::integer;
  v_score_mode := p_configuration ->> 'score_mode';
  v_reflection_prompt := NULLIF(btrim(p_configuration ->> 'reflection_prompt'), '');
  v_settings := jsonb_build_object(
    'shuffle_questions', (p_configuration ->> 'shuffle_questions')::boolean,
    'shuffle_answers', (p_configuration ->> 'shuffle_answers')::boolean
  );

  IF v_team_mode AND v_team_count NOT BETWEEN 2 AND 10 THEN
    RAISE EXCEPTION 'Elige entre 2 y 10 equipos.' USING ERRCODE = '22023';
  END IF;
  IF v_score_mode NOT IN ('speed', 'accuracy') THEN
    RAISE EXCEPTION 'El modo de puntaje no es válido.' USING ERRCODE = '22023';
  END IF;
  IF v_reflection_prompt IS NOT NULL AND char_length(v_reflection_prompt) NOT BETWEEN 3 AND 180 THEN
    RAISE EXCEPTION 'La pregunta para conversar debe tener entre 3 y 180 caracteres.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  SELECT room.* INTO v_source
  FROM public.live_quiz_rooms room
  WHERE room.id = p_room_id AND room.host_user_id = v_user_id
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No encontramos una sala tuya con ese identificador.' USING ERRCODE = 'P0002';
  END IF;
  IF v_source.status NOT IN ('finished', 'expired') AND v_source.expires_at > now() THEN
    RAISE EXCEPTION 'Solo puedes reactivar una sala terminada o vencida.' USING ERRCODE = '55000';
  END IF;

  v_root_id := COALESCE(v_source.source_room_id, v_source.id);
  SELECT root.title INTO v_root_title
  FROM public.live_quiz_rooms root
  WHERE root.id = v_root_id AND root.host_user_id = v_user_id;
  IF v_root_title IS NULL THEN
    v_root_title := regexp_replace(v_source.title, ' · Repetición [0-9]+$', '');
  END IF;

  SELECT COALESCE(max(room.replay_number), 0) + 1 INTO v_replay_number
  FROM public.live_quiz_rooms room
  WHERE room.host_user_id = v_user_id
    AND (room.id = v_root_id OR room.source_room_id = v_root_id);

  v_suffix := ' · Repetición ' || v_replay_number::text;
  v_title := left(v_root_title, 80 - char_length(v_suffix)) || v_suffix;

  v_created := public.live_quiz_create_room(
    v_title,
    cardinality(v_source.question_ids),
    v_source.question_seconds,
    p_lifetime_days,
    v_team_mode,
    v_team_count,
    v_score_mode,
    v_reflection_prompt
  );
  v_room_id := (v_created ->> 'id')::uuid;

  UPDATE public.live_quiz_rooms
  SET question_ids = v_source.question_ids,
      editor_content = v_source.editor_content,
      settings = v_settings,
      source_room_id = v_root_id,
      replay_number = v_replay_number,
      updated_at = now()
  WHERE id = v_room_id AND host_user_id = v_user_id;

  RETURN v_created || jsonb_build_object(
    'title', v_title,
    'replay_number', v_replay_number,
    'source_room_id', v_root_id,
    'settings', v_settings
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.live_quiz_prepare_questions(p_room public.live_quiz_rooms)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_questions jsonb := COALESCE(p_room.editor_content -> 'questions', '[]'::jsonb);
  v_prepared jsonb;
  v_shuffle_questions boolean := COALESCE((p_room.settings ->> 'shuffle_questions')::boolean, false);
  v_shuffle_answers boolean := COALESCE((p_room.settings ->> 'shuffle_answers')::boolean, false);
BEGIN
  IF NOT v_shuffle_questions AND NOT v_shuffle_answers THEN
    RETURN p_room.editor_content;
  END IF;

  IF jsonb_typeof(v_questions) IS DISTINCT FROM 'array' OR jsonb_array_length(v_questions) = 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', 'legacy-' || question.id::text,
      'type', 'multiple_choice',
      'text', question.question,
      'options', jsonb_build_array(
        jsonb_build_object('key', 'a', 'text', question.option_a),
        jsonb_build_object('key', 'b', 'text', question.option_b),
        jsonb_build_object('key', 'c', 'text', question.option_c),
        jsonb_build_object('key', 'd', 'text', question.option_d)
      ),
      'correct_option', lower(question.correct_option::text),
      'time_seconds', p_room.question_seconds,
      'explanation', COALESCE(question.explanation, ''),
      'bible_reference', '',
      'image_url', '',
      'image_alt', '',
      'color', '#1e3a8a'
    ) ORDER BY selected.ordinality), '[]'::jsonb)
    INTO v_questions
    FROM unnest(p_room.question_ids) WITH ORDINALITY AS selected(question_id, ordinality)
    JOIN public.game_biblionario_questions question ON question.id = selected.question_id;
  END IF;

  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN v_shuffle_answers AND jsonb_typeof(question.value -> 'options') = 'array' THEN
        jsonb_set(question.value, '{options}', COALESCE((
          SELECT jsonb_agg(option.value ORDER BY random())
          FROM jsonb_array_elements(question.value -> 'options') AS option(value)
        ), '[]'::jsonb), true)
      ELSE question.value
    END
    ORDER BY CASE WHEN v_shuffle_questions THEN random() ELSE question.ordinality::double precision END
  ), '[]'::jsonb)
  INTO v_prepared
  FROM jsonb_array_elements(v_questions) WITH ORDINALITY AS question(value, ordinality);

  RETURN jsonb_set(
    COALESCE(p_room.editor_content, '{"presentation": {}}'::jsonb),
    '{questions}',
    v_prepared,
    true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.live_quiz_host_action(p_room_id uuid, p_action text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_room public.live_quiz_rooms%ROWTYPE;
  v_player_count integer;
  v_question_count integer;
  v_next_seconds integer;
  v_editor_content jsonb;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT private.live_quiz_can_host() THEN
    RAISE EXCEPTION 'Tu rol no tiene permiso para controlar salas.' USING ERRCODE = '42501';
  END IF;

  SELECT room.* INTO v_room
  FROM public.live_quiz_rooms room
  WHERE room.id = p_room_id AND room.host_user_id = (SELECT auth.uid())
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No encontramos una sala tuya con ese identificador.' USING ERRCODE = 'P0002';
  END IF;
  IF v_room.expires_at <= now() AND v_room.status IN ('waiting', 'in_progress') THEN
    UPDATE public.live_quiz_rooms SET status = 'expired', phase = 'finished', updated_at = now() WHERE id = v_room.id;
    RAISE EXCEPTION 'Esta sala ya expiró.' USING ERRCODE = '55000';
  END IF;

  v_question_count := private.live_quiz_editor_question_count(v_room);
  IF p_action = 'start' THEN
    SELECT count(*)::integer INTO v_player_count
    FROM public.live_quiz_players player
    WHERE player.room_id = v_room.id;
    IF v_room.status <> 'waiting' OR v_player_count = 0 THEN
      RAISE EXCEPTION 'Necesitas al menos una persona en la sala para iniciar.' USING ERRCODE = '55000';
    END IF;

    v_editor_content := private.live_quiz_prepare_questions(v_room);
    v_room.editor_content := v_editor_content;
    v_next_seconds := private.live_quiz_editor_question_seconds(v_room, 1);
    UPDATE public.live_quiz_rooms
    SET editor_content = v_editor_content,
        status = 'in_progress', phase = 'question', current_question_index = 1,
        question_seconds = v_next_seconds, question_started_at = now(), updated_at = now()
    WHERE id = v_room.id;
  ELSIF p_action = 'reveal' THEN
    IF v_room.status <> 'in_progress' OR v_room.phase <> 'question' THEN
      RAISE EXCEPTION 'No se puede revelar la respuesta en este momento.' USING ERRCODE = '55000';
    END IF;
    UPDATE public.live_quiz_rooms SET phase = 'reveal', updated_at = now() WHERE id = v_room.id;
  ELSIF p_action = 'next' THEN
    IF v_room.status <> 'in_progress' OR v_room.phase <> 'reveal' THEN
      RAISE EXCEPTION 'Primero muestra la respuesta actual.' USING ERRCODE = '55000';
    END IF;
    IF v_room.current_question_index >= v_question_count THEN
      UPDATE public.live_quiz_rooms SET status = 'finished', phase = 'finished', updated_at = now() WHERE id = v_room.id;
    ELSE
      v_next_seconds := private.live_quiz_editor_question_seconds(v_room, v_room.current_question_index + 1);
      UPDATE public.live_quiz_rooms
      SET current_question_index = current_question_index + 1,
          question_seconds = v_next_seconds,
          phase = 'question', question_started_at = now(), updated_at = now()
      WHERE id = v_room.id;
    END IF;
  ELSIF p_action = 'finish' THEN
    UPDATE public.live_quiz_rooms SET status = 'finished', phase = 'finished', updated_at = now() WHERE id = v_room.id;
  ELSE
    RAISE EXCEPTION 'Acción de sala no válida.' USING ERRCODE = '22023';
  END IF;

  RETURN jsonb_build_object('updated', true, 'action', p_action);
END;
$$;

CREATE OR REPLACE FUNCTION public.live_quiz_list_my_rooms()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT private.live_quiz_can_host() THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', room.id,
      'pin', room.pin_code,
      'title', room.title,
      'status', CASE
        WHEN room.expires_at <= now() AND room.status IN ('waiting', 'in_progress') THEN 'expired'
        ELSE room.status
      END,
      'phase', room.phase,
      'question_count', private.live_quiz_editor_question_count(room),
      'team_mode', room.team_mode,
      'team_count', cardinality(room.team_names),
      'score_mode', room.score_mode,
      'reflection_prompt', room.reflection_prompt,
      'settings', room.settings,
      'source_room_id', room.source_room_id,
      'replay_number', room.replay_number,
      'expires_at', room.expires_at,
      'created_at', room.created_at,
      'player_count', (SELECT count(*) FROM public.live_quiz_players player WHERE player.room_id = room.id)
    ) ORDER BY room.created_at DESC)
    FROM public.live_quiz_rooms room
    WHERE room.host_user_id = (SELECT auth.uid())
  ), '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.live_quiz_create_room_with_settings(text, integer, integer, integer, boolean, integer, text, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.live_quiz_replay_room(uuid, integer, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.live_quiz_prepare_questions(public.live_quiz_rooms) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.live_quiz_host_action(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.live_quiz_list_my_rooms() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.live_quiz_create_room_with_settings(text, integer, integer, integer, boolean, integer, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_quiz_replay_room(uuid, integer, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_quiz_host_action(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_quiz_list_my_rooms() TO authenticated;
