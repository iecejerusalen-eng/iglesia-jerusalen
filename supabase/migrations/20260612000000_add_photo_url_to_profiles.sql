-- Migration: Add photo_url column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url text;

-- Policy to allow users to update their own profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Permitir a usuarios actualizar su propio perfil'
  ) THEN
    CREATE POLICY "Permitir a usuarios actualizar su propio perfil" 
      ON public.profiles FOR UPDATE 
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;
