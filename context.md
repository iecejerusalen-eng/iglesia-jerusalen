# Contexto y reglas de UI — Iglesia Jerusalén

Este archivo es la guía operativa para Codex, Antigravity y cualquier agente que cree o modifique interfaces en este proyecto.

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
