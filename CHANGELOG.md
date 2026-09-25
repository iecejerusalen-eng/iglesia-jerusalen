# Changelog

Todas las novedades y cambios notables de este proyecto están documentados en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.3.8] - 2026-09-25

### Mejorado (Changed)
- **Apariencia General del Panel Administrativo (Visual Premium Upgrade)**:
  - **`AdminLayout.tsx`**: Fondo de pantalla más profundo (`#eef0f6` / `#060d1f` oscuro), cabecera con glassmorphism reforzado (`backdrop-blur-2xl`, sombra direccional sutil), barra de búsqueda con cursor interactivo y estado hover diferenciado, avatar del usuario con gradiente y sombra de color, nav móvil con sombra premium y borde más opaco.
  - **Gradiente Radial Ambiental Obligatorio**: Todos los módulos del panel ahora heredan el gradiente radial `rgba(37,99,235,0.08)` / `rgba(139,92,246,0.07)` desde el `<main>` del layout, alineado con el estándar visual de `AnalyticsDashboard`.
  - **`DashboardHome.tsx`**: Añadido el gradiente radial ambiental propio de la página principal, mejoras de contraste en secciones de error y CTA de análisis detallado.
  - **`DashboardHero.tsx`**: Degradado naval más profundo con capa de glow radial decorativa, anillo inset en la tarjeta de versículo, anillos decorativos más refinados, tracking de micro-labels mejorado a `[.18em]`.
  - **`DashboardStats.tsx`**: Tarjetas con `rounded-[1.4rem]`, hover más pronunciado (`hover:-translate-y-1.5`, `hover:shadow-xl`, `hover:bg-white`), bordes más delicados en dark mode.
  - **`QuickLinks.tsx`**: Sistema de colores por módulo (azul, violeta, ámbar, esmeralda, rosa, gris pizarra), contenedores de icono con borde y badge de color, escala de icono en hover, micro-label uppercase de `Abrir herramienta`.
  - **`WeeklyAlerts.tsx`**: Ajustes menores de opacidad de borde y fondo para coherencia visual con el resto del dashboard.
  - **`Sidebar.tsx`**: Degradado de fondo más profundo y azul-marino refinado, cabecera más compacta con badge de rol premium (`border border-gold/25 bg-gold/10`), logo con `drop-shadow-lg`.

---

## [1.3.7] - 2026-09-25

### Mejorado (Changed)
- **UX y Control del Checklist de Onboarding (`OnboardingChecklist.tsx`)**:
  - **Botón de Cierre Directo (`X`)**: Incorporado botón de descarte rápido e independiente en la cabecera flotante con `stopPropagation` para no colapsar accidentalmente.
  - **Ocultación Inteligente al Completar (100%)**: Cuando el usuario finaliza todos los pasos (5/5 pasos completados), el checklist ofrece un botón de acción principal para descartarse permanentemente y no permanecer flotando sobre la interfaz.
  - **Persistencia en LocalStorage**: Si el usuario cierra o descarta el checklist, la preferencia se memoriza de forma permanente para no interrumpir el flujo de trabajo ni tapar botones o barras de navegación.
  - **Acceso Bajo Demanda desde el Header**: El badge de puntos de activación (`⚡ pts`) en la barra superior del panel ahora es interactivo y permite reabrir el progreso de onboarding cuando el administrador lo desee.

---

## [1.3.6] - 2026-09-25

### Añadido (Added)
- **Motor de Auto-Indexación Rápida (`searchIndexService.ts`)**: Sistema de indexación continua que pre-carga y actualiza en tiempo real los enlaces de la aplicación con un tiempo de respuesta de 0 milisegundos al escribir en la paleta de búsqueda (`Ctrl + K`).
- **Indexación Automática de Contenidos Dinámicos de Supabase**: Ahora el buscador indexa y enlaza de forma 100% automática cada nuevo registro creado en la plataforma:
  - **Prédicas y Sermones** (`sermons`): Título, pastor, fecha y enlaces directos a `/predicas/:id`.
  - **Cursos del Aula Virtual** (`lms_courses`): Cursos de formación bíblica y discipulado enlazados a `/aula-virtual`.
  - **Espacios Editoriales y Artículos** (`editorial_spaces`): Blogs y lecturas de ministerios en `/publicaciones/:slug`.
  - **Formularios Dinámicos** (`dynamic_forms`): Inscripciones a actividades y eventos en `/formularios/:formId`.
  - **Novedades y Actualizaciones** (`changelog_versiones`): Historial de versiones y mejoras.
- **Soporte de Enlaces Personalizados Dinámicos (`custom_search_links`)**: Permite a pastores y administradores agregar enlaces destacados directamente en la configuración de la iglesia (`church_settings.appearance_config.custom_search_links`) sin necesidad de tocar código, integrándose automáticamente en el buscador.
- **Catálogo Maestro de Navegación del Sitio (`siteNavigationIndex.ts`)**: Más de 35 secciones y herramientas públicas centralizadas con palabras clave semánticas e iconos oficiales.

