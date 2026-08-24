# Plan completo de modernización — Iglesia Jerusalén

> Documento de ejecución basado en [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md).
> Revisión inicial: 2026-08-24.

## 1. Lectura ejecutiva

El problema principal no es que falten módulos. El problema es que hay muchos módulos que resuelven partes de un mismo flujo sin compartir una capa común de datos, edición, media, permisos, estados y actividad.

La prioridad será reducir fragmentación antes de seguir agregando pantallas. La plataforma debe evolucionar desde un catálogo de módulos independientes hacia varios centros de trabajo conectados.

### Arquitectura objetivo

```text
                    Panel de Inicio / Gobierno
                              |
      +-----------------------+-----------------------+
      |                       |                       |
 Centro de Comunidad   Centro de Contenido     Centro de Operaciones
      |                       |                       |
 CRM · familias        páginas · publicaciones  culto · producción
 grupos · voluntarios  sermones · podcast       Holyrics · ProPresenter
 oración · asistencia  anuncios · formularios   espacios · reservas
      |                       |                       |
      +------------ Servicios compartidos -----------+
          permisos · actividad · media · búsqueda
          editor de bloques · notificaciones · métricas
```

## 2. Clasificación de módulos heredados o fragmentados

### 2.1. Heredados por ruta, nombre o ubicación

Estos módulos no necesariamente son malos ni antiguos en fecha absoluta. Se consideran heredados porque conservan decisiones históricas que ya no representan la arquitectura deseada.

| Módulo | Señal verificable | Problema | Acción |
|---|---|---|---|
| Biblioteca de Sonidos | Ruta `/admin/juegos/audio-library` | Está ubicada bajo juegos aunque pertenece a media/audio. | Migrar a Media Hub y dejar alias temporal. |
| Mapa Estratégico | Nombre histórico para una herramienta geográfica | Confundía cobertura pastoral con estrategia institucional. | Ya separado del Centro de Estrategia; mantener alias y actualizar textos. |
| Estudio de Botones/Glass | Ruta de apariencia específica y catálogo experimental | No es flujo operativo diario. | Integrar como sección avanzada del sistema de diseño. |
| Catálogos de Logos y Animaciones | Herramientas independientes | Duplican la idea de sistema visual. | Consolidar dentro de Apariencia/Diseño. |
| Bóveda de Credenciales | Módulo disponible en catálogo pero deshabilitado | Alto riesgo y no debe reaparecer sin seguridad completa. | Mantener deshabilitado; rediseñar como secreto server-side si vuelve. |
| Rutas alias administrativas | Ejemplos: `/admin/estilos`, `/admin/liderazgo` | Aumentan mantenimiento y pueden romper permisos o enlaces. | Mantener redirecciones documentadas y evitar nuevas aliases. |

### 2.2. Fragmentados por responsabilidad

| Familia | Módulos actuales | Fragmentación detectada | Centro futuro |
|---|---|---|---|
| Comunicaciones | ContactInbox, NotificationsManager, CommunicationCenter, ChatManager, CampaignsManager, ChurchAnnouncementsManager | Varias bandejas para mensajes, alertas, campañas y anuncios. | Centro de Comunicaciones. |
| Contenido | PageEditor, EditorialManager, SermonsManager, PodcastManager, PresentationEditor, OpenResourcesManager | Editores y publicaciones con ciclos de vida distintos. | Centro de Contenido + tipos especializados. |
| Medios | MediaVault, AudioLibrary, carga de podcast, imágenes de páginas, vídeo de culto | Proveedores y selección de recursos no son una sola experiencia. | Centro de Medios. |
| Agenda | EventsManager, SchedulesManager, WorshipPlanner, BookingManager | Evento, reunión, culto y espacio pueden duplicarse. | Calendario Operativo. |
| Culto | ProductionBoard, ProPresenterManager, HolyricsConnectionManager, LiveServiceControl, WorshipPlanner | Producción y experiencia pública no comparten suficientemente el estado. | Centro de Culto y Producción. |
| Comunidad | MembersManager, FamiliesManager, MinistryManager, VolunteersManager, GroupsManager, CrmPipelineManager | La ficha de persona y sus relaciones están dispersas. | Centro de Comunidad. |
| Formación | LMSManager, StudyProgramsManager, DiscipleshipManager, OpenResourcesManager, GamesManager, CertificatesManager | Hay varios catálogos y constructores educativos. | Aula/Formación con editor compartido. |
| Comercio | FinanceDashboard, DonationPageManager, StoreManager, PointOfSale, OrdersManager, StoreSettings, InventoryManager | Dinero, productos, existencias y pedidos deben tener un libro común. | Centro Financiero y Comercial. |
| Diseño | AdminSettings, AppearanceTab, ColorsTab, NavigationTab, ComponentLibrary, DesignCatalog, LogosManager, AnimationCatalog | Configuración visual distribuida en varias páginas. | Sistema de Diseño. |

