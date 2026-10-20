# Contexto y reglas de UI — Iglesia Jerusalén

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

Nosotros y cinco lectores usan documentos JSONB con capítulos/bloques compartidos; el texto local documentado permanece disponible con aviso explícito si falla la consulta. `about_learning_published` contiene únicamente snapshots públicos; `about_learning_drafts` y `about_learning_history` son privados. Editar no altera publicación y reinicia el borrador; revisión/publicación requieren la versión actual, permiso pages/edit y rol pastor/admin. Firma/fecha de revisión no se inventan en la carga inicial. Editor integrado en `/admin/paginas/lecturas`, centro de Contenido y editor de páginas; preview comparte el renderer. Progreso local sin cuenta, preguntas formativas sin envío de datos personales. YouTube carga solo por clic (nocookie), enlace original siempre disponible. El canonical ya existía en PublicLayout: eliminar el fijo HTML evita duplicarlo; sitemap actualizado. Las fechas educativas atribuidas a UTPL son historia de la escuela, no fundación de la iglesia. No se publican las fechas sin aprobación de la narrativa local propuesta.


## Corrección de alcance — 12-oct-2026, 1.6.1

El usuario rechazó la relación de UTPL con esta página. Retirar reseña educativa y fuente de la historia pública/borrador activo. No usar historia de una unidad educativa para completar la historia de la iglesia; los registros previos de esa incorporación quedan corregidos por esta decisión.

## 19-oct-2026 — Portada de Adivina la palabra

La portada de Adivina la palabra usa la ilustración bíblica local de Biblia abierta y letras de madera para explicar visualmente el reto. La composición responsive conserva el fondo nocturno institucional, presenta primero el arte en móvil, resume oportunidades y puntos, y aclara selección con mouse/teclado y la dificultad antes de iniciar. El texto de atajos tiene contraste reforzado en esta superficie oscura. Sin dependencias nuevas ni cambios a rutas, reglas, datos o Supabase.

## 19-oct-2026 — Vista emergente bíblica reutilizable

`BibleVersePreview` es el popover compartido para leer un pasaje y abrir su cita exacta en la Biblia. `BibleVerseLink` conserva la navegación directa por defecto y ofrece `preview` para activar la vista en cualquier referencia individual. Ya se usa en Memorama, Adivina la palabra y Descubre el Personaje. Cada uso puede pasar `className`; el popover trae su lectura, cierre, estados de carga/error y enlace a Biblia.

## 19-oct-2026 — Teclado para los cuatro juegos

Se añadió el atajo común Mayús + Intro para continuar cuando aparece la siguiente acción: pregunta, palabra, personaje, aprendizaje o nueva ronda. En Biblionario también se eligen respuestas con A–D y se confirman con Intro; en Adivina la palabra las letras se pueden escribir o seleccionar con mouse. Las tarjetas del Memorama y opciones restantes se pueden recorrer con Tab e Intro. Los atajos se detienen en campos editables y no interceptan enlaces o botones ajenos al avance. La vista de éxito de Descubre el Personaje ahora espera a que el jugador avance, para permitir leer la respuesta y su referencia.

El nombre público del antiguo Reto de Letras Bíblicas pasa a «Adivina la palabra» en el catálogo, el juego, las migas de pan y sus metadatos. Se conserva el slug y las tablas de datos para no romper enlaces ni marcadores. Cambio local en `src/features/games/` y páginas públicas; no requiere migración.

## 19-oct-2026 — Lectura emergente en el Memorama Bíblico

La cita de cada pareja encontrada abre una vista previa no modal del texto RVR1960. Se cierra con la X, al tocar fuera, con Escape o automáticamente a los 12 segundos; el texto y el botón «Abrir en la Biblia» navegan al libro, capítulo y rango exactos del pasaje. El texto se obtiene en el momento desde la misma fuente de capítulos que usa el lector bíblico; si falla la conexión, se muestra un aviso y se conserva el acceso al pasaje. Cambio local en `BibleVersePreview.tsx` y `MemoryMatch.tsx`; no se modificó ni aplicó una migración.

## 19-oct-2026 — Rostros y símbolos cuadrangulares en Doctrina

