create extension if not exists pgcrypto;

create table if not exists public.changelog_versiones (
  id uuid primary key default gen_random_uuid(), version text not null, titulo text not null,
  resumen text not null, fecha_lanzamiento date not null, estado text not null default 'borrador' check (estado in ('borrador','publicado')),
  es_mayor boolean not null default false, imagen_portada text, color_acento text not null default '#1e1558',
  autor_id uuid references auth.users(id), autor_nombre text, vistas integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.changelog_cambios (
  id uuid primary key default gen_random_uuid(), version_id uuid not null references public.changelog_versiones(id) on delete cascade,
  tipo text not null check (tipo in ('nuevo','mejora','correccion','eliminado','seguridad','rendimiento')), titulo text not null,
  descripcion text not null, descripcion_tecnica text, link_interno text, link_texto text, link_externo text,
  imagen_url text, video_url text, departamento text, es_destacado boolean not null default false, orden integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.changelog_reacciones (
  id uuid primary key default gen_random_uuid(), version_id uuid not null references public.changelog_versiones(id) on delete cascade,
  sesion_id text not null, emoji text not null check (emoji in ('🙌','🔥','❤️','🤔','👏')), created_at timestamptz not null default now(),
  unique(version_id, sesion_id, emoji)
);
create table if not exists public.changelog_suscriptores (
  id uuid primary key default gen_random_uuid(), email text unique not null, nombre text, activo boolean not null default true,
  token_baja text not null default gen_random_uuid()::text, created_at timestamptz not null default now()
);
create index if not exists changelog_versiones_fecha_idx on public.changelog_versiones(fecha_lanzamiento desc);
create index if not exists changelog_versiones_estado_idx on public.changelog_versiones(estado);
create index if not exists changelog_cambios_version_orden_idx on public.changelog_cambios(version_id, orden);
create index if not exists changelog_cambios_tipo_idx on public.changelog_cambios(tipo);

alter table public.changelog_versiones enable row level security;
alter table public.changelog_cambios enable row level security;
alter table public.changelog_reacciones enable row level security;
alter table public.changelog_suscriptores enable row level security;
create policy changelog_public_read_versions on public.changelog_versiones for select to anon, authenticated using (estado = 'publicado');
create policy changelog_public_read_changes on public.changelog_cambios for select to anon, authenticated using (exists (select 1 from public.changelog_versiones v where v.id = version_id and v.estado = 'publicado'));
create policy changelog_public_insert_reactions on public.changelog_reacciones for insert to anon, authenticated with check (length(sesion_id) between 16 and 128);
create policy changelog_public_read_reactions on public.changelog_reacciones for select to anon, authenticated using (true);
create policy changelog_public_insert_subscribers on public.changelog_suscriptores for insert to anon, authenticated with check (length(email) between 5 and 320);
create policy changelog_admin_all_versions on public.changelog_versiones for all to authenticated using ((select auth.jwt()->'app_metadata'->>'rol') in ('admin','pastor','superadmin')) with check ((select auth.jwt()->'app_metadata'->>'rol') in ('admin','pastor','superadmin'));
create policy changelog_admin_all_changes on public.changelog_cambios for all to authenticated using ((select auth.jwt()->'app_metadata'->>'rol') in ('admin','pastor','superadmin')) with check ((select auth.jwt()->'app_metadata'->>'rol') in ('admin','pastor','superadmin'));
