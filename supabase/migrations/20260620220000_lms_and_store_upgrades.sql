-- 20260620220000_lms_and_store_upgrades.sql
-- Upgrades to LMS (Cursos -> Materias -> Módulos -> Lecciones) and Store Manager (Promotions, Order Lifecycle, Suppliers KYC, Disputes)

-- 1. Create LMS hierarchy tables: lms_subjects, lms_modules, lms_lessons
CREATE TABLE IF NOT EXISTS public.lms_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.lms_courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lms_modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES public.lms_subjects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lms_lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID REFERENCES public.lms_modules(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'document', -- 'document', 'video', 'quiz', 'forum', 'h5p', 'assignment'
    content TEXT,
    description TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Completions for the new hierarchy
CREATE TABLE IF NOT EXISTS public.lms_lesson_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES public.lms_lessons(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(lesson_id, student_id)
);

-- Submissions for lessons
CREATE TABLE IF NOT EXISTS public.lms_lesson_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES public.lms_lessons(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT,
    text_content TEXT,
    grade TEXT,
    teacher_feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    graded_at TIMESTAMPTZ,
    UNIQUE(lesson_id, student_id)
);

-- Forum posts for lessons
CREATE TABLE IF NOT EXISTS public.lms_lesson_forum_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES public.lms_lessons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.lms_lesson_forum_posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Quiz grades/attempts for lessons
CREATE TABLE IF NOT EXISTS public.lms_lesson_quiz_grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES public.lms_lessons(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    max_score NUMERIC(5,2) NOT NULL,
    answers JSONB DEFAULT '{}'::jsonb,
    completed_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Store upgrades: Dynamic store categories, suppliers, disputes
CREATE TABLE IF NOT EXISTS public.store_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default categories
INSERT INTO public.store_categories (name, description) VALUES
('Libros', 'Libros y literatura de estudio bíblico'),
('Música', 'Álbumes, canciones e instrumentales'),
('Ropa', 'Prendas y camisetas oficiales de la iglesia'),
('Eventos', 'Entradas y pases para conferencias y seminarios'),
('Recursos', 'Material didáctico digital y recursos de apoyo')
ON CONFLICT (name) DO NOTHING;

-- Add promotions & discount fields to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_price NUMERIC(10,2) DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS promo_tag TEXT DEFAULT NULL;

-- Add order lifecycle and shipping override columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none'; -- 'none', 'partial', 'full'
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_reason TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_recipient_name TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_phone TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_override_address TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_status_notes TEXT DEFAULT NULL;

-- Suppliers onboarding & KYC
CREATE TABLE IF NOT EXISTS public.store_suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'active', 'inactive'
    kyc_tax_id_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    kyc_bank_status TEXT DEFAULT 'pending',
    kyc_agreement_status TEXT DEFAULT 'pending',
    kyc_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Disputes & Fraud
CREATE TABLE IF NOT EXISTS public.store_disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'fraud_suspicion', 'broken_item', 'wrong_item', 'not_received', 'other'
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open', -- 'open', 'under_investigation', 'resolved', 'dismissed'
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Enablement & Policies
ALTER TABLE public.lms_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_lesson_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_lesson_forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_lesson_quiz_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_disputes ENABLE ROW LEVEL SECURITY;

-- Select policies
DROP POLICY IF EXISTS "Public read lms_subjects" ON public.lms_subjects;
CREATE POLICY "Public read lms_subjects" ON public.lms_subjects FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read lms_modules" ON public.lms_modules;
CREATE POLICY "Public read lms_modules" ON public.lms_modules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read lms_lessons" ON public.lms_lessons;
CREATE POLICY "Public read lms_lessons" ON public.lms_lessons FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read store_categories" ON public.store_categories;
CREATE POLICY "Public read store_categories" ON public.store_categories FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Read own lesson completions" ON public.lms_lesson_completions;
CREATE POLICY "Read own lesson completions" ON public.lms_lesson_completions FOR SELECT TO authenticated USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Read own lesson submissions" ON public.lms_lesson_submissions;
CREATE POLICY "Read own lesson submissions" ON public.lms_lesson_submissions FOR SELECT TO authenticated USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Read lesson forum posts" ON public.lms_lesson_forum_posts;
CREATE POLICY "Read lesson forum posts" ON public.lms_lesson_forum_posts FOR SELECT TO authenticated USING (true);

-- Admin manage policies
DROP POLICY IF EXISTS "Admin manage lms_subjects" ON public.lms_subjects;
CREATE POLICY "Admin manage lms_subjects" ON public.lms_subjects FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'pastor', 'leader'))
);