Los retratos de los cuatro ministerios en `/nosotros/doctrina` ahora se muestran en formato cuadrado más pequeño, con su símbolo oficial al costado: hombre–cruz, león–paloma, buey–copa y águila–corona. La presentación se limita a estos cuatro capítulos y reutiliza `QuadrangularSymbol`; los demás bloques de imagen conservan su presentación. En navegador local se comprobó la alineación en 390 y 1280 px, sin desbordamiento horizontal; ESLint específico, `npm run build` (con mayor memoria de Node tras un primer OOM) y `git diff --check` de los archivos de código pasaron. Sin publicación. Fuentes: `src/features/about/LearningDocumentView.tsx`, `src/components/public/BlockRenderer.tsx` y vista local `/nosotros/doctrina#salvador`.

## 19-oct-2026 — Popup de lectura para versículos vinculados

`BibleVerseLink` abre ahora por defecto el componente `BibleVersePreview`, para que las referencias bíblicas vinculadas permitan leer el pasaje en popup en todo el sitio donde se use el componente compartido. Se conserva la opción de enlaces directos explícitos para usos que lo requieran. Verificación local en `/nosotros/doctrina`: «Hechos 1:5-8» abrió el popup RVR1960 con los versículos 5–8, control de cierre y enlace para abrir la Biblia. ESLint del componente, build de producción y `git diff --check` pasaron. Sin publicación. Fuente: `src/components/ui/BibleVerseLink.tsx` y `src/components/ui/BibleVersePreview.tsx`.

## 19-oct-2026 — Símbolos con el mismo tamaño exterior que los retratos

Ajusté los símbolos de la derecha de los cuatro ministerios en Doctrina para igualar el tamaño del marco del retrato: ambos miden 224 × 224 px en escritorio y 160 × 160 px en móvil. Se conserva un margen interno en el marco blanco para que la marca oficial respire. Verificación visual en 1280 y 390 px confirmó dimensiones iguales, alineación lateral en móvil y escritorio, y ausencia de overflow horizontal. ESLint específico, build de producción y `git diff --check` del archivo modificado pasaron. Sin publicación. Fuente: `src/components/public/BlockRenderer.tsx` y `/nosotros/doctrina#salvador`.
## 19-oct-2026 — Selector de ministerios doctrinales (verificado local)

La lectura `/nosotros/doctrina` ahora muestra un ministerio a la vez: Salvador, Bautizador, Sanador o Rey que viene. Los botones resaltan la selección, actualizan el fragmento de URL para compartir el capítulo y dejan accesible «Principios de fe» como sección aparte. Se conservaron los retratos, sus símbolos oficiales y los popups de las referencias bíblicas. QA en 390 y 1280 px confirmó el cambio de capítulo, principios visibles y sin desbordamiento horizontal. ESLint del archivo, build de producción y `git diff --check` pasaron. Sin publicación.

Fuente/evidencia: `src/features/about/LearningDocumentView.tsx` y vista local `/nosotros/doctrina#bautizador` (19-oct-2026).

## 19-oct-2026 — Ajuste del botón de búsqueda móvil

El CTA central «Buscar» en `MobileBottomNav` se redujo de 48 × 48 a 40 × 40 px y el ícono de 22 a 18 px. Se suavizaron la elevación, la sombra y el radio del botón; el acceso conserva el mismo flujo del buscador y el foco visible. La barra se mantiene en teléfono/tablet y se oculta en escritorio. QA a 320, 390 y 768 px confirmó dimensiones 40 × 40 y sin desbordamiento; a 1280 px la barra queda oculta. ESLint del componente, build de producción y `git diff --check` pasaron. Sin publicación.

Fuente/evidencia: `src/components/common/MobileBottomNav.tsx` y vista local móvil de `/nosotros/doctrina` (19-oct-2026).

## 19-oct-2026 — Popup y retrato de Descubre el Personaje

