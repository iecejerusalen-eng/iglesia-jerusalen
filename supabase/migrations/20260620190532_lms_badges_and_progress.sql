-- 20260620190532_lms_badges_and_progress.sql

-- Tabla para almacenar las insignias (badges) obtenidas por los estudiantes
CREATE TABLE IF NOT EXISTS public.lms_student_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    badge_name TEXT NOT NULL,
    badge_svg TEXT NOT NULL, -- Almacenará el código SVG dinámico de la insignia
    awarded_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, course_id, badge_name) -- Un estudiante solo puede tener una insignia del mismo tipo por curso
);

-- Habilitar RLS
ALTER TABLE public.lms_student_badges ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Usuarios pueden ver todas las insignias" ON public.lms_student_badges 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Estudiantes pueden insertar sus propias insignias" ON public.lms_student_badges 
FOR INSERT TO authenticated WITH CHECK (student_id = (select auth.uid()));

-- Asegurar que los estudiantes puedan insertar en activity_completions (si no estaba la política de INSERT explícita)
DROP POLICY IF EXISTS "Users can view and manage their own completions" ON public.lms_activity_completions;
CREATE POLICY "Users can view and manage their own completions" ON public.lms_activity_completions 
FOR ALL TO authenticated USING (student_id = (select auth.uid())) WITH CHECK (student_id = (select auth.uid()));
