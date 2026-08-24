# Memoria operativa del proyecto — Iglesia Jerusalén

> Documento de contexto para futuras fases de análisis e implementación.
> Fecha de revisión: 2026-08-24.
> Fuente principal: `src/config/adminModules.ts`, `src/routes/AppRouter.tsx`, `src/pages/`, `src/features/` y las migraciones de `supabase/`.

## 1. Propósito del sistema

Iglesia Jerusalén es una plataforma integral para la vida pública, pastoral, educativa, administrativa y operativa de la congregación.

La aplicación combina:

- Sitio público de la iglesia.
- Panel administrativo con CRM, contenido, formación, finanzas y operaciones.
- Aula virtual/LMS.
- Producción de cultos, Holyrics, ProPresenter y culto en vivo.
- Biblioteca de alabanzas, sermones, podcast y recursos.
- Tienda, donaciones, inventario y punto de venta.
- Formularios, campañas, reservas, voluntariado y asistencia.

La arquitectura actual es grande y funcional, pero también presenta señales de crecimiento acumulativo: existen módulos que se solapan, nombres históricos, rutas alias, editores con capacidades distintas y varios dominios que todavía no comparten un flujo de trabajo común.

## 2. Arquitectura confirmada

- Frontend: React + TypeScript + Vite.
- UI: Tailwind CSS, Lucide, Framer Motion y componentes propios.
- Backend: Supabase para PostgreSQL, Auth, RLS, Storage y datos en tiempo real cuando aplica.
- Despliegue: Vercel.
- Router: React Router con rutas públicas, administrativas, LMS y rutas protegidas por módulo.
- Estado y sesión: hooks/stores propios, incluyendo autenticación y permisos.
- Permisos: `ProtectedRoute`, `usePermissions`, `ADMIN_MODULES` y permisos JSON/RBAC en Supabase.
- Media: catálogo de múltiples proveedores, bóveda de medios y buckets de Supabase; debe consolidarse en una única capa de selección/subida.
- Diseño: azul institucional, dorado de iglesia, serif para títulos e interfaz sans-serif para operación.

## 3. Inventario del panel administrativo

El catálogo central contiene **68 módulos administrativos** agrupados en siete áreas. Algunos módulos son hubs, otros son editores, otros son alias o herramientas avanzadas.

### 3.1. Inicio, gobierno y métricas

| Módulo | Ruta | Estado/observación |
|---|---|---|
| Resumen | `/admin` | Debe convertirse en el centro de decisiones y tareas pendientes. |
| Análisis & Métricas | `/admin/analisis` | Importante, pero debe recibir datos consistentes de todos los dominios. |
| Actividad del sistema | `/admin/actividad` | Auditoría; correctamente relacionada con Usuarios/Permisos. |
| Centro de Estrategia | `/admin/estrategia` | Nuevo dominio para objetivos, indicadores e iniciativas. |
| Mapa Territorial | `/admin/mapa-estrategico` | Debe permanecer como mapa de cobertura pastoral, no como tablero institucional. |

**Dirección recomendada:** unir Resumen, Análisis y Centro de Estrategia en una experiencia de gobierno con tres vistas: hoy, métricas y estrategia. Mantener el mapa como herramienta geográfica especializada.

### 3.2. Personas, comunidad y cuidado pastoral

