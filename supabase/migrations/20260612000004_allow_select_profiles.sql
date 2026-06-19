-- Migration: Add SELECT policy for profiles table to allow authenticated users to view profiles
DROP POLICY IF EXISTS "Permitir lectura de perfiles a autenticados" ON public.profiles;
CREATE POLICY "Permitir lectura de perfiles a autenticados" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);
