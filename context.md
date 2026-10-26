Warning: truncated output (original token count: 19125)
Total output lines: 564

# Contexto y reglas de UI — Iglesia Jerusalén

## 25-oct-2026 — Aviso del aniversario hasta medianoche de Ecuador y cierre de controles

La portada vuelve a mostrar el aviso del 65.º aniversario hasta las 23:59 del 25 de octubre en hora de Ecuador (límite técnico: 26-oct 05:00 UTC); luego desaparece y `/aniversario-65` permanece como archivo. La agenda lateral «Hoy» y el asistente público ahora incluyen un cierre visible y se cierran al pulsar fuera o con Escape. En móvil, la agenda lateral no compite con la navegación inferior.

Verificación: cuatro pruebas unitarias de aniversario/controles, ESLint focalizado, build Vite/PWA y tres pruebas E2E de Chromium pasan. Firefox no pudo iniciar en este equipo; Chromium requiere solo las claves públicas de Supabase para probar contenido real. Los cambios todavía requieren publicación y verificación en producción.

## 24-oct-2026 — Acceso Google y administración desde móvil

La barra superior del sitio público ahora aparece en móviles con controles compactos: muestra «Ingresar» cuando no hay sesión y la foto del perfil cuando hay una sesión autenticada. La imagen usa `photo_url` y, si está vacío, los metadatos `avatar_url`/`picture` de Google. El menú mantiene los destinos de cuenta y el acceso «Admin» continúa sujeto a los permisos existentes; la navegación inferior conserva su acceso directo para cuentas autorizadas. En `/login`, «Ingresar con Google» queda destacado antes del formulario de correo, con altura táctil de 48 px y estado de conexión. La barra principal comienza debajo de la barra superior y se alinea al borde superior al desplazarse.

Verificación local: Playwright a 320 y 390 px, botón de Google visible en el primer viewport y sin overflow horizontal; consola del navegador sin errores. ESLint focalizado, TypeScript y build de producción pasan. Sin cambios Supabase de esquema ni publicación hasta completar el despliegue.

## 25-oct-2026 — Aviso del aniversario retirado de Inicio

Se quitó de la portada la tarjeta temporal del 65.º aniversario para despejar el menú y la primera pantalla. La página `/aniversario-65` sigue accesible como archivo. Se añadió una comprobación E2E para verificar ambas condiciones en Chromium.

## 24-oct-2026 — Contexto en repreguntas de agenda

Las repreguntas breves que nombran hoy, mañana, un día o un período cercano heredan si el turno anterior trataba de eventos o de horarios. Así «¿Y el domingo?» continúa la agenda de eventos cuando esa era la conversación, y continúa horarios cuando se consultaban cultos. Se limita a fechas cortas para no cambiar el sentido de una consulta nueva. Publicado en 1.14.21 (`94146b9`).

## 24-oct-2026 — Respuestas de agenda con detalles y vínculo directo

El asistente usa inicio/fin del evento para encontrar actividades que se solapan con el período consultado, incluye un resumen breve de descripción y lugar públicos, y enlaza cada resultado al detalle de `/eventos?event=id`. El servidor Gemini recibe también fecha final y lugar publicados y se instruye a no inferir direcciones. Publicado en 1.14.21 (`94146b9`).

## 24-oct-2026 — Preguntas rápidas compactas del asistente

La portada del chat muestra cuatro preguntas frecuentes y un control accesible para desplegar seis más; al limpiar la conversación, la lista vuelve a contraerse. Se conserva la disponibilidad de todos los temas con menos altura inicial en móvil. Publicado en 1.14.21 (`94146b9`).

## 24-oct-2026 — Respuesta doctrinal del asistente

Ante consultas sobre la doctrina o la fe Cuadrangular, el asistente resume la misión publicada de Jesús como Salvador, Bautizador con el Espíritu Santo, Sanador y Rey que viene pronto; enlaza los principios de fe y la página institucional. La instrucción de Gemini usa el mismo resumen y evita extrapolar posiciones locales. Publicado en 1.14.21 (`94146b9`).

## 24-oct-2026 — Ampliación del asistente público

El asistente añade respuestas y accesos para podcast, alabanzas, programas, Aula Virtual, tienda, comunidad y reservas. Consulta espacios activos públicos y, cuando se solicitan, los catálogos de programas y episodios publicados; muestra metadatos públicos y enlaces a sus fichas. Aclara que la disponibilidad por fecha debe confirmarse y que las solicitudes requieren iniciar sesión. No recupera reservas personales ni procesa pedidos. La portada incorpora accesos directos a Reservas y Tienda; la detección de ubicación distingue preguntas de mapas de frases como «dónde escucho». Release 1.14.19 publicado en Vercel en el commit `626be19`; `church-assistant` está en Supabase v2 y Gemini sigue sin configurarse. Los catálogos consultados pueden estar vacíos si no hay elementos publicados. Detalles en `docs/church-assistant.md`.

## 22-oct-2026 — Exploración de la bienvenida 3D

La escena de bienvenida conserva el ángulo al soltar el modelo y retoma desde allí un giro automático suave tras una pausa breve. La cámara usa un encuadre fijo durante la rotación para evitar el efecto de «respiración». Hay zoom por rueda, pellizco y botones, pausa/reanudación, regreso a la fachada y flechas de teclado. Los controles tienen etiquetas accesibles y pistas distintas para escritorio y móvil. La geometría Blender y el GLB siguen siendo los mismos. Fuente: solicitud del usuario y QA visual local a 1440 y 390 px (22-oct-2026). Estado: validado localmente; publicación se registra por separado.

## 22-oct-2026 — Acabado de la bienvenida 3D

El GLB de bienvenida se vuelve a exportar del mismo archivo maestro Blender después de corregir cuatro materiales que tenían alfa cero. El ventanal central, los vidrios del acceso y las ventanas junto a la terraza vuelven a ser visibles; la iluminación web recupera contraste y calidez. No cambia la geometría ni el flujo de entrada. Fuente: revisión visual de la bienvenida local y materiales del maestro el 22-oct-2026. Publicación se confirma por separado.

## 21-oct-2026 — Acentos editoriales dorados y enlaces bíblicos

