# Changelog

Todas las novedades y cambios notables de este proyecto están documentados en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.14.10] - 2026-10-23

### Añadido
- «El Código de las Parábolas», episodio piloto interactivo sobre la moneda perdida, con entrada desde el catálogo de juegos y ruta pública directa.

### Mejorado
- Descubrimiento de objetos mediante zonas de toque discretas y clicables, adaptadas a teclado, móvil y movimiento reducido.
- Barrido de escoba con inclinación, rebote y polvo; la moneda aparece con giro y resorte, y la lámpara parpadea suavemente.

## [1.14.9] - 2026-10-23

### Añadido
- Nuevo espacio de estudio bíblico con Atlas, Enciclopedia de lugares y Cronología conectados con el lector de `/recursos/biblia`.
- Recorrido exploratorio del Éxodo y Canaán con 14 escenas, mapa móvil accesible, referencias y preguntas de observación; el trazado se identifica como tradicional y señala lugares discutidos.
- Atlas de los viajes de Pablo con diez escalas enlazadas a Hechos 27–28 y fichas de lugares con referencias bíblicas.
- Panel de fuentes y permisos que distingue recursos en uso, referencias doctrinales, candidatas y materiales de uso condicionado.

### Accesibilidad y contenido
- Se conservan las atribuciones y licencias de las fuentes, y se aclara que el acceso gratuito no concede permiso para reutilizar contenido.
- El contenido bíblico enlaza al lector compartido en lugar de duplicar versiones; los mapas se presentan como recursos de estudio, no como reconstrucciones históricas definitivas.

### Corregido
- Se elimina del lanzamiento la ruta del juego piloto de parábolas que aún no está incluido entre los archivos publicados, evitando que interrumpa la compilación de producción.

## [1.14.8] - 2026-10-23

### Mejorado
- La sección de cifras del Inicio estrena «Cada vida cuenta», con composición editorial, iconos, tonos azul noche y dorado e invitación a conocer la iglesia.
- Los contadores aparecen de forma escalonada y una luz suave sigue el cursor; la sección se adapta a móvil, modo oscuro, teclado y movimiento reducido.

### Corregido
- Los totales se muestran sin signo de incremento y las cifras por edad usan las etiquetas «Niños en comunidad» y «Jóvenes en comunidad».

## [1.14.7] - 2026-10-22

### Mejorado
- El giro 3D conserva el ángulo elegido, se desacelera con una inercia breve y reanuda suavemente la rotación automática desde esa posición.
- El encuadre permanece estable durante el giro; se elimina el efecto de «respiración» de la cámara.
- La bienvenida permite acercar y alejar con botones, rueda o pellizco, pausar el giro, volver a la vista frontal y explorar con el teclado; los controles se adaptan al móvil.

## [1.14.6] - 2026-10-22

### Mejorado
- La retícula del suelo avanza hacia el fondo en un bucle continuo durante la bienvenida 3D.
- Tres nubes se desplazan lentamente por el cielo a velocidades distintas, sin tapar la fachada; la animación se detiene al entrar y respeta la preferencia de movimiento reducido.

## [1.14.5] - 2026-10-22

### Mejorado
- La bienvenida 3D muestra la fachada de frente durante la apertura y gira después de forma gradual para facilitar su lectura.
- El encuadre se adapta al ángulo y al ancho de pantalla, con mayor presencia de la iglesia en móvil y una sombra suave de apoyo.

## [1.14.4] - 2026-10-22

### Corregido
- El ventanal central y otros paños de vidrio de la bienvenida 3D recuperan sus acabados visibles; se eliminó la transparencia total heredada de la importación.
- La luz de la escena conserva el color crema de la fachada y mejora el contraste con los ventanales azules.

## [1.14.3] - 2026-10-22

### Mejorado
- Se actualizó la identidad visual del sitio con el nuevo emblema de Iglesia Jerusalén en navegación, pie, administración, certificados, presentación y favicon.
- El pie de página usa el logo horizontal con «Posesión de Paz»; las secciones institucionales usan la variante sin lema.
- Se corrigió el tamaño y el contraste del logo del pie para que el emblema y el lema se vean completos.
- El catálogo administrativo identifica las tres variantes vigentes y conserva las anteriores como referencia.
- Se incorporaron los recursos SVG y PNG a la biblioteca de medios con su fuente, crédito y derechos registrados.

## [1.14.2] - 2026-10-21

