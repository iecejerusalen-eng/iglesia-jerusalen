# 🏛️ Iglesia Jerusalén — Plataforma Web Integral

> **Plataforma digital de gestión eclesial** para la Iglesia del Evangelio Cuadrangular "Jerusalén" (Milagro, Ecuador).  
> Desarrollado y creado por **Esteban Nicola**.

---

## 📖 ¿Qué es este proyecto?

Es una **aplicación web progresiva (PWA)** de tipo *Single Page Application* que funciona como el ecosistema digital completo de una iglesia local. Combina un **sitio web público** moderno con un **panel de administración protegido** por roles (RBAC), permitiendo gestionar desde los miembros y ministerios de la congregación hasta sermones interactivos, una tienda de productos, finanzas, eventos, logística de producción, geolocalización de células de crecimiento y herramientas avanzadas de gamificación, discipulado y offline-first.

La plataforma fue diseñada para ser **instalable** en dispositivos móviles como una aplicación nativa (PWA con Service Worker), ofreciendo acceso rápido, cache offline y una experiencia inmersiva. Además, cuenta con un backend resiliente con sincronización offline-first local de datos mediante SQLite y OPFS en el navegador, asegurando la continuidad operativa en zonas de baja o nula conectividad.

---

## 🛠️ Stack Tecnológico

### Lenguajes de Programación
| Lenguaje | Uso |
|---|---|
| **TypeScript** | Lenguaje principal de toda la aplicación (frontend) con tipado estricto (`tsc -b`) |
| **SQL** | Migraciones y esquemas de la base de datos PostgreSQL (vía Supabase) |
| **HTML5 / CSS3** | Estructura semántica y estilos de diseño premium |
| **JavaScript** | Scripts auxiliares y el minijuego WebGL de la Escuela Dominical |

### Framework & Librerías Core
| Tecnología | Versión | Propósito |
|---|---|---|
| **React** | 19.2 | Librería de interfaz de usuario (componentes funcionales, hooks) |
| **Vite** | 8.0 | Empaquetador y servidor de desarrollo ultrarrápido |
| **React Router DOM** | 7.17 | Enrutamiento SPA con rutas públicas y protegidas |
| **Tailwind CSS** | 4.3 | Framework de utilidades CSS con plugin nativo de Vite |
| **Framer Motion** | 12.40 | Animaciones, transiciones y micro-interacciones de la UI |
| **Zustand** | 5.0 | Estado global ligero (autenticación, carrito, modo en vivo, sync status) |
| **Sonner** | 2.0 | Notificaciones toast elegantes y no intrusivas |

### Arquitectura Offline-First (Local-First)
| Tecnología | Propósito |
|---|---|
| **sqlocal** (SQLite + OPFS) | Motor de base de datos SQLite embebido en el navegador que opera sobre el *Origin Private File System* para persistir datos locales de manera eficiente con alto rendimiento. |
| **useSyncStore** (Zustand Queue) | Gestor de estado que administra una cola de sincronización de mutaciones locales y las procesa en orden secuencial una vez restablecida la conexión de red. |
| **Conflict Resolver Utility** | Algoritmo de resolución de conflictos que combina la comparación de números de versión de registros e incrementos y políticas *Last-Write-Wins* (LWW) basados en marcas de tiempo (`updated_at`). |

### Editores de Contenido Enriquecido
| Tecnología | Propósito |
|---|---|
| **TipTap** (con StarterKit, Color, Image, TaskList, TextAlign, YouTube) | Editor WYSIWYG para sermones, páginas y notas privadas |
| **BlockEditor** (diseño modular propio) | Editor modular por bloques: texto rico, imágenes, HTML embed, secciones, preguntas abiertas, opción múltiple, verdadero/falso |
| **SongLyricsEditor** (diseño modular propio) | Editor de letras con soporte de acordes musicales (extensión TipTap personalizada `ChordExtension`) |

### Formularios & Validación
| Tecnología | Propósito |
|---|---|
| **React Hook Form** | Manejo de formularios declarativo |
| **Zod** | Esquemas de validación tipados y robustos en tiempo de ejecución |
| **@hookform/resolvers** | Integración de Zod con React Hook Form |

