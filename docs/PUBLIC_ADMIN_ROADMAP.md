# Hoja de ruta pública y administrativa

Revisión: 2026-08-31

## Ya aplicado

- La tienda usa WebP para los tres productos locales y conserva los JPG como respaldo. El peso de esas imágenes pasó de 2,33 MB a 247 KB.
- Los recursos `/images/*` y `/products/*` tienen caché corto con `stale-while-revalidate` en Vercel.
- El Open Graph y el JSON-LD ya apuntan a una imagen existente.
- El sitio y el admin tienen salto de contenido accesible.
- `StickyNav` cancela frames pendientes y evita actualizaciones de estado redundantes.
- Playwright acepta `PLAYWRIGHT_PORT` para evitar colisiones con otros servidores locales.
- La skill `.agents/skills/iglesia-jerusalen-web` fija las reglas de rendimiento, permisos, UX y verificación del proyecto.
- `npm run check:assets` impide que un asset individual del build supere 2 MiB; el build actual pasa. Los mayores chunks funcionales son `pdfEngine` (1,24 MB) y `SongViewer` (1,03 MB), ambos fuera de la primera carga.
- La página pública de inicio usa una selección explícita para eventos y normaliza la relación `ministries`, evitando descargar el esquema completo.
- El dashboard administrativo separa el resumen rápido del análisis detallado: los datos de relaciones del CRM solo se solicitan al pulsar `Cargar análisis`.
- El precache de PWA excluye imágenes pesadas de juegos, Biblia y enciclopedia; esas imágenes siguen usando caché bajo demanda.
- Las herramientas globales cerradas (`CommandPalette`, menú contextual, toolbox y recarga móvil) se cargan bajo demanda; el chunk inicial principal bajó de ~177 KB a ~90 KB.
- El precache medido queda en 171 entradas y 3,69 MB; `check:assets` lo mantiene por debajo de 5 MB y excluye los módulos administrativos/PDF pesados.
- Las rutas públicas de visita, misiones, ministerios y prédicas usan selecciones explícitas; prédicas ya no muestran contenido ficticio si Supabase falla o está vacío.
- La búsqueda global solicita solo las columnas que muestra cada resultado y normaliza las relaciones anidadas.
- Las rutas públicas de peticiones y podcast ya no descargan columnas innecesarias ni muestran contenido de demostración cuando no existen datos reales.
- Las rutas públicas de visita, misiones y detalle de ministerio también reducen sus columnas y normalizan relaciones de Supabase sin romper los tipos.
- Se preparó la migración `20260831084312_dashboard_summary_metrics.sql` con índices de filtros y una función agregada `SECURITY INVOKER`. El frontend ya tiene un adaptador opcional mediante `VITE_DASHBOARD_SUMMARY_RPC=true`, restringido al resumen completo y con fallback a las consultas actuales; debe activarse solo después de aplicar y probar la migración en Supabase remoto.
- La auditoría con navegador real confirmó y corrigió consultas 400 contra el esquema remoto: eventos no solicita todavía columnas de geolocalización/localización no migradas, anuncios usa `status`/`publish_at`, y prédicas dejó de pedir `thumbnail_url`/`video_url` inexistentes.
- Las rutas públicas de inicio, visita, eventos, prédicas, podcast, peticiones, ministerios y contacto se recorrieron en navegador sin errores de consola después de esos ajustes.
- Las estadísticas públicas no muestran `+0` como si fuera un dato real: usan skeleton durante la carga y un estado honesto cuando no hay cifras públicas disponibles.
- La integración local de Joshua Project no llama por defecto a la Edge Function remota antigua; usa `VITE_JOSHUA_PROJECT_DEV=true` para probarla explícitamente y evita ruido CORS durante el desarrollo.
- Se auditó en navegador el resto del sitio público: tienda, donaciones, nosotros, misiones, alabanzas, aula virtual, publicaciones, Biblia, juegos, comunidad y en vivo. No quedaron errores de consola en esas rutas; la Edge Function de Joshua Project requiere despliegue del arreglo CORS para funcionar desde producción/local habilitado.
- La revisión móvil a 390 px confirmó menú de secciones, navegación inferior, enlaces del pie y ausencia de overflow horizontal (`scrollWidth === clientWidth`); la apertura del menú terminó sin errores de consola.
- `npm audit fix` actualizó los parches disponibles y se reemplazó `xlsx` por CSV UTF-8 compatible con Excel; el renderer nativo de diagramas sustituyó `svguitar`, eliminando también la cadena vulnerable `svgdom → image-size`. `npm audit --omit=dev --audit-level=high` queda en 0 vulnerabilidades.
- El checkout ya no simula pagos ni crea órdenes marcadas como pagadas: hasta conectar una pasarela real, PayPhone y De Una muestran disponibilidad pendiente y la transferencia exige comprobante.
- Se eliminaron los sermones y horarios inventados usados como fallback; cuando no hay datos reales se muestra un estado vacío/error verificable.
- `SongViewer` y las herramientas de certificados cargan bajo demanda; la página pública no descarga exportación PDF, diagramas y generadores al abrir el catálogo.
- La tienda ya no crea productos ficticios cuando Supabase falla o está vacío; muestra el estado de catálogo no disponible y evita que se agreguen IDs que no existen.
- Se eliminó el botón de desarrollo para simular webhooks en la confirmación de pedidos.
- Se retiró el QR gráfico que no contenía datos verificables del recibo de donación; ahora el comprobante muestra una referencia real y explica que queda pendiente de revisión.
- El modo en vivo ya no arranca con una URL de YouTube de prueba; permanece vacío hasta que el admin configure una transmisión real.
- La portada pública dejó de depender de un store local aislado y ahora lee `live_service_sessions` con columnas explícitas y actualizaciones Realtime; el control de Culto en Vivo del admin ya puede reflejarse en público.
- La tienda y el checkout ya no presentan catálogo ni estados de compra inventados cuando falla la fuente de datos.
- El admin de podcast ya no inserta episodios ficticios cuando Supabase falla o está vacío; muestra error/estado vacío y usa un icono local si un episodio no tiene portada.
- Notificaciones ya no muestra miembros ficticios como cumpleañeros ni los incluye como destinatarios masivos cuando el directorio está vacío.
- Comunidad ya no asigna avatares Unsplash por defecto: usa iniciales cuando el autor no tiene foto y conserva solo imágenes entregadas por datos reales.
- El podcast ya no muestra alertas falsas de “próximamente”: los enlaces de Spotify y Apple Podcasts solo aparecen cuando están configurados en `podcast_show`, y se eliminó el filtro de categorías que no tenía respaldo de datos.
- Comunidad y reservas ahora tienen estados explícitos de carga, error y catálogo vacío; las reservas ya no descargan el esquema completo de `spaces`.
- Se completaron metadatos de rutas públicas y se añadieron al sitemap las rutas de programas, reservas y transmisiones en vivo. El logo de navegación se solicita con prioridad alta por estar en la primera vista.
- Juegos bíblicos, catálogo de Escuela Dominical y catálogo público de cursos ya no solicitan imágenes Unsplash cuando falta una portada; usan placeholders visuales locales y ocultan de forma segura una imagen remota rota.

