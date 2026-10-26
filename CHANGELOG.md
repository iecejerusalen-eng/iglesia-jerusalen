## [1.14.35] - 2026-10-25

### Corregido
- La tarjeta temporal del aniversario ahora comienza debajo del menú fijo en la portada, también en móvil.

## [1.14.34] - 2026-10-25

### Seguridad
- Se restringen por defecto los privilegios de tablas, secuencias y funciones nuevas en `public`, incluidos los permisos heredados de `PUBLIC` para funciones.
- Se actualiza MapLibre para corregir una vulnerabilidad XSS reportada en versiones anteriores y se adapta la configuración del mapa.
- La auditoría de dependencias queda sin vulnerabilidades conocidas en `npm audit` (producción y árbol completo).

### Mejoras
- Los controles del carrusel de testimonios cumplen un área táctil mínima de 44 px, incluyen nombres accesibles y respetan movimiento reducido.
- La prueba de cierre del panel «Hoy» usa un evento aislado para mantener el flujo reproducible sin datos de producción.

### Corregido
- Se limpian dos incidencias de lint de la función `church-assistant`.

## [1.14.33] - 2026-10-25

### Corregido
- Se restaura la estructura de la agenda «Hoy»: vuelve a compilar y se puede cerrar con la X, al tocar fuera o con Escape.

### Rendimiento
- La PWA deja fuera del precache los módulos 3D y de estudio bíblico, y descarga y guarda estos recursos cuando se abren. El precache pasa a 4,5 MiB; los archivos grandes, como el PDF de estatutos, siguen disponibles bajo demanda.

## [1.14.32] - 2026-10-25

### Corregido
- El panel de agenda «Hoy» mantiene visible su botón de cierre en móvil, conserva el acceso desde el control lateral y se ajusta al ancho disponible.

## [1.14.31] - 2026-10-25

### Corregido
- El aviso del 65.º aniversario vuelve a mostrarse en Inicio hasta las 23:59 del 25 de octubre, hora de Ecuador; después se oculta y la página especial queda como archivo.
- La agenda «Hoy» y el asistente de la iglesia se pueden cerrar con su botón, al tocar fuera o con Escape.
- La agenda «Hoy» permanece accesible en móvil; su panel se ajusta al ancho y alto disponibles sin invadir la navegación inferior.

## [1.14.30] - 2026-10-25

### Eliminado
- Se retiró de Inicio la tarjeta temporal del 65.º aniversario para dejar despejada la navegación; la página `/aniversario-65` permanece disponible como archivo.

## [1.14.29] - 2026-10-24

### Mejorado
- El acceso a Google queda destacado al inicio de la pantalla de ingreso y es más fácil de pulsar desde móviles.
- La barra superior móvil ofrece un botón claro para ingresar y muestra la foto de Google cuando la cuenta tiene una sesión activa.
- El acceso al panel administrativo se mantiene visible en la navegación móvil para cuentas autorizadas y conserva sus permisos.

## [1.14.28] - 2026-10-24

### Mejorado
- En móvil, la barra superior se oculta al desplazarse hacia abajo y vuelve al subir; el botón de ayuda es más compacto y deja espacio libre sobre la navegación inferior.
- El pie de página se simplifica al ocultar «Explorar» y reducir sus espacios; la sección doctrinal presenta encabezado y tarjetas más compactos.
- Se añade una página de archivo para el 65.º aniversario y un aviso en Inicio que se oculta al terminar el 25 de octubre, hora de Ecuador.
- Inicio ofrece accesos directos a horarios, dirección y planificación de visita; la bienvenida 3D deja de bloquear la portada.

### Corregido
- Los eventos sin hora de finalización se agregan a Google Calendar como eventos de día completo, con la hora de inicio visible en los detalles.
## [1.14.27] - 2026-10-24

### Seguridad y administración
- El acceso a perfiles, permisos, relaciones del CRM y agenda pública queda restringido según permisos efectivos; la proyección pública omite notas y vínculos privados.
- Se retiraron políticas heredadas del censo que concedían acceso por rol y se sustituyeron por permisos efectivos de consulta y edición.

### Mejorado
- Tienda, Aula Virtual, onboarding y toolbox pueden habilitarse desde Configuración cuando estén listos para publicarse.
- La navegación y las rutas respetan los permisos del usuario y la visibilidad configurada; el calendario permite mover eventos conservando sus horarios.
## [1.14.26] - 2026-10-24