### Visualización & Mapas
| Tecnología | Propósito |
|---|---|
| **Recharts** | Gráficos y dashboards interactivos de analíticas y finanzas |
| **MapLibre GL** + **React Map GL** | Mapa interactivo georreferenciado para el Mapa Estratégico de la congregación |
| **Supercluster** | Agrupamiento (clustering) inteligente de marcadores de miembros y células en el mapa |
| **Nominatim OpenStreetMap** | API de geocodificación inversa y búsqueda de direcciones integrada directamente en los mapas del admin |

### Otros
| Tecnología | Propósito |
|---|---|
| **DOMPurify** | Sanitización de HTML generado por usuarios para prevenir ataques XSS |
| **cmdk** | Menú de comandos rápido estilo Spotlight (⌘K) en el panel admin |
| **emoji-mart** | Selector de emojis para eventos y contenido |
| **vite-plugin-pwa** | Configuración de Progressive Web App (Service Worker, manifest, cache) |

---

## ☁️ Infraestructura en la Nube y Almacenamiento

### Base de Datos & Backend Serverless
| Servicio | Función |
|---|---|
| **Supabase** (PostgreSQL) | Base de datos relacional principal, autenticación de usuarios (Supabase Auth), Row Level Security (RLS), APIs REST auto-generadas |
| **Supabase Edge Functions** (Deno) | Procesamiento seguro en el servidor para lógica pesada e integraciones externas |

### Almacenamiento y Cargas de Archivos
| Servicio | Función |
|---|---|
| **Cloudinary** | CDN y gestión optimizada de imágenes. Cargas directas desde el navegador a la cuenta de Cloudinary mediante la API de carga rápida con firma o presets no firmados. Utilizado para las fotos de perfil de usuarios, fotos de miembros del CRM y las imágenes de las variantes de productos. |
| **Supabase Storage** | Buckets privados para almacenar logos institucionales y archivos multimedia de alta resolución en la Bóveda de Media, protegidos por URLs firmadas temporales de 1 minuto. |

---

## 🛡️ Edge Functions & Middleware de Seguridad (Backend Deno)

La plataforma incluye Supabase Edge Functions seguras alojadas en Deno Deploy:

### 1. Edge Function `gamify`
* **Lógica**: Se encarga de procesar de manera segura la validación de trivias y otorgamiento de insignias en la tabla `user_badges`.
* **Seguridad**: Evita que los usuarios manipulen el frontend para auto-adjudicarse insignias. Valida el token JWT del usuario, comprueba si ya posee la insignia y utiliza el rol administrativo (`service_role`) para realizar inserciones seguras.
* **Badges controladas**:
  * *Campeón Dominical* (completar el minijuego de trivia de la Escuela Dominical).
  * *Primeros Pasos* (leer el primer capítulo del plan de lectura bíblica congregacional).
  * *Explorador Bíblico* (completar el 50% del plan de lectura).
  * *Erudito de la Palabra* (completar el 100% del plan de lectura).

### 2. Edge Function `rate-limiter`
* **Lógica**: Actúa como un middleware que intercepta envíos a formularios públicos (`/contacto` y `/peticiones`) para mitigar abusos o denegaciones de servicio (DoS).
* **Configuración**: Limita a las direcciones IP de origen a un máximo de **5 peticiones cada 15 minutos** por endpoint.
* **Base de Datos**: Hace uso de la función RPC `check_rate_limit` de PostgreSQL y una tabla dedicada `rate_limits` con un índice único compuesto en `(ip_address, endpoint)` para registrar marcas de tiempo y realizar validaciones atómicas.

---

## 🎨 Identidad Visual y Logotipo Dinámico