La vista previa bíblica se renderiza en un portal independiente del footer y se posiciona según el espacio libre; permanece dentro de la ventana y por encima de la ruta inferior. El retrato conserva la proporción original con `object-contain` para mostrar la imagen completa. La barra de migas usa un fondo opaco y una altura mínima estable para evitar los cambios de composición asociados a transparencia y desenfoque. Verificación visual local en `/recursos/juegos/descubre-el-personaje`: respuesta correcta de Zaqueo, retrato completo y lectura emergente por encima del footer. ESLint específico y compilación de producción correctos.

## 19-oct-2026 — Popup bíblico fuera del recorte de tarjetas (verificado local)

`BibleVersePreview` se renderiza en un portal de `document.body`, por fuera de tarjetas con `overflow-hidden`. Su posición fija se ajusta al espacio visible, arriba o abajo de la cita, y el texto puede desplazarse dentro del popup cuando el alto disponible es reducido. En la referencia «2 Timoteo 3:16-17» se comprobó que todo el panel, el cierre y «Abrir en la Biblia» quedan dentro del viewport a 390 × 844 y 320 × 568 px; sin recorte por tarjeta. ESLint del componente, TypeScript, build de producción y `git diff --check` pasaron. Sin publicación.

Fuente/evidencia: `src/components/ui/BibleVersePreview.tsx` y vista local `/nosotros/doctrina#bautizador` (19-oct-2026).


## 19-oct-2026 — Menú de doctrina depurado (verificado local)

El índice lateral de /nosotros/doctrina muestra ahora solo los cuatro ministerios de Jesucristo. «Principios de fe» sigue en el cuerpo de lectura y conserva su selector interno de temas. QA en la vista local confirmó cuatro botones en el índice y la sección de principios presente. ESLint específico, git diff --check y build de producción pasaron. Sin publicación.

Fuente/evidencia: src/features/about/LearningDocumentView.tsx, vista local http://127.0.0.1:5175/nosotros/doctrina#bautizador y captura QA del 19-oct-2026.


## 20-oct-2026 — Ampliación de Principios de Fe en Nuestra doctrina

A petición del usuario, el componente de Principios de Fe ocupa desde el margen izquierdo del índice doctrinal hasta el borde derecho del área de lectura en escritorio, aprovechando el espacio vacío señalado. El desplazamiento solo se aplica en el breakpoint lg; en tamaños menores conserva el flujo original. Verificación visual/DOM local a 1523 px: ancho de 1152 px y sin overflow horizontal. ESLint específico, git diff --check y build de producción pasaron. Sin publicación.

Fuente: src/features/about/LearningDocumentView.tsx, vista local /nosotros/doctrina#bautizador (20-oct-2026).


## 19-oct-2026 — Jerarquía responsive de la franja semanal de Inicio

En BentoGridSection: la prédica conserva su miniatura si existe y, si falta, muestra una forma de onda decorativa de marca sobre el fondo azul; la tarjeta del encuentro destaca día/mes y enseña hora y ubicación únicamente cuando los campos del evento están disponibles; las tarjetas secundarias ahora dicen «Explora los ministerios» y «Pide oración». La cuadrícula mantiene el Bento en escritorio, apila contenido en teléfono estrecho y pone las dos acciones en paralelo desde 640 px. QA visual/DOM local a 320, 390, 768 y 1440 px confirmó orden, disposición y sin overflow. ESLint del componente, TypeScript, build y git diff --check pasaron. Sin publicación.

Fuente: src/features/home/components/BentoGridSection.tsx y http://127.0.0.1:5175/ (19-oct-2026).


## 19-oct-2026 — Navegación flotante de secciones de Inicio

Se refinó la navegación vertical de secciones en Inicio: la sección activa se identifica con más claridad, los accesos muestran su etiqueta al pasar el cursor o recibir foco de teclado y el menú compacto se adapta al alto disponible en móvil. El menú móvil ahora también se cierra con Escape. Se conservaron los destinos existentes. QA local: vista de escritorio (1523 px) y móvil (390 × 844), sin desbordamiento horizontal; apertura por teclado y cierre con Escape verificados. ESLint del componente, TypeScript, build de producción y git diff --check pasaron. Sin publicación.

Fuente: src/components/public/StickyNav.tsx y http://127.0.0.1:5175/ (19-oct-2026).


