# Changelog

Todas las novedades y cambios notables de este proyecto están documentados en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.3.2] - 2026-09-25

### Corregido (Fixed)
- **Corrección de Registro CRM y Error `[object Object]`**: Resuelta la restricción `NOT NULL` en la columna `resource` de la tabla `audit_logs` disparada por el trigger `process_audit_log` en `members`. Se añadió valor predeterminado `system` y control de excepciones preventivo para que fallos de auditoría no aborten transacciones de usuario. Se corrigió además la cláusula `onConflict: 'email'` en la vinculación de correos en `member_emails` y se mejoró la serialización de errores en los avisos en pantalla.
- **Registro Completado para Miembros Afectados**: Se regularizó y vinculó de forma automática y exitosa la ficha de Katherine Cantos Villalva en el CRM y en su perfil de usuario.
- **Eliminación del Confeti Repetitivo al Abrir Admin**: Se suprimió la detonación automática de confeti en cada visita o recarga del panel de administración (`AdminLayout.tsx`). La animación ahora se ejecuta exclusivamente en la transición activa al 100% de onboarding y persiste su celebración en el almacenamiento local.

### Mejorado (Changed)
- **Experiencia de Onboarding No Intrusiva y Posposición Inteligente (*Snooze*)**: El aviso de registro de miembros (`CRMRegistrationPrompt`) cuenta ahora con un retraso cortés de apertura, posposición de 7 días al posponer o cerrar, y reemplazo del banner rojo invasivo por una píldora translúcida con cierre definitivo. Igualmente, el onboarding del panel administrativo cuenta con posposición de 7 días y supresión de alertas intrusivas.
- **Caja de Herramientas Flotante Despejada (`GlobalToolbox`)**: Se optimizó la pestaña lateral flotante haciéndola más discreta y compacta, se ajustó su nivel de capas (*z-index*) para no solapar modales o botones principales en dispositivos móviles, y se añadió la opción directa de ocultar permanentemente el botón flotante con persistencia en `localStorage`.

---

## [1.3.1] - 2026-09-24

### Añadido (Added)
- **Personalización directa de Toques de Batería en el Editor**: Botón interactivo `+ Personalizar` y opción `➕ Personalizar / Agregar nuevo...` en el desplegable de toques de batería en `SongsManager.tsx`. Permite escribir un ritmo en línea con atajos de teclado (`Enter` para guardar, `Escape` para cancelar), seleccionándolo inmediatamente en la canción en edición.
- **Módulo de Catálogo de Toques de Batería**: Nueva columna en el panel de Catálogos de Canciones (`/admin/canciones`) para dar de alta, consultar y eliminar toques de batería personalizados, distinguiéndolos visualmente de los ritmos predeterminados.
- **Servicio y Hook `drumStylesService`**: Módulo centralizado (`src/features/songs/services/drumStylesService.ts`) y hook `useDrumStyles` que administra la lista de ritmos predeterminados, estilos personalizados y ritmos detectados en canciones existentes.
- **Migración SQL de Toques de Batería**: Archivo de migración `supabase/migrations/20260925000000_add_song_drum_styles.sql` con políticas RLS de lectura pública y escritura para roles administrativos y musicales.

### Mejorado (Changed)
- **Filtros Dinámicos de Biblioteca Pública (`/canciones`)**: El componente `SongsFilters` ahora recibe la lista dinámica de ritmos disponibles, permitiendo a congregantes y músicos filtrar por cualquier toque personalizado creado.
- **Filtro de Toque de Batería en Panel Administrativo**: Añadido selector de filtro por toque de batería en la barra de búsqueda y catálogo de alabanzas.
- **Persistencia Híbrida y Offline-First**: Los toques de batería personalizados se almacenan de forma inmediata en `localStorage` (disponibilidad instantánea y sin conexión) y se sincronizan a nivel global con Supabase mediante `church_settings`.

---

## [1.3.0] - 2026-09-06

### Añadido (Added)
- Módulos administrativos para Muro de Ideas, Boletines Semanales, Presupuestos de Ministerios, Agenda Pastoral Privada y Centro de Novedades (Changelog).
- Rutas públicas y de administración para el registro y consulta de novedades de la plataforma (`/novedades` y `/admin/changelog`).
