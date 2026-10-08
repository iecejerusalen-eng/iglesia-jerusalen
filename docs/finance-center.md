# Centro financiero privado

## Estado y alcance

Implementación local: `/admin/finanzas` y `/mis-aportes`. La migración no está aplicada a producción. No se han enviado mensajes externos, cobrado fondos ni modificado datos remotos.

El centro registra aportes voluntarios (efectivo / transferencia), egresos, fondos destinados, presupuestos mensuales, compromisos recurrentes, cierres de período, auditoría y avisos privados. Los reportes incluyen solamente movimientos confirmados. Los pendientes y anulados no son ingresos ni pagos realizados. El resultado y los flujos por método son del período, **no saldos bancarios conciliados**.

## Acceso

| Usuario | Consulta | Gestión |
|---|---|---|
| Congregante autenticado | Sus propios aportes y avisos | Registrar su aporte pendiente y elegir recordatorios |
| Cuerpo de apoyo (`apoyo`) | Libro, reportes y auditoría | No |
| Pastor | Libro, reportes y auditoría | Sí |
| Secretaría (`secretary` / `secretaria`) | Libro, reportes y auditoría | Sí |
| Tesorería | Libro, reportes y auditoría | Sí, asignando el rol personalizado `tesoreria` desde la gestión de acceso |
| Administrador técnico / otros roles | Sin acceso financiero automático | No |
| Visitante | Nombres de fondos activos / información pública para donar | No |

La autorización consulta perfiles y roles protegidos en PostgreSQL. No utiliza `user_metadata`, correo indicado en formularios ni permisos arbitrarios del navegador para autorizar lectura. El rol técnico puede administrar asignaciones en el sistema existente; la custodia de administradores, credenciales de servidor y copias de seguridad sigue siendo una responsabilidad operativa.

## Registro y verificación

1. El usuario elige fondo, importe, fecha y mes del aporte. El efectivo también puede registrarse como pendiente para que tesorería lo coteje con la recepción física.
2. Un comprobante nuevo se almacena en `finance-proofs`, privado, bajo el UUID del usuario. Admite JPG, PNG, WebP o PDF hasta 5 MB. La consulta genera enlaces de 60 segundos; no se almacena una URL pública.
3. El equipo de gestión verifica el dinero recibido. La transferencia requiere referencia bancaria y las referencias activas no se pueden repetir (sin distinguir mayúsculas).
4. Cada creación/corrección se audita. Modificar o anular requiere motivo. No se borra el libro. Las actualizaciones usan versión para detectar ediciones concurrentes.
5. La confirmación genera un aviso al titular en la misma transacción. Los mensajes manuales privados tienen ID estable para reintentos y requieren autorización del servidor.
6. El calendario usa `contribution_month`: un aporte registrado después puede corresponder al mes anterior. “Sin registro” no se presenta como deuda ni falta espiritual. Los recordatorios son opcionales y privados.

El comprobante acredita el registro administrativo, no sustituye un recibo fiscal. El sistema no ejecuta transferencias, sueldos ni cobros bancarios.

## Presupuestos, egresos y compromisos

Categorías iniciales: remuneración pastoral, remuneración de líderes, suscripciones, internet, servicios básicos, ayuda solidaria, construcción, misiones, mantenimiento y otros. Cada egreso permite beneficiario, referencia y comprobante privado.

Los presupuestos son por mes/fondo/categoría. El reporte compara planificado y ejecutado; los egresos sin presupuesto permanecen visibles en movimientos. Un presupuesto no confirma ni autoriza por sí solo un pago. Los fondos destinados se informan por separado; no existe una reasignación automática entre propósitos.

Los compromisos pueden crearse, modificarse y pausarse. Cada vencimiento del mes se genera una sola vez, **siempre pendiente**. Los cambios de plantilla no alteran silenciosamente los movimientos ya generados. Se usan días 1–28 para evitar vencimientos inexistentes. El generador no reconstruye retrospectivamente todos los meses: períodos omitidos deben revisarse y registrarse expresamente.

Un período con pendientes no puede cerrarse. Después del cierre no se permiten movimientos ni cambios de presupuesto. La reapertura queda auditada. La creación de movimientos y el cierre comparten bloqueos transaccionales para evitar que una escritura concurrente atraviese el cierre.

## Automatización

- Si `pg_cron` está habilitado al aplicar la migración, se configura `finance-private-reminders` diariamente a las 14:00 UTC (09:00 Ecuador), para vencimientos y recordatorios opcionales desde el día 20.
- Sin `pg_cron`, los vencimientos se actualizan cuando un gestor abre/actualiza finanzas y los recordatorios cuando el titular consulta avisos. Esto es una alternativa ligada a la visita, no una programación de fondo.
- Los avisos se guardan dentro de la plataforma. Correo, WhatsApp y push no están conectados a este módulo.
- Confirmaciones y cambios de estado generan avisos automáticamente; los recordatorios no se duplican por usuario/mes y no se generan cuando ya hay un aporte pendiente o confirmado del mes.

## Migración de datos anteriores

