# Mensajería administrativa

## Alcance

La página `/admin/chat` permite conversaciones directas entre perfiles autenticados no suspendidos. Los mensajes contienen únicamente texto y emojis; no admite adjuntos, HTML ni confirmaciones de lectura. La marca mostrada junto a un mensaje propio significa “enviado”, no “leído”.

## Reglas aplicadas en la base de datos

La migración `20260810225509_chat_security_and_moderation.sql` establece estas reglas:

- Los chats directos se crean mediante una función atómica y tienen exactamente dos participantes.
- Los clientes ya no pueden insertar chats o participantes directamente.
- Solo un participante puede leer un chat o sus mensajes.
- El remitente debe coincidir con la sesión y pertenecer a la conversación.
- Cada mensaje debe contener entre 1 y 1.000 caracteres después de quitar espacios exteriores.
- Una cuenta puede enviar hasta 30 mensajes por minuto, con al menos 750 milisegundos entre mensajes directos.
- Solo administradores, pastores y líderes no suspendidos pueden ejecutar una difusión.
- Cada difusión acepta entre 1 y 100 perfiles disponibles y se ejecuta en una sola transacción: se completa entera o se revierte entera.
- Los usuarios pueden borrar sus propios mensajes y salir de sus conversaciones. Salir no promete borrar los mensajes de la otra persona.
- La retención configurable queda limitada a 1–90 días.

Los límites existen en PostgreSQL, no solamente en botones de la interfaz. Las tablas conservan RLS y reciben únicamente los privilegios necesarios para lectura, envío, eliminación propia y salida.

## Reglas de interfaz

- Los errores de conversaciones, contactos y mensajes se muestran con reintento; no se convierten en listas vacías falsas.
- La conexión en tiempo real indica conectado, conectando o error.
- La presencia en línea y las confirmaciones de lectura no se muestran porque el sistema no registra esos estados.
- Las fechas de nacimiento ausentes, inválidas o futuras no se clasifican como jóvenes.
- Las difusiones requieren confirmación y muestran el número real de destinatarios.
- Si está activo el plugin “Filtro de Contenido Ofensivo”, el texto se ajusta antes de enviarse y se informa al remitente.

## Retención y datos existentes

Los nuevos mensajes cumplen las restricciones inmediatamente. Las restricciones de longitud sobre registros históricos se crean como `NOT VALID` para no bloquear el despliegue por datos antiguos; PostgreSQL sí las aplica a escrituras nuevas. Antes de validarlas sobre todo el historial se debe auditar cualquier registro previo que no cumpla.

## Despliegue y verificación

La interfaz requiere que la migración se aplique antes de usar las nuevas funciones RPC. Tras desplegarla se deben probar, con dos usuarios reales y uno sin permisos:

1. Crear o recuperar una conversación directa.
2. Enviar y eliminar un mensaje propio.
3. Verificar que un tercero no pueda leer el chat.
4. Confirmar que un usuario no autorizado no pueda difundir.
5. Ejecutar una difusión pequeña y comprobar su atomicidad.
6. Revisar los avisos de seguridad y rendimiento de Supabase.

La validación local de la migración requiere Docker/Supabase local activo o una base enlazada. No debe considerarse aplicada solo porque el código de la aplicación compile.
