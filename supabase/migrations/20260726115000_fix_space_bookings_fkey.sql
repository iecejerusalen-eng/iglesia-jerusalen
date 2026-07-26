-- Modificar la llave foránea de user_id en space_bookings para que apunte a public.profiles
-- de esta manera el frontend (PostgREST) puede hacer join con la tabla profiles para mostrar datos.

ALTER TABLE public.space_bookings
  DROP CONSTRAINT IF EXISTS space_bookings_user_id_fkey;

ALTER TABLE public.space_bookings
  ADD CONSTRAINT space_bookings_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;
