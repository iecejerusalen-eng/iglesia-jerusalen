-- Vistas públicas limitadas para contenido aprobado por la iglesia.
-- No se exponen borradores, aprobadores ni URLs internas de distribución.

DROP POLICY IF EXISTS "boletines_public_read_approved" ON public.boletines;
CREATE POLICY "boletines_public_read_approved"
  ON public.boletines FOR SELECT TO anon, authenticated
  USING (estado IN ('aprobado', 'enviado'));

CREATE OR REPLACE VIEW public.boletines_publicos
  WITH (security_invoker = true)
AS
SELECT id, fecha_culto, titulo_mensaje, expositor, versiculo_texto,
       versiculo_referencia, eventos, anuncio_titulo, anuncio_descripcion,
       cumpleaneros, mensaje_pastoral, foto_pastor, estado
FROM public.boletines
WHERE estado IN ('aprobado', 'enviado');

GRANT SELECT ON public.boletines_publicos TO anon, authenticated;
