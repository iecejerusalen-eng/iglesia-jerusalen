import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { DbProduct, StoreCategory, Supplier, Dispute } from '../types';
import type { Order } from '../../../types';

export const useProducts = (enabled = true) => {
  return useQuery({
    enabled,
    staleTime: 30_000,
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(*), product_digital_assets(*)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as DbProduct[];
    }
  });
};

export const useCategories = (enabled = true) => {
  return useQuery({
    enabled,
    staleTime: 30_000,
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

export const useOrders = (enabled = true) => {
  return useQuery({
    enabled,
    staleTime: 30_000,
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

export const useSuppliers = (enabled = true) => {
  return useQuery({
    enabled,
    staleTime: 30_000,
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

export const useDisputes = (enabled = true) => {
  return useQuery({
    enabled,
    staleTime: 30_000,
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
