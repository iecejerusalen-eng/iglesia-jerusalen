import { supabase } from '../../../config/supabase';
import type { Product } from '../../../types';

export interface PosSession {
  id: string;
  cashier_id?: string;
  cashier_name: string;
  opening_balance: number;
  closing_balance?: number;
  total_cash_sales: number;
  total_card_sales: number;
  total_transfer_sales: number;
  orders_count: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
  notes?: string;
}

export interface PosCartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
  selected_variant_id?: string;
  selected_variant_label?: string;
}

export interface PosTransactionPayload {
  sessionId?: string;
  cashierName: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  memberId?: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  items: PosCartItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  amountPaid: number;
  changeDue: number;
}

export class IncompletePosSaleError extends Error {
  readonly orderId: string;
  constructor(orderId: string, detail: string) {
    super(`La venta ${orderId.slice(0, 8).toUpperCase()} quedó incompleta: ${detail}. Revisa el pedido y el inventario antes de volver a cobrar.`);
    this.name = 'IncompletePosSaleError';
    this.orderId = orderId;
  }
}

const errorMessage = (error: unknown) => error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : String(error);

export const posService = {
  async getActiveSession(cashierName?: string): Promise<PosSession | null> {
    let query = supabase.from('pos_sessions').select('*').eq('status', 'open');
    if (cashierName) query = query.eq('cashier_name', cashierName);
    const { data, error } = await query.order('opened_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data as PosSession | null;
  },
  async openSession(cashierName: string, openingBalance: number): Promise<PosSession> {
    if (!cashierName.trim() || !Number.isFinite(openingBalance) || openingBalance < 0) throw new Error('Indica el cajero y un saldo inicial válido.');
    const { data, error } = await supabase.from('pos_sessions').insert({
      cashier_name: cashierName.trim(), opening_balance: openingBalance,
      total_cash_sales: 0, total_card_sales: 0, total_transfer_sales: 0,
      orders_count: 0, status: 'open', opened_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return data as PosSession;
  },
  async closeSession(sessionId: string, closingBalance: number, notes?: string): Promise<boolean> {
    if (!Number.isFinite(closingBalance) || closingBalance < 0) throw new Error('Saldo de cierre inválido.');
    const { error } = await supabase.from('pos_sessions').update({ closing_balance: closingBalance, status: 'closed', closed_at: new Date().toISOString(), notes }).eq('id', sessionId).eq('status', 'open').select('id').single();
    if (error) throw error;
    return true;
  },
  async processPosSale(payload: PosTransactionPayload) {
    if (!payload.sessionId || !payload.items.length) throw new Error('Abre una caja y agrega productos antes de registrar la venta.');
    const { error: sessionError } = await supabase.from('pos_sessions').select('id').eq('id', payload.sessionId).eq('status', 'open').single();
    if (sessionError) throw sessionError;
    const uniqueProducts = new Set(payload.items.map(item => item.product.id));
    if (uniqueProducts.size !== payload.items.length) throw new Error('Agrupa las unidades del mismo producto en una sola línea.');
    // Check current inventory before writing; the conditional update below also detects concurrent changes.
    const snapshots: { item: PosCartItem; stock: number }[] = [];
    for (const item of payload.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unit_price) || item.unit_price < 0 || item.discount !== 0) throw new Error('La venta contiene cantidades o precios inválidos.');
      if (item.selected_variant_id || item.product.product_variants?.length) throw new Error('Los productos con variantes deben gestionarse desde la tienda para seleccionar su combinación.');
      const { data, error } = await supabase.from('products').select('stock, is_active, deleted_at').eq('id', item.product.id).single();
      if (error) throw error;
      if (data.is_active === false || data.deleted_at || data.stock < item.quantity) throw new Error(`Revisa la disponibilidad de ${item.product.name}.`);
      snapshots.push({ item, stock: Number(data.stock) });
    }
    const receiptNumber = `REC-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
    const orderRecord = {
      channel: 'pos', receipt_number: receiptNumber, cashier_name: payload.cashierName,
      customer_name: payload.customerName || 'Cliente presencial', customer_email: payload.customerEmail || '',
      member_id: payload.memberId || null, payment_method: payload.paymentMethod,
      ecommerce_payment_method: payload.paymentMethod, ecommerce_payment_status: 'pending',
      ecommerce_fulfillment_status: 'processing', status: 'pending_payment',
      subtotal: payload.subtotal, total: payload.total, pos_session_id: payload.sessionId,
    };
    const { data: order, error: orderError } = await supabase.from('orders').insert(orderRecord).select('id').single();
    if (orderError) throw orderError;
    try {
      const { error: itemsError } = await supabase.from('order_items').insert(payload.items.map(item => ({
        order_id: order.id, product_id: item.product.id, variant_id: item.selected_variant_id || null,
        price: item.unit_price, quantity: item.quantity,
      })));
      if (itemsError) throw itemsError;
      for (const { item, stock } of snapshots) {
        const nextStock = stock - item.quantity;
        const { error: stockError } = await supabase.from('products').update({ stock: nextStock }).eq('id', item.product.id).eq('stock', stock).select('id').single();
        if (stockError) throw stockError;
        const { error: movementError } = await supabase.from('inventory_movements').insert({
          product_id: item.product.id, movement_type: 'pos_sale', quantity: item.quantity,
          previous_stock: stock, new_stock: nextStock, reference_order_id: order.id,
          created_by_name: payload.cashierName, reason: `Venta POS (${receiptNumber})`,
        });
        if (movementError) throw movementError;
      }
      const { error: completeError } = await supabase.from('orders').update({ status: 'completed', ecommerce_payment_status: 'paid', ecommerce_fulfillment_status: 'delivered' }).eq('id', order.id).select('id').single();
      if (completeError) throw completeError;
    } catch (error) {
      throw new IncompletePosSaleError(order.id, errorMessage(error));
    }
    return { success: true, orderId: order.id, receiptNumber, transactionDate: new Date().toISOString(), orderRecord };
  },
};
