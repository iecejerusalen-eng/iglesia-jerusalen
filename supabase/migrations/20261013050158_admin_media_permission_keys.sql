-- The existing LMS permission is programs (not courses).
create or replace function private.can_use_media_library(capability text) returns boolean language sql stable security invoker set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from unnest(array['media_vault','pages','editorial','sermons','ministries','events','products','programs']) module where private.current_user_has_admin_permission(module,capability))
$$;
create index media_vault_metadata_lookup_idx on public.media_vault_files using gin(metadata jsonb_path_ops);