### Mejorado
- La bienvenida 3D presenta el modelo integral más reciente de la iglesia, exportado desde el archivo maestro de Blender y comprimido para reducir la descarga inicial.
- Se ajustó la iluminación de la escena para conservar mejor el contraste de fachada, ventanas y molduras.

## [1.14.1] - 2026-10-21

### Corregido
- La verificación de correo en compras y biblioteca usa permisos de servidor limitados a identidad y confirmación. No concede lectura completa de usuarios ni acceso desde el navegador. La regresión reproduce los permisos reales de producción.

## [1.14.0] - 2026-10-21

### Añadido
- Seguimiento de invitados con clave privada guardable y vinculación a una cuenta con el mismo correo verificado.
- Mis compras reúne historial, comprobantes privados y biblioteca digital con acceso comprobado por compra.
- Enlaces compartibles de productos que conservan su ficha al recargar.

### Seguridad y operación
- Entrega digital por línea de pedido, fuente e instrucciones conservadas, auditoría de apertura y bloqueo ante cancelación o reembolso. Enlaces maestros restringidos al personal autorizado.
- Los recursos actuales se abren en Google Drive/Docs con enlaces externos persistentes. Sin correo automático ni verificación bancaria automática; ventas deshabilitadas hasta completar la preparación operativa.

## [1.13.0] - 2026-10-21

### Añadido
- Inventario central integrado en Tienda y comercio: fichas, ubicación, notas, campos adicionales, mínimos y disponibilidad por variante.
- Conteos físicos con borrador, confirmación, control de conflictos y trazabilidad; entradas/salidas con motivo, responsable y recuperación segura de reintentos.

### Seguridad
- Existencias protegidas frente a sobrescrituras del editor; movimientos de checkout y POS auditados en la misma transacción. Nuevos productos en cero, variantes conciliadas y stock heredado pendiente de conteo real. Migración y función instaladas; ventas deshabilitadas hasta completar la preparación operativa.

## [1.12.0] - 2026-10-21

### Seguridad y operación
- Checkout transaccional con cálculo de importes en servidor, reservas de 24 horas e identidad estable para reintentos.
- Comprobantes privados con lectura temporal autorizada, catálogo público sin costos internos ni enlaces maestros y acciones administrativas verificadas en servidor.
- Carrito, compras y POS adaptados al flujo seguro. Migración y función instaladas; nuevas ventas deshabilitadas hasta confirmar catálogo y conteo físico.

## [1.11.3] - 2026-10-21

### Mejorado
- Identidad dorada adaptable a modo claro y oscuro en encabezados, agenda, horarios, prédicas y perfiles de Nosotros.
- Tarjetas de eventos y horarios con fechas, etiquetas y acentos dorados coherentes con el logo.
- Referencias y lecturas bíblicas sin subrayado, con foco visible y acceso al pasaje en una pestaña nueva.
- Versículo del día, navegación de ruta y documentos institucionales con acentos editoriales coordinados.

## [1.11.2] - 2026-10-21

### Mejorado
- Encabezado móvil alineado al borde superior, sin la franja vacía antes de la navegación.
- Acceso «Buscar» integrado visualmente con los demás iconos de la barra inferior.
- Ámbitos de la historia con contenido desplegable en una sola vista a la vez.

### Seguridad
- La toolbox requiere una sesión iniciada y conserva el filtrado de herramientas según los roles autorizados; cierra las herramientas activas al cerrar sesión.

## [1.11.1] - 2026-10-21

### Seguridad
- La verificación pública de certificados conserva sus consultas mediante funciones acotadas y ya no permite leer directamente las tablas de certificados con acceso anónimo.

## [1.11.0] - 2026-10-20

### Añadido
- Acceso directo desde Nosotros a la planificación de visitas y a los horarios vigentes; los horarios se obtienen de la agenda.
- Bandeja de trabajo con seguimientos y tareas del día, y calendario editorial con borradores, revisiones, programación y publicaciones.

### Mejorado
- Presentación del liderazgo con perfiles, textos alternativos, imágenes adaptables y acciones de contacto y oración; documentos institucionales con opciones claras para leer o descargar.
- Biblioteca de medios con filtros de procedencia y selector reutilizable en los editores de contenido, juegos y presentaciones.
- Panel de salud del sitio con fecha y fuente de las revisiones, y accesos a la administración de permisos.

## [1.10.1] - 2026-10-19

