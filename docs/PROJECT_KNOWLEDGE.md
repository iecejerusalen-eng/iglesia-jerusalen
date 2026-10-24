# Conocimiento del Proyecto: Iglesia Jerusalén

## 2026-10-24 — Reservas, tienda y comunidad en el asistente

El asistente responde con los espacios activos publicados en `spaces`, leyendo solo los campos que ya muestra `/reservas`; no consulta las reservas de personas ni confirma disponibilidad por fecha. Explica que la solicitud requiere iniciar sesión y queda pendiente de confirmación. También dirige a `/tienda` para el catálogo y a `/comunidad` para testimonios, peticiones y noticias, con una indicación para no publicar datos privados. Reservas y Tienda se añaden a los atajos del chat. Release 1.14.19 publicado en Vercel el 2026-10-24; la lista de episodios puede quedar vacía mientras no existan episodios publicados.

La consulta dinámica también lista programas publicados y episodios recientes del podcast con metadatos públicos y enlaces a las fichas. Validación local: ESLint focalizado, TypeScript/Vite/PWA y `git diff --check` correctos. La cuenta de Iglesia Jerusalén publicó `626be19` en `main`; Vercel quedó `READY` y la página pública respondió HTTP 200. El chatbot se abrió en producción, listó el programa «Chicas Sabias» y mostró que no hay episodios de podcast publicados, coherente con `/podcast`.

## 2026-10-24 — Ampliación del asistente público

El asistente público ofrece rutas y respuestas directas para podcast, biblioteca de alabanzas, programas y Aula Virtual. La portada del chat presenta accesos en una cuadrícula de dos columnas y mantiene visible el saludo al abrirse. La detección de preguntas de ubicación se acotó para no capturar preguntas como «¿Dónde escucho el podcast?». El contexto generativo recibe rutas oficiales y descripciones públicas de ministerios convertidas a texto plano. La función `church-assistant` está desplegada en Supabase como versión 2; falta autorización de Vercel para publicar el sitio. La clave de Gemini no está configurada y se conserva el modo guiado. Preparación de release 1.14.19.

## 2026-10-23 — Personajes del Éxodo conectados con el estudio

La Cronología «Éxodo y Canaán» abre desde cada escena las fichas correspondientes de Moisés, Aarón, Miriam, Josué, Caleb y el faraón del Éxodo. Se añadieron perfiles con síntesis y referencias directas a los pasajes, reutilizando el selector de personas y el lector bíblico existente. La ficha del faraón conserva el anonimato del relato, sin asignarle una identidad histórica no indicada por el texto.

Verificación local: ESLint focalizado y build TypeScript/Vite/PWA pasaron; precache 213 recursos. Sin pruebas adicionales, QA visual, cambios Supabase o publicación.

> Continuidad 21-oct-2026: fase 4 de tienda, versión 1.14.1 (seguimiento privado, vinculación de invitados, biblioteca por compra y enlaces de productos). Contrato, pruebas, límites de Google Drive y publicación coordinada en [store-customer-portal.md](store-customer-portal.md). Ventas cerradas; no confundir este estado con producción.

Este documento centraliza el conocimiento técnico, arquitectónico y funcional del proyecto **Iglesia Jerusalén**.

---

## 1. Descripción y Arquitectura General
El sistema es una **Aplicación Web Progresiva (PWA)** de gran escala que sirve como plataforma integral para la iglesia. 
- **Frontend**: Vite + React + TypeScript + Tailwind CSS v4 + Framer Motion. UI potenciada con componentes Magic UI y Radix.
- **Backend (BaaS)**: Supabase (PostgreSQL, Auth, Storage).
- **Despliegue**: Vercel (`vercel.json`).
- **Estado Global**: Zustand (`useAuthStore.ts`, etc).
- **Navegación**: React Router DOM (Múltiples rutas anidadas para admin, LMS, público).

---

## 2. Módulos Principales (Features)

### 2.1. Aula Virtual (LMS)
El corazón educativo de la iglesia. 
- **Estructura**: `Escuelas` > `Programas/Rutas` > `Módulos` > `Lecciones`.
- **Tipos de Estudio**: "Cursos Certificados" (requieren matrícula y seguimiento) y "Estudios Abiertos" (lectura inmediata sin registro riguroso).
- **Dashboards**: Existen paneles especializados para el *Estudiante* (gamificado con XP, lecciones y certificados) y el *Docente* (gestión de clases, foros, asistencia y calificaciones).
- **Administración Académica**: `DirectorDashboard` y `LMSAcademicAdmin` para la gestión curricular.

