-- Live quiz rooms for public participants, with database-enforced host access,
-- PIN expiry, server-side answer scoring, and a per-host active-room cap.

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.live_quiz_limits (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  max_active_rooms_per_host integer NOT NULL DEFAULT 3 CHECK (max_active_rooms_per_host BETWEEN 1 AND 20),
  max_players_per_room integer NOT NULL DEFAULT 100 CHECK (max_players_per_room BETWEEN 2 AND 500)
);

INSERT INTO private.live_quiz_limits (singleton)
VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

REVOKE ALL ON TABLE private.live_quiz_limits FROM PUBLIC, anon, authenticated;

CREATE TABLE public.live_quiz_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_code text NOT NULL UNIQUE CHECK (pin_code ~ '^[0-9]{8}$'),
  host_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 80),
  question_ids uuid[] NOT NULL CHECK (cardinality(question_ids) BETWEEN 5 AND 15),
  question_seconds integer NOT NULL DEFAULT 20 CHECK (question_seconds BETWEEN 10 AND 60),
  team_mode boolean NOT NULL DEFAULT false,
  team_names text[] NOT NULL DEFAULT ARRAY[]::text[],
  score_mode text NOT NULL DEFAULT 'speed' CHECK (score_mode IN ('speed', 'accuracy')),
  reflection_prompt text CHECK (reflection_prompt IS NULL OR char_length(reflection_prompt) BETWEEN 3 AND 180),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'finished', 'expired')),
  phase text NOT NULL DEFAULT 'lobby' CHECK (phase IN ('lobby', 'question', 'reveal', 'finished')),
  current_question_index integer NOT NULL DEFAULT 1 CHECK (current_question_index > 0),
  question_started_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((team_mode AND cardinality(team_names) BETWEEN 2 AND 10) OR (NOT team_mode AND cardinality(team_names) = 0))
);

CREATE INDEX live_quiz_rooms_host_active_idx
  ON public.live_quiz_rooms (host_user_id, expires_at)
  WHERE status IN ('waiting', 'in_progress');

CREATE TABLE public.live_quiz_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.live_quiz_rooms(id) ON DELETE CASCADE,
  session_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  nickname text NOT NULL CHECK (char_length(nickname) BETWEEN 2 AND 24),
  team_name text,
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0),
  joined_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX live_quiz_players_room_nickname_idx
  ON public.live_quiz_players (room_id, lower(nickname));
CREATE INDEX live_quiz_players_room_score_idx
  ON public.live_quiz_players (room_id, score DESC, joined_at);

CREATE TABLE public.live_quiz_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.live_quiz_rooms(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.live_quiz_players(id) ON DELETE CASCADE,
  response text NOT NULL CHECK (char_length(response) BETWEEN 3 AND 250),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, player_id)
);
CREATE INDEX live_quiz_reflections_room_idx
  ON public.live_quiz_reflections (room_id, created_at);

CREATE TABLE public.live_quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.live_quiz_rooms(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.live_quiz_players(id) ON DELETE CASCADE,
  question_index integer NOT NULL CHECK (question_index > 0),
  selected_option text NOT NULL CHECK (selected_option IN ('a', 'b', 'c', 'd')),
  is_correct boolean NOT NULL,
  points integer NOT NULL DEFAULT 0 CHECK (points >= 0),
  response_ms integer NOT NULL CHECK (response_ms >= 0),
  answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, question_index)
);

