export type BulletinStatus = 'borrador' | 'aprobado' | 'enviado';

export interface BulletinEvent {
  id?: string;
  nombre: string;
  fecha: string;
  hora?: string | null;
  lugar?: string | null;
}

export interface BulletinBirthday {
  id?: string;
  nombre: string;
  fecha: string;
}

export interface Bulletin {
  id: string;
  fecha_culto: string;
  titulo_mensaje: string | null;
  expositor: string | null;
  versiculo_texto: string | null;
  versiculo_referencia: string | null;
  eventos: BulletinEvent[];
  anuncio_titulo: string | null;
  anuncio_descripcion: string | null;
  cumpleaneros: BulletinBirthday[];
  ofrendas_objetivo: string | null;
  mensaje_pastoral: string | null;
  foto_pastor: string | null;
  estado: BulletinStatus;
  generado_automaticamente: boolean;
  aprobado_por: string | null;
  aprobado_at: string | null;
  url_pdf: string | null;
  url_imagen_wa: string | null;
  created_at: string;
  updated_at: string;
}

export interface BulletinDraft {
  fecha_culto: string;
  titulo_mensaje: string;
  expositor: string;
  versiculo_texto: string;
  versiculo_referencia: string;
  eventos: BulletinEvent[];
  anuncio_titulo: string;
  anuncio_descripcion: string;
  cumpleaneros: BulletinBirthday[];
  ofrendas_objetivo: string;
  mensaje_pastoral: string;
  foto_pastor: string;
  estado: BulletinStatus;
}
