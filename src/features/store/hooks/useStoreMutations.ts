import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import { toast } from 'sonner';
import { usePermissions } from '../../../hooks/usePermissions';
import type { DbProduct, FormVariant, StoreCategory, Supplier } from '../types';
import type { Order, OrderStatus } from '../../../types';

interface ShippingOverrideData {
  recipient_name: string;
  phone: string;
  override_address: string;
  status_notes: string;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return String(error);
};

export const useStoreMutations = () => {
  const queryClient = useQueryClient();
  const { hasPermission, isAdmin } = usePermissions();
  const requireEdit = (module: 'products' | 'orders' | 'admin') => {
    if (module === 'admin' ? !isAdmin : !hasPermission(module, 'edit')) {
      throw new Error('No tienes permiso para realizar esta acción.');
    }
  };
  const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: ['products'] });
  const variantPayload = (variant: FormVariant, productId: string) => ({
    id: variant.id || crypto.randomUUID(), product_id: productId,
    color_name: variant.color_name.trim(), color_hex: variant.color_hex,
    size: variant.size.trim(), cloudinary_image_url: variant.cloudinary_image_url,
    stock: variant.stock, price_adjustment: variant.price_adjustment,
    sku: variant.sku?.trim() || null, metadata: variant.metadata || {},
  });
  const saveDigitalAsset = async (productId: string, asset?: { drive_link: string; instructions: string }) => {
    if (!asset) return;
    const { error } = await supabase.from('product_digital_assets').upsert({ product_id: productId, ...asset }, { onConflict: 'product_id' });
    if (error) throw new Error('El producto se guardó, pero no su recurso digital: ' + getErrorMessage(error));
  };

  const createProduct = useMutation({
    mutationFn: async ({ product, variants, digitalAsset }: { product: Partial<DbProduct>, variants: FormVariant[], digitalAsset?: { drive_link: string; instructions: string } }) => {
      requireEdit('products');
      const { data, error } = await supabase.from('products').upsert(product).select('id').single();
      if (error) throw error;
      if (variants.length) {
        const { error: variantError } = await supabase.from('product_variants').upsert(variants.map(variant => variantPayload(variant, data.id)));
        if (variantError) throw new Error('El producto se guardó, pero fallaron sus variantes: ' + getErrorMessage(variantError));
      }
      await saveDigitalAsset(data.id, digitalAsset);
      return data;
    },
    onSettled: invalidateProducts,
    onSuccess: () => toast.success('Producto creado'),
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, product, variants, digitalAsset }: { id: string, product: Partial<DbProduct>, variants: FormVariant[], digitalAsset?: { drive_link: string; instructions: string } }) => {
      requireEdit('products');
      const { data: previous, error: readError } = await supabase.from('product_variants').select('id').eq('product_id', id);
      if (readError) throw readError;
      const retained = new Set(variants.map(variant => variant.id).filter(Boolean));
      const removed = (previous || []).filter(variant => !retained.has(variant.id)).map(variant => variant.id);
      if (removed.length) {
        const { count, error: referenceError } = await supabase.from('order_items').select('id', { count: 'exact', head: true }).in('variant_id', removed);
        if (referenceError) throw referenceError;
        if (count == null || count > 0) throw new Error('Una variante tiene pedidos asociados. Conserva la variante y coloca su stock en cero.');
      }
      const { error } = await supabase.from('products').update(product).eq('id', id).select('id').single();
      if (error) throw error;
      if (variants.length) {
        const { error: variantError } = await supabase.from('product_variants').upsert(variants.map(variant => variantPayload(variant, id)));
        if (variantError) throw new Error('El producto se guardó, pero fallaron sus variantes: ' + getErrorMessage(variantError));
      }
      if (removed.length) {
        const { error: removeError } = await supabase.from('product_variants').delete().eq('product_id', id).in('id', removed);
        if (removeError) throw removeError;
      }
      await saveDigitalAsset(id, digitalAsset);
    },
    onSettled: invalidateProducts,
    onSuccess: () => toast.success('Producto actualizado'),
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      requireEdit('products');
      const { error } = await supabase
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id).select('id').single();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto eliminado');
    },
    onError: (error: unknown) => toast.error('Error al eliminar: ' + getErrorMessage(error))
  });

  const saveCategory = useMutation({
    mutationFn: async (category: Partial<StoreCategory>) => {
      requireEdit('products');
      if (!category.name?.trim()) throw new Error('El nombre de la categoría es obligatorio.');
      category = { ...category, name: category.name.trim() };
      if (category.id) {
        const { data: previous, error: readError } = await supabase.from('store_categories').select('name').eq('id', category.id).single();
        if (readError) throw readError;
        if (previous.name !== category.name) {
          const { error: renameError } = await supabase.from('products').update({ category: category.name }).eq('category', previous.name);
          if (renameError) throw renameError;
        }
        const { error } = await supabase.from('store_categories').update(category).eq('id', category.id).select('id').single();
        if (error) throw error;
      } else {
        const { error } = await supabase.from('store_categories').insert([category]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeCategories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Categoría guardada');
    },
    onError: (error: unknown) => toast.error('Error: ' + getErrorMessage(error))
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      requireEdit('products');
      const { data: category, error: readError } = await supabase.from('store_categories').select('name').eq('id', id).single();
      if (readError) throw readError;
      const { count, error: countError } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('category', category.name).is('deleted_at', null);
      if (countError) throw countError;
      if (count == null || count > 0) throw new Error('Mueve los productos de esta categoría antes de eliminarla.');
      const { error } = await supabase.from('store_categories').delete().eq('id', id).select('id').single();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeCategories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Categoría eliminada');
    },
    onError: (error: unknown) => toast.error('Error: ' + getErrorMessage(error))
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: OrderStatus }) => {
      requireEdit('orders');
      const { error } = await supabase.from('orders').update({ status, ...(status === 'paid' ? { ecommerce_payment_status: 'paid' } : {}), ...(status === 'completed' ? { ecommerce_fulfillment_status: 'delivered' } : {}) }).eq('id', orderId).select('id').single();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Estado actualizado');
    },
    onError: (error: unknown) => toast.error('Error: ' + getErrorMessage(error))
  });

  const cancelOrder = useMutation({
    mutationFn: async (order: Order) => {
      requireEdit('orders');
      if (order.status === 'completed' || order.status === 'cancelled') {
        throw new Error('No se puede cancelar en este estado');
      }
      const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id).eq('status', order.status).select('id').single();
      if (error) throw error;


    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Pedido cancelado');
    },
    onError: (error: unknown) => toast.error('Error al cancelar: ' + getErrorMessage(error))
  });

  const saveShippingOverride = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string, data: ShippingOverrideData }) => {
      requireEdit('orders');
      const { error } = await supabase.from('orders').update({
        shipping_recipient_name: data.recipient_name,
        shipping_phone: data.phone,
        shipping_override_address: data.override_address,
        shipping_status_notes: data.status_notes
      }).eq('id', orderId).select('id').single();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Datos de envío actualizados');
    },
    onError: (error: unknown) => toast.error('Error: ' + getErrorMessage(error))
  });

  const saveRefund = useMutation({
    mutationFn: async ({ orderId, amount, reason, total }: { orderId: string, amount: number, reason: string, total: number }) => {
      requireEdit('orders');
      if (!Number.isFinite(amount) || amount <= 0 || amount > total || !reason.trim()) throw new Error('Indica un importe válido y el motivo del reembolso.');
      const { error } = await supabase.from('orders').update({
        refund_status: amount >= total ? 'full' : 'partial',
        refunded_amount: amount,
        refund_reason: reason
      }).eq('id', orderId).select('id').single();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Reembolso registrado');
    },
    onError: (error: unknown) => toast.error('Error: ' + getErrorMessage(error))
  });

  const saveSupplier = useMutation({
    mutationFn: async (supplier: Partial<Supplier>) => {
      requireEdit('admin');
      if (supplier.id) {
        const { error } = await supabase.from('store_suppliers').update(supplier).eq('id', supplier.id).select('id').single();
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
    onError: (error: unknown) => toast.error('Error: ' + getErrorMessage(error))
  });

  const saveDisputeResolution = useMutation({
    mutationFn: async ({ id, notes }: { id: string, notes: string }) => {
      requireEdit('admin');
      const { error } = await supabase.from('store_disputes').update({
        status: 'resolved',
        resolution_notes: notes
      }).eq('id', id).select('id').single();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      toast.success('Controversia resuelta');
    },
    onError: (error: unknown) => toast.error('Error: ' + getErrorMessage(error))
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
