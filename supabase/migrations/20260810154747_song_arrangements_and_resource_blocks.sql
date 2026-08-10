-- Named arrangements allow one worship song to have several church-specific
-- keys, lyrics, tempos, capo positions and musician resources.

create table public.song_arrangements (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  is_default boolean not null default false,
  status text not null default 'draft',
  original_key text,
  preferred_accidentals text not null default 'auto',
  capo smallint not null default 0,
  bpm smallint,
  time_signature text not null default '4/4',
  lyrics text not null default '',
  structure_blocks jsonb not null default '[]'::jsonb,
  resource_links jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint song_arrangements_song_slug_unique unique (song_id, slug),
  constraint song_arrangements_name_not_blank check (btrim(name) <> ''),
  constraint song_arrangements_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint song_arrangements_status_check check (status in ('draft', 'review', 'published', 'archived')),
  constraint song_arrangements_key_check check (original_key is null or original_key ~ '^[A-G](#|b)?$'),
  constraint song_arrangements_accidentals_check check (preferred_accidentals in ('auto', 'sharp', 'flat')),
  constraint song_arrangements_capo_check check (capo between 0 and 12),
  constraint song_arrangements_bpm_check check (bpm is null or bpm between 30 and 300),
  constraint song_arrangements_time_signature_check check (time_signature ~ '^[0-9]{1,2}/[0-9]{1,2}$'),
  constraint song_arrangements_blocks_array_check check (jsonb_typeof(structure_blocks) = 'array'),
  constraint song_arrangements_links_array_check check (jsonb_typeof(resource_links) = 'array')
);

create index song_arrangements_song_status_name_idx
  on public.song_arrangements (song_id, status, name);
create index song_arrangements_created_by_idx
  on public.song_arrangements (created_by) where created_by is not null;
create index song_arrangements_updated_by_idx
  on public.song_arrangements (updated_by) where updated_by is not null;
create index song_arrangements_blocks_gin_idx
  on public.song_arrangements using gin (structure_blocks jsonb_path_ops);
create unique index song_arrangements_one_default_idx
  on public.song_arrangements (song_id) where is_default;

alter table public.song_arrangements enable row level security;

grant select on public.song_arrangements to anon, authenticated;
grant insert, update, delete on public.song_arrangements to authenticated;

create policy "Public can read published song arrangements"
  on public.song_arrangements for select
  to anon, authenticated
  using (status = 'published');

create policy "Song editors can read all arrangements"
  on public.song_arrangements for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and role::text in ('admin', 'pastor', 'editor', 'maestro', 'multimedia', 'leader')
    )
  );

create policy "Song editors can insert arrangements"
  on public.song_arrangements for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and role::text in ('admin', 'pastor', 'editor', 'maestro', 'multimedia', 'leader')
    )
  );

create policy "Song editors can update arrangements"
  on public.song_arrangements for update
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

create policy "Song editors can delete arrangements"
  on public.song_arrangements for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and role::text in ('admin', 'pastor', 'editor', 'maestro', 'leader')
    )
  );

create or replace function private.touch_song_arrangement()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, (select auth.uid()));
  end if;
  return new;
end;
$$;

revoke execute on function private.touch_song_arrangement() from public, anon, authenticated;

create trigger song_arrangements_touch_metadata
before insert or update on public.song_arrangements
for each row execute function private.touch_song_arrangement();

create or replace function public.set_default_song_arrangement(target_arrangement_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_song_id uuid;
begin
  select song_id into target_song_id
  from public.song_arrangements
  where id = target_arrangement_id;

  if target_song_id is null then
    raise exception 'Arrangement not found';
  end if;

  update public.song_arrangements
  set is_default = false
  where song_id = target_song_id and is_default;

  update public.song_arrangements
  set is_default = true
  where id = target_arrangement_id;
end;
$$;

revoke all on function public.set_default_song_arrangement(uuid) from public, anon;
grant execute on function public.set_default_song_arrangement(uuid) to authenticated;

comment on table public.song_arrangements is 'Named playable versions of a canonical worship song, including alternate lyrics, key, tempo, capo and resources.';
