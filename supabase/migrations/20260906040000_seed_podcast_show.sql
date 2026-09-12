-- Inicializa la configuración editorial del podcast sin crear episodios ficticios.
INSERT INTO public.podcast_show (name, description, author, language, itunes_category, itunes_subcategory, is_active)
SELECT
  'Voces de Jerusalén',
  'Podcast oficial de la Iglesia Jerusalén. Reflexiones, devocionales y sermones semanales.',
  'Iglesia Jerusalén',
  'es',
  'Religion & Spirituality',
  'Christianity',
  true
WHERE NOT EXISTS (SELECT 1 FROM public.podcast_show);
