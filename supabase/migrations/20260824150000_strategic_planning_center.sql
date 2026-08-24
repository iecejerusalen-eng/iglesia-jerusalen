-- Centro de Estrategia: objetivos, indicadores, iniciativas y revisiones.
-- Mantiene separado el dominio estratégico del mapa territorial/pastoral.

CREATE TABLE IF NOT EXISTS public.strategic_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 3 AND 180),
  description text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT 'Congregación' CHECK (length(trim(area)) BETWEEN 2 AND 80),
  status text NOT NULL DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'off_track', 'completed', 'draft')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  target_date date,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ministry_id uuid REFERENCES public.ministries(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.strategic_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid NOT NULL REFERENCES public.strategic_objectives(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 140),
  unit text NOT NULL DEFAULT '',
  current_value numeric NOT NULL DEFAULT 0,
  target_value numeric NOT NULL DEFAULT 0,
  frequency text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'annual')),
  last_updated_at timestamptz,
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.strategic_initiatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid NOT NULL REFERENCES public.strategic_objectives(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 3 AND 180),
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'blocked', 'completed', 'cancelled')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date date,
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.strategic_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid REFERENCES public.strategic_objectives(id) ON DELETE CASCADE,
  note text NOT NULL CHECK (length(trim(note)) BETWEEN 1 AND 5000),
  status text NOT NULL DEFAULT 'neutral' CHECK (status IN ('positive', 'neutral', 'attention')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS strategic_objectives_status_idx ON public.strategic_objectives(status, target_date);
CREATE INDEX IF NOT EXISTS strategic_objectives_area_idx ON public.strategic_objectives(area);
CREATE INDEX IF NOT EXISTS strategic_objectives_owner_idx ON public.strategic_objectives(owner_id);
CREATE INDEX IF NOT EXISTS strategic_metrics_objective_idx ON public.strategic_metrics(objective_id);
CREATE INDEX IF NOT EXISTS strategic_initiatives_objective_idx ON public.strategic_initiatives(objective_id, status, due_date);
CREATE INDEX IF NOT EXISTS strategic_reviews_objective_idx ON public.strategic_reviews(objective_id, reviewed_at DESC);

-- Concede al Centro de Estrategia la misma base de acceso que ya existe para
-- el mapa territorial; los administradores globales siguen teniendo acceso
-- por la función de permisos existente.
UPDATE public.role_permissions
SET permissions = permissions || jsonb_build_object(
  'strategy', COALESCE(permissions->'map', '{"view": false, "edit": false}'::jsonb)
)
WHERE NOT (permissions ? 'strategy');

CREATE OR REPLACE FUNCTION private.touch_strategic_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS strategic_objectives_touch_updated_at ON public.strategic_objectives;
CREATE TRIGGER strategic_objectives_touch_updated_at BEFORE UPDATE ON public.strategic_objectives FOR EACH ROW EXECUTE FUNCTION private.touch_strategic_updated_at();
DROP TRIGGER IF EXISTS strategic_metrics_touch_updated_at ON public.strategic_metrics;
CREATE TRIGGER strategic_metrics_touch_updated_at BEFORE UPDATE ON public.strategic_metrics FOR EACH ROW EXECUTE FUNCTION private.touch_strategic_updated_at();
DROP TRIGGER IF EXISTS strategic_initiatives_touch_updated_at ON public.strategic_initiatives;
CREATE TRIGGER strategic_initiatives_touch_updated_at BEFORE UPDATE ON public.strategic_initiatives FOR EACH ROW EXECUTE FUNCTION private.touch_strategic_updated_at();

ALTER TABLE public.strategic_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "strategy objectives read" ON public.strategic_objectives;
CREATE POLICY "strategy objectives read" ON public.strategic_objectives FOR SELECT TO authenticated
  USING (private.current_user_has_admin_permission('strategy', 'view') OR private.current_user_has_admin_permission('strategy', 'edit'));
DROP POLICY IF EXISTS "strategy objectives write" ON public.strategic_objectives;
CREATE POLICY "strategy objectives write" ON public.strategic_objectives FOR ALL TO authenticated
  USING (private.current_user_has_admin_permission('strategy', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('strategy', 'edit'));

DROP POLICY IF EXISTS "strategy metrics read" ON public.strategic_metrics;
CREATE POLICY "strategy metrics read" ON public.strategic_metrics FOR SELECT TO authenticated
  USING (private.current_user_has_admin_permission('strategy', 'view') OR private.current_user_has_admin_permission('strategy', 'edit'));
DROP POLICY IF EXISTS "strategy metrics write" ON public.strategic_metrics;
CREATE POLICY "strategy metrics write" ON public.strategic_metrics FOR ALL TO authenticated
  USING (private.current_user_has_admin_permission('strategy', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('strategy', 'edit'));

DROP POLICY IF EXISTS "strategy initiatives read" ON public.strategic_initiatives;
CREATE POLICY "strategy initiatives read" ON public.strategic_initiatives FOR SELECT TO authenticated
  USING (private.current_user_has_admin_permission('strategy', 'view') OR private.current_user_has_admin_permission('strategy', 'edit'));
DROP POLICY IF EXISTS "strategy initiatives write" ON public.strategic_initiatives;
CREATE POLICY "strategy initiatives write" ON public.strategic_initiatives FOR ALL TO authenticated
  USING (private.current_user_has_admin_permission('strategy', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('strategy', 'edit'));

DROP POLICY IF EXISTS "strategy reviews read" ON public.strategic_reviews;
CREATE POLICY "strategy reviews read" ON public.strategic_reviews FOR SELECT TO authenticated
  USING (private.current_user_has_admin_permission('strategy', 'view') OR private.current_user_has_admin_permission('strategy', 'edit'));
DROP POLICY IF EXISTS "strategy reviews write" ON public.strategic_reviews;
CREATE POLICY "strategy reviews write" ON public.strategic_reviews FOR ALL TO authenticated
  USING (private.current_user_has_admin_permission('strategy', 'edit'))
  WITH CHECK (private.current_user_has_admin_permission('strategy', 'edit'));
