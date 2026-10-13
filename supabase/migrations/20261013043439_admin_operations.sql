-- Preserve orders ownership and staff policies through the compatibility view.
alter view public.store_orders set (security_invoker = true);
alter function public.generate_donation_receipt_number() set search_path = '';
alter function public.assign_donation_receipt_number() set search_path = '';
alter function public.log_donation_changes() set search_path = '';
alter function public.touch_church_procurement_updated_at() set search_path = '';
alter function public.set_agenda_items_updated_at() set search_path = '';
-- Trigger functions are not public RPCs. Trigger execution is unaffected.
revoke execute on function public.log_donation_changes() from public, anon, authenticated;
revoke execute on function public.prepare_propresenter_command() from public, anon, authenticated;
revoke execute on function public.prevent_approved_space_booking_conflict() from public, anon, authenticated;

-- Internal follow-up stays with the original incoming request. No messages are sent.
alter table public.contact_messages
  add column assigned_to uuid references public.profiles(id) on delete set null,
  add column followup_stage text not null default 'new' check (followup_stage in ('new','contacted','scheduled','completed')),
  add column followup_due_at timestamptz,
  add column followup_notes text not null default '',
  add column followup_revision integer not null default 1;
create index contact_messages_assigned_due_idx on public.contact_messages(assigned_to, followup_due_at) where followup_stage <> 'completed';