## 19-oct-2026 — Miniaturas y tarjetas adaptables de prédicas en Inicio

La sección de Inicio consulta hasta 12 prédicas públicas, ordenadas por fecha y creación, y trae `metadata` para aprovechar `cover_image_url` o la miniatura de YouTube cuando exista. La cuadrícula define 2 columnas en móvil, 3 en tablet y 4 en escritorio. Con todas las tarjetas ilustradas, muestra hasta 4 en móvil, 6 en tablet y 8 en escritorio; las tarjetas sin portada se compactan y habilitan más mensajes (máximo 8 móvil/12 tablet-escritorio). Las miniaturas que no cargan caen al formato compacto; no se inventan imágenes.

QA visual local a 1523 px: se mostraron 10 prédicas existentes, incluidas dos miniaturas; las demás aparecieron compactas. ESLint de `SermonsSection.tsx` y `useHomeData.ts`, TypeScript, build y `git diff --check` pasaron. Las reglas responsive están implementadas en móvil/tablet/escritorio; la vista capturada fue escritorio. Sin publicación.

Fuente: `src/features/home/components/SermonsSection.tsx`, `src/features/home/hooks/useHomeData.ts` y vista local Inicio (19-oct-2026).

## 19-oct-2026 — Confirmar respuesta con Mayús + Intro en Biblionario

En Biblionario, Mayús + Intro confirma la opción elegida mientras se responde y avanza a la siguiente pregunta después de revisar el resultado y el fundamento bíblico. El atajo está anunciado en las opciones seleccionadas y en el botón de confirmación. Se ajustó la escucha compartida para reconocer Shift+Enter dentro de `aria-keyshortcuts` con atajos adicionales. Verificación en partida local: seleccioné «Un gran pez», confirmé con Mayús + Intro, apareció «¡Respuesta correcta!» y el fundamento de Jonás 1:17; el mismo atajo avanzó al nivel 2. ESLint del juego y del hook y build de producción pasan.

## 19-oct-2026 — Botones de visita e iconos de navegación en Inicio

Los botones «Planifica tu Visita» del hero y la navegación superior usan el azul institucional; «Conócenos» queda como acción secundaria clara. La barra lateral flotante conserva solo sus iconos visibles: se quitaron el rótulo superior y las etiquetas emergentes, manteniendo nombres accesibles en los controles. Vista local de escritorio confirmada en http://127.0.0.1:5175/. Sin publicación.

Fuente: src/features/home/components/PremiumHeroVisual.tsx, src/components/common/Navigation.tsx, src/components/public/StickyNav.tsx (19-oct-2026).

## 19-oct-2026 — Animación sutil de botones del hero

A petición del usuario, los botones del hero ya no se desplazan con el cursor ni suben al pasar sobre ellos. La interacción conserva transiciones breves de color y sombra; el botón superior tampoco se traslada al hover. Vista local de escritorio revisada; ESLint, TypeScript, compilación y git diff --check pasan. Sin publicación.

Fuente: src/features/home/components/PremiumHeroVisual.tsx y src/components/common/Navigation.tsx (19-oct-2026).

## 19-oct-2026 — Enciclopedia bíblica adaptable e índice visual

Se rediseñó la enciclopedia de la Biblia con una interfaz clara y adaptable, tarjetas editoriales, búsqueda por contenido, detalle lateral/especializado, foco visible y cierre con Escape. La cuadrícula conserva libros, personajes y lugares; el movimiento respeta la preferencia de reducir animaciones. Se enlazaron los retratos disponibles de Jesús, Moisés, David, Salomón, Abraham, María, Elías, Daniel, Juan el Bautista, José, Rut, Samuel, Josué y Ester a sus entradas correspondientes y se retiraron las rutas de marcador repetido. El catálogo local solo contiene arte propio para Jerusalén, Edén y Babilonia; los demás lugares muestran una portada tipográfica para no aparentar una fotografía del sitio. QA visual local confirmado en escritorio y en viewport móvil de 390 px; retratos y las tres ilustraciones cargan. ESLint focalizado, `npm run build` y `git diff --check` pasan. Sin publicación.