### 2.3. Posibles módulos antiguos por baja integración

Se deben auditar, no eliminar de inmediato:

- `AudioLibrary`.
- `ComponentStylesManager`.
- `DesignCatalog`.
- `AnimationCatalog`.
- `GamesManager` y editores individuales.
- `SchedulesManager`.
- `ContactInbox`.
- `OpenResourceBuilder`.
- `PresentationEditor`.

El criterio de revisión será: ¿usa servicios compartidos?, ¿tiene permisos propios?, ¿tiene datos reales o mocks?, ¿tiene RLS?, ¿su ruta y nombre siguen vigentes?, ¿duplica otro editor?, ¿está conectado a una publicación o workflow?

## 3. Módulos críticos por mejorar

### Nivel P0 — Base que bloquea el resto

1. **Editor de bloques común**
   - Bloques: texto, imagen, vídeo, columnas, separador, botón, galería, audio, formulario, lista, cita, portada.
   - Debe guardar JSON versionado y renderizar igual en administración y público.
   - Debe tener historial, preview, autosave y validación.

2. **Centro de Medios multi-proveedor**
   - Supabase Storage, Cloudflare/R2 si está configurado, URLs externas, YouTube/Facebook, audio local y portapapeles.
   - Debe evitar duplicar archivos y registrar dónde se utiliza cada recurso.

3. **Sistema de permisos y auditoría**
   - Catálogo único de módulos.
   - Permisos de ver, crear, editar, publicar, aprobar, administrar e integrar.
   - Actividad por entidad y usuario.

4. **Modelo de estados y publicaciones**
   - Borrador, revisión, aprobado, programado, publicado, archivado.
   - Aplicable a páginas, blogs, sermones, podcast, anuncios, presentaciones y recursos.

### Nivel P1 — Experiencias centrales para la iglesia

5. **Centro de Culto y Producción**.
6. **Centro de Comunicaciones**.
7. **Centro de Comunidad y Voluntariado**.
8. **Calendario Operativo y Reservas**.
9. **Asistencia simple y check-in**.
10. **Sermones, Podcast y Alabanzas conectados**.

### Nivel P2 — Gobierno y crecimiento

11. **Centro de Estrategia y métricas reales**.
12. **Analítica transversal**.
13. **Sistema de Diseño**.
14. **LMS/Formación con editor compartido**.
15. **Finanzas, tienda e inventario integrados**.

## 4. Unificaciones aprobadas

### A. Centro de Comunicaciones

Debe sustituir la navegación dividida entre contacto, notificaciones, chat, campañas y anuncios.

Vistas:

- Bandeja unificada.
- Conversaciones.
- Notificaciones del sistema.
- Campañas.
- Plantillas.
- Anuncios públicos.
- Automatizaciones.
- Historial de entregas.

No se deben mezclar los datos en una única tabla sin criterio. La unificación será de experiencia y actividad, con entidades de origen bien identificadas.

### B. Centro de Contenido

Debe ser el punto de entrada para crear, revisar y publicar contenido. Cada tipo conserva sus campos específicos, pero comparte:

- Editor.
- Media picker.
- Portada imagen/vídeo.
- Autores y colaboradores.
- Categorías y etiquetas.
- SEO.
- Programación.
- Versiones.
- Preview.
- Analítica.

### C. Centro de Medios

