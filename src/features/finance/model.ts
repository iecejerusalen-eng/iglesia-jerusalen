import { z } from 'zod';

export const movementSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(['income', 'expense']),
  fund_id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  amount: z.coerce.number().finite().positive().max(100000000),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  contribution_month: z
    .string()
    .regex(/^\d{4}-\d{2}-01$/)
    .nullable(),
  method: z.enum(['cash', 'transfer']),
  status: z.enum(['pending', 'confirmed', 'void']),
  category: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(1000),
  reference: z.string().trim().max(120).nullable(),
  proof_path: z.string().nullable(),
  beneficiary: z.string().trim().max(160).nullable(),
  correction_reason: z.string().trim().max(500).nullable(),
});
export type MovementInput = z.infer<typeof movementSchema>;
export interface Movement extends MovementInput {
  version: number;
  receipt_number: string;
  created_at: string;
}
export interface Fund {
  id: string;
  name: string;
  kind: 'tithe' | 'offering';
  restricted: boolean;
  active: boolean;
}
export interface Budget {
  id: string;
  fund_id: string;
  month: string;
  amount: number;
  category: string;
}
export interface RecurringExpense {
  id: string;
  fund_id: string;
  category: string;
  description: string;
  beneficiary: string | null;
  amount: number;
  method: 'cash' | 'transfer';
  day: number;
  starts_on: string;
  ends_on: string | null;
  active: boolean;
}
export interface FinanceNotice {
  id: string;
  message: string;
  created_at: string;
  read_at: string | null;
}
export interface AuditEntry {
  id: string;
  movement_id: string | null;
  action: string;
  actor_id: string | null;
  reason: string | null;
  created_at: string;
}
export interface FinancePerson {
  id: string;
  name: string;
  email: string | null;
}
export const money = (value: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(
    value,
  );
export function todayInEcuador() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export const currentMonth = () => todayInEcuador().slice(0, 7) + '-01';
export function monthStart(value: string) {
  return value.slice(0, 7) + '-01';
}
export function monthEnd(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}
export function summarize(movements: Movement[]) {
  const confirmed = movements.filter((item) => item.status === 'confirmed');
  const sum = (kind: string, method?: string) =>
    confirmed
      .filter(
        (item) => item.kind === kind && (!method || item.method === method),
      )
      .reduce(
        (total, item) => total + Math.round(Number(item.amount) * 100),
        0,
      ) / 100;
  return {
    income: sum('income'),
    expenses: sum('expense'),
    net: Math.round((sum('income') - sum('expense')) * 100) / 100,
    cash:
      Math.round((sum('income', 'cash') - sum('expense', 'cash')) * 100) / 100,
    bank:
      Math.round(
        (sum('income', 'transfer') - sum('expense', 'transfer')) * 100,
      ) / 100,
    pending: movements.filter((item) => item.status === 'pending').length,
  };
}
export function titheCalendar(
  movements: Movement[],
  funds: Fund[],
  year: number,
) {
  const titheIds = new Set(
    funds.filter((fund) => fund.kind === 'tithe').map((fund) => fund.id),
  );
  return Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, '0')}-01`;
    const records = movements.filter(
      (item) =>
        item.kind === 'income' &&
        titheIds.has(item.fund_id) &&
        item.contribution_month === month,
    );
    const amount =
      records
        .filter((item) => item.status === 'confirmed')
        .reduce((sum, item) => sum + Math.round(Number(item.amount) * 100), 0) /
      100;
    return {
      month,
      amount,
      status: records.some((item) => item.status === 'confirmed')
        ? 'confirmed'
        : records.some((item) => item.status === 'pending')
          ? 'pending'
          : 'none',
    };
  });
}
export const expenseCategories = [
  'Remuneración pastoral',
  'Remuneración de líderes',
  'Suscripciones',
  'Internet',
  'Servicios básicos',
  'Ayuda solidaria',
  'Construcción',
  'Misiones',
  'Mantenimiento',
  'Otros',
];
export function validateProof(file: File) {
  if (
    !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(
      file.type,
    )
  )
    throw new Error('Usa una imagen JPG, PNG, WebP o un PDF.');
  if (file.size > 5 * 1024 * 1024 || file.size === 0)
    throw new Error('El comprobante debe ocupar entre 1 byte y 5 MB.');
}
