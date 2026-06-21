-- Migración SQL: Creación de la Tabla de Estudios y Extensiones para Programas LMS
-- Define la tabla public.studies con RLS y añade campos de gestión a public.lms_courses.

-- 1. Crear tabla de estudios
CREATE TABLE IF NOT EXISTS public.studies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('Damas', 'Caballeros', 'Jóvenes', 'Generales')),
    cover_image_url TEXT,
    pdf_url TEXT,
    video_url TEXT,
    read_now_url TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en la tabla de estudios
ALTER TABLE public.studies ENABLE ROW LEVEL SECURITY;

-- 2. Definir políticas RLS para public.studies
DROP POLICY IF EXISTS "Public can view published studies" ON public.studies;
CREATE POLICY "Public can view published studies" ON public.studies 
FOR SELECT TO public USING (is_published = true);

DROP POLICY IF EXISTS "Authenticated users can view all studies" ON public.studies;
CREATE POLICY "Authenticated users can view all studies" ON public.studies 
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can manage studies" ON public.studies;
CREATE POLICY "Admin can manage studies" ON public.studies 
FOR ALL TO authenticated
USING (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pastor')))
WITH CHECK (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'pastor')));

-- 3. Añadir columnas de gestión a la tabla public.lms_courses
ALTER TABLE public.lms_courses ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0;
ALTER TABLE public.lms_courses ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT NULL;
ALTER TABLE public.lms_courses ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT NULL;
ALTER TABLE public.lms_courses ADD COLUMN IF NOT EXISTS schedule TEXT DEFAULT NULL;

-- 4. Cargar semillas iniciales de rutas para lms_course_categories
INSERT INTO public.lms_course_categories (name, description) VALUES
  ('Ruta de Integración', 'Clases para Nuevos Creyentes y Preparación para el Bautismo'),
  ('Ruta de Discipulado', 'Crecimiento y madurez espiritual: Fundamentos y Madurez espiritual'),
  ('Programas Especializados', 'Curso Prematrimonial, Escuela de Liderazgo, Seminario Teológico')
ON CONFLICT (name) DO NOTHING;
