# Fase 0 — Inventario técnico y diagnóstico verificable

Fecha: 2026-08-24

## Alcance revisado

Se revisaron:

- `src/config/adminModules.ts`.
- `src/routes/AppRouter.tsx`.
- `src/components/common/MediaUploader.tsx`.
- `src/components/admin/MediaSearchModal.tsx`.
- `src/lib/mediaService.ts`.
- `src/lib/cloudinaryService.ts`.
- `src/lib/mediaProviderPreference.ts`.
- `src/pages/admin/MediaVault.tsx`.
- Integraciones de `MediaUploader` en páginas públicas y administrativas.
- Migraciones de catálogo multimedia y Storage.

## Hallazgo principal

La plataforma ya tiene una primera implementación de proveedores multimedia. No se debe construir un sistema paralelo desde cero. La estrategia correcta es endurecer y convertir la implementación actual en un servicio común.

### Lo que ya existe

- Proveedores declarados: Cloudinary, Supabase Storage y Cloudflare R2.
- Preferencia de proveedor persistida en `localStorage`.
- Subida local mediante `MediaUploader`.
- Pegado de imágenes desde el portapapeles cuando el botón está enfocado.
- Catálogo central en `media_vault_files`.
- Migración de proveedor, carpeta, ruta, metadata y usuario que sube el recurso.
- Bóveda administrativa con filtro de proveedor.
- `MediaSearchModal` para URLs, imágenes externas, presets, stock y recursos de la iglesia.
- Carga de audio y otros recursos mediante el servicio de media en algunos flujos.

## Problemas confirmados

### 1. El servicio común todavía no es obligatorio

Hay módulos que usan `MediaUploader`, pero otros escriben directamente en Storage, construyen URLs de Supabase o manejan URLs externas sin pasar por el catálogo. Esto impide saber dónde se usa un archivo y dificulta cambiar de proveedor.

**Decisión:** crear adaptadores y migrar progresivamente; no hacer un reemplazo masivo en una sola fase.

### 2. El catálogo no es todavía un asset registry completo

`media_vault_files` registra URL, proveedor, carpeta y metadata básica, pero el servicio aún no modela de forma uniforme:

- Dimensiones.
- Duración de audio/vídeo.
- Miniatura.
- Texto alternativo.
- Hash o deduplicación.
- Referencias de uso.
- Estado de procesamiento.
- Último error del proveedor.

### 3. Proveedores con comportamientos diferentes

- Cloudinary usa widget o API directa.
- Supabase usa bucket público `media_library`.
- R2 depende de `VITE_R2_UPLOAD_ENDPOINT`.
- URLs externas no pasan necesariamente por un registro común.

La interfaz actual muestra proveedores de forma simple, pero no comunica con suficiente claridad si están configurados, disponibles, degradados o desconectados.

### 4. Pegado desde portapapeles es funcional, pero limitado

Actualmente el pegado se procesa en el botón de subida. El usuario debe enfocar ese botón y presionar `Ctrl+V`/`Cmd+V`. Esto funciona para imágenes del portapapeles, pero todavía faltan:

- Zona de pegado explícita.
- Estado visual “pega aquí”.
- Manejo de navegadores sin permisos de portapapeles.
- Mensaje cuando el portapapeles contiene texto o un archivo no compatible.
- Posibilidad de pegar directamente en el Media Hub.

### 5. Audio no está normalizado entre proveedores

El servicio reconoce `raw`, pero el bucket `media_library` de la migración de catálogo declara principalmente imágenes, vídeo y PDF. Debe verificarse que audio tenga bucket, mime types, límites y políticas consistentes.

### 6. Catalogación parcial después de Cloudinary

En el widget de Cloudinary el recurso se sube primero y se registra después. Si falla el registro, el archivo queda en el proveedor sin aparecer correctamente en la biblioteca. El usuario recibe un aviso, pero no hay cola de reparación ni reconciliación automática.

### 7. No existe todavía un selector de assets como contrato universal

