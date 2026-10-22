import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStoreMutations } from '../hooks/useStoreMutations';
import { posService } from '../services/posService';
import { product, variant } from './fixtures';

const state = vi.hoisted(() => ({ from: vi.fn(), invoke: vi.fn(), canEdit: true, failure: '', referenced: 0 }));
vi.mock('../../../config/supabase', () => ({ supabase: { from: state.from, functions: { invoke: state.invoke } } }));
vi.mock('../../../hooks/usePermissions', () => ({ usePermissions: () => ({ hasPermission: () => state.canEdit, isAdmin: state.canEdit }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type Call = { table: string; action: string; payload?: unknown; filters: [string, unknown][] };
const calls: Call[] = [];
class Query {
  call: Call;
  constructor(table: string) { this.call = { table, action: 'select', filters: [] }; }
  select() { return this; }
  eq(key: string, value: unknown) { this.call.filters.push([key, value]); return this; }
  in(key: string, value: unknown) { this.call.filters.push([key, value]); return this; }
  is(key: string, value: unknown) { return this.eq(key, value); }
  order() { return this; }
  limit() { return this; }
  insert(payload: unknown) { this.call.action = 'insert'; this.call.payload = payload; return this; }
  upsert(payload: unknown) { this.call.action = 'upsert'; this.call.payload = payload; return this; }
  update(payload: unknown) { this.call.action = 'update'; this.call.payload = payload; return this; }
  delete() { this.call.action = 'delete'; return this; }
  result() {
    calls.push(this.call);
    const fail = state.failure === `${this.call.table}:${this.call.action}`;
    const data = this.call.table === 'product_variants' && this.call.action === 'select'
      ? [{ id: variant.id }]
      : this.call.table === 'products' && this.call.action === 'select' ? product : { id: 'order-1' };
    return { data, count: state.referenced, error: fail ? { message: 'Database unavailable' } : null };
  }
  single() { return Promise.resolve(this.result()); }
  maybeSingle() { return Promise.resolve(this.result()); }
  then(resolve: (result: ReturnType<Query['result']>) => unknown) { return Promise.resolve(this.result()).then(resolve); }
}
beforeEach(() => {
  sessionStorage.clear(); calls.length = 0; state.canEdit = true; state.failure = ''; state.referenced = 0;
  state.from.mockReset().mockImplementation((table: string) => new Query(table));
  state.invoke.mockReset().mockResolvedValue({ data: { id: 'order-1', customer_name: 'Cliente', total: 11, status: 'completed', order_items: [], created_at: '2026-10-21', receipt_number: 'REC-QA' }, error: null });
});
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } })}>{children}</QueryClientProvider>;
}
const payload = { sessionId: 'session-1', cashierName: 'Caja', customerName: 'Cliente', paymentMethod: 'cash' as const, items: [{ product, quantity: 1, unit_price: 10, discount: 0 }], subtotal: 10, taxTotal: 1, discountTotal: 0, total: 11, amountPaid: 20, changeDue: 9 };

describe('Persistencia de productos', () => {
  it('actualiza variantes conservando sus identificadores', async () => {
    const { result } = renderHook(() => useStoreMutations(), { wrapper });
    await act(async () => { await result.current.updateProduct.mutateAsync({ id: product.id, product: { name: 'Nuevo nombre' }, variants: [variant] }); });
    expect(calls.some(call => call.table === 'product_variants' && call.action === 'delete')).toBe(false);
    expect(calls.find(call => call.table === 'product_variants' && call.action === 'upsert')?.payload).toEqual([expect.objectContaining({ id: variant.id, product_id: product.id })]);
  });
  it('protege variantes con pedidos antes de modificar el producto', async () => {
    state.referenced = 1;
    const { result } = renderHook(() => useStoreMutations(), { wrapper });
    await act(async () => { await expect(result.current.updateProduct.mutateAsync({ id: product.id, product: { name: 'Nuevo nombre' }, variants: [] })).rejects.toThrow('pedidos asociados'); });
    expect(calls.some(call => call.action === 'update')).toBe(false);
  });
  it('impide escrituras sin permiso', async () => {
    state.canEdit = false;
    const { result } = renderHook(() => useStoreMutations(), { wrapper });
    await act(async () => { await expect(result.current.deleteProduct.mutateAsync(product.id)).rejects.toThrow('permiso'); });
    expect(state.from).not.toHaveBeenCalled();
  });
  it('no confirma éxito cuando fallan las variantes', async () => {
    state.failure = 'product_variants:upsert';
    const { result } = renderHook(() => useStoreMutations(), { wrapper });
    await act(async () => { await expect(result.current.createProduct.mutateAsync({ product, variants: [variant] })).rejects.toThrow('fallaron sus variantes'); });
  });
});
describe('Punto de venta', () => {
  it('no crea un turno ficticio cuando falla Supabase', async () => {
    state.failure = 'pos_sessions:insert';
    await expect(posService.openSession('Caja', 50)).rejects.toEqual({ message: 'Database unavailable' });
  });
  it('no cierra una caja exitosamente si falla el guardado', async () => {
    state.failure = 'pos_sessions:update';
    await expect(posService.closeSession('session-1', 100)).rejects.toEqual({ message: 'Database unavailable' });
  });
  it('rechaza falta de caja antes de invocar la venta', async () => {
    await expect(posService.processPosSale({ ...payload, sessionId: undefined })).rejects.toThrow('Abre una caja');
    expect(state.invoke).not.toHaveBeenCalled();
  });
  it('conserva identidad de venta ante respuesta perdida y reutiliza el registro', async () => {
    state.invoke.mockResolvedValueOnce({ data: null, error: new Error('network') });
    await expect(posService.processPosSale(payload)).rejects.toThrow('reintenta');
    await posService.processPosSale(payload);
    expect(state.invoke.mock.calls[0][1].body.payload.request_id).toBe(state.invoke.mock.calls[1][1].body.payload.request_id);
    expect(state.invoke.mock.calls[0][1].body.secret).toBe(state.invoke.mock.calls[1][1].body.secret);
    expect(state.from).not.toHaveBeenCalled();
  });
  it('envía cantidades al servidor sin escribir artículos, precios ni stock directamente', async () => {
    const result = await posService.processPosSale(payload);
    expect(result.success).toBe(true);
    expect(state.invoke.mock.calls[0][1].body.payload.items).toEqual([{ product_id: product.id, variant_id: null, quantity: 1 }]);
    expect(state.from).not.toHaveBeenCalled();
  });
});