### Mejorado
- Hero y perfiles de liderazgo de Nosotros con tres retratos editoriales coordinados, adaptables y optimizados para web.

## [1.10.0] - 2026-10-20

### Añadido
- Galerías de fotos por departamento y ministerio, con administración para líderes autorizados y visualización en sus páginas y en la comunidad.
- Ilustraciones editoriales para personajes bíblicos y nuevos recursos visuales volumétricos para la sección de visión y misión.
- Información ampliada de los libros bíblicos, con autoría, contexto histórico, temas y línea temporal aproximada.

### Mejorado
- Biblioteca de la enciclopedia bíblica adaptable a pantallas pequeñas, con imágenes completas y fichas más informativas de personajes y lugares.
- Portada, páginas de identidad y visita, galería, tarjetas de prédicas y fondo de Alabanzas con ajustes de presentación, imágenes y navegación.
- Controles de programas públicos para separar la lectura publicada de las comprobaciones privadas de administración.
- Experiencia de los juegos bíblicos y sus controles de teclado.

## [1.9.0] - 2026-10-19

### Añadido
- Memorama Bíblico con 4, 6 u 8 parejas, modo individual o por turnos para 2–4 personas, imágenes dobles, explicación, referencia y pregunta de repaso al encontrar una pareja.
- Nuevas asociaciones ilustradas de objetos y relatos bíblicos, junto con más personajes, preguntas y opciones para renovar las partidas.
- Lectura emergente reutilizable de referencias bíblicas, con acceso directo al pasaje en una nueva pestaña.
- Teclas A–D e Intro en Biblionario, Mayús + Intro para avanzar en los cuatro juegos y escritura de letras con teclado en Adivina la palabra.
- Retratos de personajes al revelar respuestas, nuevas portadas y herramientas de administración para completar, previsualizar y publicar contenido de Memorama.

### Mejorado
- Catálogo unificado y responsive de cuatro juegos; el antiguo Ahorcado ahora se presenta como «Adivina la palabra» sin romper su dirección anterior.
- Respuesta inmediata y accesible al confirmar preguntas de Biblionario, con estados claros de acierto y error.
- Orden aleatorio de preguntas, palabras, personajes y parejas que reduce repeticiones consecutivas.

## [1.8.2] - 2026-10-16

### Corregido
- Modelo 3D del templo reconstruido con geometría propia, sin pegar una imagen de fachada ni duplicar el cerramiento. Incluye el cuerpo central proyectado, un solo portón frontal y corredores laterales; el menú y la experiencia de entrada se conservan.

## [1.8.1] - 2026-10-16

### Mejorado
- Bienvenida minimalista con la iglesia completa, giro automático de 360°, arrastre libre y un único botón «Entrar».
- Transición que contrae la escena a un objeto lateral y revela el Inicio existente; el scroll mueve el modelo según dirección y velocidad.
- Encuadre adaptable y círculo lateral más discreto en móvil, con repetición, Escape y alternativas sin animación o WebGL.

## [1.8.0] - 2026-10-16

### Añadido
- Bienvenida 3D opcional en Inicio: templo visual inspirado en la fachada de Jerusalén, descenso y giro con scroll, acercamiento al entrar y acceso al Inicio existente.
- Atajos para saltar y repetir la bienvenida, con alternativa estática para movimiento reducido o falta de WebGL.

### Mejorado
- Carga diferida del motor 3D para que las visitas posteriores mantengan ligero el Inicio habitual.

## [1.7.0] - 2026-10-13

### Añadido
- Inicio con pendientes por permiso, revisiones y solicitudes propias; seguimiento de visitas con responsable, etapa, recordatorio interno y auditoría.
- Recuperación automática temporal de páginas/lecturas, comparación e historial de secciones, conflictos y avisos al salir, incluido Atrás/Adelante.
- Medios con créditos, derechos, fuente, texto alternativo, detección SHA-256 de duplicados y optimización opcional a WebP.
- Salud manual del sitio en Contenido: HTTPS/referencias internas, anuncios vencidos, errores de renderizado locales y revisión de seguridad fechada.

### Seguridad
- Vista store_orders respeta RLS; cinco funciones fijan search_path; triggers sin exposición RPC.
- CRM, registros de automatización, páginas, catálogo y almacenamiento respetan permisos; restricciones individuales prevalecen sobre permisos heredados.
- Registro con mínimo 12 caracteres y comprobación de filtraciones mediante prefijo de huella. Protección nativa de Auth pendiente de sesión del dashboard; no se declara activada.

