-- Music workspace: canonical metadata, publishing workflow, search and version history.
-- Existing songs remain published and retain their legacy lyrics/structure_blocks payloads.

alter table public.songs
  add column if not exists slug text,
  add column if not exists original_key text,
  add column if not exists preferred_accidentals text not null default 'auto',
  add column if not exists capo smallint not null default 0,
  add column if not exists time_signature text not null default '4/4',
  add column if not exists language text not null default 'es',
  add column if not exists duration_seconds integer,
  add column if not exists composers text[] not null default '{}'::text[],
  add column if not exists copyright_notice text,
  add column if not exists release_year smallint,
  add column if not exists status text not null default 'published',
  add column if not exists published_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid references public.profiles(id) on delete set null,
  add column if not exists document_version integer not null default 1,
  add column if not exists search_vector tsvector generated always as (
    to_tsvector(
      'simple'::regconfig,
      coalesce(title, '') || ' ' || coalesce(artist, '') || ' ' || coalesce(lyrics, '')
    )
  ) stored;

-- Deterministic, unique compatibility slugs for the existing catalog.
update public.songs
set slug = trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'))
  || '-' || left(id::text, 8)
where slug is null or btrim(slug) = '';

update public.songs
set published_at = coalesce(published_at, created_at, now())
where status = 'published';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'songs_slug_unique' and conrelid = 'public.songs'::regclass
  ) then
    alter table public.songs add constraint songs_slug_unique unique (slug);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'songs_original_key_check' and conrelid = 'public.songs'::regclass
  ) then
    alter table public.songs add constraint songs_original_key_check
      check (original_key is null or original_key ~ '^[A-G](#|b)?$') not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'songs_accidentals_check' and conrelid = 'public.songs'::regclass
  ) then
    alter table public.songs add constraint songs_accidentals_check
      check (preferred_accidentals in ('auto', 'sharp', 'flat')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'songs_capo_check' and conrelid = 'public.songs'::regclass
  ) then
    alter table public.songs add constraint songs_capo_check check (capo between 0 and 12) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'songs_time_signature_check' and conrelid = 'public.songs'::regclass
  ) then
    alter table public.songs add constraint songs_time_signature_check
      check (time_signature ~ '^[0-9]{1,2}/[0-9]{1,2}$') not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'songs_status_check' and conrelid = 'public.songs'::regclass
  ) then
    alter table public.songs add constraint songs_status_check
      check (status in ('draft', 'review', 'published', 'archived')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'songs_release_year_check' and conrelid = 'public.songs'::regclass
  ) then
    alter table public.songs add constraint songs_release_year_check
      check (release_year is null or release_year between 1500 and 2200) not valid;
  end if;
end $$;

create index if not exists songs_status_title_idx on public.songs (status, title);
create index if not exists songs_type_status_idx on public.songs (type_id, status);
create index if not exists songs_style_status_idx on public.songs (style_id, status);
create index if not exists songs_updated_by_idx on public.songs (updated_by) where updated_by is not null;
create index if not exists songs_search_vector_idx on public.songs using gin (search_vector);
create index if not exists songs_structure_blocks_idx on public.songs using gin (structure_blocks jsonb_path_ops);

create table if not exists public.song_versions (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint song_versions_number_positive check (version_number > 0),
  constraint song_versions_song_version_unique unique (song_id, version_number)
);

create index if not exists song_versions_song_created_idx
  on public.song_versions (song_id, created_at desc);
create index if not exists song_versions_changed_by_idx
  on public.song_versions (changed_by) where changed_by is not null;

alter table public.song_versions enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.songs to anon, authenticated;
grant insert, update, delete on public.songs to authenticated;
grant select on public.song_versions to authenticated;
revoke insert, update, delete on public.song_versions from anon, authenticated;

drop policy if exists "Consolidated read access" on public.songs;
drop policy if exists "Public can read published songs" on public.songs;
drop policy if exists "Song editors can read all songs" on public.songs;
drop policy if exists "Consolidated manage access insert" on public.songs;
drop policy if exists "Consolidated manage access update" on public.songs;
drop policy if exists "Consolidated manage access delete" on public.songs;

create policy "Public can read published songs"
  on public.songs for select
  to anon, authenticated
  using (status = 'published');

create policy "Song editors can read all songs"
  on public.songs for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and role::text in ('admin', 'pastor', 'editor', 'maestro', 'multimedia', 'leader')
    )
  );

create policy "Song editors can insert songs"
  on public.songs for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and role::text in ('admin', 'pastor', 'editor', 'maestro', 'multimedia', 'leader')
    )
  );

create policy "Song editors can update songs"
  on public.songs for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and role::text in ('admin', 'pastor', 'editor', 'maestro', 'multimedia', 'leader')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and role::text in ('admin', 'pastor', 'editor', 'maestro', 'multimedia', 'leader')
    )
  );

create policy "Song editors can delete songs"
  on public.songs for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and role::text in ('admin', 'pastor', 'editor', 'maestro', 'leader')
    )
  );

drop policy if exists "Song editors can read versions" on public.song_versions;
create policy "Song editors can read versions"
  on public.song_versions for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and role::text in ('admin', 'pastor', 'editor', 'maestro', 'multimedia', 'leader')
    )
  );

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.ensure_song_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.slug is null or btrim(new.slug) = '' then
    new.slug := trim(both '-' from regexp_replace(lower(new.title), '[^a-z0-9]+', '-', 'g'));
  end if;
  if exists (select 1 from public.songs where slug = new.slug and id <> new.id) then
    new.slug := new.slug || '-' || left(new.id::text, 8);
  end if;
  return new;
end;
$$;

revoke execute on function private.ensure_song_slug() from public, anon, authenticated;

drop trigger if exists songs_ensure_slug on public.songs;
create trigger songs_ensure_slug
before insert or update of slug on public.songs
for each row execute function private.ensure_song_slug();

create or replace function private.capture_song_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.song_versions (song_id, version_number, snapshot, changed_by)
  values (old.id, old.document_version, to_jsonb(old), (select auth.uid()));

  new.document_version := old.document_version + 1;
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end;
$$;

revoke execute on function private.capture_song_version() from public, anon, authenticated;

drop trigger if exists songs_capture_version on public.songs;
create trigger songs_capture_version
before update on public.songs
for each row execute function private.capture_song_version();

comment on column public.songs.original_key is 'Explicit concert key used for transposition, Nashville notation and generated harmony scores.';
comment on column public.songs.structure_blocks is 'Canonical ordered song document. Legacy lyrics remains available during migration.';
comment on table public.song_versions is 'Immutable song snapshots created automatically before every update.';
