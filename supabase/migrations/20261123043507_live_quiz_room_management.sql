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
        'status', CASE
          WHEN room.expires_at <= now() AND room.status IN ('waiting', 'in_progress') THEN 'expired'
          ELSE room.status
        END,
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
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.live_quiz_extend_room(p_room_id uuid, p_days integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_room public.live_quiz_rooms%ROWTYPE;
  v_max_expires_at timestamptz;
  v_expires_at timestamptz;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT private.live_quiz_can_host() THEN
    RAISE EXCEPTION 'Tu rol no tiene permiso para administrar salas.' USING ERRCODE = '42501';
  END IF;

  IF p_days IS NULL OR p_days NOT BETWEEN 1 AND 365 THEN
    RAISE EXCEPTION 'La extensión debe estar entre 1 y 365 días.' USING ERRCODE = '22023';
  END IF;

  SELECT room.* INTO v_room
  FROM public.live_quiz_rooms room
  WHERE room.id = p_room_id AND room.host_user_id = (SELECT auth.uid())
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No encontramos una sala tuya con ese identificador.' USING ERRCODE = 'P0002';
  END IF;
  IF v_room.status NOT IN ('waiting', 'in_progress') OR v_room.expires_at <= now() THEN
    RAISE EXCEPTION 'Solo se puede extender el PIN de una sala activa antes de que venza.' USING ERRCODE = '55000';
  END IF;

  v_max_expires_at := v_room.created_at + interval '365 days';
  v_expires_at := LEAST(v_room.expires_at + make_interval(days => p_days), v_max_expires_at);
  IF v_expires_at <= v_room.expires_at THEN
    RAISE EXCEPTION 'Esta sala ya alcanzó el máximo de vigencia de 365 días.' USING ERRCODE = '55000';
  END IF;

  UPDATE public.live_quiz_rooms
  SET expires_at = v_expires_at, updated_at = now()
  WHERE id = v_room.id;

  RETURN jsonb_build_object('expires_at', v_expires_at, 'max_expires_at', v_max_expires_at);
END;
$$;

CREATE OR REPLACE FUNCTION public.live_quiz_delete_room(p_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_room public.live_quiz_rooms%ROWTYPE;
  v_user_id uuid := (SELECT auth.uid());
  v_media_url text;
  v_media_path text;
  v_media_marker constant text := '/storage/v1/object/public/live-quiz-media/';
BEGIN
  IF v_user_id IS NULL OR NOT private.live_quiz_can_host() THEN
    RAISE EXCEPTION 'Tu rol no tiene permiso para administrar salas.' USING ERRCODE = '42501';
  END IF;

  SELECT room.* INTO v_room
  FROM public.live_quiz_rooms room
  WHERE room.id = p_room_id AND room.host_user_id = v_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No encontramos una sala tuya con ese identificador.' USING ERRCODE = 'P0002';
  END IF;

  FOR v_media_url IN
    SELECT DISTINCT media.image_url
    FROM (
      SELECT v_room.editor_content #>> '{presentation,cover_image_url}' AS image_url
      UNION ALL
      SELECT question.value ->> 'image_url'
      FROM jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(v_room.editor_content -> 'questions') = 'array' THEN v_room.editor_content -> 'questions'
          ELSE '[]'::jsonb
        END
      ) AS question(value)
    ) AS media
    WHERE media.image_url LIKE '%' || v_media_marker || '%'
  LOOP
    v_media_path := split_part(v_media_url, v_media_marker, 2);
    v_media_path := split_part(v_media_path, '?', 1);

    IF v_media_path ~ ('^' || v_user_id::text || '/[A-Za-z0-9_-]+[.](webp|png|jpe?g)$')
      AND NOT EXISTS (
        SELECT 1
        FROM public.live_quiz_rooms other_room
        WHERE other_room.id <> v_room.id
          AND (
            other_room.editor_content #>> '{presentation,cover_image_url}' = v_media_url
            OR EXISTS (
              SELECT 1
              FROM jsonb_array_elements(
                CASE
                  WHEN jsonb_typeof(other_room.editor_content -> 'questions') = 'array' THEN other_room.editor_content -> 'questions'
                  ELSE '[]'::jsonb
                END
              ) AS other_question(value)
              WHERE other_question.value ->> 'image_url' = v_media_url
            )
          )
      ) THEN
      DELETE FROM storage.objects AS stored_object
      WHERE stored_object.bucket_id = 'live-quiz-media' AND stored_object.name = v_media_path;
    END IF;
  END LOOP;

  DELETE FROM public.live_quiz_rooms WHERE id = v_room.id;

  RETURN jsonb_build_object('deleted', true, 'title', v_room.title);
END;
$$;

REVOKE ALL ON FUNCTION public.live_quiz_list_my_rooms() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.live_quiz_extend_room(uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.live_quiz_delete_room(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.live_quiz_list_my_rooms() TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_quiz_extend_room(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.live_quiz_delete_room(uuid) TO authenticated;
