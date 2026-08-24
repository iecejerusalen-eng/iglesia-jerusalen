CREATE TABLE IF NOT EXISTS public.live_service_production_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.live_service_sessions(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'holyrics', 'propresenter')),
  is_visible boolean NOT NULL DEFAULT true,
  current_title text,
  current_text text,
  current_slide_index integer NOT NULL DEFAULT 0 CHECK (current_slide_index >= 0),
  total_slides integer NOT NULL DEFAULT 0 CHECK (total_slides >= 0),
  announcement text,
  announcement_visible boolean NOT NULL DEFAULT false,
  stage_url text,
  screen_url text,
  camera_feeds jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(camera_feeds) = 'array'),
  last_synced_at timestamptz,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT live_production_state_stage_url CHECK (stage_url IS NULL OR stage_url LIKE 'https://%'),
  CONSTRAINT live_production_state_screen_url CHECK (screen_url IS NULL OR screen_url LIKE 'https://%')
);

CREATE INDEX IF NOT EXISTS live_production_state_session_idx
  ON public.live_service_production_state (session_id, updated_at DESC);

CREATE OR REPLACE FUNCTION private.touch_live_production_state_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_live_production_state_updated_at ON public.live_service_production_state;
CREATE TRIGGER touch_live_production_state_updated_at
  BEFORE UPDATE ON public.live_service_production_state
  FOR EACH ROW EXECUTE FUNCTION private.touch_live_production_state_updated_at();

ALTER TABLE public.live_service_production_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read live production state" ON public.live_service_production_state;
CREATE POLICY "Public can read live production state"
  ON public.live_service_production_state FOR SELECT TO anon, authenticated
  USING (is_visible AND EXISTS (
    SELECT 1 FROM public.live_service_sessions session
    WHERE session.id = live_service_production_state.session_id
      AND session.status IN ('scheduled', 'live')
  ));

DROP POLICY IF EXISTS "Worship managers manage live production state" ON public.live_service_production_state;
CREATE POLICY "Worship managers manage live production state"
  ON public.live_service_production_state FOR ALL TO authenticated
  USING (public.current_user_can_worship_manager())
  WITH CHECK (public.current_user_can_worship_manager());

GRANT SELECT ON public.live_service_production_state TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.live_service_production_state TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'live_service_production_state') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_service_production_state;
  END IF;
END $$;