### 2.2. Sistema de Roles (RBAC)
Múltiples niveles de acceso (Pastor, Admin, Docente, Estudiante, etc). Controlado por perfiles de usuario y metadatos de Supabase Auth. Los módulos de administración en `/admin` están restringidos según el rol.

### 2.3. Tienda (E-commerce) e Inventario
- Venta de libros, merchandising, y cursos de pago.
- Carrito de compras (`Cart.tsx`, `Checkout.tsx`) y panel de compras del usuario (`MyPurchases.tsx`).
- Gestión de inventario físico y digital. (Actualmente los pagos manuales por transferencia son el estándar, pasarelas de terceros pendientes).

### 2.4. Juegos y Gamificación
- `Biblionario`: Juego interactivo tipo "Quién quiere ser millonario" con preguntas bíblicas y música de tensión dinámica.
- `MemoryMatch`: Juego de memoria visual con motivos bíblicos.
- `Leaderboards` y sistema de experiencia (XP) para estudiantes.

### 2.5. Herramientas Editoriales y Sincronización
- **Page Editor**: Constructor visual de landings.
- **Sync Worker (`syncWorker.ts`)**: Motor de sincronización background para permitir que áreas de la plataforma funcionen offline y sincronicen datos (ej. toma de asistencia) cuando haya red (PWA Offline First approach para features clave).

---

## 3. Pautas de Código, Estilos y Diseño Visual