| Módulo | Ruta | Observación |
|---|---|---|
| Directorio de Miembros CRM | `/admin/miembros` | Fuente principal de personas; debe ser el registro maestro. |
| Solicitudes de ingreso | `/admin/solicitudes` | Bandeja derivada del CRM; no debería parecer un módulo aislado. |
| Familias | `/admin/familias` | Vista relacional del CRM. |
| Ministerios Activos | `/admin/ministerios` | Debe relacionarse con personas, talentos, voluntariado y objetivos. |
| Misiones & Campos | `/admin/misiones` | Dominio propio, pero relacionado con miembros, donaciones y contenido. |
| Gestión Voluntariado | `/admin/voluntariado` | Debe absorber talentos, turnos, disponibilidad y necesidades. |
| Grupos Pequeños | `/admin/grupos` | Debe compartir miembros, asistencia, líderes y comunicaciones. |
| Peticiones de Oración | `/admin/peticiones` | Debe conectarse con culto en vivo, pastoral, privacidad y seguimiento. |
| Pipeline CRM | `/admin/crm-pipeline` | Debe representar visitantes, nuevos contactos y próximos pasos. |
| Workflows & Reglas | `/admin/automatizaciones` | Motor transversal, no solo de personas. |
| Campañas Email/SMS | `/admin/campanas` | Debe consumir segmentos del CRM y registrar entregas. |
| Chat | `/admin/chat` | Mensajería operativa o pastoral; necesita límites claros con comunicaciones. |
| Salud Pastoral | `/admin/salud-pastoral` | Analítica sensible; requiere gobernanza, explicación y privacidad. |
| Check-In Kiosko | `/admin/checkin-kiosk` | Asistencia rápida sin obligar a entregar datos personales. |
| Check-In Infantil | `/admin/checkin-infantil` | Dominio de seguridad infantil; no debe mezclarse con asistencia general. |

**Dirección recomendada:** crear un hub de Comunidad con pestañas CRM, familias, voluntariado, grupos, peticiones y asistencia. Mantener el check-in infantil como módulo especializado por seguridad.

### 3.3. Contenido, comunicación y publicaciones

| Módulo | Ruta | Observación |
|---|---|---|
| Centro de contenido | `/admin/contenido` | Hub editorial y de activos; debe ser la puerta de entrada. |
| Editor de páginas | `/admin/paginas` | Editor estructural del sitio. Prioridad alta de modernización. |
| Centro Editorial | `/admin/publicaciones` | Publicaciones, blogs y espacios editoriales. |
| Sermones & Prédicas | `/admin/sermones` | Debe recibir automáticamente el resultado de Culto en Vivo. |
| Podcast & Audio | `/admin/podcast` | Debe centralizar audio local, metadatos, waveform y publicación. |
| Liderazgo/oradores | `/admin/pastores` | Catálogo de autores y expositores; debe compartirse con sermones. |
| Biblioteca de Alabanzas | `/admin/alabanzas` | Letras, acordes, autores, arreglos e integración con Holyrics. |
| Calendario Eventos | `/admin/eventos` | Fuente de eventos; debe seleccionar espacio y alimentar reservas. |
| Horarios de reuniones | `/admin/horarios` | Vista especializada de reuniones; puede ser una vista del calendario. |
| Anuncios | `/admin/anuncios` | Publicación editorial corta; debe poder aparecer en Culto en Vivo. |
| Formularios Dinámicos | `/admin/formularios` | Builder transversal para registros y solicitudes. |
| Biblioteca de Sonidos | `/admin/juegos/audio-library` | Ruta histórica/extraña; debe integrarse al Media Hub y Podcast. |
| Bóveda de Media | `/admin/media-vault` | Debe convertirse en selector de recursos, no solo explorador de archivos. |
| Centro de comunicaciones | `/admin/comunicaciones` | Hub nuevo que debe unificar contacto, notificaciones y campañas. |

**Dirección recomendada:** unificar el ciclo `crear → revisar → publicar → reutilizar` para páginas, blogs, sermones, anuncios, podcast y culto en vivo. Mantener tipos de contenido distintos, pero compartir editor, media picker, autores, portada, estados, SEO, programación y analítica.

### 3.4. Diseño, apariencia y sistema visual

| Módulo | Ruta | Observación |
|---|---|---|
| Personalizar Panel | `/admin/apariencia` | Debe ser el centro de apariencia global. |
| Menú de Navegación | `/admin/apariencia/menu` | Debe controlar navegación pública y móvil. |
| Biblioteca Componentes UI | `/admin/componentes` | Herramienta avanzada para el sistema de diseño. |
| Guía de Estilo/Tokens | `/admin/diseno` | Debe ser fuente de tokens, no solo catálogo. |
| Catálogo de Animaciones | `/admin/animaciones` | Avanzado; mantener separado, pero integrado a presets. |
| Catálogo de Logos | `/admin/logos` | Recurso de marca; debe alimentar selectores de media y plantillas. |
| Estudio de Botones/Glass | `/admin/apariencia/botones` | Probable herramienta de prototipado, no módulo operativo diario. |
| Editor de Presentaciones | `/admin/presentacion` | Debe evolucionar a block builder completo. |
| Extensiones/Plugins | `/admin/extensiones` | Avanzado y condicionado a seguridad/compatibilidad. |

