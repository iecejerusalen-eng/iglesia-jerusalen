import type { Widget } from './types';

export const COLORS = ['#1e3a8a', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

export const PRESETS: Widget[] = [
  { id: 'p1', title: 'Total Miembros (KPI)', source: 'members', dimension: 'gender', metric: 'Conteo', aggregation: 'count', targetField: '', chartType: 'kpi' },
  { id: 'p2', title: 'Distribución por Edad', source: 'members', dimension: 'age_group', metric: 'Conteo', aggregation: 'count', targetField: '', chartType: 'pie' },
  { id: 'p3', title: 'Roles de Liderazgo', source: 'members', dimension: 'leadership_role', metric: 'Conteo', aggregation: 'count', targetField: '', chartType: 'bar' },
  { id: 'p4', title: 'Ingresos Históricos (Mes)', source: 'donations', dimension: 'month', metric: 'Suma Montos', aggregation: 'sum', targetField: 'amount', chartType: 'area' },
  { id: 'p5', title: 'Métodos de Pago Preferidos', source: 'donations', dimension: 'payment_method', metric: 'Conteo', aggregation: 'count', targetField: '', chartType: 'pie' },
  { id: 'p6', title: 'Crecimiento de Miembros (Mes)', source: 'members', dimension: 'month', metric: 'Conteo', aggregation: 'count', targetField: '', chartType: 'line' },
  { id: 'p7', title: 'Estado del Inventario', source: 'inventory', dimension: 'status', metric: 'Conteo', aggregation: 'count', targetField: '', chartType: 'bar' },
  { id: 'p8', title: 'Respuestas a Cuestionarios (Mes)', source: 'form_responses', dimension: 'month', metric: 'Conteo', aggregation: 'count', targetField: '', chartType: 'area' }
];