### Mejorado
- El Atlas de Génesis 2 incorpora un mapa conceptual 3D con rótulos para Tigris y Éufrates, una región posible del Edén y una nota visible sobre la identificación debatida de Pisón y Guijón.

Warning: truncated output (original token count: 12408)
Total output lines: 612

## [1.14.25] - 2026-10-24

### Mejorado
- El asistente orienta sobre culto en línea, comunidad, participación, donaciones y diezmos con enlaces a las rutas públicas vigentes; aclara el inicio de sesión cuando una acción lo requiere.
- Las preguntas institucionales reconocen más variantes sobre ubicación, visión, misión, símbolos, himno y liderazgo, y derivan al contacto cuando no hay información pública suficiente.
- Las respuestas de agenda consideran actividades vigentes y futuras, mientras que las solicitudes de apoyo emocional ofrecen una respuesta empática y recursos de ayuda verificados en Ecuador.
- Se amplían las sugerencias iniciales y los accesos rápidos, manteniendo el chat sin historial persistente.
- La biblioteca de alabanzas permite localizar canciones publicadas por título, artista o letra.

# Changelog

Todas las novedades y cambios notables de este proyecto están documentados en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).
## [1.14.24] - 2026-10-24

### Mejorado
- Génesis 2 y 3 comparten una plantilla de estudio con movimientos, observaciones, preguntas, escenas ilustradas y accesos al Atlas, la Enciclopedia y la Cronología.
- Cada estudio distingue el texto bíblico, las conexiones canónicas y el contexto complementario, con fuentes y alcance editorial visibles.

## [1.14.23] - 2026-10-24

### Mejorado
- Se elimina el confeti de los saludos de cumpleaños y del acceso al panel; el onboarding queda oculto temporalmente para rediseñarlo más adelante.
- Tienda, carrito y Aula Virtual quedan ocultos en producción mientras continúan disponibles para vista previa local y administración.
- El perfil seleccionado del directorio de miembros se muestra en una capa visible sobre el panel.

## [1.14.22] - 2026-10-24

### Mejorado
- Génesis 2 ahora comparte con Génesis 3 una estructura de cuatro movimientos con referencias directas por pasaje.
- Se actualiza el rótulo del estudio de Génesis 2 y se corrige el aviso obsoleto que aún anunciaba su desarrollo como trabajo futuro.
- El flujo editorial documenta fuentes y alcance afirmación por afirmación para Génesis 2 y 3, incluida la procedencia verificable de sus imágenes y recursos externos.
- El asistente contesta preguntas sobre pastores, visión, misión, identidad Cuadrangular, símbolos, himno y ubicación con información institucional publicada.
- Las expresiones de tristeza reciben una respuesta empática; los mensajes de desesperanza o posible autolesión activan una orientación de seguridad y recursos de apoyo en Ecuador.
- Las respuestas de emergencia admiten repreguntas breves para continuar el acompañamiento inmediato y dirigir a una persona de confianza.

## [1.14.21] - 2026-10-24

### Mejorado
- El asistente responde con el resumen doctrinal publicado de la Iglesia Cuadrangular y enlaza los principios de fe; se añade esta consulta a las preguntas sugeridas y al contexto del servidor Gemini.
- La portada del chat prioriza cuatro preguntas frecuentes y despliega las demás bajo demanda para reducir el desplazamiento inicial en móvil.
- Las respuestas de agenda incluyen descripción y lugar publicados, enlazan directamente al evento y consideran actividades de varios días que siguen vigentes.
- Las repreguntas breves de día conservan el contexto de eventos u horarios; «¿Y mañana?» y «¿Y el domingo?» consultan el tipo de información que se venía hablando.
## [1.14.20] - 2026-10-24

### Añadido
- Estudio de Génesis 3 con cuatro movimientos, observaciones, lecturas relacionadas, Atlas narrativo, Enciclopedia y Cronología conectados al lector bíblico.
- Dos ilustraciones originales optimizadas y dos enlaces a videos oficiales de Proyecto Biblia.
- Guía de procedencia y flujo de investigación reutilizable para ampliar el catálogo por capítulos.

### Mejorado
- Las fichas de Génesis amplían sus referencias a Edén y la serpiente, separan el texto de interpretaciones canónicas posteriores y no asignan fechas ni coordenadas no sustentadas.

## [1.14.19] - 2026-10-24

