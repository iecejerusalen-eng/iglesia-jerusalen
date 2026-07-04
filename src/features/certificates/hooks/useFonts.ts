import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { CertificateFont } from '../types';

export const useFonts = () => {
  return useQuery({
    queryKey: ['certificate-fonts'],
    queryFn: async (): Promise<CertificateFont[]> => {
      const { data, error } = await supabase
        .from('certificate_fonts')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as CertificateFont[];
    },
  });
};
