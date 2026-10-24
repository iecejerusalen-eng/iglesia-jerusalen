# Flujo editorial y fuentes del estudio bíblico

Este documento fija un método repetible para desarrollar el catálogo de 66 libros y 1.189 capítulos. Mantiene el lector bíblico como fuente primaria para el pasaje y separa evidencia textual, contexto histórico, interpretación, aplicación y recursos multimedia.

## Registro obligatorio por unidad

Cada unidad (libro, capítulo, ficha, persona, lugar o acontecimiento) debe conservar:

| Campo | Qué registrar |
|---|---|
| Unidad | Libro, capítulo, ficha o escena a la que aplica la fuente |
| Afirmación respaldada | La oración concreta del texto que se apoya en ella |
| Referencia bíblica | Pasaje exacto abierto mediante el lector compartido |
| Fuente externa | Autor o institución, título, URL estable y fecha de consulta |
| Tipo y alcance | Fuente primaria, recurso institucional, comentario académico, recurso visual o audiovisual |
| Doctrina y certeza | Confesión evangélica, comparación, interpretación debatida o dato establecido; no mezclar categorías |
| Licencia y reutilización | Copiar, adaptar, atribuir, enlazar o no reutilizar; acceso abierto no implica permiso de republicación |
| Incorporación | Síntesis propia, enlace incluido y material que no se copió |

Guarda la bitácora duradera en Obsidian, en `03 Proyectos/09 Iglesia Jerusalén/Estudio bíblico - Catálogo de libros.md`, y enlaza cada avance a esta guía. El changelog acredita releases, pero no reemplaza la fuente ni el criterio editorial de cada capítulo.

## Orden de investigación

1. Leer el capítulo completo en el lector compartido y fijar las unidades literarias con referencias exactas.
2. Registrar primero lo que el texto afirma y lo que no especifica. No inventar autor, cronología, coordenadas, identificaciones arqueológicas ni causalidades.
3. Comparar referencias canónicas para conexiones teológicas. Señalar cuándo una identificación aparece en otro libro y no en el propio capítulo.
4. Consultar contexto histórico o geográfico solo si ayuda a una afirmación concreta. Preferir museos, bibliotecas, catálogos y publicaciones académicas con procedencia verificable.
5. Revisar doctrina con fuentes evangélicas institucionales cuando una afirmación afecte una convicción confesional. No presentar una comparación bautista, pentecostal o cuadrangular como consenso de todas las iglesias.
6. Enlazar videos y galerías oficiales en su origen; revisar condiciones antes de descargar, incrustar o adaptar. Para el arte original, conservar el archivo fuente y registrar su derivado web y hash.
7. Relacionar Estudio, Atlas, Enciclopedia y Cronología con IDs y referencias compartidos. Si un dato es incierto, incluir la cautela en la vista que lo usa, no solo en una nota interna.
8. Revisar la lectura en móvil y escritorio, contraste, foco, textos alternativos, carga diferida y movimiento reducido; después ejecutar build y publicar únicamente con changelog y sincronización Supabase.

## Convenciones editoriales

- «Secuencia narrativa» describe el orden del texto, no una datación histórica.
- Un topónimo mencionado no se convierte automáticamente en un pin moderno. Señala identificaciones debatidas y evita coordenadas precisas cuando la fuente no las sostiene.
- Nombres posteriores (por ejemplo, Eva en Génesis 3:20) no se retrotraen como si aparecieran en todos los pasajes anteriores.
- Distingue la lectura confesional cristiana de la observación directa del pasaje; identifica alusiones posteriores como lectura canónica.
- Ilustraciones generadas son interpretaciones artísticas, no fotos, evidencia arqueológica ni reconstrucciones exactas.
- Los enlaces a terceros deben indicar su origen; los videos no se descargan ni se re-alojan sin permiso explícito.

## Ficha mínima reutilizable por capítulo

```text
Capítulo:
Título y síntesis:
Movimientos del pasaje (referencia exacta):
Observaciones textuales:
Personas / lugares / acontecimientos vinculados:
Atlas (mapa geográfico, esquema literario o sin mapa; explicar por qué):
Cronología (secuencia del texto; no inventar año):
Referencias canónicas y tipo de conexión:
Fuentes externas (afirmación, autor, URL, fecha, tipo, licencia/uso):
Imágenes y video (procedencia, permiso, uso y atribución):
Puntos debatidos / límites de certeza:
Verificación visual, accesibilidad y build:
Estado: propuesto / local / verificado / publicado
```