### Mejorado
- Accesos móviles a comunicaciones/contenido, etapas sin arrastrar, notas opcionales plegables, controles táctiles y fechas locales de anuncios.
- Guardar/reordenar no sobrescribe versiones ajenas; retirar un recurso del catálogo conserva su original y sus enlaces.

## [1.6.1] - 2026-10-12

### Corregido
- Retirada la reseña educativa y su referencia a UTPL de la historia de la iglesia, por corrección del usuario sobre su pertinencia.
- Borrador activo y versión pública corregidos sin alterar los demás capítulos; prueba de regresión del alcance institucional.

---

## [1.6.0] - 2026-10-12

### Añadido
- Recorrido de cinco lecturas con progreso opcional guardado en el dispositivo, preguntas de comprensión y explicación de respuestas.
- Editor de lecturas en Contenido/Páginas con bloques compartidos, fuentes, vista previa, notas privadas, borradores, revisión pastoral, publicación y recuperación de versiones.
- Snapshots públicos separados de borradores/historial, permisos en Supabase, publicación atómica y control de conflictos entre editores.
- Interpretación del Himno Cuadrangular de ICC SUR Ibagué en YouTube, con carga voluntaria del reproductor, crédito y enlace original.
- Reseña local del servicio educativo respaldada por la investigación de Isabel M. Ávila Burbano en UTPL, sin confundir fechas escolares y fundación de la congregación.

### Mejorado
- Sitemap incluye las cinco lecturas y se elimina el canonical fijo de Inicio; se conserva el canonical dinámico existente del layout.
- Lecturas con imágenes originales optimizadas, estimación de lectura y firma/fecha de revisión solo cuando existe una revisión registrada.
- Pruebas del recorrido, progreso, metadatos, derechos de edición, conflictos y publicación; notas de autorización de audio permanecen privadas.

---

## [1.5.1] - 2026-10-12

### Corregido
- Accesos de la presentación principal de Nosotros apuntan al nuevo recorrido de aprendizaje.
- Verificación de todos los enlaces internos de la portada para detectar destinos eliminados.

---

## [1.5.0] - 2026-10-12

### Añadido
- Cinco lecturas públicas: Origen Cuadrangular, Nuestra doctrina, Símbolos y bandera, Nuestra historia y Nuestro himno.
- Referencias bíblicas, fuentes institucionales, índices, preguntas de reflexión y navegación entre lecturas.
- Emblema y cuatro rostros originales del archivo de Jerusalén, optimizados en WebP; bandera didáctica con su fuente y variante ecuatoriana explicadas.

### Mejorado
- Nosotros como portada de seis destinos de aprendizaje, conservando presentación, liderazgo y documentos.
- Distinción entre la visión bíblica y la interpretación de Aimee; cronología internacional corregida y fechas legales nacionales documentadas.
- Búsqueda global con acceso a cada lectura; pruebas de enlaces, imágenes y fidelidad del himno.

---

## [1.4.11] - 2026-10-12

### Corregido
- Título de la pestaña de Documentos: Helmet recibe una sola cadena para conservar el nombre de la biblioteca y del documento al navegar.
- Prueba de regresión del título tanto en la biblioteca como en el lector.

---

## [1.4.10] - 2026-10-12

### Añadido
- Himno Cuadrangular completo en Nosotros, cotejado con el Reglamento interno, página 2, con enlace al PDF original.
- Navegación interna para historia, identidad, himno, principios, liderazgo y documentos.

### Mejorado
- Documentos institucionales al final del recorrido de Nosotros y metadatos propios de la página.
- Entradas de historia y pilares respetan la preferencia de movimiento reducido.

### Corregido
- Vitest utiliza el almacenamiento de jsdom en Node 25+ y excluye herramientas de LOCAL de las pruebas de la aplicación.

---

## [1.4.9] - 2026-10-11

### Corregido (Fixed)
- **Anuncios de inicio**: los eventos no recurrentes se ocultan después de su último día en la zona horaria America/Guayaquil. Los avisos generales y eventos recurrentes conservan su caducidad editorial.
- **Comunicados vigentes**: el filtrado se aplica antes del límite de tres anuncios y consulta páginas adicionales para que eventos pasados destacados no desplacen los avisos actuales.
- **Datos estructurados SEO**: eliminados los horarios fijos no verificados de `index.html`.

