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

## Fuentes enlazadas para Génesis 3

- Biblia: Génesis 2:16-17; 3:1-24; Romanos 5:12-19; 1 Corintios 15:21-22; Romanos 16:20; Hebreos 2:14-15; Apocalipsis 12:9; 20:2. Pasajes consultados mediante el lector compartido; el sitio no republica aquí el texto de una traducción.
- Proyecto Biblia, «Génesis 1–11»: https://bibleproject.com/es/videos/genesis-1-11/ — video oficial enlazado; no se copia ni se aloja.
- Proyecto Biblia, «Exilio»: https://bibleproject.com/es/videos/exilio/ — recurso temático enlazado por su relación con la salida de Edén; no sustituye la lectura de Génesis.
- Ilustraciones originales creadas para la guía Génesis 3; PNG maestro en LOCAL y WebP optimizado en `public/images/bible-study/`. Las escenas son interpretativas y no pretenden reconstruir un sitio arqueológico.