### Paleta de Colores y Accesibilidad WCAG AA
La paleta está calibrada para cumplir con los estándares de contraste y legibilidad (WCAG AA):
* `--color-primary` (`#1E3A8A`): Azul institucional profundo (textos principales, botones primarios).
* `--color-gold` (`#D97706`): Dorado litúrgico (acentos, botones de acción secundaria, estados dorados).
* `--color-base` (`#F8FAFC`): Fondo ultra-claro tipo hielo para interfaces de lectura.
* `--color-accent-red` (`#DC2626`): Rojo de alerta (mensajes de error, cancelaciones).
* `--color-accent-purple` (`#7C3AED`): Púrpura litúrgico (trivias, insignias).
* `--color-accent-blue` (`#0EA5E9`): Azul cielo (datos estadísticos, enlaces complementarios).

### Tipografía
* **Playfair Display**: Serif elegante (`--font-serif`) empleada en títulos heroicos y nombres de secciones.
* **Inter**: Sans-serif limpia (`--font-sans`) empleada en el cuerpo de lectura, tablas, paneles y formularios.

### Logos de la Iglesia e Integración
La carpeta `src/assets/Jerusalén/` contiene los logos oficiales de la congregación en formato SVG vectorial:
* **Logotipo Completo Colorido** (`Logo completo colorido.svg`)
* **Logotipo Completo Blanco** (`Logo completo blanco.svg`)
* **Isotipo Circular Colorido** (`Logo circular colorido.svg`)
* **Isotipo Circular Blanco** (`Logo circular blanco.svg`)
* **Logotipo Horizontal y Vertical** en colores institucionales y variantes monocromáticas sólidas.

### Favicon Dinámico desde la Base de Datos
* **Funcionalidad**: En lugar de utilizar un favicon estático o emojis de iglesia, el favicon de la pestaña del navegador se actualiza dinámicamente mediante código Javascript al iniciar la aplicación.
* **Mecanismo**: Lee la versión circular del logotipo oficial (`Logo circular colorido.svg` o el logo más reciente guardado en la gestión de logos de la base de datos) y reemplaza la etiqueta `<link rel="icon">` del HTML principal en tiempo de ejecución.

---

## 🗂️ Estructura de la Página

### Páginas Públicas (19 rutas)

| Ruta | Página | Descripción |
|---|---|---|
| `/` | **Inicio** | Fachada con efecto Ken Burns, orbes de luz dinámicos, cabecera transparente-a-sólida con blur de fondo, horarios de cultos, ministerios, sermones recientes y stream de transmisión en vivo. |
| `/nosotros` | **Quiénes Somos** | Historia de la iglesia, misión, visión, valores y biografías de los pastores principales. |
| `/ministerios` | **Ministerios** | Catálogo interactivo de departamentos y áreas de servicio congregacional. |
| `/ministerios/:slug` | **Detalle de Ministerio** | Descripción del ministerio, líder encargado, horarios y contenido estructurado en bloques. |
| `/predicas` | **Prédicas** | Historial de sermones grabados con video embebido de YouTube y buscador integrado. |
| `/predicas/:id` | **Detalle de Prédica** | Vista del sermón enriquecido con bloques dinámicos (preguntas interactivas) y un bloc de notas privado. |
| `/eventos` | **Eventos** | Calendario mensual de actividades próximas con filtros temáticos. |
| `/tienda` | **Tienda** | Catálogo e-commerce con variantes de color/talla de productos, stock controlado y carrito. |
| `/cart` | **Carrito** | Resumen del pedido con pasarela de carga de comprobantes de pago por transferencia. |
| `/mis-compras` | **Mis Compras** | Historial de pedidos y estados de entrega del usuario autenticado. |
| `/donations` | **Diezmos y Ofrendas** | Formulario seguro para registrar donaciones financieras y diezmos con subida de comprobante bancario. |
| `/contacto` | **Contacto** | Formulario público de contacto protegido por el middleware de rate-limiting. |
| `/peticiones` | **Peticiones de Oración** | Buzón virtual de oración (anónimo o con perfil) protegido por rate-limiting. |
| `/recursos/alabanzas` | **Biblioteca de Alabanzas** | Letras y acordes dinámicos interactivos de canciones con transpositor de tonos. |
| `/programas` | **Estudios Bíblicos** | Portal de discipulado académico con programas de formación por niveles. |
| `/programas/:id` | **Detalle de Programa** | Vista interactiva de lecciones de estudio con trivias y preguntas abiertas autocorregibles. |
| `/escuela-dominical` | **Escuela Dominical** | Minijuego WebGL interactivo integrado para niños que otorga insignias de gamificación. |
| `/plan-lectura` | **Plan de Lectura** | Progreso congregacional y personal de la lectura diaria de la Biblia capítulo a capítulo. |
| `/login` | **Iniciar Sesión** | Acceso a perfiles mediante autenticación segura de Supabase. |