### Verificación
- Añadidas pruebas unitarias de vigencia y pruebas de navegador para paginación, anuncios vacíos y datos estructurados.

---

## [1.4.8] - 2026-10-07

### Seguridad & Corrección (Fixed)
- **Privacidad en Sección de Liderazgo (`About.tsx`)**:
  - Eliminado el botón administrativo `Editar liderazgo` (`/admin/pastores`) que permanecía visible para los usuarios no autenticados en la página pública de la iglesia.
  - Refactorizada la estructura de la cuadrícula de pastores y líderes comunitarios (`GlassCard`) para consistencia visual y accesibilidad.

### Base de Datos & Migraciones (Database)
- **Despliegue y Sincronización de Migraciones (`Supabase`)**:
  - **Patrones de Batería (`song_drum_styles`)**: Aplicada la migración `20260925000000_add_song_drum_styles.sql` en producción, habilitando la tabla con RLS y el catálogo inicial de 13 estilos de batería.
  - **Tolerancia a Fallos en Auditoría (`audit_logs`)**: Aplicada la migración `20260925010000_fix_audit_logs_trigger_and_resource.sql`, fijando el valor predeterminado `'system'` y evitando excepciones bloqueantes en el trigger `process_audit_log()`.

---

## [1.4.7] - 2026-10-07

### Mejorado (Changed) & Optimizado (Performance)
- **Catálogo de Tienda y Resiliencia en Búsqueda (`Store.tsx`, `catalog.ts`)**:
  - **Migración a React Query (`useQuery`)**: Sustitución de la carga manual imperativa por `@tanstack/react-query` con caché de 30 segundos, estado de recarga (`refetch`, `isFetching`) y reintentos controlados.
  - **Búsqueda Insensible a Acentos**: Nueva utilidad `normalizeCatalogSearch` con descomposición canónica NFD para emparejar búsquedas en español con o sin tildes de forma uniforme en nombre, descripción, categoría y etiquetas de metadatos.
  - **Precios y Disponibilidad por Variante**: Integrada función `getCatalogPrice` para calcular el menor precio disponible entre variantes con inventario activo, junto con visualización de ahorro y precio anterior tachado.
  - **Carga Perezosa y Aislamiento de Errores**: Carga diferida de `ProductQuickView` con `React.lazy()`, `Suspense` y `GlobalErrorBoundary` para proteger el catálogo de fallos imprevistos en el modal.
  - **Prevención de CLS y Accesibilidad**: Dimensiones explícitas (`720x540`) en `<OptimizedMedia>` para evitar saltos de diseño (CLS), etiquetas ARIA mejoradas y esqueletos de carga de alto contraste.

### Añadido (Added)
- **Documentación Normativa Cuadrangular (`docs/normativa-cuadrangular/`)**:
  - Archivo documental formal con el Estatuto y Reglamento Interno de la Iglesia Cuadrangular del Ecuador, conservados íntegros fuera del paquete público con registro de procedencia y hashes de verificación.

---

## [1.4.6] - 2026-10-01

### Corregido (Fixed)
- **Compilación de Serverless Functions en Vercel (`api/tsconfig.json`, `tsconfig.json`)**:
  - Incorporado `api/tsconfig.json` con soporte explícito para `@types/node` (`types: ["node"]`), resolviendo los errores `TS2591: Cannot find name 'process'` que impedían la compilación de funciones serverless (`send-email.ts`, `suscribir.ts`, `reaccionar.ts`, `dar-de-baja.ts`).
  - Vinculada la referencia `./api/tsconfig.json` en el `tsconfig.json` raíz del proyecto para integración limpia en monorepo/composite mode.

### Mejorado (Changed) & UI/UX
- **Footer Glassmorphic Elegante con Micro-Animaciones (`Footer.tsx`)**:
  - **Estética Refinada**: Contenedor de cristal translúcido de alto contraste (`bg-white/5 dark:bg-slate-950/80 backdrop-blur-2xl border-t border-slate-200/50 dark:border-white/5`), armónico en tema claro y oscuro, con resplandores sutiles de fondo (índigo y esmeralda).
  - **Micro-Animaciones Interactivas**:
    - **Redes Sociales**: Animaciones táctiles y de cursor con física elástica Framer Motion (`whileHover={{ scale: 1.1, y: -2 }}`, `whileTap={{ scale: 0.95 }}`) y colores de marca reactivos.
    - **Enlaces de Exploración**: Iconos con hover dinámico (`group-hover:scale-110`), fondos reactivos y ligero desplazamiento del texto (`group-hover:translate-x-1`).
    - **Branding & Identidad**: Hover suave en el imagotipo de Jerusalén (`whileHover={{ scale: 1.02 }}`) manteniendo el versículo bíblico de Hebreos 13:8 con acento lateral.
    - **Créditos del Desarrollador**: Insignia inferior interactiva con `whileHover={{ scale: 1.05 }}` y corazón palpitante (`animate-pulse`).
    - **Entrada Suave en Viewport**: Animación de revelado gradual (`initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}`) optimizada para alto rendimiento.

