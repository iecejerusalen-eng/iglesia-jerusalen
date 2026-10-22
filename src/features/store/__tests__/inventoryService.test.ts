import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getInventory, mutateInventory, readInventoryPending } from '../services/inventoryService';
const state = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('../../../config/supabase', () => ({ supabase: { functions: { invoke: state.invoke } } }));
const detail = { product_id: 'product-1', reserved: 0, points: [], profile: {}, reservations: [], counts: [], movements: [] };
beforeEach(() => { sessionStorage.clear(); state.invoke.mockReset(); });
describe('Operaciones de inventario', () => {
  it('recupera la misma operación después de recargar ante respuesta incierta', async () => {
    state.invoke.mockResolvedValueOnce({ data: null, error: { context: new Response(JSON.stringify({ error: 'Respuesta incierta', rejected: false }), { status: 400 }) } });
    await expect(mutateInventory('staff', 'inventory_move', { product_id: 'product-1', quantity: 2, direction: 'in', reason: 'Compra QA' })).rejects.toThrow('incierta');
    const first = readInventoryPending('staff');
    expect(first?.payload.operation_id).toBeTruthy();
    await expect(mutateInventory('staff', 'inventory_move', { product_id: 'product-1' })).rejects.toThrow('sin confirmar');
    state.invoke.mockResolvedValueOnce({ data: detail, error: null });
    await mutateInventory('staff');
    expect(state.invoke.mock.calls[1][1].body.payload.operation_id).toBe(first?.payload.operation_id);
    expect(readInventoryPending('staff')).toBeNull();
  });
  it('permite corregir solo después de un rechazo definitivo', async () => {
    state.invoke.mockResolvedValueOnce({ data: null, error: { context: new Response(JSON.stringify({ error: 'Unidades reservadas', rejected: true }), { status: 400 }) } });
    await expect(mutateInventory('staff', 'inventory_move', { product_id: 'product-1' })).rejects.toThrow('reservadas');
    expect(readInventoryPending('staff')).toBeNull();
  });
  it('separa operaciones por usuario y conserva identidad ante una respuesta inválida', async () => {
    state.invoke.mockResolvedValueOnce({ data: {}, error: null });
    await expect(mutateInventory('staff', 'inventory_count_start', { product_id: 'product-1' })).rejects.toThrow();
    expect(readInventoryPending('staff')).not.toBeNull();
    expect(readInventoryPending('other')).toBeNull();
  });
  it('no acepta una ficha incompleta como resultado correcto', async () => {
    state.invoke.mockResolvedValue({ data: { product_id: 'product-1' }, error: null });
    await expect(getInventory('product-1')).rejects.toThrow();
  });
});
