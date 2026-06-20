-- Drop existing constraint referencing auth.users
ALTER TABLE public.ministry_meeting_notes DROP CONSTRAINT IF EXISTS ministry_meeting_notes_created_by_fkey;

-- Add new constraint referencing public.profiles
ALTER TABLE public.ministry_meeting_notes 
  ADD CONSTRAINT ministry_meeting_notes_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
