# Migraciones Supabase pendientes

Última revisión: 2026-10-21 (hora de Guayaquil; versiones remotas en UTC).

## Estado verificado del proyecto gqtatqekfrswvplemknc — 21-oct-2026

El historial remoto contiene 192 migraciones. Estas seis correcciones de seguridad y certificados están aplicadas y verificadas en el proyecto de Iglesia Jerusalén:

| Versión remota | Migración | Alcance |
|---|---|---|
| 20261021010012 | optimize_rls_auth_initplans | Evita reevaluar helpers de autenticación por fila en políticas RLS. |
| 20261021010143 | secure_personal_bible_study | Retira lectura anónima de notas, marcadores y resaltados bíblicos personales. |
| 20261021010556 | secure_sensitive_public_policies | Restringe datos familiares, intercesores y contenido de cuestionarios a usuarios autorizados. |
| 20261021010825 | add_public_certificate_lookup_rpcs | Añade consultas acotadas para certificados sin entregar identificadores de estudiante ni URL de PDF. |
| 20261021011043 | secure_public_community_reads | Limita comentarios a publicaciones públicas y restringe el muro de oración. |
| 20261021051358 | restrict_public_certificate_table_access | Retira lectura anónima directa de certificados y deja su consulta pública mediante RPC acotados. |

La consulta de políticas y privilegios confirmó que anon ya no puede leer directamente bible_highlights, bible_notes, bible_bookmarks, family_members, petition_prayers, lms_quiz_questions, lms_quizzes, lms_user_badges ni prayer_wall_posts. Las políticas de comentarios y familias quedaron vinculadas al estado publicado y a permisos de administración. Los RPC de certificados no devolvieron datos ante códigos de prueba inexistentes.

En los logs de PostgREST aparecieron tres timeouts del servidor a las 00:59:12 UTC, antes de la primera migración (01:00:12 UTC); no se conoce su causa. No se encontraron errores Postgres/PostgREST desde la primera migración hasta la última revisión.

**Migración de certificados aplicada:** producción contiene los módulos `CertificateViewer` y `CertificateVerification`, que llaman `get_public_lms_certificate` y `verify_lms_certificate_issued`. La migración remota `20261021051358_restrict_public_certificate_table_access` revoca SELECT anónimo directo y conserva la lectura propia/autorizada mediante RLS y las verificaciones públicas mediante los RPC. El conector de Vercel aún responde 403 para inspeccionar el deployment, pero los módulos activos fueron confirmados en los bundles públicos.

También queda pendiente activar la protección de contraseñas filtradas en Supabase Auth desde el Dashboard. La integración disponible no permite cambiar esa opción.

Los avisos de índices sin índice para claves foráneas y de índices no utilizados son recomendaciones para analizar con cargas reales; no se aplicaron cambios masivos.

## Registro previo del mismo día (20-oct-2026)

## Verificación remota del 20-oct-2026

Se comparó el historial del proyecto Supabase `iecejerusalen Project` con las 186 migraciones locales. Todas las versiones del historial remoto tienen su archivo local correspondiente. Se aplicó y verificó `20261020022107_fix_public_study_program_rls.sql`, que quedó registrado con esa misma versión remota. Después de la corrección, la consulta anónima del catálogo de `/programas` respondió HTTP 200 y devolvió el programa publicado «Chicas Sabias».

La migración de galerías por ministerio fue aplicada al proyecto remoto `gqtatqekfrswvplemknc` el 2026-10-20. El historial registra la versión `20261020030253`, alineada con el archivo local `supabase/migrations/20261020030253_ministry_photo_galleries.sql`; la tabla quedó habilitada con RLS y cuatro políticas (lectura pública y escritura para responsables autorizados). La función `private.can_manage_ministry_page(uuid)` existía antes de aplicar la migración.

