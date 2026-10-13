create or replace function private.guard_about_learning_publication() returns trigger language plpgsql security invoker set search_path='' as $$
 declare draft public.about_learning_drafts;
 begin
 -- Null actor is reserved for trusted server-side seeds. Client roles remain constrained by grants/RLS.
 if (select auth.uid()) is not null then
  select * into strict draft from public.about_learning_drafts where slug=new.slug for update;
  if draft.status<>'review' or draft.revision<>new.revision then raise exception 'Solicita revisión de la versión actual antes de publicar.'; end if;
  if row(new.title,new.summary,new.author_label,new.content,new.sources) is distinct from row(draft.title,draft.summary,draft.author_label,draft.content #- '{audio,authorization}',draft.sources) then raise exception 'La publicación debe coincidir con el borrador revisado.'; end if;
  if length(trim(coalesce(new.reviewer_label,''))) not between 2 and 120 then raise exception 'Indica la firma pública del revisor.'; end if;
  new.reviewed_at:=now();
 end if;
 new.published_at:=now(); return new;
 end;
$$;

create or replace function public.publish_about_learning(target_slug text,expected_revision integer,signature text)
 returns public.about_learning_published language plpgsql security invoker set search_path='' as $$
 declare draft public.about_learning_drafts; published public.about_learning_published;
 begin
 if not private.can_review_about_learning() then raise exception 'Solo administración o pastores con permiso de páginas pueden publicar.' using errcode='42501'; end if;
 select * into strict draft from public.about_learning_drafts where slug=target_slug for update;
 if draft.revision<>expected_revision then raise exception 'El borrador cambió. Recarga antes de revisar.' using errcode='40001'; end if;
 if draft.status<>'review' then raise exception 'Primero solicita revisión del borrador guardado.'; end if;
 insert into public.about_learning_published(slug,title,summary,author_label,content,sources,revision,reviewer_label)
 values(draft.slug,draft.title,draft.summary,draft.author_label,draft.content #- '{audio,authorization}',draft.sources,draft.revision,signature)
 on conflict(slug) do update set title=excluded.title,summary=excluded.summary,author_label=excluded.author_label,content=excluded.content,sources=excluded.sources,revision=excluded.revision,reviewer_label=excluded.reviewer_label
 returning * into published;
 return published;
 end;
$$;

update public.about_learning_published set content=content #- '{audio,authorization}' where content->'audio' ? 'authorization';
