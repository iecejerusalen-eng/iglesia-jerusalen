ALTER TABLE public.lms_courses
  ADD COLUMN IF NOT EXISTS period_id uuid REFERENCES public.lms_academic_periods(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS lms_courses_school_period_idx
  ON public.lms_courses (school_id, period_id, is_published);
