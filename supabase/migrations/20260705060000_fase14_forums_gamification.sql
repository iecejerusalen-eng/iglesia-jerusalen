-- Fase 14: Foros, Notificaciones y Gamificación

-- 1. Modificar lms_courses para soportar configuración de Gamificación
ALTER TABLE public.lms_courses ADD COLUMN IF NOT EXISTS gamification_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.lms_courses ADD COLUMN IF NOT EXISTS convert_xp_to_grade BOOLEAN DEFAULT false;
ALTER TABLE public.lms_enrollments ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0;

-- 2. Foros de Debate
DROP TABLE IF EXISTS public.lms_forum_posts CASCADE;
DROP TABLE IF EXISTS public.lms_forums CASCADE;

CREATE TABLE public.lms_forums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_locked BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.lms_forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_id UUID NOT NULL REFERENCES public.lms_forums(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.lms_forum_posts(id) ON DELETE CASCADE, -- Para respuestas anidadas
    author_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Gamificación (Insignias)
CREATE TABLE IF NOT EXISTS public.lms_gamification_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.lms_courses(id) ON DELETE CASCADE, -- Puede ser NULL si es global
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    xp_reward INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lms_user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.lms_gamification_badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Notificaciones In-App
CREATE TABLE IF NOT EXISTS public.lms_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    link TEXT, -- URL a donde redirigir al hacer clic
    is_read BOOLEAN DEFAULT false,
    type TEXT DEFAULT 'info', -- info, success, warning, etc.
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.lms_forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_gamification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_notifications ENABLE ROW LEVEL SECURITY;

-- Forums (Lectura pública para inscritos, escritura para inscritos)
DROP POLICY IF EXISTS "Enrolled users can read forums" ON public.lms_forums;
CREATE POLICY "Enrolled users can read forums" ON public.lms_forums FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM lms_enrollments WHERE course_id = lms_forums.course_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor', 'pastor'))
);

DROP POLICY IF EXISTS "Teachers and Admins can create forums" ON public.lms_forums;
CREATE POLICY "Teachers and Admins can create forums" ON public.lms_forums FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM lms_enrollments WHERE course_id = lms_forums.course_id AND user_id = auth.uid() AND role = 'teacher') OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor', 'pastor'))
) WITH CHECK (true);

-- Posts
DROP POLICY IF EXISTS "Enrolled can read posts" ON public.lms_forum_posts;
CREATE POLICY "Enrolled can read posts" ON public.lms_forum_posts FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM lms_forums f JOIN lms_enrollments e ON f.course_id = e.course_id WHERE f.id = lms_forum_posts.forum_id AND e.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor', 'pastor'))
);

DROP POLICY IF EXISTS "Enrolled can write posts" ON public.lms_forum_posts;
CREATE POLICY "Enrolled can write posts" ON public.lms_forum_posts FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM lms_forums f JOIN lms_enrollments e ON f.course_id = e.course_id WHERE f.id = forum_id AND e.user_id = auth.uid())
);

-- Notifications (Cada usuario lee/modifica las suyas)
DROP POLICY IF EXISTS "Users can read own notifications" ON public.lms_notifications;
CREATE POLICY "Users can read own notifications" ON public.lms_notifications FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.lms_notifications;
CREATE POLICY "Users can update own notifications" ON public.lms_notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Badges
DROP POLICY IF EXISTS "Public read badges" ON public.lms_gamification_badges;
CREATE POLICY "Public read badges" ON public.lms_gamification_badges FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users read own badges" ON public.lms_user_badges;
CREATE POLICY "Users read own badges" ON public.lms_user_badges FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor', 'pastor')));
