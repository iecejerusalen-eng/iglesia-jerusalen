-- Actual production policies exercised in a rollback-only transaction.
begin;
create temp table admin_test_identity as select id from public.profiles where banned is not true and role::text='admin' limit 1;
create temp table readonly_test_identity as select id from public.profiles where banned is not true and role::text not in ('admin','superadmin') and not ('admin'=any(coalesce(roles::text[],array[]::text[]))) limit 1;
insert into public.orders(id,user_id,customer_name,customer_email,total) values('00000000-0000-0000-0000-000000000071',(select id from readonly_test_identity),'QA rollback','qa@example.invalid',0);
insert into public.contact_messages(id,name,email,subject,message) values('00000000-0000-0000-0000-000000000070','QA rollback','qa@example.invalid','Planifica tu visita','Synthetic test; rolled back');
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$ begin
 if exists(select 1 from public.store_orders) or exists(select 1 from public.orders) then raise exception 'Anonymous order leak'; end if;
 begin perform 1 from public.page_content_history; raise exception 'Anonymous history leak'; exception when insufficient_privilege then null; end;
 begin perform 1 from public.admin_security_checks; raise exception 'Anonymous security details'; exception when insufficient_privilege then null; end;
 begin perform public.contact_followup_assignees(); raise exception 'Anonymous assignee access'; exception when insufficient_privilege then null; end;
 begin insert into public.contact_messages(name,email,subject,message,followup_stage) values('QA','qa@example.invalid','QA','QA','completed'); raise exception 'Forged follow-up accepted'; exception when raise_exception then if sqlerrm='Forged follow-up accepted' then raise; end if; end;
 insert into public.contact_messages(name,email,subject,message) values('QA rollback','qa@example.invalid','QA','Synthetic public form');
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001"}',true);
set local role authenticated;
do $$ declare affected integer; begin
 if exists(select 1 from public.store_orders) or exists(select 1 from public.crm_contacts) or exists(select 1 from public.crm_activities) then raise exception 'Unprivileged data leak'; end if;
 if exists(select 1 from public.workflow_executions) or exists(select 1 from public.media_vault_files) then raise exception 'Equivalent private read path';end if;
 if (select count(*) from public.contact_followup_assignees())<>0 then raise exception 'Unprivileged assignee access'; end if;
 update public.contact_messages set followup_stage='completed'; get diagnostics affected=row_count;if affected<>0 then raise exception 'Unprivileged follow-up write';end if;
 update public.crm_contacts set stage_id='member';get diagnostics affected=row_count;if affected<>0 then raise exception 'Unprivileged CRM write';end if;
 if public.can_check_site_health() then raise exception 'Unprivileged health access'; end if;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',(select id from admin_test_identity))::text,true);
set local role authenticated;
do $$ declare affected integer; first_revision integer; section_row public.page_contents; begin
 if not private.current_user_has_admin_permission('chat','edit') then raise exception 'Admin fixture missing'; end if;
 if (select count(*) from public.store_orders)<>(select count(*) from public.orders) then raise exception 'Staff order compatibility'; end if;
 update public.contact_messages set followup_stage='contacted',followup_due_at=now(),assigned_to=auth.uid() where id='00000000-0000-0000-0000-000000000070' returning followup_revision into first_revision;
 if first_revision<>2 then raise exception 'Follow-up revision missing'; end if;
 if (select count(*) from public.contact_followup_history where contact_id='00000000-0000-0000-0000-000000000070')<>1 then raise exception 'Follow-up audit missing'; end if;
 update public.contact_messages set followup_stage='completed' where id='00000000-0000-0000-0000-000000000070' and followup_revision=1;get diagnostics affected=row_count;if affected<>0 then raise exception 'Stale update accepted';end if;
 begin delete from public.contact_followup_history;raise exception 'Audit deletion accepted';exception when insufficient_privilege then null;end;
 select * into strict section_row from public.page_contents limit 1;
 begin perform public.reorder_page_sections(jsonb_build_array(jsonb_build_object('id',section_row.id,'order_index',section_row.order_index,'expected_updated_at','2000-01-01T00:00:00Z')));raise exception 'Stale page order accepted';exception when serialization_failure then null;end;
 perform public.reorder_page_sections(jsonb_build_array(jsonb_build_object('id',section_row.id,'order_index',section_row.order_index,'expected_updated_at',section_row.updated_at)));
 if not exists(select 1 from public.page_content_history where section_id=section_row.id::text and snapshot->>'title'=section_row.title) then raise exception 'Page snapshot missing'; end if;
 begin delete from public.page_content_history;raise exception 'Page history deletion accepted';exception when insufficient_privilege then null;end;
 if not public.can_check_site_health() then raise exception 'Staff health access'; end if;
end $$;
reset role;
-- A non-admin identity avoids altering the last active administrator, even in a rollback.
update public.role_permissions set permissions=coalesce(permissions,'{}'::jsonb)||'{"crm_pipeline":{"view":true,"edit":true},"pages":{"view":true,"edit":true},"propresenter":{"view":true,"edit":true}}'::jsonb where role::text='guest';
update public.profiles set role='guest',roles='{}',custom_role_ids='{}',permissions_override='{"chat":{"view":true,"edit":false},"pages":{"view":true,"edit":false},"crm_pipeline":{"view":false,"edit":false}}' where id=(select id from readonly_test_identity);
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',(select id from readonly_test_identity))::text,true);
set local role authenticated;
do $$ declare affected integer;begin
 if not private.current_user_has_admin_permission('chat','view') or private.current_user_has_admin_permission('chat','edit') then raise exception 'Readonly fixture invalid';end if;
 if not exists(select 1 from public.store_orders where id='00000000-0000-0000-0000-000000000071') then raise exception 'Order owner access lost';end if;
 if (select count(*) from public.store_orders)<>(select count(*) from public.orders) then raise exception 'Owner alias mismatch';end if;
 if private.current_user_has_admin_permission('crm_pipeline','edit') or private.current_user_has_admin_permission('pages','edit') then raise exception 'Inherited permission bypassed explicit denial';end if;
 if public.current_user_can_propresenter('edit') then raise exception 'ProPresenter wrapper bypassed the authoritative override';end if;
 if not exists(select 1 from public.contact_messages where id='00000000-0000-0000-0000-000000000070') then raise exception 'Readonly consultation denied';end if;
 update public.contact_messages set followup_stage='completed' where id='00000000-0000-0000-0000-000000000070';get diagnostics affected=row_count;if affected<>0 then raise exception 'Readonly edit accepted';end if;
end $$;
reset role;
rollback;
select 'PASS: anonymous, unprivileged, staff and readonly isolation; follow-up conflict/audit; page conflict/history; public form preserved; rollback complete' as result;
