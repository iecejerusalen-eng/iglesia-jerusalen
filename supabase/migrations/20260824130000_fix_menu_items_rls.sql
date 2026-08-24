-- Fix RLS policy for public_menu_items to allow admins and pastors to manage dynamic menu items
DROP POLICY IF EXISTS "Permitir escritura a administradores" ON public.public_menu_items;
DROP POLICY IF EXISTS "Permitir escritura a administradores y pastores" ON public.public_menu_items;

CREATE POLICY "Permitir escritura a administradores y pastores" ON public.public_menu_items 
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'pastor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'pastor')
  )
);
