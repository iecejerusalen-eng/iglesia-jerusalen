-- Boletín dominical automático. La migración es idempotente para instalaciones existentes.
create table if not exists public.versiculos_semana (
  id uuid primary key default gen_random_uuid(),
  semana integer not null check (semana between 1 and 53),
  texto text not null,
  referencia text not null,
  created_at timestamptz not null default now(),
  unique (semana)
);

create table if not exists public.boletines (
  id uuid primary key default gen_random_uuid(),
  fecha_culto date not null unique,
  titulo_mensaje text,
  expositor text,
  versiculo_texto text,
  versiculo_referencia text,
  eventos jsonb not null default '[]'::jsonb,
  anuncio_titulo text,
  anuncio_descripcion text,
  cumpleaneros jsonb not null default '[]'::jsonb,
  ofrendas_objetivo text,
  mensaje_pastoral text,
  foto_pastor text,
  estado text not null default 'borrador' check (estado in ('borrador', 'aprobado', 'enviado')),
  generado_automaticamente boolean not null default true,
  aprobado_por uuid references auth.users(id) on delete set null,
  aprobado_at timestamptz,
  url_pdf text,
  url_imagen_wa text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists boletines_fecha_culto_idx on public.boletines (fecha_culto desc);
create index if not exists boletines_estado_idx on public.boletines (estado);
create index if not exists versiculos_semana_semana_idx on public.versiculos_semana (semana);

create or replace function public.touch_boletines_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists boletines_updated_at on public.boletines;
create trigger boletines_updated_at
before update on public.boletines
for each row execute function public.touch_boletines_updated_at();

alter table public.versiculos_semana enable row level security;
alter table public.boletines enable row level security;

drop policy if exists "versiculos_read_authenticated" on public.versiculos_semana;
create policy "versiculos_read_authenticated" on public.versiculos_semana
for select to authenticated using (true);

drop policy if exists "versiculos_manage_admin" on public.versiculos_semana;
create policy "versiculos_manage_admin" on public.versiculos_semana
for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'pastor', 'secretary', 'secretaria')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'pastor', 'secretary', 'secretaria')));

drop policy if exists "boletines_read_staff" on public.boletines;
create policy "boletines_read_staff" on public.boletines
for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'pastor', 'secretary', 'secretaria', 'leader')));

drop policy if exists "boletines_manage_staff" on public.boletines;
create policy "boletines_manage_staff" on public.boletines
for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'pastor', 'secretary', 'secretaria')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'pastor', 'secretary', 'secretaria')));

-- Habilita actualizaciones de preview para el panel sin polling.
alter table public.boletines replica identity full;
do $$
begin
  alter publication supabase_realtime add table public.boletines;
exception when duplicate_object then
  null;
end $$;
