-- Presupuestos & Arreglos: contenido presentable + control operativo.
-- Los bloques son JSONB para permitir evolución del editor; las partidas quedan
-- normalizadas para poder calcular totales y comparar alternativas.

CREATE TABLE IF NOT EXISTS public.church_budget_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'rejected', 'executed', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL DEFAULT 'general',
  summary TEXT NOT NULL DEFAULT '',
  what_text TEXT NOT NULL DEFAULT '',
  how_text TEXT NOT NULL DEFAULT '',
  why_text TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_estimated NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_estimated >= 0),
  currency TEXT NOT NULL DEFAULT 'COP',
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.church_budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.church_budget_proposals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  currency TEXT NOT NULL DEFAULT 'COP',
  vendor TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  comparison_label TEXT NOT NULL DEFAULT '',
  is_recommended BOOLEAN NOT NULL DEFAULT false,
  source_url TEXT,
  notes TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.church_maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'in_progress', 'resolved', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT NOT NULL DEFAULT 'general',
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  what_to_buy TEXT NOT NULL DEFAULT '',
  estimated_cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (estimated_cost >= 0),
  currency TEXT NOT NULL DEFAULT 'COP',
  vendor TEXT NOT NULL DEFAULT '',
  evidence_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_budget_id UUID REFERENCES public.church_budget_proposals(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS church_budget_proposals_status_idx ON public.church_budget_proposals(status);
CREATE INDEX IF NOT EXISTS church_budget_proposals_priority_idx ON public.church_budget_proposals(priority);
CREATE INDEX IF NOT EXISTS church_budget_items_proposal_idx ON public.church_budget_items(proposal_id, sort_order);
CREATE INDEX IF NOT EXISTS church_maintenance_status_idx ON public.church_maintenance_requests(status, priority);
CREATE INDEX IF NOT EXISTS church_maintenance_budget_idx ON public.church_maintenance_requests(linked_budget_id);

CREATE OR REPLACE FUNCTION public.touch_church_procurement_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS church_budget_proposals_updated_at ON public.church_budget_proposals;
CREATE TRIGGER church_budget_proposals_updated_at BEFORE UPDATE ON public.church_budget_proposals
FOR EACH ROW EXECUTE FUNCTION public.touch_church_procurement_updated_at();
DROP TRIGGER IF EXISTS church_maintenance_requests_updated_at ON public.church_maintenance_requests;
CREATE TRIGGER church_maintenance_requests_updated_at BEFORE UPDATE ON public.church_maintenance_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_church_procurement_updated_at();

ALTER TABLE public.church_budget_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_maintenance_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage church budget proposals" ON public.church_budget_proposals;
CREATE POLICY "Admins manage church budget proposals" ON public.church_budget_proposals
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'pastor', 'secretary', 'secretaria', 'editor')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'pastor', 'secretary', 'secretaria', 'editor')));

DROP POLICY IF EXISTS "Admins manage church budget items" ON public.church_budget_items;
CREATE POLICY "Admins manage church budget items" ON public.church_budget_items
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'pastor', 'secretary', 'secretaria', 'editor')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'pastor', 'secretary', 'secretaria', 'editor')));

DROP POLICY IF EXISTS "Admins manage church maintenance requests" ON public.church_maintenance_requests;
CREATE POLICY "Admins manage church maintenance requests" ON public.church_maintenance_requests
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'pastor', 'secretary', 'secretaria', 'editor')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'pastor', 'secretary', 'secretaria', 'editor')));
