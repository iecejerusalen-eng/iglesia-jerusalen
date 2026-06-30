import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { LogoData, MinistryOption } from '../types';

export const useLogos = () => {
  return useQuery<LogoData[]>({
    queryKey: ['logos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logos')
        .select('*, ministries(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as LogoData[]) || [];
    }
  });
};

export const useMinistries = () => {
  return useQuery<MinistryOption[]>({
    queryKey: ['ministries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ministries')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });
};
