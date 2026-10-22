# Tienda — compra segura v2, fase 2

Estado 21-oct-2026: migración remota `20261022001552` aplicada y Edge Function `store-checkout` activa (versión 1). Publicación coordinada del cliente 1.12.0. **Nuevas ventas deshabilitadas** hasta confirmar catálogo, conteo físico y responsables. La publicación técnica no acredita pagos reales ni apertura comercial.

## Funcionamiento

Catálogo → carrito → función HTTP store-checkout → store_api (solo service_role) → transacción PostgreSQL. El servidor comprueba las sesiones mediante auth.getUser; no acepta la identidad ni roles enviados por el comprador. Para invitados físicos usa una capacidad aleatoria de 256 bits, guardada como SHA-256 en la base. Los digitales requieren cuenta con correo verificado y una unidad por línea.

El servidor calcula precio, tarifa por cantidad, ajuste de variante, IVA redondeado por línea y recargo; conserva una copia de los datos comprados. Pedido, líneas y reserva se registran juntos. Cada operación tiene identidad estable: los reintentos no crean otro pedido. Se distingue rechazo transaccional de respuesta incierta; una pérdida de comunicación conserva la identidad para recuperarla.

Reservas de 24 horas sin descontar stock físico. El catálogo muestra stock menos reservas activas/retenidas. Presentar comprobante pasa a revisión y detiene el vencimiento ordinario. Aprobar exige permiso de pedidos, comprobante y referencia bancaria conciliada: consume la reserva y descuenta stock una sola vez. El POS comparte el bloqueo y registra venta, stock y resumen de caja conjuntamente.

Los comprobantes van al contenedor privado store-receipts. Una política restrictiva impide que las políticas amplias heredadas permitan acceso directo. El servidor valida propiedad/permisos, firma de archivo y tamaño real. Genera enlaces de lectura de cinco minutos. Solo un rechazo transaccional explícito permite retirar el archivo nuevo; ante respuesta incierta lo conserva para evitar borrar una prueba ya asociada. Informa si también falla la limpieza. Cada reemplazo conserva trazabilidad.

Los roles de navegador no escriben pedidos ni ítems directamente. Las acciones administrativas pasan por la misma puerta; registrar reembolsos exige además finances/edit, usa identidad estable para reintentos, limita el acumulado al cobro y no ejecuta transferencias. El catálogo público usa store_catalog y la disponibilidad/recargo usa store_checkout_options: proyecciones explícitas sin costos internos ni enlaces maestros de descargas. Se revocan expresamente privilegios heredados de escritura sobre esas vistas.

## Archivos y seguridad

- Migración: supabase/migrations/20261022001552_secure_store_checkout_v2.sql.
- Función HTTP: supabase/functions/store-checkout/index.ts y handler.ts; SDK fijado a 2.107.0.
- Cliente: src/features/store/services/checkoutService.ts.
- Consumidores: catálogo/búsqueda pública, carrito, compras, confirmación, gestión de pedidos y POS.
- No se borran ni reinterpretan datos existentes como conteo físico. El dueño autenticado conserva acceso a su historial anterior.
- Las dos vistas públicas ejecutadas por su propietario son proyecciones intencionales de campos comerciales. No convertirlas en SELECT * sobre tablas internas.
- Tablas operativas en private, RLS y sin acceso de navegador. Funciones nuevas SECURITY INVOKER; solo service_role puede ejecutarlas. La tarea cron ejecuta vencimientos como su propietario.

## Procedimiento de publicación coordinada

1. Verificar esquema remoto, historial de migraciones, respaldo y pedidos existentes. No aplicar otras migraciones locales por asociación.
2. Comprobar helpers de permisos existentes y pg_cron. Aplicar esta migración y verificar ACL, RLS, vistas, contenedor y tarea store-expire-reservations.
3. La migración deja private.store_checkout_settings.enabled=false. Mantenerlo así hasta confirmar catálogo, conteo, precios y responsables.
4. Desplegar store-checkout con secretos de servidor de Supabase. verify_jwt=false se acompaña de comprobación explícita de sesiones y capacidades; no se acepta un JWT sin verificar. No poner service_role en frontend.
5. Publicar el cliente compatible en la misma ventana: el nuevo depende de las vistas/función y el anterior ya no podrá escribir directamente en pedidos. No habilitar ventas con una combinación incompatible.
6. Verificar gateway, Storage y scheduler reales, distintos roles, catálogo público y advisors. Clasificar los avisos, incluyendo las proyecciones intencionales.
7. Habilitar ventas solo después de los controles operativos y la autorización de publicación. La activación comercial es distinta del despliegue técnico.

Ante fallos, mantener checkout deshabilitado y preservar pedidos, archivos y auditoría. No restaurar inserciones públicas ni borrar datos como método de reversión. Una reversión del cliente requiere mantener compra cerrada hasta una versión compatible.

## Verificación reproducible

npm ci instala @electric-sql/pglite 0.5.11 como dependencia de desarrollo, sin incluirlo en el producto.

```powershell
npm run test:store:db
npm test -- --run
npm run lint
npm run build
npx --yes deno check supabase/functions/store-checkout/index.ts
$env:PLAYWRIGHT_PORT='5187'
npx playwright test e2e/store-secure-checkout.spec.ts --project=chromium --reporter=line
```

supabase/tests/store_checkout_fixture.sql es exclusivamente local: nunca aplicarlo a Supabase. Reproduce tablas/roles y una política de Storage amplia para verificar la restricción. Simula la programación cron; se ejecuta la función de vencimiento directamente.

Los recorridos de navegador usan el handler y la migración reales sobre PostgreSQL aislado. El transporte binario de Storage se simula registrando el objeto. No hay compradores, cuentas bancarias ni dinero reales. La prueba de última unidad no sustituye una prueba de carga con múltiples conexiones de producción.

## Próximas fases y límites

- Fase 3: inventario central completo, conteos, movimientos/ajustes, conciliación de variantes y gestión tipo CRM. No se corrigió por conjetura el stock base de la camiseta.
- Fase 4: seguimiento invitado fuera de la pestaña, notificación/enlace verificado, actualización de precios y biblioteca digital. La capacidad actual vive en sessionStorage y caduca en servidor a 30 días; no se imprime en URLs ni registros.
- Fase 5: rechazo/corrección de comprobantes, devoluciones y auditoría visible. Un pago enviado/recibido no se cancela automáticamente sin conciliación.
- Fase 6: múltiples conexiones, Storage/scheduler reales, roles delegados y límites de abuso/carga. Hay 30 solicitudes/minuto compartidas para invitados, por usuario para sesiones, y tres pedidos web pendientes por correo. Esto no acredita una protección completa contra bots ni capacidad de lanzamiento.
- Verificación bancaria automática y pasarelas: sin configurar. La referencia del operador no acredita una consulta bancaria hecha por el asistente.

## Referencias

[Funciones de base de datos y privilegios](https://supabase.com/docs/guides/database/functions) y [acceso a Storage con RLS](https://supabase.com/docs/guides/storage/security/access-control), consultados junto al changelog Supabase el 21-oct-2026.

Continuidad/evidencias: LOCAL/04_Trabajos_y_proyectos/Tienda_funcional/ (excluido de Git; no importado desde producción).
