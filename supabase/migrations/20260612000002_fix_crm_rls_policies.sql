-- Migration: Add Row Level Security (RLS) policies for members, member_emails, member_service_areas, member_talents, and member_spiritual_gifts

-- 1. Enable RLS on all 5 CRM tables
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_talents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_spiritual_gifts ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist (to prevent duplicates)
DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados" ON public.members;
DROP POLICY IF EXISTS "Permitir escritura a personal autorizado" ON public.members;

DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados" ON public.member_emails;
DROP POLICY IF EXISTS "Permitir escritura a personal autorizado" ON public.member_emails;

DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados" ON public.member_service_areas;
DROP POLICY IF EXISTS "Permitir escritura a personal autorizado" ON public.member_service_areas;

DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados" ON public.member_talents;
DROP POLICY IF EXISTS "Permitir escritura a personal autorizado" ON public.member_talents;

DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados" ON public.member_spiritual_gifts;
DROP POLICY IF EXISTS "Permitir escritura a personal autorizado" ON public.member_spiritual_gifts;

-- 3. Create SELECT policies (allow all authenticated users to read member data)
CREATE POLICY "Permitir lectura a usuarios autenticados" ON public.members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir lectura a usuarios autenticados" ON public.member_emails FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir lectura a usuarios autenticados" ON public.member_service_areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir lectura a usuarios autenticados" ON public.member_talents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir lectura a usuarios autenticados" ON public.member_spiritual_gifts FOR SELECT TO authenticated USING (true);

-- 4. Create WRITE policies (restrict writing to staff roles or permissions override edit = true)
CREATE POLICY "Permitir escritura a personal autorizado" ON public.members FOR ALL TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and (
        role in ('admin', 'pastor', 'editor', 'secretary', 'secretaria')
        or (permissions_override->'members'->>'edit')::boolean = true
      )
    )
  )
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and (
        role in ('admin', 'pastor', 'editor', 'secretary', 'secretaria')
        or (permissions_override->'members'->>'edit')::boolean = true
      )
    )
  );

CREATE POLICY "Permitir escritura a personal autorizado" ON public.member_emails FOR ALL TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and (
        role in ('admin', 'pastor', 'editor', 'secretary', 'secretaria')
        or (permissions_override->'members'->>'edit')::boolean = true
      )
    )
  )
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and (
        role in ('admin', 'pastor', 'editor', 'secretary', 'secretaria')
        or (permissions_override->'members'->>'edit')::boolean = true
      )
    )
  );

CREATE POLICY "Permitir escritura a personal autorizado" ON public.member_service_areas FOR ALL TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and (
        role in ('admin', 'pastor', 'editor', 'secretary', 'secretaria')
        or (permissions_override->'members'->>'edit')::boolean = true
      )
    )
  )
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and (
        role in ('admin', 'pastor', 'editor', 'secretary', 'secretaria')
        or (permissions_override->'members'->>'edit')::boolean = true
      )
    )
  );

CREATE POLICY "Permitir escritura a personal autorizado" ON public.member_talents FOR ALL TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and (
        role in ('admin', 'pastor', 'editor', 'secretary', 'secretaria')
        or (permissions_override->'members'->>'edit')::boolean = true
      )
    )
  )
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and (
        role in ('admin', 'pastor', 'editor', 'secretary', 'secretaria')
        or (permissions_override->'members'->>'edit')::boolean = true
      )
    )
  );

CREATE POLICY "Permitir escritura a personal autorizado" ON public.member_spiritual_gifts FOR ALL TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and (
        role in ('admin', 'pastor', 'editor', 'secretary', 'secretaria')
        or (permissions_override->'members'->>'edit')::boolean = true
      )
    )
  )
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and (
        role in ('admin', 'pastor', 'editor', 'secretary', 'secretaria')
        or (permissions_override->'members'->>'edit')::boolean = true
      )
    )
  );
