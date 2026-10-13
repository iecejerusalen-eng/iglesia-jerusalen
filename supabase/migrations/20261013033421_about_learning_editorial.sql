-- Editorial snapshots: drafts/history stay private, only published documents are public.
create table public.about_learning_drafts (
 slug text primary key check (slug in ('origen-cuadrangular','doctrina','simbolos','historia','himno')),
 title text not null check (length(title) between 1 and 180), summary text not null check (length(summary) between 1 and 500),
 author_label text not null check(length(author_label) between 1 and 120),
 content jsonb not null check(jsonb_typeof(content)='object' and content ? 'chapters' and content ? 'quiz' and content ? 'reflections' and jsonb_typeof(content->'chapters')='array' and jsonb_array_length(content->'chapters') between 1 and 20),
 sources jsonb not null check(jsonb_typeof(sources)='array' and jsonb_array_length(sources) between 1 and 20),
 status text not null default 'draft' check(status in ('draft','review')), review_notes text not null default '',
 revision integer not null default 1, updated_at timestamptz not null default now(), updated_by uuid references auth.users(id) on delete set null
);
create table public.about_learning_published (
 slug text primary key references public.about_learning_drafts(slug),
 title text not null, summary text not null, author_label text not null, content jsonb not null, sources jsonb not null,
 revision integer not null, published_at timestamptz not null default now(), reviewed_at timestamptz, reviewer_label text
);
create table public.about_learning_history (
 id bigint generated always as identity primary key, slug text not null, action text not null check(action in ('draft','review','published')),
 revision integer not null, snapshot jsonb not null, actor_id uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create index about_learning_history_slug_date on public.about_learning_history(slug,created_at desc);

create function private.can_review_about_learning() returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and private.current_user_has_admin_permission('pages','edit') and exists (
 select 1 from public.profiles p where p.id=(select auth.uid()) and p.banned is not true
 and (p.role::text in ('admin','pastor') or coalesce(p.roles::text[],array[]::text[]) && array['admin','pastor']));
$$;
revoke all on function private.can_review_about_learning() from public,anon;
grant execute on function private.can_review_about_learning() to authenticated;

alter table public.about_learning_drafts enable row level security;
alter table public.about_learning_published enable row level security;
alter table public.about_learning_history enable row level security;
revoke all on public.about_learning_drafts,public.about_learning_published,public.about_learning_history from anon,authenticated;
grant select,insert,update on public.about_learning_drafts to authenticated;
grant select on public.about_learning_published to anon,authenticated;
grant insert,update on public.about_learning_published to authenticated;
grant select on public.about_learning_history to authenticated;
create policy learning_drafts_read on public.about_learning_drafts for select to authenticated using ((select private.current_user_has_admin_permission('pages','view')));
create policy learning_drafts_insert on public.about_learning_drafts for insert to authenticated with check ((select private.current_user_has_admin_permission('pages','edit')));
create policy learning_drafts_update on public.about_learning_drafts for update to authenticated using ((select private.current_user_has_admin_permission('pages','edit'))) with check ((select private.current_user_has_admin_permission('pages','edit')));
create policy learning_public_read on public.about_learning_published for select to anon,authenticated using (true);
create policy learning_public_insert on public.about_learning_published for insert to authenticated with check ((select private.can_review_about_learning()));
create policy learning_public_update on public.about_learning_published for update to authenticated using ((select private.can_review_about_learning())) with check ((select private.can_review_about_learning()));
create policy learning_history_read on public.about_learning_history for select to authenticated using ((select private.current_user_has_admin_permission('pages','view')));

create function private.touch_about_learning_draft() returns trigger language plpgsql security invoker set search_path='' as $$
 begin
 if tg_op='UPDATE' then
  if new.slug<>old.slug then raise exception 'El destino de una lectura no puede cambiar.'; end if;
  new.revision:=old.revision+1;
  if row(new.title,new.summary,new.author_label,new.content,new.sources) is distinct from row(old.title,old.summary,old.author_label,old.content,old.sources) then new.status:='draft'; end if;
 else new.revision:=1; end if;
 new.updated_at:=now(); new.updated_by:=(select auth.uid()); return new;
 end;
$$;
revoke all on function private.touch_about_learning_draft() from public,anon,authenticated;
create trigger about_learning_draft_touch before insert or update on public.about_learning_drafts for each row execute function private.touch_about_learning_draft();

create function private.guard_about_learning_publication() returns trigger language plpgsql security invoker set search_path='' as $$
 declare draft public.about_learning_drafts;
 begin
 -- Null actor is reserved for trusted server-side seeds. Client roles remain constrained by grants/RLS.
 if (select auth.uid()) is not null then
  select * into strict draft from public.about_learning_drafts where slug=new.slug for update;
  if draft.status<>'review' or draft.revision<>new.revision then raise exception 'Solicita revisión de la versión actual antes de publicar.'; end if;
  if row(new.title,new.summary,new.author_label,new.content,new.sources) is distinct from row(draft.title,draft.summary,draft.author_label,draft.content,draft.sources) then raise exception 'La publicación debe coincidir con el borrador revisado.'; end if;
  if length(trim(coalesce(new.reviewer_label,''))) not between 2 and 120 then raise exception 'Indica la firma pública del revisor.'; end if;
  new.reviewed_at:=now();
 end if;
 new.published_at:=now(); return new;
 end;
$$;
revoke all on function private.guard_about_learning_publication() from public,anon,authenticated;
create trigger about_learning_publish_guard before insert or update on public.about_learning_published for each row execute function private.guard_about_learning_publication();

create function private.audit_about_learning() returns trigger language plpgsql security definer set search_path='' as $$
 declare audit_action text;
 begin
 if tg_table_name='about_learning_published' then audit_action:='published'; else audit_action:=new.status; end if;
 insert into public.about_learning_history(slug,action,revision,snapshot,actor_id)
 values(new.slug,audit_action,new.revision,to_jsonb(new),(select auth.uid()));
 return new;
 end;
$$;
revoke all on function private.audit_about_learning() from public,anon,authenticated;
create trigger about_learning_draft_audit after insert or update on public.about_learning_drafts for each row execute function private.audit_about_learning();
create trigger about_learning_public_audit after insert or update on public.about_learning_published for each row execute function private.audit_about_learning();

create function public.publish_about_learning(target_slug text,expected_revision integer,signature text)
 returns public.about_learning_published language plpgsql security invoker set search_path='' as $$
 declare draft public.about_learning_drafts; published public.about_learning_published;
 begin
 if not private.can_review_about_learning() then raise exception 'Solo administración o pastores con permiso de páginas pueden publicar.' using errcode='42501'; end if;
 select * into strict draft from public.about_learning_drafts where slug=target_slug for update;
 if draft.revision<>expected_revision then raise exception 'El borrador cambió. Recarga antes de revisar.' using errcode='40001'; end if;
 if draft.status<>'review' then raise exception 'Primero solicita revisión del borrador guardado.'; end if;
 insert into public.about_learning_published(slug,title,summary,author_label,content,sources,revision,reviewer_label)
 values(draft.slug,draft.title,draft.summary,draft.author_label,draft.content,draft.sources,draft.revision,signature)
 on conflict(slug) do update set title=excluded.title,summary=excluded.summary,author_label=excluded.author_label,content=excluded.content,sources=excluded.sources,revision=excluded.revision,reviewer_label=excluded.reviewer_label
 returning * into published;
 return published;
 end;
$$;
revoke all on function public.publish_about_learning(text,integer,text) from public,anon;
grant execute on function public.publish_about_learning(text,integer,text) to authenticated;
