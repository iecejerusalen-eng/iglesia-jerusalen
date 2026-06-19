-- =======================================================
-- SCRIPT SQL: MINISTERIOS Y BUCKET DE IMÁGENES
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Tabla de Ministerios
create table if not exists public.ministries (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  category text not null check (category in ('departamento', 'servicio')),
  description text,
  leader_name text,
  schedule text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para Ministerios
alter table public.ministries enable row level security;

drop policy if exists "Permitir lectura pública de ministerios" on public.ministries;
create policy "Permitir lectura pública de ministerios"
  on public.ministries for select
  using (true);

drop policy if exists "Permitir gestión de ministerios a administradores" on public.ministries;
create policy "Permitir gestión de ministerios a administradores"
  on public.ministries for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  );

-- 2. Insertar los ministerios iniciales con orden y datos descriptivos (Seed Data)
insert into public.ministries (name, slug, category, description, leader_name, schedule) values
  ('Dep. Damas', 'dep-damas', 'departamento', '<p>Espacio dedicado a la edificación espiritual, apoyo mutuo y servicio de las mujeres de la congregación, promoviendo el crecimiento bíblico y la comunión fraternal.</p>', 'Hna. Bertha Corina Miranda', 'Martes alternos 7:30pm'),
  ('Dep. Caballeros', 'dep-caballeros', 'departamento', '<p>Reuniones y actividades orientadas al fortalecimiento espiritual, compañerismo y discipulado de los hombres, equipándolos para ser líderes íntegros en sus hogares y comunidad.</p>', 'Hno. David Daniel Nicola', 'Martes alternos 7:30pm'),
  ('Dep. Misiones y Evangelismo', 'dep-misiones-y-evangelismo', 'departamento', '<p>Impulsamos la gran comisión a través de la plantación de iglesias filiales, apoyo en comunidades vulnerables, brigadas médicas y evangelismo en las calles de la ciudad.</p>', 'Pastor Principal', 'Reuniones de planificación: Sábados 4:00pm'),
  ('Dep. Escuela Dominical', 'dep-escuela-dominical', 'departamento', '<p>Clases interactivas y dinámicas diseñadas para la enseñanza de principios y valores bíblicos a niños y adolescentes de acuerdo a sus edades.</p>', 'Hna. Raquel de Morales', 'Domingos 9:40am'),
  ('Dep. Cadetes', 'dep-cadetes', 'departamento', '<p>Reuniones dinámicas orientadas a la formación espiritual y desarrollo integral de adolescentes y pre-jóvenes.</p>', 'Líderes Juveniles', 'Jueves 7:30pm'),
  ('Dep. Jóvenes', 'dep-jovenes', 'departamento', '<p>Un espacio juvenil vibrante donde los jóvenes de la iglesia se reúnen para alabar a Dios, aprender de Su Palabra y equiparse para ser líderes de impacto.</p>', 'Líderes Generación Fuego', 'Sábados 7:30pm'),
  ('Células', 'celulas', 'servicio', '<p>Grupos pequeños que se reúnen semanalmente en diferentes hogares de la ciudad para orar, estudiar la Biblia y fortalecer los lazos de comunión fraternal.</p>', 'Coordinadores de Células', 'Viernes en casas 7:30pm'),
  ('Ministerio de Alabanza', 'ministerio-de-alabanza', 'servicio', '<p>Buscamos guiar a la congregación a una adoración profunda y genuina a través de la música y el canto, fomentando un altar de adoración en espíritu y en verdad.</p>', 'Hno. David Martínez', 'Ensayos: Jueves 6:30pm | Servicio: Domingos'),
  ('Multimedia', 'multimedia', 'servicio', '<p>Equipo encargado del soporte técnico, transmisión en vivo de los cultos, diseño gráfico y mantenimiento de la presencia digital de la iglesia en redes sociales.</p>', 'Equipo de Medios', 'Servicio en todos los cultos generales')
on conflict (slug) do update
set category = excluded.category,
    description = excluded.description,
    leader_name = excluded.leader_name,
    schedule = excluded.schedule;

-- 3. Crear el Bucket de Almacenamiento "ministry-images"
insert into storage.buckets (id, name, public) 
values ('ministry-images', 'ministry-images', true)
on conflict (id) do nothing;

drop policy if exists "Cualquiera puede leer imágenes de ministerios" on storage.objects;
create policy "Cualquiera puede leer imágenes de ministerios"
  on storage.objects for select
  using (bucket_id = 'ministry-images');

drop policy if exists "Admins pueden subir imágenes de ministerios" on storage.objects;
create policy "Admins pueden subir imágenes de ministerios"
  on storage.objects for insert
  with check (bucket_id = 'ministry-images' and (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  ));

drop policy if exists "Admins pueden actualizar/eliminar imágenes de ministerios" on storage.objects;
create policy "Admins pueden actualizar/eliminar imágenes de ministerios"
  on storage.objects for all
  using (bucket_id = 'ministry-images' and (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  ));
