import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../config/supabase';
import type { DonationCategory } from '../../../types';
import { parseDonationPageConfig, type DonationPublicSettings } from '../types';

interface DonationPageState {
  settings: DonationPublicSettings | null;
  categories: DonationCategory[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDonationPageData(): DonationPageState {
  const [settings, setSettings] = useState<DonationPublicSettings | null>(null);
  const [categories, setCategories] = useState<DonationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [settingsResult, categoriesResult] = await Promise.all([
        supabase
          .from('church_settings')
          .select('phone, email, bank_name, bank_account, ruc, donation_page_config')
          .eq('id', 1)
          .single(),
        supabase
          .from('donation_categories')
          .select('id, name, description, is_active, created_at')
          .eq('is_active', true)
          .order('name', { ascending: true }),
      ]);

      if (settingsResult.error) throw settingsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (!settingsResult.data) throw new Error('No existe la configuración principal de la iglesia.');

      setSettings({
        phone: typeof settingsResult.data.phone === 'string' ? settingsResult.data.phone : '',
        email: typeof settingsResult.data.email === 'string' ? settingsResult.data.email : '',
        bank_name: typeof settingsResult.data.bank_name === 'string' ? settingsResult.data.bank_name : '',
        bank_account: typeof settingsResult.data.bank_account === 'string' ? settingsResult.data.bank_account : '',
        ruc: typeof settingsResult.data.ruc === 'string' ? settingsResult.data.ruc : '',
        donation_page_config: parseDonationPageConfig(settingsResult.data.donation_page_config),
      });
      setCategories((categoriesResult.data || []) as DonationCategory[]);
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : 'No fue posible consultar la configuración de donaciones.';
      console.error('Error loading donation page data:', caughtError);
      setSettings(null);
      setCategories([]);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  return { settings, categories, loading, error, refetch: fetchData };
}