### Panel Administrativo (19 módulos)

El panel administrativo en `/admin` está protegido por un sistema RBAC con permisos modulares de lectura y escritura:

| Módulo | Ruta | Funcionalidad |
|---|---|---|
| 📊 **Resumen (Dashboard)** | `/admin` | Métricas generales en tiempo real: miembros activos, eventos del mes, donaciones y pedidos. |
| 📈 **Análisis (Métricas)** | `/admin/analisis` | Gráficos e informes de crecimiento, tendencias financieras e inscripciones. |
| 🔔 **Notificaciones** | `/admin/notificaciones` | Envío de notificaciones a través de la integración de alertas. |
| 🎤 **Sermones** | `/admin/sermones` | Editor y creador de sermones en base a bloques con videos de YouTube y trivias. |
| 🎵 **Alabanzas** | `/admin/alabanzas` | Editor de acordes sobre letras de canciones usando TipTap ChordExtension. |
| 🎓 **Programas** | `/admin/programas` | Administración del portal de discipulado y creación de lecciones interactivas. |
| 👥 **Miembros (CRM)** | `/admin/miembros` | CRM de miembros: datos personales, bautismo, talentos, fotos cargadas a Cloudinary, geolocalización, y panel inteligente de búsqueda, ordenación (por nombre, apellido, fecha o diezmos), filtrado avanzado (por liderazgo, ministerios y habilidades) y agrupamiento modular (por liderazgo, ministerios, áreas o mes de cumpleaños). |
| 🗺️ **Mapa Estratégico** | `/admin/mapa-estrategico` | Mapa MapLibre para el análisis congregacional y células con marcadores georreferenciados. |
| 📅 **Eventos (Calendario)** | `/admin/eventos` | Control del calendario de actividades de la iglesia con recurrencias configurables. |
| ⛪ **Ministerios** | `/admin/ministerios` | CRUD de ministerios, liderazgos, colores visuales y fechas conmemorativas. |
| 🖼️ **Catálogo de Logos** | `/admin/logos` | Registro, almacenamiento y variantes de los logotipos institucionales (SVG/PNG). |
| 🙏 **Peticiones de Oración** | `/admin/peticiones` | Gestión de peticiones enviadas por los usuarios y actualización de estados. |
| 💰 **Finanzas** | `/admin/finanzas` | Contabilidad interna, aprobaciones de diezmos/donaciones registradas por usuarios. |
| 🛒 **Productos** | `/admin/productos` | Gestión de productos físicos/digitales, control de variantes de stock y variantes. |
| 📄 **Editor de Páginas** | `/admin/paginas` | Constructor y editor visual de páginas públicas a través de bloques modulares. |
| 👤 **Gestión de Usuarios** | `/admin/usuarios` | Asignación de roles y permisos específicos para el panel admin. |
| ⚙️ **Iglesia** | `/admin/configuracion` | Configuración global: cuentas bancarias, redes sociales y coordenadas geográficas base. |
| 🏭 **Logística de Producción** | `/admin/produccion` | Kanban de logística de producción e imprenta de materiales congregacionales. |
| 🔒 **Bóveda de Media** | `/admin/media-vault` | Repositorio privado de recursos de diseño con descargas protegidas por URLs firmadas. |

---

## 🔐 Seguridad y Gobernanza de Datos (PostgreSQL & Supabase)

### Control de Acceso Basado en Roles (RBAC)
Los usuarios se asignan a uno de los **11 roles del sistema**: `admin`, `pastor`, `editor`, `secretary`, `leader`, `multimedia`, `maestro`, `apoyo`, `member`, `guest`. Cada módulo administrativo valida los permisos de lectura (`view`) y escritura (`edit`) cruzando el rol con excepciones personalizadas (`permissions_override`) definidas en el perfil.