### Mejorado (Changed)
- **Búsqueda Instantánea con Caché en Memoria**: Eliminada la latencia de 250ms para navegación y secciones frecuentes. El buscador filtra instantáneamente en memoria mientras ejecuta consultas profundas en segundo plano para letras de alabanzas y eventos.
- **Botón de Actualización Inmediata del Índice**: Añadido botón interactivo en la cabecera del buscador para invalidar caché y re-indexar la base de datos al instante.

---

## [1.3.5] - 2026-09-25

### Mejorado (Changed)
- **Automatización y Resiliencia en Suscripción a Novedades**: Se optimizó el flujo de suscripción por correo electrónico en el portal público (`/novedades`) y su endpoint serverless (`/api/changelog/suscribir`), integrando una plantilla de bienvenida HTML prémium con diseño institucional y enlace directo al nuevo dominio oficial `https://www.iecejerusalen.com`.
- **Mecanismo de Respaldo Directo en Base de Datos**: Añadida lógica de respaldo (*fallback*) directo a Supabase en el componente de suscripción (`Changelog.tsx`), asegurando que aun si el servicio de correo no está disponible o se encuentra en pruebas locales, el suscriptor quede guardado de forma permanente y segura en la tabla `changelog_suscriptores`.
- **Compatibilidad Ampliada de Credenciales**: El controlador del backend ahora soporta tanto `SUPABASE_SERVICE_ROLE_KEY` como `VITE_SUPABASE_ANON_KEY`, evitando errores de inicialización si solo una de ellas está definida en las variables de entorno de producción.

---

## [1.3.4] - 2026-09-25

### Añadido (Added)
- **Unificación Total del Buscador y Paleta de Comandos**: Fusión definitiva de los dos buscadores previos en una única experiencia integral y elegante (`SearchPalette.tsx`), accesible tanto por el botón de la barra superior como de navegación y mediante el atajo universal `Ctrl+K` / `⌘K`.
- **Integración de Módulos de Administración con Control de Roles**: Para usuarios autenticados con rol administrativo (pastores, administradores, líderes), el buscador unificado indexa y despliega directamente los módulos administrativos (`ADMIN_MODULES`) con etiqueta `[ADMIN]`, permitiendo acceder con un clic a herramientas como Misiones, Canciones, CRM de Miembros, Changelog y Finanzas sin exponerlas al público general.
- **Barra de Navegación por Teclado y Dominio Oficial**: Añadida barra inferior en la paleta con atajos rápidos de teclado (`↑ ↓` navegar, `↵` abrir, `ESC` cerrar) y enlace directo al nuevo dominio oficial `https://www.iecejerusalen.com`.
- **Indexación Completa de Secciones y Recursos**: Incorporadas 23 páginas clave del portal (`/plan-lectura`, `/visita`, `/predicas`, `/misiones`, `/recursos/biblia`, `/comunidad`, `/en-vivo`, `/aula-virtual`, `/reservas`, etc.) con palabras clave semánticas enriquecidas.

### Mejorado (Changed)
- **Sincronización Canónica con el Nuevo Dominio**: Se actualizaron las etiquetas canónicas y de Open Graph en `PublicLayout.tsx` y el mapa de sitio `sitemap.xml` para consolidar `https://www.iecejerusalen.com` como el dominio canónico principal para indexación en motores de búsqueda.
- **Eliminación de Conflictos de Atajos de Teclado**: Se suprimieron los múltiples oyentes de teclado concurrentes entre `CommandPalette` y `SearchPalette`, garantizando una respuesta limpia, rápida y sin modales duplicados.

---

## [1.3.3] - 2026-09-25

### Añadido (Added)
- **Búsqueda Global y Acceso a Novedades (Changelog)**: Integración completa del historial de versiones y notas de lanzamiento en el buscador inteligente del sitio público (`SearchPalette.tsx`) y en la paleta de comandos global (`CommandPalette.tsx`).
- **Consulta en Tiempo Real de Versiones Publicadas**: El buscador público ahora consulta dinámicamente la tabla `changelog_versiones` en Supabase y muestra enlaces directos a las versiones con sus resúmenes y fechas de lanzamiento.
- **Módulo de Changelog en Administración**: Registrado el módulo `/admin/changelog` en el catálogo central de módulos administrativos (`adminModules.ts`), permitiendo encontrarlo y abrirlo directamente desde la paleta de comandos (Ctrl+K).

### Mejorado (Changed)
- **Navegación Fluida en el Buscador del Sitio**: Se eliminó la restricción que ocultaba las secciones estáticas del sitio (`Secciones del Sitio`) al ingresar texto de búsqueda, permitiendo al motor de `cmdk` encontrar instantáneamente páginas clave como Novedades, Nosotros, Contacto, Alabanzas, Podcast y Donaciones.

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
