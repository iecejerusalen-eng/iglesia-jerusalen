-- Migration 20260810235000_fix_spaces_and_media_vault_rls.sql
-- Fix 403 errors on spaces, space_bookings, and consolidated policies, and create media_vault_files table.

-- 1. Create media_vault_files table if not exists
CREATE TABLE IF NOT EXISTS public.media_vault_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  mimetype TEXT,
  size BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.media_vault_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_vault_read" ON public.media_vault_files;
CREATE POLICY "media_vault_read" ON public.media_vault_files 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "media_vault_manage_insert" ON public.media_vault_files;
CREATE POLICY "media_vault_manage_insert" ON public.media_vault_files 
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
        AND role IN ('admin', 'pastor', 'leader', 'multimedia')
    )
  );

DROP POLICY IF EXISTS "media_vault_manage_delete" ON public.media_vault_files;
CREATE POLICY "media_vault_manage_delete" ON public.media_vault_files 
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
        AND role IN ('admin', 'pastor', 'leader', 'multimedia')
    )
  );

-- 2. Fix RLS policies on spaces
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.spaces;
CREATE POLICY "Consolidated manage access insert" ON public.spaces 
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
        AND role IN ('admin', 'pastor', 'leader')
    )
  );

DROP POLICY IF EXISTS "Consolidated manage access update" ON public.spaces;
CREATE POLICY "Consolidated manage access update" ON public.spaces 
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
        AND role IN ('admin', 'pastor', 'leader')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
        AND role IN ('admin', 'pastor', 'leader')
    )
  );

DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.spaces;
CREATE POLICY "Consolidated manage access delete" ON public.spaces 
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
        AND role IN ('admin', 'pastor', 'leader')
    )
  );

-- 3. Fix RLS policies on space_bookings
DROP POLICY IF EXISTS "bookings_read" ON public.space_bookings;
CREATE POLICY "bookings_read" ON public.space_bookings 
  FOR SELECT USING (
    (select auth.uid()) = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
        AND role IN ('admin', 'pastor', 'secretary', 'leader')
    )
  );

DROP POLICY IF EXISTS "bookings_insert" ON public.space_bookings;
CREATE POLICY "bookings_insert" ON public.space_bookings 
  FOR INSERT WITH CHECK (
    (select auth.role()) = 'authenticated' AND (select auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "bookings_update" ON public.space_bookings;
CREATE POLICY "bookings_update" ON public.space_bookings 
  FOR UPDATE USING (
    (select auth.uid()) = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
        AND role IN ('admin', 'pastor', 'secretary', 'leader')
    )
  );

DROP POLICY IF EXISTS "bookings_delete" ON public.space_bookings;
CREATE POLICY "bookings_delete" ON public.space_bookings 
  FOR DELETE USING (
    (select auth.uid()) = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
        AND role IN ('admin', 'pastor', 'secretary', 'leader')
    )
  );

-- 4. Fix RLS policies on songs, song_types, song_styles
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.songs;
CREATE POLICY "Consolidated manage access insert" ON public.songs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'leader')));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.songs;
CREATE POLICY "Consolidated manage access update" ON public.songs FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'leader'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'leader')));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.songs;
CREATE POLICY "Consolidated manage access delete" ON public.songs FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'leader')));

DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.song_types;
CREATE POLICY "Consolidated manage access insert" ON public.song_types FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'leader')));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.song_types;
CREATE POLICY "Consolidated manage access update" ON public.song_types FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'leader'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'leader')));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.song_types;
CREATE POLICY "Consolidated manage access delete" ON public.song_types FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'leader')));

DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.song_styles;
CREATE POLICY "Consolidated manage access insert" ON public.song_styles FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'leader')));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.song_styles;
CREATE POLICY "Consolidated manage access update" ON public.song_styles FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'leader'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'leader')));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.song_styles;
CREATE POLICY "Consolidated manage access delete" ON public.song_styles FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'pastor', 'leader')));