Se aplicó el acento dorado de la identidad en las acciones de lectura de documentos, la ruta de navegación y el versículo del día, conservando azul para los controles de copiar/actualizar. El degradado de botones usa tonos oscuros en tema claro y luminosos en tema oscuro; se reforzó el foco de teclado. El componente compartido de referencias bíblicas y su vista previa ya no subrayan las referencias ni el texto del pasaje. Fuente: solicitud del usuario y referencias visuales de `codex-clipboard-0341e7d9-6c38-47f1-af7d-090da12a83bb.png`, `codex-clipboard-7d7de503-7a9c-4c52-b540-f37ebb9ff2ec.png` y `codex-clipboard-37d2f279-66a1-4f6a-aa57-e92321a136d3.png`; implementación local en `src/pages/public/About.tsx`, `src/components/common/FooterBreadcrumb.tsx`, `src/components/ui/BibleVerseLink.tsx`, `src/components/ui/BibleVersePreview.tsx`, `src/features/home/components/DailyVerseSection.tsx` y `src/index.css`. Sin publicación en esta entrega.

Preparación: el usuario informó que prevé lanzar oficialmente el sitio el 25-oct-2026, durante el aniversario, y que el folleto distribuirá un QR y enlace a aproximadamente 500 hermanos. Es una previsión comunicada por el usuario, no una verificación de asistencia ni de distribución. Antes del lanzamiento conviene priorizar una revisión de navegación móvil, enlaces del QR y rutas públicas clave.

## 20-oct-2026 — Catálogo público de programas

`/programas` no cargaba porque las políticas RLS de `study_programs`, `study_program_sections`, `study_program_lessons` y `study_cohorts` incluían llamadas a `private.can_view_study_program_admin()` dentro de políticas `PUBLIC`. El endpoint REST con rol anónimo respondía HTTP 401 / `42501` (`permission denied for function can_view_study_program_admin`), aunque la migración base y las tablas ya existían. Se separaron las reglas de filas publicadas de las comprobaciones para usuarios autenticados; la migración `20261020022107_fix_public_study_program_rls.sql` se aplicó al proyecto Supabase de Iglesia Jerusalén y aparece en su historial remoto. Verificación: consulta REST anónima HTTP 200 con el programa publicado «Chicas Sabias» y página local mostrando 1 programa.

En la comparación del historial remoto con las 185 migraciones locales, quedó pendiente `supabase/migrations/20261019090000_ministry_photo_galleries.sql`; sus galerías ministeriales aún requieren aplicación y verificación RLS en Supabase. Detalle y estado: `docs/PENDING_SUPABASE_MIGRATIONS.md`.

## Bienvenida 3D de Inicio (1.8.2, 16-oct-2026)

`Home.tsx` añade una capa visual solo en la primera visita. El GLB 1.8.2 se reconstruyó con geometría 3D, sin una imagen de fachada como lámina: cuerpo central proyectado, un cerramiento frontal con un portón y corredores laterales. El scroll controla el giro; «Entrar» acerca la cámara y muestra el Inicio existente. Hay repetición, movimiento reducido y fallback si falla WebGL. La parte posterior queda simple por falta de referencias. Es una interpretación visual guiada por fotos y cotas compartidas por el usuario, no un levantamiento arquitectónico completo. Fuente editable, generador v3 y vistas QA en `LOCAL/04_Trabajos_y_proyectos/Bienvenida_3D_Web/` del equipo de producción.

Actualización admin 1.7.0 (12-oct-2026): pendientes por permiso en Inicio, seguimiento en Comunicaciones, salud en Contenido y procedencia en Medios. Recuperación por usuario/pestaña con caducidad 24 h; guardado servidor explícito, comparación/historial y protección de navegación mediante Data Router. Mobile prioriza Inicio/Comunicaciones/Contenido. Detalles y límites en `docs/admin-operations.md`; QA visual local con datos sintéticos no acredita sesión real ni publicación.

Este archivo es la guía operativa para Codex, Antigravity y cualquier agente que cree o modifique interfaces en este proyecto.

## 19-oct-2026 — Visión y misión en Nosotros

Se añadió a `/nosotros` una sección accesible desde la navegación interna, inmediatamente después del hero. Visión y misión se muestran en bloques paralelos en escritorio y apilados en móvil. La redacción se tomó del Artículo 3 del Reglamento Interno de la Iglesia del Evangelio Cuadrangular del Ecuador, transcrito en `public/documentos/reglamento-interno.json` desde el PDF institucional; se mantuvo íntegra, sin reformulación. Cambio local, sin publicación.

Fuente: `public/documentos/reglamento-interno.json`, Artículo 3, p. 1; implementación en `src/pages/public/About.tsx`.

## 19-oct-2026 — Volumen para iconos de doctrina y propósito

Los iconos lineales de las 22 tarjetas de Principios de Fe y los de Visión/Misión ahora usan relieve por capas, brillo, bisel y superficies degradadas, con acentos de color por tema. Se conservaron los artes volumétricos existentes de nube, fuego y balanza y se integraron los símbolos Cuadrangulares oficiales en marcos con volumen. El patrón funciona en tema claro y oscuro, sin imágenes adicionales ni WebGL.

Fuente: `src/components/public/VolumetricIcon.tsx`, `src/components/public/PrinciplesOfFaith.tsx`, `src/pages/public/About.tsx` y los artes existentes en `src/components/public/DoctrineIcon3D.tsx`.

## 19-oct-2026 — Respaldo para imagen caída en la galería de Inicio

La tarjeta «Enseñanza» quedaba oscura porque su URL remota de Unsplash no cargaba (`naturalWidth: 0`). La galería ahora cambia a la imagen local `public/products/biblia-estudio.webp` si falla una foto de esa categoría, tanto en la tarjeta como en el visor y las miniaturas. También se redujo la opacidad del degradado para que las fotos se distingan mejor. Verificado en el navegador local: la foto de enseñanza cargó con 1200 px de ancho; ESLint, TypeScript, build de producción y `git diff --check` pasaron. Sin cambios remotos ni publicación.

Fuente: `src/components/public/ImageGallerySection.tsx`, `src/components/common/OptimizedMedia.tsx` y vista local de Inicio (19-oct-2026).

## 19-oct-2026 — Galerías de departamentos y ministerios

Se preparó una colección fotográfica por ministerio para que sus líderes autorizados puedan subir varias imágenes, editar texto alternativo y pie de foto, cambiar el orden y quitar fotos desde la pestaña «Fotos» del panel ministerial. Las colecciones se agregan automáticamente a la galería general de Inicio y aparecen también en la página pública de cada ministerio; la tarjeta enlaza a esa página. Las políticas RLS reutilizan `private.can_manage_ministry_page` para limitar cambios al ministerio asignado y dejan lectura pública de fotos.

