-- Create Question Categories
CREATE TABLE IF NOT EXISTS public.lms_question_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Questions Table
CREATE TABLE IF NOT EXISTS public.lms_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.lms_question_categories(id) ON DELETE SET NULL,
    course_id UUID REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'essay')),
    content TEXT NOT NULL,
    options JSONB, -- Array of objects for multiple choice: [{ id, text }]
    correct_answer JSONB, -- string for essay, boolean for true_false, option_id for multiple_choice
    points NUMERIC(5,2) DEFAULT 1.0,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Map Questions to specific Quizzes (Lessons of type 'quiz')
CREATE TABLE IF NOT EXISTS public.lms_quiz_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES public.lms_lessons(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.lms_questions(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Quiz Attempts by Students
CREATE TABLE IF NOT EXISTS public.lms_quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES public.lms_lessons(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES public.lms_enrollments(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'graded')),
    score NUMERIC(5,2),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(lesson_id, student_id)
);

-- Quiz Answers by Students
CREATE TABLE IF NOT EXISTS public.lms_quiz_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID REFERENCES public.lms_quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.lms_questions(id) ON DELETE CASCADE,
    answer_data JSONB, -- The student's answer (string, bool, or option_id)
    is_correct BOOLEAN,
    points_awarded NUMERIC(5,2) DEFAULT 0,
    teacher_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(attempt_id, question_id)
);

-- RLS Policies

ALTER TABLE public.lms_question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_quiz_answers ENABLE ROW LEVEL SECURITY;

-- Categories
DROP POLICY IF EXISTS "Teachers can manage categories" ON public.lms_question_categories;
CREATE POLICY "Teachers can manage categories" ON public.lms_question_categories
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.lms_course_teachers ct
            WHERE ct.course_id = lms_question_categories.course_id
            AND ct.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'pastor')
        )
    );

DROP POLICY IF EXISTS "Students can read categories" ON public.lms_question_categories;
CREATE POLICY "Students can read categories" ON public.lms_question_categories
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.lms_enrollments e
            WHERE e.course_id = lms_question_categories.course_id
            AND e.user_id = auth.uid()
            AND e.status = 'active'
        )
    );

-- Questions
DROP POLICY IF EXISTS "Teachers can manage questions" ON public.lms_questions;
CREATE POLICY "Teachers can manage questions" ON public.lms_questions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.lms_course_teachers ct
            WHERE ct.course_id = lms_questions.course_id
            AND ct.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'pastor')
        )
    );

DROP POLICY IF EXISTS "Students can read questions if in quiz" ON public.lms_questions;
CREATE POLICY "Students can read questions if in quiz" ON public.lms_questions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.lms_quiz_questions qq
            JOIN public.lms_lessons l ON l.id = qq.lesson_id
            JOIN public.lms_modules m ON m.id = l.module_id
            JOIN public.lms_subjects s ON s.id = m.subject_id
            JOIN public.lms_enrollments e ON e.course_id = s.course_id
            WHERE qq.question_id = lms_questions.id
            AND e.user_id = auth.uid()
            AND e.status = 'active'
        )
    );

-- Quiz Questions (Mapping)
DROP POLICY IF EXISTS "Teachers can manage quiz questions" ON public.lms_quiz_questions;
CREATE POLICY "Teachers can manage quiz questions" ON public.lms_quiz_questions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.lms_lessons l
            JOIN public.lms_modules m ON m.id = l.module_id
            JOIN public.lms_subjects s ON s.id = m.subject_id
            JOIN public.lms_course_teachers ct ON ct.course_id = s.course_id
            WHERE l.id = lms_quiz_questions.lesson_id
            AND ct.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'pastor')
        )
    );