La migración `20261020061056_harden_public_student_verification.sql` fue aplicada al mismo proyecto. El RPC público `verify_student_status(uuid)` conserva la verificación de credenciales, pero su respuesta se limita a nombre, vigencia y fecha de verificación; se retiraron correo parcial, foto, rol e identificador. `current_user_can_propresenter(text)` y `current_user_can_worship_manager()` quedaron ejecutables solo por `authenticated`, no por `anon`. La consulta de privilegios confirmó `anon_exec=false` y `auth_exec=true` para ambos RPC de autorización; la respuesta del verificador confirmó las claves `full_name`, `is_active` y `verified_at`.

No quedan migraciones locales pendientes: las 186 versiones locales tienen registro remoto y no hay versiones remotas sin archivo local.

| Archivo | Alcance | Estado remoto |
|---|---|---|
| `supabase/migrations/20261020030253_ministry_photo_galleries.sql` | Galerías de fotos públicas por ministerio, con gestión limitada a responsables autorizados. | Aplicada; RLS y políticas verificadas. |
| `supabase/migrations/20261020061056_harden_public_student_verification.sql` | Minimiza los datos personales devueltos por el verificador público de credenciales y restringe dos RPC auxiliares al rol autenticado. | Aplicada; permisos y campos de respuesta verificados. |

Antes de esta revisión, `/programas` fallaba con HTTP 401 / `42501` (`permission denied for function can_view_study_program_admin`). La política RLS de lectura combinaba filas públicas con una función privada de autorización en una misma expresión asignada a `PUBLIC`; la nueva migración separa políticas públicas y autenticadas, sin ampliar la visibilidad pública de filas.

## Estado al 20-oct-2026 (histórico)

Estos cambios existen en el workspace local, pero no hay evidencia en este repositorio de que hayan sido aplicados al proyecto Supabase remoto. Deben permanecer pendientes hasta ejecutar y verificar cada migración en el proyecto correcto.

| Orden | Estado | Archivo | Alcance | Dependencias / notas |
|---:|---|---|---|---|
| 1 | APLICADO | `supabase/migrations/20260906020000_changelog.sql` | Changelog pblico, reacciones y suscriptores | Las APIs `api/changelog/*.ts` dependen de estas tablas. |
| 2 | APLICADO | `supabase/migrations/20260905000000_ideas_wall.sql` | Ideas, votos, comentarios, historial, notificaciones y bucket privado | Depende de `profiles`, `role_permissions`, `access_roles` y del sistema RBAC existente. Incluye polticas RLS y publicacin Realtime. |
| 3 | APLICADO | `supabase/migrations/20260905010000_admin_onboarding.sql` | Pasos y progreso de onboarding por usuario | Depende de `auth.users`; la UI usa `onboarding_pasos`, `onboarding_progreso` y `onboarding_configuracion`. |
| 4 | APLICADO | `supabase/migrations/20260905020000_weekly_bulletins.sql` | Versculos semanales y boletines dominicales | Lee `sermons`, `events`, `church_announcements`, `members` y `schedules`. Tambin activa Realtime para `boletines`. |
| 5 | APLICADO | `supabase/migrations/20260906000000_ministry_budgets.sql` | Presupuestos, gastos y comprobantes por ministerio | Depende de `ministries`, `profiles` y Storage. Incluye funciones, triggers, RLS y bucket privado `budget-receipts`. |
| 6 | APLICADO | `supabase/migrations/20260906010000_private_pastoral_agenda.sql` | Agenda personal privada y vista pblica limitada | Depende de `members`. La agenda privada se filtra por `usuario_id`; lo pblico solo aparece mediante `es_publico = true` y `agenda_publica`. |
| 7 | APLICADO | `supabase/migrations/20260906023000_public_bulletin_views.sql` | Vista pǧblica limitada del boletn | Debe aplicarse despuǸs de `20260905020000_weekly_bulletins.sql`; solo permite `aprobado`/`enviado` y excluye datos internos. |
| 8 | APLICADO | `supabase/migrations/20260906030000_sync_public_navigation.sql` | Sincroniza Podcast, Novedades y Boletn en `public_menu_items` | Debe aplicarse despuǸs de `20260726000000_dynamic_menu.sql`; es idempotente y no reemplaza las decisiones de visibilidad del administrador. |
| 9 | APLICADO | `supabase/migrations/20260906040000_seed_podcast_show.sql` | Inicializa la configuración pública del show Podcast | No crea episodios ni contenido ficticio; depende de `20260823053000_podcast_module.sql`. |