La migración `supabase/migrations/20261019090000_ministry_photo_galleries.sql` es local y todavía debe aplicarse en Supabase antes de que la nueva galería pueda cargar o guardar datos en el sitio. El editor usa el flujo de carga de medios existente (Cloudinary); quitar una foto la retira de la colección, no elimina el archivo original del proveedor.

Fuente: migración local y componentes `src/components/admin/ministry/MinistryGalleryManager.tsx`, `src/components/public/ImageGallerySection.tsx`, `src/pages/public/MinistryDetail.tsx` y `src/pages/admin/MinistryDashboard.tsx` (19-oct-2026).

## 19-oct-2026 — Biblia abre directamente en la herramienta

Se retiraron el hero promocional y el encabezado legado de `/recursos/biblia`. La primera vista ahora empieza con los controles de versión, pasaje, búsqueda y el lector bíblico.

Fuente: `src/pages/public/Bible.tsx` (19-oct-2026).

## Objetivo

Construir una interfaz premium, coherente, rápida, accesible y mantenible para la plataforma de Iglesia Jerusalén. La calidad visual nunca debe lograrse a costa de errores, datos inventados, problemas de accesibilidad o consumo innecesario de memoria.

## Stack y fuentes de verdad

- Frontend: Vite + React + TypeScript.
- Estilos: Tailwind CSS v4 y tokens existentes del proyecto.
- Estado: Zustand.
- Backend: Supabase.
- Animación: Framer Motion, AnimeWrappers y CSS cuando sea suficiente.
- Componentes visuales: componentes locales en `src/components/ui/`, componentes de features y Magic UI consultado mediante MCP.
- Arquitectura y conocimiento general: `.agents/AGENTS.md` y `docs/PROJECT_KNOWLEDGE.md`.

## Regla principal para componentes

Antes de crear un componente nuevo:

1. Inspeccionar componentes equivalentes en `src/components/ui/`, `src/components/common/`, `src/components/animations/`, `src/components/map/` y la feature correspondiente.
2. Consultar Magic UI MCP para buscar una implementación adecuada cuando el componente tenga un efecto visual, animación o patrón que Magic UI ya resuelva.
3. Usar `searchRegistryItems` o `listRegistryItems` para descubrir opciones y `getRegistryItem` para leer la fuente, dependencias, instalación y ejemplos del componente elegido.
4. Reutilizar o extender el componente existente si ya cubre la necesidad. No duplicar `Globe`, `BentoGrid`, `BorderBeam`, botones, patrones de fondo ni animaciones con nombres diferentes.
5. Adaptar el código al stack real del proyecto. El código de Magic UI puede estar documentado para Next.js; no copiar a ciegas `use client`, rutas de alias o dependencias que no existan aquí.
6. Mantener los componentes instalados como código local y revisable dentro del repositorio. El MCP sirve para descubrir y obtener implementaciones; la aplicación no debe depender de que el MCP esté activo en producción.

## Catálogo de uso

Usar Magic UI con propósito, no como decoración indiscriminada:

- `Globe`, mapas y visualizaciones: alcance misionero, ubicaciones y datos geográficos reales.
- `Bento Grid`: agrupaciones de funciones, ministerios o accesos importantes.
- `BorderBeam`, `Shine Border`, `Magic Card` y `Glare Hover`: tarjetas y llamadas a la acción que necesiten jerarquía visual.
- `Shiny Button`, `Shimmer Button` y `Ripple Button`: acciones principales como donaciones, registro o inscripción.
- `Marquee` y `Animated List`: testimonios, noticias o contenido repetitivo que tenga valor real.
- `Text Reveal`, `Blur Fade`, `Animated Gradient Text` y `Typing Animation`: títulos o mensajes breves, nunca bloques extensos de lectura.
- `Grid Pattern`, `Dot Pattern`, `Aurora`, `Meteors` y `Particles`: fondos con baja opacidad y una intención visual clara.
- `Dotted Map` y componentes geográficos: solo con coordenadas o datos verificables.

Para controles, formularios, menús, diálogos, tooltips y confirmaciones, priorizar los primitivos ya existentes del proyecto, Radix o Base UI. Para mapas operativos, rutas o muchos marcadores, usar la infraestructura de MapLibre/MapCN existente en lugar de insertar un segundo motor de mapas.

## Reglas de diseño

- Respetar la identidad visual existente: azul profundo, índigo, dorado/ámbar, superficies claras y modo oscuro.
- Preparar siempre modo claro y oscuro usando clases y tokens del proyecto; no fijar fondos o textos que hagan ilegible un tema.
- Mantener jerarquía: un mensaje principal, una acción primaria y acciones secundarias claramente diferenciadas.
- Diseñar primero la composición responsive: 320 px, 390 px, tablet y escritorio amplio.
- Las tarjetas deben tener estados de hover, focus-visible, pressed, disabled, loading, empty y error cuando corresponda.
- Los iconos decorativos deben llevar `aria-hidden="true"`; los iconos informativos necesitan texto alternativo o nombre accesible.
- Los enlaces deben ser enlaces y las acciones deben ser botones. No usar `div` con `onClick`.
- Objetivos táctiles: mínimo aproximado de 44 × 44 px.
- No introducir texto de relleno, estadísticas falsas, ubicaciones ficticias ni fechas rígidas si existe una fuente real.

## Animación y rendimiento

- Toda animación debe tener propósito: guiar la atención, explicar una relación o dar feedback.
- Implementar `prefers-reduced-motion: reduce` para entrada, hover, parallax, rotación, partículas y efectos continuos.
- No montar varios canvas/WebGL pesados en una misma pantalla. Reutilizar el componente existente antes de crear otro.
- Pausar animaciones continuas cuando el componente esté fuera del viewport; usar `IntersectionObserver` cuando aplique.
- Reducir resolución, cantidad de partículas y frecuencia de actualización en móvil.
- Preferir transformaciones y opacidad frente a propiedades que provoquen layout.
- Evitar importar librerías grandes para resolver un efecto CSS sencillo.
- Cargar de forma diferida mapas, editores, visualizaciones y componentes pesados que no sean necesarios para el primer render.

## Datos y estados

Cada componente que consume datos externos debe contemplar explícitamente:

- `loading` sin saltos visuales.
- Estado vacío honesto.
- Error visible para la persona usuaria con un mensaje comprensible.
- Detalle técnico registrado de forma controlada, sin exponer secretos ni trazas innecesarias.
- Cancelación o protección contra actualizaciones después de desmontar cuando la petición pueda tardar.
- Atribución de la fuente y fecha dinámica cuando los datos provengan de un servicio externo.