El recurso debe tener un modelo común:

```text
media_asset
  id, provider, kind, url, storage_path
  mime_type, size, width, height, duration
  thumbnail_url, alt_text, title
  owner_id, status, metadata, created_at
```

Proveedores iniciales:

- Supabase Storage.
- Cloudflare/R2, si las credenciales y el bucket existentes son válidos.
- URL externa.
- YouTube/Facebook para vídeo embebido.
- Portapapeles del navegador.
- Carga local de audio e imagen.

### D. Centro de Culto y Producción

Flujo único:

1. Crear culto.
2. Asignar fecha, sede, espacio y responsables.
3. Ordenar segmentos.
4. Vincular alabanzas y arreglos.
5. Preparar letras y pantallas.
6. Conectar Holyrics/ProPresenter.
7. Añadir enlaces de vídeo opcionales.
8. Abrir culto en vivo.
9. Registrar asistencia, oración, preguntas y encuestas.
10. Cerrar culto.
11. Crear borrador de sermón y recursos relacionados para revisión manual.

El resumen de la prédica debe seguir siendo manual; no se agregará resumen asistido por IA sin una solicitud futura explícita.

### E. Centro de Comunidad

La ficha de una persona debe mostrar:

- Datos básicos.
- Familia.
- Ministerios.
- Talentos y habilidades.
- Voluntariado.
- Grupos.
- Asistencia agregada.
- Peticiones y seguimiento permitido.
- Comunicaciones.

La asistencia pública o general puede ser un contador anónimo. El check-in infantil sí requiere un flujo separado y más estricto.

### F. Calendario Operativo

Debe resolver conflictos entre:

- Eventos.
- Reuniones.
- Cultos.
- Voluntariados.
- Reservas de espacios.
- Mantenimiento y arreglos.

La selección de espacio será opcional en eventos, pero cuando exista debe mostrar disponibilidad, capacidad, ubicación, mapa, imágenes y restricciones.

## 5. Plan de implementación por fases

### Fase 0 — Inventario técnico y seguridad

**Objetivo:** saber qué existe antes de consolidar.

Entregables:

- Inventario de tablas, migraciones, rutas y permisos.
- Matriz módulo → ruta → permiso → tabla → responsable.
- Detección de rutas alias y módulos sin ruta real.
- Identificación de mocks, datos demo y consultas directas.
- Aplicación controlada de migraciones pendientes.
- Revisión de RLS por dominio.
- Tipos de Supabase actualizados.

Criterio de aceptación:

- Cada módulo navegable tiene ruta, permiso, tabla principal y estado documentado.
- No hay módulo crítico con RLS desconocido.
- El equipo puede diferenciar dato real, demo y fallback.

### Fase 1 — Servicios compartidos

**Objetivo:** evitar que cada módulo resuelva lo mismo de forma distinta.

Entregables:

- `MediaPicker` y `MediaUploader` multi-proveedor.
- Pegado desde portapapeles.
- `BlockBuilder` y renderer compartidos.
- `EntityStatus` y publicación.
- `ActivityTimeline`.
- `GlobalSearch`.
- `ConfirmDialog`, estados vacíos, carga y errores normalizados.
- Hooks de permisos y entidades comunes.

Criterio de aceptación:

- Página, presentación y publicación usan el mismo formato de bloques.
- Imagen pegada desde el portapapeles se guarda y aparece en la biblioteca.
- Un recurso muestra proveedor y referencias de uso.

### Fase 2 — Centro de Medios

**Objetivo:** unificar imágenes, audio y vídeo.

Entregables:

- Tabla/catálogo de recursos.
- Adaptadores de Supabase y Cloudflare/R2.
- Fallback a URL externa.
- Validación de tamaño y mime type.
- Transformación y miniaturas.
- Waveform de audio generado desde el archivo.
- Selector contextual para portada, cuerpo, audio y vídeo.

Criterio de aceptación:

- Los módulos no suben directamente a un proveedor sin pasar por el catálogo.
- El vídeo solo se muestra cuando hay una fuente válida.
- La portada puede ser imagen o vídeo, sin convertir el vídeo en protagonista permanente.

