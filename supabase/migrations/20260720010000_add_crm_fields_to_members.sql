-- Add new CRM fields to members table
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS birth_place TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS has_disability BOOLEAN DEFAULT false;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS disability_types TEXT[] DEFAULT '{}';
