-- Migration: Add member_id column to profiles table referencing public.members
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES public.members(id) ON DELETE SET NULL;