**Dirección recomendada:** unificar Apariencia, Diseño, Logos, Componentes y Animaciones bajo `Sistema de Diseño`. Presentar una sola pantalla principal con secciones: marca, colores, tipografía, navegación, componentes y efectos.

### 3.5. Formación y aula virtual

| Módulo | Ruta | Observación |
|---|---|---|
| Aula Virtual LMS | `/admin/lms` | Hub académico. |
| Landing del LMS | `/admin/lms/landing-editor` | Debe compartir block builder con páginas y presentaciones. |
| Analítica LMS | `/admin/lms/analytics` | Debe alimentar métricas y certificados. |
| Programas & Estudios | `/admin/programas` | Catálogo y constructor de programas. |
| Constructor de programa | `/admin/programas/:id` | Editor especializado. |
| Discipulado | `/admin/discipulado` | Debe integrarse con programas, lectura y gamificación. |
| Matrículas | `/admin/lms/matriculas` | Bandeja de solicitudes académicas. |
| Recursos abiertos | `/admin/recursos-abiertos` | Biblioteca educativa con editor propio. |
| Constructor de recursos | `/admin/recursos-abiertos/:id` | Debe compartir bloques con páginas/LMS. |
| Dirección académica | `/lms/director` | Vista de gobierno académico. |
| Juegos educativos | `/admin/juegos` | Debe compartir contenidos bíblicos y gamificación. |
| Certificados | `/admin/certificados` | Debe consumir finalización de cursos y programas. |

**Dirección recomendada:** mantener LMS como dominio separado, pero compartir usuarios, media, editor de bloques, certificados, notificaciones y analítica.

### 3.6. Finanzas, tienda y operaciones comerciales

| Módulo | Ruta | Observación |
|---|---|---|
| Gestión Financiera | `/admin/finanzas` | Debe ser el centro financiero, con reportes y conciliación. |
| Gestión de donaciones | `/admin/finanzas/donaciones` | Debe relacionarse con campañas, recibos y contabilidad. |
| Productos Tienda | `/admin/productos` | Catálogo de productos. |
| Caja POS | `/admin/pos` | Operación presencial; debe compartir inventario. |
| Órdenes y pedidos | `/admin/ordenes` | Estado de venta y cumplimiento. |
| Pagos y envíos | `/admin/pagos-envios` | Configuración operativa del comercio. |

**Dirección recomendada:** integrar Finanzas, Donaciones, Tienda, POS, Pedidos e Inventario en un ecosistema comercial con un libro de movimientos y permisos separados por función.

### 3.7. Producción, culto y logística

| Módulo | Ruta | Observación |
|---|---|---|
| Producción Dominical | `/admin/produccion` | Debe ser el tablero principal de producción. |
| ProPresenter | `/admin/propresenter` | Control técnico/pantallas. |
| Holyrics | `/admin/holyrics` | Letras, canciones, stage y conexión. |
| Control de Culto en Vivo | `/admin/culto-en-vivo` | Orquestador público del culto. |
| Tiempo de Culto | `/admin/tiempo-de-culto` | Planificador; debe alimentar producción y Culto en Vivo. |
| Inventario Equipos | `/admin/inventario` | Recursos técnicos y mantenimiento. |
| Reservas de Espacios | `/admin/reservas` | Espacios, disponibilidad, solicitudes, mapas e imágenes. |
| Presupuestos & Arreglos | `/admin/presupuestos-arreglos` | Decisiones operativas y compras. |
| Credenciales & Redes | `/admin/boveda-credenciales` | Actualmente deshabilitado; no exponer hasta tener seguridad completa. |

**Dirección recomendada:** crear un `Centro de Operaciones del Culto` que conecte planificación, producción, canciones, Holyrics, ProPresenter, cámaras, anuncios, asistencia, oración, voluntarios y transmisión. El reproductor público debe ser contextual y mostrarse solo cuando exista una fuente de vídeo válida.

## 4. Rutas públicas principales

### Iglesia y comunidad

