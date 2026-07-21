-- 20260721030000_lms_gamification.sql
-- Motor de Gamificación y Retención

-- ============================================================================
-- 1. TABLAS CORE DE GAMIFICACIÓN
-- ============================================================================

-- Estadísticas de cada estudiante (XP, Streaks, Nivel)
DROP TABLE IF EXISTS public.lms_student_stats CASCADE;
CREATE TABLE IF NOT EXISTS public.lms_student_stats (
    student_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    xp_total INTEGER DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    longest_streak INTEGER DEFAULT 0 NOT NULL,
    last_activity_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Catálogo de insignias y medallas disponibles
CREATE TABLE IF NOT EXISTS public.lms_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT, -- Puede ser un emoji o URL a un SVG
    category TEXT DEFAULT 'general', -- 'general', 'theology', 'streak', etc.
    required_xp INTEGER DEFAULT 0, -- XP mínima para desbloquear
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Insignias desbloqueadas por los estudiantes
CREATE TABLE IF NOT EXISTS public.lms_student_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.lms_badges(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    UNIQUE(student_id, badge_id)
);

-- Historial de obtención de XP (opcional, para UI de "Has ganado +50 XP")
CREATE TABLE IF NOT EXISTS public.lms_xp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'lesson_completed', 'forum_post', 'daily_login'
    xp_amount INTEGER NOT NULL,
    reference_id UUID, -- ID de la lección o foro
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- ============================================================================
-- 2. POLÍTICAS RLS (Seguridad)
-- ============================================================================

ALTER TABLE public.lms_student_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_xp_logs ENABLE ROW LEVEL SECURITY;

-- Los estudiantes pueden ver sus propias estadísticas y de otros (para el leaderboard)
DROP POLICY IF EXISTS "Public can view student stats" ON public.lms_student_stats;
CREATE POLICY "Public can view student stats" ON public.lms_student_stats
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public can view active badges" ON public.lms_badges;
CREATE POLICY "Public can view active badges" ON public.lms_badges
    FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Public can view who has what badge" ON public.lms_student_badges;
CREATE POLICY "Public can view who has what badge" ON public.lms_student_badges
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Students can view their own xp logs" ON public.lms_xp_logs;
CREATE POLICY "Students can view their own xp logs" ON public.lms_xp_logs
    FOR SELECT TO authenticated USING (auth.uid() = student_id);

-- Solo administradores pueden gestionar el catálogo de medallas
DROP POLICY IF EXISTS "Admins can manage badges" ON public.lms_badges;
CREATE POLICY "Admins can manage badges" ON public.lms_badges
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );

-- ============================================================================
-- 3. FUNCIONES Y TRIGGERS PARA XP AUTOMÁTICO
-- ============================================================================

-- Función: Calcular Nivel basado en XP
-- Fórmula simple: Nivel = floor(sqrt(XP / 100)) + 1
-- Ej: 0-99 XP = Lvl 1 | 100-399 = Lvl 2 | 400-899 = Lvl 3 | 900-1599 = Lvl 4
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(SQRT(xp / 100.0)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función: Otorgar XP a un estudiante (Llamada desde la app o por triggers)
CREATE OR REPLACE FUNCTION public.grant_xp(
    p_student_id UUID,
    p_action_type TEXT,
    p_xp_amount INTEGER,
    p_reference_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_current_xp INTEGER;
    v_new_level INTEGER;
    v_current_date DATE := CURRENT_DATE;
    v_last_activity DATE;
    v_streak INTEGER;
    v_max_streak INTEGER;
BEGIN
    -- Crear el log
    INSERT INTO public.lms_xp_logs (student_id, action_type, xp_amount, reference_id)
    VALUES (p_student_id, p_action_type, p_xp_amount, p_reference_id);

    -- Obtener o inicializar stats del estudiante
    SELECT xp_total, last_activity_date::date, current_streak, longest_streak 
    INTO v_current_xp, v_last_activity, v_streak, v_max_streak
    FROM public.lms_student_stats
    WHERE student_id = p_student_id;

    IF NOT FOUND THEN
        -- Es su primera interacción de gamificación
        INSERT INTO public.lms_student_stats (student_id, xp_total, current_streak, longest_streak, last_activity_date)
        VALUES (p_student_id, p_xp_amount, 1, 1, timezone('utc', now()));
        v_current_xp := p_xp_amount;
    ELSE
        -- Ya tiene stats. Actualizar XP.
        v_current_xp := v_current_xp + p_xp_amount;
        
        -- Lógica de Racha (Streak)
        IF v_last_activity = v_current_date THEN
            -- Ya hizo actividad hoy, no cambia la racha
            NULL;
        ELSIF v_last_activity = v_current_date - 1 THEN
            -- Actividad ayer, continúa racha
            v_streak := v_streak + 1;
            IF v_streak > v_max_streak THEN v_max_streak := v_streak; END IF;
        ELSE
            -- Perdió la racha
            v_streak := 1;
        END IF;

        -- Actualizar todo
        UPDATE public.lms_student_stats
        SET xp_total = v_current_xp,
            level = public.calculate_level_from_xp(v_current_xp),
            current_streak = v_streak,
            longest_streak = v_max_streak,
            last_activity_date = timezone('utc', now()),
            updated_at = timezone('utc', now())
        WHERE student_id = p_student_id;
    END IF;
    
    -- Nota: La lógica de desbloqueo automático de medallas se puede
    -- manejar en Edge Functions o con triggers más complejos luego.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. SEED: Medallas Base
-- ============================================================================
INSERT INTO public.lms_badges (name, description, icon_url, required_xp)
VALUES 
    ('Primer Paso', 'Completaste tu primera lección.', '🌱', 10),
    ('Estudiante Constante', 'Alcanzaste el Nivel 3 de XP.', '⭐', 400),
    ('Lector Frecuente', 'Alcanzaste el Nivel 5 de XP.', '📖', 1600),
    ('Teólogo Junior', 'Alcanzaste el Nivel 10 de XP.', '🎓', 8100)
ON CONFLICT DO NOTHING;
