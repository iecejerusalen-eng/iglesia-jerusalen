# Asistente público de la Iglesia Jerusalén

## Alcance

El botón «¿Te ayudamos?» aparece en las páginas públicas que usan `PublicLayout`. Responde localmente preguntas frecuentes sobre horarios, ubicación, visitas, contacto, eventos y ministerios. Las consultas abiertas se envían a la función `church-assistant`, que usa Gemini con datos públicos actuales de horarios y próximos eventos. El asistente no accede a miembros, peticiones privadas, CRM ni información de administración.

Las preguntas abiertas se procesan en Google Gemini. El widget no persiste mensajes ni historial. La función registra IP y contador en `rate_limits` para permitir hasta 12 consultas cada 15 minutos por IP. La interfaz muestra esta información a los visitantes y recomienda no enviar datos personales o sensibles.

## Activación del proveedor de IA

La interfaz y la función están preparadas localmente. Para habilitar las respuestas generativas en producción:

1. Crear una clave restringida para Gemini en [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Guardar la clave como secreto `GEMINI_API_KEY` en **Supabase → Edge Functions → Secrets** del proyecto de Iglesia Jerusalén. Nunca agregarla al código, a un archivo público ni a `VITE_*`.
3. Desplegar `church-assistant` al proyecto Supabase `gqtatqekfrswvplemknc` usando el proceso de publicación habitual del repositorio. La función aún no aparece desplegada en ese proyecto.
4. Si el sitio se prueba en una URL de vista previa, agregar su origen a `CHATBOT_ALLOWED_ORIGINS` como lista separada por comas. Los dominios oficiales y los puertos locales 5173, 5174 y 4173 ya están permitidos.
5. Probar horarios, ubicación, una consulta abierta, un error del proveedor y el límite de solicitudes desde la web desplegada.

El modelo predeterminado es `gemini-3.5-flash-lite`; se puede cambiar con el secreto opcional `GEMINI_MODEL`. El proyecto remoto no se modifica al integrar estos archivos localmente. Sin la clave y el despliegue de la función, las respuestas locales de preguntas frecuentes siguen disponibles y las preguntas abiertas ofrecen un enlace de contacto.

## Límites de contenido

- Las respuestas con IA se basan en horarios y eventos públicos recuperados con el rol anónimo de Supabase, respetando sus políticas de lectura.
- La clave Gemini vive únicamente en el servidor. La función rechaza orígenes no permitidos, limita el tamaño de mensajes, aplica el rate limit existente y no guarda el contenido del chat.
- No se debe habilitar el acceso a tablas privadas ni incluir listados de miembros o contenido de peticiones en el contexto del modelo.
- Para consejería pastoral, doctrina institucional, emergencias o datos no publicados, el asistente debe dirigir a los canales oficiales y no inventar una respuesta.
