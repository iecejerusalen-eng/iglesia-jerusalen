-- TABLA DE TURNOS / ACTIVIDADES DE VOLUNTARIADO
CREATE TABLE IF NOT EXISTS public.volunteer_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
  required_volunteers INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ASIGNACIONES DE VOLUNTARIADO (relacionadas a members)
CREATE TABLE IF NOT EXISTS public.volunteer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES public.volunteer_shifts(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled, attended
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(shift_id, member_id)
);

-- ESPACIOS FÍSICOS (Aulas, Templos, Salas)
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER,
  features TEXT[],
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RESERVAS DE ESPACIOS
CREATE TABLE IF NOT EXISTS public.space_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, cancelled
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS y Políticas
ALTER TABLE public.volunteer_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_bookings ENABLE ROW LEVEL SECURITY;

-- Shifts públicas
DROP POLICY IF EXISTS "shifts_public_read" ON public.volunteer_shifts;
CREATE POLICY "shifts_public_read" ON public.volunteer_shifts FOR SELECT USING (true);

DROP POLICY IF EXISTS "shifts_admin_all" ON public.volunteer_shifts;
CREATE POLICY "shifts_admin_all" ON public.volunteer_shifts FOR ALL USING ((select auth.role()) = 'authenticated' AND (select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));

-- Assignments
DROP POLICY IF EXISTS "assignments_public_read" ON public.volunteer_assignments;
CREATE POLICY "assignments_public_read" ON public.volunteer_assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "assignments_admin_all" ON public.volunteer_assignments;
CREATE POLICY "assignments_admin_all" ON public.volunteer_assignments FOR ALL USING ((select auth.role()) = 'authenticated' AND (select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'leader'));

-- Spaces
DROP POLICY IF EXISTS "spaces_public_read" ON public.spaces;
CREATE POLICY "spaces_public_read" ON public.spaces FOR SELECT USING (true);

DROP POLICY IF EXISTS "spaces_admin_all" ON public.spaces;
CREATE POLICY "spaces_admin_all" ON public.spaces FOR ALL USING ((select auth.role()) = 'authenticated' AND (select auth.jwt()) ->> 'role' IN ('admin', 'pastor'));

-- Bookings (Cualquier autenticado puede crear/ver sus reservas, admin ve todas)
DROP POLICY IF EXISTS "bookings_read" ON public.space_bookings;
CREATE POLICY "bookings_read" ON public.space_bookings FOR SELECT USING (
  (select auth.uid()) = user_id OR 
  ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'secretary'))
);

DROP POLICY IF EXISTS "bookings_insert" ON public.space_bookings;
CREATE POLICY "bookings_insert" ON public.space_bookings FOR INSERT WITH CHECK (
  (select auth.role()) = 'authenticated' AND (select auth.uid()) = user_id
);

DROP POLICY IF EXISTS "bookings_update" ON public.space_bookings;
CREATE POLICY "bookings_update" ON public.space_bookings FOR UPDATE USING (
  (select auth.uid()) = user_id OR 
  ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'secretary'))
);

DROP POLICY IF EXISTS "bookings_delete" ON public.space_bookings;
CREATE POLICY "bookings_delete" ON public.space_bookings FOR DELETE USING (
  (select auth.uid()) = user_id OR 
  ((select auth.jwt()) ->> 'role' IN ('admin', 'pastor', 'secretary'))
);