Fuente: `src/components/public/bible/BibleIndexes.tsx`, `src/config/bibleIndexesData.ts` y `public/assets/encyclopedia/` (19-oct-2026).

## 20-oct-2026 — Correcciones visuales de Inicio

Se corrigieron los detalles señalados en Inicio: “Doctrina” y la línea de progreso de El Viaje de la Fe ahora usan dorados oscuros en tema claro y claros en tema oscuro; la franja de horarios separa los anuncios y deja un solo destello espaciado entre cada uno, con desplazamiento continuo y respeto por movimiento reducido. Las portadas de eventos pasan a una foto de adoración solo si falla su portada administrada (imagen referencial de Unsplash); la tarjeta de Enseñanza usa la foto local de una Biblia de estudio cuando falla la imagen publicada. También se cubrieron errores de portada para la colección de ministerio y del visor. QA visual de escritorio confirmado en tema claro y oscuro: se verificaron ambos dorados, la portada local de Enseñanza y la imagen referencial de Aniversario cuando falta su portada administrada. El ticker quedó con separadores y mayor espacio en el código; no se hizo QA responsive específico. Sin publicación.

Fuentes: `src/features/home/components/PremiumDoctrineCards.tsx`, `src/components/public/ChurchJourneySection.tsx`, `src/components/public/MarqueeText.tsx`, `src/features/home/components/EventsSection.tsx`, `src/components/public/ImageGallerySection.tsx`; foto fallback: https://unsplash.com/photos/a-person-standing-on-a-stage-with-a-guitar-FN-majlr-iE (20-oct-2026).

## 19-oct-2026 — Iconos 3D para visión y misión

Se generaron dos ilustraciones PNG con transparencia: un ojo volumétrico azul para la visión y un corazón sostenido por manos en tonos ámbar para la misión. Se integraron dentro de las placas existentes de la sección, manteniendo tamaño y estructura de las tarjetas; el componente compartido conserva el icono Lucide como alternativa para sus demás usos. Los PNG originales generados se preservan en la carpeta local de generación; las copias servidas por la web están en `public/assets/about/`. Vista local confirmada a 1270 px: ambas imágenes cargan dentro de las placas existentes y las tarjetas conservan su composición; la regla responsive previa no fue alterada. Sin publicación.

Fuente: `src/pages/public/About.tsx`, `src/components/public/VolumetricIcon.tsx` y recursos generados (19-oct-2026).

## 20-oct-2026 — Fachada mejorada en el sitio

Se reemplazaron las referencias estáticas de fachada en Visita, Contacto, Gobernanza y la lectura «Jerusalén: nuestra comunidad» por la versión frontal limpia v03, exportada como JPEG de 1448 × 1086 px (423 KB). Inicio usa v03 como imagen local de respaldo; una portada propia configurada en el CMS mantiene prioridad. Se conservaron la foto original, las propuestas IA v01/v02/v03 y sus datos de procedencia en LOCAL. La nueva imagen se generó a partir de una foto de referencia y debe entenderse como una representación editorial mejorada; no como una fotografía documental ni como validación de cotas arquitectónicas. Cambio local; sin publicación.

Fuente: `LOCAL/Trabajos temporales/FOLLETO JERUSALÉN/Propuestas_fachada_IA/Fachada_Iglesia_Jerusalen_frontal_limpia_v03.png`, `PROCEDENCIA_FACHADA_V03.json`; copias web en `src/assets/Jerusalén/Fachada Iglesia Jerusalén v03.jpg` y `public/images/cuadrangular/fachada-jerusalen-v03.jpg` (20-oct-2026).

## 20-oct-2026 — Fondo del encabezado de Alabanzas

Se refinó el fondo del hero de `/recursos/alabanzas`: el degradado ahora combina azul noche, índigo y un resplandor dorado discreto; las franjas horizontales se sustituyeron por ondas concéntricas de baja opacidad, con una viñeta suave para dar profundidad sin competir con el contenido. El texto, las tarjetas, los botones y los datos del módulo no cambiaron. Vista local revisada en escritorio y a 390/320 px; título y cita legibles, sin desbordamiento horizontal en 320 px. Sin publicación.

