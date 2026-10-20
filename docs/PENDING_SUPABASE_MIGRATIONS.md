# Migraciones Supabase pendientes

Última revisión: 2026-10-20.

## Verificación remota del 20-oct-2026

Se comparó el historial del proyecto Supabase `iecejerusalen Project` con las 185 migraciones locales. Todas las versiones del historial remoto tienen su archivo local correspondiente. Se aplicó y verificó `20261020022107_fix_public_study_program_rls.sql`, que quedó registrado con esa misma versión remota. Después de la corrección, la consulta anónima del catálogo de `/programas` respondió HTTP 200 y devolvió el programa publicado «Chicas Sabias».

La migración de galerías por ministerio fue aplicada al proyecto remoto `gqtatqekfrswvplemknc` el 2026-10-20. El historial registra la versión `20261020030253`, alineada con el archivo local `supabase/migrations/20261020030253_ministry_photo_galleries.sql`; la tabla quedó habilitada con RLS y cuatro políticas (lectura pública y escritura para responsables autorizados). La función `private.can_manage_ministry_page(uuid)` existía antes de aplicar la migración.

No quedan migraciones locales pendientes: las 185 versiones locales tienen registro remoto y no hay versiones remotas sin archivo local.

| Archivo | Alcance | Estado remoto |
|---|---|---|
| `supabase/migrations/20261020030253_ministry_photo_galleries.sql` | Galerías de fotos públicas por ministerio, con gestión limitada a responsables autorizados. | Aplicada; RLS y políticas verificadas. |

Antes de esta revisión, `/programas` fallaba con HTTP 401 / `42501` (`permission denied for function can_view_study_program_admin`). La política RLS de lectura combinaba filas públicas con una función privada de autorización en una misma expresión asignada a `PUBLIC`; la nueva migración separa políticas públicas y autenticadas, sin ampliar la visibilidad pública de filas.

## Estado

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