DROP POLICY IF EXISTS "Students can read quiz questions" ON public.lms_quiz_questions;
CREATE POLICY "Students can read quiz questions" ON public.lms_quiz_questions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.lms_lessons l
            JOIN public.lms_modules m ON m.id = l.module_id
            JOIN public.lms_subjects s ON s.id = m.subject_id
            JOIN public.lms_enrollments e ON e.course_id = s.course_id
            WHERE l.id = lms_quiz_questions.lesson_id
            AND e.user_id = auth.uid()
            AND e.status = 'active'
        )
    );

-- Attempts
DROP POLICY IF EXISTS "Teachers can read all attempts" ON public.lms_quiz_attempts;
CREATE POLICY "Teachers can read all attempts" ON public.lms_quiz_attempts
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.lms_lessons l
            JOIN public.lms_modules m ON m.id = l.module_id
            JOIN public.lms_subjects s ON s.id = m.subject_id
            JOIN public.lms_course_teachers ct ON ct.course_id = s.course_id
            WHERE l.id = lms_quiz_attempts.lesson_id
            AND ct.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'pastor')
        )
    );
    
DROP POLICY IF EXISTS "Teachers can update attempts (grade)" ON public.lms_quiz_attempts;
CREATE POLICY "Teachers can update attempts (grade)" ON public.lms_quiz_attempts
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.lms_lessons l
            JOIN public.lms_modules m ON m.id = l.module_id
            JOIN public.lms_subjects s ON s.id = m.subject_id
            JOIN public.lms_course_teachers ct ON ct.course_id = s.course_id
            WHERE l.id = lms_quiz_attempts.lesson_id
            AND ct.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'pastor')
        )
    );

DROP POLICY IF EXISTS "Students can manage own attempts" ON public.lms_quiz_attempts;
CREATE POLICY "Students can manage own attempts" ON public.lms_quiz_attempts
    FOR ALL TO authenticated
    USING (
        student_id = auth.uid()
    );

-- Answers
DROP POLICY IF EXISTS "Teachers can read all answers" ON public.lms_quiz_answers;
CREATE POLICY "Teachers can read all answers" ON public.lms_quiz_answers
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.lms_quiz_attempts qa
            JOIN public.lms_lessons l ON l.id = qa.lesson_id
            JOIN public.lms_modules m ON m.id = l.module_id
            JOIN public.lms_subjects s ON s.id = m.subject_id
            JOIN public.lms_course_teachers ct ON ct.course_id = s.course_id
            WHERE qa.id = lms_quiz_answers.attempt_id
            AND ct.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'pastor')
        )
    );
    
DROP POLICY IF EXISTS "Teachers can update answers (grade essay)" ON public.lms_quiz_answers;
CREATE POLICY "Teachers can update answers (grade essay)" ON public.lms_quiz_answers
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.lms_quiz_attempts qa
            JOIN public.lms_lessons l ON l.id = qa.lesson_id
            JOIN public.lms_modules m ON m.id = l.module_id
            JOIN public.lms_subjects s ON s.id = m.subject_id
            JOIN public.lms_course_teachers ct ON ct.course_id = s.course_id
            WHERE qa.id = lms_quiz_answers.attempt_id
            AND ct.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'pastor')
        )
    );

DROP POLICY IF EXISTS "Students can manage own answers" ON public.lms_quiz_answers;
CREATE POLICY "Students can manage own answers" ON public.lms_quiz_answers
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.lms_quiz_attempts
            WHERE id = lms_quiz_answers.attempt_id
            AND student_id = auth.uid()
        )
    );

-- View for easy quiz grading/reporting
CREATE OR REPLACE VIEW public.lms_quiz_results_view WITH (security_invoker = true) AS
SELECT 
    qa.id as attempt_id,
    qa.lesson_id,
    l.title as lesson_title,
    qa.student_id,
    p.first_name,
    p.last_name,
    qa.status,
    qa.score,
    qa.started_at,
    qa.completed_at
FROM public.lms_quiz_attempts qa
JOIN public.lms_lessons l ON l.id = qa.lesson_id
JOIN public.profiles p ON p.id = qa.student_id;
