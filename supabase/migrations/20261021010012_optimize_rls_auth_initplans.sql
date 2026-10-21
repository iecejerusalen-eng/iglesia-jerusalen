-- Keep authentication helpers as statement-level initplans in RLS policies.
-- This preserves each policy's access condition while avoiding per-row
-- re-evaluation of auth.uid() and auth.jwt().
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
        (qual IS NOT NULL
          AND (position('auth.uid()' IN qual) > 0 OR position('auth.jwt()' IN qual) > 0)
          AND position('( SELECT auth.uid()' IN qual) = 0
          AND position('( SELECT auth.jwt()' IN qual) = 0)
        OR
        (with_check IS NOT NULL
          AND (position('auth.uid()' IN with_check) > 0 OR position('auth.jwt()' IN with_check) > 0)
          AND position('( SELECT auth.uid()' IN with_check) = 0
          AND position('( SELECT auth.jwt()' IN with_check) = 0)
      )
  LOOP
    using_expression := CASE
      WHEN policy_row.qual IS NULL THEN NULL
      WHEN position('SELECT auth.uid()' IN policy_row.qual) > 0 OR position('SELECT auth.jwt()' IN policy_row.qual) > 0 THEN policy_row.qual
      ELSE replace(replace(policy_row.qual, 'auth.uid()', '(SELECT auth.uid())'), 'auth.jwt()', '(SELECT auth.jwt())')
    END;
    check_expression := CASE
      WHEN policy_row.with_check IS NULL THEN NULL
      WHEN position('SELECT auth.uid()' IN policy_row.with_check) > 0 OR position('SELECT auth.jwt()' IN policy_row.with_check) > 0 THEN policy_row.with_check
      ELSE replace(replace(policy_row.with_check, 'auth.uid()', '(SELECT auth.uid())'), 'auth.jwt()', '(SELECT auth.jwt())')
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
