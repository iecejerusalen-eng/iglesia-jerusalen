-- Transactional permission/workflow assertions. No test changes survive rollback.
begin;
create temp table learning_test_baseline as select slug,title,revision from public.about_learning_published;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$ begin
 if (select count(*) from public.about_learning_published)<>5 then raise exception 'Public documents missing'; end if;
 if exists(select 1 from public.about_learning_published where content->'audio' ? 'authorization') then raise exception 'Private audio note exposed'; end if;
 begin perform 1 from public.about_learning_drafts; raise exception 'Anonymous drafts unexpectedly allowed'; exception when insufficient_privilege then null; end;
 begin perform 1 from public.about_learning_history; raise exception 'Anonymous history unexpectedly allowed'; exception when insufficient_privilege then null; end;
 begin perform public.publish_about_learning('doctrina',1,'Test'); raise exception 'Anonymous publish unexpectedly allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001"}',true);
set local role authenticated;
do $$ declare affected integer; begin
 if exists(select 1 from public.about_learning_drafts) then raise exception 'Unprivileged draft access'; end if;
 update public.about_learning_published set title='Forbidden' where slug='doctrina'; get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Unprivileged update'; end if;
 update public.about_learning_drafts set title='Forbidden' where slug='doctrina'; get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Unprivileged draft update'; end if;
 begin perform public.publish_about_learning('doctrina',1,'Test'); raise exception 'Unprivileged publish'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',(select id from public.profiles where banned is not true and (role::text='admin' or 'admin'=any(coalesce(roles::text[],array[]::text[]))) limit 1))::text,true);
set local role authenticated;
do $$ declare initial public.about_learning_drafts; saved public.about_learning_drafts; reviewed public.about_learning_drafts; pub public.about_learning_published; before_count bigint; begin
 if not private.can_review_about_learning() then raise exception 'Admin fixture unavailable'; end if;
 select * into strict initial from public.about_learning_drafts where slug='himno';
 select count(*) into before_count from public.about_learning_history where slug='himno';
 update public.about_learning_drafts set title=title||' · prueba transaccional',status='review' where slug='himno' returning * into saved;
 if saved.revision<>initial.revision+1 or saved.status<>'draft' then raise exception 'Editing must reset review and increment revision'; end if;
 if (select title from public.about_learning_published where slug='himno')=saved.title then raise exception 'Draft leaked into published snapshot'; end if;
 begin perform public.publish_about_learning('himno',initial.revision,'Prueba'); raise exception 'Stale revision accepted'; exception when serialization_failure then null; end;
 begin perform public.publish_about_learning('himno',saved.revision,'Prueba'); raise exception 'Draft published without review'; exception when raise_exception then if sqlerrm='Draft published without review' then raise; end if; end;
 update public.about_learning_drafts set status='review' where slug='himno' returning * into reviewed;
 select * into pub from public.publish_about_learning('himno',reviewed.revision,'Prueba transaccional');
 if pub.title<>reviewed.title or pub.reviewed_at is null or pub.revision<>reviewed.revision then raise exception 'Review publication failed'; end if;
 if pub.content->'audio' ? 'authorization' then raise exception 'Private authorization leaked'; end if;
 if (select count(*) from public.about_learning_history where slug='himno')<>before_count+3 then raise exception 'Audit trail incomplete'; end if;
 begin delete from public.about_learning_history where slug='himno'; raise exception 'Audit deletion allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: anonymous and unprivileged isolation, admin revision conflict, review gate, atomic publication, private media metadata, immutable audit; rollback complete' as result;
