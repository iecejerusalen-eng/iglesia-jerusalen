-- Fase 5: Recursos y Archivos del LMS

-- 1. Crear tabla para recursos compartidos
CREATE TABLE IF NOT EXISTS public.lms_course_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lms_lessons(id) ON DELETE CASCADE, -- Opcional, si pertenece a una clase específica
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER, -- en bytes
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lms_course_resources ENABLE ROW LEVEL SECURITY;

-- 2. Políticas RLS
DROP POLICY IF EXISTS "Public read course resources" ON public.lms_course_resources;
CREATE POLICY "Public read course resources" 
ON public.lms_course_resources 
FOR SELECT TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Teachers and admins can manage resources" ON public.lms_course_resources;
CREATE POLICY "Teachers and admins can manage resources" 
ON public.lms_course_resources 
FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'editor', 'maestro')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'editor', 'maestro')
    )
);

-- 3. Crear Storage Bucket para los recursos si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('lms_resources', 'lms_resources', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
DROP POLICY IF EXISTS "Public access to lms_resources" ON storage.objects;
CREATE POLICY "Public access to lms_resources" ON storage.objects FOR SELECT USING (bucket_id = 'lms_resources');

DROP POLICY IF EXISTS "Authenticated users can upload resources" ON storage.objects;
CREATE POLICY "Authenticated users can upload resources" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lms_resources');

DROP POLICY IF EXISTS "Users can delete their own resources" ON storage.objects;
CREATE POLICY "Users can delete their own resources" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'lms_resources' AND auth.uid() = owner);