Fuente: `src/features/songs/components/SongsHero.tsx` y vista local `/recursos/alabanzas` (20-oct-2026).

## 19-oct-2026 — Dorado semántico para énfasis

Se consolidó un acento dorado reutilizable inspirado en los tonos del logo: el tono sólido para texto pequeño usa `#9D660E` en tema claro y `#FFD679` en tema oscuro. Los degradados para títulos/indicadores usan `#9D660E → #AE8333` en claro y `#FFD679 → #EECF92 → #C79D3F` en oscuro. Las utilidades `text-church-gold-emphasis`, `text-church-gold-gradient`, `bg-church-gold-emphasis-soft`, `border-church-gold-emphasis` y `gold-emphasis-line` centralizan el uso por tema. Aplicación inicial: título de Doctrina y línea del Viaje de la Fe. Criterio: reservar el oro para jerarquía, hitos, referencias o estado seleccionado; mantener azul para navegación/CTA principales y no colorear tarjetas completas sin necesidad. ESLint específico, build y `git diff --check` pasan; QA visual de escritorio claro/oscuro confirmado; sin publicación.

Fuente: `src/index.css`, `src/features/home/components/PremiumDoctrineCards.tsx`, `src/components/public/ChurchJourneySection.tsx` (19-oct-2026).

## 20-oct-2026 — Tarjetas finales de Inicio

Se reorganizaron los llamados de donaciones y visita con una jerarquía compartida: título y mensaje a la izquierda, acción directa a la derecha en escritorio y apilado en pantallas pequeñas. El dorado semántico del logo marca etiquetas y botones, con contraste de texto adaptado por tema; se retiró la ilustración que interfería con el contenido. El estado sin cifras verificadas ahora explica que están en preparación, sin mostrar métricas inventadas. QA visual local en escritorio confirmó ambas tarjetas, el estado vacío y la continuidad con testimonios y footer. ESLint focalizado, build y git diff --check pasan. Sin publicación.

Fuente: `src/features/home/components/DonationsSection.tsx`, `StatsSection.tsx`, `CtaBanner.tsx`, `src/index.css` y vista local Inicio (20-oct-2026).

## 20-oct-2026 — Encabezado de Nosotros y retrato pastoral

Se simplificó el encabezado de `/nosotros` usando el retrato auténtico de los pastores que ya aparece en el folleto vigente. Se retiró la tarjeta histórica de Aimee y las placas que tapaban el retrato; el mensaje ahora queda en una ficha legible bajo la imagen, con los nombres «Rev. David Nicola» y «Corina Miranda» conforme al folleto. El retrato conserva su proporción 4:3 para evitar recortes excesivos en pantallas estrechas. Cambio local; sin publicación.

Fuente: `src/pages/public/components/PremiumAboutHero.tsx` y `LOCAL/Trabajos temporales/FOLLETO JERUSALÉN/Produccion_v05/FICHA_PROYECTO.md` (20-oct-2026).

## 19-oct-2026 — Personajes e imágenes de la enciclopedia bíblica

El catálogo de personajes pasó de 27 a 55 fichas: se agregaron Adán, Eva, Sara y 25 personajes que ya tenían retratos en la biblioteca visual del juego. Se añadieron 16 ilustraciones editoriales generadas para cubrir personajes que estaban sin imagen y completar a los patriarcas iniciales. Los originales PNG se conservaron en `LOCAL/08_Imagenes/Biblia/Personajes_originales/`; la web usa derivados JPEG de 1200 × 900 px y calidad 86 en `public/assets/encyclopedia/characters/`. Son ilustraciones generadas, no retratos históricos documentales. Se completaron contexto, momentos clave, datos y referencias; se corrigieron las referencias iniciales de Daniel, Pedro y Juan el Apóstol. Las tarjetas mantienen carga diferida, texto alternativo y tamaño explícito; el alias `charactersData` conserva ahora imágenes y descripción contextual. Sin publicación.

Fuente: `src/config/bibleIndexesData.ts`, `src/components/public/bible/BibleIndexes.tsx`, `public/assets/encyclopedia/characters/`, originales en LOCAL (19-oct-2026).