## TypeScript y arquitectura

- TypeScript estricto; no usar `any`.
- Preferir interfaces y tipos explícitos para props, datos remotos y callbacks.
- Separar presentación, carga de datos y lógica compleja cuando el componente crezca.
- No cambiar contratos de Supabase, rutas o tipos globales sin revisar consumidores.
- Mantener nombres semánticos y evitar componentes monolíticos.
- Crear componentes reutilizables en `src/components/ui/` solo cuando su API sea realmente genérica; los componentes específicos de una página deben vivir junto a su feature o página.

## Flujo de trabajo con Codex y Antigravity

Ambos agentes deben seguir este orden:

1. Leer este archivo, `.agents/AGENTS.md` y `docs/PROJECT_KNOWLEDGE.md`.
2. Auditar la página, la ruta, los datos, los componentes existentes y los assets antes de editar.
3. Consultar Magic UI MCP si se necesita un componente de su catálogo.
4. Proponer la composición y los estados antes de implementarla si el cambio es amplio.
5. Implementar la mínima cantidad de código nueva que resuelva el objetivo.
6. Verificar visualmente en navegador en modo claro, oscuro, móvil y escritorio cuando el cambio sea visual.
7. Ejecutar las comprobaciones proporcionales al cambio:
   - `npx tsc -b --pretty false`
   - `npx eslint <archivos-modificados>`
   - `npm run build`
8. Informar con honestidad qué se verificó, qué advertencias siguen abiertas y qué depende de servicios externos.

## MCP de Magic UI

Servidor oficial: `@magicuidesign/mcp`.

Configuración manual compartida:

```json
{
  "mcpServers": {
    "magicuidesign-mcp": {
      "command": "npx",
      "args": ["-y", "@magicuidesign/mcp@latest"]
    }
  }
}
```

Herramientas esperadas del servidor:

- `listRegistryItems`: catálogo con filtros.
- `searchRegistryItems`: búsqueda por nombre, título, descripción o tipo.
- `getRegistryItem`: fuente, instalación, dependencias y ejemplos de un componente.

Prompts recomendados:

- `Busca en Magic UI un componente apropiado para este hero y compáralo con los componentes locales antes de implementarlo.`
- `Obtén la fuente del componente Magic UI elegido, adáptala a Vite + React + TypeScript de este proyecto y conserva accesibilidad, modo oscuro y reduced motion.`
- `Añade un fondo de grid sutil a esta sección; verifica primero si ya existe una implementación local o de Magic UI y evita duplicarla.`

## Límites de integración

- No instalar dependencias, modificar configuración global del usuario ni sobrescribir archivos de otro IDE sin autorización explícita.
- La configuración del proyecto sí puede incluir referencias portables y sin secretos.
- Las claves, tokens y credenciales nunca se guardan en `context.md`, `.agents/mcp_config.json`, `.codex/config.toml` ni el repositorio.
- Si Magic UI MCP no está disponible, continuar con los componentes locales y decirlo; no inventar la respuesta de una herramienta MCP.
- El uso de un componente premium no justifica copiar contenido propietario ni introducir código sin licencia clara.

## Configuración por herramienta

- Codex: `.codex/config.toml` contiene el servidor MCP a nivel de proyecto. El proyecto debe estar marcado como confiable.
- Antigravity: `.agents/mcp_config.json` contiene el servidor MCP a nivel de workspace. Recargar MCP o reiniciar el agente después de cambiarlo.
- Otros IDEs compatibles: usar la instalación oficial de Magic UI CLI o copiar la configuración manual documentada por Magic UI.

Fecha de revisión: 2026-08-16.

## 16-oct-2026 — Bienvenida 3D minimalista (1.8.1)

La bienvenida inicial muestra solo el modelo, cielo/rejilla y «Entrar». El GLB gira automáticamente y admite arrastre; el encuadre se calcula desde sus dimensiones. Al entrar, la escena se contrae hacia un pequeño objeto lateral y revela el Inicio y su menú existentes. El scroll impulsa la rotación lateral con velocidad y dirección proporcionales, y el arrastre vuelve suavemente a la órbita. Conservar repetición discreta, Escape, fallback sin WebGL y preferencia de movimiento reducido. QA y procedencia en LOCAL/04_Trabajos_y_proyectos/Bienvenida_3D_Web.

## Nosotros — revisión del 12 de octubre de 2026

Recorrido: presentación → navegación interna → historia → pilares → Himno Cuadrangular → principios de fe → liderazgo → documentos. El himno reutiliza la letra de Reglamento interno, página 2, con enlace al PDF original; datos en src/components/public/about/foursquareHymnData.ts, presentación en FoursquareHymn.tsx. Mantener las cuatro estrofas y el coro fieles a esa fuente; no sustituir por variantes de internet ni agregar autoría/grabaciones sin fuente. No cargar audio o vídeo automáticamente. La sección usa flujo natural, dos columnas desde tablet y una en móvil. Los metadatos de título/descripcion pertenecen a Nosotros; la navegación interna conserva destinos existentes. Historia y pilares respetan reduced motion en sus entradas.


## 12-oct-2026 — Nosotros como puerta de aprendizaje (1.5.0)

Portada breve de seis destinos con liderazgo público preservado. Cinco rutas exactas de lectura lazy-loaded comparten índice, fuentes, preguntas y anterior/siguiente; Documentos mantiene su biblioteca y lector originales. Reutiliza PrinciplesOfFaith, FoursquareHymn y BibleVerseLink. Recursos auténticos de Drive exportados a public/images/cuadrangular como WebP, sin reconstrucción gráfica. La bandera SVG es didáctica y atribuye modelo internacional y diferencia ecuatoriana. Texto bíblico e interpretación de Aimee diferenciados; sin fechas locales ni significados ornamentales inventados. Diseño editorial responsive con serif existente, contraste claro/oscuro y navegación de teclado; sin dependencias nuevas. Procedencia y QA detalladas en LOCAL/04_Trabajos_y_proyectos/Nosotros_mejoras (excluida de Git).


## 12-oct-2026 — Aprendizaje y gobierno editorial (1.6.0)

