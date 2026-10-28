# Admin: operación y seguridad (1.7.0)

Inicio muestra solo pendientes de módulos autorizados: mensajes, solicitudes propias, recordatorios vencidos, lecturas en revisión y anuncios vencidos (fecha explícita o evento no recurrente terminado, America/Guayaquil).

El onboarding administrativo es complementario y no bloquea la navegación si sus consultas de red fallan. En ese caso se vacían sus pasos, se cierra el estado de carga y el hook conserva el error para diagnóstico y recuperación.

Visitas conservan su solicitud en Comunicaciones. Responsable, etapa, recordatorio y nota se guardan con control de versión e historial inmutable. Los recordatorios son internos; no envían mensajes. Los responsables disponibles tienen permiso de edición de comunicaciones. No existe una sincronización automática con contactos CRM que pueda duplicar solicitudes.

Páginas y lecturas tienen copia automática en `sessionStorage`, aislada por usuario y documento, vigente 24 horas y eliminada al cerrar sesión. Recuperar carga cambios pendientes; nunca publica. Avisos protegen cierre/recarga y navegación interna, incluidos los botones Atrás/Adelante. La comparación muestra diferencias respecto del servidor y permite comparar/recuperar versiones previas de secciones. Guardar una sección actualiza el sitio público; guardar una lectura conserva su borrador privado hasta revisión pastoral. Los conflictos de `updated_at`/revisión impiden sobrescrituras y el reordenado solo cambia posiciones, con validación atómica.

La biblioteca registra crédito, fuente, texto alternativo y estado de derechos en metadata JSONB. SHA-256 evita nuevas subidas idénticas hasta 100 MB; archivos antiguos sin huella y videos mayores requieren revisión manual. JPG/PNG mayores a 1 MB se pueden convertir a WebP hasta 1920 px; la opción puede desactivarse. No se borran duplicados automáticamente. Retirar del catálogo conserva el archivo del proveedor; borrar del depósito privado requiere confirmación. La biblioteca pública no se presenta como almacenamiento privado.

Contenido incluye revisión manual HTTPS desde `/api/admin-health`: sesión validada por Auth y permiso pages/view comprobado en DB; hasta 30 referencias internas, host fijo, sin consultas ni fragmentos y sin seguir redirecciones. No certifica renderizado de la aplicación ni destinos externos. Errores de React se registran solo en la pestaña, con ruta/hora; no se recopilan visitantes ni mensajes. El monitor de dominio conserva su frecuencia semanal.

Seguridad: vista store_orders respeta orders RLS; cinco funciones fijan search_path; funciones de trigger sin acceso RPC; contactos, actividades, ejecuciones CRM, medios y páginas respetan permisos. Para no administradores, override individual es autoritativo y puede restringir roles heredados. Admin/superadmin mantienen su excepción administrativa; cuentas bloqueadas son denegadas en DB. Historiales sin permisos de edición/borrado para clientes.

Registro de cuentas: mínimo 12 caracteres y Pwned Passwords con prefijo SHA-1 de cinco caracteres; no envía contraseña ni huella completa. Es una comprobación de interfaz: la protección efectiva frente a llamadas directas a Auth depende de la configuración del servidor. El aviso `auth_leaked_password_protection` sigue pendiente; su activación exige acceso al dashboard y el plan elegible indicado por Supabase. No se cambian contraseñas, planes ni pagos desde este trabajo.

Validación: `supabase/tests/admin_operations.sql` prueba anon, sin permisos, admin, consulta y denegación individual sobre permiso heredado con rollback. Las pruebas visuales locales con datos sintéticos no acreditan una sesión real ni un guardado de producción. Consultar el informe local para la evidencia de publicación y límites del runtime Firefox.