### Mejorado
- El asistente público guía a las personas hacia podcast, alabanzas, programas, cursos y Aula Virtual mediante respuestas y accesos directos.
- Las preguntas frecuentes se muestran en una cuadrícula móvil visible; al abrir el chat se conserva el saludo en pantalla y aparecen accesos a Reservas y Tienda.
- Se afinó la detección de preguntas de ubicación para evitar confundirlas con consultas sobre podcast u otros recursos.
- Gemini recibe rutas oficiales y descripciones públicas de ministerios depuradas; el modo guiado continúa disponible si la IA no está configurada.
- El asistente consulta espacios públicos para reservas y orienta sobre el catálogo de la tienda y el muro de la comunidad, sin exponer reservas personales ni prometer disponibilidad.
- Las consultas sobre programas y episodios recientes muestran elementos publicados con su resumen, duración y acceso a la ficha correspondiente.

## [1.14.18] - 2026-10-24

### Mejorado
- La Enciclopedia de Génesis 1–2 agrupa personas, lugares y acontecimientos, con contexto desplegable, referencias y preguntas para conversar.
- La Cronología de Génesis 2 presenta la secuencia literaria del capítulo sin atribuirle fechas de calendario ni confundirla con el cierre de Génesis 1.

## [1.14.17] - 2026-10-24

### Añadido
- Estudio inicial de Génesis 2, conectado con las pestañas del capítulo y el lector bíblico compartido.
- Mapa esquemático del Edén y los cuatro ríos, con las identificaciones debatidas señaladas y sin fijar una ubicación moderna.
- Contexto sobre diversidad de especies con enlaces al estudio de 2011 y su revisión posterior.

### Mejorado
- Introducción de Génesis y guía de lectura del Pentateuco con un panorama breve de sus cinco libros.

## [1.14.16] - 2026-10-24

### Mejorado
- El Atlas de Génesis 1 incorpora un mapa geográfico contextual de los relatos patriarcales, separado con claridad de la secuencia narrativa y sin atribuir una ubicación comprobada al Edén.
- La ruta del mapa contextual abre el Atlas interactivo en el mapa de los patriarcas.
- El estudio de Génesis 1 presenta cinco videos oficiales de Proyecto Biblia con resumen, tema y duración, enlazados a su sitio de origen.
- La política de seguridad permite reproducir los videos de Mux ya usados por el sitio.

## [1.14.15] - 2026-10-24

### Mejorado
- La pestaña Biblia queda dedicada al lector compartido; el estudio de Génesis 1 vive en una pestaña propia.
- El Atlas narrativo de Génesis 1 presenta seis ilustraciones digitales específicas, escenas seleccionables, secuencia accesible y acceso al pasaje exacto de cada día.
- La guía de Génesis 1 incluye un enlace adicional a un video oficial de Proyecto Biblia; los medios siguen en su sitio de origen.

## [1.14.14] - 2026-10-24

### Añadido
- Asistente público para consultar horarios, ubicación, visitas, contacto, eventos y ministerios desde las páginas del sitio.
- Las preguntas abiertas pueden usar Gemini con horarios y eventos públicos; las consultas tienen un límite de uso y el chat no conserva el historial.

## [1.14.13] - 2026-10-24

### Corregido
- Se amplía el límite de precarga del service worker para incluir la hoja de estilos principal y permitir que la compilación de producción termine.

## [1.14.12] - 2026-10-24

### Añadido
- Catálogo de los 66 libros bíblicos, agrupados en 12 secciones, con búsqueda, contexto de cada sección, introducción a Génesis e índice de capítulos.
- Génesis 1 como estudio piloto con el lector bíblico compartido y pestañas contextuales de Biblia, Atlas, Enciclopedia y Cronología.
- Ilustraciones originales del jardín del Edén y de Adán nombrando animales, con referencias, texto alternativo y notas que las identifican como arte interpretativo.

### Mejorado
- Los capítulos se pueden abrir mediante enlaces directos y mantener su selección al recargar; las herramientas se adaptan a pantallas móviles.
- «Antes de leer» reúne la introducción del libro y el contexto de su sección.

## [1.14.11] - 2026-10-24

### Corregido
- La bienvenida del Código de las Parábolas ya no recorta el botón para entrar en móviles; la escena se ajusta al ancho disponible.
- La zona táctil de la escoba cubre su figura completa para que se pueda activar al tocar el objeto.

## [1.14.10] - 2026-10-23

