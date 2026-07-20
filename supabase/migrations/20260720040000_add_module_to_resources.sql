ALTER TABLE public.lms_course_resources 
ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.lms_modules(id) ON DELETE CASCADE;
