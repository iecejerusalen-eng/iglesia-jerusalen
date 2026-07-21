---
name: ui-component-builder
description: Standardized workflow and catalog for building and integrating high-aesthetic UI components using Magic UI, MapCN, Shadcn UI, Base UI, Framer Motion, and Cobe 3D.
---

# UI Component Builder Skill (Magic UI, MapCN, Shadcn UI)

Esta habilidad establece las directrices para la creación y reutilización de componentes de interfaz de usuario de alto impacto visual y rendimiento en el proyecto.

---

## 🎨 Catálogo de Librerías UI y Cuándo Usarlas

### 1. Magic UI (`@magicui/globe`, `@magicui/mcp`)
Usa componentes de **Magic UI** para secciones de hero, destacados de la iglesia, reconocimientos y banners con alto factor de asombro (*WOW factor*):
- **Globe 3D**: `import { Globe } from "@/components/ui/globe"` — Para la sección de misiones y alcance global.
- **Bento Grid**: Para estructuración moderna de características o ministerios.
- **Border Beam / Shiny Button**: Para botones de llamados a la acción (donaciones, registro, eventos principales).
- **Animated List & Marquee**: Para testimonios en vivo, noticias o versículos del día.
- **Text Reveal**: Para versículos clave o slogans de la iglesia.

### 2. MapCN (`@mapcn/map`)
Usa los componentes de **MapCN / MapLibre GL** para cualquier mapa o ruta:
- **Map & MapControls**: `import { Map, MapControls } from "@/components/ui/map"`
- **MapMarker, MarkerPopup, MarkerLabel**: Marcadores interactivos para iglesias, células y eventos.
- **MapRoute & MapArc**: Líneas de ruta OSRM y arcos curvos entre ubicaciones (`@/components/map/ChurchRouteMap`).
- **MapGeoJSON & MapClusterLayer**: Agrupación automática de puntos masivos de miembros o células.

### 3. Shadcn UI & Base UI (`@base-ui-components/react`)
Usa los primitivos de **Shadcn UI & Base UI** para controles de formulario e interacción estándar:
- Autocomplete: `import { Autocomplete } from "@/components/ui/autocomplete"`
- Diálogos y Modales: `import { RouteModal } from "@/components/map/RouteModal"`
- Botones, Tarjetas, Menús Contextuales y Diálogos de Alerta.

### 4. Framer Motion & Anime.js
Usa **Framer Motion** (`framer-motion`) y **AnimeWrappers** (`@/components/animations/AnimeWrappers`):
- `AnimeFadeUp`, `AnimeStaggerGrid`, `AnimeHoverCard`, `AnimeZoomIn`, `AnimeRubberBandHover`.
- Animaciones de entrada escalonadas y efectos hover dinámicos.

---

## ⚡ Workflow de Creación de Componentes UI

Cuando el usuario pida crear un nuevo componente o vista:

1. **Inspección Previa**:
   - Revisa si el componente o una variante similar ya existe en `@/components/ui/` o `@/components/map/`.
2. **Selección de la Librería Adecuada**:
   - Para mapas/rutas ➔ Utilizar `@/components/ui/map` y `@/components/map/ChurchRouteMap`.
   - Para elementos visuales destacados ➔ Utilizar Magic UI (`Globe`, `ShinyButton`, `BorderBeam`, etc.).
   - Para controles interactivos de datos ➔ Utilizar Shadcn / Base UI (`@/components/ui/*`).
3. **Calidad y Rendimiento**:
   - **Tipado Estricto**: Cero uso de `any`. Usar tipos explícitos o `unknown`.
   - **Tailwind CSS v4**: Usar tokens de diseño y variables CSS compatibles con dark mode.
   - **Accesibilidad**: Asegurar etiquetas ARIA, atributos `alt` en imágenes y navegación por teclado.
   - **Verificación**: Correr `npx tsc --noEmit` o `npm run build` al finalizar.
