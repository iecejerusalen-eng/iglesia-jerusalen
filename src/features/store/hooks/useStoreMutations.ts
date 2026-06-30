import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import { toast } from 'sonner';
import type { DbProduct, StoreCategory, Supplier } from '../types';
import type { Order, OrderStatus } from '../../../types';

export const useStoreMutations = () => {
  const queryClient = useQueryClient();

  const createProduct = useMutation({
    mutationFn: async ({ product, variants }: { product: Partial<DbProduct>, variants: any[] }) => {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();
      
      if (error) throw error;
      
      if (variants.length > 0 && data) {
        const variantsToInsert = variants.map(v => ({
          ...v,
          product_id: data.id
        }));
        const { error: varError } = await supabase.from('product_variants').insert(variantsToInsert);
        if (varError) throw varError;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto creado exitosamente');
    },
    onError: (error: any) => toast.error('Error al crear: ' + error.message)
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, product, variants }: { id: string, product: Partial<DbProduct>, variants: any[] }) => {
      const { error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id);
      
      if (error) throw error;
      
      const { error: delError } = await supabase.from('product_variants').delete().eq('product_id', id);
      if (delError) throw delError;

      if (variants.length > 0) {
        const variantsToInsert = variants.map(v => {
          const { id: _, ...rest } = v;
          return { ...rest, product_id: id };
        });
        const { error: varError } = await supabase.from('product_variants').insert(variantsToInsert);
        if (varError) throw varError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto actualizado');
    },
    onError: (error: any) => toast.error('Error al actualizar: ' + error.message)
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto eliminado');
    },
    onError: (error: any) => toast.error('Error al eliminar: ' + error.message)
  });

  const saveCategory = useMutation({
    mutationFn: async (category: Partial<StoreCategory>) => {
      if (category.id) {
        const { error } = await supabase.from('store_categories').update(category).eq('id', category.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('store_categories').insert([category]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeCategories'] });
      toast.success('Categoría guardada');
    },
    onError: (error: any) => toast.error('Error: ' + error.message)
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('store_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeCategories'] });
      toast.success('Categoría eliminada');
    },
    onError: (error: any) => toast.error('Error: ' + error.message)
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: OrderStatus }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Estado actualizado');
    },
    onError: (error: any) => toast.error('Error: ' + error.message)
  });

  const cancelOrder = useMutation({
    mutationFn: async (order: Order) => {
      if (order.status === 'completed' || order.status === 'cancelled') {
        throw new Error('No se puede cancelar en este estado');
      }
      const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
      if (error) throw error;

      if (order.order_items && order.order_items.length > 0) {
        for (const item of order.order_items) {
          if (item.product_variants) {
             await supabase.rpc('increment_variant_stock', { variant_id: item.product_variants.id, qty: item.quantity });
          } else if (item.products) {
             await supabase.rpc('increment_product_stock', { product_id: item.products.id, qty: item.quantity });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Pedido cancelado y stock devuelto');
    },
    onError: (error: any) => toast.error('Error al cancelar: ' + error.message)
  });

  const saveShippingOverride = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string, data: any }) => {
      const { error } = await supabase.from('orders').update({
        shipping_recipient_name: data.recipient_name,
        shipping_phone: data.phone,
        shipping_override_address: data.override_address,
        shipping_status_notes: data.status_notes
      }).eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Datos de envío actualizados');
    },
    onError: (error: any) => toast.error('Error: ' + error.message)
  });

  const saveRefund = useMutation({
    mutationFn: async ({ orderId, amount, reason, total }: { orderId: string, amount: number, reason: string, total: number }) => {
      const { error } = await supabase.from('orders').update({
        refund_status: amount >= total ? 'full' : 'partial',
        refunded_amount: amount,
        refund_reason: reason
      }).eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Reembolso registrado');
    },
    onError: (error: any) => toast.error('Error: ' + error.message)
  });

  const saveSupplier = useMutation({
    mutationFn: async (supplier: Partial<Supplier>) => {
      if (supplier.id) {
        const { error } = await supabase.from('store_suppliers').update(supplier).eq('id', supplier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('store_suppliers').insert([supplier]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Proveedor guardado');
    },
    onError: (error: any) => toast.error('Error: ' + error.message)
  });

  const saveDisputeResolution = useMutation({
    mutationFn: async ({ id, notes }: { id: string, notes: string }) => {
      const { error } = await supabase.from('store_disputes').update({
        status: 'resolved',
        resolution_notes: notes
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      toast.success('Controversia resuelta');
    },
    onError: (error: any) => toast.error('Error: ' + error.message)
  });

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    saveCategory,
    deleteCategory,
    updateOrderStatus,
    cancelOrder,
    saveShippingOverride,
    saveRefund,
    saveSupplier,
    saveDisputeResolution
  };
};