## Prioridad P0 — antes de nuevas funciones

1. **Supabase remoto y migraciones**
   - Comparar las 154 migraciones canónicas con el estado remoto.
   - Clasificar los 30 SQL legacy y decidir cuáles se archivan, migran o eliminan.
   - Revisar RLS por dominio y probar roles anon, autenticado y administrador.
   - Rotar cualquier credencial que haya sido real en el historial del repositorio.
   - Última comprobación: Supabase CLI `2.116.0` está disponible, pero `migration list --project-ref` devuelve `403` por privilegios insuficientes; la comprobación local devuelve `ECONNREFUSED` porque no hay Postgres en `127.0.0.1:54322`.
   - Requisito para continuar: acceso autorizado al proyecto remoto o Docker/Postgres local.

2. **Imágenes y chunks críticos restantes**
   - Revisar visualmente los chunks grandes de `pdfEngine` (1,24 MB) y `SongViewer` (1,03 MB) para dividirlos o cargarlos solo al entrar en esas herramientas.
   - Añadir `width`, `height` y `sizes` a portadas dinámicas cuando el diseño ya conozca sus dimensiones.
   - El build muestra una advertencia deprecada de PWA (`inlineDynamicImports`); actualizar la configuración del plugin cuando se haga la siguiente migración de Vite.

3. **Datos del admin**
   - Activar `VITE_DASHBOARD_SUMMARY_RPC=true` después de aplicar y verificar la migración agregada; mientras tanto el fallback conserva el comportamiento actual.
   - Mantener consultas con columnas explícitas y límites/paginación en listados.
   - Mostrar siempre fuente, fecha de actualización y estado de cada KPI.

## Prioridad P1 — experiencia completa

### Sitio público

