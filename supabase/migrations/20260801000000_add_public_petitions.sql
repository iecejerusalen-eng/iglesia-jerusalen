-- Agregar columnas para muro público en peticiones
ALTER TABLE public.petitions 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prayer_count INTEGER DEFAULT 0;

-- Crear tabla para rastrear quién ha orado por qué petición (para evitar múltiples clics del mismo usuario)
CREATE TABLE IF NOT EXISTS public.petition_prayers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    petition_id UUID REFERENCES public.petitions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(petition_id, user_id)
);

-- Políticas RLS para petition_prayers
ALTER TABLE public.petition_prayers ENABLE ROW LEVEL SECURITY;

-- Drop existings to avoid conflicts just in case
DROP POLICY IF EXISTS "Cualquiera puede ver intercesores" ON public.petition_prayers;
DROP POLICY IF EXISTS "Usuarios autenticados pueden orar" ON public.petition_prayers;
DROP POLICY IF EXISTS "Usuarios autenticados pueden dejar de orar" ON public.petition_prayers;
DROP POLICY IF EXISTS "Cualquiera puede ver peticiones publicas" ON public.petitions;

CREATE POLICY "Cualquiera puede ver intercesores" ON public.petition_prayers
    FOR SELECT USING (true);

CREATE POLICY "Usuarios autenticados pueden orar" ON public.petition_prayers
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios autenticados pueden dejar de orar" ON public.petition_prayers
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Actualizar políticas de peticiones para permitir lectura si is_public = true
CREATE POLICY "Cualquiera puede ver peticiones publicas" ON public.petitions
    FOR SELECT USING (is_public = true);

-- Función y Trigger para mantener actualizado el prayer_count
CREATE OR REPLACE FUNCTION increment_prayer_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.petitions
    SET prayer_count = prayer_count + 1
    WHERE id = NEW.petition_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_prayer_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.petitions
    SET prayer_count = GREATEST(prayer_count - 1, 0)
    WHERE id = OLD.petition_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_prayer_count_trigger ON public.petition_prayers;
CREATE TRIGGER increment_prayer_count_trigger
    AFTER INSERT ON public.petition_prayers
    FOR EACH ROW
    EXECUTE FUNCTION increment_prayer_count();

DROP TRIGGER IF EXISTS decrement_prayer_count_trigger ON public.petition_prayers;
CREATE TRIGGER decrement_prayer_count_trigger
    AFTER DELETE ON public.petition_prayers
    FOR EACH ROW
    EXECUTE FUNCTION decrement_prayer_count();
