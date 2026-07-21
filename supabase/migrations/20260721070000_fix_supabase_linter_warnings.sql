-- Fix Function Search Path Mutable for all functions mentioned by the linter
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.protect_role_update() SET search_path = '';
ALTER FUNCTION public.process_audit_log() SET search_path = '';
ALTER FUNCTION public.sync_ministry_anniversary_to_events() SET search_path = '';
ALTER FUNCTION public.delete_ministry_anniversary_event() SET search_path = '';
ALTER FUNCTION public.increment_version_and_updated_at() SET search_path = '';
ALTER FUNCTION public.delete_expired_messages() SET search_path = '';
ALTER FUNCTION public.handle_update_timestamp() SET search_path = '';
ALTER FUNCTION public.delete_user_by_admin(uuid) SET search_path = '';
ALTER FUNCTION public.clean_string(text) SET search_path = '';
ALTER FUNCTION public.compare_names(text, text) SET search_path = '';
ALTER FUNCTION public.format_member_names() SET search_path = '';
ALTER FUNCTION public.link_ministry_member_by_name() SET search_path = '';
ALTER FUNCTION public.link_existing_ministry_members() SET search_path = '';
ALTER FUNCTION public.handle_profile_roles_default() SET search_path = '';
ALTER FUNCTION public.clean_and_format_name(text) SET search_path = '';
ALTER FUNCTION public.trg_format_profile_names() SET search_path = '';
ALTER FUNCTION public.trg_format_member_names() SET search_path = '';
ALTER FUNCTION public.purge_old_events() SET search_path = '';
ALTER FUNCTION public.handle_updated_at() SET search_path = '';
ALTER FUNCTION public.update_missions_updated_at() SET search_path = '';
ALTER FUNCTION public.update_lms_calendar_timestamp() SET search_path = '';
ALTER FUNCTION public.get_current_streak(uuid) SET search_path = '';
ALTER FUNCTION public.calculate_level_from_xp(integer) SET search_path = '';

-- Functions with specific signatures
ALTER FUNCTION public.is_chat_participant(uuid, uuid) SET search_path = '';
ALTER FUNCTION public.check_rate_limit(text, text, integer, integer) SET search_path = '';
ALTER FUNCTION public.grant_xp(uuid, text, integer, uuid) SET search_path = '';


-- Fix overly permissive RLS Policies (FOR ALL / USING true)
DROP POLICY IF EXISTS "Allow admin manage for course categories" ON public.lms_course_categories;
CREATE POLICY "Allow admin manage for course categories" 
ON public.lms_course_categories 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')
  )
);

DROP POLICY IF EXISTS "Allow admin manage for plugins" ON public.system_plugins;
CREATE POLICY "Allow admin manage for plugins" 
ON public.system_plugins 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'editor')
  )
);