`/`, `/nosotros`, `/visita`, `/contacto`, `/ministerios`, `/ministerios/:slug`, `/misiones`, `/misiones/:section`, `/eventos`, `/anuncios`, `/comunidad`, `/comunidad/culto-en-vivo`, `/en-vivo`, `/peticiones`, `/cumpleanos`.

### Contenido y recursos

`/predicas`, `/predicas/:id`, `/podcast`, `/expositores`, `/publicaciones`, `/publicaciones/:spaceSlug`, `/publicaciones/:spaceSlug/:documentId`, `/recursos/alabanzas`, `/recursos/alabanzas/:songSlug`, `/recursos/biblia`, `/recursos/juegos` y los juegos específicos.

### Formación y usuarios

`/programas`, `/programas/:id`, `/aula-virtual`, `/escuela-dominical`, `/plan-lectura`, `/certificados/:id`, `/cert-verify/:hash`, `/formularios/:formId`, `/registro-miembro/ingreso`, `/mi-horario`.

### Comercio

`/tienda`, `/cart`, `/checkout`, `/order-success`, `/mis-compras`, `/donations`, `/reservas`.

## 5. Módulos antiguos, heredados o con señales de deuda

La antigüedad exacta de cada componente no siempre está expresada en el nombre del archivo. La clasificación se basa en rutas históricas, nombres duplicados, migraciones recientes y diferencias de arquitectura.

### Prioridad alta de revisión

1. **Editor de páginas (`PageEditor`)**: es una pieza central, pero debe compartir el block builder con presentaciones, formularios, LMS, publicaciones y Culto en Vivo.
2. **Editor de presentaciones (`PresentationEditor`)**: tiene una base previa y requiere una arquitectura de bloques estable, responsive y reutilizable.
3. **Bandejas separadas**: `ContactInbox`, `NotificationsManager`, `CommunicationCenter`, `ChatManager` y campañas deben coordinarse en un Centro de Comunicaciones.
4. **Calendario, horarios y Tiempo de Culto**: actualmente son conceptos cercanos y deben compartir servicios, eventos, espacios, equipos y voluntarios.
5. **Biblioteca de Sonidos**: su ruta bajo juegos indica deuda de organización; debe migrar al Media Hub.
6. **Mapa Estratégico**: el nombre histórico confundía geografía con planificación; ya se separó en Mapa Territorial y Centro de Estrategia.
7. **Apariencia, Diseño, Componentes, Logos y Animaciones**: existe fragmentación de configuración visual.
8. **Bóveda de Media y proveedores multimedia**: deben tener una capa única de selección, carga, transformación, fallback y permisos.

### Prioridad media

- Módulos con alta dependencia de datos compartidos: Ministerios, Voluntariado, Grupos, Familias y CRM.
- Finanzas, Donaciones, POS, Tienda, Pedidos e Inventario.
- Recursos abiertos, Programas, Discipulado y LMS.
- Analítica general y Salud Pastoral, por la necesidad de un modelo común de métricas y privacidad.

### Herramientas avanzadas que no deben dominar la navegación diaria

Componentes UI, botones/glass, catálogo de animaciones, logos, plugins, credenciales y algunas herramientas de desarrollo deberían vivir en un área avanzada de sistema.

## 6. Unificaciones recomendadas

### 6.1. Centro de Comunicaciones

Unificar:

- Buzón de contacto.
- Notificaciones.
- Chat.
- Campañas Email/SMS.
- Anuncios.
- Respuestas de formularios.

Cada conversación o envío debe tener origen, destinatario, estado, responsable, fecha, prioridad y registro de actividad.

### 6.2. Centro de Contenido

Unificar la experiencia de:

- Páginas.
- Publicaciones/blogs.
- Sermones.
- Podcast.
- Anuncios.
- Presentaciones.
- Recursos abiertos.

No significa mezclar tablas: significa compartir editor, media picker, portada, autores, taxonomías, estados, revisión, publicación y analítica.

### 6.3. Centro de Medios

Una biblioteca única para:

- Supabase Storage.
- Cloudflare/R2 si está configurado.
- URLs externas.
- YouTube, Facebook y otras fuentes de vídeo.
- Imágenes pegadas desde el portapapeles.
- Audio local.
- Recursos de Holyrics y ProPresenter.

