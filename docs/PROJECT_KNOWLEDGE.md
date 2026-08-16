# Conocimiento del Proyecto: Iglesia Jerusalén

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
