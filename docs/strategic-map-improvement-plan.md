# Plan de mejora del Mapa Estratégico

## 1. Visión del producto

Convertir el mapa actual en un centro de decisiones pastorales y territoriales. El resultado debe permitir responder, con pocos clics y sin exponer información sensible:

- ¿Dónde están las personas que necesitan acompañamiento o una célula cercana?
- ¿Qué zonas tienen buena cobertura y cuáles están desatendidas?
- ¿Dónde conviene abrir, fortalecer o fusionar una célula?
- ¿Qué información geográfica está incompleta o desactualizada?
- ¿Qué acciones concretas puede iniciar cada responsable desde el mapa?

El mapa no debe limitarse a mostrar puntos. Cada vista debe concluir en una decisión, una tarea o una lista pastoral utilizable.

## 2. Diagnóstico de la versión actual

### Capacidades valiosas que se conservarán

- Miembros, células, iglesia principal y otras iglesias en un mismo lienzo.
- Mapa de calor, radio de cobertura, agrupación de marcadores y estilos claro/oscuro.
- Búsqueda geográfica, ubicación actual, medición, captura y creación de células.
- Panel de detalle y actualización en tiempo real de miembros y células.

### Problemas que limitan su utilidad

- Las capas, herramientas y gestión compiten visualmente en una barra lateral densa.
- El mapa muestra elementos, pero no resume brechas, cobertura ni prioridades.
- No existe un estado de error útil: una consulta fallida puede dejar una experiencia aparentemente vacía.
- Las consultas solicitan más columnas de las necesarias y varios flujos carecen de tipos estrictos.
- La geocodificación depende de una petición directa sin una estrategia visible de caché, límites o validación.
- El detalle territorial puede exponer datos como documento o teléfono sin un modo pastoral de privacidad.
- El radio fijo de 500 metros no representa igual una zona urbana densa y una zona rural.
- En móvil, la barra fija reduce demasiado el espacio disponible para el mapa.

## 3. Nueva experiencia

### 3.1 Encabezado de situación

Una franja compacta y translúcida sobre el mapa mostrará cuatro indicadores verificables:

1. Miembros ubicados y porcentaje de cobertura de datos.
2. Células activas visibles.
3. Miembros fuera de un radio de cobertura configurable.
4. Registros que necesitan corregir dirección o coordenadas.

Cada indicador funcionará como filtro. Por ejemplo, al pulsar “fuera de cobertura” se verán únicamente esos miembros y las zonas con mayor concentración.

### 3.2 Modos de trabajo

En lugar de obligar a combinar capas manualmente, se ofrecerán vistas preparadas:

- **Pastoral:** miembros, necesidades de seguimiento y células cercanas.
- **Expansión:** densidad, zonas sin cobertura y posibles sectores para una nueva célula.
- **Células:** capacidad, liderazgo, asistencia y área de influencia.
- **Calidad de datos:** coordenadas ausentes, duplicadas, inválidas o antiguas.
- **Emergencia:** responsables, rutas y puntos de encuentro, sujeto a permisos.

Los usuarios podrán guardar vistas personales con filtros, zoom y capas.

### 3.3 Búsqueda y filtros útiles

Una búsqueda única, accesible con teclado, encontrará miembros, células, barrios y sectores. Los filtros se presentarán como chips legibles:

- Estado y tipo de miembro.
- Ministerio, célula y responsable.
- Talentos y habilidades disponibles.
- Rango de edad y necesidades pastorales autorizadas.
- Distancia a una célula o a la iglesia.
- Cobertura, capacidad y estado de la célula.
- Calidad o fecha de actualización de la ubicación.

El usuario siempre verá cuántos resultados quedan y podrá limpiar todos los filtros en una sola acción.

### 3.4 Panel de decisión

Al seleccionar una zona, célula o grupo, un panel lateral en escritorio y una hoja inferior en móvil mostrará:

- Resumen comprensible del sector.
- Miembros cubiertos, fuera de cobertura y con datos incompletos.
- Células cercanas, capacidad estimada y responsables.
- Talentos disponibles en el área.
- Evolución reciente, cuando exista historial real.
- Acciones: crear lista pastoral, asignar seguimiento, proponer célula, corregir ubicación o exportar una lista autorizada.

### 3.5 Recomendaciones transparentes

Las sugerencias de expansión no se presentarán como “inteligencia” opaca. Cada zona candidata explicará su puntuación, por ejemplo:

- 40 % concentración de miembros sin cobertura.
- 25 % distancia a la célula activa más cercana.
- 20 % disponibilidad de posibles líderes.
- 15 % calidad y actualidad de los datos.

Los pesos podrán ajustarse y la interfaz advertirá cuando una recomendación tenga poca información.

## 4. Diseño visual y de interacción

