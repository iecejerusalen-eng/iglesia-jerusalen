import { format } from 'date-fns';
import { supabase } from '../../config/supabase';
import type { MinistryBudget, MinistryExpense, MinistryOption, MinistryExpenseStatus } from './types';

export const monthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { inicio: format(start, 'yyyy-MM-dd'), fin: format(end, 'yyyy-MM-dd') };
};

const asBudget = (row: Record<string, unknown>): MinistryBudget => ({ ...row, monto_asignado: Number(row.monto_asignado ?? 0), monto_gastado: Number(row.monto_gastado ?? 0), monto_pendiente: Number(row.monto_pendiente ?? 0), moneda: String(row.moneda ?? 'USD') } as MinistryBudget);
const asExpense = (row: Record<string, unknown>): MinistryExpense => ({ ...row, monto: Number(row.monto ?? 0) } as MinistryExpense);

export async function listMinistries(): Promise<MinistryOption[]> {
  const { data, error } = await supabase.from('ministries').select('id,name,category').order('name');
  if (error) throw new Error(`No se pudieron cargar los ministerios: ${error.message}`);
  return (data ?? []) as MinistryOption[];
}

export async function getMyMinistry(): Promise<MinistryOption | null> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`No se pudo validar la sesión: ${authError.message}`);
  if (!auth.user) return null;
  const { data, error } = await supabase.from('profiles').select('ministry_id').eq('id', auth.user.id).single();
  if (error) throw new Error(`No se pudo cargar tu ministerio: ${error.message}`);
  if (!data?.ministry_id) return null;
  const { data: ministry, error: ministryError } = await supabase.from('ministries').select('id,name,category').eq('id', data.ministry_id).single();
  if (ministryError) throw new Error(`No se pudo cargar el ministerio: ${ministryError.message}`);
  return ministry as MinistryOption;
}

export async function listBudgets(range = monthRange()): Promise<MinistryBudget[]> {
  const { data, error } = await supabase.from('ministerio_presupuestos').select('*').eq('periodo_inicio', range.inicio).order('ministerio_nombre');
  if (error) throw new Error(`No se pudieron cargar los presupuestos: ${error.message}`);
  return (data ?? []).map((row) => asBudget(row as Record<string, unknown>));
}

export async function listExpenses(ministryId?: string, range = monthRange()): Promise<MinistryExpense[]> {
  let query = supabase.from('ministerio_gastos').select('*').gte('created_at', `${range.inicio}T00:00:00`).lte('created_at', `${range.fin}T23:59:59`).order('created_at', { ascending: false });
  if (ministryId) query = query.eq('ministerio_id', ministryId);
  const { data, error } = await query;
  if (error) throw new Error(`No se pudieron cargar las solicitudes: ${error.message}`);
  return (data ?? []).map((row) => asExpense(row as Record<string, unknown>));
}

export async function createExpense(payload: { presupuesto_id: string | null; ministerio_id: string; titulo: string; descripcion: string; categoria: string; monto: number; moneda: string; link_producto: string; imagen_comprobante: string | null; solicitado_por: string; solicitado_nombre: string }): Promise<void> {
  const { error } = await supabase.from('ministerio_gastos').insert({ ...payload, estado: 'solicitado' });
  if (error) throw new Error(`No se pudo crear la solicitud: ${error.message}`);
}

export async function saveBudget(payload: { ministerio_id: string; ministerio_nombre: string; periodo_inicio: string; periodo_fin: string; monto_asignado: number; moneda: string; notas: string; creado_por: string }): Promise<void> {
  const { error } = await supabase.from('ministerio_presupuestos').upsert(payload, { onConflict: 'ministerio_id,periodo_inicio' });
  if (error) throw new Error(`No se pudo asignar el presupuesto: ${error.message}`);
}

export async function updateExpenseStatus(id: string, estado: MinistryExpenseStatus, note: string): Promise<void> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error(authError?.message ?? 'La sesión expiró.');
  const update: Record<string, string | null> = { estado, nota_aprobacion: note || null };
  if (estado === 'aprobado') { update.aprobado_por = auth.user.id; update.aprobado_at = new Date().toISOString(); }
  if (estado === 'pagado') update.pagado_at = new Date().toISOString();
  const { error } = await supabase.from('ministerio_gastos').update(update).eq('id', id);
  if (error) throw new Error(`No se pudo actualizar el gasto: ${error.message}`);
}

export async function uploadReceipt(file: File, userId: string): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('budget-receipts').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`No se pudo subir el comprobante: ${error.message}`);
  return path;
}
