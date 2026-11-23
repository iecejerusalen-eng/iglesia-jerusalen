-- Room-scoped question editor, presentation styling, and authorized image uploads.

ALTER TABLE public.live_quiz_rooms
  ADD COLUMN IF NOT EXISTS editor_content jsonb NOT NULL
  DEFAULT '{"presentation":{},"questions":[]}'::jsonb;

ALTER TABLE public.live_quiz_rooms
  DROP CONSTRAINT IF EXISTS live_quiz_rooms_editor_content_object_check;
ALTER TABLE public.live_quiz_rooms
  ADD CONSTRAINT live_quiz_rooms_editor_content_object_check
  CHECK (jsonb_typeof(editor_content) = 'object');

CREATE OR REPLACE FUNCTION private.live_quiz_editor_question_count(p_room public.live_quiz_rooms)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN jsonb_typeof(p_room.editor_content -> 'questions') = 'array'
      AND jsonb_array_length(p_room.editor_content -> 'questions') > 0
      THEN jsonb_array_length(p_room.editor_content -> 'questions')
    ELSE cardinality(p_room.question_ids)
  END;
$$;

CREATE OR REPLACE FUNCTION private.live_quiz_editor_question_seconds(
  p_room public.live_quiz_rooms,
  p_question_index integer
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN jsonb_typeof(p_room.editor_content -> 'questions') = 'array'
      AND p_question_index BETWEEN 1 AND jsonb_array_length(p_room.editor_content -> 'questions')
      AND ((p_room.editor_content -> 'questions' -> (p_question_index - 1)) ->> 'time_seconds') ~ '^[0-9]{1,3}$'
      THEN least(60, greatest(10, (((p_room.editor_content -> 'questions' -> (p_question_index - 1)) ->> 'time_seconds')::integer)))
    ELSE p_room.question_seconds
  END;
$$;

CREATE OR REPLACE FUNCTION private.live_quiz_editor_question_payload(
  p_room public.live_quiz_rooms,
  p_question_index integer,
  p_revealed boolean
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_question jsonb;
  v_count integer := private.live_quiz_editor_question_count(p_room);
  v_options jsonb;
BEGIN
  IF p_question_index < 1 OR p_question_index > v_count THEN
    RETURN NULL;
  END IF;

  IF jsonb_typeof(p_room.editor_content -> 'questions') = 'array'
    AND jsonb_array_length(p_room.editor_content -> 'questions') > 0 THEN
    v_question := p_room.editor_content -> 'questions' -> (p_question_index - 1);
    RETURN jsonb_build_object(
      'text', v_question ->> 'text',
      'type', v_question ->> 'type',
      'options', COALESCE(v_question -> 'options', '[]'::jsonb),
      'correct_option', CASE WHEN p_revealed THEN lower(v_question ->> 'correct_option') ELSE NULL END,
      'explanation', CASE WHEN p_revealed THEN NULLIF(v_question ->> 'explanation', '') ELSE NULL END,
      'bible_reference', CASE WHEN p_revealed THEN NULLIF(v_question ->> 'bible_reference', '') ELSE NULL END,
      'image_url', NULLIF(v_question ->> 'image_url', ''),
      'image_alt', NULLIF(v_question ->> 'image_alt', ''),
      'color', NULLIF(v_question ->> 'color', ''),
      'index', p_question_index,
      'count', v_count
    );
  END IF;

  SELECT jsonb_build_object(
    'text', question.question,
    'type', 'multiple_choice',
    'options', jsonb_build_array(
      jsonb_build_object('key', 'a', 'text', question.option_a),
      jsonb_build_object('key', 'b', 'text', question.option_b),
      jsonb_build_object('key', 'c', 'text', question.option_c),
      jsonb_build_object('key', 'd', 'text', question.option_d)
    ),
    'correct_option', CASE WHEN p_revealed THEN lower(question.correct_option::text) ELSE NULL END,
    'explanation', CASE WHEN p_revealed THEN question.explanation ELSE NULL END,
    'bible_reference', NULL,
    'image_url', NULL,
    'image_alt', NULL,
    'color', NULL,
    'index', p_question_index,
    'count', v_count
  ) INTO v_options
  FROM public.game_biblionario_questions question
  WHERE question.id = p_room.question_ids[p_question_index];

  RETURN v_options;
END;
$$;

CREATE OR REPLACE FUNCTION private.live_quiz_editor_correct_option(
  p_room public.live_quiz_rooms,
  p_question_index integer
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_correct_option text;
BEGIN
  IF jsonb_typeof(p_room.editor_content -> 'questions') = 'array'
    AND jsonb_array_length(p_room.editor_content -> 'questions') > 0 THEN
    RETURN lower(p_room.editor_content -> 'questions' -> (p_question_index - 1) ->> 'correct_option');
  END IF;

  SELECT lower(question.correct_option::text)
  INTO v_correct_option
  FROM public.game_biblionario_questions question
  WHERE question.id = p_room.question_ids[p_question_index];
  RETURN v_correct_option;
END;
$$;

REVOKE ALL ON FUNCTION private.live_quiz_editor_question_count(public.live_quiz_rooms) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.live_quiz_editor_question_seconds(public.live_quiz_rooms, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.live_quiz_editor_question_payload(public.live_quiz_rooms, integer, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.live_quiz_editor_correct_option(public.live_quiz_rooms, integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.live_quiz_get_editor(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_room public.live_quiz_rooms%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT private.live_quiz_can_host() THEN
    RAISE EXCEPTION 'Tu rol no tiene permiso para editar salas.' USING ERRCODE = '42501';
  END IF;

  SELECT room.* INTO v_room
  FROM public.live_quiz_rooms room
  WHERE room.id = p_room_id AND room.host_user_id = (SELECT auth.uid());

  IF NOT FOUND OR v_room.status <> 'waiting' OR v_room.expires_at <= now() THEN
    RAISE EXCEPTION 'Solo puedes editar una sala tuya que siga en espera.' USING ERRCODE = '55000';
  END IF;

  RETURN jsonb_build_object(
    'title', v_room.title,
    'presentation', jsonb_build_object(
      'subtitle', COALESCE(v_room.editor_content #>> '{presentation,subtitle}', 'Descubramos juntos lo que enseñan las Escrituras'),
      'cover_image_url', COALESCE(v_room.editor_content #>> '{presentation,cover_image_url}', ''),
      'cover_image_alt', COALESCE(v_room.editor_content #>> '{presentation,cover_image_alt}', ''),
      'background_color', COALESCE(v_room.editor_content #>> '{presentation,background_color}', '#eef2ff'),
      'accent_color', COALESCE(v_room.editor_content #>> '{presentation,accent_color}', '#1e3a8a')
    ),
    'questions', COALESCE(v_room.editor_content -> 'questions', '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.live_quiz_save_editor(
  p_room_id uuid,
  p_title text,
  p_editor_content jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_room public.live_quiz_rooms%ROWTYPE;
  v_user_id uuid := (SELECT auth.uid());
  v_title text := btrim(COALESCE(p_title, ''));
  v_questions jsonb;
  v_presentation jsonb;
  v_question jsonb;
  v_index integer;
  v_option_count integer;
  v_key_count integer;
  v_correct_option text;
  v_image_url text;
BEGIN
  IF v_user_id IS NULL OR NOT private.live_quiz_can_host() THEN
    RAISE EXCEPTION 'Tu rol no tiene permiso para editar salas.' USING ERRCODE = '42501';
  END IF;

  SELECT room.* INTO v_room
  FROM public.live_quiz_rooms room
  WHERE room.id = p_room_id AND room.host_user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No encontramos una sala tuya con ese identificador.' USING ERRCODE = 'P0002';
  END IF;
  IF v_room.status <> 'waiting' OR v_room.expires_at <= now() THEN
    RAISE EXCEPTION 'La sala solo se puede editar mientras sigue en espera.' USING ERRCODE = '55000';
  END IF;
  IF char_length(v_title) NOT BETWEEN 3 AND 80 THEN
    RAISE EXCEPTION 'El título debe tener entre 3 y 80 caracteres.' USING ERRCODE = '22023';
  END IF;
  IF p_editor_content IS NULL
    OR jsonb_typeof(p_editor_content) <> 'object'
    OR COALESCE(jsonb_typeof(p_editor_content -> 'presentation'), '') <> 'object'
    OR COALESCE(jsonb_typeof(p_editor_content -> 'questions'), '') <> 'array' THEN
    RAISE EXCEPTION 'La presentación o las preguntas no tienen un formato válido.' USING ERRCODE = '22023';
  END IF;

  v_presentation := p_editor_content -> 'presentation';
  v_questions := p_editor_content -> 'questions';
  IF jsonb_array_length(v_questions) NOT BETWEEN 1 AND 30 THEN
    RAISE EXCEPTION 'La sala necesita entre 1 y 30 preguntas.' USING ERRCODE = '22023';
  END IF;
  IF char_length(COALESCE(v_presentation ->> 'subtitle', '')) > 120
    OR COALESCE(v_presentation ->> 'background_color', '') !~ '^#[0-9A-Fa-f]{6}$'
    OR COALESCE(v_presentation ->> 'accent_color', '') !~ '^#[0-9A-Fa-f]{6}$' THEN
    RAISE EXCEPTION 'Revisa el subtítulo y los colores de la presentación.' USING ERRCODE = '22023';
  END IF;

  v_image_url := NULLIF(btrim(v_presentation ->> 'cover_image_url'), '');
  IF v_image_url IS NOT NULL AND (
    char_length(COALESCE(v_presentation ->> 'cover_image_alt', '')) NOT BETWEEN 1 AND 180
    OR NOT (
      (v_image_url ~ '^/images/[A-Za-z0-9_./-]+[.](webp|png|jpe?g)$' AND strpos(v_image_url, '..') = 0)
      OR v_image_url ~ ('^https://gqtatqekfrswvplemknc[.]supabase[.]co/storage/v1/object/public/live-quiz-media/' || v_user_id::text || '/[A-Za-z0-9_-]+[.](webp|png|jpe?g)$')
    )
  ) THEN
    RAISE EXCEPTION 'La portada necesita una imagen aprobada y texto alternativo.' USING ERRCODE = '22023';
  END IF;

  IF (SELECT count(DISTINCT question ->> 'id') FROM jsonb_array_elements(v_questions) AS item(question)) <> jsonb_array_length(v_questions)
    OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(v_questions) AS item(question)
      WHERE jsonb_typeof(question) <> 'object'
        OR COALESCE(question ->> 'id', '') !~ '^[A-Za-z0-9_-]{1,80}$'
    ) THEN
    RAISE EXCEPTION 'Cada pregunta necesita un identificador único.' USING ERRCODE = '22023';
  END IF;

  FOR v_question, v_index IN
    SELECT item.question, item.ordinality::integer
    FROM jsonb_array_elements(v_questions) WITH ORDINALITY AS item(question, ordinality)
  LOOP
    IF COALESCE(v_question ->> 'type', '') NOT IN ('multiple_choice', 'true_false')
      OR char_length(btrim(COALESCE(v_question ->> 'text', ''))) NOT BETWEEN 8 AND 180
      OR char_length(COALESCE(v_question ->> 'explanation', '')) > 500
      OR char_length(COALESCE(v_question ->> 'bible_reference', '')) > 100
      OR COALESCE(v_question ->> 'color', '') !~ '^#[0-9A-Fa-f]{6}$'
      OR COALESCE(v_question ->> 'time_seconds', '') !~ '^(10|15|20|30|45|60)$'
      OR COALESCE(jsonb_typeof(v_question -> 'options'), '') <> 'array' THEN
      RAISE EXCEPTION 'Revisa el texto, el tipo, el tiempo o el color de la pregunta %.', v_index USING ERRCODE = '22023';
    END IF;

    v_option_count := jsonb_array_length(v_question -> 'options');
    SELECT count(DISTINCT lower(option ->> 'key'))
    INTO v_key_count
    FROM jsonb_array_elements(v_question -> 'options') AS answer(option);
    IF v_option_count NOT BETWEEN 2 AND 4 OR v_key_count <> v_option_count
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_question -> 'options') AS answer(option)
        WHERE jsonb_typeof(option) <> 'object'
          OR lower(COALESCE(option ->> 'key', '')) NOT IN ('a', 'b', 'c', 'd')
          OR COALESCE(char_length(btrim(option ->> 'text')) BETWEEN 1 AND 80, false) IS FALSE
      ) THEN
      RAISE EXCEPTION 'La pregunta % necesita entre 2 y 4 opciones válidas.', v_index USING ERRCODE = '22023';
    END IF;

    v_correct_option := lower(COALESCE(v_question ->> 'correct_option', ''));
    IF NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(v_question -> 'options') AS answer(option)
      WHERE lower(option ->> 'key') = v_correct_option
    ) THEN
      RAISE EXCEPTION 'Marca una respuesta correcta para la pregunta %.', v_index USING ERRCODE = '22023';
    END IF;
    IF v_question ->> 'type' = 'true_false' AND (
      v_option_count <> 2
      OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_question -> 'options') AS answer(option) WHERE lower(option ->> 'key') = 'a' AND lower(option ->> 'text') = 'verdadero')
      OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_question -> 'options') AS answer(option) WHERE lower(option ->> 'key') = 'b' AND lower(option ->> 'text') = 'falso')
    ) THEN
      RAISE EXCEPTION 'La pregunta % debe usar Verdadero y Falso.', v_index USING ERRCODE = '22023';
    END IF;

    v_image_url := NULLIF(btrim(v_question ->> 'image_url'), '');
    IF v_image_url IS NOT NULL AND (
      char_length(COALESCE(v_question ->> 'image_alt', '')) NOT BETWEEN 1 AND 180
      OR NOT (
        (v_image_url ~ '^/images/[A-Za-z0-9_./-]+[.](webp|png|jpe?g)$' AND strpos(v_image_url, '..') = 0)
        OR v_image_url ~ ('^https://gqtatqekfrswvplemknc[.]supabase[.]co/storage/v1/object/public/live-quiz-media/' || v_user_id::text || '/[A-Za-z0-9_-]+[.](webp|png|jpe?g)$')
      )
    ) THEN
      RAISE EXCEPTION 'La imagen de la pregunta % necesita una ruta aprobada y texto alternativo.', v_index USING ERRCODE = '22023';
    END IF;
  END LOOP;

  UPDATE public.live_quiz_rooms
  SET title = v_title,
      editor_content = p_editor_content,
      question_seconds = (v_questions -> 0 ->> 'time_seconds')::integer,
      updated_at = now()
  WHERE id = v_room.id;

  RETURN jsonb_build_object('saved', true, 'question_count', jsonb_array_length(v_questions));
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
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', room.id,
        'pin', room.pin_code,
        'title', room.title,
        'status', room.status,
        'phase', room.phase,
        'question_count', private.live_quiz_editor_question_count(room),
        'team_mode', room.team_mode,
        'score_mode', room.score_mode,
        'expires_at', room.expires_at,
        'created_at', room.created_at,
        'player_count', (SELECT count(*) FROM public.live_quiz_players player WHERE player.room_id = room.id)
      ) ORDER BY room.created_at DESC
    )
    FROM public.live_quiz_rooms room
    WHERE room.host_user_id = (SELECT auth.uid())
      AND room.status IN ('waiting', 'in_progress')
      AND room.expires_at > now()
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.live_quiz_get_state(p_pin text, p_player_token uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_room public.live_quiz_rooms%ROWTYPE;
  v_is_host boolean := false;
  v_player_id uuid;
  v_question jsonb;
  v_players jsonb;
  v_teams jsonb := '[]'::jsonb;
  v_question_report jsonb;
  v_reflections jsonb := '[]'::jsonb;
  v_my_answer text;
  v_my_reflection text;
  v_answered boolean := false;
  v_question_count integer;
BEGIN
  SELECT room.* INTO v_room
  FROM public.live_quiz_rooms room
  WHERE room.pin_code = regexp_replace(COALESCE(p_pin, ''), '[^0-9]', '', 'g');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No encontramos una sala con ese PIN.' USING ERRCODE = 'P0002';
  END IF;
  v_question_count := private.live_quiz_editor_question_count(v_room);
  v_is_host := (SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = v_room.host_user_id;
  IF NOT v_is_host THEN
    SELECT player.id INTO v_player_id
    FROM public.live_quiz_players player
    WHERE player.room_id = v_room.id AND player.session_token = p_player_token;
    IF v_player_id IS NULL THEN
      RAISE EXCEPTION 'Esta sesión no pertenece a la sala.' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF v_room.expires_at <= now() AND v_room.status IN ('waiting', 'in_progress') THEN
    UPDATE public.live_quiz_rooms SET status = 'expired', phase = 'finished', updated_at = now() WHERE id = v_room.id;
    v_room.status := 'expired';
    v_room.phase := 'finished';
  ELSIF v_room.status = 'in_progress'
    AND v_room.phase = 'question'
    AND v_room.question_started_at + make_interval(secs => v_room.question_seconds) <= now() THEN
    UPDATE public.live_quiz_rooms SET phase = 'reveal', updated_at = now() WHERE id = v_room.id AND phase = 'question';
    v_room.phase := 'reveal';
  END IF;

  IF v_player_id IS NOT NULL THEN
    SELECT answer.selected_option, true INTO v_my_answer, v_answered
    FROM public.live_quiz_answers answer
    WHERE answer.player_id = v_player_id AND answer.question_index = v_room.current_question_index;
  END IF;

  IF v_room.status <> 'waiting' AND v_room.current_question_index <= v_question_count THEN
    v_question := private.live_quiz_editor_question_payload(v_room, v_room.current_question_index, v_room.phase IN ('reveal', 'finished'));
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', player.id,
      'nickname', player.nickname,
      'score', player.score,
      'team_name', player.team_name,
      'answered_current', EXISTS (
        SELECT 1 FROM public.live_quiz_answers answer
        WHERE answer.player_id = player.id AND answer.question_index = v_room.current_question_index
      )
    ) ORDER BY player.score DESC, player.joined_at
  ), '[]'::jsonb)
  INTO v_players
  FROM public.live_quiz_players player
  WHERE player.room_id = v_room.id;

  IF v_room.team_mode THEN
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object('name', team.name, 'score', COALESCE(avg(player.score), 0), 'player_count', count(player.id))
      ORDER BY COALESCE(avg(player.score), 0) DESC, team.name
    ), '[]'::jsonb)
    INTO v_teams
    FROM unnest(v_room.team_names) AS team(name)
    LEFT JOIN public.live_quiz_players player ON player.room_id = v_room.id AND player.team_name = team.name;
  END IF;

  IF v_is_host AND v_room.status = 'finished' THEN
    IF jsonb_typeof(v_room.editor_content -> 'questions') = 'array'
      AND jsonb_array_length(v_room.editor_content -> 'questions') > 0 THEN
      SELECT COALESCE(jsonb_agg(report_row.data ORDER BY report_row.question_index), '[]'::jsonb)
      INTO v_question_report
      FROM (
        SELECT selected.question_index,
          jsonb_build_object(
            'index', selected.question_index,
            'question', selected.question_data ->> 'text',
            'correct_option', lower(selected.question_data ->> 'correct_option'),
            'answers', count(answer.id),
            'correct_answers', count(answer.id) FILTER (WHERE answer.is_correct),
            'average_response_ms', COALESCE(round(avg(answer.response_ms)), 0)
          ) AS data
        FROM jsonb_array_elements(v_room.editor_content -> 'questions') WITH ORDINALITY AS selected(question_data, question_index)
        LEFT JOIN public.live_quiz_answers answer
          ON answer.room_id = v_room.id AND answer.question_index = selected.question_index
        GROUP BY selected.question_index, selected.question_data
      ) AS report_row;
    ELSE
      SELECT COALESCE(jsonb_agg(report_row.data ORDER BY report_row.question_index), '[]'::jsonb)
      INTO v_question_report
      FROM (
        SELECT selected.question_index,
          jsonb_build_object(
            'index', selected.question_index,
            'question', question.question,
            'correct_option', lower(question.correct_option::text),
            'answers', count(answer.id),
            'correct_answers', count(answer.id) FILTER (WHERE answer.is_correct),
            'average_response_ms', COALESCE(round(avg(answer.response_ms)), 0)
          ) AS data
        FROM unnest(v_room.question_ids) WITH ORDINALITY AS selected(question_id, question_index)
        JOIN public.game_biblionario_questions question ON question.id = selected.question_id
        LEFT JOIN public.live_quiz_answers answer
          ON answer.room_id = v_room.id AND answer.question_index = selected.question_index
        GROUP BY selected.question_index, question.question, question.correct_option
      ) AS report_row;
    END IF;
  END IF;

  IF v_player_id IS NOT NULL THEN
    SELECT reflection.response INTO v_my_reflection
    FROM public.live_quiz_reflections reflection
    WHERE reflection.room_id = v_room.id AND reflection.player_id = v_player_id;
  ELSIF v_is_host AND v_room.status = 'finished' AND v_room.reflection_prompt IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('nickname', player.nickname, 'response', reflection.response) ORDER BY reflection.created_at), '[]'::jsonb)
    INTO v_reflections
    FROM public.live_quiz_reflections reflection
    JOIN public.live_quiz_players player ON player.id = reflection.player_id
    WHERE reflection.room_id = v_room.id;
  END IF;

  RETURN jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_room.id,
      'pin', v_room.pin_code,
      'title', v_room.title,
      'status', v_room.status,
      'phase', v_room.phase,
      'question_index', v_room.current_question_index,
      'question_count', v_question_count,
      'question_seconds', v_room.question_seconds,
      'question_started_at', v_room.question_started_at,
      'team_mode', v_room.team_mode,
      'team_names', v_room.team_names,
      'score_mode', v_room.score_mode,
      'reflection_prompt', v_room.reflection_prompt,
      'presentation', jsonb_build_object(
        'subtitle', COALESCE(v_room.editor_content #>> '{presentation,subtitle}', 'Descubramos juntos lo que enseñan las Escrituras'),
        'cover_image_url', COALESCE(v_room.editor_content #>> '{presentation,cover_image_url}', ''),
        'cover_image_alt', COALESCE(v_room.editor_content #>> '{presentation,cover_image_alt}', ''),
        'background_color', COALESCE(v_room.editor_content #>> '{presentation,background_color}', '#eef2ff'),
        'accent_color', COALESCE(v_room.editor_content #>> '{presentation,accent_color}', '#1e3a8a')
      ),
      'expires_at', v_room.expires_at,
      'created_at', v_room.created_at
    ),
    'is_host', v_is_host,
    'question', v_question,
    'players', v_players,
    'teams', v_teams,
    'question_report', v_question_report,
    'reflections', v_reflections,
    'my_reflection', v_my_reflection,
    'player_count', jsonb_array_length(v_players),
    'answered_current', COALESCE(v_answered, false),
    'my_answer', CASE WHEN v_room.phase IN ('reveal', 'finished') THEN v_my_answer ELSE NULL END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.live_quiz_submit_answer(
  p_pin text,
  p_player_token uuid,
  p_question_index integer,
  p_selected_option text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_room public.live_quiz_rooms%ROWTYPE;
  v_player_id uuid;
  v_correct_option text;
  v_correct boolean;
  v_elapsed_ms integer;
  v_points integer;
  v_answer_id uuid;
BEGIN
  SELECT room.* INTO v_room
  FROM public.live_quiz_rooms room
  WHERE room.pin_code = regexp_replace(COALESCE(p_pin, ''), '[^0-9]', '', 'g')
  FOR UPDATE;

  IF NOT FOUND OR v_room.status <> 'in_progress' OR v_room.phase <> 'question' THEN
    RAISE EXCEPTION 'Esta pregunta ya no está recibiendo respuestas.' USING ERRCODE = '55000';
  END IF;
  IF v_room.expires_at <= now() OR v_room.question_started_at + make_interval(secs => v_room.question_seconds) <= now() THEN
    RAISE EXCEPTION 'Se acabó el tiempo para responder.' USING ERRCODE = '55000';
  END IF;
  IF p_question_index <> v_room.current_question_index OR lower(COALESCE(p_selected_option, '')) NOT IN ('a', 'b', 'c', 'd') THEN
    RAISE EXCEPTION 'La respuesta no coincide con la pregunta actual.' USING ERRCODE = '22023';
  END IF;

  SELECT player.id INTO v_player_id
  FROM public.live_quiz_players player
  WHERE player.room_id = v_room.id AND player.session_token = p_player_token;
  IF v_player_id IS NULL THEN
    RAISE EXCEPTION 'Esta sesión no pertenece a la sala.' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(v_room.editor_content -> 'questions') = 'array'
    AND jsonb_array_length(v_room.editor_content -> 'questions') > 0
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(v_room.editor_content -> 'questions' -> (v_room.current_question_index - 1) -> 'options') AS choice(item)
      WHERE lower(choice.item ->> 'key') = lower(p_selected_option)
    ) THEN
    RAISE EXCEPTION 'Esa opción no pertenece a la pregunta actual.' USING ERRCODE = '22023';
  END IF;

  v_correct_option := private.live_quiz_editor_correct_option(v_room, v_room.current_question_index);
  IF v_correct_option IS NULL THEN
    RAISE EXCEPTION 'La pregunta ya no está disponible.' USING ERRCODE = 'P0002';
  END IF;
  v_correct := lower(p_selected_option) = v_correct_option;
  v_elapsed_ms := greatest(0, floor(extract(epoch FROM (clock_timestamp() - v_room.question_started_at)) * 1000)::integer);
  v_points := CASE
    WHEN NOT v_correct THEN 0
    WHEN v_room.score_mode = 'accuracy' THEN 1000
    ELSE 500 + floor(500.0 * (1.0 - least(v_elapsed_ms, v_room.question_seconds * 1000)::numeric / (v_room.question_seconds * 1000)))::integer
  END;

  INSERT INTO public.live_quiz_answers (room_id, player_id, question_index, selected_option, is_correct, points, response_ms)
  VALUES (v_room.id, v_player_id, v_room.current_question_index, lower(p_selected_option), v_correct, v_points, v_elapsed_ms)
  ON CONFLICT (player_id, question_index) DO NOTHING
  RETURNING id INTO v_answer_id;
  IF v_answer_id IS NULL THEN
    RAISE EXCEPTION 'Ya respondiste esta pregunta.' USING ERRCODE = '23505';
  END IF;

  UPDATE public.live_quiz_players SET score = score + v_points WHERE id = v_player_id;
  IF NOT EXISTS (
    SELECT 1 FROM public.live_quiz_players player
    WHERE player.room_id = v_room.id
      AND NOT EXISTS (
        SELECT 1 FROM public.live_quiz_answers answer
        WHERE answer.player_id = player.id AND answer.question_index = v_room.current_question_index
      )
  ) THEN
    UPDATE public.live_quiz_rooms SET phase = 'reveal', updated_at = now() WHERE id = v_room.id AND phase = 'question';
  END IF;
  RETURN jsonb_build_object('accepted', true, 'points', v_points);
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
    SELECT count(*)::integer INTO v_player_count FROM public.live_quiz_players player WHERE player.room_id = v_room.id;
    IF v_room.status <> 'waiting' OR v_player_count = 0 THEN
      RAISE EXCEPTION 'Necesitas al menos una persona en la sala para iniciar.' USING ERRCODE = '55000';
    END IF;
    v_next_seconds := private.live_quiz_editor_question_seconds(v_room, 1);
    UPDATE public.live_quiz_rooms
    SET status = 'in_progress', phase = 'question', current_question_index = 1,
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

REVOKE ALL ON FUNCTION public.live_quiz_get_editor(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.live_quiz_save_editor(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.live_quiz_get_editor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_quiz_save_editor(uuid, text, jsonb) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('live-quiz-media', 'live-quiz-media', true, 4194304, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authorized hosts upload live quiz images" ON storage.objects;
CREATE POLICY "Authorized hosts upload live quiz images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'live-quiz-media'
  AND private.live_quiz_can_host()
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);
