import { supabase } from '../../../config/supabase';
import { callStore, parseSecureOrder, StoreRejectedError } from './checkoutService';
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
    if (payload.items.some(item => item.discount !== 0 || !Number.isInteger(item.quantity) || item.quantity <= 0)) throw new Error('La venta contiene cantidades o descuentos inválidos.');
    const body = {
      name: payload.customerName || 'Cliente presencial', email: payload.customerEmail || '', phone: payload.customerPhone || '',
      delivery: 'pickup', expected_total: payload.total, session_id: payload.sessionId,
      payment_method: payload.paymentMethod, amount_paid: payload.amountPaid,
      items: payload.items.map(item => ({ product_id: item.product.id, variant_id: item.selected_variant_id || null, quantity: item.quantity })),
    };
    const key = 'store-pos-operation:' + payload.sessionId;
    const fingerprint = JSON.stringify(body);
    const raw = sessionStorage.getItem(key);
    let requestId: string;
    let secret: string;
    if (raw) {
      const previous: unknown = JSON.parse(raw);
      if (!previous || typeof previous !== 'object' || !('fingerprint' in previous) || previous.fingerprint !== fingerprint
        || !('requestId' in previous) || typeof previous.requestId !== 'string' || !('secret' in previous) || typeof previous.secret !== 'string') {
        throw new Error('Hay una venta pendiente de respuesta en esta caja. Revisa su estado antes de volver a cobrar.');
      }
      requestId = previous.requestId; secret = previous.secret;
    } else {
      requestId = crypto.randomUUID();
      secret = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
      sessionStorage.setItem(key, JSON.stringify({ requestId, secret, fingerprint }));
    }
    let order;
    try { order = parseSecureOrder(await callStore('pos', { ...body, request_id: requestId }, secret)); }
    catch (error) {
      if (error instanceof StoreRejectedError) sessionStorage.removeItem(key);
      throw error;
    }
    sessionStorage.removeItem(key);
    return { success: true, orderId: order.id, receiptNumber: order.receipt_number || order.id,
      transactionDate: order.created_at, orderRecord: order };
  },
};
