import { z } from 'zod';
import { callStore, getCheckout, parseSecureOrder } from './checkoutService';

const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const pattern = new RegExp(String.raw`^JER1\.(${uuid})\.([0-9a-f]{64})$`);
export function parseTrackingCode(input: string): { orderId: string; secret: string } {
  const match = input.trim().match(pattern);
  if (!match) throw new Error('Clave de seguimiento inválida. Pega la clave completa que guardaste al reservar.');
  return { orderId: match[1], secret: match[2] };
}
export function makeTrackingCode(orderId: string, secret: string): string {
  const code = `JER1.${orderId}.${secret}`;
  parseTrackingCode(code); return code;
}
const trackingKey = 'jerusalen-store-tracking-v1';
export function readTrackingCode(): string {
  // Keep malformed stored input editable; validation errors belong to the form.
  return sessionStorage.getItem(trackingKey) || '';
}
export async function restoreTrackedOrder(code: string) {
  const parsed = parseTrackingCode(code);
  const order = await getCheckout(parsed.orderId, parsed.secret);
  sessionStorage.setItem(trackingKey, code.trim()); return order;
}
export function forgetTrackingCode() { sessionStorage.removeItem(trackingKey); }
export async function claimTrackedOrder(code: string) {
  const parsed = parseTrackingCode(code);
  const order = parseSecureOrder(await callStore('customer_claim', { order_id: parsed.orderId }, parsed.secret));
  forgetTrackingCode(); return order;
}
const libraryItem = z.object({ item_id: z.string(), order_id: z.string(), product_id: z.string(), name: z.string(), purchased_at: z.string(), state: z.enum(['available', 'preparing', 'pending_payment', 'cancelled', 'reconciliation']) });
export type LibraryItem = z.infer<typeof libraryItem>;
export async function getDigitalLibrary(): Promise<LibraryItem[]> {
  return z.array(libraryItem).parse(await callStore('customer_library', {}));
}
export async function openDigitalResource(itemId: string) {
  const result = z.object({ url: z.string().url(), instructions: z.string().nullable(), kind: z.literal('external_google') }).parse(await callStore('customer_digital_open', { item_id: itemId }));
  const url = new URL(result.url);
  if (url.protocol !== 'https:' || !['drive.google.com', 'docs.google.com'].includes(url.hostname) || url.username || url.password || url.port) throw new Error('La dirección del recurso necesita revisión');
  return result;
}