ALTER TABLE public.live_quiz_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_quiz_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_quiz_reflections ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.live_quiz_rooms, public.live_quiz_players, public.live_quiz_answers
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.live_quiz_reflections FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.live_quiz_can_host()
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
        EXISTS (
          SELECT 1
          FROM unnest(array_prepend(profile.role::text, COALESCE(profile.roles::text[], ARRAY[]::text[]))) AS assigned(role_name)
          WHERE lower(assigned.role_name) NOT IN ('visitor', 'visitante', 'guest', 'invitado', 'anonymous', 'anon')
        )
        OR COALESCE((profile.permissions_override -> 'games' ->> 'edit')::boolean, false)
        OR EXISTS (
          SELECT 1
          FROM public.role_permissions permission
          WHERE permission.role::text = ANY(array_prepend(profile.role::text, COALESCE(profile.roles::text[], ARRAY[]::text[])))
            AND COALESCE((permission.permissions -> 'games' ->> 'edit')::boolean, false)
        )
        OR EXISTS (
          SELECT 1
          FROM public.access_roles access_role
          WHERE access_role.id = ANY(COALESCE(profile.custom_role_ids, ARRAY[]::uuid[]))
            AND access_role.is_active
            AND COALESCE((access_role.permissions -> 'games' ->> 'edit')::boolean, false)
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION private.live_quiz_can_host() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.live_quiz_can_host() TO authenticated;

CREATE OR REPLACE FUNCTION public.live_quiz_create_room(
  p_title text,
  p_question_count integer DEFAULT 10,
  p_question_seconds integer DEFAULT 20,
  p_lifetime_days integer DEFAULT 7,
  p_team_mode boolean DEFAULT false,
  p_team_count integer DEFAULT 3,
  p_score_mode text DEFAULT 'speed',
  p_reflection_prompt text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_title text := btrim(COALESCE(p_title, ''));
  v_question_ids uuid[];
  v_room_id uuid;
  v_created_id uuid;
  v_pin text;
  v_attempt integer;
  v_active_count integer;
  v_room_limit integer;
  v_team_names text[] := ARRAY[]::text[];
  v_reflection_prompt text := NULLIF(btrim(COALESCE(p_reflection_prompt, '')), '');
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT private.live_quiz_can_host() THEN
    RAISE EXCEPTION 'Tu rol no tiene permiso para crear salas.' USING ERRCODE = '42501';
  END IF;

  IF char_length(v_title) NOT BETWEEN 3 AND 80 THEN
    RAISE EXCEPTION 'El nombre de la sala debe tener entre 3 y 80 caracteres.' USING ERRCODE = '22023';
  END IF;
  IF p_question_count NOT IN (5, 10, 15) THEN
    RAISE EXCEPTION 'Elige 5, 10 o 15 preguntas.' USING ERRCODE = '22023';
  END IF;
  IF p_question_seconds NOT BETWEEN 10 AND 60 THEN
    RAISE EXCEPTION 'El tiempo por pregunta debe estar entre 10 y 60 segundos.' USING ERRCODE = '22023';
  END IF;
  IF p_lifetime_days NOT BETWEEN 1 AND 365 THEN
    RAISE EXCEPTION 'La duración de una sala debe estar entre 1 y 365 días.' USING ERRCODE = '22023';
  END IF;
  IF p_team_mode AND p_team_count NOT BETWEEN 2 AND 10 THEN
    RAISE EXCEPTION 'Elige entre 2 y 10 equipos.' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(p_score_mode, '') NOT IN ('speed', 'accuracy') THEN
    RAISE EXCEPTION 'El modo de puntaje no es válido.' USING ERRCODE = '22023';
  END IF;
  IF v_reflection_prompt IS NOT NULL AND char_length(v_reflection_prompt) NOT BETWEEN 3 AND 180 THEN
    RAISE EXCEPTION 'La pregunta para conversar debe tener entre 3 y 180 caracteres.' USING ERRCODE = '22023';
  END IF;
  IF p_team_mode THEN
    SELECT array_agg('Equipo ' || team_number ORDER BY team_number)
    INTO v_team_names
    FROM generate_series(1, p_team_count) AS teams(team_number);
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended((SELECT auth.uid())::text, 0));

  SELECT limits.max_active_rooms_per_host
  INTO v_room_limit
  FROM private.live_quiz_limits limits
  WHERE limits.singleton = true;

  SELECT count(*)::integer
  INTO v_active_count
  FROM public.live_quiz_rooms room
  WHERE room.host_user_id = (SELECT auth.uid())
    AND room.status IN ('waiting', 'in_progress')
    AND room.expires_at > now();

  IF v_active_count >= COALESCE(v_room_limit, 3) THEN
    RAISE EXCEPTION 'Ya tienes el máximo de % salas activas. Cierra una sala para liberar un cupo.', COALESCE(v_room_limit, 3)
      USING ERRCODE = '54000';
  END IF;

  SELECT array_agg(sampled.id ORDER BY sampled.position)
  INTO v_question_ids
  FROM (
    SELECT candidate.id, row_number() OVER (ORDER BY random()) AS position
    FROM (
      SELECT question.id
      FROM public.game_biblionario_questions question
      ORDER BY random()
      LIMIT p_question_count
    ) candidate
  ) sampled;

  IF COALESCE(cardinality(v_question_ids), 0) < p_question_count THEN
    RAISE EXCEPTION 'Aún no hay suficientes preguntas publicadas para crear esta sala.' USING ERRCODE = 'P0002';
  END IF;

  FOR v_attempt IN 1..20 LOOP
    v_pin := lpad(floor(random() * 100000000)::integer::text, 8, '0');
    v_room_id := gen_random_uuid();
    v_created_id := NULL;

    INSERT INTO public.live_quiz_rooms (
      id, pin_code, host_user_id, title, question_ids, question_seconds,
      team_mode, team_names, score_mode, reflection_prompt, expires_at
    )
    VALUES (
      v_room_id, v_pin, (SELECT auth.uid()), v_title, v_question_ids, p_question_seconds,
      COALESCE(p_team_mode, false), v_team_names, p_score_mode, v_reflection_prompt,
      now() + make_interval(days => p_lifetime_days)
    )
    ON CONFLICT (pin_code) DO NOTHING
    RETURNING id INTO v_created_id;

    EXIT WHEN v_created_id IS NOT NULL;
  END LOOP;

  IF v_created_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo generar un PIN. Inténtalo otra vez.' USING ERRCODE = '40001';
  END IF;

  RETURN jsonb_build_object(
    'id', v_created_id,
    'pin', v_pin,
    'title', v_title,
    'status', 'waiting',
    'phase', 'lobby',
    'question_count', p_question_count,
    'question_seconds', p_question_seconds,
    'team_mode', COALESCE(p_team_mode, false),
    'team_names', v_team_names,
    'score_mode', p_score_mode,
    'reflection_prompt', v_reflection_prompt,
    'expires_at', now() + make_interval(days => p_lifetime_days)
  );
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
        'question_count', cardinality(room.question_ids),
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

CREATE OR REPLACE FUNCTION public.live_quiz_join_room(p_pin text, p_nickname text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_room public.live_quiz_rooms%ROWTYPE;
  v_nickname text := regexp_replace(btrim(COALESCE(p_nickname, '')), '[[:space:]]+', ' ', 'g');
  v_player_id uuid;
  v_token uuid;
  v_team_name text;
  v_player_count integer;
  v_player_limit integer;
BEGIN
  IF char_length(v_nickname) NOT BETWEEN 2 AND 24 THEN
    RAISE EXCEPTION 'El apodo debe tener entre 2 y 24 caracteres.' USING ERRCODE = '22023';
  END IF;

  SELECT room.*
  INTO v_room
  FROM public.live_quiz_rooms room
  WHERE room.pin_code = regexp_replace(COALESCE(p_pin, ''), '[^0-9]', '', 'g')
    AND room.status = 'waiting'
    AND room.expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No encontramos una sala abierta con ese PIN.' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.live_quiz_players player
    WHERE player.room_id = v_room.id AND lower(player.nickname) = lower(v_nickname)
  ) THEN
    RAISE EXCEPTION 'Ese apodo ya está ocupado. Prueba con otro.' USING ERRCODE = '23505';
  END IF;

  IF v_room.team_mode THEN
    SELECT team.name INTO v_team_name
    FROM unnest(v_room.team_names) AS team(name)
    LEFT JOIN public.live_quiz_players player
      ON player.room_id = v_room.id AND player.team_name = team.name
    GROUP BY team.name
    ORDER BY count(player.id), random()
    LIMIT 1;
  END IF;

  SELECT limits.max_players_per_room INTO v_player_limit
  FROM private.live_quiz_limits limits WHERE limits.singleton = true;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_room.id::text, 1));
  SELECT count(*)::integer INTO v_player_count
  FROM public.live_quiz_players player WHERE player.room_id = v_room.id;

  IF v_player_count >= COALESCE(v_player_limit, 100) THEN
    RAISE EXCEPTION 'Esta sala alcanzó su capacidad.' USING ERRCODE = '54000';
  END IF;

  v_token := gen_random_uuid();
  INSERT INTO public.live_quiz_players (room_id, session_token, nickname, team_name)
  VALUES (v_room.id, v_token, v_nickname, v_team_name)
  RETURNING id INTO v_player_id;

  RETURN jsonb_build_object('room_id', v_room.id, 'player_token', v_token, 'nickname', v_nickname, 'team_name', v_team_name);
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
BEGIN
  SELECT room.* INTO v_room
  FROM public.live_quiz_rooms room
  WHERE room.pin_code = regexp_replace(COALESCE(p_pin, ''), '[^0-9]', '', 'g');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No encontramos una sala con ese PIN.' USING ERRCODE = 'P0002';
  END IF;

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
    UPDATE public.live_quiz_rooms
    SET status = 'expired', phase = 'finished', updated_at = now()
    WHERE id = v_room.id;
    v_room.status := 'expired';
    v_room.phase := 'finished';
  ELSIF v_room.status = 'in_progress'
    AND v_room.phase = 'question'
    AND v_room.question_started_at + make_interval(secs => v_room.question_seconds) <= now() THEN
    UPDATE public.live_quiz_rooms
    SET phase = 'reveal', updated_at = now()
    WHERE id = v_room.id AND phase = 'question';
    v_room.phase := 'reveal';
  END IF;

  IF v_player_id IS NOT NULL THEN
    SELECT answer.selected_option, true
    INTO v_my_answer, v_answered
    FROM public.live_quiz_answers answer
    WHERE answer.player_id = v_player_id AND answer.question_index = v_room.current_question_index;
  END IF;

  IF v_room.status <> 'waiting' AND v_room.current_question_index <= cardinality(v_room.question_ids) THEN
    SELECT jsonb_build_object(
      'text', question.question,
      'options', jsonb_build_array(
        jsonb_build_object('key', 'a', 'text', question.option_a),
        jsonb_build_object('key', 'b', 'text', question.option_b),
        jsonb_build_object('key', 'c', 'text', question.option_c),
        jsonb_build_object('key', 'd', 'text', question.option_d)
      ),
      'correct_option', CASE WHEN v_room.phase IN ('reveal', 'finished') THEN lower(question.correct_option::text) ELSE NULL END,
      'explanation', CASE WHEN v_room.phase IN ('reveal', 'finished') THEN question.explanation ELSE NULL END,
      'index', v_room.current_question_index,
      'count', cardinality(v_room.question_ids)
    ) INTO v_question
    FROM public.game_biblionario_questions question
    WHERE question.id = v_room.question_ids[v_room.current_question_index];
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
      jsonb_build_object(
        'name', team.name,
        'score', COALESCE(avg(player.score), 0),
        'player_count', count(player.id)
      ) ORDER BY COALESCE(avg(player.score), 0) DESC, team.name
    ), '[]'::jsonb)
    INTO v_teams
    FROM unnest(v_room.team_names) AS team(name)
    LEFT JOIN public.live_quiz_players player
      ON player.room_id = v_room.id AND player.team_name = team.name;
  END IF;

  IF v_is_host AND v_room.status = 'finished' THEN
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

  IF v_player_id IS NOT NULL THEN
    SELECT reflection.response INTO v_my_reflection
    FROM public.live_quiz_reflections reflection
    WHERE reflection.room_id = v_room.id AND reflection.player_id = v_player_id;
  ELSIF v_is_host AND v_room.status = 'finished' AND v_room.reflection_prompt IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object('nickname', player.nickname, 'response', reflection.response)
      ORDER BY reflection.created_at
    ), '[]'::jsonb)
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
      'question_count', cardinality(v_room.question_ids),
      'question_seconds', v_room.question_seconds,
      'question_started_at', v_room.question_started_at,
      'team_mode', v_room.team_mode,
      'team_names', v_room.team_names,
      'score_mode', v_room.score_mode,
      'reflection_prompt', v_room.reflection_prompt,
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

  SELECT lower(question.correct_option::text) INTO v_correct_option
  FROM public.game_biblionario_questions question
  WHERE question.id = v_room.question_ids[v_room.current_question_index];
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

  UPDATE public.live_quiz_players
  SET score = score + v_points
  WHERE id = v_player_id;

  IF NOT EXISTS (
    SELECT 1
    FROM public.live_quiz_players player
    WHERE player.room_id = v_room.id
      AND NOT EXISTS (
        SELECT 1 FROM public.live_quiz_answers answer
        WHERE answer.player_id = player.id AND answer.question_index = v_room.current_question_index
      )
  ) THEN
    UPDATE public.live_quiz_rooms
    SET phase = 'reveal', updated_at = now()
    WHERE id = v_room.id AND phase = 'question';
  END IF;

  RETURN jsonb_build_object('accepted', true, 'correct', v_correct, 'points', v_points);
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

  IF p_action = 'start' THEN
    SELECT count(*)::integer INTO v_player_count FROM public.live_quiz_players player WHERE player.room_id = v_room.id;
    IF v_room.status <> 'waiting' OR v_player_count = 0 THEN
      RAISE EXCEPTION 'Necesitas al menos una persona en la sala para iniciar.' USING ERRCODE = '55000';
    END IF;
    UPDATE public.live_quiz_rooms
    SET status = 'in_progress', phase = 'question', current_question_index = 1, question_started_at = now(), updated_at = now()
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
    IF v_room.current_question_index >= cardinality(v_room.question_ids) THEN
      UPDATE public.live_quiz_rooms SET status = 'finished', phase = 'finished', updated_at = now() WHERE id = v_room.id;
    ELSE
      UPDATE public.live_quiz_rooms
      SET current_question_index = current_question_index + 1,
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

