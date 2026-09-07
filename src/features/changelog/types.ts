export type ChangelogType = 'nuevo' | 'mejora' | 'correccion' | 'eliminado' | 'seguridad' | 'rendimiento';
export type ChangelogStatus = 'borrador' | 'publicado';

export interface ChangelogChange {
  id: string;
  version_id: string;
  tipo: ChangelogType;
  titulo: string;
  descripcion: string;
  descripcion_tecnica: string | null;
  link_interno: string | null;
  link_texto: string | null;
  link_externo: string | null;
  imagen_url: string | null;
  video_url: string | null;
  departamento: string | null;
  es_destacado: boolean;
  orden: number;
}

export interface ChangelogVersion {
  id: string;
  version: string;
  titulo: string;
  resumen: string;
  fecha_lanzamiento: string;
  estado: ChangelogStatus;
  es_mayor: boolean;
  imagen_portada: string | null;
  color_acento: string;
  autor_nombre: string | null;
  vistas: number;
  cambios: ChangelogChange[];
  reacciones?: Record<string, number>;
}

export const CHANGE_TYPES: Array<{ value: ChangelogType; label: string; emoji: string; className: string }> = [
  { value: 'nuevo', label: 'Nuevo', emoji: '🟢', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'mejora', label: 'Mejora', emoji: '🔵', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'correccion', label: 'Corrección', emoji: '🟡', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'eliminado', label: 'Eliminado', emoji: '🔴', className: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'seguridad', label: 'Seguridad', emoji: '🟣', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'rendimiento', label: 'Rendimiento', emoji: '⚡', className: 'bg-orange-50 text-orange-700 border-orange-200' },
];
