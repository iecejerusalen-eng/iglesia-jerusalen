-- 20260809170003_consolidate_rls_policies_4.sql
-- Optimización de rendimiento Parte 4: Consolidación de políticas permisivas (multiple_permissive_policies)

-- ==========================================
-- 1. product_variants
-- ==========================================
DROP POLICY IF EXISTS "Permitir gestión de variantes a administradores" ON public.product_variants;
DROP POLICY IF EXISTS "Permitir lectura pública de variantes" ON public.product_variants;

DROP POLICY IF EXISTS "Consolidated read access" ON public.product_variants;
CREATE POLICY "Consolidated read access" ON public.product_variants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.product_variants;
CREATE POLICY "Consolidated manage access insert" ON public.product_variants FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'manager'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.product_variants;
CREATE POLICY "Consolidated manage access update" ON public.product_variants FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'manager')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'manager'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.product_variants;
CREATE POLICY "Consolidated manage access delete" ON public.product_variants FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'manager'));

-- ==========================================
-- 2. production_tickets
-- ==========================================
DROP POLICY IF EXISTS "Gestión total de tickets por roles de staff" ON public.production_tickets;
DROP POLICY IF EXISTS "Lectura de tickets para usuarios autenticados" ON public.production_tickets;

DROP POLICY IF EXISTS "Consolidated read access" ON public.production_tickets;
CREATE POLICY "Consolidated read access" ON public.production_tickets FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.production_tickets;
CREATE POLICY "Consolidated manage access insert" ON public.production_tickets FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.production_tickets;
CREATE POLICY "Consolidated manage access update" ON public.production_tickets FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.production_tickets;
CREATE POLICY "Consolidated manage access delete" ON public.production_tickets FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));

-- ==========================================
-- 3. products
-- ==========================================
DROP POLICY IF EXISTS "Permitir escritura de productos a administradores" ON public.products;
DROP POLICY IF EXISTS "Permitir lectura pública de productos" ON public.products;

DROP POLICY IF EXISTS "Consolidated read access" ON public.products;
CREATE POLICY "Consolidated read access" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.products;
CREATE POLICY "Consolidated manage access insert" ON public.products FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'manager'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.products;
CREATE POLICY "Consolidated manage access update" ON public.products FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'manager')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'manager'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.products;
CREATE POLICY "Consolidated manage access delete" ON public.products FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'manager'));

-- ==========================================
-- 4. profiles
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura de perfiles a autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Admins and pastors can update any profile." ON public.profiles;
DROP POLICY IF EXISTS "Permitir a usuarios actualizar su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

DROP POLICY IF EXISTS "Consolidated read access" ON public.profiles;
CREATE POLICY "Consolidated read access" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.profiles;
CREATE POLICY "Consolidated manage access update" ON public.profiles FOR UPDATE TO authenticated USING (
  id = (SELECT auth.uid()) OR 
  ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor'))
) WITH CHECK (
  id = (SELECT auth.uid()) OR 
  ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor'))
);

-- ==========================================
-- 5. program_lessons
-- ==========================================
DROP POLICY IF EXISTS "Gestión de lecciones por roles autorizados" ON public.program_lessons;
DROP POLICY IF EXISTS "Lectura pública de lecciones" ON public.program_lessons;

DROP POLICY IF EXISTS "Consolidated read access" ON public.program_lessons;
CREATE POLICY "Consolidated read access" ON public.program_lessons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.program_lessons;
CREATE POLICY "Consolidated manage access insert" ON public.program_lessons FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.program_lessons;
CREATE POLICY "Consolidated manage access update" ON public.program_lessons FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.program_lessons;
CREATE POLICY "Consolidated manage access delete" ON public.program_lessons FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));

-- ==========================================
-- 6. program_modules
-- ==========================================
DROP POLICY IF EXISTS "Allow admin full access to program_modules" ON public.program_modules;
DROP POLICY IF EXISTS "Allow public read access to program_modules" ON public.program_modules;

DROP POLICY IF EXISTS "Consolidated read access" ON public.program_modules;
CREATE POLICY "Consolidated read access" ON public.program_modules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.program_modules;
CREATE POLICY "Consolidated manage access insert" ON public.program_modules FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.program_modules;
CREATE POLICY "Consolidated manage access update" ON public.program_modules FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.program_modules;
CREATE POLICY "Consolidated manage access delete" ON public.program_modules FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));

-- ==========================================
-- 7. programs
-- ==========================================
DROP POLICY IF EXISTS "Gestión de programas por roles autorizados" ON public.programs;
DROP POLICY IF EXISTS "Lectura pública de programas" ON public.programs;

DROP POLICY IF EXISTS "Consolidated read access" ON public.programs;
CREATE POLICY "Consolidated read access" ON public.programs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.programs;
CREATE POLICY "Consolidated manage access insert" ON public.programs FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.programs;
CREATE POLICY "Consolidated manage access update" ON public.programs FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.programs;
CREATE POLICY "Consolidated manage access delete" ON public.programs FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));

-- ==========================================
-- 8. public_menu_items
-- ==========================================
DROP POLICY IF EXISTS "Permitir lectura a todos" ON public.public_menu_items;
DROP POLICY IF EXISTS "Public can read public_menu_items" ON public.public_menu_items;
DROP POLICY IF EXISTS "Permitir escritura a administradores" ON public.public_menu_items;

DROP POLICY IF EXISTS "Consolidated read access" ON public.public_menu_items;
CREATE POLICY "Consolidated read access" ON public.public_menu_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Consolidated manage access insert" ON public.public_menu_items;
CREATE POLICY "Consolidated manage access insert" ON public.public_menu_items FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor'));
DROP POLICY IF EXISTS "Consolidated manage access update" ON public.public_menu_items;
CREATE POLICY "Consolidated manage access update" ON public.public_menu_items FOR UPDATE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor')) WITH CHECK ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor'));
DROP POLICY IF EXISTS "Consolidated manage access delete" ON public.public_menu_items;
CREATE POLICY "Consolidated manage access delete" ON public.public_menu_items FOR DELETE TO authenticated USING ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor'));
