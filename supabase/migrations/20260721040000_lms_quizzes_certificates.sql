-- 20260721040000_lms_quizzes_certificates.sql
-- Motor de Evaluaciones y Certificados

-- ============================================================================
-- 1. TABLAS PARA QUIZZES (EVALUACIONES)
-- ============================================================================

-- Configuración general del Quiz (Se enlaza 1-a-1 con un lms_lessons de tipo 'quiz')
CREATE TABLE IF NOT EXISTS public.lms_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES public.lms_lessons(id) ON DELETE CASCADE,
    time_limit_minutes INTEGER DEFAULT 0, -- 0 significa sin límite
    passing_score INTEGER DEFAULT 70, -- Porcentaje mínimo para aprobar
    max_attempts INTEGER DEFAULT 1, -- 0 para intentos ilimitados
    shuffle_questions BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Banco de Preguntas
CREATE TABLE IF NOT EXISTS public.lms_quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.lms_quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'multiple_choice', -- 'multiple_choice', 'true_false', 'open_ended'
    points INTEGER DEFAULT 1,
    options JSONB, -- Ejemplo: [{"id": 1, "text": "Opción A"}, {"id": 2, "text": "Opción B"}]
    correct_answer JSONB, -- ID de la opción correcta o texto si es abierta
    order_num INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Intentos de resolución por los estudiantes
CREATE TABLE IF NOT EXISTS public.lms_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.lms_quizzes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    completed_at TIMESTAMPTZ,
    score INTEGER, -- Puntaje obtenido
    is_passed BOOLEAN,
    answers JSONB, -- Guarda las respuestas del alumno
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- ============================================================================
-- 2. TABLAS PARA RÚBRICAS (TAREAS MANUALES)
-- ============================================================================

-- Rúbrica para tareas (assignments)
CREATE TABLE IF NOT EXISTS public.lms_rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES public.lms_lessons(id) ON DELETE CASCADE,
    criteria JSONB NOT NULL, -- Ejemplo: [{"name": "Ortografía", "weight": 20}, {"name": "Contenido", "weight": 80}]
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- ============================================================================
-- 3. TABLAS PARA CERTIFICADOS
-- ============================================================================

-- Plantillas de certificados por curso (Para el Tipo 1 y 2 que pidió el usuario)
CREATE TABLE IF NOT EXISTS public.lms_certificate_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    template_type TEXT DEFAULT 'html', -- 'html' o 'image_overlay'
    background_image_url TEXT,
    html_content TEXT, -- Contenido HTML si es tipo 2
    overlay_config JSONB, -- Coordenadas si es tipo 1 (ej: {"name_pos": {"x": 100, "y": 200}})
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Certificados emitidos
CREATE TABLE IF NOT EXISTS public.lms_certificates_issued (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    issue_date TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    validation_hash TEXT UNIQUE NOT NULL, -- UUID/Hash para el QR
    pdf_url TEXT, -- URL del PDF generado guardado en Storage
    UNIQUE(student_id, course_id)
);

-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================

ALTER TABLE public.lms_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_certificates_issued ENABLE ROW LEVEL SECURITY;

-- Los estudiantes pueden ver quizzes, preguntas, rúbricas y plantillas
DROP POLICY IF EXISTS "Public can view quizzes" ON public.lms_quizzes;
CREATE POLICY "Public can view quizzes" ON public.lms_quizzes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can view quiz questions" ON public.lms_quiz_questions;
CREATE POLICY "Public can view quiz questions" ON public.lms_quiz_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can view rubrics" ON public.lms_rubrics;
CREATE POLICY "Public can view rubrics" ON public.lms_rubrics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can view certificate templates" ON public.lms_certificate_templates;
CREATE POLICY "Public can view certificate templates" ON public.lms_certificate_templates FOR SELECT USING (true);

-- Los estudiantes pueden insertar y ver sus propios intentos
DROP POLICY IF EXISTS "Students can view their quiz attempts" ON public.lms_quiz_attempts;
CREATE POLICY "Students can view their quiz attempts" ON public.lms_quiz_attempts
    FOR SELECT TO authenticated USING ((select auth.uid()) = student_id);
    
DROP POLICY IF EXISTS "Students can create quiz attempts" ON public.lms_quiz_attempts;
CREATE POLICY "Students can create quiz attempts" ON public.lms_quiz_attempts
    FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = student_id);
    
DROP POLICY IF EXISTS "Students can update their own uncompleted quiz attempts" ON public.lms_quiz_attempts;
CREATE POLICY "Students can update their own uncompleted quiz attempts" ON public.lms_quiz_attempts
    FOR UPDATE TO authenticated USING ((select auth.uid()) = student_id AND completed_at IS NULL);

-- Los estudiantes pueden ver sus propios certificados emitidos
DROP POLICY IF EXISTS "Students can view their certificates" ON public.lms_certificates_issued;
CREATE POLICY "Students can view their certificates" ON public.lms_certificates_issued
    FOR SELECT TO authenticated USING ((select auth.uid()) = student_id);

-- Los verificadores anónimos pueden ver un certificado si tienen el validation_hash (QR)
-- Nota: La política de anon/public se hace usualmente por RPC o habilitando SELECT anónimo filtrando por validation_hash.
DROP POLICY IF EXISTS "Anyone can verify certificate by hash" ON public.lms_certificates_issued;
CREATE POLICY "Anyone can verify certificate by hash" ON public.lms_certificates_issued
    FOR SELECT USING (true);

-- Administradores tienen control total sobre todo
DROP POLICY IF EXISTS "Admins full access quizzes" ON public.lms_quizzes;
CREATE POLICY "Admins full access quizzes" ON public.lms_quizzes FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Admins full access quiz questions" ON public.lms_quiz_questions;
CREATE POLICY "Admins full access quiz questions" ON public.lms_quiz_questions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Admins full access quiz attempts" ON public.lms_quiz_attempts;
CREATE POLICY "Admins full access quiz attempts" ON public.lms_quiz_attempts FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Admins full access rubrics" ON public.lms_rubrics;
CREATE POLICY "Admins full access rubrics" ON public.lms_rubrics FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Admins full access cert templates" ON public.lms_certificate_templates;
CREATE POLICY "Admins full access cert templates" ON public.lms_certificate_templates FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Admins full access certs issued" ON public.lms_certificates_issued;
CREATE POLICY "Admins full access certs issued" ON public.lms_certificates_issued FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'editor')));
