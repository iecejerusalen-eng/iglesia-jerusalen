-- Migration: Add updated_at and versioning to support conflict resolution in members, schedules, and sermon_notes

-- 1. Add columns to members table
ALTER TABLE public.members 
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1 NOT NULL;

-- 2. Add columns to schedules table
ALTER TABLE public.schedules 
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1 NOT NULL;

-- 3. Add columns to sermon_notes table
ALTER TABLE public.sermon_notes 
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1 NOT NULL;

-- 4. Create trigger function to auto-increment version and update updated_at timestamp
CREATE OR REPLACE FUNCTION public.increment_version_and_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment version only if the record is updated
  NEW.version = OLD.version + 1;
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create triggers on members table
DROP TRIGGER IF EXISTS tr_members_increment_version_and_updated_at ON public.members;
CREATE TRIGGER tr_members_increment_version_and_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_version_and_updated_at();

-- 6. Create triggers on schedules table
DROP TRIGGER IF EXISTS tr_schedules_increment_version_and_updated_at ON public.schedules;
CREATE TRIGGER tr_schedules_increment_version_and_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_version_and_updated_at();

-- 7. Create triggers on sermon_notes table
DROP TRIGGER IF EXISTS tr_sermon_notes_increment_version_and_updated_at ON public.sermon_notes;
CREATE TRIGGER tr_sermon_notes_increment_version_and_updated_at
  BEFORE UPDATE ON public.sermon_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_version_and_updated_at();