- Mapa a pantalla completa con controles flotantes de vidrio ligero, contraste suficiente y bordes suaves.
- Color reservado para significado: azul para cobertura, verde para capacidad disponible, ámbar para atención y rojo solo para urgencias.
- Agrupaciones que muestren cantidad y composición, no únicamente un número.
- Animaciones cortas al cambiar filtros, respetando “reducir movimiento”.
- Leyenda persistente y comprensible; ningún estado dependerá solo del color.
- Controles táctiles de al menos 44 píxeles, navegación por teclado y foco visible.
- En móvil: mapa completo, barra superior compacta y panel inferior arrastrable.
- Estados de carga, vacío, falta de permisos y error claramente diferenciados.

## 5. Privacidad y seguridad pastoral

- Mostrar ubicaciones aproximadas de miembros por defecto; la precisión exacta requerirá permiso explícito.
- Eliminar documento de identidad del panel cartográfico y ocultar teléfonos salvo que el rol los necesite.
- Separar permisos para ver agregados, ubicaciones aproximadas, ubicaciones exactas y exportar datos.
- Registrar consultas y exportaciones sensibles en auditoría.
- Redondear o agrupar datos en sectores cuando haya muy pocas personas, evitando la reidentificación.
- Aplicar selección explícita de columnas, límites de resultados y políticas de acceso comprobables.
- Procesar y almacenar en caché la geocodificación desde un servicio controlado, con validación, límites y trazabilidad.

## 6. Modelo de información recomendado

Sin alterar la base en la primera fase, se pueden calcular cobertura y calidad desde miembros, células y ubicaciones actuales. Para fases posteriores conviene incorporar:

- Estado, capacidad y radio de servicio configurable por célula.
- Fecha, fuente y precisión estimada de cada geocodificación.
- Sectores pastorales versionados y responsables asignados.
- Historial de cambios de ubicación cuando exista consentimiento.
- Vistas guardadas y anotaciones estratégicas.
- Tareas territoriales vinculadas a una célula, sector o conjunto de miembros.

Toda modificación del esquema deberá incluir migración reversible, índices geoespaciales cuando correspondan y pruebas de políticas de acceso.

## 7. Fases de implementación

### Fase 0 — Confianza y medición (1 semana)

- Consultas explícitas, tipado estricto y validación de coordenadas.
- Estados reales de carga, error, sin permisos y sin información.
- Indicadores de calidad: ubicados, sin ubicar, coordenadas inválidas y última actualización.
- Revisión de privacidad del detalle y de las exportaciones.

**Criterio de salida:** ninguna falla de consulta aparece como un mapa legítimamente vacío y ningún dato sensible se muestra sin permiso.

### Fase 1 — Experiencia moderna (2 semanas)

- Lienzo completo, controles flotantes y panel adaptable.
- Búsqueda unificada, filtros en chips y modos Pastoral/Células/Expansión/Calidad.
- Resumen superior interactivo y leyenda accesible.
- Diseño móvil y navegación por teclado.

**Criterio de salida:** una persona puede localizar un sector, entender su cobertura e iniciar una acción en menos de dos minutos.

### Fase 2 — Cobertura y decisiones (2–3 semanas)

- Radio configurable y cálculo de miembros cubiertos/no cubiertos.
- Comparación de sectores y ranking de brechas.
- Recomendaciones de nuevas células con fórmula visible.
- Filtro territorial de talentos y habilidades.
- Listas pastorales y asignación de seguimiento.

**Criterio de salida:** cada recomendación explica los datos usados y se puede convertir en una tarea o propuesta.

### Fase 3 — Colaboración e historia (2 semanas)

- Vistas guardadas, anotaciones, tareas y auditoría.
- Evolución de cobertura y calidad de datos.
- Exportación segura y reporte imprimible.
- Optimización geoespacial para volúmenes altos.

**Criterio de salida:** el liderazgo puede revisar avances mensuales sin reconstruir manualmente los análisis.

## 8. Indicadores de éxito

- Porcentaje de miembros con ubicación válida y actualizada.
- Tiempo medio para encontrar un sector y generar una acción.
- Miembros fuera de cobertura y variación mensual.
- Porcentaje de células con capacidad, líder y radio definidos.
- Tareas territoriales creadas y completadas.
- Recomendaciones aceptadas, descartadas y motivo.
- Cero accesos o exportaciones sensibles fuera del permiso previsto.
- Tasa de error de geocodificación y correcciones manuales.

## 9. Primera entrega recomendada

La entrega que más valor produce con menor riesgo combina Fase 0 y la parte esencial de Fase 1: confiabilidad de datos, privacidad, resumen territorial, búsqueda única, cuatro modos de trabajo y un panel móvil. Después se activa cobertura y recomendación solo cuando la calidad geográfica tenga un nivel suficiente; así el mapa sorprende por su claridad y utilidad, no por promesas que los datos todavía no pueden sostener.