### Añadido
- «El Código de las Parábolas», episodio piloto interactivo sobre la moneda perdida, con entrada desde el catálogo de juegos y ruta pública directa.

### Mejorado
- Descubrimiento de objetos mediante zonas de toque discretas y clicables, adaptadas a teclado, móvil y movimiento reducido.
- Barrido de escoba con inclinación, rebote y polvo; la moneda aparece con giro y resorte, y la lámpara parpadea suavemente.

## [1.14.9] - 2026-10-23

### Añadido
- Nuevo espacio de estudio bíblico con Atlas, Enciclopedia de lugares y Cronología conectados con el lector de `/recursos/biblia`.
- Recorrido exploratorio del Éxodo y Canaán con 14 escenas, mapa móvil accesible, referencias y preguntas de observación; el trazado se identifica como tradicional y señala lugares discutidos.
- Atlas de los viajes de Pablo con diez escalas enlazadas a Hechos 27–28 y fichas de lugares con referencias bíblicas.
- Panel de fuentes y permisos que distingue recursos en uso, referencias doctrinales, candidatas y materiales de uso condicionado.

### Accesibilidad y contenido
- Se conservan las atribuciones y licencias de las fuentes, y se aclara que el acceso gratuito no concede permiso para reutilizar contenido.
- El contenido bíblico enlaza al lector compartido en lugar de duplicar versiones; los mapas se presentan como recursos de estudio, no como reconstrucciones históricas definitivas.

### Corregido
- Se elimina del lanzamiento la ruta del juego piloto de parábolas que aún no está incluido entre los archivos publicados, evitando que interrumpa la compilación de producción.

## [1.14.8] - 2026-10-23

### Mejorado
- La sección de cifras del Inicio estrena «Cada vida cuenta», con composición editorial, iconos, tonos azul noche y dorado e invitación a conocer la iglesia.
- Los contadores aparecen de forma escalonada y una luz suave sigue el cursor; la sección se adapta a móvil, modo oscuro, teclado y movimiento reducido.

### Corregido- Los totales se muestran sin signo de incremento y las cifras por edad usan las etiquetas «Niños en comunidad» y «Jóvenes en comunidad».

## [1.14.7] - 2026-10-22

### Mejorado
- El giro 3D conserva el ángulo elegido, se desacelera con una inercia breve y reanuda suavemente la rotación automática desde esa posición.
- El encuadre permanece estable durante el giro; se elimina el efecto de «respiración» de la cámara.
- La bienvenida permite acercar y alejar con botones, rueda o pellizco, pausar el giro, volver a la vista frontal y explorar con el teclado; los controles se adaptan al móvil.

## [1.14.6] - 2026-10-22

### Mejorado
- La retícula del suelo avanza hacia el fondo en un bucle continuo durante la bienvenida 3D.
- Tres nubes se desplazan lentamente por el cielo a velocidades distintas, sin tapar la fachada; la animación se detiene al entrar y respeta la preferencia de movimiento reducido.

## [1.14.5] - 2026-10-22

### Mejorado
- La bienvenida 3D muestra la fachada de frente durante la apertura y gira después de forma gradual para facilitar su lectura.
- El encuadre se adapta al ángulo y al ancho de pantalla, con mayor presencia de la iglesia en móvil y una sombra suave de apoyo.

## [1.14.4] - 2026-10-22

### Corregido
- El ventanal central y otros paños de vidrio de la bienvenida 3D recuperan sus acabados visibles; se eliminó la transparencia total heredada de la importación.
- La luz de la escena conserva el color crema de la fachada y mejora el contraste con los ventanales azules.

## [1.14.3] - 2026-10-22

### Mejorado
- Se actualizó la identidad visual del sitio con el nuevo emblema de Iglesia Jerusalén en navegación, pie, administración, certificados, presentación y favicon.
- El pie de página usa el logo horizontal con «Posesión de Paz»; las secciones institucionales usan la variante sin lema.
- Se corrigió el tamaño y el contraste del logo del pie para que el emblema y el lema se vean completos.
- El catálogo administrativo identifica las tres variantes vigentes y conserva las anteriores como referencia.
- Se incorporaron los recursos SVG y PNG a la biblioteca de medios con su fuente, crédito y derechos registrados.

## [1.14.2] - 2026-10-21

### Mejorado
- La bienvenida 3D presenta el modelo integral más reciente de la iglesia, exportado desde el archivo maestro de Blender y comprimido para reducir la descarga inicial.
- Se ajustó la iluminación de la escena para conservar mejor el contraste de fachada, ventanas y molduras.

