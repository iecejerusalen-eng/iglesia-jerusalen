import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { DbProduct, StoreCategory, Supplier, Dispute } from '../types';
import type { Order } from '../../../types';

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as DbProduct[];
    }
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['storeCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as StoreCategory[];
    }
  });
};

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*),
            product_variants (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Order[];
    }
  });
};

export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Supplier[];
    }
  });
};

export const useDisputes = () => {
  return useQuery({
    queryKey: ['disputes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_disputes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Dispute[];
    }
  });
};