CREATE OR REPLACE FUNCTION public.live_quiz_submit_reflection(
  p_pin text,
  p_player_token uuid,
  p_response text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_room public.live_quiz_rooms%ROWTYPE;
  v_player_id uuid;
  v_response text := btrim(COALESCE(p_response, ''));
  v_reflection_id uuid;
BEGIN
  IF char_length(v_response) NOT BETWEEN 3 AND 250 THEN
    RAISE EXCEPTION 'La reflexión debe tener entre 3 y 250 caracteres.' USING ERRCODE = '22023';
  END IF;

  SELECT room.* INTO v_room
  FROM public.live_quiz_rooms room
  WHERE room.pin_code = regexp_replace(COALESCE(p_pin, ''), '[^0-9]', '', 'g');
  IF NOT FOUND OR v_room.status <> 'finished' OR v_room.expires_at <= now() OR v_room.reflection_prompt IS NULL THEN
    RAISE EXCEPTION 'Esta sala no está recibiendo reflexiones.' USING ERRCODE = '55000';
  END IF;

  SELECT player.id INTO v_player_id
  FROM public.live_quiz_players player
  WHERE player.room_id = v_room.id AND player.session_token = p_player_token;
  IF v_player_id IS NULL THEN
    RAISE EXCEPTION 'Esta sesión no pertenece a la sala.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.live_quiz_reflections (room_id, player_id, response)
  VALUES (v_room.id, v_player_id, v_response)
  ON CONFLICT (room_id, player_id) DO NOTHING
  RETURNING id INTO v_reflection_id;

  IF v_reflection_id IS NULL THEN
    RAISE EXCEPTION 'Ya compartiste una reflexión en esta sala.' USING ERRCODE = '23505';
  END IF;

  RETURN jsonb_build_object('accepted', true);
END;
$$;

REVOKE ALL ON FUNCTION public.live_quiz_create_room(text, integer, integer, integer, boolean, integer, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.live_quiz_list_my_rooms() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.live_quiz_join_room(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.live_quiz_get_state(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.live_quiz_submit_answer(text, uuid, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.live_quiz_host_action(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.live_quiz_submit_reflection(text, uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.live_quiz_create_room(text, integer, integer, integer, boolean, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_quiz_list_my_rooms() TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_quiz_join_room(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.live_quiz_get_state(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.live_quiz_submit_answer(text, uuid, integer, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.live_quiz_host_action(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_quiz_submit_reflection(text, uuid, text) TO anon, authenticated;

COMMENT ON TABLE public.live_quiz_rooms IS 'PIN rooms for live Bible quizzes; room expiry is limited to 365 days.';
COMMENT ON TABLE public.live_quiz_players IS 'Nickname and private bearer session token for a public live quiz participant.';
COMMENT ON TABLE public.live_quiz_answers IS 'Server-scored answers for live quiz rooms; direct client access is revoked.';
COMMENT ON TABLE public.live_quiz_reflections IS 'One participant reflection per room; visible only to that participant and the room host through the state RPC.';