## [1.14.1] - 2026-10-21

### Corregido
- La verificación de correo en compras y biblioteca usa permisos de servidor limitados a identidad y confirmación. No concede lectura completa de usuarios ni acceso desde el navegador. La regresión reproduce los permisos reales de producción.

## [1.14.0] - 2026-10-21

### Añadido
- Seguimiento de invitados con clave privada guardable y vinculación a una cuenta con el mismo correo verificado.
- Mis compras reúne historial, comprobantes privados y biblioteca digital con acceso comprobado por compra.
- Enlaces compartibles de productos que conservan su ficha al recargar.

### Seguridad y operación
- Entrega digital por línea de pedido, fuente e instrucciones conservadas, auditoría de apertura y bloqueo ante cancelación o reembolso. Enlaces maestros restringidos al personal autorizado.
- Los recursos actuales se abren en Google Drive/Docs con enlaces externos persistentes. Sin correo automático ni verificación bancaria automática; ventas deshabilitadas hasta completar la preparación operativa.

## [1.13.0] - 2026-10-21

### Añadido
- Inventario central integrado en Tienda y comercio: fichas, ubicación, notas, campos adicionales, mínimos y disponibilidad por variante.
- Conteos físicos con borrador, confirmación, control de conflictos y trazabilidad; entradas/salidas con motivo, responsable y recuperación segura de reintentos.

### Seguridad
- Existencias protegidas frente a sobrescrituras del editor; movimientos de checkout y POS auditados en la misma transacción. Nuevos productos en cero, variantes conciliadas y stock heredado pendiente de conteo real. Migración y función instaladas; ventas deshabilitadas hasta completar la preparación operativa.

## [1.12.0] - 2026-10-21

### Seguridad y operación
- Checkout transaccional con cálculo de importes en servidor, reservas de 24 horas e identidad estable para reintentos.
- Comprobantes privados con lectura temporal autorizada, catálogo público sin costos internos ni enlaces maestros y acciones administrativas verificadas en servidor.
- Carrito, compras y POS adaptados al flujo seguro. Migración y función instaladas; nuevas ventas deshabilitadas hasta confirmar catálogo y conteo físico.

## [1.11.3] - 2026-10-21

### Mejorado
- Identidad dorada adaptable a modo claro y oscuro en encabezados, agenda, horarios, prédicas y perfiles de Nosotros.
- Tarjetas de eventos y horarios con fechas, etiquetas y acentos dorados coherentes con el logo.
- Referencias y lecturas bíblicas sin subrayado, con foco visible y acceso al pasaje en una pestaña nueva.
- Versículo del día, navegación de ruta y documentos institucionales con acentos editoriales coordinados.

## [1.11.2] - 2026-10-21

### Mejorado
- Encabezado móvil alineado al borde superior, sin la franja vacía antes de la navegación.
- Acceso «Buscar» integrado visualmente con los demás iconos de la barra inferior.
- Ámbitos de la historia con contenido desplegable en una sola vista a la vez.

### Seguridad
- La toolbox requiere una sesión iniciada y conserva el filtrado de herramientas según los roles autorizados; cierra las herramientas activas al cerrar sesión.

## [1.11.1] - 2026-10-21

### Seguridad
- La verificación pública de certificados conserva sus consultas mediante funciones acotadas y ya no permite leer directamente las tablas de certificados con acceso anónimo.

## [1.11.0] - 2026-10-20

### Añadido- Acceso directo desde Nosotros a la planificación de visitas y a los horarios vigentes; los horarios se obtienen de la agenda.
- Bandeja de trabajo con seguimientos y tareas del día, y calendario editorial con borradores, revisiones, programación y publicaciones.

### Mejorado
- Presentación del liderazgo con perfiles, textos alternativos, imágenes adaptables y acciones de contacto y oración; documentos institucionales con opciones claras para leer o descargar.
- Biblioteca de medios con filtros de procedencia y selector reutilizable en los editores de contenido, juegos y presentaciones.
- Panel de salud del sitio con fecha y fuente de las revisiones, y accesos a la administración de permisos.

## [1.10.1] - 2026-10-19

### Mejorado
- Hero y perfiles de liderazgo de Nosotros con tres retratos editoriales coordinados, adaptables y optimizados para web.

## [1.10.0] - 2026-10-20

