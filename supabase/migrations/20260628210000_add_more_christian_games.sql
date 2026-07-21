-- Create hangman words table
CREATE TABLE IF NOT EXISTS public.game_hangman_words (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    word VARCHAR(100) NOT NULL,
    hint TEXT,
    category VARCHAR(50) DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create memory cards table
CREATE TABLE IF NOT EXISTS public.game_memory_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pair_name VARCHAR(100) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add hangman scores if we want to track
CREATE TABLE IF NOT EXISTS public.game_hangman_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    words_guessed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add memory scores
CREATE TABLE IF NOT EXISTS public.game_memory_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    time_seconds INTEGER NOT NULL DEFAULT 0,
    moves INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.game_hangman_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_memory_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_hangman_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_memory_scores ENABLE ROW LEVEL SECURITY;

-- Hangman Words Policies
CREATE POLICY "Public can view hangman words" ON public.game_hangman_words
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage hangman words" ON public.game_hangman_words
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'maestro')
        )
    );

-- Memory Cards Policies
CREATE POLICY "Public can view memory cards" ON public.game_memory_cards
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage memory cards" ON public.game_memory_cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'maestro')
        )
    );

-- Hangman Scores Policies
CREATE POLICY "Public can view hangman scores" ON public.game_hangman_scores
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own hangman scores" ON public.game_hangman_scores
    FOR INSERT WITH CHECK (profile_id = (select auth.uid()));

-- Memory Scores Policies
CREATE POLICY "Public can view memory scores" ON public.game_memory_scores
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own memory scores" ON public.game_memory_scores
    FOR INSERT WITH CHECK (profile_id = (select auth.uid()));

-- Insert some default words
INSERT INTO public.game_hangman_words (word, hint, category) VALUES
('JERUSALEN', 'La ciudad santa', 'Ciudad'),
('DAVID', 'Rey que derrotó a Goliat', 'Personaje'),
('APOCALIPSIS', 'Último libro de la Biblia', 'Libro'),
('MOISES', 'Abrió el mar Rojo', 'Personaje'),
('GENESIS', 'Libro de los comienzos', 'Libro'),
('MATEO', 'Primer libro del Nuevo Testamento', 'Libro'),
('SANSÓN', 'Tenía fuerza en su cabello', 'Personaje'),
('GÓLGOTA', 'Lugar de la calavera', 'Lugar'),
('PENTECOSTÉS', 'Derramamiento del Espíritu Santo', 'Evento')
ON CONFLICT DO NOTHING;

-- Insert some default memory cards (pairs)
INSERT INTO public.game_memory_cards (pair_name) VALUES
('Arca de Noé'),
('Cruz de Jesús'),
('Tablas de la Ley'),
('Paloma (Espíritu Santo)'),
('León de Judá'),
('Pez (Ichthys)'),
('Corona de Espinas'),
('Estrella de Belén')
ON CONFLICT DO NOTHING;
