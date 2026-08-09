ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.missions
  DROP CONSTRAINT IF EXISTS missions_scope_valid,
  ADD CONSTRAINT missions_scope_valid CHECK (scope IN ('local', 'national', 'international'));

CREATE INDEX IF NOT EXISTS missions_public_scope_idx
  ON public.missions (scope, status, created_at DESC)
  WHERE is_published = true;

CREATE TABLE IF NOT EXISTS public.joshua_project_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE public.joshua_project_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.joshua_project_cache FROM anon, authenticated;

COMMENT ON TABLE public.joshua_project_cache IS
  'Caché privado de la Edge Function. Nunca almacena la clave API y no es consultable desde el navegador.';
COMMENT ON COLUMN public.missions.metadata IS
  'Campos extensibles administrables sin DDL dinámico: contactos públicos, objetivos, resultados y enlaces.';
