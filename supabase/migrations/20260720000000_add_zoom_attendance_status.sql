-- Add 'zoom' status to lms_attendance
ALTER TABLE public.lms_attendance DROP CONSTRAINT IF EXISTS lms_attendance_status_check;
ALTER TABLE public.lms_attendance ADD CONSTRAINT lms_attendance_status_check CHECK (status IN ('present', 'zoom', 'absent', 'late', 'excused'));