### Fase 3 — Centro de Contenido

**Objetivo:** modernizar los editores y la publicación.

Orden:

1. `/admin/paginas`.
2. `/admin/publicaciones`.
3. `/admin/sermones`.
4. `/admin/podcast`.
5. `/admin/anuncios`.
6. `/admin/presentacion`.
7. `/admin/recursos-abiertos`.
8. `/admin/formularios`.

Entregables:

- Lista de documentos con búsqueda, filtros y estados.
- Editor completo por bloques.
- Guardado automático y versiones.
- Preview real.
- Portadas configurables.
- Autores y artistas desde listas desplegables.
- Importadores de canciones y formatos de audio/media.
- Enlaces de reutilización entre sermón, podcast, publicación y culto.

Criterio de aceptación:

- Un contenido se crea, previsualiza, revisa, programa y publica sin cambiar de herramienta.
- No hay dos editores que representen el mismo JSON de manera incompatible.

### Fase 4 — Centro de Comunicaciones

**Objetivo:** eliminar bandejas aisladas.

Entregables:

- Bandeja unificada.
- Clasificación por origen y prioridad.
- Asignación a responsables.
- Respuestas y notas internas.
- Plantillas de email/SMS.
- Notificaciones de eventos, formularios, peticiones y reservas.
- Historial de entrega y lectura.

Criterio de aceptación:

- Contacto, notificaciones y campañas se pueden localizar desde una única búsqueda.
- Cada mensaje mantiene su origen y permisos.

### Fase 5 — Comunidad, talentos y asistencia

**Objetivo:** convertir datos de personas en participación útil.

Entregables:

- Vista de talentos y habilidades.
- Necesidades por ministerio, evento o iniciativa.
- Recomendación por disponibilidad y habilidad, sin automatización opaca.
- Voluntariado y turnos.
- Grupos y familias conectados.
- Contador de asistencia anónimo.
- Check-in infantil separado.
- Peticiones con estados, privacidad y seguimiento.

Criterio de aceptación:

- Un coordinador puede encontrar quién puede ayudar sin revisar varios módulos.
- La asistencia general se registra en segundos sin exigir nombres.
- Los datos sensibles no aparecen en paneles agregados.

### Fase 6 — Calendario, espacios y operaciones

**Objetivo:** eliminar conflictos de agenda.

Entregables:

- Calendario central.
- Espacios con ubicación, mapa, imágenes, capacidad y recursos.
- Solicitudes de reserva.
- Estado disponible/ocupado/bloqueado.
- Eventos con espacio opcional.
- Aprobaciones y conflictos.
- Mantenimiento y arreglos relacionados.

Criterio de aceptación:

- Antes de solicitar un espacio se ve su disponibilidad real.
- Un evento puede elegir ubicación sin crear datos duplicados.
- Una reserva aprobada bloquea el espacio en las vistas correspondientes.

### Fase 7 — Centro de Culto y Producción

**Objetivo:** sincronizar la operación presencial y la experiencia pública.

Entregables:

- Planificador de culto.
- Lista de alabanzas.
- Importación sin acordes y con acordes.
- Identificación estructurada de letra/acorde.
- Artistas/autores en listas desplegables.
- Conexión Holyrics.
- Control ProPresenter.
- Letras, anuncios, cámaras y pantallas como estados en vivo.
- Vídeo opcional desde una o varias plataformas.
- Asistencia, peticiones, preguntas y encuestas.
- Cierre manual con borrador de sermón y enlaces multimedia.

Criterio de aceptación:

- Un cambio del culto se refleja en producción y página pública según permisos.
- Si no hay vídeo configurado, no aparece reproductor vacío.
- El usuario puede consultar letras y agenda sin que el reproductor domine la pantalla.

### Fase 8 — Gobierno, estrategia y analítica

**Objetivo:** convertir operaciones en decisiones.

Entregables:

- Centro de Estrategia.
- Indicadores con fuente, periodo, responsable y meta.
- Iniciativas y revisiones.
- Métricas conectadas a eventos, asistencia, voluntariado, contenido y LMS.
- Mapa territorial separado.
- Alertas por objetivos atrasados.
- Exportación y reportes.