- Los registros de `donations` se importan una vez con identificador de origen, fecha de Ecuador y estado conservado. El antiguo registro queda como archivo de lectura protegido; las rutas de gestión de donaciones redirigen al centro nuevo para evitar dos libros editables.
- La propiedad histórica solo se conserva cuando existe `user_id`. No se asigna por coincidencia de correo ni por una asociación no verificada. Tesorería puede vincular el titular después de revisar documentación; los registros no vinculados no aparecen en un historial personal.
- El acumulado `members.tithes_sum` se conserva en `finance_legacy_member_totals`, privado, y el campo del CRM queda retirado a cero. **No se convierte en ingresos nuevos**, porque podría duplicar donaciones y no tiene fechas suficientes para un calendario.
- Las pantallas generales del CRM ya no ofrecen registrar, clasificar o evaluar personas por sus diezmos. La sincronización deja de copiar importes financieros al cache del CRM. Antes del despliegue, revisar colas offline antiguas y eliminar copias locales históricas en dispositivos compartidos: no se puede retirar una copia ya descargada solo mediante RLS.
- `donation-proofs` pasa a privado y se sustituyen sus políticas anteriores. Los objetos se conservan. **URLs históricas de Cloudinary/R2 u otros proveedores públicos requieren revisión y migración/revocación en su proveedor**; cambiar el bucket de Supabase no privatiza archivos alojados fuera de él.

## Activación y verificación pendiente

1. Respaldar y revisar datos históricos, comprobantes externos, colas offline y dependencias de clientes antiguos.
2. Aplicar `20261005201809_private_finance_center.sql` usando la ruta de migraciones del proyecto, después de contrastarla con el esquema real.
3. Asignar `tesoreria` únicamente a la persona autorizada y comprobar los perfiles de pastor, secretaría y apoyo.
4. Confirmar bucket privado, límites MIME/tamaño, políticas efectivas y ausencia de permisos generales que expongan el libro. Las restricciones de almacenamiento del módulo protegen incluso frente a políticas antiguas amplias.
5. Verificar lectura/denegación con dos congregantes, apoyo, pastor, secretaría, tesorería y administrador técnico, tanto desde UI como desde API. Probar cierre, comprobantes y reintentos.
6. Si se habilita `pg_cron` después de la migración, instalar explícitamente el trabajo. Revisar `cron.job_run_details` y no asumir que una tarea programada está ejecutándose correctamente.
7. Ejecutar los asesores de seguridad/rendimiento de Supabase y una prueba real de restauración del respaldo antes de publicar.

La migración se aplicó al proyecto vinculado el 8 de octubre de 2026 mediante la API de gestión, junto con su registro de historial en la misma transacción. Se cotejó el esquema, se guardó una copia local de datos y políticas afectados y se ejecutó primero la migración completa con rollback. La prueba remota detectó y corrigió la selección de `tablename` al reemplazar políticas antiguas. Tras aplicar: nueve tablas financieras con RLS, ninguna sin RLS, buckets de comprobantes privados, importación histórica con recuento coincidente y denegación de lectura/gestión para un usuario sin perfil autorizado. `pg_cron` está habilitado. Siguen pendientes la revisión de proveedores externos, pruebas de interfaz con cuentas reales de cada rol y la restauración integral de respaldo. Las 48 comprobaciones de PostgreSQL embebido y 44 pruebas focalizadas pasan.

## Pruebas locales reproducibles

```powershell
npm test -- --run src/features/finance
npm run build
# Motor PostgreSQL embebido; dependencia auxiliar fuera del paquete de producción.
npm install --prefix scratch/finance-tools @electric-sql/pglite
node supabase/tests/finance-security.mjs
```

El script SQL ejecuta la migración completa en PGlite con un esquema de prueba que modela auth/storage y las tablas anteriores. Comprueba las políticas y los triggers reales en PostgreSQL; no sustituye la prueba contra el proyecto Supabase real.

## Próximas capacidades recomendadas

1. **Cuentas y conciliación:** saldos iniciales verificados, cuentas bancarias/caja separadas, arqueos y depósitos de efectivo, conciliación con extractos e importación bancaria con control de duplicados. No conciliar solo por nombre/importe.
2. **Doble aprobación:** separar solicitud, aprobación y pago; umbrales por importe; impedir aprobar gastos propios; responsables y evidencias de autorización.
3. **Remuneraciones:** contratos, periodicidad, anticipos y documentos de respaldo privados. Cálculos laborales/fiscales deberán validarse para la jurisdicción aplicable; el módulo actual registra egresos, no calcula una nómina legal.
4. **Presupuestos anuales y proyectos:** versiones aprobadas, reservas/compromisos, escenarios, flujo proyectado, metas de construcción y misiones, traspasos de fondos mediante movimientos explícitos autorizados.
5. **Comercio:** trasladar ventas netas verificadas al libro con referencia única a la orden, registrando devoluciones y costo de venta para evitar doble contabilidad. Actualmente no se importan automáticamente las ventas de tienda.
6. **Documentación y transparencia:** comprobantes numerados de ingreso/egreso, exportaciones conciliadas y reportes agregados aprobados para la congregación, sin nombres, salarios ni aportes individuales.
7. **Operación segura:** MFA para el equipo financiero, auditoría de asignación de roles, retención y eliminación de evidencias según política, respaldo/restauración, alertas de fallo de automatizaciones y monitorización de acceso.
8. **Mensajería externa:** consentimiento por canal, colas con reintentos y trazabilidad, plantillas neutrales y sin importes en notificaciones de pantalla bloqueada. Nunca realizar campañas sobre meses “faltantes” sin la preferencia expresa del titular.

Referencia técnica: [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security) y [control de acceso a Storage](https://supabase.com/docs/guides/storage/security/access-control).

## Validación al aplicar (8 de octubre de 2026)

El trabajo `finance-private-reminders` está activo a las 14:00 UTC (09:00 Ecuador). TypeScript, Vite, las 188 pruebas unitarias y 48 comprobaciones PostgreSQL pasan. El lint general conserva ocho errores en archivos ajenos a estos cambios. E2E no inició por ausencia de los ejecutables Chromium/Firefox de Playwright. El asesor de seguridad devolvió 55 avisos; ninguno identifica objetos del módulo financiero. No se declara una auditoría global resuelta ni ejecución exitosa del trabajo cron antes de observar su historial.