## 20-oct-2026 — Detalle ampliado y encuadre completo en la enciclopedia bíblica

Las ilustraciones de personajes y lugares se muestran completas con `object-contain`, sobre un fondo difuminado de la misma imagen; el panel de detalle coloca el título debajo de la imagen para no taparla. Los encabezados se adaptan en alto por breakpoint. Se añadieron introducciones editoriales para los 66 libros y las fichas hacen visibles autoría tradicional (o desconocida), fecha estimada de composición, colección, capítulos, marco histórico, temas y datos destacados. La línea histórica separa el marco del relato y la fecha aproximada de redacción, sin presentar estimaciones como fechas exactas. QA local: vista escritorio del detalle de Génesis; viewport de 390 × 844 px para el panel de Génesis, tarjeta e ilustración de Jesús; `documentElement.scrollWidth` 380 px frente a 390 px de viewport y sin desplazamiento horizontal. ESLint focalizado, compilación y `git diff --check` pasan. Sin publicación.

Fuente: `src/components/public/bible/BibleIndexes.tsx`, `src/config/bibleIndexesData.ts` y enciclopedia de `/recursos/biblia` (20-oct-2026).

## 19-oct-2026 — Ajuste solicitado al encabezado de Nosotros

Se restauró la composición original del hero tras la revisión del usuario: se conserva el mensaje sobre la fotografía y el distintivo inferior «Una iglesia cercana y activa»; se quitaron únicamente las tres tarjetas marcadas. Se integró el retrato editorial elegido por el usuario (`magnific__-__64463.png`) como derivado WebP de 1401 × 2102 px y 163 KB en `src/assets/Jerusalén/Pastores iglesia interior.webp`; el original permanece intacto en LOCAL. El encuadre usa ampliación suave y posición vertical ajustada para destacar ambos rostros dentro del marco. QA local visual en escritorio claro; sin publicación.

Fuente: `LOCAL/Trabajos temporales/FOLLETO JERUSALÉN/Propuestas_grafica_IA/magnific__-__64463.png`, `src/assets/Jerusalén/Pastores iglesia interior.webp` y `src/pages/public/components/PremiumAboutHero.tsx` (19-oct-2026).

## 19-oct-2026 — Retratos individuales del liderazgo

Se actualizaron las fotos individuales de David Nicola y Corina Miranda con fondos editoriales de un auditorio evangélico contemporáneo: paneles de madera, asientos de reunión y luz ambiental cálida con azul. Se evitaron la nave, el altar y los objetos devocionales propios de una iconografía católica. La sección usa imágenes WebP 1448 × 1086 y mantiene proporción 4:3 con encuadre centrado; los retratos originales permanecen intactos. Las nuevas imágenes son composiciones editoriales generadas y no fotografías documentales del auditorio real. Sin publicación.

Fuente: retratos originales `src/assets/Jerusalén/Pastor David.webp` y `Pastora Corina.webp`; composiciones generadas conservadas en `C:\Users\Nicola\.codex\generated_images\01a15644-f245-7e91-8077-893df1b61c35`; derivados web `Pastor David liderazgo auditorio.webp` y `Pastora Corina liderazgo auditorio.webp`; integración en `src/pages/public/About.tsx` (19-oct-2026).

## 20-oct-2026 — Código subido; despliegue web pendiente de acceso

El commit `f6436f4` quedó en `main` del repositorio `iecejerusalen-eng/iglesia-jerusalen`. La migración `20261020030253_ministry_photo_galleries` se aplicó en Supabase; las 185 versiones locales y remotas coinciden y se verificaron RLS y las cuatro políticas de la galería. La versión de novedades 1.10.0 y cuatro cambios están guardados como borrador en `changelog_versiones`/`changelog_cambios`, sin anunciar un despliegue que aún no se ve en producción.

El dominio todavía entrega el `index.html` anterior para imágenes nuevas (HTTP 200 con `Content-Type: text/html`), por lo que no se considera desplegado. Vercel devolvió 403 de autorización para el ámbito `iglesia-jerusalen`; la CLI disponible tampoco reconoce ese ámbito. Pendiente: recuperar acceso Vercel y desplegar el commit `f6436f4`; después publicar el borrador 1.10.0 y verificar recursos/rutas en producción. Fuente: Git remoto, historial y consultas de Supabase, respuestas HTTP del dominio oficial y respuesta de acceso de Vercel (20-oct-2026).

