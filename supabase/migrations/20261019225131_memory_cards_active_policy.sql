-- Remove legacy unrestricted SELECT policies so inactive drafts stay private.
DROP POLICY IF EXISTS "Public can view memory cards" ON public.game_memory_cards;
DROP POLICY IF EXISTS "Public read access for memory cards" ON public.game_memory_cards;
DROP POLICY IF EXISTS "Public can view complete active memory cards" ON public.game_memory_cards;

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
