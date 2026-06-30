import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { AnalyticsDatasets } from '../types';

export const useAnalytics = () => {
  return useQuery<AnalyticsDatasets>({
    queryKey: ['analytics_dashboard_data'],
    queryFn: async () => {
      const [
        { data: members },
        { data: donations },
        { data: inventory },
        { data: forms },
        { data: petitions },
        { data: orders },
        { data: songs },
        { data: events }
      ] = await Promise.all([
        supabase.from('members').select('*'),
        supabase.from('donations').select('*'),
        supabase.from('inventory_items').select('*'),
        supabase.from('form_responses').select('*').order('created_at', { ascending: false }),
        supabase.from('petitions').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('songs').select('*'),
        supabase.from('events').select('*')
      ]);

      return {
        members: members || [],
        donations: donations || [],
        inventory: inventory || [],
        formResponses: forms || [],
        petitions: petitions || [],
        orders: orders || [],
        songs: songs || [],
        events: events || []
      };
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}
