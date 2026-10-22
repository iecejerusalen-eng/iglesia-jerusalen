# Tienda — inventario central, fase 3

Estado 21-oct-2026: migración remota `20261022022116` aplicada y `store-checkout` activa en versión 2. Publicación coordinada del cliente 1.13.0. Las existencias se conservaron sin cambios y las ventas siguen deshabilitadas; no se acredita conteo físico ni apertura comercial.

## Uso en Tienda y comercio → Inventario

Cada producto tiene una ficha con ubicación/área, mínimo de reposición (predeterminado configurable: cinco unidades), notas y campos adicionales nombre/valor. Los físicos muestran unidades registradas, reservadas y disponibles por variante; digitales conservan ficha y referencia al recurso configurado, sin simular inventario físico ni licencias limitadas.

Las cantidades heredadas se conservan y comienzan pendientes de conteo. Iniciar conteo captura cada variante y su revisión del historial. Guardar borrador conserva cantidades sin modificar existencias; confirmar requiere todas, incluyendo cero, y confirmación explícita de procedencia física. Registra responsable, fecha y diferencias. Si cambió stock, variantes o revisión del movimiento, rechaza el cierre y exige cancelar/reiniciar. No se permite confirmar por debajo de reservas activas/retenidas: primero se concilian los pedidos. Cancelar conserva el conteo y su motivo.

Entradas/salidas requieren unidades enteras positivas y motivo. Cada cambio conserva cantidad anterior/nueva, actor verificado, motivo y pedido cuando procede. Los reintentos usan la misma operación y huella de contenido. Una respuesta incierta se conserva en sessionStorage separado por usuario; al recargar se recupera mediante «Recuperar operación pendiente» antes de otra escritura. Un rechazo explícito permite corregir. No borrar esa referencia ni cambiar de pestaña para repetir un movimiento de resultado desconocido.

La ficha muestra los últimos 100 movimientos y 20 conteos, conservando el resto en base. Las operaciones privadas conservan actor, fecha, acción y contenido para auditoría, además de la huella. El historial de ventas se registra junto al descuento de stock en la misma transacción. No se rellenan movimientos históricos ni se inventan compras de apertura.

## Integración y seguridad

- Se reutiliza `public.inventory_movements`, tabla comercial previa sin registros al consultar, cerrando sus privilegios heredados de escritura. El inventario patrimonial existente (`inventory_items`, bienes y estado de conservación) permanece independiente; no se duplican sus activos ni se convierten en mercancía.
- `private.store_inventory_profiles`, `store_inventory_counts` y `store_inventory_operations`: RLS y acceso de servidor exclusivamente. `public.store_inventory_api`: SECURITY INVOKER, solo service_role, exige products/view para consultar y products/edit para cambios. Edge verifica sesión real; el actor no procede del cuerpo del cliente.
- Funciones privadas de trigger SECURITY DEFINER con search_path vacío, EXECUTE revocado a navegador, para proteger/auditar escrituras. La comprobación de rol de escritura usa el rol efectivo de PostgreSQL, no metadatos editables de usuario. Las otras funciones nuevas son INVOKER.
- Los productos nuevos y sus variantes empiezan en cero. El editor de catálogo conserva precios/contenido pero no envía cantidades del formulario; los campos de stock son de lectura. Las variantes existentes se actualizan expresamente, evitando que un upsert aplique el stock cero predeterminado sobre una variante existente.
- Los triggers rechazan cambios directos de stock desde navegador, cantidades negativas y eliminación de variantes con stock/historial. El producto con stock/historial no cambia de físico a digital. Agregar/eliminar variantes invalida la marca de conteo vigente, conservando los conteos históricos.
- Las variantes son la fuente de stock para productos con combinaciones. Sus movimientos sincronizan el agregado base sin duplicar entradas de historial; un conteo completo concilia diferencias heredadas. El stock legado no se reescribe al instalar.
- Movimientos/conteos y checkout/POS comparten el bloqueo transaccional de fase 2. La comprobación de reserva considera held y active sin vencer. No se ejecutan llamadas externas mientras se mantiene el bloqueo.

## Procedimiento de publicación coordinada

1. Revisar respaldo, esquema real de `inventory_movements`/perfiles, políticas/ACL y migraciones remotas. No aplicar fixtures de pruebas. No publicar otras modificaciones locales por asociación.
2. Aplicar únicamente `20261022022116_store_inventory_control.sql` después de `20261022001552`. No activa ventas ni certifica stock heredado.
3. Desplegar la actualización de `store-checkout` (index.ts + handler.ts), que añade las acciones inventory_* autenticadas y enruta a store_inventory_api.
4. Publicar cliente compatible. El editor anterior puede recibir rechazo al enviar stock desactualizado; no retirar la protección para tolerarlo. Verificar recarga de PWA/clientes abiertos.
5. Comprobar roles delegados, fichas, movimientos y conteo controlado autorizado en entorno real. Revisar advisors: funciones privadas de trigger con privilegios de propietario y tablas privadas sin políticas son intencionales; no añadir acceso público para silenciar avisos.
6. Registrar conteo físico real, responsables, catálogo/precios y cierre operativo antes de habilitar ventas. No activar automáticamente al tener una fecha de conteo.

Ante un fallo preservar cantidades, historial y checkout cerrado. No restaurar escritura pública ni borrar movimientos para revertir.

## Verificación

`npm run test:store:inventory` ejecuta la migración sobre PostgreSQL PGlite aislado. `npm run test:store:db` conserva las pruebas de fase 2. `e2e/store-inventory.spec.ts` monta el componente real y prueba navegador → handler → base aislada a 390/1280 px, borrador recuperado, confirmación y entrada. La autenticación es una fixture declarada y el presupuesto HTTP se simula; no se conectan usuarios, comprobantes ni stock de producción. No sustituye prueba simultánea de múltiples conexiones ni control físico humano. Lint, unitarias, compilación, deno y E2E se registran con sus resultados y límites en LOCAL/04_Trabajos_y_proyectos/Tienda_funcional/Control/Fase_3/.

Referencias consultadas el 21-oct-2026: [funciones y privilegios](https://supabase.com/docs/guides/database/functions), [historial Supabase](https://supabase.com/changelog). El cambio anunciado de cifrados TLS para noviembre no requiere cambiar las firmas de estas funciones; no se configuró TLS del servicio.
