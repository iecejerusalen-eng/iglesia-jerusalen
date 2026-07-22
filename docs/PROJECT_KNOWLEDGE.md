# Conocimiento del Proyecto: Iglesia Jerusalén

Este documento centraliza el conocimiento técnico, arquitectónico y funcional del proyecto **Iglesia Jerusalén**.

---

## 1. Descripción del Proyecto
- Aplicación web y plataforma para la comunidad de la Iglesia Jerusalén.
- Incluye sistema de transmisión, eventos, sermones, juegos interactivos bíblicos (Biblionario), donaciones y gestión con Supabase & Vercel.

---

## 2. Pautas de Arquitectura & Base de Datos
- **Backend / BD**: Supabase (`supabase/`, `local_data.sql`).
- **Deploy**: Vercel (`vercel.json`).
- **Módulos**: Juegos interactivos, administración de sermones, eventos y transmisión en vivo.

---

## 3. Comandos de Verificación
- **Verificación de Tipos**: `npx tsc --noEmit`
- **Servidor Dev**: `npm run dev`
