import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStoreMutations } from '../hooks/useStoreMutations';
import { IncompletePosSaleError, posService } from '../services/posService';
import { product, variant } from './fixtures';

const state = vi.hoisted(() => ({ from: vi.fn(), canEdit: true, failure: '', referenced: 0 }));
vi.mock('../../../config/supabase', () => ({ supabase: { from: state.from } }));
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
beforeEach(() => { calls.length = 0; state.canEdit = true; state.failure = ''; state.referenced = 0; state.from.mockReset().mockImplementation((table: string) => new Query(table)); });
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
  it('rechaza falta de caja o stock antes de crear el pedido', async () => {
    await expect(posService.processPosSale({ ...payload, sessionId: undefined })).rejects.toThrow('Abre una caja');
    await expect(posService.processPosSale({ ...payload, items: [{ ...payload.items[0], quantity: 100 }] })).rejects.toThrow('disponibilidad');
    expect(calls.some(call => call.table === 'orders' && call.action === 'insert')).toBe(false);
  });
  it('informa el ID del pedido incompleto y no lo marca pagado', async () => {
    state.failure = 'order_items:insert';
    await expect(posService.processPosSale(payload)).rejects.toBeInstanceOf(IncompletePosSaleError);
    expect(calls.some(call => call.table === 'orders' && call.action === 'update')).toBe(false);
  });
  it('solo confirma venta después de registrar artículos e inventario', async () => {
    const result = await posService.processPosSale(payload);
    expect(result.success).toBe(true);
    expect(calls.find(call => call.table === 'order_items')?.payload).toEqual([expect.objectContaining({ price: 10, quantity: 1 })]);
    expect(calls.find(call => call.table === 'products' && call.action === 'update')?.filters).toContainEqual(['stock', 5]);
    expect(calls.at(-1)?.payload).toEqual(expect.objectContaining({ status: 'completed', ecommerce_payment_status: 'paid' }));
  });
});
