-- =======================================================
-- SCRIPT SQL: ADICIÓN DE EMAIL A PERFILES Y TRIGGER (OAUTH COMPATIBLE)
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Añadir columna email a public.profiles si no existe
alter table public.profiles add column if not exists email text;

-- 2. Actualizar la función del trigger para que guarde el email del usuario recién registrado
-- Soporta tanto registro por correo (first_name, last_name) como Google OAuth (given_name, family_name)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, email, role)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'given_name'), 
    coalesce(new.raw_user_meta_data->>'last_name', new.raw_user_meta_data->>'family_name'), 
    new.email,
    'guest'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 3. Actualizar perfiles existentes que no tengan email
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;
