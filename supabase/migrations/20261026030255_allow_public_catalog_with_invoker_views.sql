-- Allow the public catalog policies to reveal active products while keeping
-- administrator visibility as an additive, permission-checked policy.
-- The previous restrictive policies AND-ed with public visibility and denied
-- every anonymous row after the catalog views became security-invoker views.
DROP POLICY IF EXISTS store_products_internal_read ON public.products;
CREATE POLICY store_products_internal_read
  ON public.products AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (private.current_user_has_admin_permission('products', 'view'));

DROP POLICY IF EXISTS store_variants_internal_read ON public.product_variants;
CREATE POLICY store_variants_internal_read
  ON public.product_variants AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (private.current_user_has_admin_permission('products', 'view'));
