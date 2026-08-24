-- ============================================================================
-- MIGRACIÓN DE PERSISTENCIA PARA MÓDULOS ADMINISTRATIVOS
-- Creado: 2026-08-23
-- Descripción: Tablas para Sedes Multi-Campus, Directorio Familiar,
-- Kiosco Check-In Infantil, Formularios Dinámicos y Salud Pastoral Predictiva.
-- ============================================================================

-- 1. TABLA DE SEDES (Multi-Campus)
CREATE TABLE IF NOT EXISTS public.campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  city TEXT DEFAULT 'Milagro',
  address TEXT,
  pastor_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'planned')),
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA DE FAMILIAS
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  city TEXT DEFAULT 'Milagro',
  head_of_household_name TEXT,
  members_count INT DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. KIOSCO DE CHECK-IN INFANTIL
CREATE TABLE IF NOT EXISTS public.child_checkin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_name TEXT NOT NULL,
  classroom_name TEXT NOT NULL,
  checked_in_by TEXT NOT NULL,
  guardian_phone TEXT,
  safety_security_code TEXT NOT NULL,
  status TEXT DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'picked_up')),
  checked_in_at TIMESTAMPTZ DEFAULT now(),
  picked_up_at TIMESTAMPTZ
);

-- 4. FORMULARIOS DINÁMICOS (Form Builder)
CREATE TABLE IF NOT EXISTS public.dynamic_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  fields JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RESPUESTAS DE FORMULARIOS DINÁMICOS
CREATE TABLE IF NOT EXISTS public.dynamic_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES public.dynamic_forms(id) ON DELETE CASCADE,
  form_slug TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  submitted_by_name TEXT,
  submitted_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. SALUD PASTORAL & ANALÍTICAS PREDICTIVAS (Predictive Engagement)
CREATE TABLE IF NOT EXISTS public.member_engagement_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID,
  member_name TEXT NOT NULL,
  email TEXT,
  attendance_score INT DEFAULT 80,
  giving_score INT DEFAULT 80,
  group_score INT DEFAULT 80,
  overall_health_score INT DEFAULT 80,
  risk_level TEXT DEFAULT 'healthy' CHECK (risk_level IN ('healthy', 'moderate_decay', 'high_decay', 'potential_leader')),
  ai_recommendation TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SEGURIDAD RLS (ROW LEVEL SECURITY)
-- ============================================================================

ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_checkin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_engagement_scores ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública para sedes y formularios activos
CREATE POLICY "Lectura pública de sedes activas" ON public.campuses FOR SELECT USING (true);
CREATE POLICY "Lectura pública de formularios publicados" ON public.dynamic_forms FOR SELECT USING (is_published = true);
CREATE POLICY "Inserción pública de respuestas de formularios" ON public.dynamic_form_submissions FOR INSERT WITH CHECK (true);

-- Políticas de administración autenticada
CREATE POLICY "Administración total de sedes" ON public.campuses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Administración total de familias" ON public.families FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Administración total de checkin infantil" ON public.child_checkin_sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Administración total de formularios" ON public.dynamic_forms FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Administración total de respuestas" ON public.dynamic_form_submissions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Administración total de salud pastoral" ON public.member_engagement_scores FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- ÍNDICES PARA ALTO RENDIMIENTO
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_campuses_status ON public.campuses(status);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_slug ON public.dynamic_forms(slug);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.dynamic_form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_child_checkin_code ON public.child_checkin_sessions(safety_security_code);
CREATE INDEX IF NOT EXISTS idx_engagement_risk ON public.member_engagement_scores(risk_level);