---

## [1.4.5] - 2026-09-30

### Corregido (Fixed)
- **`syncWorker.ts` — Atomicidad de mutaciones de miembros**: Las operaciones de sincronización de tablas relacionadas (`member_emails`, `member_phones`, `member_talents`, `member_service_areas`, `member_spiritual_gifts`) ahora se ejecutan en pasos explícitos (Step 1: upsert, Step 2: relaciones, Step 3: eliminar de cola). El elemento de la cola solo se elimina después de que **todas** las operaciones hayan sido exitosas. Antes, si la conexión se cortaba entre el DELETE y el INSERT de relaciones, los datos quedaban en estado huérfano (emails borrados, sin remplazarlos).
- **`useAuthStore.ts` — Listeners zombi en logout**: `logout()` ahora llama `subscription.unsubscribe()` y resetea `_authInitialized` antes de ejecutar `supabase.auth.signOut()`. Esto previene que el listener `onAuthStateChange` sea notificado del evento `SIGNED_OUT` durante el cierre de sesión intencional del usuario, eliminando el ciclo redundante de limpieza de estado.
- **`useAuthStore.ts` — Duplicación de `logout`/`signOut`**: `signOut` ahora es un alias que delega a `logout`, eliminando la duplicación de código. Se centralizó el estado de limpieza en `SESSION_CLEARED_STATE`.
- **`searchIndexService.ts` — Parser de referencias bíblicas incompleto**: El mapa `BIBLE_BOOKS_MAP` fue extendido de 35 a 66 libros (cobertura completa del canon bíblico). Se añadieron los libros faltantes del Antiguo Testamento (1-2 Crónicas, Esdras, Nehemías, Ester, Job, Cantares, Lamentaciones, Ezequiel, los 12 profetas menores) y Nuevo Testamento (Tito, Filemón, 2-3 Juan, Judas). El algoritmo de matching fue refactorizado para usar búsqueda exacta por clave normalizada (sin tildes) en primer lugar y fallback de prefijo solo cuando el alias tiene ≥ 3 caracteres, eliminando los falsos positivos del `alias.startsWith(rawBook) || rawBook.startsWith(alias)` bidireccional.

## [1.4.4] - 2026-09-28


### Mejorado (Changed) & Optimizado (Performance)
- **Eliminación de Carrera y Duplicación en Autenticación (`authService.ts`)**:
  - **Deduplicación en Vuelo (*In-Flight Deduplication*)**: Implementado mapa de promesas concurrentes en `fetchOrCreateProfile` para evitar que `getSession()` y el listener `onAuthStateChange('INITIAL_SESSION')` disparen consultas paralelas idénticas a Supabase en el arranque de la app.
  - **Tolerancia a Fallos en Permisos**: Si la consulta a `role_permissions` o `access_roles` experimenta micro-cortes, el sistema aplica `defaultFallbackPermissions` de forma segura en lugar de forzar un cierre de sesión abrupto.
- **Optimización de Navegación Pública y Reducción de Consultas (`PublicLayout.tsx`, `Navigation.tsx`, `useMenuStore.ts`, `menuService.ts`)**:
  - **Eliminación de Desmontaje Forzado**: Retirada la propiedad destructiva `key={location.pathname}` en `<Navigation />` dentro de `PublicLayout.tsx` y en `<motion.nav>` de `Navigation.tsx`. La barra de navegación se mantiene viva entre rutas sin reinicios visuales bruscos ni descarte de listeners.
  - **Caché Inteligente con TTL**: Incorporado control de frescura de 10 minutos en `useMenuStore` y `menuService`, eliminando el 100% de consultas repetitivas a `public_menu_items` cada vez que el usuario navega entre páginas públicas.
  - **Invalidación Proactiva**: El catálogo se refresca automáticamente cuando los administradores agregan, editan, reordenan o eliminan enlaces del menú.
