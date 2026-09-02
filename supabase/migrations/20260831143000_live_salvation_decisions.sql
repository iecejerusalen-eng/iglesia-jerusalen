CREATE TABLE IF NOT EXISTS public.live_salvation_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_service_sessions(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  phone text CHECK (phone IS NULL OR char_length(btrim(phone)) BETWEEN 7 AND 40),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'closed')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS live_salvation_decisions_status_created_idx
  ON public.live_salvation_decisions (status, created_at DESC);

ALTER TABLE public.live_salvation_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public submits salvation decisions" ON public.live_salvation_decisions;
CREATE POLICY "Public submits salvation decisions"
  ON public.live_salvation_decisions FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "Pastoral team reads salvation decisions" ON public.live_salvation_decisions;
CREATE POLICY "Pastoral team reads salvation decisions"
  ON public.live_salvation_decisions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND (('admin' = ANY(profiles.roles)) OR ('pastor' = ANY(profiles.roles)) OR ('leader' = ANY(profiles.roles)))
  ));

DROP POLICY IF EXISTS "Pastoral team updates salvation decisions" ON public.live_salvation_decisions;
CREATE POLICY "Pastoral team updates salvation decisions"
  ON public.live_salvation_decisions FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND (('admin' = ANY(profiles.roles)) OR ('pastor' = ANY(profiles.roles)) OR ('leader' = ANY(profiles.roles)))
  ))
  WITH CHECK (status IN ('pending', 'contacted', 'closed'));

GRANT INSERT ON public.live_salvation_decisions TO anon, authenticated;
GRANT SELECT, UPDATE ON public.live_salvation_decisions TO authenticated;
