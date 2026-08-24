# Reglas y Arquitectura del Proyecto Iglesia Jerusalén (.agents/AGENTS.md)

## 1. Memoria y Conocimiento
- **Fuente Principal**: Revisa siempre [`docs/PROJECT_KNOWLEDGE.md`](file:///G:/CODE/Iglesia%20Jerusal%C3%A9n/docs/PROJECT_KNOWLEDGE.md).
- **Regla de UI**: Para crear o modificar componentes visuales, lee también [`context.md`](../context.md) y sigue su flujo de Magic UI, accesibilidad, rendimiento y verificación.
- **Consistencia**: Consultar Supabase y los scripts de semillas (`seed_biblionario.js`, `seed_games.js`).

## 2. Pautas de Código
- **Tipado**: TypeScript estricto sin `any`.
- **Framework**: Vite + React + Supabase.

## 3. Tablas y Campos Dinámicos (Patrón Headless CMS)
- **Preferencia por JSONB**: Siempre que el usuario solicite que las tablas sean "dinámicas" o que se puedan "agregar columnas desde el panel de administración", **NUNCA** propongas usar comandos `ALTER TABLE` o DDL dinámico. En su lugar, recomienda e implementa siempre el patrón de columnas `JSONB` (ej. `custom_fields` o `metadata`). Esto permite gestionar la variabilidad de los datos de forma flexible, segura y rápida, sin comprometer ni romper el esquema rígido de la base de datos (PostgreSQL/Supabase).

## 4. Estándar de Interfaz Gráfica Prémium (Glassmorphism & Aesthetics)
- **Referencia Obligatoria**: La estética de [`/admin/analisis`](file:///G:/CODE/Iglesia%20Jerusal%C3%A9n/src/pages/admin/AnalyticsDashboard.tsx) es el estándar visual predeterminado para toda la aplicación.
- **Fondo con Gradiente Radial**: Todo módulo admin/dashboard debe incluir en su capa posterior: `pointer-events-none absolute inset-x-0 -top-20 -z-10 h-96 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.11),transparent_38%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.09),transparent_35%)]`.
- **Contenedores de Cristal (*Glass Panels*)**: `rounded-3xl border border-white/70 bg-white/70 backdrop-blur-xl shadow-xl dark:border-white/10 dark:bg-slate-950/60`.
- **Tipografía y Alto Contraste**: Usar encabezados contrastados con subtítulos en mayúsculas `tracking-[0.18em] text-[11px] font-bold text-slate-500 dark:text-slate-400`.
- **Micro-interacciones y Badges**: Los estados, KPIs e indicadores deben contar con badges de baja opacidad (`bg-blue-500/10 text-blue-500 border-blue-500/20`) e iconos en contenedores de 44x44px.
