import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import type { EcommerceFulfillmentStatus, EcommercePaymentStatus, Order } from '../types';
import { toast } from 'sonner';

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Error desconocido';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
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

      if (queryError) throw queryError;
      setOrders((data as Order[] | null) ?? []);
    } catch (fetchError) {
      const message = getErrorMessage(fetchError);
      console.error('Error fetching orders:', fetchError);
      setError(message);
      toast.error('No se pudieron cargar las órdenes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => {
      void fetchOrders();
    }, 0);

    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void fetchOrders();
      })
      .subscribe();

    return () => {
      window.clearTimeout(initialLoadTimer);
      void supabase.removeChannel(subscription);
    };
  }, [fetchOrders]);

  const updatePaymentStatus = async (orderId: string, newStatus: EcommercePaymentStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ ecommerce_payment_status: newStatus, status: newStatus === 'paid' ? 'paid' : 'pending_payment' })
        .eq('id', orderId);

      if (updateError) throw updateError;
      setError(null);
      toast.success('Estado de pago actualizado');
    } catch (updateError) {
      console.error('Error updating payment status:', updateError);
      setError(getErrorMessage(updateError));
      toast.error('Error al actualizar pago');
    }
  };

  const updateFulfillmentStatus = async (orderId: string, newStatus: EcommerceFulfillmentStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ ecommerce_fulfillment_status: newStatus })
        .eq('id', orderId);

      if (updateError) throw updateError;
      setError(null);
      toast.success('Estado logístico actualizado');
    } catch (updateError) {
      console.error('Error updating fulfillment status:', updateError);
      setError(getErrorMessage(updateError));
      toast.error('Error al actualizar logística');
    }
  };

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    updatePaymentStatus,
    updateFulfillmentStatus,
  };
}
