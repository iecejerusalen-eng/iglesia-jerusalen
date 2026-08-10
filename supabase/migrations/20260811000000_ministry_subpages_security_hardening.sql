-- Follow-up migration: the base version may already be registered remotely.
-- Reassert the final hierarchy and RLS rules without rewriting migration history.

CREATE OR REPLACE FUNCTION public.validate_ministry_page_tree()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  parent_page public.ministry_pages%ROWTYPE;
  creates_cycle boolean;
  deepest_descendant_depth smallint;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.depth := 1;
  ELSE
    SELECT * INTO parent_page FROM public.ministry_pages WHERE id = NEW.parent_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'La página superior ya no existe.'; END IF;
    IF parent_page.ministry_id <> NEW.ministry_id THEN RAISE EXCEPTION 'La página superior pertenece a otro ministerio.'; END IF;
    IF NEW.status = 'published' AND parent_page.status <> 'published' THEN RAISE EXCEPTION 'Publica primero la página superior.'; END IF;
    IF NEW.id IS NOT NULL AND NEW.parent_id = NEW.id THEN RAISE EXCEPTION 'Una página no puede depender de sí misma.'; END IF;

    IF TG_OP = 'UPDATE' THEN
      WITH RECURSIVE descendants AS (
        SELECT page.id FROM public.ministry_pages page WHERE page.parent_id = NEW.id
        UNION ALL
        SELECT child.id FROM public.ministry_pages child JOIN descendants parent ON child.parent_id = parent.id
      )
      SELECT EXISTS (SELECT 1 FROM descendants WHERE id = NEW.parent_id) INTO creates_cycle;
      IF creates_cycle THEN RAISE EXCEPTION 'La jerarquía produciría un ciclo.'; END IF;

      WITH RECURSIVE descendants AS (
        SELECT page.id, page.depth FROM public.ministry_pages page WHERE page.id = NEW.id
        UNION ALL
        SELECT child.id, child.depth FROM public.ministry_pages child JOIN descendants parent ON child.parent_id = parent.id
      )
      SELECT max(depth) INTO deepest_descendant_depth FROM descendants;
    END IF;
    NEW.depth := parent_page.depth + 1;
  END IF;

  IF NEW.depth > 4 THEN RAISE EXCEPTION 'Las subpáginas admiten un máximo de cuatro niveles.'; END IF;
  IF TG_OP = 'UPDATE' AND COALESCE(deepest_descendant_depth, OLD.depth) - OLD.depth + NEW.depth > 4 THEN
    RAISE EXCEPTION 'Al mover esta rama se superarían los cuatro niveles permitidos.';
  END IF;

  NEW.updated_at := now();
  NEW.updated_by := COALESCE((SELECT auth.uid()), NEW.updated_by);
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status <> 'published') THEN
    NEW.published_at := now();
  ELSIF NEW.status = 'draft' THEN
    NEW.published_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_ministry_page_descendant_depths()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.depth IS DISTINCT FROM NEW.depth THEN
    WITH RECURSIVE descendants AS (
      SELECT child.id, NEW.depth + 1 AS calculated_depth
      FROM public.ministry_pages child WHERE child.parent_id = NEW.id
      UNION ALL
      SELECT child.id, parent.calculated_depth + 1
      FROM public.ministry_pages child JOIN descendants parent ON child.parent_id = parent.id
    )
    UPDATE public.ministry_pages page
    SET depth = descendants.calculated_depth
    FROM descendants
    WHERE page.id = descendants.id AND page.depth IS DISTINCT FROM descendants.calculated_depth;
  END IF;

  IF OLD.status = 'published' AND NEW.status = 'draft' THEN
    WITH RECURSIVE descendants AS (
      SELECT child.id FROM public.ministry_pages child WHERE child.parent_id = NEW.id
      UNION ALL
      SELECT child.id FROM public.ministry_pages child JOIN descendants parent ON child.parent_id = parent.id
    )
    UPDATE public.ministry_pages page
    SET status = 'draft', published_at = NULL
    WHERE page.id IN (SELECT id FROM descendants) AND page.status <> 'draft';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_ministry_page_tree_before_write ON public.ministry_pages;
CREATE TRIGGER validate_ministry_page_tree_before_write
  BEFORE INSERT OR UPDATE ON public.ministry_pages
  FOR EACH ROW EXECUTE FUNCTION public.validate_ministry_page_tree();

DROP TRIGGER IF EXISTS refresh_ministry_page_descendant_depths_after_update ON public.ministry_pages;
CREATE TRIGGER refresh_ministry_page_descendant_depths_after_update
  AFTER UPDATE OF parent_id, depth, status ON public.ministry_pages
  FOR EACH ROW EXECUTE FUNCTION public.refresh_ministry_page_descendant_depths();

DROP POLICY IF EXISTS "Published ministry pages are public" ON public.ministry_pages;
DROP POLICY IF EXISTS "Ministry managers read every page" ON public.ministry_pages;
CREATE POLICY "Published ministry pages are public"
  ON public.ministry_pages FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY "Ministry managers read every page"
  ON public.ministry_pages FOR SELECT TO authenticated
  USING ((SELECT private.can_manage_ministry_page(ministry_id)));

REVOKE EXECUTE ON FUNCTION public.validate_ministry_page_tree() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_ministry_page_descendant_depths() FROM PUBLIC, anon, authenticated;
