# Documentos institucionales

Fuentes: los dos PDF proporcionados por el usuario. Las descargas en `public/documentos` son copias sin modificar; sus huellas SHA-256 permiten comprobar la integridad. La fecha del nombre del estatuto identifica el archivo proporcionado, sin afirmar una fecha de aprobación distinta a la del documento.

Rutas: `/nosotros/documentos`, `/nosotros/documentos/estatutos`, `/nosotros/documentos/reglamento-interno`.

El estatuto es un escaneo de 16 páginas: la edición web utiliza texto OCR editable y ofrece imágenes WebP del original para comparación, cargadas bajo demanda. El reglamento tiene 53 páginas; el texto extraído conserva la referencia a la página original, pero no reconstruye tablas, gráficos, firmas ni disposición del PDF. Se indica esta diferencia en pantalla.

Imprimir / guardar página en PDF abre el diálogo del navegador. El botón restaura lectura continua y borra la búsqueda antes de imprimir para conservar el documento completo. Las descargas originales incluyen todos los elementos del archivo recibido. Los documentos están excluidos del precache PWA para evitar descargas automáticas de varios MB a cada visitante.

## Estatuto de la Iglesia Cuadrangular

ESTATUTO DE LA  IGLESIA CUADRANGULAR  ABRIL 25 DEL 2026.pdf

SHA-256: `f2c3d8ceda597a6b9f49a208fbe249765331ee75c9105e1fa6eed434597960de`

## Reglamento interno

Reglamentos Interno final.pdf

SHA-256: `6a4eaee9c20c6b1131ca786334629aec7f6a176f35b26c971666816601864ea8`

## Fuentes de texto editables y presentación editorial

Editar `docs/normativa-cuadrangular/textos/estatutos.md` o `reglamento-interno.md`, conservar los separadores `<!-- pagina:N -->` y ejecutar `node scripts/build-governance-documents.mjs`. El script comprueba cobertura de las 16 y 53 páginas e integridad SHA-256 de los originales antes de reconstruir los JSON de lectura. Los componentes no contienen el texto normativo. Esta edición es mediante archivos del proyecto; no incluye un editor administrativo ni permite cambios a visitantes.

El estatuto se reconoció localmente con Tesseract.js y modelo español. La transcripción sigue pendiente de cotejo editorial integral: la confianza OCR no garantiza exactitud. Las páginas originales pueden desplegarse junto al texto para compararlas. El reglamento usa la extracción de texto del PDF. No se han modificado los originales ni se ha certificado vigencia jurídica.

Presentación: portada fotográfica real, títulos Playfair, cuerpo Inter, índice por páginas/títulos detectados, búsqueda sin distinción de tildes, lectura continua o por página, columnas opcionales en escritorio y una columna en móvil. Guardar página en PDF vuelve a lectura completa y elimina el filtro antes de abrir impresión. El documento impreso contiene la transcripción, no reproduce firmas e imágenes del original.

Verificación editorial local: compilación TypeScript y Vite; lint del componente; reconstrucción de 16 y 53 páginas desde Markdown con SHA-256 de los PDF verificado; búsqueda «presupuesto» (4 páginas del reglamento), navegación siguiente y ancho móvil 390px sin desbordamiento. Muestras visuales del estatuto: páginas 1 y 4. Correcciones cotejadas: encabezado de República del Ecuador y Título III de Clases de Miembros. Revisión integral de texto OCR pendiente.

## Herramientas de lectura

Barra de lectura con tamaño de letra (14–22 px), fondo cálido, concentración, restablecer ajustes y tiempo estimado. Indicador de página visible, sin equipararlo a lectura completada. Búsqueda con coincidencias resaltadas preservando tildes. Marcadores por documento guardados únicamente en este navegador con errores de almacenamiento visibles; navegación a marcadores y copia de enlaces a páginas. Botón para volver al inicio.

Validación de esta ampliación: TypeScript y Vite completados; lint de componente y pruebas sin errores; 4 pruebas de búsqueda, persistencia de marcadores, almacenamiento bloqueado y restablecimiento. Vista móvil 390 × 844 sin desbordamiento horizontal, y revisión visual de concentración en escritorio. Implementación local, pendiente de publicación.


Los controles y el índice ahora se alojan en paneles flotantes con pestañas fijas. Se despliegan con hover en puntero fino, foco de teclado o botón (también móvil). El botón permite fijar y recoger el panel; los contenidos son desplazables en pantallas pequeñas. El índice permanece accesible en concentración y ambos paneles se excluyen de impresión.