## Despliegues relacionados pendientes

Esto no es una migración SQL, pero también está local y no debe considerarse activo en Supabase hasta verificarlo:

- `supabase/functions/generate-weekly-bulletin/index.ts` — desplegar como Edge Function después de aplicar `20260905020000_weekly_bulletins.sql`.

## Orden de aplicación recomendado

1. Revisar y aplicar cada archivo de la tabla en orden.
2. Ejecutar advisors de Supabase y corregir advertencias de RLS, permisos, funciones o Storage.
3. Verificar el historial remoto de migraciones.
4. Desplegar `generate-weekly-bulletin` y probarlo con una sesión autenticada/servicio autorizado.
5. Ejecutar pruebas funcionales de cada módulo con datos reales.

## Verificación mínima por migración

Antes de marcar una fila como aplicada, comprobar:

- La migración aparece en el historial remoto del proyecto correcto.
- Las tablas, índices, funciones, triggers, buckets y políticas esperadas existen.
- Las consultas del frontend dejan de producir errores de tabla inexistente o permiso.
- Las políticas RLS impiden acceso cruzado entre usuarios/roles.
- Las vistas públicas no exponen campos privados.
- No se aplicó la misma migración manualmente fuera del historial, evitando duplicados.

## Cambios de frontend relacionados detectados

Los siguientes archivos consumen las entidades anteriores y no deben desplegarse esperando que funcionen en producción hasta aplicar sus migraciones correspondientes:

- `src/admin/onboarding/useOnboarding.ts`
- `src/features/ideas/service.ts`
- `src/features/bulletins/service.ts`
- `src/features/ministry-budgets/service.ts`
- `src/features/changelog/service.ts`
- `src/pages/admin/Agenda.tsx`
- `src/pages/admin/IdeasBoard.tsx`
- `src/pages/admin/BulletinManager.tsx`
- `src/pages/admin/MinistryBudgets.tsx`
- `src/pages/admin/ChangelogManager.tsx`
- `src/pages/public/Bulletin.tsx`
- `src/pages/public/PublicAgenda.tsx`
- `api/changelog/dar-de-baja.ts`
- `api/changelog/reaccionar.ts`
- `api/changelog/suscribir.ts`

## Chequeo de publicación — 21-oct-2026

El commit `a0e560e` fue enviado a `main` (repo `iecejerusalen-eng/iglesia-jerusalen`). En esta revisión, los bundles públicos incluyen ambos RPC de certificados aunque el conector Vercel sigue denegando el scope `iglesia-jerusalen` con 403. La migración `20261021051358_restrict_public_certificate_table_access` ya consta aplicada y verificada en `gqtatqekfrswvplemknc`; el historial remoto generó esta versión UTC y el archivo local fue renombrado para coincidir.


## Verificación posterior — 21-oct-2026

- anon ya no tiene privilegio SELECT en lms_certificates ni lms_certificates_issued; ambas tablas conservan RLS.
- Los RPC get_public_lms_certificate y verify_lms_certificate_issued siguen ejecutables por anon y authenticated; SELECT de lms_certificates para usuarios autenticados queda filtrado por identidad propia y políticas de emisión autorizada.
- Advisors de seguridad: persisten avisos de funciones SECURITY DEFINER accesibles por roles de API (incluidos intencionalmente los RPC acotados de certificados), tres tablas con RLS sin políticas y la protección de contraseñas filtradas de Auth desactivada. Requieren revisión individual; no se alteraron en esta migración.