Nosotros y cinco lectores usan documentos JSONB con capítulos/bloques compartidos; el texto local documentado permanece disponible con aviso explícito si falla la consulta. `about_learning_published` contiene únicamente snapshots públicos; `about_learning_drafts` y `about_learning_history` son privados. Editar no altera publicación y reinicia el borrador; revisión/publicación requieren la versión actual, permiso pages/edit y rol pastor/admin. Firma/fecha de revisión no se inventan en la carga inicial. Editor integrado en `/admin/paginas/lecturas`, centro de Contenido y editor de páginas; preview comparte el renderer. Progreso local sin cuenta, preguntas formativas sin envío de datos personales. YouTube carga solo por clic (nocookie), enlace original siempre disponible. El canonical ya existía en PublicLayout: eliminar el fijo HTML evita duplicarlo; sitemap actualizado. Las fechas educa…7125 tokens truncated… se añadieron enlaces directos para planificar la visita y saltar a los horarios vigentes de `/visita`; los horarios siguen viniendo de la agenda y la dirección de la fuente institucional existente. Se completó la presentación de los pastores con descripciones de respaldo cuando una ficha pública llega vacía, textos alternativos más descriptivos, dimensiones/carga responsiva y acciones a Contacto y Peticiones. Los documentos distinguen lectura en línea y descarga de estatutos/reglamento.

En Admin se amplió la bandeja de trabajo con pendientes de seguimiento, revisión, publicaciones atrasadas y actividades propias del día; el centro de contenido incorpora estados de borrador, revisión, programación y publicación, junto a una línea de próximas actividades según permisos. La biblioteca ahora filtra recursos con procedencia incompleta y mantiene aparte los archivos del depósito privado; el selector compartido busca los últimos 100 medios y quedó integrado en juegos, Biblionario y presentaciones. El panel de salud resume revisiones, fechas/fuentes, y enlaza a Usuarios, Roles y Permisos.

Verificación local: la vista accesible de `/nosotros` mostró los enlaces de visita y horarios, los retratos con texto alternativo, y los dos documentos con destinos de lectura y descarga. `npm run lint`, `npx tsc --noEmit`, `npm run build` y `git diff --check` pasaron; no se ejecutó la suite de pruebas. Cambio local; sin publicación.

Seguridad pendiente confirmada en Supabase de Iglesia Jerusalén mediante lectura de `admin_security_checks`: `auth_passwords` y `rpc_advisors` figuran pendientes; las fechas de esa revisión registrada son 13-oct-2026. La documentación oficial actual indica que la protección nativa de contraseñas filtradas requiere el plan Pro o superior. El conector de Supabase disponible no ofrece operación para cambiar Auth settings y el registro vigente indica que el Dashboard requiere iniciar sesión; el plan no fue expuesto por la consulta de proyecto. No se modificó Auth ni se marcó la revisión como completada.