Criterio de aceptación:

- Cada KPI muestra de dónde sale y cuándo fue actualizado.
- El tablero no depende de métricas manuales sin procedencia.

### Fase 9 — Formación, comercio y optimización final

**Objetivo:** aplicar los cimientos compartidos a los dominios restantes.

Entregables:

- Block builder común en LMS y recursos.
- Certificados conectados a finalización.
- Libro financiero y conciliación.
- Inventario compartido por tienda y POS.
- Pedidos y envíos.
- Analítica de conversión y donaciones.
- Revisión de rendimiento, accesibilidad y móvil.

## 6. Orden de dependencias

```text
Fase 0 Seguridad/inventario
        ↓
Fase 1 Servicios compartidos
        ↓
Fase 2 Media ───────────────┐
        ↓                   │
Fase 3 Contenido            │
        ↓                   │
Fase 4 Comunicaciones        │
        ↓                   │
Fase 5 Comunidad             │
        ↓                   │
Fase 6 Calendario/espacios   │
        ↓                   │
Fase 7 Culto/producción ←───┘
        ↓
Fase 8 Estrategia/analítica
        ↓
Fase 9 LMS/comercio
```

## 7. Primer sprint de ejecución

El primer sprint debe ser pequeño y verificable:

1. Confirmar y documentar tablas existentes de media, contenido, eventos, espacios, culto y permisos.
2. Crear contrato TypeScript para `MediaAsset`, `ContentDocument`, `PublicationState` y `ActivityEvent`.
3. Auditar qué componentes suben directamente a Supabase Storage.
4. Crear el primer `MediaPicker` reutilizable sin romper los módulos actuales.
5. Añadir selección de imagen/vídeo de portada en un módulo piloto: sermones o publicaciones.
6. Añadir pruebas de proveedor, fallback y validación de URLs.
7. Verificar TypeScript, ESLint, pruebas y una prueba manual en móvil.

## 8. Riesgos y controles

| Riesgo | Control |
|---|---|
| Migrar demasiado código de una vez | Hacer adaptadores y aliases temporales. |
| Romper contenido existente | Versionar JSON y crear migradores explícitos. |
| Duplicar recursos multimedia | Hash, tamaño, proveedor y referencias de uso. |
| Exponer datos pastorales | RLS, vistas agregadas y permisos separados. |
| Integraciones externas inestables | Estados de conexión, timeout, último error y reintento manual. |
| Confundir IA con fuente oficial | El resumen de prédica permanece manual. |
| Menú demasiado grande | Hubs por dominio y área avanzada separada. |
| Degradación móvil | Diseñar primero las acciones críticas y probar con viewport pequeño. |

## 9. Definición de terminado global

Una fase se considera terminada solo cuando:

- El flujo funciona con datos reales.
- Tiene permisos y RLS revisados.
- Tiene estados de carga, vacío, error y éxito.
- Tiene auditoría cuando cambia información sensible.
- Funciona en móvil y escritorio.
- No crea duplicación de entidades o archivos.
- Tiene una ruta de migración para los datos anteriores.
- Pasa TypeScript y ESLint.
- Tiene prueba manual documentada.
- Se actualiza `PROJECT_CONTEXT.md`.

## 10. Próxima acción recomendada

Comenzar por **Fase 0, inventario técnico**, y después implementar el **MediaPicker multi-proveedor** como primer servicio compartido. Es la dependencia que desbloquea páginas, publicaciones, sermones, podcast, presentaciones, reservas, culto en vivo y recursos educativos.

## 11. Estado de ejecución

- **Fase 0:** completada en alcance inicial. El diagnóstico detallado está en [`PHASE_0_AUDIT.md`](./PHASE_0_AUDIT.md).
- **Fase 1:** en ejecución. Se creó [`MediaAssetPicker.tsx`](../src/components/admin/MediaAssetPicker.tsx) y se integró en Anuncios, Publicaciones y Reservas.
- **Siguiente integración:** Sermones y Podcast, verificando audio, miniaturas, duración y límites de almacenamiento antes de migrar sus cargas.
