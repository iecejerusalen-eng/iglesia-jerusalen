-- 20260706010000_lesson_content_system.sql

-- Contenido multimedia dentro de cada actividad (un activity puede tener varios recursos)
CREATE TABLE IF NOT EXISTS public.lms_activity_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.lms_activities(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'video', 'pdf', 'document', 'embed', 'audio'
    title TEXT,
    url TEXT NOT NULL,
    duration_minutes INTEGER, -- Para videos
    file_size_bytes BIGINT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Progreso por recurso individual (para "continuar donde quedé")
CREATE TABLE IF NOT EXISTS public.lms_resource_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.lms_activity_resources(id) ON DELETE CASCADE,
    progress_percent NUMERIC(5,2) DEFAULT 0, -- 0-100
    last_position INTEGER DEFAULT 0, -- Para videos: segundos; Para PDFs: página
    completed BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, resource_id)
);

-- Tiempo estimado por sección
ALTER TABLE public.lms_sections ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 0;

-- Habilitar RLS
ALTER TABLE public.lms_activity_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_resource_progress ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Public can read activity resources" ON public.lms_activity_resources 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and teachers can manage activity resources" ON public.lms_activity_resources 
FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor', 'pastor'))
) WITH CHECK (true);

CREATE POLICY "Users can manage their own resource progress" ON public.lms_resource_progress 
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
