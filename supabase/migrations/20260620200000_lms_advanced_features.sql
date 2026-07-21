-- Migration: Advanced LMS Features, Course Categories, Enrollments requests, System Plugins, Attendance and Tutoring appointments

-- 1. Course Categories Table
CREATE TABLE IF NOT EXISTS public.lms_course_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lms_courses ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.lms_course_categories(id) ON DELETE SET NULL;
ALTER TABLE public.lms_courses ADD COLUMN IF NOT EXISTS default_format_settings JSONB DEFAULT '{"format": "weekly", "grading_scale": "10/10", "passing_grade": "7"}'::jsonb;

-- 2. Enrollment Requests Table
CREATE TABLE IF NOT EXISTS public.lms_enrollment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(course_id, user_id)
);

-- 3. System Plugins Table
CREATE TABLE IF NOT EXISTS public.system_plugins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('activity', 'block', 'theme', 'filter')),
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
    settings JSONB DEFAULT '{}'::jsonb,
    version TEXT DEFAULT '1.0.0',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial plugins
INSERT INTO public.system_plugins (name, description, type, status, version) VALUES
  ('Módulo de Tareas', 'Permite a los estudiantes subir documentos o ingresar texto para ser calificados.', 'activity', 'active', '1.2.0'),
  ('Cuestionarios Interactivos', 'Editor de exámenes y trivia auto-calificables con límite de tiempo.', 'activity', 'active', '2.0.1'),
  ('Foros de Discusión', 'Módulos de discusión grupal asíncronos para debates espirituales.', 'activity', 'active', '1.0.5'),
  ('Bloque de Lectura Diaria', 'Panel que muestra el avance en el plan de lectura bíblica asignado.', 'block', 'active', '1.0.0'),
  ('Tema Metalizado Oro', 'Aspecto premium con acentos en dorado para la interfaz estudiantil.', 'theme', 'inactive', '1.0.0'),
  ('Filtro de Contenido Ofensivo', 'Oculta palabras inapropiadas en foros y chats virtuales.', 'filter', 'active', '1.1.0')
ON CONFLICT (name) DO NOTHING;

-- 4. Medical / Emergency Fields for Members
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS medical_notes TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- 5. Sessions and Attendance Tables
CREATE TABLE IF NOT EXISTS public.lms_class_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    session_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lms_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.lms_class_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(session_id, student_id)
);

-- 6. Student Groups Tables
CREATE TABLE IF NOT EXISTS public.lms_student_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lms_group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.lms_student_groups(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(group_id, student_id)
);

-- 7. Announcements Table
CREATE TABLE IF NOT EXISTS public.lms_announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Tutoring Appointments Table
CREATE TABLE IF NOT EXISTS public.lms_tutoring_appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Course Integrations Table
CREATE TABLE IF NOT EXISTS public.lms_course_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google_classroom', 'zoom', 'teams')),
    credentials JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(course_id, provider)
);

-- 10. Enable Row Level Security (RLS) on new tables
ALTER TABLE public.lms_course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_enrollment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_tutoring_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_course_integrations ENABLE ROW LEVEL SECURITY;

-- 11. Define Policies
CREATE POLICY "Allow public read for course categories" ON public.lms_course_categories FOR SELECT TO public USING (true);
CREATE POLICY "Allow admin manage for course categories" ON public.lms_course_categories FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow view enrollment requests to teachers and admins" ON public.lms_enrollment_requests FOR SELECT TO authenticated
USING (
    exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role in ('admin', 'pastor')
    )
    or
    exists (
        select 1 from public.lms_course_teachers
        where course_id = lms_enrollment_requests.course_id and user_id = (select auth.uid())
    )
);

CREATE POLICY "Allow student insert enrollment requests" ON public.lms_enrollment_requests FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Allow admin/teacher update enrollment requests" ON public.lms_enrollment_requests FOR ALL TO authenticated
USING (true);

CREATE POLICY "Allow public read for plugins" ON public.system_plugins FOR SELECT TO public USING (true);
CREATE POLICY "Allow admin manage for plugins" ON public.system_plugins FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow class sessions view" ON public.lms_class_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow class sessions manage" ON public.lms_class_sessions FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow attendance view" ON public.lms_attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow attendance manage" ON public.lms_attendance FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow student groups view" ON public.lms_student_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow student groups manage" ON public.lms_student_groups FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow group members view" ON public.lms_group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow group members manage" ON public.lms_group_members FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow announcements view" ON public.lms_announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow announcements manage" ON public.lms_announcements FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow tutoring view" ON public.lms_tutoring_appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow tutoring manage" ON public.lms_tutoring_appointments FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow integrations view" ON public.lms_course_integrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow integrations manage" ON public.lms_course_integrations FOR ALL TO authenticated USING (true);