Todo recurso debe tener proveedor, URL, tamaño, mime type, dimensiones, duración, miniatura, propietario, estado y referencia de uso.

### 6.4. Centro de Comunidad

Unificar visualmente:

- Miembros.
- Familias.
- Visitantes/CRM.
- Ministerios.
- Voluntariado.
- Grupos.
- Peticiones.
- Asistencia.

La ficha de una persona debe mostrar relaciones y participación sin obligar a navegar por siete módulos separados.

### 6.5. Centro de Culto y Producción

Unificar:

- Planificador de culto.
- Lista de alabanzas.
- Holyrics.
- ProPresenter.
- Anuncios.
- Cámaras y enlaces de transmisión.
- Asistencia.
- Peticiones de oración.
- Voluntarios y turnos.
- Culto en Vivo.

El flujo recomendado es: planificar → preparar → producir → transmitir → cerrar culto → convertir en sermón/publicación.

## 7. Funcionalidades críticas pendientes

### Críticas de producto

- Editor de bloques común y realmente reutilizable.
- Selector multimedia multi-proveedor con pegado desde portapapeles.
- Portada configurable como imagen o vídeo contextual.
- Sincronización en tiempo real entre Holyrics, ProPresenter y Culto en Vivo.
- Sistema de eventos y espacios con disponibilidad real.
- Asistencia rápida por contador, sin solicitar nombres cuando no sea necesario.
- Métricas comunes para Dashboard, Analítica y Centro de Estrategia.
- Estados editoriales claros: borrador, revisión, programado, publicado, archivado.
- Historial, versiones y recuperación de contenido.

### Críticas de seguridad

- Mantener RLS por dominio y no confiar únicamente en la interfaz.
- Separar datos pastorales sensibles de analítica agregada.
- No mostrar coordenadas exactas o datos personales en mapas públicos.
- Proteger credenciales y secretos fuera del frontend.
- Auditar permisos alias (`permission`) para que no existan módulos inaccesibles o excesivamente amplios.
- Añadir validación de URLs externas y sanitización de contenido embebido.

### Críticas de experiencia

- Menú móvil inferior con acceso a Inicio, Comunidad, Culto en Vivo, Recursos y Perfil/Más.
- Acciones rápidas persistentes: crear contenido, registrar asistencia, abrir culto, responder solicitud.
- Búsqueda global unificada.
- Estados vacíos que expliquen qué hacer.
- Confirmación visual de guardado, sincronización y errores de integración.
- Diseño consistente entre los módulos que actualmente tienen estilos distintos.

## 8. Estructura de datos recomendada

### Entidades maestras

- `profiles` / miembros.
- `families`.
- `ministries`.
- `campuses`.
- `events`.
- `spaces`.
- `media_assets`.
- `authors`/oradores.

### Entidades de publicación

- Páginas.
- Documentos editoriales.
- Sermones.
- Episodios de podcast.
- Anuncios.
- Presentaciones.
- Formularios.

### Entidades de culto

- Sesión de culto.
- Orden del culto.
- Canciones y arreglos.
- Estado de Holyrics.
- Estado de ProPresenter.
- Streams.
- Asistencia agregada.
- Peticiones en vivo.
- Encuestas/preguntas.
- Resumen manual de prédica.

### Entidades estratégicas

- Objetivos.
- Indicadores.
- Iniciativas.
- Revisiones.
- Responsables.
- Áreas y ministerios relacionados.

## 9. Hoja de ruta recomendada

### Fase 0 — Estabilización

- Aplicar y verificar todas las migraciones en Supabase.
- Generar tipos de base de datos actualizados.
- Revisar rutas protegidas contra el catálogo de módulos.
- Corregir errores de compilación globales y normalizar lint.
- Crear un inventario de tablas, permisos, owners y relaciones.

### Fase 1 — Cimientos compartidos

- Sistema de media multi-proveedor.
- Block builder común.
- Data table, filtros, estados, modales y formularios reutilizables.
- Sistema de autores, taxonomías y portadas.
- Centro de actividad y notificaciones.

### Fase 2 — Contenido y comunicaciones

- Modernizar `/admin/paginas`.
- Conectar publicaciones, sermones, podcast, anuncios y formularios.
- Unificar contacto, chat, notificaciones y campañas.
- Añadir versiones, revisión, programación y recuperación.

