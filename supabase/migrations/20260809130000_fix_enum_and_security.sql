-- Fix user_role enum missing values causing errors in policies
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'superadmin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'secretaria';

-- Fix Security Definer View for audit_pg_policies (Requires Postgres 15+)
ALTER VIEW public.audit_pg_policies SET (security_invoker = on);

-- Fix Auth RLS Initialization Plan warnings for public-facing tables
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read sermons" ON public.sermons;
CREATE POLICY "Public can read sermons" ON public.sermons FOR SELECT USING (true);

ALTER TABLE public.church_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read church settings" ON public.church_settings;
CREATE POLICY "Public can read church settings" ON public.church_settings FOR SELECT USING (true);

ALTER TABLE public.public_menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read public_menu_items" ON public.public_menu_items;
CREATE POLICY "Public can read public_menu_items" ON public.public_menu_items FOR SELECT USING (true);

ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read speakers" ON public.speakers;
CREATE POLICY "Public can read speakers" ON public.speakers FOR SELECT USING (true);

ALTER TABLE public.bible_highlights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read bible_highlights" ON public.bible_highlights;
CREATE POLICY "Public can read bible_highlights" ON public.bible_highlights FOR SELECT USING (true);
