export type MinistryExpenseStatus = 'solicitado' | 'aprobado' | 'rechazado' | 'pagado';
export type MinistryExpenseCategory = 'equipos' | 'materiales' | 'eventos' | 'transporte' | 'alimentacion' | 'servicios' | 'otros';

export interface MinistryOption { id: string; name: string; category?: string; }

export interface MinistryBudget {
  id: string;
  ministerio_id: string;
  ministerio_nombre: string;
  periodo_inicio: string;
  periodo_fin: string;
  monto_asignado: number;
  monto_gastado: number;
  monto_pendiente: number;
  moneda: string;
  notas: string | null;
  creado_por: string | null;
  created_at: string;
}

export interface MinistryExpense {
  id: string;
  presupuesto_id: string | null;
  ministerio_id: string;
  titulo: string;
  descripcion: string | null;
  categoria: MinistryExpenseCategory;
  monto: number;
  moneda: string;
  estado: MinistryExpenseStatus;
  link_producto: string | null;
  imagen_comprobante: string | null;
  solicitado_por: string | null;
  solicitado_nombre: string | null;
  aprobado_por: string | null;
  aprobado_at: string | null;
  pagado_at: string | null;
  nota_aprobacion: string | null;
  created_at: string;
}

export const EXPENSE_CATEGORIES: Array<{ value: MinistryExpenseCategory; label: string; icon: string }> = [
  { value: 'equipos', label: 'Equipos', icon: '◈' },
  { value: 'materiales', label: 'Materiales', icon: '▦' },
  { value: 'eventos', label: 'Eventos', icon: '✦' },
  { value: 'transporte', label: 'Transporte', icon: '→' },
  { value: 'alimentacion', label: 'Alimentación', icon: '○' },
  { value: 'servicios', label: 'Servicios', icon: '⌁' },
  { value: 'otros', label: 'Otros', icon: '·' }
];
