-- Migration para crear el catálogo de pastores/oradores (speakers)
CREATE TABLE IF NOT EXISTS public.speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Pastor',
  photo_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;

-- Políticas para speakers
CREATE POLICY "Permitir lectura de speakers a todos"
ON public.speakers FOR SELECT
TO public
USING (true);

CREATE POLICY "Permitir inserción de speakers a admins"
ON public.speakers FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'maestro'
);

CREATE POLICY "Permitir actualización de speakers a admins"
ON public.speakers FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'maestro'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'maestro'
);

CREATE POLICY "Permitir eliminación de speakers a admins"
ON public.speakers FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Agregar columna speaker_id a sermons
ALTER TABLE public.sermons ADD COLUMN IF NOT EXISTS speaker_id UUID REFERENCES public.speakers(id) ON DELETE SET NULL;
