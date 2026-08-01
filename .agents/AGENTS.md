# Reglas y Arquitectura del Proyecto Iglesia Jerusalén (.agents/AGENTS.md)

## 1. Memoria y Conocimiento
- **Fuente Principal**: Revisa siempre [`docs/PROJECT_KNOWLEDGE.md`](file:///G:/CODE/Iglesia%20Jerusal%C3%A9n/docs/PROJECT_KNOWLEDGE.md).
- **Consistencia**: Consultar Supabase y los scripts de semillas (`seed_biblionario.js`, `seed_games.js`).

## 2. Pautas de Código
- **Tipado**: TypeScript estricto sin `any`.
- **Framework**: Vite + React + Supabase.

## 3. Tablas y Campos Dinámicos (Patrón Headless CMS)
- **Preferencia por JSONB**: Siempre que el usuario solicite que las tablas sean "dinámicas" o que se puedan "agregar columnas desde el panel de administración", **NUNCA** propongas usar comandos `ALTER TABLE` o DDL dinámico. En su lugar, recomienda e implementa siempre el patrón de columnas `JSONB` (ej. `custom_fields` o `metadata`). Esto permite gestionar la variabilidad de los datos de forma flexible, segura y rápida, sin comprometer ni romper el esquema rígido de la base de datos (PostgreSQL/Supabase).
