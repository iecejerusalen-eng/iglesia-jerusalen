UPDATE public.game_guess_characters
SET bible_reference = '2 Reyes 5:1-14'
WHERE lower(name) IN ('naaman', 'naamán')
  AND nullif(btrim(bible_reference), '') IS NULL;
