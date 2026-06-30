import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import type { Order } from '../types';
import { toast } from 'sonner';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, ecommerce_product_type),
            product_variants (size, color_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('No se pudieron cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const updatePaymentStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ ecommerce_payment_status: newStatus, status: newStatus === 'paid' ? 'paid' : 'pending_payment' })
        .eq('id', orderId);
        
      if (error) throw error;
      toast.success('Estado de pago actualizado');
    } catch (error) {
      toast.error('Error al actualizar pago');
    }
  };

  const updateFulfillmentStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ ecommerce_fulfillment_status: newStatus })
        .eq('id', orderId);
        
      if (error) throw error;
      toast.success('Estado logístico actualizado');
    } catch (error) {
      toast.error('Error al actualizar logística');
    }
  };

  return {
    orders,
    loading,
    updatePaymentStatus,
    updateFulfillmentStatus
  };
}
