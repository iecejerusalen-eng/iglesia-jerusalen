-- Fase 2: sesión pública persistente para Culto en Vivo.
-- Las respuestas anónimas quedan pendientes de moderación y nunca se publican directamente.

CREATE TABLE IF NOT EXISTS public.live_service_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL UNIQUE REFERENCES public.worship_services(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'archived')),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 180),
  stream_url text,
  current_item_id uuid,
  active_song_id uuid REFERENCES public.songs(id) ON DELETE SET NULL,
  content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  live_summary text,
  started_at timestamptz,
  ended_at timestamptz,
  archived_sermon_id uuid REFERENCES public.sermons(id) ON DELETE SET NULL,
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT live_service_sessions_stream_url CHECK (stream_url IS NULL OR stream_url LIKE 'https://%')
);

CREATE INDEX IF NOT EXISTS live_service_sessions_status_idx
  ON public.live_service_sessions (status, started_at DESC);

CREATE TABLE IF NOT EXISTS public.live_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_service_sessions(id) ON DELETE CASCADE,
  question text NOT NULL CHECK (char_length(trim(question)) BETWEEN 5 AND 280),
  options jsonb NOT NULL CHECK (jsonb_typeof(options) = 'array'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  sort_order smallint NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS live_polls_session_idx
  ON public.live_polls (session_id, status, sort_order);

CREATE TABLE IF NOT EXISTS public.live_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.live_polls(id) ON DELETE CASCADE,
  option text NOT NULL CHECK (char_length(trim(option)) BETWEEN 1 AND 160),
  voter_key text CHECK (voter_key IS NULL OR char_length(trim(voter_key)) BETWEEN 8 AND 128),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS live_poll_votes_poll_idx
  ON public.live_poll_votes (poll_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.live_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_service_sessions(id) ON DELETE CASCADE,
  question text NOT NULL CHECK (char_length(trim(question)) BETWEEN 5 AND 800),
  display_name text CHECK (display_name IS NULL OR char_length(trim(display_name)) BETWEEN 2 AND 80),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'answered', 'rejected')),
  answer text,
  answered_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS live_questions_session_idx
  ON public.live_questions (session_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION private.touch_live_service_updated_at()
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
  FOREACH table_name IN ARRAY ARRAY['live_service_sessions', 'live_polls', 'live_questions'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS touch_%I_updated_at ON public.%I', table_name, table_name);
    EXECUTE format(
      'CREATE TRIGGER touch_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.touch_live_service_updated_at()',
      table_name, table_name
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION private.archive_live_service_as_sermon()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  created_sermon_id uuid;
BEGIN
  IF NEW.status = 'ended' AND OLD.status IS DISTINCT FROM 'ended' AND NEW.archived_sermon_id IS NULL THEN
    INSERT INTO public.sermons (title, pastor_name, youtube_url, description, content, date)
    VALUES (
      NEW.title,
      'Equipo pastoral',
      NEW.stream_url,
      COALESCE(NEW.live_summary, 'Prédica del culto en vivo.'),
      jsonb_pretty(NEW.content_blocks),
      COALESCE((NEW.started_at AT TIME ZONE 'America/Bogota')::date, current_date)
    )
    RETURNING id INTO created_sermon_id;

    NEW.archived_sermon_id = created_sermon_id;
    NEW.ended_at = COALESCE(NEW.ended_at, now());
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.archive_live_service_as_sermon() FROM PUBLIC;

DROP TRIGGER IF EXISTS archive_live_service_as_sermon ON public.live_service_sessions;
CREATE TRIGGER archive_live_service_as_sermon
  BEFORE UPDATE OF status ON public.live_service_sessions
  FOR EACH ROW EXECUTE FUNCTION private.archive_live_service_as_sermon();

ALTER TABLE public.live_service_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read scheduled and live sessions" ON public.live_service_sessions;
CREATE POLICY "Public can read scheduled and live sessions"
  ON public.live_service_sessions FOR SELECT TO anon, authenticated
  USING (status IN ('scheduled', 'live', 'ended', 'archived'));

DROP POLICY IF EXISTS "Worship managers manage live sessions" ON public.live_service_sessions;
CREATE POLICY "Worship managers manage live sessions"
  ON public.live_service_sessions FOR ALL TO authenticated
  USING (public.current_user_can_worship_manager())
  WITH CHECK (public.current_user_can_worship_manager());

DROP POLICY IF EXISTS "Public can read published polls" ON public.live_polls;
CREATE POLICY "Public can read published polls"
  ON public.live_polls FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "Worship managers manage polls" ON public.live_polls;
CREATE POLICY "Worship managers manage polls"
  ON public.live_polls FOR ALL TO authenticated
  USING (public.current_user_can_worship_manager())
  WITH CHECK (public.current_user_can_worship_manager());

DROP POLICY IF EXISTS "Public can submit poll votes" ON public.live_poll_votes;
CREATE POLICY "Public can submit poll votes"
  ON public.live_poll_votes FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(trim(option)) BETWEEN 1 AND 160);

DROP POLICY IF EXISTS "Worship managers read poll votes" ON public.live_poll_votes;
CREATE POLICY "Worship managers read poll votes"
  ON public.live_poll_votes FOR SELECT TO authenticated
  USING (public.current_user_can_worship_manager());

DROP POLICY IF EXISTS "Public can submit live questions" ON public.live_questions;
CREATE POLICY "Public can submit live questions"
  ON public.live_questions FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "Public can read approved live questions" ON public.live_questions;
CREATE POLICY "Public can read approved live questions"
  ON public.live_questions FOR SELECT TO anon, authenticated
  USING (status IN ('approved', 'answered'));

DROP POLICY IF EXISTS "Worship managers manage questions" ON public.live_questions;
CREATE POLICY "Worship managers manage questions"
  ON public.live_questions FOR ALL TO authenticated
  USING (public.current_user_can_worship_manager())
  WITH CHECK (public.current_user_can_worship_manager());

GRANT SELECT ON public.live_service_sessions, public.live_polls, public.live_questions TO anon, authenticated;
GRANT INSERT ON public.live_poll_votes, public.live_questions TO anon, authenticated;
GRANT SELECT ON public.live_poll_votes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.live_service_sessions, public.live_polls, public.live_questions TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'live_service_sessions') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.live_service_sessions;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'live_polls') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.live_polls;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'live_questions') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.live_questions;
    END IF;
  END IF;
END $$;
