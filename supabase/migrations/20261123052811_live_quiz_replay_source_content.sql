-- Preserve the authored question order when a session starts with shuffle enabled.

ALTER TABLE public.live_quiz_rooms
  ADD COLUMN original_editor_content jsonb;

CREATE OR REPLACE FUNCTION private.live_quiz_preserve_original_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_source_content jsonb;
BEGIN
  IF NEW.source_room_id IS DISTINCT FROM OLD.source_room_id AND NEW.source_room_id IS NOT NULL THEN
    SELECT COALESCE(source.original_editor_content, source.editor_content)
    INTO v_source_content
    FROM public.live_quiz_rooms source
    WHERE source.id = NEW.source_room_id
      AND source.host_user_id = NEW.host_user_id;

    IF v_source_content IS NOT NULL THEN
      NEW.editor_content := v_source_content;
    END IF;
    NEW.original_editor_content := NULL;
  ELSIF OLD.status = 'waiting'
    AND NEW.status = 'in_progress'
    AND (
      COALESCE((NEW.settings ->> 'shuffle_questions')::boolean, false)
      OR COALESCE((NEW.settings ->> 'shuffle_answers')::boolean, false)
    ) THEN
    NEW.original_editor_content := COALESCE(OLD.original_editor_content, OLD.editor_content);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.live_quiz_preserve_original_content() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER live_quiz_preserve_original_content_trigger
BEFORE UPDATE OF source_room_id, status ON public.live_quiz_rooms
FOR EACH ROW
EXECUTE FUNCTION private.live_quiz_preserve_original_content();
