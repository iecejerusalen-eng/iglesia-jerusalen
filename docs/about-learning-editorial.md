# Lecturas de Nosotros

Las cinco rutas públicas leen `about_learning_published`. Si la consulta falla, muestran el texto local documentado con un aviso explícito y acción para reintentar. Nunca consultan borradores ni historial. Progreso y respuestas de práctica permanecen en el navegador; no constituyen matrícula, evaluación ni certificado.

## Administración

Contenido → Lecturas de Nosotros (`/admin/paginas/lecturas`), permiso existente `pages`. Editores con `edit` guardan borradores y solicitan revisión. Publicar exige ese permiso y rol admin/pastor, una firma pública y la revisión de la versión vigente. Cada guardado incrementa `revision`; un conflicto impide sobrescribir cambios ajenos. Una publicación toma un snapshot atómico del borrador revisado. Recuperar una versión solo carga un borrador para volver a revisar.

La importación inicial conserva autor y fuentes; **no acredita revisión pastoral**. `reviewed_at`/`reviewer_label` quedan vacíos hasta una revisión real. Notas de revisión, actores y autorización del audio permanecen en tablas privadas; del snapshot público se elimina `audio.authorization`.

## Fuentes

- Texto doctrinal/himno: reglamento ecuatoriano aportado, `public/documentos/reglamento-interno.pdf`, pp. 1–4; la letra cotejada permanece en `foursquareHymnData.ts`.
- Símbolos: originales de Drive Jerusalén; archivos fuente/procedencia en LOCAL, derivados en `public/images/cuadrangular`.
- Origen: folleto internacional y relato de Aimee; diferencia entre visión bíblica e interpretación denominacional explícita.
- Himno en YouTube: ICC SUR Ibagué, `-I1Omj7vE6k`, solicitado por el usuario. Se carga reproductor nocookie por clic; enlace original siempre disponible. No descarga de la grabación ni afirmación de licencia propia.

## Datos y verificación

Migraciones versionadas en `supabase/migrations`; pruebas transaccionales en `supabase/tests/about_learning_editorial.sql` cubren allow/deny, conflictos, revisión, snapshot y auditoría. Se ejecutan sobre la base y revierten toda modificación de prueba. UI con pruebas de solo lectura/editor/revisor y progreso. E2E cubre metadatos, índices, imágenes, preguntas y carga voluntaria del video.

`scripts/seed-about-learning.mjs` es una importación inicial explícita, idempotente, con credencial de servidor; no sobrescribe ediciones existentes. Nunca incluir esa credencial en la aplicación.

SEO: `PublicLayout` conserva el canonical por ruta; se retiró el canonical fijo de index.html. Las cinco rutas están en sitemap. La inclusión no acredita que Google ya haya indexado las páginas.

Pendiente: fuentes primarias/revisión de fechas de fundación local, testimonios y fotografías antiguas. La narrativa local marcada como propuesta no se publica como historia confirmada.


Corrección del usuario, 12-oct-2026: la reseña educativa de UTPL no corresponde a la historia de la iglesia y fue retirada del lector, sus fuentes y el borrador activo. Mantener la historia de la congregación dentro de su alcance, con fuentes institucionales pertinentes.
