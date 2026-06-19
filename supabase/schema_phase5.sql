-- =======================================================
-- SCRIPT SQL: FASE 5 (ROBUSTO) - SERMONES, CONTACTOS Y HORARIOS
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Tabla de Sermones (Si no existe)
create table if not exists public.sermons (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  youtube_url text,
  pastor_name text not null default 'Pastor Principal',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para Sermones
alter table public.sermons enable row level security;

drop policy if exists "Permitir lectura pública de sermones" on public.sermons;
create policy "Permitir lectura pública de sermones" 
  on public.sermons for select 
  using (true);

drop policy if exists "Permitir gestión de sermones a administradores" on public.sermons;
create policy "Permitir gestión de sermones a administradores" 
  on public.sermons for all 
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  );

-- 2. Tabla de Mensajes de Contacto (Si no existe)
create table if not exists public.contact_messages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status text not null default 'unread' check (status in ('unread', 'read')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para Mensajes de Contacto
alter table public.contact_messages enable row level security;

drop policy if exists "Permitir enviar mensajes de contacto públicamente" on public.contact_messages;
create policy "Permitir enviar mensajes de contacto públicamente" 
  on public.contact_messages for insert 
  with check (true);

drop policy if exists "Permitir lectura de mensajes de contacto a administradores" on public.contact_messages;
create policy "Permitir lectura de mensajes de contacto a administradores" 
  on public.contact_messages for select 
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  );

drop policy if exists "Permitir actualizar mensajes de contacto a administradores" on public.contact_messages;
create policy "Permitir actualizar mensajes de contacto a administradores" 
  on public.contact_messages for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  );

-- 3. Tabla de Horarios de Servicios (Schedules) (Si no existe)
create table if not exists public.schedules (
  id uuid default gen_random_uuid() primary key,
  day text not null,
  title text not null,
  time_range text not null,
  description text,
  order_index integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_schedule_slot unique (day, title, time_range) -- Evita duplicados en cargas repetidas
);

-- RLS para Horarios
alter table public.schedules enable row level security;

drop policy if exists "Permitir lectura pública de horarios" on public.schedules;
create policy "Permitir lectura pública de horarios"
  on public.schedules for select
  using (true);

drop policy if exists "Permitir gestión de horarios a administradores" on public.schedules;
create policy "Permitir gestión de horarios a administradores"
  on public.schedules for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  );

-- Insertar los horarios iniciales provistos por el usuario
insert into public.schedules (day, title, time_range, description, order_index) values
  ('Martes', 'Culto de Damas y Caballeros', '7:30pm - 9:30pm', 'Culto dirigido por el Departamento de Damas y Caballeros', 1),
  ('Miércoles', 'Culto de Enseñanza', '7:30pm - 9:30pm', 'Estudio bíblico profundo para toda la congregación', 2),
  ('Jueves', 'Culto de Cadetes', '7:30pm - 9:30pm', 'Culto dirigido por el Departamento de Cadetes (adolescentes)', 3),
  ('Viernes', 'Culto en Células', '7:30pm - 9:30pm', 'Reuniones en hogares y grupos pequeños', 4),
  ('Sábado', 'Culto de Jóvenes', '7:30pm - 9:30pm', 'Culto dirigido por el Departamento de Jóvenes', 5),
  ('Domingo', '1ra Plenaria', '8:00am - 9:30am', 'Primer servicio general de adoración', 6),
  ('Domingo', 'Escuela Dominical', '9:40am - 10:30am', 'Clases de formación espiritual por edades', 7),
  ('Domingo', '2da Plenaria', '11:00am - 12:30pm', 'Segundo servicio general de adoración', 8),
  ('Domingo', 'Culto Familiar', '7:30pm - 9:30pm', 'Servicio familiar de cierre de semana', 9)
on conflict (day, title, time_range) do update 
set description = excluded.description, order_index = excluded.order_index;