Fuentes: `/visita`, `src/pages/public/About.tsx`, `src/features/dashboard/components/ActionQueue.tsx`, `src/features/editorial/components/EditorialSchedulePanel.tsx`, `src/pages/admin/MediaVault.tsx`, `src/components/admin/MediaAssetPicker.tsx`, `src/features/dashboard/components/SiteHealth.tsx`; consulta de solo lectura a Supabase el 19-oct-2026; [Supabase Password Security](https://supabase.com/docs/guides/auth/password-security).

## 20-oct-2026 — Navegación contextual y ajuste local de Nosotros

En `/nosotros`, los enlaces de “En esta página” ahora resaltan la sección visible y exponen `aria-current="location"` para ubicar mejor a quien recorre el contenido. Si fallan simultáneamente el hero y la carga de liderazgo, el aviso informa ambos problemas. El hero usa el retrato editorial elegido `Pastores iglesia interior.webp`, con el mensaje sobre la fotografía y el distintivo inferior conservados.

QA local: revisión visual en 320, 390, 768 y 1440 px; sin desbordamiento horizontal, y navegación directa a “Conoce nuestra fe” comprobada a 768 px. ESLint focalizado, TypeScript y compilación de producción pasan; `git diff --check` pasa. No se ejecutaron pruebas. Cambio local sin publicación.

Fuente: `src/pages/public/About.tsx`, `src/pages/public/components/PremiumAboutHero.tsx`, `src/assets/Jerusalén/Pastores iglesia interior.webp` (20-oct-2026).

## 20-oct-2026 — Verificación pública y permisos de Supabase

La respuesta de `verify_student_status(uuid)` se redujo a nombre, vigencia y fecha; ya no entrega foto, correo, rol ni UUID. Los RPC de autorización de ProPresenter y del planificador de adoración quedaron sin ejecución anónima y disponibles para `authenticated`. La migración `20261020061056_harden_public_student_verification.sql` está aplicada al proyecto `gqtatqekfrswvplemknc`; los tres campos de respuesta y ACL se verificaron por SQL. En el chequeo de logs posterior a la migración no aparecieron errores PostgREST, Edge ni Realtime.

Pendiente externo: habilitar la protección de contraseñas filtradas desde la configuración de Supabase Auth; el conector disponible no ofrece edición de Auth settings. La revisión de Vercel sigue bloqueada por `403` en el scope `iglesia-jerusalen`; los permisos del equipo/proyecto deben repararse en la conexión antes de verificar o desplegar desde Vercel.

Verificación local: ESLint focalizado y `npm run build` pasaron; en esta compilación aparecieron avisos de deprecación de `module.register()`, de `inlineDynamicImports` en PWA y sobre plugins/chunks grandes. No se determinó si todos son preexistentes. `git diff --check` pasó. No se publicaron cambios de frontend a GitHub/Vercel.

## 20-oct-2026 — Endurecimiento de accesos Supabase; frontend de certificados pendiente de Vercel

En el proyecto Supabase gqtatqekfrswvplemknc se aplicaron cinco migraciones (versiones remotas UTC 20261021010012, 20261021010143, 20261021010556, 20261021010825 y 20261021011043). Se cerró lectura anónima de datos de estudio bíblico, miembros familiares, intercesores, bancos de preguntas/cuestionarios, insignias LMS y muro de oración; los comentarios ahora se limitan a publicaciones publicadas. Las consultas de certificados usan RPC acotados que no devuelven identificadores de estudiante ni URL de PDF. Las lecturas con códigos inexistentes devolvieron null.

Las 191 versiones del historial remoto ya tienen archivo local con la misma versión; queda 20261021011400_restrict_public_certificate_table_access.sql como única migración local no aplicada. Debe ejecutarse después de publicar el frontend, porque Vercel todavía no permite acceso al scope iglesia-jerusalen (403 y CLI sin scope). Hasta entonces, las dos tablas de certificados conservan su lectura pública antigua para evitar romper las páginas desplegadas. No se hizo deploy ni push.

Advisors posteriores: 3 tablas con RLS sin políticas (fallo cerrado revisado), 10 RPC SECURITY DEFINER anónimos (funciones públicas intencionales revisadas), 28 SECURITY DEFINER autenticados; protección de contraseñas filtradas aún desactivada. Performance: 255 claves foráneas sin índice, 121 índices sin uso registrado y 448 políticas permisivas múltiples; evitar correcciones masivas sin medir carga. ESLint focalizado y npm run build pasan; la compilación mantiene avisos de deprecación existentes. git diff --check pasa.

Fuentes: historial/advisors/consultas/logs de Supabase, migraciones locales, build y respuesta 403 de Vercel (20-oct-2026, zona Guayaquil).

Aclaración de logs: aparecieron tres timeouts PostgREST "Warp server error: Thread killed by timeout manager" a las 00:59:12 UTC del 21-oct, 60 segundos antes de la primera migración (01:00:12 UTC). La causa no quedó identificada y no se atribuye a las migraciones. Desde la primera migración hasta la última consulta no hubo errores Postgres/PostgREST.

## 20-oct-2026 — Historia local y galería de pastores, v01 local

Se integraron `/nosotros/historia` y `/nosotros/pastores`, con acceso Pastores desde Nosotros, ámbitos internacional/nacional/local, fachada limpia v03, siete hitos animados, relato íntegro aportado y 35 entradas de pastores/familias. Galería de seis etapas principales, asistentes Freddy Loor y Jeannyna Vega por separado, teclado/flechas/deslizamiento y movimiento reducido. Se conservaron los períodos inciertos como sucesión sin inventar años.

Se generaron siete retratos de estudio con IA, preservando las fuentes y ofreciendo comparación con el original. Catorce WebP con nombres estables se sirven bajo demanda; fuentes, maestros, hashes y procedencia están en `LOCAL/04_Trabajos_y_proyectos/Historia_y_pastores/`. El texto nuevo vive en archivos del frontend; la edición del admin existente sigue correspondiendo a la lectura complementaria, cuestionario y fuentes. No se modificó Supabase.

ESLint focalizado, TypeScript/build y diff check correctos; avisos de compilación preexistentes de module.register, inlineDynamicImports y terser. No se ejecutaron suites de pruebas. Revisión visual local en escritorio 1280 px, Pastores 390 px e Historia 320 px, claro/oscuro, sin desbordamiento observado; navegación hasta etapa 06, retorno con teclado y original/restauración confirmados. Se corrigió el seguimiento de la etapa activa al terminar el desplazamiento. Vite ignora LOCAL para evitar el EBUSY del observador de archivos.

Fuentes: texto adjunto, TRIFOLD 01 p. 2, rótulos de fotos y confirmación del usuario para Freddy/esposa y David/Corina. Gamma no pudo consultarse. Evidencia y límites en la ficha local del proyecto y Control/historia-escritorio-v01.png. Trabajo sin publicación; no se hicieron commit/push ni despliegue.

## 21-oct-2026 — Preferencia visual: dorado e identidad editorial

El usuario expresa que le gusta el dorado y el sistema editorial aplicado recientemente, y pide conservarlo como guía reusable para futuras mejoras en otras secciones que hoy no le convencen. Tratar el dorado como acento de identidad coherente con el logo: gradiente más oscuro y legible en modo claro, gradiente dorado luminoso en modo oscuro. Usarlo con intención en títulos o palabras destacadas, etiquetas, iconos, marcadores y acciones prioritarias; mantener equilibradas las superficies y el contraste.

La dirección editorial que quiere conservar combina jerarquía tipográfica clara (serif expresiva para títulos y sans serif legible para lectura), etiquetas breves, aire entre elementos, tarjetas cuidadas, composición y encuadre de imágenes deliberados, gradientes y sombras sutiles, adaptación a claro/oscuro y móvil/escritorio, accesibilidad de contraste y teclado, y animación contenida que respete movimiento reducido. Es una preferencia de diseño para aplicar selectivamente después de revisar cada sección existente; no se define aquí una paleta CSS final ni se recolorea todo el sitio automáticamente.

Fuente: petición directa del usuario en Codex, 21-oct-2026. El usuario solicita seguir desarrollando criterio de diseño a partir de esta dirección y del trabajo editorial reciente.

## 21-oct-2026 — Extensión del acento editorial dorado

Se extendió de forma selectiva el lenguaje dorado a los encabezados de agenda, horarios, prédicas y secciones de fe/liderazgo de Nosotros. Las tarjetas de eventos ahora comparten el gradiente institucional en su remate, fecha, categoría y enlaces; la tarjeta dominical y los detalles de tarjetas de prédicas también usan los tokens dorados adaptables a tema. Las acciones principales y la navegación conservan el azul. Los títulos configurables del inicio siguen siendo texto dinámico intacto; el acento se dibuja como remate CSS y no depende de dividir su contenido.

Verificación local: ESLint focalizado, `npm run build` y `git diff --check`. Estado de publicación actualizado en el registro de la versión 1.11.3.

## 21-oct-2026 — Encabezado móvil, buscador y acceso a toolbox

En móvil, el encabezado principal se alinea al borde superior y se elimina la franja utilitaria que dejaba espacio antes de la navegación. El acceso Buscar de la barra inferior adopta el mismo tamaño, color, foco y estado activo que sus otros iconos. La toolbox global queda oculta sin sesión; si la sesión termina, cierra el panel y detiene metrónomo/temporizador. Las herramientas dentro del panel siguen filtradas por los roles ya existentes (administración/edición, logística y música); Biblia y Notas quedan disponibles a usuarios autenticados.

La línea de ámbitos de Historia se mantiene como acordeón exclusivo, con un panel abierto a la vez. Cambio local en `PublicLayout.tsx`, `Navigation.tsx`, `MobileBottomNav.tsx`, `GlobalToolbox.tsx`, `ChurchHistory.tsx` y `churchHistory.css`. ESLint focalizado, TypeScript y build de producción pasaron; la captura local a 390 px confirma la navegación al borde superior y el buscador con el estilo común. Se creó en Supabase un borrador 1.11.2 con cuatro cambios. Publicación Git/Vercel aún pendiente; no atribuir despliegue hasta verificar el dominio público. El MCP Vercel devuelve 403 para `iglesia-jerusalen` y la CLI local no reconoce ese ámbito; el push a `main` debe activar el despliegue integrado y luego se verificará la web pública.

## 21-oct-2026 — Ámbitos conectados en la historia local

La navegación de `/nosotros/historia` ahora presenta la relación Internacional → Ecuador → Jerusalén como tres etapas numeradas, enlazadas con conectores dorados. En pantallas pequeñas, el recorrido se apila y los conectores cambian a vertical; cada etapa conserva su ancla y foco de teclado. Es una interpretación visual de las flechas dibujadas por el usuario; se eligió una secuencia de jerarquía institucional en vez de un ciclo cerrado.

Verificación local: revisión visual en escritorio 1280 px y móvil 390 px, tres enlaces presentes y sin overflow horizontal; ESLint focalizado, TypeScript, build de producción y `git diff --check` correctos. Build conserva avisos previos de `module.register()` e `inlineDynamicImports`. Sin publicación.

Fuente: `src/features/about/ChurchHistory.tsx`, `src/features/about/churchHistory.css`, capturas `C:/Users/Nicola/AppData/Local/Temp/iglesia-historia-conectores-desktop.png` y `iglesia-historia-conectores-mobile.png` (21-oct-2026).

## 21-oct-2026 — Ámbitos de historia como panel desplegable

Los tres pasos de la franja ahora son botones tipo acordeón: abren un panel de contenido para Internacional, Ecuador o Jerusalén; solo un ámbito queda abierto y volver a pulsar el activo lo cierra. El contenido internacional y nacional se presenta allí, evitando repetir las mismas tarjetas al final de la página; el panel local ofrece acceso a la línea de tiempo. Los botones exponen `aria-expanded`/`aria-controls`, funcionan con Enter/Espacio y el panel inactivo queda oculto para tecnologías asistivas.

Verificación local: los tres contenidos abren correctamente, la selección cambia de ámbito, el cierre por segundo clic y por Enter funciona, Espacio abre el ámbito, y móvil 390 px no presenta overflow. ESLint focalizado, TypeScript, build y `git diff --check` correctos. Sin publicación.

Fuente: `src/features/about/ChurchHistory.tsx`, `src/features/about/churchHistory.css`; capturas con el ámbito nacional abierto en escritorio y móvil en `C:/Users/Nicola/AppData/Local/Temp/iglesia-historia-ambito-desplegado{,-mobile}.png` (21-oct-2026).

## 21-oct-2026 — Corrección de estado de migración Supabase de certificados

La nota del 20-oct sobre la migración pendiente de certificados quedó desactualizada: la migración fue aplicada en Supabase como versión remota `20261021051358`; el archivo local se alineó y el commit `c35fbb1` se subió a `main`. La verificación disponible confirmó que el rol anónimo ya no puede hacer SELECT directo en las tablas de certificados y que los RPC acotados siguen ejecutables. La inspección pública de los bundles encontró los dos RPC; Vercel no permitió listar despliegues por respuesta 403, por lo que no se afirma una verificación completa del despliegue desde su API.

Fuente: historial y consultas de solo lectura de Supabase, estado Git remoto y revisión de recursos públicos (21-oct-2026).

## 21-oct-2026 — Tienda fase 2, publicación coordinada 1.12.0

El carrito registra una reserva de 24 horas antes de mostrar datos bancarios y adjunta comprobantes privados al pedido. Mantiene identidad de solicitud para reintentos y acceso del invitado dentro de la pestaña. Se conservaron serif/sans, azul y acentos dorados, controles con foco y composición apilada móvil. El admin requiere referencia bancaria y permisos de servidor; la lectura del comprobante genera acceso temporal. Catálogo público usa una proyección sin costos/enlaces maestros. Migración remota 20261022001552 aplicada y Edge Function store-checkout activa en versión 1; cliente compatible 1.12.0 preparado para publicación coordinada. Nuevas ventas deshabilitadas hasta confirmar catálogo y conteo físico. El inventario completo y el seguimiento fuera de la pestaña corresponden a las fases siguientes. Evidencia local sintética, no compras reales: docs/store-checkout.md y LOCAL/04_Trabajos_y_proyectos/Tienda_funcional/Control/Fase_2/INFORME.md.

## 21-oct-2026 — Inventario de tienda, fase 3 — publicación 1.13.0

Nueva pestaña Inventario dentro de Tienda y comercio: búsqueda, ficha, ubicación/mínimo/notas y campos adicionales; cantidades registradas/reservadas/disponibles, borradores de conteo físico, confirmación y movimientos con responsable. Mantiene superficies y gradiente del admin, tipografía existente, controles etiquetados, foco y composición apilada. Verificado sin desbordamiento a 390/1280 y en claro/oscuro con datos sintéticos. Stock del editor queda de lectura, sin sobrescribir cantidades al guardar catálogo. Migración remota 20261022022116 aplicada y store-checkout activa en versión 2; cliente 1.13.0 en publicación coordinada. Existencias conservadas y ventas deshabilitadas. Verificación focalizada correcta; límites de batería general/Firefox y capturas en LOCAL/04_Trabajos_y_proyectos/Tienda_funcional/Control/Fase_3/INFORME_v01.md. No acredita conteos físicos reales ni apertura de ventas. Fuente: pedido de fase 3 en esta conversación y docs/store-inventory.md.

## 21-oct-2026 — Tienda fase 4, implementación local

Mis compras reúne seguimiento con clave privada, historial y biblioteca digital. El invitado guarda su acceso como archivo, lo introduce sin exponerlo en la dirección y puede vincular el pedido a una cuenta con el mismo correo verificado. El catálogo abre y conserva la ficha por enlace compartible. Se mantienen serif/sans, azul, acentos dorados, estados legibles, foco y composición apilada; capturas a 390/1280 px en claro/oscuro. Reutiliza el diálogo y el acceso privado a comprobantes existentes. No hay envío automático por correo ni pasarela/conciliación bancaria. La entrega utiliza Google Drive/Docs externo persistente y lo explica; no se presenta como enlace firmado revocable. La biblioteca verifica cada apertura y bloquea cancelaciones/reembolsos. Migración 20261022030000 y Edge/client pendientes de publicación coordinada. Pruebas de tienda: 47 unitarias, 50 controles de PostgreSQL aislado y 7 recorridos Chromium correctos; compilación, lint y Deno correctos. Batería general: 253 pasan/1 falla en memoryMatchLogic ajeno; Firefox no inicia (spawn UNKNOWN). Avisos de HMR del entorno local conservados como límite. Producción solo consultada: ventas deshabilitadas, cero pedidos, sin tabla nueva. Sin commit/push ni activación. Contrato y fuentes: docs/store-customer-portal.md y LOCAL/04_Trabajos_y_proyectos/Tienda_funcional/Control/Fase_4/INFORME_v01.md.

## 21-oct-2026 — Tienda fase 4, publicación coordinada 1.14.0

Publicación solicitada por el usuario. Migración remota 20261022030818 instalada y store-checkout ACTIVE v3. Cliente de seguimiento/historial/biblioteca y enlaces compartibles preparado en esta versión. Copia aislada basada en HEAD más los archivos de fase 4: lint, build y 254 pruebas/57 archivos correctos, 50 controles SQL y seis recorridos Chromium de compra/inventario/portal correctos. No incluye cambios en curso de dashboard/editorial/juegos/rutas. Ventas deshabilitadas y cero pedidos; sin conteos/pagos reales. Datos y comprobaciones de publicación en LOCAL/04_Trabajos_y_proyectos/Tienda_funcional/Control/Publicacion_fase_4_2026-10-21/. La verificación final del dominio público se registra allí, separada de las pruebas sintéticas. Google Drive conserva enlaces externos persistentes, sin correo o conciliación bancaria automáticos.

## 21-oct-2026 — Tienda 1.14.1, permisos reales de identidad

La verificación de servidor en producción detectó SELECT denegado sobre auth.users, no reproducido por el fixture anterior. Migración 20261022031805 concede solo id/email/email_confirmed_at a service_role; la consulta del portal selecciona email sin SELECT global. Sin privilegios al navegador, campos de contraseña o funciones DEFINER nuevas. RPC ejecutado bajo service_role en producción devuelve biblioteca vacía para una cuenta verificada; permisos de contraseña/tabla completa/navegador siguen denegados. Fixture alineado y 14 controles de portal (51 SQL acumulados) correctos, incluyendo compra digital y apertura bajo service_role. No se crearon pedidos ni se habilitaron ventas. Corrección incluida en la publicación de fase 4; evidencia final en el informe de publicación.

## 22-oct-2026 — Encuadre de la bienvenida 3D

La escena conserva el modelo integral y sus colores. La apertura sostiene la vista frontal antes de iniciar un giro gradual; el encuadre calcula el ancho visible según el ángulo para que el edificio tenga presencia en móvil sin recortes, y una sombra suave lo asienta visualmente. La interacción manual, el botón Entrar, la revisita y las alternativas de movimiento reducido/WebGL permanecen disponibles. Se comprobó visualmente a 320, 390 y 1440 px, y el recorrido automatizado de la bienvenida pasó. Fuente: `src/features/home/components/ChurchStage3D.tsx` y `LOCAL/04_Trabajos_y_proyectos/Bienvenida_3D_Web/FICHA_PROYECTO.md`. La geometría sigue siendo una interpretación visual de referencias fotográficas.

## 22-oct-2026 — Suelo y nubes en movimiento en la bienvenida 3D

La retícula del suelo se desplaza hacia el fondo en un bucle de 55 px que coincide con el mosaico, sin un corte visual entre ciclos. Las nubes pasan lentamente por detrás del modelo a distintos ritmos. Ambas animaciones se pausan cuando la escena pasa a la burbuja del Inicio y se desactivan con `prefers-reduced-motion`. Se conservaron la fachada, el GLB y la interacción existentes. Verificación local: vistas de 320, 390 y 1440 px sin desbordamiento, recorrido de bienvenida correcto, lint y build aprobados. Fuente: `src/features/home/components/church-welcome-3d.css`, `ChurchWelcome3D.tsx` y ficha `LOCAL/04_Trabajos_y_proyectos/Bienvenida_3D_Web/FICHA_PROYECTO.md`.
## 24-oct-2026 — Estudio de Génesis 3

Se incorporó la guía editorial de Génesis 3 a las pestañas Estudio, Atlas, Enciclopedia y Cronología del capítulo. El Atlas organiza el relato, no afirma una geografía precisa; la secuencia no recibe fechas de calendario. Las entradas distinguen lo dicho por Génesis de las conexiones canónicas posteriores, incluido el vínculo con Apocalipsis 12:9 y 20:2. Dos ilustraciones originales se conservan en `LOCAL/04_Trabajos_y_proyectos/Estudio_biblico_iLumina/Ilustraciones_originales/Genesis3/` con procedencia y SHA-256; sus WebP públicos están optimizados, cargan de forma diferida y se describen como arte interpretativo.

La guía reutilizable de investigación y registro por fuente está en `docs/BIBLE_STUDY_CONTENT_WORKFLOW.md`. Registro de fuentes, derechos, estado y criterio editorial añadido a Obsidian: [[03 Proyectos/09 Iglesia Jerusalén/Estudio bíblico - Catálogo de libros]]. Dos enlaces oficiales de Proyecto Biblia se mantienen alojados en origen.
## 24-oct-2026 — Respuestas pastorales e institucionales del asistente

La preparación 1.14.22 incorpora respuestas basadas en las páginas públicas para liderazgo pastoral, visión, misión, identidad Cuadrangular, símbolos, himno y ubicación. Se añadió una respuesta empática a expresiones de tristeza y una orientación de seguridad para desesperanza o posible autolesión, con recursos de emergencia y apoyo ecuatorianos. Se mantiene la advertencia de que el chat no es confidencial ni un servicio de emergencia. Evidencia de publicación y verificación: nota de proyecto en Obsidian, 2026-10-24.


## 24-oct-2026 — Aniversario 65 y acceso móvil

Se creó `/aniversario-65` con el tema aprobado, domingo 25 de octubre de 2026, preludio 08:45 y culto 09:00, una galería de recursos ya publicados (la representación digital está identificada), mapa y agradecimiento compartible por WhatsApp. Inicio muestra un aviso temporal que vence el 25 de octubre a las 23:59, hora de Ecuador, y accesos directos a horarios, dirección y planificación de visita. La bienvenida 3D deja de bloquear la portada. Google Calendar convierte eventos sin hora final a día completo y añade su hora de inicio en los detalles.

Verificación local: build, ESLint focalizado, 264 pruebas unitarias de 62 suites y 3 pruebas Chromium pasan; Inicio, visita, eventos y aniversario se revisaron a 320, 390, 768 y 1440 px. ESLint general mantiene dos errores preexistentes en `supabase/functions/church-assistant/index.ts`; no bloquean la compilación ni este release. Evento actualizado en Supabase junto con la publicación: 25 de octubre, 09:00, descripción con preludio y tema. «Aire Libre» permanece independiente y sin horario. Fuente y verificación: repositorio Iglesia Jerusalén, 2026-10-24.
