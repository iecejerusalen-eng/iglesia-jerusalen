-- Migración para reestructurar y enriquecer el LMS estilo Moodle

-- 1. Crear tabla lms_terms (Periodos o Semestres)
CREATE TABLE IF NOT EXISTS public.lms_terms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- ej. "Semestre A 2026", "Bimestre 1"
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Asegurarse que lms_courses y las jerarquías estén bien conectadas a terms si aplica
ALTER TABLE public.lms_courses ADD COLUMN IF NOT EXISTS term_id UUID REFERENCES public.lms_terms(id) ON DELETE SET NULL;

-- 3. Crear tabla para matrícula por periodo/materia (lms_enrollments ya existe pero asegurar vinculación)
ALTER TABLE public.lms_enrollments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'; -- active, suspended, completed
ALTER TABLE public.lms_enrollments ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Crear tabla de calificaciones generales (lms_grades) para abstraer notas
CREATE TABLE IF NOT EXISTS public.lms_grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    enrollment_id UUID REFERENCES public.lms_enrollments(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.lms_subjects(id) ON DELETE CASCADE,
    final_grade NUMERIC(5,2),
    comments TEXT,
    graded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Vincular docentes con perfiles
-- Asegurarnos que lms_course_teachers está intacta
CREATE TABLE IF NOT EXISTS public.lms_course_teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'teacher', -- head_teacher, assistant
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Habilitar RLS en nuevas tablas
ALTER TABLE public.lms_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_course_teachers ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de Seguridad Básicas (Permisos)
-- Terms (Público de lectura, Admin edición)
CREATE POLICY "Public read terms" ON public.lms_terms FOR SELECT USING (true);
CREATE POLICY "Admin write terms" ON public.lms_terms FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (role::text = 'admin' OR role::text = 'pastor'))
);

-- Grades (Docente/Admin pueden ver/editar, Alumno solo ve la suya)
CREATE POLICY "Admin/Teacher write grades" ON public.lms_grades FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (role::text = 'admin' OR role::text = 'maestro' OR role::text = 'docente' OR role::text = 'pastor'))
);
CREATE POLICY "Student read own grades" ON public.lms_grades FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.lms_enrollments WHERE lms_enrollments.id = lms_grades.enrollment_id AND lms_enrollments.user_id = auth.uid())
);

-- Teachers (Público lectura, Admin edición)
CREATE POLICY "Public read course teachers" ON public.lms_course_teachers FOR SELECT USING (true);
CREATE POLICY "Admin write course teachers" ON public.lms_course_teachers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (role::text = 'admin' OR role::text = 'pastor'))
);