- **TypeScript Estricto**: Evitar el uso de `any`. Las interfaces de base de datos se generan/mapean desde Supabase.
- **Estética "Premium" (Taste-Skill & UI/UX Pro Max)**: Ver [`docs/DESIGN_AND_AI_TOOLKIT.md`](file:///g:/CODE/Iglesia%20Jerusal%C3%A9n/docs/DESIGN_AND_AI_TOOLKIT.md) y la skill [`.agents/skills/taste-skill/SKILL.md`](file:///g:/CODE/Iglesia%20Jerusal%C3%A9n/.agents/skills/taste-skill/SKILL.md).
  - Uso de bloque `design_plan` previo al código.
  - Paleta oficial: Azul primario `#1E3A8A` y Dorado de la iglesia `#C79D3F` (`--color-church-gold`).
  - Para énfasis adaptado al tema, usar `text-church-gold-emphasis` (texto pequeño, `#9D660E` claro / `#FFD679` oscuro), `text-church-gold-gradient` (titulares), `gold-emphasis-line`, `bg-church-gold-emphasis-soft` o `border-church-gold-emphasis`. Mantener azul para navegación y acciones principales; reservar el oro para jerarquía, hitos y selección. Evitar el degradado en texto pequeño.
  - Tipografías oficiales: Playfair Display (Serif) e Inter (Sans-serif).
  - Prevención de *card-ception* (cajas anidadas excesivas) y layouts con flujo natural sin recortes de texto.
- **UI UX**: Notificaciones con `sonner`, íconos con `lucide-react`, componentes interactivos de Magic UI y Framer Motion.

---

## 4. Base de Datos (Supabase)
Las tablas utilizan el prefijo según su dominio:
- `lms_*`: Tablas del Aula Virtual (cursos, matrículas, progreso, certificados, sesiones).
- `store_*`: E-commerce (productos, variantes, órdenes).
- Tablas core para miembros, ministerios, eventos, peticiones, etc.
*Ver la carpeta `/supabase` para todas las migraciones SQL.*

---

## 5. Comandos Frecuentes
- **Verificación de Tipos**: `npx tsc --noEmit`
- **Levantar Servidor Dev**: `npm run dev`
- **Construir Producción**: `npm run build`

---

## 6. Herramientas de IA y Servidores MCP del Ecosistema
Consultar [`docs/DESIGN_AND_AI_TOOLKIT.md`](file:///g:/CODE/Iglesia%20Jerusal%C3%A9n/docs/DESIGN_AND_AI_TOOLKIT.md) para la configuración de:
- **UI/UX Pro Max GO** (`uipro-cli`): Heurísticas de diseño y estilos.
- **NanoBanana MCP** & **Google Stitch MCP**: Mockups y maquetación UI con Gemini.
- **21st.dev Magic**: Catálogo de componentes React + Tailwind.
- **Bright Data MCP**: Web scraping sin bloqueos para investigación.
- **Graphiti MCP**: Memoria a largo plazo en Neo4j.
- **Meshy AI & WebGL 3D**: Generación e integración de modelos y objetos 3D.

## 2026-10-23 — Cronología de Éxodo y Canaán en el estudio bíblico

Se añadió localmente al hub `/programas/estudio-biblico` el recorrido «Éxodo y Canaán» con 14 escenas, desde la opresión en Egipto hasta la renovación del pacto en Siquem. Cada escena abre referencias en el lector `/recursos/biblia`, presenta una pregunta de observación y enlaza con el mapa existente. El panorama permite entrar al recorrido desde las tarjetas de Éxodo y la entrada en Canaán; el estado de estudio guardado v1 admite restaurar el nuevo alcance y su escena. El mapa de ChurchMaps presenta una ruta tradicional con lugares debatidos marcados «?»; no se afirma una reconstrucción definitiva ni fechas históricas.

Verificación local registrada: ESLint focalizado y build TypeScript/Vite/PWA pasaron, con 213 recursos precargados. QA visual del navegador no disponible en Work. Sin pruebas añadidas/ejecutadas, cambios Supabase o publicación. El inventario LOCAL terminó con cero diferencias tras dos sincronizaciones.

## 23-oct-2026 — Mapa exploratorio del Éxodo conectado con la Cronología

El mapa de ChurchMaps para «Éxodo y Canaán» ahora se acompaña de una lista interactiva de sus 14 escenas. Al elegir una escena, el panel muestra su resumen, referencias bíblicas, número dentro del recorrido y acceso para abrir el hito completo con su pregunta de reflexión. La selección se comparte con la Cronología. La lista se apila bajo el mapa en pantallas estrechas y permite recorrer escenas sin colocar pines con coordenadas no sustentadas. La nota del mapa conserva que la ruta es tradicional y que algunos topónimos son discutidos.

Implementación local en `src/pages/public/BibleStudyHub.tsx`. ESLint focalizado y `npm run build` (TypeScript, Vite y PWA) pasaron; precache de 213 recursos y CSS principal de 899,377 bytes frente al límite de 900,000. `git diff --check` sin errores; solo avisos de normalización LF/CRLF del checkout. No hubo QA visual de navegador en Work, ni pruebas añadidas/ejecutadas, cambios Supabase o publicación.
## 23-oct-2026 — Fuentes, permisos y criterio de lectura en el hub

El hub `/programas/estudio-biblico` incorpora un panel desplegable que muestra once recursos y distingue «En uso», «Referencia doctrinal», «Candidata» y «Uso condicionado». Explica que acceso gratuito no equivale a licencia reutilizable y que el lector `/recursos/biblia` sigue siendo el lugar compartido para consultar pasajes. El catálogo registra Tyndale Open Resources (CC BY-SA 4.0), ChurchMaps (dominio público declarado por su fuente), datos geográficos OpenBible.info (CC BY, con obligaciones ODbL cuando corresponda a datos OSM), declaración Cuadrangular internacional y reglamento ecuatoriano como referencias institucionales, más la declaración de Asambleas de Dios y la Fe y Mensaje de la Convención Bautista del Sur solo como comparaciones. RV1909/eBible.org y Open.Bible quedan como candidatas sin integración; imágenes se revisan por ficha; BibleProject solo se considera para enlace/inserción oficial bajo sus términos, no para copiar o alojar videos.

Fuentes actuales enlazadas en la interfaz: https://tyndaleopenresources.com/ ; https://churchmaps.info/index.html ; https://www.openbible.info/geo/ ; https://www.foursquare.org/about/beliefs/ ; https://ag.org/Beliefs/Statement-of-Fundamental-truths ; https://bfm.sbc.net/bfm2000/ ; https://ebible.org/bible/details.php?id=spaRV1909 ; https://openbibleimages.org/license ; https://open.bible/resources ; https://bibleproject.com/terms/ . Se preserva la atribución visible y no se declara que una fuente comparativa sea doctrina local ni que una fuente gratuita sea de dominio público.

Implementación local: `src/data/bibleStudySources.ts` y `src/pages/public/BibleStudyHub.tsx`. ESLint focalizado y build TypeScript/Vite/PWA pasaron; 213 recursos precargados, CSS principal 899,864/900,000 bytes. `git diff --check` pendiente de cierre. Sin pruebas añadidas/ejecutadas, Supabase ni publicación. Work no tuvo navegador disponible para QA visual.
