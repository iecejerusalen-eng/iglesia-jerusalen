ALTER TABLE public.game_memory_cards
  ADD COLUMN IF NOT EXISTS match_text text,
  ADD COLUMN IF NOT EXISTS explanation text,
  ADD COLUMN IF NOT EXISTS bible_reference text,
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'easy',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'game_memory_cards_difficulty_check'
      AND conrelid = 'public.game_memory_cards'::regclass
  ) THEN
    ALTER TABLE public.game_memory_cards
      ADD CONSTRAINT game_memory_cards_difficulty_check
      CHECK (difficulty IN ('easy', 'medium', 'hard'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'game_memory_cards_match_text_length_check'
      AND conrelid = 'public.game_memory_cards'::regclass
  ) THEN
    ALTER TABLE public.game_memory_cards
      ADD CONSTRAINT game_memory_cards_match_text_length_check
      CHECK (match_text IS NULL OR char_length(match_text) <= 220);
  END IF;
END $$;

WITH seed(pair_name, match_text, explanation, bible_reference, difficulty) AS (
  VALUES
    ('Arca de Noé', 'Noé construyó un arca', 'Dios indicó a Noé que preparara un arca para preservar a su familia y a los animales.', 'Génesis 6:14-22', 'easy'),
    ('Tablas de la Ley', 'Moisés recibió tablas de piedra', 'Moisés recibió las tablas del testimonio escritas por Dios.', 'Éxodo 31:18', 'easy'),
    ('Paloma (Espíritu Santo)', 'El Espíritu descendió como paloma', 'Al ser bautizado Jesús, el Espíritu de Dios descendió como paloma.', 'Mateo 3:16-17', 'easy'),
    ('Estrella de Belén', 'Los sabios siguieron una estrella', 'Los sabios vieron la estrella y viajaron para buscar al rey de los judíos.', 'Mateo 2:1-2, 9-11', 'easy'),
    ('Cruz de Jesús', 'Jesús fue crucificado y resucitó', 'Los Evangelios relatan la crucifixión de Jesús y el anuncio de su resurrección.', 'Lucas 23:33; 24:5-7', 'medium'),
    ('Corona de Espinas', 'Los soldados pusieron una corona a Jesús', 'Los soldados pusieron una corona de espinas sobre Jesús antes de llevarlo a la crucifixión.', 'Juan 19:2-3', 'medium'),
    ('León de Judá', 'Un título mesiánico del libro de Apocalipsis', 'Apocalipsis llama a Jesús el León de la tribu de Judá.', 'Apocalipsis 5:5', 'hard'),
    ('Pez (Ichthys)', 'Andrés presentó panes y peces a Jesús', 'Andrés señaló a un muchacho que tenía cinco panes y dos peces antes de alimentar a la multitud.', 'Juan 6:8-11', 'hard')
)
UPDATE public.game_memory_cards AS card
SET match_text = seed.match_text,
    explanation = seed.explanation,
    bible_reference = seed.bible_reference,
    difficulty = seed.difficulty,
    is_active = true
FROM seed
WHERE card.id = (
  SELECT legacy.id
  FROM public.game_memory_cards AS legacy
  WHERE lower(legacy.pair_name) = lower(seed.pair_name)
    AND legacy.match_text IS NULL
    AND legacy.explanation IS NULL
    AND legacy.bible_reference IS NULL
  ORDER BY legacy.created_at, legacy.id
  LIMIT 1
);

INSERT INTO public.game_memory_cards
  (pair_name, match_text, explanation, bible_reference, difficulty, is_active)
SELECT seed.pair_name, seed.match_text, seed.explanation, seed.bible_reference, seed.difficulty, true
FROM (VALUES
  ('Arca de Noé', 'Noé construyó un arca', 'Dios indicó a Noé que preparara un arca para preservar a su familia y a los animales.', 'Génesis 6:14-22', 'easy'),
  ('Tablas de la Ley', 'Moisés recibió tablas de piedra', 'Moisés recibió las tablas del testimonio escritas por Dios.', 'Éxodo 31:18', 'easy'),
  ('Paloma (Espíritu Santo)', 'El Espíritu descendió como paloma', 'Al ser bautizado Jesús, el Espíritu de Dios descendió como paloma.', 'Mateo 3:16-17', 'easy'),
  ('Estrella de Belén', 'Los sabios siguieron una estrella', 'Los sabios vieron la estrella y viajaron para buscar al rey de los judíos.', 'Mateo 2:1-2, 9-11', 'easy'),
  ('Cruz de Jesús', 'Jesús fue crucificado y resucitó', 'Los Evangelios relatan la crucifixión de Jesús y el anuncio de su resurrección.', 'Lucas 23:33; 24:5-7', 'medium'),
  ('Corona de Espinas', 'Los soldados pusieron una corona a Jesús', 'Los soldados pusieron una corona de espinas sobre Jesús antes de llevarlo a la crucifixión.', 'Juan 19:2-3', 'medium'),
  ('León de Judá', 'Un título mesiánico del libro de Apocalipsis', 'Apocalipsis llama a Jesús el León de la tribu de Judá.', 'Apocalipsis 5:5', 'hard'),
  ('Pez (Ichthys)', 'Andrés presentó panes y peces a Jesús', 'Andrés señaló a un muchacho que tenía cinco panes y dos peces antes de alimentar a la multitud.', 'Juan 6:8-11', 'hard')
) AS seed(pair_name, match_text, explanation, bible_reference, difficulty)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_memory_cards existing
  WHERE lower(existing.pair_name) = lower(seed.pair_name)
);

DROP POLICY IF EXISTS "Public can view memory cards" ON public.game_memory_cards;
DROP POLICY IF EXISTS "Public read access for memory cards" ON public.game_memory_cards;
CREATE POLICY "Public can view complete active memory cards"
  ON public.game_memory_cards
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND nullif(btrim(match_text), '') IS NOT NULL
    AND nullif(btrim(explanation), '') IS NOT NULL
    AND nullif(btrim(bible_reference), '') IS NOT NULL
  );

GRANT SELECT ON public.game_memory_cards TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.game_memory_cards TO authenticated;

NOTIFY pgrst, 'reload schema';