- **Sincronización Offline First No Destructiva (`syncPull.ts`)**:
  - **Preservación de Mutaciones Locales**: El proceso de pull ahora consulta previamente la cola `sync_queue` para proteger y no sobreescribir modificaciones de miembros, horarios o notas pendientes de sincronización.
  - **Reemplazo de `.clear()` por Merge Seguro**: Se sustituyó el vaciado destructivo de las tablas IndexedDB por un guardado incremental no bloqueante, protegiendo los datos locales ante fallos de red durante el ciclo de sincronización.

---

## [1.4.3] - 2026-09-25

### Corregido (Fixed)
- **Corrección de Recorte Tipográfico y Elementos Ocultos en Secciones Hero**:
  - **Recorte de "propósito." (`PremiumBibleHero.tsx`)**: Se incrementó la altura de línea de `leading-[.88]` a `leading-[0.96]` y se añadió `inline-block` con margen y relleno de seguridad (`pb-2.5 pt-1 pr-2`) para evitar que el gradiente con `bg-clip-text` recorte la tilde de la "ó" y los trazos descendentes.
  - **Superposición de "Palabra viva" (`PremiumBibleHero.tsx`)**: Se reubicó la insignia flotante "Pasaje actual" de `top-[9%]` a `top-[26%]`, eliminando la colisión que tapaba la etiqueta "Palabra viva" en la tarjeta de estudio bíblico.
  - **Truncamiento de Texto en Tarjeta de Estudio**: Se amplió el ancho del badge inferior de `15rem` a `17.5rem` / `19rem` y se retiró el `truncate`, mostrando completo el mensaje *"Busca, guarda y vuelve a encontrar"*.
  - **Elemento Oculto "Descubre nuestra semana" (`PremiumHeroVisual.tsx` & `BentoGridSection.tsx`)**:
    - Se rediseñó el indicador ancla inferior como una cápsula de cristal flotante (*glass pill badge*) con microinteracción de pulso e icono direccional.
    - Se ajustó el margen negativo de la sección bento grid de `-mt-12` a `-mt-5` y la separación inferior del hero, eliminando la superposición donde la tarjeta de sermón cubría y ocultaba el texto "Descubre nuestra semana".

---

## [1.4.2] - 2026-09-25

### Mejorado (Changed)
- **Rediseño Visual Premium del Cancionero y Altar de Adoración (`/recursos/alabanzas`)**:
  - **Atmósfera Sagrada en Hero (`SongsHero.tsx`)**: Fondo azul santuario cósmico (`#020617` a `#071333`) con iluminación ambiental dorada (*Oro Jerusalén*), patrón sutil de pentagrama, badge del cancionero con destellos, versículo bíblico de llamamiento a la adoración (Salmo 96:1–2) y botón interactivo para abrir una alabanza de *«Inspiración del día»* aleatoria.
  - **Tarjetas de Alabanza Tipo Partitura de Lujo (`SongsList.tsx`)**: Contenedores con acabado glassmorphism elevado (`rounded-3xl`, `backdrop-blur-xl`, sombra suave y halo dorado en hover), icono de partitura en relieve áureo, badge de tonalidad original destacada (ej. *Tono Sol / G*) para músicos y directores de alabanza, badge esmeralda de acordes interactivos, micro-ecualizador de audio animado de 3 barras que reacciona al cursor y botón con flecha circular dorada.
  - **Buscador Flotante y Chips Temáticos Rápidos (`SongsFilters.tsx`)**: Tarjeta flotante de cristal con buscador inteligente, barra horizontal de pills temáticas con un solo clic (*Todo el catálogo*, *Con acordes 🎸*, *Adoración*, *Alabanza*, etc.), alternador de vistas de alta fidelidad (Cards / Tabla) y filtros avanzados colapsables con selectores redondeados.
  - **Lienzo Celestial y Cinta del Ministerio de Alabanza (`SongsLibrary.tsx`)**: Suave degradado radial ambiental en el fondo de la página, soporte para exploración suave y activación de alabanza aleatoria, y cinta informativa inferior con las herramientas de transposición, digitaciones para guitarra, piano y bajo, metrónomo y exportación a PDF para el equipo ministerial.

---

## [1.4.1] - 2026-09-25