### Añadido
- Galerías de fotos por departamento y ministerio, con administración para líderes autorizados y visualización en sus páginas y en la comunidad.
- Ilustraciones editoriales para personajes bíblicos y nuevos recursos visuales volumétricos para la sección de visión y misión.
- Información ampliada de los libros bíblicos, con autoría, contexto histórico, temas y línea temporal aproximada.

### Mejorado
- Biblioteca de la enciclopedia bíblica adaptable a pantallas pequeñas, con imágenes completas y fichas más informativas de personajes y lugares.
- Portada, páginas de identidad y visita, galería, tarjetas de prédicas y fondo de Alabanzas con ajustes de presentación, imágenes y navegación.
- Controles de programas públicos para separar la lectura publicada de las comprobaciones privadas de administración.
- Experiencia de los juegos bíblicos y sus controles de teclado.

## [1.9.0] - 2026-10-19

### Añadido
- Memorama Bíblico con 4, 6 u 8 parejas, modo individual o por turnos para 2–4 personas, imágenes dobles, explicación, referencia y pregunta de repaso al encontrar una pareja.
- Nuevas asociaciones ilustradas de objetos y relatos bíblicos, junto con más personajes, preguntas y opciones para renovar las partidas.
- Lectura emergente reutilizable de referencias bíblicas, con acceso directo al pasaje en una nueva pestaña.
- Teclas A–D e Intro en Biblionario, Mayús + Intro para avanzar en los cuatro juegos y escritura de letras con teclado en Adivina la palabra.
- Retratos de personajes al revelar respuestas, nuevas portadas y herramientas de administración para completar, previsualizar y publicar contenido de Memorama.

### Mejorado
- Catálogo unificado y responsive de cuatro juegos; el antiguo Ahorcado ahora se presenta como «Adivina la palabra» sin romper su dirección anterior.
- Respuesta inmediata y accesible al confirmar preguntas de Biblionario, con estados claros de acierto y error.
- Orden aleatorio de preguntas, palabras, personajes y parejas que reduce repeticiones consecutivas.

## [1.8.2] - 2026-10-16

### Corregido
- Modelo 3D del templo reconstruido con geometría propia, sin pegar una imagen de fachada ni duplicar el cerramiento. Incluye el cuerpo central proyectado, un solo portón frontal y corredores laterales; el menú y la experiencia de entrada se conservan.

## [1.8.1] - 2026-10-16

### Mejorado
- Bienvenida minimalista con la iglesia completa, giro automático de 360°, arrastre libre y un único botón «Entrar».
- Transición que contrae la escena a un objeto lateral y revela el Inicio existente; el scroll mueve el modelo según dirección y velocidad.
- Encuadre adaptable y círculo lateral más discreto en móvil, con repetición, Escape y alternativas sin animación o WebGL.

## [1.8.0] - 2026-10-16

### Añadido
- Bienvenida 3D opcional en Inicio: templo visual inspirado en la fachada de Jerusalén, descenso y giro con scroll, acercamiento al entrar y acceso al Inicio existente.
- Atajos para saltar y repetir la bienvenida, con alternativa estática para movimiento reducido o falta de WebGL.

### Mejorado
- Carga diferida del motor 3D para que las visitas posteriores mantengan ligero el Inicio habitual.

## [1.7.0] - 2026-10-13

### Añadido
- Inicio con pendientes por permiso, revisiones y solicitudes propias; seguimiento de visitas con responsable, etapa, recordatorio interno y auditoría.
- Recuperación automática temporal de páginas/lecturas, comparación e historial de secciones, conflictos y avisos al salir, incluido Atrás/Adelante.
- Medios con créditos, derechos, fuente, texto alternativo, detección SHA-256 de duplicados y optimización opcional a WebP.
- Salud manual del sitio en Contenido: HTTPS/referencias internas, anuncios vencidos, errores de renderizado locales y revisión de seguridad fechada.

### Seguridad
- Vista store_orders respeta RLS; cinco funciones fijan search_path; triggers sin exposición RPC.
- CRM, registros de automatización, páginas, catálogo y almacenamiento respetan permisos; restricciones individuales prevalecen sobre permisos heredados.
- Registro con mínimo 12 caracteres y comprobación de filtraciones mediante prefijo de huella. Protección nativa de Auth pendiente de sesión del dashboard; no se declara activada.

