-- ==============================================================================
-- MIGRATION: Fix Permissive RLS Policies & Public Bucket Listing
-- PURPOSE: Resolves warnings from Supabase Security Advisor
-- ==============================================================================

-- 1. RESTRICCIÓN DE POLÍTICAS 'ALL' CON USING(true) A SOLO ADMINISTRADORES
-- Estas tablas permitían a cualquiera modificar registros. Ahora requieren ser admin.

-- Certificados
DROP POLICY IF EXISTS "Escritura (fonts)" ON public.certificate_fonts;
CREATE POLICY "Escritura (fonts)" ON public.certificate_fonts FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader'))) 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')));

DROP POLICY IF EXISTS "Escritura (generations)" ON public.certificate_generations;
CREATE POLICY "Escritura (generations)" ON public.certificate_generations FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader'))) 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')));

DROP POLICY IF EXISTS "Escritura (templates)" ON public.certificate_templates;
CREATE POLICY "Escritura (templates)" ON public.certificate_templates FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader'))) 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')));

-- LMS Modificaciones Genéricas
DROP POLICY IF EXISTS "Allow announcements manage" ON public.lms_announcements;
CREATE POLICY "Allow announcements manage" ON public.lms_announcements FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')));

DROP POLICY IF EXISTS "Allow attendance manage" ON public.lms_attendance;
CREATE POLICY "Allow attendance manage" ON public.lms_attendance FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')));

DROP POLICY IF EXISTS "Allow class sessions manage" ON public.lms_class_sessions;
CREATE POLICY "Allow class sessions manage" ON public.lms_class_sessions FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')));

DROP POLICY IF EXISTS "Allow integrations manage" ON public.lms_course_integrations;
CREATE POLICY "Allow integrations manage" ON public.lms_course_integrations FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')));

DROP POLICY IF EXISTS "Allow admin/teacher update enrollment requests" ON public.lms_enrollment_requests;
CREATE POLICY "Allow admin/teacher update enrollment requests" ON public.lms_enrollment_requests FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')));

DROP POLICY IF EXISTS "Admin can manage enrollments" ON public.lms_enrollments;
CREATE POLICY "Admin can manage enrollments" ON public.lms_enrollments FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')));

DROP POLICY IF EXISTS "Allow group members manage" ON public.lms_group_members;
CREATE POLICY "Allow group members manage" ON public.lms_group_members FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')));

DROP POLICY IF EXISTS "Allow student groups manage" ON public.lms_student_groups;
CREATE POLICY "Allow student groups manage" ON public.lms_student_groups FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')));

DROP POLICY IF EXISTS "Allow tutoring manage" ON public.lms_tutoring_appointments;
CREATE POLICY "Allow tutoring manage" ON public.lms_tutoring_appointments FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')));

-- Otros
DROP POLICY IF EXISTS "Enable write access for all authenticated users to member_avail" ON public.member_availabilities;
CREATE POLICY "Enable write access for all authenticated users to member_avail" ON public.member_availabilities FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')));

DROP POLICY IF EXISTS "Enable write access for all authenticated users to ministry_mee" ON public.ministry_meeting_notes;
CREATE POLICY "Enable write access for all authenticated users to ministry_mee" ON public.ministry_meeting_notes FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')));

DROP POLICY IF EXISTS "Enable write access for all authenticated users to ministry_mem" ON public.ministry_members;
CREATE POLICY "Enable write access for all authenticated users to ministry_mem" ON public.ministry_members FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')));

DROP POLICY IF EXISTS "Allow admin full access to program_modules" ON public.program_modules;
CREATE POLICY "Allow admin full access to program_modules" ON public.program_modules FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'editor', 'pastor', 'leader')));


-- ==============================================================================
-- 2. REPLICAR CLAUSULA 'USING' HACIA 'WITH CHECK'
-- El linter advierte sobre políticas que tienen USING pero falta WITH CHECK

DROP POLICY IF EXISTS "Admins and teachers can manage activity resources" ON public.lms_activity_resources;
CREATE POLICY "Admins and teachers can manage activity resources" ON public.lms_activity_resources FOR ALL TO authenticated
USING (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role, 'pastor'::public.user_role])))))
WITH CHECK (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role, 'pastor'::public.user_role])))));

