---
name: iglesia-jerusalen-web
description: Improve the Iglesia Jerusalén public site and admin platform while preserving real data, permissions, shared services, responsive UX, and measurable performance.
---

# Iglesia Jerusalén Web

Use this skill when changing public pages, administrative modules, shared UI, media, navigation, content workflows, or performance in this repository.

## Project decisions

- Prefer the existing shared centers: Comunidad, Contenido, Medios, Comunicaciones, Agenda, Culto/Producción, Formación, and Comercio.
- Do not add a new isolated admin module when an existing center can own the workflow. Preserve aliases only when they are needed for compatibility.
- Treat Supabase data as real and permission-sensitive. Never use demo values or silent fallbacks to claim success. Database or RLS changes require the Supabase project skills and a verified migration path.
- Reuse the existing block renderer, media picker/uploader, permission hooks, error boundary, loading states, and responsive navigation before creating alternatives.

## Public experience

- Make the primary actions obvious: plan a visit, view schedules/events, listen to sermons, find a ministry, request prayer, and contact the church.
- Every route needs useful title/description metadata, a meaningful empty/error/loading state, keyboard focus, accessible labels, and mobile-safe layout.
- Keep the first viewport light: lazy-load below-the-fold media and heavy feature modules; only mark the true LCP asset as high priority.
- Use responsive image formats and explicit `alt`, `sizes`, `width`/`height` where known. Do not ship multi-megabyte static images when a WebP/AVIF alternative preserves acceptable visual quality.

## Admin experience

- Keep permission checks at the route and action levels. Do not expose sensitive CRM, finance, pastoral, or credential data in aggregated widgets without an explicit permission.
- Each management flow must expose search/filter, loading, empty, error, success, confirmation before destructive actions, and an audit trail when sensitive data changes.
- Prefer one shared workflow with contextual tabs or filters over duplicated editors. Keep the global command/search entry point usable from keyboard and mobile.

## Verification

Run the narrowest meaningful checks after each change, then the repository gates before reporting completion:

```text
npm run lint
npm test -- --run
npm run build
npm run test:e2e
```

For performance changes, compare generated asset sizes and inspect the affected browser flow. Report remote Supabase or deployment checks separately when credentials/CLI/connectors are unavailable.