create table public.contact_followup_history (
  id bigint generated always as identity primary key,
  contact_id uuid not null references public.contact_messages(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  stage text not null,
  assigned_to uuid,
  due_at timestamptz,
  created_at timestamptz not null default now()
);
create index contact_followup_history_contact_idx on public.contact_followup_history(contact_id,created_at desc);
create index contact_followup_history_actor_idx on public.contact_followup_history(actor_id);
alter table public.contact_followup_history enable row level security;
revoke all on public.contact_followup_history from anon, authenticated;
grant select on public.contact_followup_history to authenticated;
create policy followup_history_read on public.contact_followup_history for select to authenticated using (private.current_user_has_admin_permission('chat','view'));

create function private.audit_contact_followup() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.assigned_to is not null or new.followup_stage <> 'new' or new.followup_due_at is not null or new.followup_notes <> '' then
      raise exception 'Public submissions cannot assign internal follow-up';
    end if;
    new.followup_revision := 1;
    return new;
  end if;
  if row(new.assigned_to,new.followup_stage,new.followup_due_at,new.followup_notes) is distinct from row(old.assigned_to,old.followup_stage,old.followup_due_at,old.followup_notes) then
    if auth.uid() is null or not private.current_user_has_admin_permission('chat','edit') then raise exception 'Follow-up permission required' using errcode='42501'; end if;
    new.followup_revision := old.followup_revision + 1;
    insert into public.contact_followup_history(contact_id,actor_id,stage,assigned_to,due_at) values(new.id,auth.uid(),new.followup_stage,new.assigned_to,new.followup_due_at);
  else
    new.followup_revision := old.followup_revision;
  end if;
  return new;
end $$;
revoke all on function private.audit_contact_followup() from public,anon,authenticated;
create trigger contact_followup_audit before insert or update on public.contact_messages for each row execute function private.audit_contact_followup();

create function public.contact_followup_assignees() returns table(id uuid,label text) language sql stable security definer set search_path = '' as $$
  select p.id, coalesce(nullif(trim(concat_ws(' ',p.first_name,p.last_name)),''),'Responsable') as label from public.profiles p
  where auth.uid() is not null and private.current_user_has_admin_permission('chat','view') and coalesce(p.banned,false)=false
  and (p.role::text='admin' or 'admin'=any(coalesce(p.roles::text[],array[]::text[]))
    or coalesce((p.permissions_override->'chat'->>'edit')::boolean,false)
    or exists(select 1 from public.role_permissions rp where rp.role::text=any(array_prepend(p.role::text,coalesce(p.roles::text[],array[]::text[]))) and coalesce((rp.permissions->'chat'->>'edit')::boolean,false))
    or exists(select 1 from public.access_roles ar where ar.id=any(coalesce(p.custom_role_ids,'{}'::uuid[])) and ar.is_active and coalesce((ar.permissions->'chat'->>'edit')::boolean,false)))
  order by label limit 200
$$;
revoke all on function public.contact_followup_assignees() from public,anon;
grant execute on function public.contact_followup_assignees() to authenticated;

-- CRM previously granted every signed-in account all records. Use the existing module permission.
drop policy "Allow authenticated users to view crm contacts" on public.crm_contacts;
drop policy "Allow staff to manage crm contacts" on public.crm_contacts;
create policy crm_contacts_read on public.crm_contacts for select to authenticated using (private.current_user_has_admin_permission('crm_pipeline','view'));
create policy crm_contacts_insert on public.crm_contacts for insert to authenticated with check (private.current_user_has_admin_permission('crm_pipeline','edit'));
create policy crm_contacts_update on public.crm_contacts for update to authenticated using (private.current_user_has_admin_permission('crm_pipeline','edit')) with check (private.current_user_has_admin_permission('crm_pipeline','edit'));
create policy crm_contacts_delete on public.crm_contacts for delete to authenticated using (private.current_user_has_admin_permission('crm_pipeline','edit'));

create function public.can_check_site_health() returns boolean language sql stable security invoker set search_path = '' as $$
  select auth.uid() is not null and private.current_user_has_admin_permission('pages','view')
$$;
revoke all on function public.can_check_site_health() from public,anon;
grant execute on function public.can_check_site_health() to authenticated;

create table public.admin_security_checks (
  key text primary key,
  status text not null check(status in ('resolved','pending','reviewed')),
  summary text not null,
  source_url text not null check(source_url like 'https://%'),
  checked_at timestamptz not null default now()
);
alter table public.admin_security_checks enable row level security;
revoke all on public.admin_security_checks from anon,authenticated;
grant select on public.admin_security_checks to authenticated;
create policy security_checks_read on public.admin_security_checks for select to authenticated using (private.current_user_has_admin_permission('users','view'));

create table public.page_content_history (
 id bigint generated always as identity primary key,
 section_id text not null, snapshot jsonb not null,
 actor_id uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);
create index page_content_history_section_idx on public.page_content_history(section_id,created_at desc);
create index page_content_history_actor_idx on public.page_content_history(actor_id);
alter table public.page_content_history enable row level security;
revoke all on public.page_content_history from anon,authenticated;
grant select on public.page_content_history to authenticated;
create policy page_history_read on public.page_content_history for select to authenticated using (private.current_user_has_admin_permission('pages','view'));
create function private.audit_page_content() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' or tg_op='DELETE' then insert into public.page_content_history(section_id,snapshot,actor_id) values(old.id::text,to_jsonb(old),auth.uid()); end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
revoke all on function private.audit_page_content() from public,anon,authenticated;
create trigger page_content_audit before update or delete on public.page_contents for each row execute function private.audit_page_content();

drop policy "Allow authenticated users to view activities" on public.crm_activities;
drop policy "Allow staff to manage activities" on public.crm_activities;
create policy crm_activities_read on public.crm_activities for select to authenticated using (private.current_user_has_admin_permission('crm_pipeline','view'));
create policy crm_activities_write on public.crm_activities for insert to authenticated with check (private.current_user_has_admin_permission('crm_pipeline','edit') and created_by=auth.uid());

drop policy "Permitir gestión completa de page_contents a admin, pastor y e" on public.page_contents;
create policy page_content_insert on public.page_contents for insert to authenticated with check(private.current_user_has_admin_permission('pages','edit'));
create policy page_content_update on public.page_contents for update to authenticated using(private.current_user_has_admin_permission('pages','edit')) with check(private.current_user_has_admin_permission('pages','edit'));
create policy page_content_delete on public.page_contents for delete to authenticated using(private.current_user_has_admin_permission('pages','edit'));

create function public.reorder_page_sections(items jsonb) returns setof public.page_contents language plpgsql security invoker set search_path='' as $$
declare item jsonb; current_row public.page_contents;
begin
 if auth.uid() is null or not private.current_user_has_admin_permission('pages','edit') then raise exception 'Page permission required' using errcode='42501'; end if;
 if jsonb_typeof(items)<>'array' or jsonb_array_length(items)>100 then raise exception 'Invalid section list'; end if;
 for item in select value from jsonb_array_elements(items) loop
  select * into current_row from public.page_contents where id::text=item->>'id' for update;
  if not found or current_row.updated_at is distinct from (item->>'expected_updated_at')::timestamptz then raise exception 'Section changed; reload before reordering' using errcode='40001'; end if;
  update public.page_contents set order_index=(item->>'order_index')::integer,updated_at=now() where id=current_row.id returning * into current_row;
  return next current_row;
 end loop;
end $$;
revoke all on function public.reorder_page_sections(jsonb) from public,anon;
grant execute on function public.reorder_page_sections(jsonb) to authenticated;
