-- Bible highlights, notes, and bookmarks are private per-user study data.
DROP POLICY IF EXISTS "Public can read bible_highlights" ON public.bible_highlights;

REVOKE ALL PRIVILEGES ON TABLE
  public.bible_highlights,
  public.bible_notes,
  public.bible_bookmarks
FROM anon;

-- Keep auth.role() as a statement-level initplan in affected RLS policies.
DO $migration$
DECLARE
  policy_row record;
  using_expression text;
  check_expression text;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (qual IS NOT NULL AND position('auth.role()' IN qual) > 0
          AND position('SELECT auth.role()' IN qual) = 0)
        OR
        (with_check IS NOT NULL AND position('auth.role()' IN with_check) > 0
          AND position('SELECT auth.role()' IN with_check) = 0)
      )
  LOOP
    using_expression := CASE
      WHEN policy_row.qual IS NULL THEN NULL
      ELSE replace(policy_row.qual, 'auth.role()', '(SELECT auth.role())')
    END;
    check_expression := CASE
      WHEN policy_row.with_check IS NULL THEN NULL
      ELSE replace(policy_row.with_check, 'auth.role()', '(SELECT auth.role())')
    END;

    EXECUTE format(
      'ALTER POLICY %I ON %I.%I%s%s',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename,
      CASE WHEN using_expression IS NULL THEN '' ELSE format(' USING (%s)', using_expression) END,
      CASE WHEN check_expression IS NULL THEN '' ELSE format(' WITH CHECK (%s)', check_expression) END
    );
  END LOOP;
END;
$migration$;
