-- =======================================================
-- MIGRACIÓN: SUITE COMPETITIVA (9 MÓDULOS DE GAPs)
-- =======================================================

-- 1. SEDES / CAMPUSES
CREATE TABLE IF NOT EXISTS public.campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  pastor_name TEXT,
  is_main BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'planned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FAMILIAS / UNIDADES FAMILIARES
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  role_in_family TEXT NOT NULL DEFAULT 'member' CHECK (role_in_family IN ('head', 'spouse', 'child', 'guardian', 'member')),
  is_primary_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, member_id)
);

-- 3. DONACIONES RECURRENTES & RECIBOS FISCALES
CREATE TABLE IF NOT EXISTS public.recurring_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  donor_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  fund_name TEXT DEFAULT 'General',
  payment_method TEXT DEFAULT 'card',
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'failing')),
  next_deduction_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tax_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  donor_tax_id TEXT,
  donor_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  pdf_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'sent'))
);

-- 4. CHECK-IN SEGURO DE NIÑOS & TUTORES AUTORIZADOS
CREATE TABLE IF NOT EXISTS public.authorized_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  relationship TEXT DEFAULT 'Parent',
  identification_id TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.child_checkin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  safety_security_code TEXT NOT NULL,
  classroom_name TEXT NOT NULL,
  allergies_medical_notes TEXT,
  checked_in_by TEXT NOT NULL,
  checked_out_by TEXT,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  status TEXT DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out', 'alert_called'))
);

-- 5. FORMULARIOS DINÁMICOS & SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.dynamic_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT true,
  requires_auth BOOLEAN DEFAULT false,
  cover_image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dynamic_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.dynamic_forms(id) ON DELETE CASCADE,
  submitter_email TEXT,
  submitter_name TEXT,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FEED COMUNITARIO
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  title TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'testimony', 'prayer', 'announcement', 'event')),
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_checkin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

-- POLITICAS DE LECTURA PÚBLICA / PERMISIVAS DE LECTURA NATIVAS
CREATE POLICY "Public campuses read" ON public.campuses FOR SELECT USING (true);
CREATE POLICY "Public dynamic forms read" ON public.dynamic_forms FOR SELECT USING (is_published = true);
CREATE POLICY "Public community posts read" ON public.community_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Public community comments read" ON public.community_comments FOR SELECT USING (true);
CREATE POLICY "Public community likes read" ON public.community_likes FOR SELECT USING (true);

-- POLITICAS PERMISIVAS DE ESCRITURA PARA USUARIOS AUTENTICADOS O ACCESO ADMIN
CREATE POLICY "Authenticated admin full campuses" ON public.campuses FOR ALL USING (true);
CREATE POLICY "Authenticated admin full families" ON public.families FOR ALL USING (true);
CREATE POLICY "Authenticated admin full family members" ON public.family_members FOR ALL USING (true);
CREATE POLICY "Authenticated admin full recurring donations" ON public.recurring_donations FOR ALL USING (true);
CREATE POLICY "Authenticated admin full tax statements" ON public.tax_statements FOR ALL USING (true);
CREATE POLICY "Authenticated admin full guardians" ON public.authorized_guardians FOR ALL USING (true);
CREATE POLICY "Authenticated admin full child checkin" ON public.child_checkin_sessions FOR ALL USING (true);
CREATE POLICY "Authenticated admin full dynamic forms" ON public.dynamic_forms FOR ALL USING (true);
CREATE POLICY "Public insert form submissions" ON public.dynamic_form_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated admin read form submissions" ON public.dynamic_form_submissions FOR SELECT USING (true);
CREATE POLICY "Authenticated insert community posts" ON public.community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update community posts" ON public.community_posts FOR UPDATE USING (true);
CREATE POLICY "Authenticated insert community comments" ON public.community_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated insert community likes" ON public.community_likes FOR INSERT WITH CHECK (true);
