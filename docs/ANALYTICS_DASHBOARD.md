# Vista administrativa de Análisis

## Fuentes y significado

La vista `/admin/analisis` consulta directamente las tablas administrativas de miembros, donaciones, inventario, respuestas de cuestionarios, peticiones, pedidos, alabanzas y eventos. Las consultas seleccionan únicamente las columnas necesarias y están limitadas a 5.000 registros por fuente en esta versión.

- Las donaciones del resumen financiero incluyen solo registros con estado `completed`.
- Las peticiones por atender son las que todavía no están `respondida`.
- El inventario crítico usa el estado `critico`.
- El perfil analítico de un miembro se considera completo cuando tiene género, fecha de nacimiento y rol de liderazgo.
- Los eventos próximos comprenden los siguientes 30 días y no dependen del filtro histórico del panel.

Si falla cualquier fuente, la página muestra el error y no presenta el resto como si fuera un conjunto completo. Los filtros de 30 y 90 días excluyen registros sin fecha, con fecha inválida o futura. En “Todo el historial”, los registros sin fecha permanecen visibles bajo el grupo “Sin fecha”.

## Informes personalizados

Los informes se configuran mediante fuente, dimensión, cálculo y visualización. La “consulta guiada” usa reglas locales de palabras clave; no realiza inferencias con un modelo de inteligencia artificial. La configuración resultante siempre se muestra antes de guardarla.

Los informes del usuario se conservan en el almacenamiento local del navegador. Restablecerlos reemplaza la configuración local por los ocho informes predeterminados; no elimina datos de Supabase.

## Seguridad y operación

La vista respeta las políticas RLS existentes de cada tabla. No se añadieron tablas, políticas ni funciones de base de datos. Si una política impide leer una fuente, el error queda visible para evitar cifras parciales engañosas.

Para superar 5.000 filas por fuente será necesario mover las agregaciones a consultas o funciones SQL paginadas y protegidas, en vez de aumentar indefinidamente la descarga al navegador.
