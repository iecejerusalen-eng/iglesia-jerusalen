import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { CatalogRole } from '../../../types';
import type { MinistryData } from '../utils/schema';

export const useLookups = () => {
  return useQuery({
    queryKey: ['lookups'],
    queryFn: async () => {
      const [catalogRes, ministriesRes] = await Promise.all([
        supabase.from('catalog_roles').select('*').order('name'),
        supabase.from('ministries').select('id, name').order('name'),
      ]);

      const catalogData: CatalogRole[] = catalogRes.data || [];
      const serviceAreas = catalogData.filter(x => x.category === 'Área de Servicios');
      const talents = catalogData.filter(x => x.category === 'Talentos');
      const spiritualGifts = catalogData.filter(x => x.category === 'Dones');
      const rolesList = catalogData.filter(x => x.category === 'Roles');
      const ministries: MinistryData[] = ministriesRes.data || [];

      return {
        serviceAreas,
        talents,
        spiritualGifts,
        rolesList,
        ministries,
      };
    },
  });
};
