import { z } from 'zod';
import { callStore, StoreRejectedError } from './checkoutService';

const point = z.object({ key: z.string(), variant_id: z.string().nullable(), label: z.string(), stock: z.number().int(), revision: z.number() });
const count = z.object({ id: z.string(), state: z.enum(['draft', 'committed', 'cancelled']), snapshot: z.array(point), observed: z.record(z.string(), z.number()), reason: z.string(), created_at: z.string(), created_by: z.string(), created_by_name: z.string().nullable(), committed_by: z.string().nullable(), committed_by_name: z.string().nullable(), committed_at: z.string().nullable() });
const detail = z.object({
  product_id: z.string(), reserved: z.number(), points: z.array(point),
  profile: z.object({ location: z.string().optional(), minimum: z.number().optional(), notes: z.string().optional(), custom_fields: z.record(z.string(), z.unknown()).optional(), last_count_at: z.string().nullable().optional(), last_count_by: z.string().nullable().optional(), last_count_name: z.string().nullable().optional() }),
  counts: z.array(count),
  reservations: z.array(z.object({ variant_id: z.string().nullable(), quantity: z.number(), state: z.string(), expires_at: z.string() })),
  movements: z.array(z.object({ id: z.string(), variant_id: z.string().nullable(), movement_type: z.string(), quantity: z.number(), previous_stock: z.number(), new_stock: z.number(), reason: z.string().nullable(), actor_id: z.string().nullable(), created_by_name: z.string().nullable(), reference_order_id: z.string().nullable(), created_at: z.string(), sequence_no: z.number() })),
});
export type InventoryDetail = z.infer<typeof detail>;
export type InventoryCount = z.infer<typeof count>;
export type InventoryAction = 'inventory_profile' | 'inventory_move' | 'inventory_count_start' | 'inventory_count_save' | 'inventory_count_commit' | 'inventory_count_cancel';
interface PendingInventory { action: InventoryAction; payload: Record<string, unknown> }
const actions: InventoryAction[] = ['inventory_profile', 'inventory_move', 'inventory_count_start', 'inventory_count_save', 'inventory_count_commit', 'inventory_count_cancel'];
const key = (userId: string) => `jerusalen-inventory-pending:${userId}`;
export function readInventoryPending(userId: string): PendingInventory | null {
  const raw = sessionStorage.getItem(key(userId));
  if (!raw) return null;
  const parsed: unknown = JSON.parse(raw);
  const pending = z.object({ action: z.enum(actions), payload: z.record(z.string(), z.unknown()) }).parse(parsed);
  return pending;
}
export async function getInventory(productId: string): Promise<InventoryDetail> {
  return detail.parse(await callStore('inventory_read', { product_id: productId }));
}
export async function mutateInventory(userId: string, action?: InventoryAction, payload?: Record<string, unknown>): Promise<InventoryDetail> {
  let pending = readInventoryPending(userId);
  if (pending && action) throw new Error('Hay una operación sin confirmar. Recupera su resultado antes de registrar otra.');
  if (!pending) {
    if (!action || !payload) throw new Error('No hay una operación pendiente');
    pending = { action, payload: { ...payload, operation_id: crypto.randomUUID() } };
    sessionStorage.setItem(key(userId), JSON.stringify(pending));
  }
  try {
    const result = detail.parse(await callStore(pending.action, pending.payload));
    sessionStorage.removeItem(key(userId));
    return result;
  } catch (error) {
    if (error instanceof StoreRejectedError) sessionStorage.removeItem(key(userId));
    throw error;
  }
}
