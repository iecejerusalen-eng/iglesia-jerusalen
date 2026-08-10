-- Every hangman riddle must finish with a verifiable biblical reference.
-- Existing English spellings are normalized to Spanish before enforcing it.

ALTER TABLE public.game_hangman_words
  ADD COLUMN IF NOT EXISTS bible_reference text;

UPDATE public.game_hangman_words
SET
  word = 'BELÉN',
  hint = 'Ciudad de Judea donde nació Jesús',
  category = 'Lugar'
WHERE upper(trim(word)) IN ('BETLEHEM', 'BETHLEHEM', 'BELEN', 'BELÉN');

UPDATE public.game_hangman_words
SET word = CASE upper(trim(word))
  WHEN 'GENESIS' THEN 'GÉNESIS'
  WHEN 'JERUSALEN' THEN 'JERUSALÉN'
  WHEN 'MOISES' THEN 'MOISÉS'
  ELSE word
END
WHERE upper(trim(word)) IN ('GENESIS', 'JERUSALEN', 'MOISES');

UPDATE public.game_hangman_words
SET bible_reference = CASE upper(trim(word))
  WHEN 'APOCALIPSIS' THEN 'Apocalipsis 1:1'
  WHEN 'BARTIMEO' THEN 'Marcos 10:46-52'
  WHEN 'BETANIA' THEN 'Juan 11:1'
  WHEN 'BELÉN' THEN 'Lucas 2:4-7'
  WHEN 'BIENAVENTURANZAS' THEN 'Mateo 5:3-12'
  WHEN 'CORINTO' THEN '1 Corintios 1:2; 2 Corintios 1:1'
  WHEN 'DAVID' THEN '1 Samuel 17:49-50'
  WHEN 'DEUTERONOMIO' THEN 'Deuteronomio 1:1'
  WHEN 'DORCAS' THEN 'Hechos 9:36'
  WHEN 'ECLESIASTÉS' THEN 'Eclesiastés 3:1'
  WHEN 'EMANUEL' THEN 'Mateo 1:23'
  WHEN 'FILIPOS' THEN 'Hechos 16:22-24'
  WHEN 'GEDEÓN' THEN 'Jueces 7:7'
  WHEN 'GÉNESIS' THEN 'Génesis 1:1'
  WHEN 'GETSEMANÍ' THEN 'Mateo 26:36-39'
  WHEN 'GÓLGOTA' THEN 'Juan 19:17'
  WHEN 'HABACUC' THEN 'Habacuc 2:4'
  WHEN 'JERUSALÉN' THEN 'Apocalipsis 21:2'
  WHEN 'MELQUISEDEC' THEN 'Génesis 14:18'
  WHEN 'MOISÉS' THEN 'Éxodo 14:21'
  WHEN 'NAZARET' THEN 'Lucas 2:39-40'
  WHEN 'NEHEMÍAS' THEN 'Nehemías 2:17-18'
  WHEN 'PENTATEUCO' THEN 'Lucas 24:44'
  WHEN 'PENTECOSTÉS' THEN 'Hechos 2:1-4'
  WHEN 'PRISCILA' THEN 'Hechos 18:24-26'
  WHEN 'REDENCIÓN' THEN 'Efesios 1:7'
  WHEN 'RESURRECCIÓN' THEN 'Mateo 28:5-6'
  WHEN 'SANSÓN' THEN 'Jueces 16:17'
  WHEN 'TRANSFIGURACIÓN' THEN 'Mateo 17:1-5'
  ELSE bible_reference
END;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.game_hangman_words
    WHERE bible_reference IS NULL OR btrim(bible_reference) = ''
  ) THEN
    RAISE EXCEPTION
      'All game_hangman_words rows require a reviewed bible_reference before this migration can continue.';
  END IF;
END $$;

ALTER TABLE public.game_hangman_words
  ALTER COLUMN bible_reference SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'game_hangman_words_bible_reference_check'
      AND conrelid = 'public.game_hangman_words'::regclass
  ) THEN
    ALTER TABLE public.game_hangman_words
      ADD CONSTRAINT game_hangman_words_bible_reference_check
      CHECK (btrim(bible_reference) <> '');
  END IF;
END $$;

COMMENT ON COLUMN public.game_hangman_words.bible_reference IS
  'Reviewed Bible passage shown after the riddle is completed.';

NOTIFY pgrst, 'reload schema';
