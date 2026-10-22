import { supabase } from '../../../config/supabase';
import type { Order } from '../../../types';
import { validateReceipt } from '../catalog';

export interface SecureOrder extends Order {
  subtotal: number;
  tax_total: number;
  payment_fee: number;
  shipping_cost: number;
  reservation_expires_at: string | null;
  receipt_storage_path: string | null;
  bank?: { bank_name: string; bank_account: string; ruc: string | null };
}
export interface CheckoutPayload {
  name: string;
  email: string;
  phone: string;
  delivery: 'pickup' | '';
  expected_total: number;
  items: { product_id: string; variant_id: string | null; quantity: number }[];
}
export interface PendingCheckout {
  requestId: string;
  secret: string;
  identity: string;
  fingerprint: string;
  orderId?: string;
}
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
export class StoreRejectedError extends Error {}
const isOrder = (value: unknown): value is SecureOrder => record(value) && typeof value.id === 'string'
  && typeof value.total === 'number' && typeof value.customer_name === 'string'
  && typeof value.status === 'string' && ['pending_payment', 'paid', 'ready_for_pickup', 'completed', 'cancelled'].includes(value.status)
  && Array.isArray(value.order_items);

export async function callStore(action: string, payload: Record<string, unknown>, secret = ''): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke('store-checkout', { body: { action, payload, secret } });
  if (error) {
    if ('context' in error && error.context instanceof Response) {
      const body: unknown = await error.context.clone().json();
      if (record(body) && typeof body.error === 'string') {
        if (body.rejected === true) throw new StoreRejectedError(body.error);
        throw new Error(body.error);
      }
    }
    throw new Error('No se pudo contactar con la tienda. Conserva tu referencia y reintenta; no vuelvas a transferir.');
  }
  if (record(data) && typeof data.error === 'string') throw new Error(data.error);
  return data;
}
export const parseSecureOrder = (data: unknown): SecureOrder => {
  if (!isOrder(data)) throw new Error('La tienda devolvió una respuesta inválida. Conserva tu referencia antes de reintentar.');
  return data;
};
export async function getCheckoutOptions(): Promise<{ enabled: boolean; transfer_fee_percent: number }> {
  const { data, error } = await supabase.from('store_checkout_options').select('enabled,transfer_fee_percent').single();
  if (error) throw new Error('No se pudo cargar la configuración de compra. No transfieras todavía.');
  const value: unknown = data;
  if (!record(value) || typeof value.enabled !== 'boolean' || typeof value.transfer_fee_percent !== 'number'
    || !Number.isFinite(value.transfer_fee_percent) || value.transfer_fee_percent < 0 || value.transfer_fee_percent > 100) throw new Error('La configuración de compra necesita revisión');
  return { enabled: value.enabled, transfer_fee_percent: value.transfer_fee_percent };
}
const pendingKey = 'jerusalen-store-pending-v2';
export function readPendingCheckout(): PendingCheckout | null {
  const raw = sessionStorage.getItem(pendingKey);
  if (!raw) return null;
  const value: unknown = JSON.parse(raw);
  if (!record(value) || typeof value.requestId !== 'string' || typeof value.secret !== 'string'
    || typeof value.identity !== 'string' || typeof value.fingerprint !== 'string'
    || (value.orderId !== undefined && typeof value.orderId !== 'string')) throw new Error('La referencia guardada necesita revisión. No repitas un pago.');
  return { requestId: value.requestId, secret: value.secret, identity: value.identity, fingerprint: value.fingerprint, orderId: value.orderId };
}
export function prepareCheckout(payload: CheckoutPayload, identity: string): PendingCheckout {
  const previous = readPendingCheckout();
  const fingerprint = JSON.stringify(payload);
  if (previous) {
    if (previous.identity !== identity || previous.fingerprint !== fingerprint) throw new Error('Hay una operación pendiente con otros datos. Revisa su estado antes de crear otra.');
    return previous;
  }
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const operation = { requestId: crypto.randomUUID(), secret: Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(''), identity, fingerprint };
  sessionStorage.setItem(pendingKey, JSON.stringify(operation));
  return operation;
}
export async function reserveCheckout(payload: CheckoutPayload, identity: string): Promise<SecureOrder> {
  const op = prepareCheckout(payload, identity);
  try {
    const order = parseSecureOrder(await callStore('create', { ...payload, request_id: op.requestId }, op.secret));
    sessionStorage.setItem(pendingKey, JSON.stringify({ ...op, orderId: order.id }));
    return order;
  } catch (error) {
    // A rejected atomic transaction creates no order. Preserve identity on ambiguous network failures.
    if (error instanceof StoreRejectedError && !op.orderId) sessionStorage.removeItem(pendingKey);
    throw error;
  }
}
export async function retryPendingCheckout(): Promise<SecureOrder> {
  const op = readPendingCheckout();
  if (!op) throw new Error('No hay una operación pendiente');
  const payload: unknown = JSON.parse(op.fingerprint);
  if (!record(payload)) throw new Error('Referencia pendiente inválida');
  try {
    const order = parseSecureOrder(await callStore('create', { ...payload, request_id: op.requestId }, op.secret));
    sessionStorage.setItem(pendingKey, JSON.stringify({ ...op, orderId: order.id }));
    return order;
  } catch (error) {
    if (error instanceof StoreRejectedError && !op.orderId) sessionStorage.removeItem(pendingKey);
    throw error;
  }
}
export const forgetCompletedCheckout = () => sessionStorage.removeItem(pendingKey);
export const getCheckout = async (orderId: string, secret = '') => parseSecureOrder(await callStore('status', { order_id: orderId }, secret));
export async function listPurchases(): Promise<SecureOrder[]> {
  const data = await callStore('list_orders', {});
  if (!Array.isArray(data) || !data.every(isOrder)) throw new Error('No se pudo leer el historial de compras');
  return data;
}
export async function submitPrivateReceipt(orderId: string, file: File, secret = ''): Promise<SecureOrder> {
  const invalid = validateReceipt(file);
  if (invalid) throw new Error(invalid);
  const body = new FormData();
  body.set('order_id', orderId); body.set('secret', secret); body.set('file', file);
  const { data, error } = await supabase.functions.invoke('store-checkout', { body });
  if (error) {
    if ('context' in error && error.context instanceof Response) {
      const details: unknown = await error.context.clone().json();
      if (record(details) && typeof details.error === 'string') throw new Error(details.error);
    }
    throw new Error('No se pudo confirmar el comprobante. Actualiza el pedido antes de reintentar y no repitas la transferencia.');
  }
  return parseSecureOrder(data);
}
export async function getPrivateReceiptUrl(orderId: string, secret = ''): Promise<string> {
  const data = await callStore('receipt_read', { order_id: orderId }, secret);
  if (!record(data) || typeof data.url !== 'string') throw new Error('No se pudo abrir el comprobante');
  return data.url;
}
