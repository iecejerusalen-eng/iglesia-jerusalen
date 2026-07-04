import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { CertificateTemplate } from '../types';

export const useTemplates = () => {
  return useQuery({
    queryKey: ['certificate-templates'],
    queryFn: async (): Promise<CertificateTemplate[]> => {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CertificateTemplate[];
    },
  });
};
