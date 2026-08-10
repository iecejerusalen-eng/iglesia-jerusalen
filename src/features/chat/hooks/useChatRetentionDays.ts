import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';

export const fetchRetentionDays = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('church_settings')
    .select('chat_retention_days')
    .eq('id', 1)
    .single();
  if (error) throw error;
  const days = data?.chat_retention_days;
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    throw new Error('La configuración de retención debe estar entre 1 y 90 días.');
  }
  return days;
};

export function useChatRetentionDays() {
  return useQuery<number, Error>({
    queryKey: ['retentionDays'],
    queryFn: fetchRetentionDays,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}
