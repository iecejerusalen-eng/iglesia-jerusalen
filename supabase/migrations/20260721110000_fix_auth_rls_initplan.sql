-- Fix for Supabase Linter Warning: Auth RLS Initialization Plan (0003_auth_rls_initplan)
-- This script dynamically loops through all policies in the public schema and wraps
-- auth.uid(), auth.role(), auth.email(), and auth.jwt() in (select ...) to improve performance.

DO $$
DECLARE
    pol RECORD;
    drop_stmt TEXT;
    create_stmt TEXT;
    new_qual TEXT;
    new_with_check TEXT;
BEGIN
    FOR pol IN 
        SELECT * FROM pg_policies 
        WHERE schemaname = 'public' 
    LOOP
        -- Check if needs fix
        IF (pol.qual::text LIKE '%auth.uid()%' OR pol.qual::text LIKE '%auth.role()%' OR pol.qual::text LIKE '%auth.jwt()%' OR pol.qual::text LIKE '%auth.email()%'
            OR pol.with_check::text LIKE '%auth.uid()%' OR pol.with_check::text LIKE '%auth.role()%' OR pol.with_check::text LIKE '%auth.jwt()%' OR pol.with_check::text LIKE '%auth.email()%') THEN
            
            -- Skip if already has select (already fixed)
            IF (pol.qual::text LIKE '%(select auth.%' OR pol.with_check::text LIKE '%(select auth.%') THEN
                CONTINUE;
            END IF;

            -- Generate DROP
            drop_stmt := format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
            
            -- Replace in USING
            IF pol.qual IS NOT NULL THEN
                new_qual := pol.qual::text;
                new_qual := replace(new_qual, 'auth.uid()', '(select auth.uid())');
                new_qual := replace(new_qual, 'auth.role()', '(select auth.role())');
                new_qual := replace(new_qual, 'auth.jwt()', '(select auth.jwt())');
                new_qual := replace(new_qual, 'auth.email()', '(select auth.email())');
            ELSE
                new_qual := NULL;
            END IF;

            -- Replace in WITH CHECK
            IF pol.with_check IS NOT NULL THEN
                new_with_check := pol.with_check::text;
                new_with_check := replace(new_with_check, 'auth.uid()', '(select auth.uid())');
                new_with_check := replace(new_with_check, 'auth.role()', '(select auth.role())');
                new_with_check := replace(new_with_check, 'auth.jwt()', '(select auth.jwt())');
                new_with_check := replace(new_with_check, 'auth.email()', '(select auth.email())');
            ELSE
                new_with_check := NULL;
            END IF;

            -- Generate CREATE
            create_stmt := format('CREATE POLICY %I ON %I.%I FOR %s TO %s', 
                                   pol.policyname, pol.schemaname, pol.tablename, pol.cmd, array_to_string(pol.roles, ', '));
            
            IF new_qual IS NOT NULL THEN
                create_stmt := create_stmt || format(' USING (%s)', new_qual);
            END IF;
            
            IF new_with_check IS NOT NULL THEN
                create_stmt := create_stmt || format(' WITH CHECK (%s)', new_with_check);
            END IF;
            
            create_stmt := create_stmt || ';';

            -- Execute
            EXECUTE drop_stmt;
            EXECUTE create_stmt;
        END IF;
    END LOOP;
END $$;
