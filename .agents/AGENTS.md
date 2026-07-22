# Reglas Generales del Proyecto (AGENTS.md)

Este documento establece las normativas arquitectónicas, de estilo y de calidad para todo el código generado en el proyecto. 
Estas reglas **DEBEN SER SEGUIDAS SIN EXCEPCIÓN** por cualquier agente que participe en la creación o modificación de código.

## 1. Principios de Arquitectura y Diseño
- **KISS & YAGNI:** Mantén el código lo más simple posible. No implementes abstracciones, hooks, clases o funcionalidades que no sean estrictamente necesarias en el momento (You Aren't Gonna Need It). 
- **Security by Design:** Evalúa siempre vectores de ataque (XSS, SQLi, IDOR, CSRF) antes de proponer código relacionado a autenticación, autorización o manipulación de inputs del usuario. Nunca confíes en el input del cliente sin validarlo y sanitizarlo.
- **Performance First:** Minimiza el impacto en el rendimiento. En frameworks frontend (React, Next.js, Vue), presta especial atención a evitar renders innecesarios. En backend y bases de datos, optimiza las consultas y ten en cuenta la escalabilidad de las soluciones.

## 2. Calidad del Código y Estilo
- **Tipado Estricto:** Usa siempre TypeScript o tipado estático (según el lenguaje) de forma estricta. Evita usar `any`, `Record<string, any>` o ignorar validaciones de tipos a menos que sea temporal o el último recurso.
- **Nomenclatura Clara:** Usa nombres descriptivos, preferiblemente en inglés para mantener un estándar universal en el código (por ejemplo, `getUserById`), a menos que las directrices específicas del proyecto dicten que la nomenclatura base debe ser en español.
- **Documentación de Código Eficiente:** No comentes lo obvio (el "qué"). Documenta el "por qué" (decisiones de diseño, casos límite que justifican una implementación extraña). Las funciones principales o exports públicos deben tener docstrings claros.
- **No Dejar Código Muerto o Comentado:** Limpia siempre los logs redundantes (`console.log`), variables sin usar y el código comentado.

## 3. Workflow de Implementación y Verificación
- **Autoevaluación:** Antes de proponer un cambio masivo, asegúrate de haber leído todos los archivos relacionados. No hagas suposiciones sobre funciones existentes.
- **Validación Automática / Pruebas:** Acompaña siempre el código nuevo con sugerencias de cómo probarlo (scripts, tests unitarios, o validación manual precisa).
- **Manejo de Errores Robustos:** No confíes en los _happy paths_. Siempre captura, registra y maneja las excepciones en las integraciones externas (APIs, BD). Devuelve respuestas controladas y significativas al usuario final sin exponer detalles internos del sistema.

## 4. Automatización y CLI-First (Antigravity Agents)
- **Verificación de Entorno (Vercel/Supabase):** Antes de ejecutar comandos destructivos o despliegues (ej. `vercel env add`, `supabase db push`), el agente **DEBE** verificar el contexto del proyecto mediante comandos de lectura (`vercel env ls`, `supabase status`) para evitar alterar otros proyectos de la cuenta del usuario.
- **Proactividad con CLIs:** Se fomenta el uso de interfaces de línea de comandos (Supabase CLI, Vercel CLI, GitHub CLI `gh`) para automatizar tareas repetitivas (subir migraciones `.sql`, desplegar Edge Functions, crear PRs, etc.) sin esperar que el usuario lo haga manualmente en el navegador.
- **Integraciones Nativas:** Al integrar plataformas externas (Cloudinary, Resend, Vercel), utiliza sus CLI o SDKs oficiales. Si cuentas con las herramientas necesarias, asume la responsabilidad de completar el ciclo completo (escritura de código -> despliegue -> verificación) usando el terminal local.

## 5. Uso de Librerías y Creación de Componentes UI (Magic UI, MapCN, Shadcn UI)
- **Consulta de Habilidad Obligatoria:** Al crear un nuevo componente o interfaz de usuario, el agente **DEBE** consultar la habilidad `ui-component-builder` (`.agents/skills/ui-component-builder/SKILL.md`).
- **Reutilización de Librerías del Proyecto:**
  - **Magic UI (`@magicui/globe`, `@magicui/mcp`)**: Usar para elementos de alto impacto visual (Globo 3D, Bento Grid, Shiny Button, Border Beam, Animated List, Marquee, Text Reveal).
  - **MapCN (`@mapcn/map`)**: Usar para mapas y rutas interactivos (`Map`, `MapControls`, `MapMarker`, `MapRoute`, `MapArc`, `MapGeoJSON`, `MapClusterLayer`).
  - **Shadcn UI & Base UI (`@base-ui-components/react`)**: Usar para primitivos de formulario, diálogos y controles interactivos (`@/components/ui/*`).
  - **Framer Motion & Anime.js**: Usar para micro-animaciones y efectos de entrada escalonados (`AnimeFadeUp`, `AnimeStaggerGrid`, `AnimeHoverCard`).
- **Velocidad y Calidad de Código:** Privilegiar la reutilización de componentes probados y patrones existentes sobre la invención desde cero, garantizando tipado TypeScript estricto, estética premium y compatibilidad con dark mode.

## 6. Protocolo Estricto Anti-Alucinación y Cero Ocultamiento de Errores (anti-hallucination-strict-error-handling)
- **Consulta Obligatoria y Cumplimiento Directo:** Todo agente debe consultar y regirse por la habilidad `anti-hallucination-strict-error-handling` (`.agents/skills/anti-hallucination-strict-error-handling/SKILL.md` o en la raíz global de skills).
- **Prohibición de Silenciar Errores:** Está **TERMINANTEMENTE PROHIBIDO** usar comentarios (`// @ts-ignore`, `// @ts-expect-error`, `/* eslint-disable */`), conversiones `as any` o bloques `try/catch` mudos (`catch(e){}`) para ocultar errores de compilación, de tipos o de ejecución. Todo error debe solucionarse de raíz o propagarse con registro estructurado (`console.error` con stack trace y notificación visible al usuario).
- **Verificación Empírica Antes de Afirmar Éxito:** Nunca declarar que un error está resuelto sin haber ejecutado una prueba real (`npx tsc --noEmit`, `npm run build`, o ejecución de scripts de test/diagnóstico). Si no es posible verificar en entorno automático, especificarlo con honestidad radical.
- **Cero Fallbacks Falsos ni Alucinaciones de APIs:** Prohibido inventar métodos o devolver datos falsos (`mock data`/`[]`) para enmascarar la caída o fallo de una API externa sin notificar al usuario final. Verificar siempre con `grep_search` o leyendo archivos de definición que los métodos o propiedades invocados realmente existen en las librerías instaladas.
