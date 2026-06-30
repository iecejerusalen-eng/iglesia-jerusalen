-- 1. Añadir campo de imagen a las preguntas
ALTER TABLE public.game_biblionario_questions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Crear bucket para las imágenes si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('game_assets', 'game_assets', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de seguridad para el bucket game_assets
-- Permitir lectura pública a todos
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'game_assets');

-- Permitir subir archivos solo a usuarios autenticados
CREATE POLICY "Admin Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'game_assets' AND 
  auth.role() = 'authenticated'
);

-- Permitir actualizar y borrar a administradores
CREATE POLICY "Admin Update Access" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'game_assets' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Admin Delete Access" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'game_assets' AND 
  auth.role() = 'authenticated'
);
