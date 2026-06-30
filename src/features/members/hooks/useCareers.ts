import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { Career } from '../../../types';

export const useCareers = () => {
  return useQuery({
    queryKey: ['careers'],
    queryFn: async (): Promise<Career[]> => {
      const { data, error } = await supabase.from('careers').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
  });
};
