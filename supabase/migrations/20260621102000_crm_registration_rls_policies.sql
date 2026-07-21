-- Migration: Add self-registration RLS policies for members and member_emails
-- Drop policies if they exist to allow clean replay
DROP POLICY IF EXISTS "Permitir auto-registro de miembros" ON public.members;
DROP POLICY IF EXISTS "Permitir auto-actualización de miembro propio" ON public.members;
DROP POLICY IF EXISTS "Permitir auto-gestión de emails propios" ON public.member_emails;

-- 1. Allow authenticated users without an assigned member_id to insert a new member row
CREATE POLICY "Permitir auto-registro de miembros" ON public.members FOR INSERT TO authenticated
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and member_id is null
    )
  );

-- 2. Allow users to update their own member row (e.g. phone or photo updates during onboarding)
CREATE POLICY "Permitir auto-actualización de miembro propio" ON public.members FOR UPDATE TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and member_id = public.members.id
    )
  )
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and member_id = public.members.id
    )
  );

-- 3. Allow users to manage (insert/update/delete) member_emails for their own member row
CREATE POLICY "Permitir auto-gestión de emails propios" ON public.member_emails FOR ALL TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and member_id = public.member_emails.member_id
    )
  )
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and member_id = public.member_emails.member_id
    )
  );
