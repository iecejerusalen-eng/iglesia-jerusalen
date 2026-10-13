-- Overrides are authoritative for non-administrators, matching authService.
create function private.profile_has_admin_permission(target_user uuid,module_key text,capability_key text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=target_user and p.banned is not true and
 case
  when p.role::text in ('admin','superadmin') or coalesce(p.roles::text[],array[]::text[]) && array['admin','superadmin'] then true
  when p.permissions_override is not null then coalesce((p.permissions_override->module_key->>capability_key)::boolean,module_key='dashboard' and capability_key='view')
  else (module_key='dashboard' and capability_key='view') or exists(select 1 from public.role_permissions rp where rp.role::text=any(array_prepend(p.role::text,coalesce(p.roles::text[],array[]::text[]))) and coalesce((rp.permissions->module_key->>capability_key)::boolean,false))
   or exists(select 1 from public.access_roles ar where ar.id=any(coalesce(p.custom_role_ids,'{}'::uuid[])) and ar.is_active and coalesce((ar.permissions->module_key->>capability_key)::boolean,false))
 end)
$$;
revoke all on function private.profile_has_admin_permission(uuid,text,text) from public,anon,authenticated;
create or replace function private.current_user_has_admin_permission(module_key text,capability_key text default 'edit') returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and private.profile_has_admin_permission(auth.uid(),module_key,capability_key)
$$;
create or replace function public.contact_followup_assignees() returns table(id uuid,label text) language sql stable security definer set search_path='' as $$
 select p.id,coalesce(nullif(trim(concat_ws(' ',p.first_name,p.last_name)),''),'Responsable') as label
 from public.profiles p where auth.uid() is not null and private.current_user_has_admin_permission('chat','view') and private.profile_has_admin_permission(p.id,'chat','edit') order by label limit 200
$$;

-- Close equivalent CRM read paths; preserve the established module boundaries.
drop policy "Allow authenticated users to view crm pipelines" on public.crm_pipelines;
drop policy "Allow admin to manage crm pipelines" on public.crm_pipelines;
create policy crm_pipelines_read on public.crm_pipelines for select to authenticated using(private.current_user_has_admin_permission('crm_pipeline','view'));
create policy crm_pipelines_manage on public.crm_pipelines for all to authenticated using(private.current_user_has_admin_permission('crm_pipeline','edit')) with check(private.current_user_has_admin_permission('crm_pipeline','edit'));
drop policy "Allow admin to view workflows" on public.workflows;
drop policy "Allow admin to manage workflows" on public.workflows;
create policy workflows_read on public.workflows for select to authenticated using(private.current_user_has_admin_permission('workflows_automations','view'));
create policy workflows_manage on public.workflows for all to authenticated using(private.current_user_has_admin_permission('workflows_automations','edit')) with check(private.current_user_has_admin_permission('workflows_automations','edit'));
drop policy "Allow staff to view workflow executions" on public.workflow_executions;
create policy workflow_executions_read on public.workflow_executions for select to authenticated using(private.current_user_has_admin_permission('workflows_automations','view'));

-- Shared public media is writable by authorized content editors; private storage has its own permission.
create function private.can_use_media_library(capability text) returns boolean language sql stable security invoker set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from unnest(array['media_vault','pages','editorial','sermons','ministries','events','products','courses']) module where private.current_user_has_admin_permission(module,capability))
$$;
revoke all on function private.can_use_media_library(text) from public,anon;
grant execute on function private.can_use_media_library(text) to authenticated;
drop policy media_vault_read on public.media_vault_files;
drop policy media_vault_manage_insert on public.media_vault_files;
drop policy media_vault_manage_update on public.media_vault_files;
drop policy media_vault_manage_delete on public.media_vault_files;
create policy media_catalog_read on public.media_vault_files for select to authenticated using(private.can_use_media_library('view') or private.can_use_media_library('edit'));
create policy media_catalog_insert on public.media_vault_files for insert to authenticated with check(private.can_use_media_library('edit') and uploaded_by=auth.uid());
create policy media_catalog_update on public.media_vault_files for update to authenticated using(private.can_use_media_library('edit')) with check(private.can_use_media_library('edit'));
create policy media_catalog_delete on public.media_vault_files for delete to authenticated using(private.can_use_media_library('edit'));
drop policy "Acceso total a media_vault para Admin y Multimedia" on storage.objects;
create policy media_private_read on storage.objects for select to authenticated using(bucket_id='media_vault' and private.current_user_has_admin_permission('media_vault','view'));
create policy media_private_manage on storage.objects for all to authenticated using(bucket_id='media_vault' and private.current_user_has_admin_permission('media_vault','edit')) with check(bucket_id='media_vault' and private.current_user_has_admin_permission('media_vault','edit'));
drop policy media_library_staff_insert on storage.objects;
drop policy media_library_staff_delete on storage.objects;
create policy media_library_staff_insert on storage.objects for insert to authenticated with check(bucket_id='media_library' and private.can_use_media_library('edit'));
create policy media_library_staff_delete on storage.objects for delete to authenticated using(bucket_id='media_library' and private.can_use_media_library('edit'));