### Mejorado
- Accesos móviles a comunicaciones/contenido, etapas sin arrastrar, notas opcionales plegables, controles táctiles y fechas locales de anuncios.
- Guardar/reordenar no sobrescribe versiones ajenas; retirar un recurso del catálogo conserva su original y sus enlaces.

## [1.6.1] - 2026-10-12

### Corregido
- Retirada la reseña educativa y su referencia a UTPL de la historia de la iglesia, por corrección del usuario sobre su pertinencia.
- Borrador activo y versión pública corregidos sin alterar los demás capítulos; prueba de regresión del alcance institucional.

---

## [1.6.0] - 2026-10-12

### Añadido
- Recorrido de cinco lecturas con progreso opcional guardado en el dispositivo, preguntas de comprensión y explicación de respuestas.
- Editor de lecturas en Contenido/Páginas con bloques compartidos, fuentes, vista previa, notas privadas, borradores, revisión pastoral, publicación y recuperación de versiones.
- Snapshots públicos separados de borradores/historial, permisos en Supabase, publicación atómica y control de conflictos entre editores.
- Interpretación del Himno Cuadrangular de ICC SUR Ibagué en YouTube, con carga voluntaria del reproductor, crédito y enlace original.
- Reseña local del servicio educativo respaldada por la investigación de Isabel M. Ávila Burbano en UTPL, sin confundir fechas escolares y fundación de la congregación.

### Mejorado
- Sitemap incluye las cinco lecturas y se elimina el canonical fijo de Inicio; se conserva el canonical dinámico existente del layout.
- Lecturas con imágenes originales optimizadas, estimación de lectura y firma/fecha de revisión solo cuando existe una revisión registrada.
- Pruebas del recorrido, progreso, metadatos, derechos de edición, conflictos y publicación; notas de autorización de audio permanecen privadas.
---

## [1.5.1] - 2026-10-12

### Corregido
- Accesos de la presentación principal de Nosotros apuntan al nuevo recorrido de aprendizaje.
- Verificación de todos los enlaces internos de la portada para detectar destinos eliminados.

---

## [1.5.0] - 2026-10-12

### Añadido
- Cinco lecturas públicas: Origen Cuadrangular, Nuestra doctrina, Símbolos y bandera, Nuestra historia y Nuestro himno.
- Referencias bíblica…408 tokens truncated…l elemento de la cola solo se elimina después de que **todas** las operaciones hayan sido exitosas. Antes, si la conexión se cortaba entre el DELETE y el INSERT de relaciones, los datos quedaban en estado huérfano (emails borrados, sin remplazarlos).
- **`useAuthStore.ts` — Listeners zombi en logout**: `logout()` ahora llama `subscription.unsubscribe()` y resetea `_authInitialized` antes de ejecutar `supabase.auth.signOut()`. Esto previene que el listener `onAuthStateChange` sea notificado del evento `SIGNED_OUT` durante el cierre de sesión intencional del usuario, eliminando el ciclo redundante de limpieza de estado.
- **`useAuthStore.ts` — Duplicación de `logout`/`signOut`**: `signOut` ahora es un alias que delega a `logout`, eliminando la duplicación de código. Se centralizó el estado de limpieza en `SESSION_CLEARED_STATE`.
- **`searchIndexService.ts` — Parser de referencias bíblicas incompleto**: El mapa `BIBLE_BOOKS_MAP` fue extendido de 35 a 66 libros (cobertura completa del canon bíblico). Se añadieron los libros faltantes del Antiguo Testamento (1-2 Crónicas, Esdras, Nehemías, Ester, Job, Cantares, Lamentaciones, Ezequiel, los 12 profetas menores) y Nuevo Testamento (Tito, Filemón, 2-3 Juan, Judas). El algoritmo de matching fue refactorizado para usar búsqueda exacta por clave normalizada (sin tildes) en primer lugar y fallback de prefijo solo cuando el alias tiene ≥ 3 caracteres, eliminando los falsos positivos del `alias.startsWith(rawBook) || rawBook.startsWith(alias)` bidireccional.

## [1.4.4] - 2026-09-28


### Mejorado (Changed) & Optimizado (Performance)
- **Eliminación de Carrera y Duplicación en Autenticación (`authService.ts`)**:
  - **Deduplicación en Vuelo (*In-Flight Deduplication*)**: Implementado mapa de promesas concurrentes en `fetchOrCreateProfile` para evitar que `getSession()` y el listener `onAuthStateChange('INITIAL_SESSION')` disparen consultas paralelas idénticas a Supabase en el arranque de la app.
  - **Tolerancia a Fallos en Permisos**: Si la consulta a `role_permissions` o `access_roles` experimenta micro-cortes, el sistema aplica `defaultFallbackPermissions` de forma segura en lugar de forzar un cierre de sesión abrupto.
