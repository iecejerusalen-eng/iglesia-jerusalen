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

export const posService = {
  // --- 1. SESSIONS ---
  async getActiveSession(cashierName?: string): Promise<PosSession | null> {
    try {
      let query = supabase
        .from('pos_sessions')
        .select('*')
        .eq('status', 'open');

      if (cashierName) {
        query = query.eq('cashier_name', cashierName);
      }

      const { data, error } = await query
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      return data as PosSession;
    } catch {
      return null;
    }
  },

  async openSession(cashierName: string, openingBalance: number): Promise<PosSession> {
    const newSession: Partial<PosSession> = {
      cashier_name: cashierName,
      opening_balance: openingBalance,
      total_cash_sales: 0,
      total_card_sales: 0,
      total_transfer_sales: 0,
      orders_count: 0,
      status: 'open',
      opened_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase.from('pos_sessions').insert([newSession]).select().single();
      if (data && !error) return data as PosSession;
    } catch {
      // Fallback in-memory session
    }

    return {
      id: `pos-sess-${Date.now()}`,
      cashier_name: cashierName,
      opening_balance: openingBalance,
      total_cash_sales: 0,
      total_card_sales: 0,
      total_transfer_sales: 0,
      orders_count: 0,
      status: 'open',
      opened_at: new Date().toISOString(),
    };
  },

  async closeSession(sessionId: string, closingBalance: number, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pos_sessions')
        .update({
          closing_balance: closingBalance,
          status: 'closed',
          closed_at: new Date().toISOString(),
          notes,
        })
        .eq('id', sessionId);

      return !error;
    } catch {
      return true;
    }
  },

  // --- 2. EXECUTE SALE ---
  async processPosSale(payload: PosTransactionPayload) {
    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;
    const orderRecord = {
      channel: 'pos',
      receipt_number: receiptNumber,
      cashier_name: payload.cashierName,
      customer_name: payload.customerName || 'Cliente Presencial',
      customer_email: payload.customerEmail || '',
      customer_phone: payload.customerPhone || '',
      member_id: payload.memberId || null,
      payment_method: payload.paymentMethod,
      payment_status: 'paid',
      order_status: 'completed',
      subtotal: payload.subtotal,
      tax_total: payload.taxTotal,
      discount_total: payload.discountTotal,
      total: payload.total,
      pos_session_id: payload.sessionId || null,
      created_at: new Date().toISOString(),
    };

    try {
      // Insert Order into Supabase
      const { data: createdOrder, error: orderError } = await supabase
        .from('orders')
        .insert([orderRecord])
        .select()
        .single();

      if (createdOrder && !orderError) {
        // Insert items
        const itemsToInsert = payload.items.map(item => ({
          order_id: createdOrder.id,
          product_id: item.product.id,
          product_name: item.product.name,
          unit_price: item.unit_price,
          quantity: item.quantity,
          subtotal: (item.unit_price - item.discount) * item.quantity,
          variant_info: item.selected_variant_label || null,
        }));

        await supabase.from('order_items').insert(itemsToInsert);

        // Deduct inventory & record movement
        for (const item of payload.items) {
          const currentStock = item.product.stock || 0;
          const newStock = Math.max(0, currentStock - item.quantity);

          await supabase.from('products').update({ stock: newStock }).eq('id', item.product.id);

          await supabase.from('inventory_movements').insert([{
            product_id: item.product.id,
            movement_type: 'pos_sale',
            quantity: item.quantity,
            previous_stock: currentStock,
            new_stock: newStock,
            reference_order_id: createdOrder.id,
            created_by_name: payload.cashierName,
            reason: `Venta POS en caja (${receiptNumber})`,
          }]);
        }
      }
    } catch (err) {
      console.warn('Supabase POS sale write failed, proceeding with in-memory receipt:', err);
    }

    return {
      success: true,
      receiptNumber,
      transactionDate: new Date().toISOString(),
      orderRecord,
    };
  },
};
