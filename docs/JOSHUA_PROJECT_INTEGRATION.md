# Integración Joshua Project

## Objetivo

El centro de Misiones combina proyectos propios administrados en Supabase con consultas limitadas y paginadas de Joshua Project. La aplicación añade contexto en español, navegación pastoral, oración y llamados a la acción; no replica el portal ni descarga públicamente su base completa.

## Seguridad

La clave que apareció en una captura o conversación debe considerarse expuesta y revocarse. No debe guardarse en archivos `.env`, variables `VITE_*`, tablas públicas ni código del navegador.

Después de generar una clave nueva:

```text
supabase secrets set JOSHUA_PROJECT_API_KEY=<CLAVE_NUEVA>
```

La Edge Function `joshua-project` agrega la clave exclusivamente en el servidor. El cliente recibe solo registros normalizados y nunca recibe la credencial.

## Actualización

- La función consulta la API oficial cuando no existe un caché vigente.
- Cada combinación de recurso, página y búsqueda se conserva durante 12 horas.
- El navegador conserva una respuesta pública durante 15 minutos.
- Si Joshua Project falla o cambia su formato, la interfaz muestra el error real; no sustituye la respuesta con cifras inventadas.

## Límites editoriales

- Máximo 24 registros por respuesta; la interfaz usa 12.
- Atribución visible en toda página con datos externos.
- Los datos se presentan como estimaciones y con fecha de consulta.
- No se publican coordenadas sensibles de pueblos o trabajadores.
- Los perfiles enlazan a Joshua Project para ampliar la investigación.

## Activación

1. Revocar la clave expuesta y crear otra.
2. Aplicar `20260808120000_missions_data_hub.sql`.
3. Configurar `JOSHUA_PROJECT_API_KEY` como secreto de Supabase.
4. Desplegar la función `joshua-project`.
5. Publicar proyectos institucionales desde `/admin/misiones`.
6. Verificar las respuestas y la atribución antes del despliegue público.

Fuentes: [términos de uso](https://joshuaproject.net/help/terms), [datos y metodología](https://joshuaproject.net/data), [datasets y API](https://joshuaproject.net/resources/datasets).
