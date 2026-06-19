-- =======================================================
-- SCRIPT SQL: SERMONES Y CONFIGURACIÓN GLOBAL (CHURCH SETTINGS)
-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE
-- =======================================================

-- 1. Tabla de Configuración Global (church_settings)
create table if not exists public.church_settings (
  id integer primary key default 1 check (id = 1),
  phone text,
  email text,
  address text,
  google_maps_url text,
  bank_name text,
  bank_account text,
  ruc text,
  facebook_url text,
  instagram_url text,
  youtube_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para church_settings
alter table public.church_settings enable row level security;

-- Políticas de RLS para church_settings
drop policy if exists "Permitir lectura pública de church_settings" on public.church_settings;
create policy "Permitir lectura pública de church_settings"
  on public.church_settings for select
  using (true);

drop policy if exists "Permitir actualización de church_settings a administradores" on public.church_settings;
create policy "Permitir actualización de church_settings a administradores"
  on public.church_settings for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'pastor')
    )
  );

-- Insertar fila única inicial por defecto si no existe
insert into public.church_settings (
  id, phone, email, address, google_maps_url, bank_name, bank_account, ruc, facebook_url, instagram_url, youtube_url
) values (
  1,
  '+593 98 526 3122',
  'iece_jerusalen@hotmail.com',
  'Baquerizo Moreno entre Av. Colón y Tulcán, Milagro 09D1701',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.279860086782!2d-79.59600109999999!3d-2.1429994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x902d3bb4a3c10b77%3A0xe5a1b3be5d15c13f!2sBaquerizo%20Moreno%20%26%20Tulc%C3%A1n%2C%20Milagro!5e0!3m2!1ses-419!2sec!4v1700000000000',
  'Banco Guayaquil',
  '15830697',
  '0991437045001',
  'https://www.facebook.com/iece.jerusalen',
  'https://www.instagram.com/iece.jerusalen',
  'https://www.youtube.com/@iece.jerusalen'
)
on conflict (id) do nothing;

-- 2. Tabla de Sermones (sermons) - Asegurar columnas
create table if not exists public.sermons (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  pastor_name text not null default 'Pastor Principal',
  youtube_url text,
  description text,
  content text,
  date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para Sermones
alter table public.sermons enable row level security;

-- Políticas de RLS para Sermones
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

-- Si la tabla already existió, asegurar que tenga las columnas date y description
alter table public.sermons add column if not exists date date default current_date;
alter table public.sermons add column if not exists description text;
