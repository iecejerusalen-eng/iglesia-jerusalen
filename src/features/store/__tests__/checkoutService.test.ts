import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readPendingCheckout, reserveCheckout, retryPendingCheckout } from '../services/checkoutService';
const state = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('../../../config/supabase', () => ({ supabase: { functions: { invoke: state.invoke } } }));
const payload = { name: 'QA', email: 'qa@example.invalid', phone: '0990000000', delivery: 'pickup' as const, expected_total: 11.5, items: [{ product_id: 'product-1', variant_id: null, quantity: 1 }] };
const response = { id: 'order-1', customer_name: 'QA', total: 11.5, status: 'pending_payment', order_items: [] };
beforeEach(() => { sessionStorage.clear(); state.invoke.mockReset(); });
describe('Recuperación de checkout', () => {
  it('mantiene la misma operación tras un fallo ambiguo del servidor', async () => {
    state.invoke.mockResolvedValueOnce({ data: null, error: { context: new Response(JSON.stringify({ error: 'Respuesta incierta', rejected: false }), { status: 400 }) } });
    await expect(reserveCheckout(payload, 'guest')).rejects.toThrow('incierta');
    const original = readPendingCheckout();
    state.invoke.mockResolvedValueOnce({ data: response, error: null });
    await retryPendingCheckout();
    expect(state.invoke.mock.calls[1][1].body.payload.request_id).toBe(original?.requestId);
    expect(readPendingCheckout()?.orderId).toBe('order-1');
  });
  it('permite corregir el formulario solo tras rechazo transaccional explícito', async () => {
    state.invoke.mockResolvedValueOnce({ data: null, error: { context: new Response(JSON.stringify({ error: 'El precio cambió', rejected: true }), { status: 400 }) } });
    await expect(reserveCheckout(payload, 'guest')).rejects.toThrow('precio cambió');
    expect(readPendingCheckout()).toBeNull();
    state.invoke.mockResolvedValueOnce({ data: response, error: null });
    await reserveCheckout({ ...payload, expected_total: 12 }, 'guest');
    expect(readPendingCheckout()?.orderId).toBe('order-1');
  });
  it('una respuesta inválida no borra la operación ni permite duplicarla con otro contenido', async () => {
    state.invoke.mockResolvedValueOnce({ data: {}, error: null });
    await expect(reserveCheckout(payload, 'guest')).rejects.toThrow('inválida');
    expect(readPendingCheckout()).not.toBeNull();
    await expect(reserveCheckout({ ...payload, phone: '0991111111' }, 'guest')).rejects.toThrow('otros datos');
    expect(state.invoke).toHaveBeenCalledOnce();
  });
});
