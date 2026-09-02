# Guía segura de configuración y migración — Iglesia Jerusalén

Este archivo no contiene credenciales. Los secretos deben vivir únicamente en un gestor seguro o en variables protegidas de Vercel/Supabase.

## Variables locales

Copia `.env.example` a `.env.local` y completa los valores desde un entorno seguro:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publicable
VITE_CLOUDINARY_CLOUD_NAME=tu-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=tu-upload-preset
VITE_R2_UPLOAD_ENDPOINT=
```

Las variables privadas (`SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_API_SECRET`, `AI_GATEWAY_API_KEY`, `GITHUB_TOKEN` y `VAPID_PRIVATE_KEY`) son exclusivamente de servidor y nunca deben comenzar por `VITE_` ni aparecer en el navegador.

## Migraciones

Compara el historial remoto con `supabase/migrations`, aplica únicamente migraciones revisadas y ejecuta advisors y pruebas RLS por rol. Nunca declares una migración aplicada sin comprobar el proyecto remoto.

## Seguridad

Si alguna credencial real estuvo en el archivo eliminado o en el historial Git, revócala y genera una nueva. La clave publicable de Supabase no sustituye la protección RLS.
