# Tienda: seguimiento y biblioteca — fase 4

Versión 1.14.1, publicación coordinada del 21-oct-2026. Migraciones 20261022030818 y 20261022031805, con store-checkout v3 instaladas. Ventas deshabilitadas. No se enviaron correos, verificaron depósitos ni crearon compras reales.

La comprobación en producción detectó que `service_role` no puede leer `auth.users` por defecto. La corrección concede SELECT solo de `id`, `email` y `email_confirmed_at` al servidor y cambia la consulta del portal a la columna necesaria; no concede SELECT global ni lectura de contraseñas/sesiones, ni privilegios de Auth al navegador. Se mantienen las funciones INVOKER. El fixture reproduce ese permiso limitado y verifica compra digital y biblioteca bajo el rol real del servicio.

## Experiencia del comprador

- La reserva invitada permite guardar un archivo con una clave privada `JER1.<pedido>.<secreto>`. El número de pedido solo no da acceso. La clave se introduce en `/mis-compras`, permite consultar y adjuntar el comprobante desde otra pestaña/dispositivo y vence a los 30 días de la reserva. No extiende las 24 horas para presentar el comprobante.
- La clave va en el cuerpo de la solicitud, nunca en la dirección de seguimiento. Solo se conserva en `sessionStorage` después de validar el acceso; el usuario puede quitarla. No hay recuperación automática ni envío por correo: quien pierde su copia debe contactar con la iglesia para verificar su caso.
- Una cuenta verificada puede vincular una compra invitada usando la clave y el mismo correo de compra, normalizado en el servidor. La operación es atómica e idempotente; invalida el acceso invitado y registra al responsable. Conocer el correo o el número solo no permite apropiarse del pedido.
- Mis compras muestra historial, estados legibles, plazo, total confirmado, comprobante privado y biblioteca. Las consultas fallidas muestran su error y no se convierten en historiales vacíos.
- La ficha pública se abre con `/tienda?producto=<id>`, conserva el enlace al recargar, permite copiarlo y contempla productos retirados. Se mantiene el diálogo y la identidad visual existentes.

## Entregas digitales

La compra digital exige cuenta verificada, como en fase 2. Al confirmar un pago, `private.store_digital_deliveries` conserva por línea el recurso y sus instrucciones; cambiar el catálogo después no cambia lo entregado. La migración contempla compras pagadas anteriores mediante una captura de la fuente vigente al migrar, sin afirmar que esa era la fuente histórica. La producción inspeccionada tiene cero pedidos.

La biblioteca devuelve metadatos y estado, sin enlaces maestros. Cada apertura pasa por `store-checkout`: se comprueban identidad, propiedad, pago confirmado, estado admisible y ausencia de reembolso registrado; se audita la apertura. Una cancelación o cualquier reembolso bloquea nuevas aperturas hasta conciliación. Las fuentes inválidas o ausentes aparecen en preparación, sin inventar un archivo.

La entrega actual admite exclusivamente HTTPS en `drive.google.com` o `docs.google.com`. **Son enlaces externos persistentes, no enlaces firmados ni descargas privadas revocables.** Una vez conocido, el enlace externo puede seguir siendo utilizable según los permisos de Google; el portal no evita su copia ni vuelve privados archivos públicos. El texto de la interfaz explica este límite. El equipo debe confirmar el archivo, destinatarios y permisos reales antes de venderlo. Una entrega privada con vencimiento y almacenamiento propio requiere otra integración; no se declara implementada aquí.

Los compradores dejan de leer directamente `product_digital_assets`. Políticas restrictivas limitan esa tabla a edición autorizada y bloquean al anónimo aun con un permiso heredado amplio. Las tablas de entregas/eventos son privadas, con RLS y sin permisos de navegador. El RPC es SECURITY INVOKER y solo ejecutable por servidor. El trigger de concesión usa SECURITY DEFINER con ruta vacía y sin ejecución de navegador. Ningún identificador de actor enviado por el cliente sustituye la sesión comprobada.

## Verificación

```powershell
npm run test:store:db
npm run test:store:inventory
npm run test:store:customer
npx vitest run src/features/store
npm run lint
npm run build
npx --yes deno check supabase/functions/store-checkout/index.ts
npx playwright test e2e/store-customer.spec.ts e2e/store-secure-checkout.spec.ts e2e/store-inventory.spec.ts e2e/store-checkout.spec.ts --project=chromium --workers=1 --reporter=line
```

Los fixtures de `supabase/tests/` y `e2e/fixtures/` son exclusivamente de pruebas. Los recorridos nuevos montan componentes reales, handler real y migraciones sobre PostgreSQL aislado; identidad de cuentas, catálogo y pagos son sintéticos. Comprueban guardado de clave, consulta, recarga, vinculación, fuente digital estable, reembolso, enlace compartible, cierre por teclado y ausencia de desbordamiento a 390/1280 px, con capturas claro/oscuro. No sustituyen una compra piloto ni una prueba de carga o de Google real.

## Procedimiento de publicación coordinada

1. Revisar el esquema remoto y las compras desde la última inspección. Conservar respaldo y ventas cerradas.
2. Aplicar `20261022030818_store_customer_portal.sql` y su corrección `20261022031805_store_customer_identity_columns.sql` sobre las fases 2 y 3 ya instaladas; no arrastrar migraciones de otros trabajos.
3. Desplegar `store-checkout` con `index.ts` y `handler.ts` de esta fase y comprobar las tres acciones `customer_*`, rechazos y permisos.
4. Publicar el cliente compatible en la misma ventana. La restricción de fuentes maestras hace incompatible la lectura digital del cliente anterior; la reversión debe conservar el bloqueo de venta y el acceso por servidor, sin restaurar lectura pública.
5. Verificar el dominio público, sesión real, historial y recurso de prueba autorizado. Actualizar CHANGELOG y su registro en Supabase al preparar el commit de publicación.

Fases siguientes: operación administrativa y trazabilidad visible; validación integral de roles, carga y dispositivos; catálogo/precios, conteo físico, responsables, retiro y compra piloto autorizados antes de abrir ventas. La pasarela y la conciliación bancaria automática siguen pendientes.