### Contrato de datos de capítulo

Los primeros estudios desarrollados en la interfaz usan `BibleChapterStudyRecord` (`src/data/bibleBookStudyCatalog.ts`) y el componente compartido `GenesisChapterStudyTemplate` (`src/components/public/bible/BibleBookCatalog.tsx`). Antes de crear otro componente, añade una ficha de datos con:

- síntesis, referencias completas y movimientos con límites exactos;
- observaciones separadas de preguntas de conversación;
- escenas con archivo, texto alternativo, resumen y pregunta propia;
- conexiones canónicas, recursos de video y nota de interpretación/contexto, cuando aplique;
- cada fuente con título, URL o referencias bíblicas, afirmación/aporte, tipo, uso permitido y fecha de consulta.

La interfaz no reemplaza esta bitácora. La tabla por afirmación de este documento conserva los límites de la evidencia; la ficha TypeScript hace visible la procedencia junto al estudio y reduce el coste de extender la plantilla. Para volúmenes grandes conviene mover estos registros a archivos de contenido por libro/capítulo conservando este contrato, sin copiar el componente.

## Fuentes añadidas o actualizadas — Génesis 2 y 3

Consulta: 2026-10-24.

| Unidad | Afirmación/aporte | Fuente | Tipo / tratamiento |
|---|---|---|---|
| Génesis 2 | Edén, la dirección «al oriente» y los cuatro ríos son descritos por el texto, sin coordenadas modernas para el jardín. | Génesis 2:8-14 en el lector bíblico compartido; complemento: [Guía de Génesis · Proyecto Biblia](https://bibleproject.com/es/guides/libro-de-genesis/). | La Biblia es fuente primaria. La guía externa es complemento literario; no es fuente doctrinal denominacional y no se copia. |
| Génesis 2 | La estimación de Mora de 7,77 millones es una proyección de 2011, no un censo. | Mora et al., [PLOS Biology](https://doi.org/10.1371/journal.pbio.1001127). | Artículo revisado por pares; se enlaza sin copiar figuras o tablas. |
| Génesis 2 | Las estimaciones dependen de método y alcance: un modelo de 2025 calculó 1,03–2,92 millones de especies animales terrestres. | Fernandes et al., *Systematic Biology* (2025), [DOI 10.1093/sysbio/syaf006](https://doi.org/10.1093/sysbio/syaf006), ficha en PubMed. | Artículo revisado por pares; el alcance terrestre no se compara como si fuera el total de especies animales de Mora (2011). Se usa para explicar incertidumbre moderna, no para interpretar Génesis. |
| Génesis 2 | Wiens resume límites y desacuerdos de las estimaciones mundiales de especies. | Wiens, [PLOS Biology (2023)](https://doi.org/10.1371/journal.pbio.3002388). | Perspectiva científica; enlace al editor, sin copiar. |
| Génesis 2 | El árbol de la vida en la historia bíblica y el bloque de Génesis 1–11. | [Árbol de la vida](https://bibleproject.com/es/videos/arbol-de-la-vida/) y [Génesis 1–11](https://bibleproject.com/es/videos/genesis-1-11/) de Proyecto Biblia. | Recursos evangélicos complementarios no afiliados a una denominación; links oficiales, sin descarga ni re-alojamiento. |
| Génesis 3 | La secuencia de diálogo, ruptura, consecuencias y salida proviene de Génesis 3:1-24; las conexiones sobre Adán/serpiente vienen de textos canónicos posteriores. | Génesis 2:16-17; 3:1-24; Romanos 5:12-19; 16:20; 1 Corintios 15:21-22; Hebreos 2:14-15; Apocalipsis 12:9; 20:2, en el lector bíblico. | Se mantiene separado el vocabulario explícito de Génesis y la recepción cristiana posterior de Génesis 3:15. |
| Génesis 3 | El exilio de Israel como imagen posterior del exilio de la humanidad de Edén. | [El exilio · Proyecto Biblia](https://bibleproject.com/es/videos/exilio/). | Lectura temática del titular, no fuente primaria ni consenso denominacional; enlace oficial. |
| Génesis 2–3 | Criterio de uso de materiales audiovisuales. | [Condiciones de uso de Proyecto Biblia](https://bibleproject.com/terms/). | Permite enlaces o inserciones bajo condiciones; el sitio enlaza recursos oficiales y no los copia, altera ni aloja. |

### Aplicación de plantilla — 2026-10-24

Génesis 2 y 3 comparten ahora `BibleChapterStudyRecord`: resumen y referencias, cuatro movimientos, observaciones, escenas artísticas con texto alternativo/pregunta, conversación, conexiones canónicas, enlaces complementarios, distinciones editoriales y fuentes con tipo/alcance/uso/fecha. Se conectan con Atlas, Enciclopedia y Cronología. Los mapas siguen declarados narrativos donde el pasaje no permite ubicar el jardín; la cronología describe el orden literario, no un año histórico. En Génesis 2, el dato de biodiversidad queda plegado y rotulado como contexto moderno, no como parte del relato.

## Fuentes enlazadas para Génesis 3

- Biblia: Génesis 2:16-17; 3:1-24; Romanos 5:12-19; 1 Corintios 15:21-22; Romanos 16:20; Hebreos 2:14-15; Apocalipsis 12:9; 20:2. Pasajes consultados mediante el lector compartido; el sitio no republica aquí el texto de una traducción.
- Proyecto Biblia, «Génesis 1–11»: https://bibleproject.com/es/videos/genesis-1-11/ — video oficial enlazado; no se copia ni se aloja.
- Proyecto Biblia, «Exilio»: https://bibleproject.com/es/videos/exilio/ — recurso temático enlazado por su relación con la salida de Edén; no sustituye la lectura de Génesis.
- Ilustraciones originales creadas para la guía Génesis 3; PNG maestro en LOCAL y WebP optimizado en `public/images/bible-study/`. Las escenas son interpretativas y no pretenden reconstruir un sitio arqueológico.

## Bitácora por afirmación: Génesis 2

Consulta de fuentes: 2026-10-24. **Fuente bíblica primaria:** Génesis 2:4-25, abierto mediante el lector bíblico compartido. La guía no copia el texto de una traducción: sus cuatro movimientos y observaciones son síntesis editoriales de los rangos indicados. Génesis 1:20-25 se enlaza solo para distinguir el relato de creación de animales del acto de nombrarlos en Génesis 2:19-20. Génesis 2:10-14 es la base para mencionar los cuatro ríos; el capítulo no aporta coordenadas que permitan situar Edén y la guía no presenta una localización moderna.

| Afirmación usada | Fuente y alcance | Tipo / confianza | Uso y derechos |
|---|---|---|---|
| El pasaje presenta la formación del ser humano, el jardín y la tarea (2:4-17), los animales nombrados (2:18-20) y la relación entre mujer y hombre (2:21-25). | Génesis 2:4-25, lector bíblico compartido; referencias también visibles junto a cada movimiento. | Fuente primaria textual; observación directa. | Se ofrece síntesis propia y enlaces al lector; no se republica una traducción. |
| El relato nombra Pisón, Gihón, Tigris y Éufrates; no da coordenadas del jardín ni identifica con certeza moderna todos los topónimos. | Génesis 2:10-14. | Fuente primaria; límite explícito del texto. | No se asignan pines ni se afirma una identificación debatida. |
| La estimación de 7,77 millones de especies animales corresponde al modelo estadístico de Mora et al. (2011), no a un censo ni al número de individuos. | Camilo Mora et al., “How Many Species Are There on Earth and in the Ocean?”, *PLOS Biology* 9(8), e1001127 (2011), https://doi.org/10.1371/journal.pbio.1001127 . | Artículo de investigación revisado por pares; resultado de un método y un momento, no cifra definitiva. | Enlace al editor; no se copian figuras ni tablas. |
| Las estimaciones cambian; Wiens (2023) señala límites de proyecciones anteriores y el impacto de datos moleculares. | John J. Wiens, “How many species are there on Earth? Progress and problems”, *PLOS Biology* 21(11), e3002388 (2023), https://doi.org/10.1371/journal.pbio.3002388 . | Perspectiva científica que revisa estimaciones; complementa y matiza el cálculo 2011, no lo convierte en censo. | Enlace al artículo; no se copia material. |
| Las imágenes del jardín y de Adán nombrando animales son ilustraciones interpretativas. | `public/images/bible-study/eden-garden-study.webp` (SHA-256 `7192F3B2F639FA59786132B4A54A380626BA38096870B201841A33ADBF7F27F3`) y `adam-naming-animals-study.webp` (SHA-256 `97295C000823DF34C4022FC053CE5C9F248B41374BB469E6006A973898E7E207`). | Arte original generado para la guía; no es foto, evidencia arqueológica ni reconstrucción histórica. | El WebP publicado es el único original local encontrado en esta revisión. No se encontró un PNG maestro ni el prompt de generación; esa procedencia técnica queda pendiente de recuperar, sin inventarla. |

**Plantilla aplicada a Génesis 2:** introducción/resumen, movimientos con referencias, observaciones del texto, Atlas narrativo, Enciclopedia, Cronología como secuencia literaria, recursos complementarios y caveats de certeza. El estudio de especies está marcado como contexto científico lateral, no explicación teológica de Génesis.

## Bitácora por afirmación: Génesis 3

Consulta de fuentes: 2026-10-24. **Fuente bíblica primaria:** Génesis 3:1-24 y el mandato que abre el diálogo en Génesis 2:16-17, consultados en el lector bíblico compartido. La estructura, las observaciones, el Atlas narrativo y la Cronología son síntesis editoriales del orden del relato; no fijan fechas ni coordenadas.

| Afirmación usada | Fuente y alcance | Tipo / confianza | Uso y derechos |
|---|---|---|---|
| El relato pasa del diálogo a la decisión, la confrontación, las consecuencias y la salida del jardín; Dios viste a la pareja antes de cerrar el acceso al árbol de la vida. | Génesis 3:1-24, con rangos enlazados en cada movimiento. | Fuente primaria; resumen de la secuencia textual. | Síntesis propia; no se copia una traducción. |
| Génesis 3:15 tiene una recepción cristiana posterior como esperanza de victoria sobre el mal, pero se debe distinguir de la lectura del contexto inmediato y de su debate interpretativo. | Génesis 3:15; conexiones canónicas enlazadas: Romanos 5:12-19; 16:20; 1 Corintios 15:21-22; Hebreos 2:14-15. | Lectura teológica cristiana identificada como recepción, no como única interpretación histórica. | Referencias enlazadas; sin reproducción extensa del texto. |
| La identificación de la “serpiente antigua” con diablo/Satanás aparece expresamente en Apocalipsis, no como nombre usado por Génesis 3. | Apocalipsis 12:9; 20:2, comparados con Génesis 3:1-15. | Conexión canónica directa; se mantienen separados los vocabularios de cada libro. | Referencias enlazadas al lector compartido. |
| El exilio es una lectura temática posterior que conecta Edén con otros relatos bíblicos. | Proyecto Biblia, “Génesis 1-11”, https://bibleproject.com/es/videos/genesis-1-11/ y “El exilio”, https://bibleproject.com/es/videos/exilio/ (consulta 2026-10-24). | Recurso audiovisual evangélico complementario; interpretación contemporánea, no fuente primaria ni consenso universal. | Enlaces al sitio oficial; videos no descargados, editados ni alojados localmente. |
| Las escenas de diálogo y salida son arte interpretativo; no reconstrucción arqueológica. | PNG maestros `LOCAL/04_Trabajos_y_proyectos/Estudio_biblico_iLumina/Ilustraciones_originales/Genesis3/genesis3-dialogue-v01.png` (SHA-256 `3ADD667248487EFC604AA02F0BA0953F8EB3A306C1BC90FE8EE9D5245FE1E083`) y `genesis3-departure-v01.png` (SHA-256 `D09E2237B93C4B6F5C28D6BD4CCB51410A94B92BEA2BDAEAF71C013B44DF5B38`); derivados y hashes completos en `Genesis3/FUENTES.md`. | Arte original generado para la guía. | Se preservan los maestros y se sirven derivados WebP; brief y procedencia técnica en el manifiesto local. |

**Plantilla aplicada a Génesis 3:** cuatro movimientos, observaciones, personajes y eventos enlazados, Atlas narrativo (sin geografía inventada), Cronología literaria (sin fechas), conexiones canónicas diferenciadas de la exégesis inmediata, videos oficiales enlazados y manifiesto de imágenes.
