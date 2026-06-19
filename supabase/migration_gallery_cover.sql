-- =======================================================
-- SQL MIGRATION: ADICIÓN DE IMAGEN DE PORTADA Y GALERÍA DE IMÁGENES
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Agregar columna cover_image_url a la tabla page_contents para la portada personalizada
ALTER TABLE public.page_contents ADD COLUMN IF NOT EXISTS cover_image_url text;

-- 2. Insertar sección por defecto para la Galería de Imágenes en la página de Inicio (Home)
-- Se posiciona con order_index = 55 (entre últimas prédicas y cumpleaños)
INSERT INTO public.page_contents (id, page, section, name, order_index, section_type, title, subtitle, content_blocks)
VALUES (
  'home_gallery', 
  'home', 
  'gallery', 
  'Galería de Imágenes', 
  55, 
  'system_gallery', 
  'Nuestra Comunidad en Imágenes', 
  'Momentos especiales de adoración, comunión y servicio en la Iglesia Jerusalén.',
  '[
    {"id": "slide_1", "url": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1200", "caption": "Alabanza y adoración congregacional"},
    {"id": "slide_2", "url": "https://images.unsplash.com/photo-1489641499538-be02c255c552?auto=format&fit=crop&q=80&w=1200", "caption": "Tiempo de enseñanza de la palabra de Dios"},
    {"id": "slide_3", "url": "https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&q=80&w=1200", "caption": "Comunión fraternal de los miembros"}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  section_type = EXCLUDED.section_type,
  order_index = EXCLUDED.order_index,
  content_blocks = COALESCE(public.page_contents.content_blocks, EXCLUDED.content_blocks);
