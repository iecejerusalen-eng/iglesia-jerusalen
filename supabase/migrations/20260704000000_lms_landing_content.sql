-- Create lms_landing_content table
CREATE TABLE IF NOT EXISTS public.lms_landing_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    section_key VARCHAR(255) NOT NULL UNIQUE,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.lms_landing_content ENABLE ROW LEVEL SECURITY;

-- Policy: Public read
DROP POLICY IF EXISTS "Public read lms_landing_content" ON public.lms_landing_content;
CREATE POLICY "Public read lms_landing_content" ON public.lms_landing_content FOR SELECT TO public USING (is_active = true);

-- Policy: Admin manage
DROP POLICY IF EXISTS "Admin manage lms_landing_content" ON public.lms_landing_content;
CREATE POLICY "Admin manage lms_landing_content" ON public.lms_landing_content FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      'admin' = ANY(profiles.roles) OR
      'pastor' = ANY(profiles.roles) OR
      'leader' = ANY(profiles.roles)
    )
  )
);

-- Setup updated_at trigger
DROP TRIGGER IF EXISTS handle_lms_landing_content_updated_at ON public.lms_landing_content;
CREATE TRIGGER handle_lms_landing_content_updated_at
    BEFORE UPDATE ON public.lms_landing_content
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert initial default data
INSERT INTO public.lms_landing_content (section_key, content)
VALUES 
(
  'hero',
  '{
    "title": "Aula Virtual",
    "subtitle": "Ecosistema Educativo LMS",
    "description": "Plataforma de formación teológica y crecimiento espiritual. Accede a tus cursos, interactúa con docentes y realiza un seguimiento a tu aprendizaje."
  }'::jsonb
),
(
  'features',
  '{
    "items": [
      {
        "title": "Cursos Bíblicos",
        "description": "Explora estudios profundos para tu crecimiento."
      },
      {
        "title": "Acompañamiento",
        "description": "Docentes y tutores listos para guiar tu proceso."
      },
      {
        "title": "Comunidad",
        "description": "Aprende junto a otros miembros de la iglesia."
      }
    ]
  }'::jsonb
)
ON CONFLICT (section_key) DO NOTHING;
