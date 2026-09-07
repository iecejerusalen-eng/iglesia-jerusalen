# Migraciones Supabase pendientes

Última revisión: 2026-09-06.

## Estado

Estos cambios existen en el workspace local, pero no hay evidencia en este repositorio de que hayan sido aplicados al proyecto Supabase remoto. Deben permanecer pendientes hasta ejecutar y verificar cada migración en el proyecto correcto.

| Orden | Estado | Archivo | Alcance | Dependencias / notas |
|---:|---|---|---|---|
| 1 | PENDIENTE | `supabase/migrations/20260906020000_changelog.sql` | Changelog público, reacciones y suscriptores | Las APIs `api/changelog/*.ts` dependen de estas tablas. |
| 2 | PENDIENTE | `supabase/migrations/20260905000000_ideas_wall.sql` | Ideas, votos, comentarios, historial, notificaciones y bucket privado | Depende de `profiles`, `role_permissions`, `access_roles` y del sistema RBAC existente. Incluye políticas RLS y publicación Realtime. |
| 3 | PENDIENTE | `supabase/migrations/20260905010000_admin_onboarding.sql` | Pasos y progreso de onboarding por usuario | Depende de `auth.users`; la UI usa `onboarding_pasos`, `onboarding_progreso` y `onboarding_configuracion`. |
| 4 | PENDIENTE | `supabase/migrations/20260905020000_weekly_bulletins.sql` | Versículos semanales y boletines dominicales | Lee `sermons`, `events`, `church_announcements`, `members` y `schedules`. También activa Realtime para `boletines`. |
| 5 | PENDIENTE | `supabase/migrations/20260906000000_ministry_budgets.sql` | Presupuestos, gastos y comprobantes por ministerio | Depende de `ministries`, `profiles` y Storage. Incluye funciones, triggers, RLS y bucket privado `budget-receipts`. |
| 6 | PENDIENTE | `supabase/migrations/20260906010000_private_pastoral_agenda.sql` | Agenda personal privada y vista pública limitada | Depende de `members`. La agenda privada se filtra por `usuario_id`; lo público solo aparece mediante `es_publico = true` y `agenda_publica`. |

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
- `api/changelog/dar-de-baja.ts`
- `api/changelog/reaccionar.ts`
- `api/changelog/suscribir.ts`
