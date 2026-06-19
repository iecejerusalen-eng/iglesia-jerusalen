-- migration_ministry_management

-- Add is_public to events if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='events' AND column_name='is_public') THEN
      ALTER TABLE public.events ADD COLUMN is_public BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Table: ministry_members
CREATE TABLE IF NOT EXISTS public.ministry_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role VARCHAR(100) DEFAULT 'Miembro',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ministry_id, member_id)
);

-- Table: member_availabilities
CREATE TABLE IF NOT EXISTS public.member_availabilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: ministry_meeting_notes
CREATE TABLE IF NOT EXISTS public.ministry_meeting_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS
ALTER TABLE public.ministry_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_meeting_notes ENABLE ROW LEVEL SECURITY;

-- Ministry Members Policies
CREATE POLICY "Enable read access for all authenticated users to ministry_members"
ON public.ministry_members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable write access for all authenticated users to ministry_members"
ON public.ministry_members FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Member Availabilities Policies
CREATE POLICY "Enable read access for all authenticated users to member_availabilities"
ON public.member_availabilities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable write access for all authenticated users to member_availabilities"
ON public.member_availabilities FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Meeting Notes Policies
CREATE POLICY "Enable read access for all authenticated users to ministry_meeting_notes"
ON public.ministry_meeting_notes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable write access for all authenticated users to ministry_meeting_notes"
ON public.ministry_meeting_notes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