DROP POLICY IF EXISTS "Admin manage lms_modules" ON public.lms_modules;
CREATE POLICY "Admin manage lms_modules" ON public.lms_modules FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'pastor', 'leader'))
);

DROP POLICY IF EXISTS "Admin manage lms_lessons" ON public.lms_lessons;
CREATE POLICY "Admin manage lms_lessons" ON public.lms_lessons FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'pastor', 'leader'))
);

DROP POLICY IF EXISTS "Admin manage store_categories" ON public.store_categories;
CREATE POLICY "Admin manage store_categories" ON public.store_categories FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'pastor'))
);

DROP POLICY IF EXISTS "Admin manage store_suppliers" ON public.store_suppliers;
CREATE POLICY "Admin manage store_suppliers" ON public.store_suppliers FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'pastor'))
);

DROP POLICY IF EXISTS "Admin manage store_disputes" ON public.store_disputes;
CREATE POLICY "Admin manage store_disputes" ON public.store_disputes FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'pastor'))
);

-- Student insert/update completions and submissions
DROP POLICY IF EXISTS "Student manage own completions" ON public.lms_lesson_completions;
CREATE POLICY "Student manage own completions" ON public.lms_lesson_completions FOR ALL TO authenticated 
    USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Student manage own submissions" ON public.lms_lesson_submissions;
CREATE POLICY "Student manage own submissions" ON public.lms_lesson_submissions FOR ALL TO authenticated 
    USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Student write forum posts" ON public.lms_lesson_forum_posts;
CREATE POLICY "Student write forum posts" ON public.lms_lesson_forum_posts FOR ALL TO authenticated 
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Student own quiz grades" ON public.lms_lesson_quiz_grades;
CREATE POLICY "Student own quiz grades" ON public.lms_lesson_quiz_grades FOR ALL TO authenticated 
    USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

-- Data Migration helper (Non-destructive fallback: migrate existing sections/activities to subjects/modules/lessons)
DO $$
DECLARE
    sec_rec RECORD;
    act_rec RECORD;
    default_mod_id UUID;
BEGIN
    -- Check if we have courses and sections to migrate
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_sections') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lms_activities') THEN
        
        FOR sec_rec IN SELECT * FROM public.lms_sections LOOP
            -- Create a subject from section
            INSERT INTO public.lms_subjects (id, course_id, title, description, order_index, created_at)
            VALUES (sec_rec.id, sec_rec.course_id, sec_rec.title, sec_rec.description, sec_rec.order_index, sec_rec.created_at)
            ON CONFLICT (id) DO NOTHING;
            
            -- Create a default module inside this subject deterministically
            default_mod_id := md5(sec_rec.id::text || '_module')::uuid;
            
            INSERT INTO public.lms_modules (id, subject_id, title, description, order_index)
            VALUES (default_mod_id, sec_rec.id, 'Módulo General', 'Contenidos y lecciones generales', 0)
            ON CONFLICT (id) DO NOTHING;

            -- Migrate activities of this section to lessons inside the module
            FOR act_rec IN SELECT * FROM public.lms_activities WHERE section_id = sec_rec.id LOOP
                INSERT INTO public.lms_lessons (id, module_id, title, type, content, description, settings, order_index, created_at, updated_at)
                VALUES (act_rec.id, default_mod_id, act_rec.title, act_rec.type, act_rec.content, NULL, act_rec.settings, act_rec.order_index, act_rec.created_at, act_rec.updated_at)
                ON CONFLICT (id) DO NOTHING;
            END LOOP;
        END LOOP;
    END IF;
END $$;