### Mejorado (Changed)
- **Activación y Configuración del Dominio Oficial `@iecejerusalen.com` en Resend**:
  - **Autenticación DNS Completa**: Verificación en verde de registros DKIM, SPF (CNAMEs `rsend` y `send`) y política DMARC en Namecheap.
  - **Remitente Institucional**: Configuración de `notificaciones@iecejerusalen.com` y `novedades@iecejerusalen.com` como remitentes oficiales de la iglesia para todas las notificaciones transaccionales y boletines.
  - **Prueba en Vivo Exitosa**: Validación de entrega directa y sin filtros de spam hacia la bandeja de entrada de `iecejerusalen@gmail.com`.

---

## [1.4.0] - 2026-09-25

### Añadido (Added)
- **Integración Oficial de la API de Resend para Despacho de Correos y Servidor MCP**:
  - **Endpoint Serverless Seguro (`api/send-email.ts`)**: Servicio backend con validación de esquemas Zod (`to`, `subject`, `html`, `text`, `from`, `replyTo`) para envío transaccional confiable y seguro sin exponer la clave en el frontend.
  - **Credenciales y Entorno Seguro**: Registro de `RESEND_API_KEY` y `RESEND_FROM_EMAIL` en variables de entorno locales y documentación en `.env.example`.
  - **Suscripción de Novedades Institucional (`api/changelog/suscribir.ts`)**: Despacho automático de correo de bienvenida con diseño premium y enlace directo a la plataforma.
  - **Servidor MCP Resend**: Configuración de `https://mcp.resend.com/mcp` en `.agents/mcp_config.json` y el entorno de herramientas de IA.
  - **Fallback Seguro de Remitente**: Uso por defecto de `onboarding@resend.dev` para evitar bloqueos 403 antes de la validación DNS de dominios personalizados.

---

## [1.3.10] - 2026-09-25

### Mejorado (Changed)
- **UX y Control del Checklist Flotante de Onboarding (`OnboardingChecklist.tsx` & `AdminLayout.tsx`)**:
  - **Botón de Cierre Directo (`X`)**: Incorporado botón de cierre rápido e independiente en la cabecera flotante para descartarlo en cualquier momento sin activar el colapso/expansión.
  - **Ocultación Inteligente al Completar (100%)**: Cuando el usuario finaliza todos los pasos (5/5 pasos completados), el checklist se oculta por defecto en visitas posteriores y ofrece un botón de acción principal para descartarse permanentemente.
  - **Persistencia en LocalStorage**: Si el usuario cierra o descarta el checklist, la preferencia se memoriza de forma permanente para no interrumpir el flujo de trabajo ni tapar botones o barras de navegación.
  - **Acceso Bajo Demanda desde el Header**: El badge de puntos de activación (`⚡ pts`) en la barra superior del panel ahora es interactivo y permite reabrir el progreso de onboarding cuando el administrador lo desee.

---

## [1.3.9] - 2026-09-25

### Añadido (Added)
- **Buscador Universal e Inteligente con Control de Roles (RBAC)**:
  - **Acceso Universal en Toda la Plataforma**: El buscador general (`Ctrl + K`) ahora funciona de manera unificada en todo el ecosistema (sitio público, panel `/admin`, aula virtual y móvil), eliminando los modales duplicados y las restricciones de ruta.
  - **Filtrado Estricto de Seguridad por Roles y Permisos**:
    - **Invitados y Usuarios Públicos**: Solo visualizan contenido público, recursos, sermones, horarios y alabanzas; herramientas sensibles como Finanzas, CRM de Miembros o Configuración nunca aparecen indexadas ni sugeridas.
    - **Pastores y Administradores**: Acceso inmediato desde cualquier página (incluso pública) a los módulos de gestión con insignia `[ADMIN]`.
    - **Roles Especializados (Músicos, Maestros, Líderes)**: Filtrado granular en tiempo real según los permisos asignados a su cuenta (ej. un músico accede a `/admin/canciones` pero no a `/admin/finanzas`).
  - **Búsqueda Directa de Miembros del CRM**: Para usuarios autorizados con permiso pastoral o administrativo, el buscador permite encontrar miembros del CRM por nombre o teléfono, consultar su información y abrir WhatsApp o su ficha con un clic.
  - **Unificación de Componentes**: Centralización definitiva en `SearchPalette.tsx`, reemplazando el `CommandMenu` aislado del panel administrativo por el motor unificado de alta velocidad.

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
