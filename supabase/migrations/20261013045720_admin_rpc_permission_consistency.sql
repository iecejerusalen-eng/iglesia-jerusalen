-- Keep the existing ProPresenter wrapper/API but share the authoritative override resolver.
create or replace function public.current_user_can_propresenter(p_action text default 'view') returns boolean language sql stable security definer set search_path='' as $$
 select p_action in ('view','edit') and private.current_user_has_admin_permission('propresenter',p_action)
$$;
-- These operations have no public use; preserve authenticated execution and their body guards.
revoke execute on function public.create_propresenter_connection(text,text,text,text) from public,anon;
revoke execute on function public.get_editorial_document_analytics(uuid) from public,anon;
revoke execute on function public.create_community_comment(uuid,text,text) from public,anon;
revoke execute on function public.toggle_community_like(uuid) from public,anon;