## 19-oct-2026 — Composiciones pastorales con el auditorio de Jerusalén

Se creó una serie coherente de tres retratos editoriales: David y Corina juntos, David individual y Corina individual. Las composiciones usan la fotografía real del auditorio como escenario reconocible, suavemente desenfocado; la fachada v03 se usó solo como guía de color azul, crema y dorado, sin mezclar arquitecturas. Los derivados WebP son 1448 × 1086 px (calidad 90) y están integrados en el hero y las tarjetas de liderazgo de `/nosotros`. Originales generados y foto interior aportada conservados en LOCAL; procedencia y hashes agregados al mapa. Son composiciones generadas, no fotos documentales de los pastores en ese auditorio. Integración local sin publicación; pendiente de revisión del usuario.

Fuente: `LOCAL/Trabajos temporales/FOLLETO JERUSALÉN/Propuestas_retratos_auditorio_v01/FICHA_RETRATOS_AUDITORIO.md`, `LOCAL/08_Imagenes/Jerusalen/Originales/Auditorio interior Iglesia Jerusalén 2026-10-19.png`, derivados `src/assets/Jerusalén/*auditorio-jerusalen-v01.webp`, `src/pages/public/About.tsx` y `src/pages/public/components/PremiumAboutHero.tsx` (19-oct-2026).

## 19-oct-2026 — Recorrido de visita, liderazgo y mejoras del admin

En `/nosotros` se añadieron enlaces directos para planificar la visita y saltar a los horarios vigentes de `/visita`; los horarios siguen viniendo de la agenda y la dirección de la fuente institucional existente. Se completó la presentación de los pastores con descripciones de respaldo cuando una ficha pública llega vacía, textos alternativos más descriptivos, dimensiones/carga responsiva y acciones a Contacto y Peticiones. Los documentos distinguen lectura en línea y descarga de estatutos/reglamento.

En Admin se amplió la bandeja de trabajo con pendientes de seguimiento, revisión, publicaciones atrasadas y actividades propias del día; el centro de contenido incorpora estados de borrador, revisión, programación y publicación, junto a una línea de próximas actividades según permisos. La biblioteca ahora filtra recursos con procedencia incompleta y mantiene aparte los archivos del depósito privado; el selector compartido busca los últimos 100 medios y quedó integrado en juegos, Biblionario y presentaciones. El panel de salud resume revisiones, fechas/fuentes, y enlaza a Usuarios, Roles y Permisos.

Verificación local: la vista accesible de `/nosotros` mostró los enlaces de visita y horarios, los retratos con texto alternativo, y los dos documentos con destinos de lectura y descarga. `npm run lint`, `npx tsc --noEmit`, `npm run build` y `git diff --check` pasaron; no se ejecutó la suite de pruebas. Cambio local; sin publicación.

Seguridad pendiente confirmada en Supabase de Iglesia Jerusalén mediante lectura de `admin_security_checks`: `auth_passwords` y `rpc_advisors` figuran pendientes; las fechas de esa revisión registrada son 13-oct-2026. La documentación oficial actual indica que la protección nativa de contraseñas filtradas requiere el plan Pro o superior. El conector de Supabase disponible no ofrece operación para cambiar Auth settings y el registro vigente indica que el Dashboard requiere iniciar sesión; el plan no fue expuesto por la consulta de proyecto. No se modificó Auth ni se marcó la revisión como completada.

Fuentes: `/visita`, `src/pages/public/About.tsx`, `src/features/dashboard/components/ActionQueue.tsx`, `src/features/editorial/components/EditorialSchedulePanel.tsx`, `src/pages/admin/MediaVault.tsx`, `src/components/admin/MediaAssetPicker.tsx`, `src/features/dashboard/components/SiteHealth.tsx`; consulta de solo lectura a Supabase el 19-oct-2026; [Supabase Password Security](https://supabase.com/docs/guides/auth/password-security).
