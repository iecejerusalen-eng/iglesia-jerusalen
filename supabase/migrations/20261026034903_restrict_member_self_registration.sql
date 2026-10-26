-- CRM member records are created and edited only by staff with the effective
-- members/edit permission. A linked user can still read their own record and
-- use the explicit contact-detail policies on emails and phones.
DROP POLICY IF EXISTS "Permitir auto-registro de miembros" ON public.members;
DROP POLICY IF EXISTS "Permitir auto-actualización de miembro propio" ON public.members;
