-- Fase 13: Certificados, Competencias y Analíticas

-- 1. Tabla: lms_competencies (Catálogo global por escuela)
CREATE TABLE IF NOT EXISTS public.lms_competencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.lms_schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla intermedia: lms_course_competencies
CREATE TABLE IF NOT EXISTS public.lms_course_competencies (
    course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    competency_id UUID NOT NULL REFERENCES public.lms_competencies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (course_id, competency_id)
);

-- 3. Tabla: lms_certificates (Emisión de certificados a alumnos)
CREATE TABLE IF NOT EXISTS public.lms_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    grade NUMERIC(5,2),
    code_url TEXT UNIQUE,
    issued_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.lms_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_course_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_certificates ENABLE ROW LEVEL SECURITY;

-- Competencies Policies
DROP POLICY IF EXISTS "Public read competencies" ON public.lms_competencies;
CREATE POLICY "Public read competencies" ON public.lms_competencies FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin write competencies" ON public.lms_competencies;
CREATE POLICY "Admin write competencies" ON public.lms_competencies FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor', 'pastor'))
) WITH CHECK (true);

-- Course Competencies Policies
DROP POLICY IF EXISTS "Public read course competencies" ON public.lms_course_competencies;
CREATE POLICY "Public read course competencies" ON public.lms_course_competencies FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Teacher write course competencies" ON public.lms_course_competencies;
CREATE POLICY "Teacher write course competencies" ON public.lms_course_competencies FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM lms_enrollments WHERE course_id = lms_course_competencies.course_id AND user_id = auth.uid() AND role = 'teacher') OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor', 'pastor'))
) WITH CHECK (true);

-- Certificates Policies
DROP POLICY IF EXISTS "Anyone can verify certificate by ID" ON public.lms_certificates;
CREATE POLICY "Anyone can verify certificate by ID" ON public.lms_certificates FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Teachers and Admins can issue certificates" ON public.lms_certificates;
CREATE POLICY "Teachers and Admins can issue certificates" ON public.lms_certificates FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM lms_enrollments WHERE course_id = lms_certificates.course_id AND user_id = auth.uid() AND role = 'teacher') OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor', 'pastor'))
) WITH CHECK (true);
