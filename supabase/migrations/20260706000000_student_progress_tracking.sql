-- 20260706000000_student_progress_tracking.sql

-- Sesiones de estudio (cada vez que el estudiante abre un curso)
CREATE TABLE IF NOT EXISTS public.lms_study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 0
);

-- Rachas de estudio (un registro por día que el estudiante estudia)
CREATE TABLE IF NOT EXISTS public.lms_study_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    study_date DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(user_id, study_date)
);

-- Habilitar RLS
ALTER TABLE public.lms_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_study_streaks ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Users can manage their own study sessions" ON public.lms_study_sessions;
CREATE POLICY "Users can manage their own study sessions" ON public.lms_study_sessions 
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own streaks" ON public.lms_study_streaks;
CREATE POLICY "Users can view their own streaks" ON public.lms_study_streaks 
FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Vista materializada no se usa en Supabase directamente si queremos realtime o policies. 
-- Crearemos una función o vista estándar.
CREATE OR REPLACE VIEW public.lms_student_stats WITH (security_invoker = true) AS
SELECT
    e.user_id,
    COUNT(DISTINCT e.course_id) FILTER (WHERE e.status = 'active') as active_courses,
    COUNT(DISTINCT c.id) as completed_courses,
    COALESCE(SUM(DISTINCT e.xp_points), 0) as total_xp,
    COALESCE((SELECT SUM(duration_minutes) FROM public.lms_study_sessions WHERE user_id = e.user_id), 0) as total_study_minutes
FROM public.lms_enrollments e
LEFT JOIN public.lms_certificates c ON c.user_id = e.user_id AND c.course_id = e.course_id
GROUP BY e.user_id;

-- Función para calcular racha actual
CREATE OR REPLACE FUNCTION public.get_current_streak(student_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_streak INTEGER := 0;
    last_date DATE;
    temp_date DATE;
BEGIN
    -- Verificar si estudió hoy o ayer
    SELECT study_date INTO last_date 
    FROM public.lms_study_streaks 
    WHERE user_id = student_id 
    ORDER BY study_date DESC LIMIT 1;
    
    IF last_date IS NULL OR (last_date < CURRENT_DATE - INTERVAL '1 day') THEN
        RETURN 0;
    END IF;

    current_streak := 1;
    temp_date := last_date;

    -- Contar días hacia atrás
    LOOP
        temp_date := temp_date - INTERVAL '1 day';
        IF EXISTS (SELECT 1 FROM public.lms_study_streaks WHERE user_id = student_id AND study_date = temp_date) THEN
            current_streak := current_streak + 1;
        ELSE
            EXIT;
        END IF;
    END LOOP;

    RETURN current_streak;
END;
$$;