`MediaSearchModal` y `MediaUploader` resuelven problemas cercanos, pero no son el mismo componente:

- `MediaUploader`: sube.
- `MediaSearchModal`: busca/selecciona URL, stock y recursos.
- `MediaVault`: administra archivos.

Los módulos necesitan una interfaz común que permita seleccionar un recurso existente, subir uno nuevo o pegar una URL.

## Matriz inicial de módulos multimedia

| Área | Componentes o páginas | Situación | Próxima acción |
|---|---|---|---|
| Programas | `ProgramForm`, `StudyProgramBuilder` | Usa `MediaUploader`. | Migrar al selector común cuando exista. |
| Anuncios | `ChurchAnnouncementsManager` | Usa uploader y URL manual. | Incorporar asset picker y portada tipo imagen/vídeo. |
| Editorial | `EditorialWorkspace` | Usa uploader en varios puntos. | Centralizar portada, cuerpo y galería. |
| Recursos abiertos | `OpenResourcesManager` | Usa uploader en varios formularios. | Compartir metadata y referencias. |
| Tienda | `ProductForm` | Tiene varias cargas de imágenes. | Unificar galería y proveedor. |
| Reservas | `BookingManager` | Usa uploader y pegado contextual. | Registrar imágenes como assets de espacios. |
| Ministerios | `MinistryManager` | Usa uploader. | Conectar al catálogo de logos/portadas. |
| Donaciones | `Donations` | Usa uploader en flujo público. | Revisar permisos y separar recurso público/privado. |
| Logos | `LogoGrid`, `LogoUploadForm` | Usa bucket `logos` directamente. | Adaptar al catálogo sin romper URLs existentes. |
| Inventario | `InventoryManager` | Usa Storage directo para ciertos archivos. | Migrar con adaptador y trazabilidad. |
| Presentaciones | `PresentationEditor` | Gestiona imágenes/vídeos dentro del editor. | Usar `MediaAsset` y picker común. |
| Media Vault | `MediaVault` | Administra catálogo actual. | Convertir en biblioteca y selector universal. |

## Matriz de permisos a revisar

| Dominio | Riesgo | Revisión necesaria |
|---|---|---|
| Media Vault | Recursos pueden ser públicos por URL | Definir público, privado y firmado. |
| Donaciones | Archivo potencialmente sensible | No reutilizar assets privados como públicos. |
| Inventario | Documentos internos | Separar media pública de documentos operativos. |
| Logos y marca | Bajo riesgo, alto impacto | Permisos de edición y publicación. |
| Sermones/Podcast | Publicación pública | Estado editorial y aprobación. |
| Culto en Vivo | Fuentes externas | Validar URLs y no mostrar reproductor vacío. |

## Entregables de la Fase 0

- Este diagnóstico verificable.
- `PROJECT_CONTEXT.md` actualizado con el plan general.
- `IMPLEMENTATION_PLAN.md` con fases y criterios de aceptación.
- Identificación del código reutilizable existente.
- Decisión de evolución incremental del servicio multimedia.

## Fase 1 inmediata

1. Definir `MediaAsset` extendido sin romper el contrato actual.
2. Crear `MediaAssetPicker` que combine biblioteca, subida, URL y portapapeles.
3. Convertir `MediaUploader` en adaptador de compatibilidad.
4. Registrar dimensiones, duración, miniatura y metadata cuando el navegador pueda obtenerlas.
5. Añadir estado de proveedor configurado/degradado.
6. Añadir pruebas unitarias del clasificador de recurso y validación de proveedor.
7. Migrar primero anuncios, publicaciones y reservas.
8. Verificar con TypeScript, ESLint y pruebas manuales.

## Criterio para continuar

La Fase 0 se considera cerrada porque ya existe un inventario verificable y una decisión de arquitectura. La Fase 1 no debe crear otra tabla paralela ni otra subida aislada: debe fortalecer `media_vault_files`, `mediaService` y los componentes comunes actuales.
