import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import {
  movementSchema,
  validateProof,
  monthEnd,
  type MovementInput,
} from './model';

const nullableText = z.string().nullable();
const fund = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['tithe', 'offering']),
  restricted: z.boolean(),
  active: z.boolean(),
});
const budget = z.object({
  id: z.string(),
  fund_id: z.string(),
  month: z.string(),
  amount: z.coerce.number(),
  category: z.string(),
});
const recurring = z.object({
  id: z.string(),
  fund_id: z.string(),
  category: z.string(),
  description: z.string(),
  beneficiary: nullableText,
  amount: z.coerce.number(),
  method: z.enum(['cash', 'transfer']),
  day: z.number(),
  starts_on: z.string(),
  ends_on: nullableText,
  active: z.boolean(),
});
const movement = movementSchema.extend({
  version: z.number(),
  receipt_number: z.string(),
  created_at: z.string(),
});
const notice = z.object({
  id: z.string(),
  message: z.string(),
  created_at: z.string(),
  read_at: nullableText,
});
const audit = z.object({
  id: z.string(),
  movement_id: nullableText,
  action: z.string(),
  actor_id: nullableText,
  reason: nullableText,
  created_at: z.string(),
});
export function useFinanceAccess() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['finance-access', user?.id],
    enabled: Boolean(user),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('finance_access');
      if (error) throw error;
      return z.object({ view: z.boolean(), edit: z.boolean() }).parse(data);
    },
  });
}
export async function loadFunds() {
  const { data, error } = await supabase
    .from('finance_funds')
    .select('*')
    .order('name');
  if (error) throw error;
  return z.array(fund).parse(data);
}
export async function loadMovements(
  start: string,
  end: string,
  userId?: string,
) {
  const records = [];
  for (let offset = 0; offset < 50000; offset += 500) {
    let query = supabase
      .from('finance_movements')
      .select('*')
      .gte(userId ? 'contribution_month' : 'occurred_on', start)
      .lte(userId ? 'contribution_month' : 'occurred_on', end)
      .order('occurred_on', { ascending: false })
      .order('id')
      .range(offset, offset + 499);
    if (userId) query = query.eq('user_id', userId).eq('kind', 'income');
    const { data, error } = await query;
    if (error) throw error;
    const page = z.array(movement).parse(data);
    records.push(...page);
    if (page.length < 500) return records;
  }
  throw new Error(
    'El período supera 50.000 movimientos. Reduce el rango para obtener un reporte completo.',
  );
}
export async function loadAdminMonth(month: string) {
  const [movements, budgetResult, recurringResult, periodResult] =
    await Promise.all([
      loadMovements(month, monthEnd(month)),
      supabase.from('finance_budgets').select('*').eq('month', month),
      supabase.from('finance_recurring').select('*').order('description'),
      supabase
        .from('finance_periods')
        .select('month')
        .eq('month', month)
        .maybeSingle(),
    ]);
  if (budgetResult.error) throw budgetResult.error;
  if (recurringResult.error) throw recurringResult.error;
  if (periodResult.error) throw periodResult.error;
  return {
    movements,
    budgets: z.array(budget).parse(budgetResult.data),
    recurring: z.array(recurring).parse(recurringResult.data),
    closed: Boolean(periodResult.data),
  };
}
export async function saveMovement(input: MovementInput, version?: number) {
  const values = movementSchema.parse(input);
  const query =
    version == null
      ? supabase.from('finance_movements').insert(values)
      : supabase
          .from('finance_movements')
          .update(values)
          .eq('id', values.id)
          .eq('version', version);
  const { data, error } = await query.select('*').single();
  if (error)
    throw new Error(
      `${error.message}. Si otro usuario modificó el registro, actualiza antes de reintentar.`,
    );
  return movement.parse(data);
}
export async function uploadProof(file: File, userId: string) {
  validateProof(file);
  const extension = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  }[file.type];
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from('finance-proofs')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}
export async function proofLink(path: string) {
  const { data, error } = await supabase.storage
    .from('finance-proofs')
    .createSignedUrl(path, 60);
  if (error) throw error;
  if (!data?.signedUrl)
    throw new Error('No se pudo abrir el comprobante privado.');
  return data.signedUrl;
}
export async function loadNotices() {
  const reminder = await supabase.rpc('finance_refresh_my_reminder');
  if (reminder.error) throw reminder.error;
  const { data, error } = await supabase
    .from('finance_notices')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return z.array(notice).parse(data);
}
export async function loadAudit() {
  const { data, error } = await supabase
    .from('finance_audit')
    .select('id,movement_id,action,actor_id,reason,created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return z.array(audit).parse(data);
}
export async function loadPeople() {
  const { data, error } = await supabase.rpc('finance_people');
  if (error) throw error;
  return z
    .array(z.object({ id: z.string(), name: z.string(), email: nullableText }))
    .parse(data);
}
export async function generateDue() {
  const { error } = await supabase.rpc('finance_generate_due');
  if (error) throw error;
}
export const messageOf = (error: unknown) =>
  error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String(error.message)
      : 'La operación no pudo completarse.';
