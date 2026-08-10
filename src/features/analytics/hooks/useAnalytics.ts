import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { AnalyticsDatasets, AnalyticsRow, FormResponseData } from '../types';

interface QueryResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

function assertQuery<T>(name: string, result: QueryResult<T>): T[] {
  if (result.error) {
    throw new Error(`${name}: ${result.error.message}`);
  }
  return result.data ?? [];
}

export const useAnalytics = () => {
  return useQuery<AnalyticsDatasets, Error>({
    queryKey: ['analytics_dashboard_data'],
    queryFn: async () => {
      const results = await Promise.all([
        supabase
          .from('members')
          .select('id,gender,leadership_role,birth_date,baptism_date,tithes_sum,created_at')
          .is('deleted_at', null)
          .limit(5000),
        supabase
          .from('donations')
          .select('id,amount,payment_method,status,category_name_backup,created_at')
          .limit(5000),
        supabase
          .from('inventory_items')
          .select('id,price,quantity,status,category_id,created_at,inventory_categories(name)')
          .limit(5000),
        supabase
          .from('form_responses')
          .select('id,member_name,member_email,block_id,page_id,answers,score,max_score,created_at')
          .order('created_at', { ascending: false })
          .limit(5000),
        supabase.from('petitions').select('id,status,created_at').limit(5000),
        supabase
          .from('orders')
          .select('id,total,status,payment_method,ecommerce_payment_method,created_at')
          .limit(5000),
        supabase.from('songs').select('id,artist,bpm,created_at').limit(5000),
        supabase
          .from('events')
          .select('id,start_date,is_recurring,recurrence_type,created_at')
          .limit(5000),
      ]);

      const members = assertQuery<AnalyticsRow>('Miembros', results[0]);
      const donationRows = assertQuery<AnalyticsRow>('Donaciones', results[1]);
      const inventoryRows = assertQuery<AnalyticsRow>('Inventario', results[2]);
      const forms = assertQuery<FormResponseData>('Cuestionarios', results[3]);
      const petitions = assertQuery<AnalyticsRow>('Peticiones', results[4]);
      const orderRows = assertQuery<AnalyticsRow>('Pedidos', results[5]);
      const songs = assertQuery<AnalyticsRow>('Alabanzas', results[6]);
      const eventRows = assertQuery<AnalyticsRow>('Eventos', results[7]);

      const donations = donationRows.map((row) => ({
        ...row,
        category: row.category_name_backup || 'Sin categoría',
      }));
      const inventory = inventoryRows.map((row) => {
        const relation = row.inventory_categories;
        const category =
          relation && typeof relation === 'object' && 'name' in relation
            ? String(relation.name || 'Sin categoría')
            : 'Sin categoría';
        return { ...row, category };
      });
      const orders = orderRows.map((row) => ({
        ...row,
        payment_method: row.payment_method || row.ecommerce_payment_method || 'Sin especificar',
      }));
      const events = eventRows.map((row) => ({
        ...row,
        recurrence: row.is_recurring ? 'Sí' : 'No',
      }));

      return { members, donations, inventory, formResponses: forms, petitions, orders, songs, events };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
