# Culto en Vivo e importación de alabanzas

## Qué existe hoy

- `/admin/alabanzas` ya tiene editor libre, editor estructurado por secciones y un importador de texto/CifraClub que identifica encabezados, líneas de acordes, letra, tono, BPM y enlaces.
- El campo Artista/Autor ahora ofrece una lista desplegable basada en los artistas existentes, sin impedir escribir un valor nuevo.
- `/admin/tiempo-de-culto` ya planifica cultos, asigna personas y prepara destinos Holyrics.
- `/admin/holyrics` ya contiene conexión local mediante puente y conexión por Internet, además de controles de presentación.
- La página pública `/comunidad/culto-en-vivo` es la URL canónica de la experiencia; `/en-vivo` se mantiene como alias.

## Formatos de importación recomendados

| Formato | Acordes | Estructura | Uso recomendado |
| --- | --- | --- | --- |
| ChordPro (`[G]Tu letra`) | Sí, embebidos | Secciones opcionales con `{start_of_chorus}` | Fuente canónica editable y portable |
| Texto de CifraClub | Sí, en línea superior o junto a la letra | Encabezados como `[Coro]`, `Intro`, `Puente` | Copiar/pegar rápido; requiere revisión visual |
| Texto plano | No o acordes detectables | Párrafos separados por líneas en blanco | Himnos sin cifrado |
| HTML/Rich Text | Sí, si usa nodos con `data-chord` | Bloques visuales | Edición avanzada dentro del panel |
| Holyrics JSON | Letra por párrafos; acordes deben conservarse en el texto o en la convención elegida | `paragraphs[].description` | Envío automático a producción |
| Markdown/CSV | Opcional | Metadatos por columnas | Importaciones masivas y migraciones |

El analizador debe conservar siempre tres capas: texto original, representación estructurada (`sections[]`) y salida renderizada. Así el usuario puede corregir una detección sin perder la fuente original. La detección no debe decidir silenciosamente: debe mostrar una vista previa con advertencias para líneas ambiguas, acordes dudosos y secciones no reconocidas.

## Holyrics: integración verificada

Holyrics documenta un API Server HTTP local. La API de creación de canciones acepta `title`, `lyrics` o `paragraphs`, `artist`, `author`, `copyright`, `key`, `bpm`, `time_sig`, enlaces de streaming y etiquetas en versiones recientes. La API local acepta solicitudes desde loopback; para usarla desde la aplicación se necesita el puente local que ya existe en `tools/holyrics-bridge`.

La estrategia segura es:

1. Guardar la canción y el culto en Supabase.
2. Crear una orden idempotente en `holyrics_commands`.
3. El puente local toma la orden, llama a Holyrics y devuelve acuse/error.
4. Guardar `worship_sync_links` para no duplicar canciones o elementos.
5. Registrar el resultado y permitir reintento explícito.

No se debe intentar llamar la API local directamente desde el navegador público ni guardar tokens en el frontend. El API por Internet debe permanecer detrás de una función de servidor y permisos de producción.

Fuentes consultadas:

- https://github.com/holyrics/Scripts/blob/main/ApiPopupCreateSong.md
- https://holyrics.com.br/tips/features.html
- https://github.com/holyrics/API-Server
- https://github.com/holyrics/jslib

## Arquitectura propuesta

### Planificador de cultos

`worship_services` es la sesión; `worship_service_items` es el orden; `songs` es el catálogo; `holyrics_connections`, `holyrics_commands` y `worship_sync_links` son la cola y trazabilidad de producción. Las reglas recurrentes deben seguir generando borradores revisables, no publicar automáticamente sin confirmación.

### Sesión pública de culto

La siguiente evolución debe añadir una entidad `live_service_sessions` relacionada con `worship_services`, con:

- estado `scheduled | live | ended | archived`;
- URL de transmisión, título y bloque actual;
- `content_blocks` JSONB para el editor completo;
- resumen en vivo y notas editoriales;
- visibilidad y moderación.

Las encuestas, preguntas, reacciones y chat deben vivir en tablas separadas con RLS y límites de frecuencia. La vista pública solo lee contenido publicado; los moderadores escriben mediante permisos de producción. Supabase Realtime debe suscribirse solo al canal de la sesión activa.

### Cierre automático

Al pasar una sesión a `ended`, una función de servidor debe:

1. congelar el snapshot de bloques, agenda, letras y resumen;
2. crear o actualizar el sermón relacionado;
3. transferir título, predicador, video, referencias y contenido;
4. dejar encuestas/preguntas como resultados archivados;
5. registrar un evento de auditoría.

El cierre debe ser idempotente: repetirlo no puede crear dos prédicas.

## Fases de implementación

1. **Base ya disponible:** URL pública, CTA desde Comunidad, importador editable, catálogo de artistas y conexión Holyrics.
2. **Sesión persistente:** implementada en `20260824040000_live_service_sessions.sql`, con sesión activa, agenda pública, resumen editorial, encuestas, preguntas moderables y suscripción Realtime. El control administrativo está disponible en `/admin/culto-en-vivo`.
3. **Participación editorial:** implementada la creación/publicación/cierre de encuestas y la moderación de preguntas desde `/admin/culto-en-vivo`. El contenido se escribe manualmente y el bloque de resumen automático está desactivado para esta experiencia.
4. **Producción y asistencia:** implementadas múltiples URLs de transmisión, selector de plataforma, estado vacío sin video, contador agregado de asistencia y peticiones de oración sin nombres en `20260824050000_live_streams_attendance_prayer.sql`.
5. **Moderación avanzada:** chat persistente, límites anti-spam, historial de participación y permisos separados para anfitrión, moderador y editor.
6. **Cierre:** automatización idempotente hacia `sermons`, reporte del culto y reutilización de los bloques en la página pública de la prédica.

### Activación de la fase 2

Aplica la migración en el proyecto Supabase antes de usar el control administrativo. La compilación frontend está verificada, pero en este entorno no se pudo ejecutar `supabase db lint --local` porque Docker/Postgres local no está iniciado. Después de aplicar la migración, verifica que las tablas estén expuestas al Data API y que `supabase_realtime` incluya las tres tablas nuevas.

## Criterios de aceptación

- Una alabanza puede importarse con o sin acordes, revisarse por secciones y editarse sin volver al formato original.
- Artista/autor se selecciona de una lista existente o se crea como nuevo valor.
- Un encargado puede enviar una canción y luego una diapositiva a Holyrics, viendo acuse o error real.
- El visitante puede ver transmisión, agenda, letra, resumen, encuesta, preguntas y oración desde una sola URL.
- Al cerrar el culto, el contenido queda disponible como prédica sin duplicación.
- Los tokens nunca aparecen en el navegador y las tablas públicas tienen RLS explícito.
