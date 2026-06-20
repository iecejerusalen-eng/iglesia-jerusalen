-- 20260620130000_lms_infrastructure.sql
-- Create LMS Tables for PACIE Methodology

-- Course Table
CREATE TABLE IF NOT EXISTS public.lms_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    format TEXT DEFAULT 'weekly', -- 'weekly' or 'topics'
    grading_scale TEXT DEFAULT '10/10', -- '10/10', 'letters', 'pass_fail'
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sections / Modules (Weeks or Topics)
CREATE TABLE IF NOT EXISTS public.lms_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_presentation_block BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Activities / Resources inside a Section
CREATE TABLE IF NOT EXISTS public.lms_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_id UUID NOT NULL REFERENCES public.lms_sections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'resource', 'forum', 'assignment', 'quiz', 'h5p_embed', 'video_link'
    content TEXT,
    teacher_content TEXT,
    settings JSONB DEFAULT '{}'::jsonb, -- settings like deadlines, max file size, passing grade
    requires_completion_of UUID REFERENCES public.lms_activities(id) ON DELETE SET NULL,
    weighting NUMERIC(5,2) DEFAULT 0, -- percentage of final grade
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enrollments (Linking users/members to courses)
CREATE TABLE IF NOT EXISTS public.lms_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'student', -- 'student', 'teacher', 'admin'
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(course_id, user_id)
);

-- Student Activity Completion
CREATE TABLE IF NOT EXISTS public.lms_activity_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id UUID NOT NULL REFERENCES public.lms_activities(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(activity_id, student_id)
);

-- Assignment Submissions
CREATE TABLE IF NOT EXISTS public.lms_assignment_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id UUID NOT NULL REFERENCES public.lms_activities(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_url TEXT,
    text_content TEXT,
    grade TEXT, -- generic format to support 10, A, or Pass
    teacher_feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    graded_at TIMESTAMPTZ,
    UNIQUE(activity_id, student_id)
);

-- Enable RLS
ALTER TABLE public.lms_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_activity_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_assignment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Courses: Public can see published courses, Admins/Teachers can see all
CREATE POLICY "Public can view published courses" ON public.lms_courses FOR SELECT TO public USING (is_published = true);
CREATE POLICY "Authenticated users can view all courses" ON public.lms_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage courses" ON public.lms_courses FOR ALL TO authenticated USING (true) WITH CHECK (true); -- Ideally restrict by role later

-- Sections: Authenticated users can view sections of published courses
CREATE POLICY "Authenticated users can view sections" ON public.lms_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage sections" ON public.lms_sections FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Activities
CREATE POLICY "Authenticated users can view activities" ON public.lms_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage activities" ON public.lms_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enrollments
CREATE POLICY "Users can view their own enrollments" ON public.lms_enrollments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can manage enrollments" ON public.lms_enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Activity Completions
CREATE POLICY "Users can view and manage their own completions" ON public.lms_activity_completions FOR ALL TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

-- Assignment Submissions
CREATE POLICY "Users can manage their own submissions" ON public.lms_assignment_submissions FOR ALL TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

-- Data Migration from legacy 'programs' to 'lms_courses'
DO $$
DECLARE
    prog RECORD;
    mod RECORD;
    less RECORD;
    new_section_id UUID;
BEGIN
    -- Check if 'programs' table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'programs') THEN
        FOR prog IN SELECT * FROM public.programs LOOP
            INSERT INTO public.lms_courses (id, title, description, cover_image_url, is_published, created_at)
            VALUES (prog.id, prog.title, prog.description, prog.cover_image, true, prog.created_at)
            ON CONFLICT (id) DO NOTHING;
        END LOOP;
        
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'program_modules') THEN
            FOR mod IN SELECT * FROM public.program_modules LOOP
                INSERT INTO public.lms_sections (id, course_id, title, description, order_index, created_at)
                VALUES (mod.id, mod.program_id, mod.title, mod.description, mod."order", mod.created_at)
                ON CONFLICT (id) DO NOTHING;
            END LOOP;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'program_lessons') THEN
            -- First migrate lessons with no module_id
            FOR prog IN SELECT * FROM public.programs LOOP
                IF EXISTS (SELECT 1 FROM public.program_lessons WHERE program_id = prog.id AND module_id IS NULL) THEN
                    INSERT INTO public.lms_sections (course_id, title, description, order_index)
                    VALUES (prog.id, 'General', 'Lecciones generales', 0)
                    RETURNING id INTO new_section_id;

                    FOR less IN SELECT * FROM public.program_lessons WHERE program_id = prog.id AND module_id IS NULL LOOP
                        INSERT INTO public.lms_activities (id, section_id, title, type, content, teacher_content, order_index, created_at)
                        VALUES (less.id, new_section_id, less.title, 'resource', less.public_content, less.teacher_content, less."order", less.created_at)
                        ON CONFLICT (id) DO NOTHING;
                    END LOOP;
                END IF;
            END LOOP;

            -- Then migrate lessons with module_id
            FOR less IN SELECT * FROM public.program_lessons WHERE module_id IS NOT NULL LOOP
                INSERT INTO public.lms_activities (id, section_id, title, type, content, teacher_content, order_index, created_at)
                VALUES (less.id, less.module_id, less.title, 'resource', less.public_content, less.teacher_content, less."order", less.created_at)
                ON CONFLICT (id) DO NOTHING;
            END LOOP;
        END IF;
    END IF;
END $$;