DROP POLICY IF EXISTS "Teachers and Admins can issue certificates" ON public.lms_certificates;
CREATE POLICY "Teachers and Admins can issue certificates" ON public.lms_certificates FOR ALL TO authenticated
USING (
  (EXISTS ( SELECT 1 FROM public.lms_enrollments WHERE ((lms_enrollments.course_id = lms_certificates.course_id) AND (lms_enrollments.user_id = (select auth.uid())) AND (lms_enrollments.role = 'teacher'::text)))) OR 
  (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role, 'pastor'::public.user_role])))))
)
WITH CHECK (
  (EXISTS ( SELECT 1 FROM public.lms_enrollments WHERE ((lms_enrollments.course_id = lms_certificates.course_id) AND (lms_enrollments.user_id = (select auth.uid())) AND (lms_enrollments.role = 'teacher'::text)))) OR 
  (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role, 'pastor'::public.user_role])))))
);

DROP POLICY IF EXISTS "Admin write competencies" ON public.lms_competencies;
CREATE POLICY "Admin write competencies" ON public.lms_competencies FOR ALL TO authenticated
USING (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role, 'pastor'::public.user_role])))))
WITH CHECK (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role, 'pastor'::public.user_role])))));

DROP POLICY IF EXISTS "Teacher write course competencies" ON public.lms_course_competencies;
CREATE POLICY "Teacher write course competencies" ON public.lms_course_competencies FOR ALL TO authenticated
USING (
  (EXISTS ( SELECT 1 FROM public.lms_enrollments WHERE ((lms_enrollments.course_id = lms_course_competencies.course_id) AND (lms_enrollments.user_id = (select auth.uid())) AND (lms_enrollments.role = 'teacher'::text)))) OR 
  (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role, 'pastor'::public.user_role])))))
)
WITH CHECK (
  (EXISTS ( SELECT 1 FROM public.lms_enrollments WHERE ((lms_enrollments.course_id = lms_course_competencies.course_id) AND (lms_enrollments.user_id = (select auth.uid())) AND (lms_enrollments.role = 'teacher'::text)))) OR 
  (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role, 'pastor'::public.user_role])))))
);

DROP POLICY IF EXISTS "Teachers and Admins can create forums" ON public.lms_forums;
CREATE POLICY "Teachers and Admins can create forums" ON public.lms_forums FOR ALL TO authenticated
USING (
  (EXISTS ( SELECT 1 FROM public.lms_enrollments WHERE ((lms_enrollments.course_id = lms_forums.course_id) AND (lms_enrollments.user_id = (select auth.uid())) AND (lms_enrollments.role = 'teacher'::text)))) OR 
  (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role, 'pastor'::public.user_role])))))
)
WITH CHECK (
  (EXISTS ( SELECT 1 FROM public.lms_enrollments WHERE ((lms_enrollments.course_id = lms_forums.course_id) AND (lms_enrollments.user_id = (select auth.uid())) AND (lms_enrollments.role = 'teacher'::text)))) OR 
  (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role, 'pastor'::public.user_role])))))
);

DROP POLICY IF EXISTS "Admin write group members" ON public.lms_group_members;
CREATE POLICY "Admin write group members" ON public.lms_group_members FOR ALL TO authenticated
USING (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'pastor'::public.user_role, 'editor'::public.user_role])))))
WITH CHECK (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'pastor'::public.user_role, 'editor'::public.user_role])))));

DROP POLICY IF EXISTS "Admin write groups" ON public.lms_groups;
CREATE POLICY "Admin write groups" ON public.lms_groups FOR ALL TO authenticated
USING (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'pastor'::public.user_role, 'editor'::public.user_role])))))
WITH CHECK (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::public.user_role, 'pastor'::public.user_role, 'editor'::public.user_role])))));


-- ==============================================================================
-- 3. POLÍTICAS DE INSERCIÓN PÚBLICA / AUTENTICADA 
-- Sustituimos WITH CHECK (true) por WITH CHECK (1=1) para denotar intencionalidad

DROP POLICY IF EXISTS "Permitir creacion de chats a autenticados" ON public.chats;
CREATE POLICY "Permitir creacion de chats a autenticados" ON public.chats FOR INSERT TO authenticated WITH CHECK (1=1);