- **Optimización de Navegación Pública y Reducción de Consultas (`PublicLayout.tsx`, `Navigation.tsx`, `useMenuStore.ts`, `menuService.ts`)**:
  - **Eliminación de Desmontaje Forzado**: Retirada la propiedad destructiva `key={location.pathname}` en `<Navigation />` dentro de `PublicLayout.tsx` y en `<motion.nav>` de `Navigation.tsx`. La barra de navegación se mantiene viva entre rutas sin reinicios visuales bruscos ni descarte de listeners.
  - **Caché Inteligente con TTL**: Incorporado control de frescura de 10 minutos en `useMenuStore` y `menuService`, eliminando el 100% de consultas repetitivas a `public_menu_items` cada vez que el usuario navega entre páginas públicas.
  - **Invalidación Proactiva**: El catálogo se refresca automáticamente cuando los administradores agregan, editan, reordenan o eliminan enlaces del menú.
- **Sincronización Offline First No Destructiva (`syncPull.ts`)**:
  - **Preservación de Mutaciones Locales**: El proceso de pull ahora consulta previamente la cola `sync_queue` para proteger y no sobreescribir modificaciones de miembros, horarios o notas pendientes de sincronización.
  - **Reemplazo de `.clear()` por Merge Seguro**: Se sustituyó el vaciado destructivo de las tablas IndexedDB por un guardado incremental no bloqueante, protegiendo los datos locales ante fallos de red durante el ciclo de sincronización.

---

## [1.4.3] - 2026-09-25

### Corregido (Fixed)
- **Corrección de Recorte Tipográfico y Elementos Ocultos en Secciones Hero**:
  - **Recorte de "propósito." (`PremiumBibleHero.tsx`)**: Se incrementó la altura de línea de `leading-[.88]` a `leading-[0.96]` y se añadió `inline-block` con margen y relleno de seguridad (`pb-2.5 pt-1 pr-2`) para evitar que el gradiente con `bg-clip-text` recorte la tilde de la "ó" y los trazos descendentes.
  - **Superposición de "Palabra viva" (`PremiumBibleHero.tsx`)**: Se reubicó la insignia flotante "Pasaje actual" de `top-[9%]` a `top-[26%]`, eliminando la colisión que tapaba la etiqueta "Palabra viva" en la tarjeta de estudio bíblico.
  - **Truncamiento de Texto en Tarjeta de Estudio**: Se amplió el ancho del badge inferior de `15rem` a `17.5rem` / `19rem` y se retiró el `truncate`, mostrando completo el mensaje *"Busca, guarda y vuelve a encontrar"*.
  - **Elemento Oculto "Descubre nuestra semana" (`PremiumHeroVisual.tsx` & `BentoGridSection.tsx`)**:
    - Se rediseñó el indicador ancla inferior como una cápsula de cristal flotante (*glass pill badge*) con microinteracción de pulso e icono direccional.
    - Se ajustó el margen negativo de la sección bento grid de `-mt-12` a `-mt-5` y la separación inferior del hero, eliminando la superposición donde la tarjeta de sermón cubría y ocultaba el texto "Descubre nuestra semana".

---
## [1.14.36] - 2026-10-25

### Seguridad
- Las vistas públicas de la tienda aplican los permisos de quien consulta; el catálogo muestra únicamente productos activos y variantes de productos publicados.
- Los intentos de acceso a páginas ministeriales y documentos editoriales protegidos se limitan por dirección de origen seudonimizada y recurso. El registro permanece privado.
- Se desactiva el RPC de verificación estudiantil por identificador, que ya no forma parte de las rutas de la aplicación.

### Pruebas
- Playwright usa un proyecto Supabase ficticio y respuestas de prueba para contenido público; los escenarios de tienda habilitan la función solo dentro de su fixture.
- La suite E2E predeterminada queda en Chromium, único navegador que inicia correctamente en este Windows.

---
## [1.14.37] - 2026-10-25

### Seguridad
- El catálogo, las opciones de compra y el retiro dejan de ser accesibles para visitantes mientras la tienda pública esté oculta; las personas autorizadas conservan la gestión desde el panel.
