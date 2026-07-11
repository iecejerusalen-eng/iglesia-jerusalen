-- =======================================================
-- MIGRACIÓN SQL: Categorías de Sermones (Gestor de Prédicas)
-- =======================================================

-- 1. Crear tabla de categorías
create table if not exists public.sermon_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  color text default '#4F46E5', -- Color por defecto (primary)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilitar RLS
alter table public.sermon_categories enable row level security;

-- 3. Políticas de RLS
drop policy if exists "Permitir lectura pública de sermon_categories" on public.sermon_categories;
create policy "Permitir lectura pública de sermon_categories"
  on public.sermon_categories for select
  using (true);

drop policy if exists "Permitir gestión a administradores" on public.sermon_categories;
create policy "Permitir gestión a administradores"
  on public.sermon_categories for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  );

-- 4. Insertar categorías iniciales si la tabla está vacía
insert into public.sermon_categories (name, description, color)
select 'Dominical', 'Prédicas de los cultos dominicales', '#2563EB'
where not exists (select 1 from public.sermon_categories where name = 'Dominical');

insert into public.sermon_categories (name, description, color)
select 'Para la Familia', 'Mensajes orientados al núcleo familiar', '#16A34A'
where not exists (select 1 from public.sermon_categories where name = 'Para la Familia');

insert into public.sermon_categories (name, description, color)
select 'Jóvenes', 'Enseñanzas para el ministerio juvenil', '#DC2626'
where not exists (select 1 from public.sermon_categories where name = 'Jóvenes');

insert into public.sermon_categories (name, description, color)
select 'Estudio Bíblico', 'Estudios profundos de la palabra', '#9333EA'
where not exists (select 1 from public.sermon_categories where name = 'Estudio Bíblico');

-- 5. Añadir category_id a la tabla sermons
alter table public.sermons 
add column if not exists category_id uuid references public.sermon_categories(id) on delete set null;
