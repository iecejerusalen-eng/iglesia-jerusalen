-- Núcleo operativo de Presupuestos & Arreglos.
-- Extiende las propuestas existentes sin mezclar estimaciones con gastos reales.

CREATE TABLE IF NOT EXISTS public.church_budget_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.church_budget_proposals(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  step_order INTEGER NOT NULL DEFAULT 1 CHECK (step_order > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'delegated')),
  comment TEXT NOT NULL DEFAULT '',
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (proposal_id, approver_id, step_order)
);

CREATE TABLE IF NOT EXISTS public.church_procurement_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.church_budget_proposals(id) ON DELETE RESTRICT,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'ordered', 'partially_received', 'received', 'cancelled')),
  vendor TEXT NOT NULL DEFAULT '',
  expected_at DATE,
  ordered_at TIMESTAMPTZ,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  currency TEXT NOT NULL DEFAULT 'COP',
  notes TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.church_procurement_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.church_procurement_orders(id) ON DELETE CASCADE,
  received_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'partial', 'rejected')),
  quantity_received NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  evidence_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.church_budget_funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  annual_limit NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (annual_limit >= 0),
  currency TEXT NOT NULL DEFAULT 'COP',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.church_budget_actual_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.church_budget_proposals(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.church_procurement_orders(id) ON DELETE SET NULL,
  fund_id UUID REFERENCES public.church_budget_funds(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'COP',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.church_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'general',
  location TEXT NOT NULL DEFAULT '',
  brand TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  serial_number TEXT,
  purchase_date DATE,
  warranty_until DATE,
  purchase_cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (purchase_cost >= 0),
  currency TEXT NOT NULL DEFAULT 'COP',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_repair', 'retired', 'lost')),
  qr_code TEXT UNIQUE,
  image_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.church_maintenance_work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.church_maintenance_requests(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES public.church_assets(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'scheduled', 'in_progress', 'blocked', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  labor_cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (labor_cost >= 0),
  materials_cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (materials_cost >= 0),
  currency TEXT NOT NULL DEFAULT 'COP',
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  before_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  after_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  completion_notes TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.church_procurement_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.church_budget_proposals(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.church_maintenance_requests(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CHECK (proposal_id IS NOT NULL OR request_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS church_budget_approvals_proposal_idx ON public.church_budget_approvals(proposal_id, status, step_order);
CREATE INDEX IF NOT EXISTS church_procurement_orders_status_idx ON public.church_procurement_orders(status, expected_at);
CREATE INDEX IF NOT EXISTS church_budget_expenses_fund_idx ON public.church_budget_actual_expenses(fund_id, expense_date);
CREATE INDEX IF NOT EXISTS church_assets_status_location_idx ON public.church_assets(status, location);
CREATE INDEX IF NOT EXISTS church_work_orders_status_schedule_idx ON public.church_maintenance_work_orders(status, scheduled_for);
CREATE INDEX IF NOT EXISTS church_activity_proposal_created_idx ON public.church_procurement_activity(proposal_id, created_at DESC);

DROP TRIGGER IF EXISTS church_procurement_orders_updated_at ON public.church_procurement_orders;
CREATE TRIGGER church_procurement_orders_updated_at BEFORE UPDATE ON public.church_procurement_orders
FOR EACH ROW EXECUTE FUNCTION public.touch_church_procurement_updated_at();
DROP TRIGGER IF EXISTS church_assets_updated_at ON public.church_assets;
CREATE TRIGGER church_assets_updated_at BEFORE UPDATE ON public.church_assets
FOR EACH ROW EXECUTE FUNCTION public.touch_church_procurement_updated_at();
DROP TRIGGER IF EXISTS church_work_orders_updated_at ON public.church_maintenance_work_orders;
CREATE TRIGGER church_work_orders_updated_at BEFORE UPDATE ON public.church_maintenance_work_orders
FOR EACH ROW EXECUTE FUNCTION public.touch_church_procurement_updated_at();

ALTER TABLE public.church_budget_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_procurement_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_procurement_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_budget_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_budget_actual_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_maintenance_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_procurement_activity ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'church_budget_approvals', 'church_procurement_orders', 'church_procurement_receipts',
    'church_budget_funds', 'church_budget_actual_expenses', 'church_assets',
    'church_maintenance_work_orders', 'church_procurement_activity'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admins manage ' || table_name, table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role IN (''admin'', ''pastor'', ''secretary'', ''secretaria'', ''editor''))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role IN (''admin'', ''pastor'', ''secretary'', ''secretaria'', ''editor'')))', 'Admins manage ' || table_name, table_name);
  END LOOP;
END $$;
