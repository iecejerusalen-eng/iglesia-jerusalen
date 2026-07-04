export type CertificateType = 'bautismo' | 'dedicacion' | 'matrimonio' | 'membresia' | 'graduacion_escuela_dominical' | 'ordenacion' | 'reconocimiento_servicio' | 'diploma' | 'custom';

export type FontAlignment = 'left' | 'center' | 'right';
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

export interface FieldMapping {
  id: string;
  label: string;
  key: string;
  memberField: string; // Ej: 'first_name', 'full_name', 'baptism_date', 'custom_*'
  x: number;
  y: number;
  fontSize: number;
  fontId: string | null;
  color: string; // '#000000'
  alignment: FontAlignment;
  maxWidth: number;
  transform: TextTransform;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  type: CertificateType;
  pdf_url: string;
  cloudinary_public_id: string | null;
  page_width: number;
  page_height: number;
  field_mappings: FieldMapping[];
  font_config: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CertificateFont {
  id: string;
  name: string;
  family: string;
  weight: string;
  font_url: string;
  cloudinary_public_id: string | null;
  format: 'ttf' | 'otf';
  created_at: string;
}
