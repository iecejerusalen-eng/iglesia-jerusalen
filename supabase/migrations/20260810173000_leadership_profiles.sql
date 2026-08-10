-- Perfiles públicos de liderazgo: amplía el catálogo CRM de speakers sin duplicar personas.
ALTER TABLE public.speakers
  ADD COLUMN IF NOT EXISTS leadership_roles TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS speakers_public_order_idx
  ON public.speakers (display_order, created_at)
  WHERE is_public = true;

COMMENT ON COLUMN public.speakers.leadership_roles IS 'Roles o ministerios adicionales que se muestran en Nosotros.';
COMMENT ON COLUMN public.speakers.is_public IS 'Controla si el perfil aparece en la página pública Nosotros.';
COMMENT ON COLUMN public.speakers.display_order IS 'Orden ascendente de presentación en liderazgo.';