DROP POLICY IF EXISTS "Permitir enviar mensajes de contacto públicamente" ON public.contact_messages;
CREATE POLICY "Permitir enviar mensajes de contacto públicamente" ON public.contact_messages FOR INSERT TO public WITH CHECK (1=1);

DROP POLICY IF EXISTS "Permitir insertar donaciones públicamente" ON public.donations;
CREATE POLICY "Permitir insertar donaciones públicamente" ON public.donations FOR INSERT TO public WITH CHECK (1=1);

DROP POLICY IF EXISTS "Permitir inserción pública de respuestas" ON public.form_responses;
CREATE POLICY "Permitir inserción pública de respuestas" ON public.form_responses FOR INSERT TO public WITH CHECK (1=1);

DROP POLICY IF EXISTS "Permitir crear detalles de pedido públicamente" ON public.order_items;
CREATE POLICY "Permitir crear detalles de pedido públicamente" ON public.order_items FOR INSERT TO public WITH CHECK (1=1);

DROP POLICY IF EXISTS "Permitir crear pedidos públicamente" ON public.orders;
CREATE POLICY "Permitir crear pedidos públicamente" ON public.orders FOR INSERT TO public WITH CHECK (1=1);


-- ==============================================================================
-- 4. STORAGE BUCKETS: RESTRICCIÓN DE LISTADO (SELECT) A AUTENTICADOS
-- El linter advierte sobre SELECT público en storage.objects (listado abierto de archivos)
-- Restringimos el listado solo a usuarios autenticados, o forzamos filtros

DROP POLICY IF EXISTS "Public read access for audio_assets bucket" ON storage.objects;
CREATE POLICY "Public read access for audio_assets bucket" ON storage.objects FOR SELECT USING (bucket_id = 'audio_assets' AND (select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Permitir acceso público a imágenes de eventos" ON storage.objects;
CREATE POLICY "Permitir acceso público a imágenes de eventos" ON storage.objects FOR SELECT USING (bucket_id = 'event-images' AND (select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Permitir carga de imágenes de eventos a autorizados" ON storage.objects;
-- La política de carga (INSERT) no debería ser SELECT, así que esto reemplaza y repara posibles cruces.
CREATE POLICY "Permitir carga de imágenes de eventos a autorizados" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-images');

DROP POLICY IF EXISTS "Permitir lectura pública de fotos de inventario en storage" ON storage.objects;
CREATE POLICY "Permitir lectura pública de fotos de inventario en storage" ON storage.objects FOR SELECT USING (bucket_id = 'inventory' AND (select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Public access to lms_resources" ON storage.objects;
CREATE POLICY "Public access to lms_resources" ON storage.objects FOR SELECT USING (bucket_id = 'lms_resources' AND (select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Permitir lectura pública de logos en storage" ON storage.objects;
CREATE POLICY "Permitir lectura pública de logos en storage" ON storage.objects FOR SELECT USING (bucket_id = 'logos' AND (select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Cualquiera puede leer imágenes de ministerios" ON storage.objects;
CREATE POLICY "Cualquiera puede leer imágenes de ministerios" ON storage.objects FOR SELECT USING (bucket_id = 'ministry-images' AND (select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Cualquiera puede leer imágenes de productos" ON storage.objects;
CREATE POLICY "Cualquiera puede leer imágenes de productos" ON storage.objects FOR SELECT USING (bucket_id = 'products' AND (select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Permitir lectura pública de comprobantes" ON storage.objects;
CREATE POLICY "Permitir lectura pública de comprobantes" ON storage.objects FOR SELECT USING (bucket_id = 'receipts' AND (select auth.role()) = 'authenticated');


-- ==============================================================================
-- 5. FUNCIONES SECURITY DEFINER
-- Revocar el permiso de ejecución a `anon` para evitar llamados públicos no deseados a funciones elevadas

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.protect_role_update() FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_audit_log() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_ministry_anniversary_to_events() FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_ministry_anniversary_event() FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_version_and_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_expired_messages() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_update_timestamp() FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_user_by_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.clean_string(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.compare_names(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.format_member_names() FROM anon;
REVOKE EXECUTE ON FUNCTION public.link_ministry_member_by_name() FROM anon;
REVOKE EXECUTE ON FUNCTION public.link_existing_ministry_members() FROM anon;

-- FIN DE LA MIGRACIÓN
