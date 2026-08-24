-- Fase 3: múltiples transmisiones, asistencia agregada y peticiones de oración del culto.

ALTER TABLE public.live_service_sessions
  ADD COLUMN IF NOT EXISTS stream_links jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.live_service_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.live_service_sessions(id) ON DELETE CASCADE,
  attendance_count integer NOT NULL DEFAULT 0 CHECK (attendance_count >= 0 AND attendance_count <= 100000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.live_prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_service_sessions(id) ON DELETE CASCADE,
  request text NOT NULL CHECK (char_length(trim(request)) BETWEEN 5 AND 1000),
  is_private boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_prayer', 'answered', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS live_prayer_requests_session_idx
  ON public.live_prayer_requests (session_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION private.touch_live_attendance_and_prayer_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_live_service_attendance_updated_at ON public.live_service_attendance;
CREATE TRIGGER touch_live_service_attendance_updated_at
  BEFORE UPDATE ON public.live_service_attendance
  FOR EACH ROW EXECUTE FUNCTION private.touch_live_attendance_and_prayer_updated_at();

DROP TRIGGER IF EXISTS touch_live_prayer_requests_updated_at ON public.live_prayer_requests;
CREATE TRIGGER touch_live_prayer_requests_updated_at
  BEFORE UPDATE ON public.live_prayer_requests
  FOR EACH ROW EXECUTE FUNCTION private.touch_live_attendance_and_prayer_updated_at();

ALTER TABLE public.live_service_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_prayer_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read live attendance" ON public.live_service_attendance;
CREATE POLICY "Public can read live attendance"
  ON public.live_service_attendance FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.live_service_sessions session
    WHERE session.id = session_id AND session.status IN ('scheduled', 'live')
  ));

DROP POLICY IF EXISTS "Worship managers manage live attendance" ON public.live_service_attendance;
CREATE POLICY "Worship managers manage live attendance"
  ON public.live_service_attendance FOR ALL TO authenticated
  USING (public.current_user_can_worship_manager())
  WITH CHECK (public.current_user_can_worship_manager());

DROP POLICY IF EXISTS "Public can submit live prayer requests" ON public.live_prayer_requests;
CREATE POLICY "Public can submit live prayer requests"
  ON public.live_prayer_requests FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.live_service_sessions session
      WHERE session.id = session_id AND session.status = 'live'
    )
  );

DROP POLICY IF EXISTS "Worship managers read live prayer requests" ON public.live_prayer_requests;
CREATE POLICY "Worship managers read live prayer requests"
  ON public.live_prayer_requests FOR SELECT TO authenticated
  USING (public.current_user_can_worship_manager());

DROP POLICY IF EXISTS "Worship managers manage live prayer requests" ON public.live_prayer_requests;
CREATE POLICY "Worship managers manage live prayer requests"
  ON public.live_prayer_requests FOR UPDATE TO authenticated
  USING (public.current_user_can_worship_manager())
  WITH CHECK (public.current_user_can_worship_manager());

GRANT SELECT ON public.live_service_attendance TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.live_service_attendance TO authenticated;
GRANT INSERT ON public.live_prayer_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.live_prayer_requests TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'live_service_attendance') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.live_service_attendance;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'live_prayer_requests') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.live_prayer_requests;
    END IF;
  END IF;
END $$;