### Integridad en Sincronización Local y Resolución de Conflictos
Para habilitar el soporte local-first sin corromper la consistencia en el servidor Supabase:
1. **Control de Versiones en DB**: Las tablas `members`, `schedules`, y `sermon_notes` contienen las columnas `updated_at` (timestamp) y `version` (entero).
2. **Trigger Automático**: Se diseñó el disparador de base de datos `tr_..._increment_version_and_updated_at` que ejecuta la función `increment_version_and_updated_at()`. Con cada `UPDATE` en el servidor, el campo `version` se incrementa automáticamente en `+1` y actualiza `updated_at`.
3. **Resolución de Conflictos Offline**: Al volver a estar en línea, el cliente sincroniza su cola local (`sync_queue`) contra Supabase. El resolvedor compara la versión local contra la del servidor. Si difieren, aplica la lógica:
   * Si la versión local es mayor, se actualiza el servidor.
   * Si la versión del servidor es mayor, prevalece el servidor (o se aplica *Last-Write-Wins* si las versiones coinciden).

### Seguridad de la Base de Datos para Rate Limiting
La tabla `rate_limits` y la función RPC `check_rate_limit` están completamente blindadas:
```sql
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- Restricciones estrictas
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, int, int) TO service_role;
```
Esto garantiza que ningún cliente pueda forzar llamadas manuales a la función para resetear sus límites.

---

## ⚡ Características Destacadas de la Plataforma

* 📶 **Soporte Offline Completo (PWA + SQLite)**: La aplicación almacena localmente una copia en caché de los miembros, notas de sermones y horarios utilizando SQLite y OPFS en el navegador. Las operaciones realizadas sin conexión se encolan y se sincronizan silenciosamente al recuperar la red.
* 🗺️ **Mapa Estratégico Inteligente (MapLibre & Supercluster)**:
  * Agrupación interactiva de miembros para identificar densidades territoriales.
  * **Capa de Cobertura de Células (500 metros)**: Genera polígonos GeoJSON de 500 metros a la redonda de cada célula de crecimiento para analizar el alcance geográfico de la iglesia.
  * Herramientas de medición de distancias lineales y geocodificador Nominatim.
* 📷 **Perfil de Usuario con Avatar Cloudinary**: Los usuarios pueden subir fotos de perfil directamente haciendo clic en el botón de subida en la TopBar. La imagen se aloja en Cloudinary y se asocia al campo `photo_url` de la tabla `profiles` de Supabase, visualizándose inmediatamente al lado del saludo de bienvenida.
* 📝 **Letras de Canciones con Acordes (`ChordExtension`)**: Permite escribir partituras y letras directamente en el panel de administración, y visualizarlas con acordes alineados encima del texto con la capacidad de transponer el tono de la canción en tiempo real.
* 🎬 **Visuales y Efecto Ken Burns**: Cabecera responsiva transparente con transición glassmorphism al hacer scroll, animaciones premium en Framer Motion y orbes de luz dinámicos en el fondo de la página de inicio.
* 🎮 **Gamificación en el Servidor**: La entrega de insignias de la Escuela Dominical o planes de lectura bíblica congregacional se procesa de forma segura a través de Supabase Edge Functions para evitar inyecciones maliciosas desde el cliente.

---

## 📜 Scripts del Proyecto

```bash
npm run dev       # Servidor de desarrollo local con recarga rápida (HMR)
npm run build     # Compilación y empaquetado optimizado para producción con Vite + TypeScript
npm run lint      # Verificación de linter de ESLint para TypeScript y React
npm run preview   # Previsualización del empaquetado de producción de forma local
```

---

> **Iglesia del Evangelio Cuadrangular "Jerusalén"**  
> Baquerizo Moreno entre Av. Colón y Tulcán, Milagro, Ecuador  
> Diseñado, desarrollado y documentado con ❤️ por **Esteban Nicola**
