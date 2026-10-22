// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStoreHandler, isReceiptContent, StoreValidationError } from '../../../../supabase/functions/store-checkout/handler';
import type { StoreBackend } from '../../../../supabase/functions/store-checkout/handler';

const backend = {
  authenticate: vi.fn(), limit: vi.fn(), execute: vi.fn(), upload: vi.fn(), remove: vi.fn(), signedUrl: vi.fn(),
} satisfies StoreBackend;
const handler = createStoreHandler(backend, 'public-key');
const headers = { apikey: 'public-key', 'Content-Type': 'application/json', origin: 'http://localhost:5187' };
const jsonRequest = (body: unknown, extra: Record<string, string> = {}) => new Request('https://example.invalid/store-checkout', { method: 'POST', headers: { ...headers, ...extra }, body: JSON.stringify(body) });

beforeEach(() => {
  vi.resetAllMocks();
  backend.authenticate.mockResolvedValue('verified-user');
  backend.execute.mockResolvedValue({ id: 'order-1' });
  backend.signedUrl.mockResolvedValue('https://example.invalid/signed');
});
describe('Pasarela de pedidos', () => {
  it('deriva usuario de auth y nunca del cuerpo enviado', async () => {
    const response = await handler(jsonRequest({ action: 'create', actor: 'forged-admin', secret: 'capability', payload: {} }, { authorization: 'Bearer session-token' }));
    expect(response.status).toBe(200);
    expect(backend.authenticate).toHaveBeenCalledWith('session-token');
    expect(backend.execute).toHaveBeenCalledWith('create', 'verified-user', 'capability', {});
  });
  it('rechaza una sesión inválida sin ejecutar operaciones', async () => {
    backend.authenticate.mockRejectedValue(new Error('Sesión inválida'));
    expect((await handler(jsonRequest({ action: 'create', payload: {} }, { authorization: 'Bearer expired' }))).status).toBe(400);
    expect(backend.execute).not.toHaveBeenCalled();
  });
  it('no admite acciones de personal ni vencimiento desde el invitado', async () => {
    expect((await handler(jsonRequest({ action: 'admin_update', payload: {} }))).status).toBe(401);
    expect((await handler(jsonRequest({ action: 'expire', payload: {} }))).status).toBe(400);
    expect(backend.execute).not.toHaveBeenCalled();
  });
  it('limita tamaño real del cuerpo sin confiar en cabeceras', async () => {
    const response = await handler(jsonRequest({ action: 'create', payload: { name: 'x'.repeat(40000) } }));
    expect(response.status).toBe(400); expect(backend.execute).not.toHaveBeenCalled();
  });
  it('valida contenido del comprobante, no solo extensión o MIME', () => {
    expect(isReceiptContent(new TextEncoder().encode('<html>'), 'application/pdf')).toBe(false);
    expect(isReceiptContent(new TextEncoder().encode('%PDF-1.7'), 'application/pdf')).toBe(true);
    expect(isReceiptContent(new Uint8Array([255, 216, 255]), 'image/jpeg')).toBe(true);
    expect(isReceiptContent(new Uint8Array([255, 216, 255]), 'image/png')).toBe(false);
  });
  it('autoriza primero y retira el archivo si el pedido rechaza la asociación', async () => {
    backend.execute.mockResolvedValueOnce({ order_id: 'order-1' }).mockRejectedValueOnce(new StoreValidationError('Reserva vencida'));
    const form = new FormData(); form.set('order_id', 'order-1'); form.set('secret', 'capability');
    form.set('file', new File(['%PDF-1.7'], 'proof.pdf', { type: 'application/pdf' }));
    const response = await handler(new Request('https://example.invalid/store-checkout', { method: 'POST', headers: { apikey: 'public-key' }, body: form }));
    expect(response.status).toBe(400);
    expect(backend.execute.mock.calls[0]).toEqual(['authorize_receipt', null, 'capability', { order_id: 'order-1' }]);
    expect(backend.upload).toHaveBeenCalledOnce(); expect(backend.remove).toHaveBeenCalledOnce();
  });
  it('expone error de limpieza en vez de ocultarlo', async () => {
    backend.execute.mockResolvedValueOnce({}).mockRejectedValueOnce(new StoreValidationError('Reserva vencida'));
    backend.remove.mockRejectedValueOnce(new Error('storage unavailable'));
    const form = new FormData(); form.set('order_id', 'order-1'); form.set('secret', 'capability');
    form.set('file', new File(['%PDF-1.7'], 'proof.pdf', { type: 'application/pdf' }));
    const response = await handler(new Request('https://example.invalid/store-checkout', { method: 'POST', headers: { apikey: 'public-key' }, body: form }));
    expect((await response.json()).error).toMatch(/limpieza administrativa/);
  });
  it('firma lectura solo tras autorizar el pedido', async () => {
    backend.execute.mockResolvedValueOnce({ path: 'order-1/proof.pdf' });
    const response = await handler(jsonRequest({ action: 'receipt_read', secret: 'capability', payload: { order_id: 'order-1' } }));
    expect(response.status).toBe(200);
    expect(backend.signedUrl).toHaveBeenCalledWith('order-1/proof.pdf');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('conserva el archivo si la respuesta de asociación se pierde tras un posible commit', async () => {
    backend.execute.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('RPC response lost'));
    const form = new FormData(); form.set('order_id', 'order-1'); form.set('secret', 'capability');
    form.set('file', new File(['%PDF-1.7'], 'proof.pdf', { type: 'application/pdf' }));
    const response = await handler(new Request('https://example.invalid/store-checkout', { method: 'POST', headers: { apikey: 'public-key' }, body: form }));
    expect((await response.json()).error).toMatch(/Actualiza el pedido/);
    expect(backend.remove).not.toHaveBeenCalled();
  });
});
