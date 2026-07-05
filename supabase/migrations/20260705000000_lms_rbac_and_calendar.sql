-- Phase 8: RBAC Académico, Cargas Docentes y Calendario Universitario Sincronizado

-- 1. Tabla de Horarios y Carga Docente (Turnos y Enlaces Sincrónicos)
CREATE TABLE IF NOT EXISTS public.lms_teacher_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    shift_name TEXT NOT NULL, -- Ej: "Turno 9 [14:00 PM a 14:59 PM] | Martes"
    day_of_week TEXT NOT NULL, -- Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo
    start_time TEXT NOT NULL, -- Ej: "14:00"
    end_time TEXT NOT NULL, -- Ej: "15:00"
    meet_link TEXT, -- Enlace de videollamada Google Meet / Zoom
    room_or_location TEXT DEFAULT 'Virtual / Aula Online',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla Centralizada de Eventos del Calendario Académico
CREATE TABLE IF NOT EXISTS public.lms_calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES public.lms_activities(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'general', -- 'class' (clases), 'assignment' (entregas), 'exam' (exámenes), 'general' (eventos institucionales)
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización de consultas en tiempo real
CREATE INDEX IF NOT EXISTS idx_lms_teacher_schedules_course ON public.lms_teacher_schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_teacher_schedules_teacher ON public.lms_teacher_schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lms_calendar_events_course ON public.lms_calendar_events(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_calendar_events_dates ON public.lms_calendar_events(start_date, end_date);

-- Habilitar RLS en ambas tablas
ALTER TABLE public.lms_teacher_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_calendar_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para lms_teacher_schedules
CREATE POLICY "Lectura pública de horarios LMS"
    ON public.lms_teacher_schedules
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Gestión de horarios para admins y docentes"
    ON public.lms_teacher_schedules
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role::text IN ('admin', 'pastor', 'editor', 'maestro', 'leader', 'cadetes_leader', 'escuela_dominical_leader')
        )
        OR teacher_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.lms_course_teachers ct
            WHERE ct.course_id = lms_teacher_schedules.course_id AND ct.user_id = auth.uid()
        )
    );

-- Políticas RLS para lms_calendar_events
CREATE POLICY "Lectura de eventos para autenticados"
    ON public.lms_calendar_events
    FOR SELECT
    TO authenticated
    USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Gestión de eventos para admins y docentes"
    ON public.lms_calendar_events
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role::text IN ('admin', 'pastor', 'editor', 'maestro', 'leader', 'cadetes_leader', 'escuela_dominical_leader')
        )
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.lms_course_teachers ct
            WHERE ct.course_id = lms_calendar_events.course_id AND ct.user_id = auth.uid()
        )
    );

-- Trigger: Actualizar timestamp updated_at
CREATE OR REPLACE FUNCTION public.update_lms_calendar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lms_teacher_schedules_update ON public.lms_teacher_schedules;
CREATE TRIGGER trg_lms_teacher_schedules_update
    BEFORE UPDATE ON public.lms_teacher_schedules
    FOR EACH ROW EXECUTE FUNCTION public.update_lms_calendar_timestamp();

DROP TRIGGER IF EXISTS trg_lms_calendar_events_update ON public.lms_calendar_events;
CREATE TRIGGER trg_lms_calendar_events_update
    BEFORE UPDATE ON public.lms_calendar_events
    FOR EACH ROW EXECUTE FUNCTION public.update_lms_calendar_timestamp();