### Fase 3 — Comunidad y pastoral

- Hub de miembros, familias, ministerios, grupos y voluntariado.
- Talentos y habilidades.
- Asistencia agregada y check-in simple.
- Peticiones con estados, responsables y privacidad.

### Fase 4 — Culto y producción

- Planificador completo.
- Conector Holyrics y ProPresenter.
- Control de culto en vivo.
- Fuentes de vídeo opcionales y contextuales.
- Letras, anuncios, preguntas y encuestas en vivo.
- Cierre automático hacia sermón, podcast y publicación.

### Fase 5 — Gobierno y crecimiento

- Centro de Estrategia completo.
- Métricas provenientes de módulos reales.
- Mapa territorial y cobertura pastoral.
- Analítica ejecutiva con filtros por sede, ministerio, periodo y fuente.
- Revisiones periódicas y alertas de objetivos.

### Fase 6 — Comercio y formación

- Integración financiera, donaciones, tienda, POS, pedidos e inventario.
- Block builder compartido con LMS.
- Certificados y progreso unificados.
- Recursos educativos, juegos y discipulado conectados.

## 10. Criterios para decidir si un módulo se une o se divide

### Unificar cuando

- Usa las mismas entidades y permisos.
- El usuario realiza el mismo flujo con nombres diferentes.
- Comparte editor, bandeja, filtros o media.
- La separación obliga a copiar información.
- Hay una única decisión de negocio detrás.

### Dividir cuando

- Existen permisos o riesgos de privacidad distintos.
- El flujo técnico exige una interfaz especializada.
- La cantidad de datos hace que el módulo sea difícil de operar.
- El público objetivo es distinto: administrador, producción, docente o visitante.
- La seguridad requiere separación estricta, como check-in infantil o credenciales.

## 11. Convenciones para futuras implementaciones

- Antes de crear una página nueva, buscar si existe un hub que deba ampliarse.
- Antes de crear una tabla, comprobar si una entidad existente puede extenderse sin duplicación.
- Todo módulo debe definir: propósito, fuente de datos, permisos, estados, acciones, auditoría y relación con otros módulos.
- Toda subida multimedia debe pasar por el selector común de proveedores.
- Toda publicación debe soportar portada de imagen o vídeo opcional.
- Toda integración externa debe tener estado `conectado`, `degradado`, `desconectado` y último error visible.
- No introducir resúmenes automáticos de IA en el flujo de prédica sin solicitud explícita; el resumen manual de la iglesia es la fuente oficial.
- Verificar siempre con `npx tsc --noEmit`, ESLint y pruebas funcionales del módulo.
- No declarar una migración aplicada hasta comprobarla en el proyecto Supabase correspondiente.

## 12. Estado de la última fase

Implementado recientemente:

- Separación entre Mapa Territorial y Centro de Estrategia.
- Ruta `/admin/estrategia`.
- Objetivos, indicadores, iniciativas y revisiones con RLS en la migración `20260824150000_strategic_planning_center.sql`.
- Navegación administrativa y permisos `strategy`.
- Indicadores e iniciativas editables desde el detalle del objetivo.

Pendiente de verificación externa:

- Aplicar la migración en Supabase.
- Confirmar políticas RLS en el proyecto remoto.
- Probar con roles distintos a administrador.
- Alimentar los indicadores con datos reales de eventos, asistencia, voluntariado, contenido y formación.

## 13. Referencias internas

- Arquitectura general: [`PROJECT_KNOWLEDGE.md`](./PROJECT_KNOWLEDGE.md).
- Plan del mapa estratégico: [`strategic-map-improvement-plan.md`](./strategic-map-improvement-plan.md).
- Culto e importación de alabanzas: [`culto-en-vivo-y-importacion-alabanzas.md`](./culto-en-vivo-y-importacion-alabanzas.md).
- Integración Holyrics: [`HOLYRICS_INTEGRATION.md`](./HOLYRICS_INTEGRATION.md).
- Diseño y herramientas visuales: [`DESIGN_AND_AI_TOOLKIT.md`](./DESIGN_AND_AI_TOOLKIT.md).
- Plan completo de modernización: [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md).
