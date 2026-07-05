-- Fase 12: Gestión de Grupos de Estudio y Participantes (Multi-grupo)

-- 1. Tabla: lms_groups
CREATE TABLE IF NOT EXISTS public.lms_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- ej. "Paralelo A", "Sábados Tarde"
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla intermedia: lms_group_members (M:N)
CREATE TABLE IF NOT EXISTS public.lms_group_members (
    group_id UUID NOT NULL REFERENCES public.lms_groups(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (group_id, student_id)
);

-- RLS Policies
ALTER TABLE public.lms_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_group_members ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura
CREATE POLICY "Public read groups"
    ON public.lms_groups FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Public read group members"
    ON public.lms_group_members FOR SELECT
    TO authenticated
    USING (true);

-- Políticas de escritura para admin
CREATE POLICY "Admin write groups"
    ON public.lms_groups FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND role IN ('admin', 'pastor', 'editor')
        )
    )
    WITH CHECK (true);

CREATE POLICY "Admin write group members"
    ON public.lms_group_members FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND role IN ('admin', 'pastor', 'editor')
        )
    )
    WITH CHECK (true);
