export type IdeaPriority = 'baja' | 'normal' | 'alta' | 'urgente';
export type IdeaStatus = 'nueva' | 'en_revision' | 'aprobada' | 'rechazada' | 'implementada';
export type IdeaCategory = 'recurso' | 'propuesta' | 'necesidad' | 'evento' | 'mejora' | 'otro';

export interface IdeaAttachment {
  id: string;
  idea_id: string;
  tipo: 'imagen' | 'video_url' | 'archivo' | 'link';
  url: string;
  nombre_archivo: string | null;
  tamano_bytes: number | null;
  mime_type: string | null;
  link_titulo: string | null;
  link_descripcion: string | null;
  link_imagen_preview: string | null;
  link_dominio: string | null;
  video_embed_id: string | null;
  video_plataforma: 'youtube' | 'vimeo' | null;
  video_thumbnail: string | null;
  orden: number;
  created_at: string;
}

export interface IdeaTag { id: string; idea_id: string; etiqueta: string; }

export interface Idea {
  id: string;
  titulo: string;
  descripcion: string | null;
  contenido_rico: Record<string, unknown> | null;
  autor_id: string | null;
  autor_nombre: string;
  autor_avatar: string | null;
  departamento: string;
  categoria: IdeaCategory;
  prioridad: IdeaPriority;
  estado: IdeaStatus;
  es_anonima: boolean;
  votos_count: number;
  comentarios_count: number;
  vistas_count: number;
  monto_estimado: number | null;
  moneda: string;
  fecha_limite: string | null;
  color_card: string;
  es_fijada: boolean;
  created_at: string;
  updated_at: string;
  adjuntos: IdeaAttachment[];
  etiquetas: IdeaTag[];
}

export interface IdeaComment {
  id: string;
  idea_id: string;
  padre_id: string | null;
  autor_id: string | null;
  autor_nombre: string;
  autor_avatar: string | null;
  contenido: string;
  es_resolucion: boolean;
  created_at: string;
  updated_at: string;
}

export interface IdeaHistory {
  id: string;
  idea_id: string;
  usuario_id: string | null;
  usuario_nombre: string;
  estado_anterior: IdeaStatus | null;
  estado_nuevo: IdeaStatus | null;
  nota: string | null;
  created_at: string;
}

export interface IdeaNotification {
  id: string;
  usuario_id: string;
  idea_id: string | null;
  tipo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

export const IDEA_DEPARTMENTS = ['adoracion', 'evangelismo', 'jovenes', 'educacion_cristiana', 'servicio_social', 'finanzas', 'comunicaciones', 'pastoral', 'misiones', 'general'] as const;
export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = { nueva: 'Nueva', en_revision: 'En revisión', aprobada: 'Aprobada', rechazada: 'Rechazada', implementada: 'Implementada' };
export const IDEA_PRIORITY_LABELS: Record<IdeaPriority, string> = { baja: 'Baja', normal: 'Normal', alta: 'Alta', urgente: 'Urgente' };
export const IDEA_CATEGORY_LABELS: Record<IdeaCategory, string> = { recurso: 'Recurso / compra', propuesta: 'Propuesta', necesidad: 'Necesidad', evento: 'Evento', mejora: 'Mejora', otro: 'Otro' };