- Crear una navegación por tareas para visitantes: visitar, horarios, eventos, prédicas, ministerios, oración y contacto.
- Añadir estados de disponibilidad consistentes para eventos, sermones, transmisiones, tienda y formularios.
- Completar metadatos por ruta: `title`, descripción, canonical, Open Graph y datos estructurados solo cuando los datos sean reales.
- Sustituir gradualmente imágenes de Unsplash y placeholders de contenido público por assets propios gestionados desde el catálogo multimedia.
- Retirar los fallbacks de imágenes remotos que aún quedan en algunos módulos heredados/editoriales y en datos seed históricos; reemplazarlos por placeholders locales o assets del catálogo sin reescribir migraciones ya aplicadas sin comparar primero el estado remoto.

## Implementación preparada, pendiente de aplicar remotamente

- `20260831123000_community_likes_persistence.sql` agrega likes persistentes con RPC segura, recalcula contadores y limita la lectura de reacciones a cada usuario autenticado.
- La interfaz de comunidad ya exige sesión para publicar o reaccionar y deja de simular likes solo en memoria. Aplicar la migración después de confirmar el orden y estado remoto de las migraciones base de comunidad.
- La comunidad ahora carga comentarios bajo demanda, permite publicar con identidad de la sesión y mantiene `comments_count` mediante una RPC segura; la migración correspondiente es `20260831130000_community_comments_persistence.sql`.
- El chat del Culto en Vivo ya no muestra mensajes inventados ni depende de memoria local: carga los mensajes aprobados desde `live_chat_messages` y escucha inserciones por Realtime. La migración preparada es `20260831140000_live_chat_persistence.sql`.
- El formulario de decisión de fe del Culto en Vivo ahora persiste el seguimiento pastoral en `live_salvation_decisions` con estado `pending`; la migración preparada es `20260831143000_live_salvation_decisions.sql`.
- El panel administrativo de Culto en Vivo ya muestra esas decisiones y permite marcar seguimiento `contacted` o `closed`, respetando permisos pastorales.
- Revisar móvil con los flujos de visita, petición de oración, compra, reproducción y contacto.
- Reducir animación ambiental en dispositivos lentos y respetar `prefers-reduced-motion` en todos los componentes interactivos.

### Admin

- Consolidar el acceso en centros de trabajo: Comunidad, Contenido, Medios, Comunicaciones, Agenda, Culto/Producción, Formación y Comercio.
- Mantener aliases antiguos solo como redirecciones documentadas.
- Unificar búsqueda, filtros, estados de carga/vacío/error/éxito y confirmaciones destructivas.
- Sustituir alertas nativas restantes por notificaciones internas consistentes; los editores de Biblionario, recursos abiertos, ministerios, bloques y respuestas públicas ya usan `sonner`.
- Mantener las lecturas públicas sin efectos secundarios: el menú ya no intenta sembrar registros en Supabase cuando la tabla está vacía; la inicialización queda reservada a una acción administrativa.
- El gestor de navegación del admin ya usa confirmación interna y notificaciones de éxito/error para guardar, ocultar y eliminar enlaces.
- `CourseBuilder` y `OpenResourcesManager` ya usan confirmaciones internas para borrados y cambios destructivos, incluyendo el cambio de tipo de lección que descarta borradores.
- Foro LMS, solicitudes de voluntariado y apuntes de prédicas también usan confirmaciones internas; se eliminó otra capa de diálogos nativos del sitio público.
- Reservas de espacios y anuncios de iglesia también usan el diálogo central para acciones destructivas.
- CRM de solicitudes y constructor de programas de estudio también usan confirmación interna para rechazos y eliminaciones en cascada.
- Conectar cada cambio sensible con actividad/auditoría visible para usuarios autorizados.
- Migrar cargas directas de Storage al catálogo `MediaAssetPicker` por etapas.

## Prioridad P2 — rendimiento estructural

- Revisar periódicamente los chunks grandes de `CertificatesManager`, `SongViewer`, `react-core`, MapLibre y exportación PDF antes de cambiar el presupuesto de precache.
- Investigar los chunks de `react-core`, MapLibre, SongViewer y CertificatesManager antes de cambiar el presupuesto de precache.
- Mantener exportaciones tabulares en CSV o evaluar una librería XLSX mantenida solo si se requiere formato nativo; no reintroducir parsers de hojas de cálculo para archivos no confiables.
- No precachear módulos administrativos, herramientas pesadas ni colecciones educativas grandes en la primera visita pública.
- Medir LCP, CLS, INP y tamaño transferido en móvil real después de cada lote de cambios.
- Añadir una prueba de presupuesto de assets para impedir que vuelvan imágenes individuales de varios megabytes.

## Criterio de terminado

Una mejora queda terminada solo con datos reales, permisos/RLS conocidos, estados de carga/vacío/error/éxito, responsive verificado y `npm run lint`, `npm test -- --run`, `npm run build` y `npm run test:e2e` correctos.
