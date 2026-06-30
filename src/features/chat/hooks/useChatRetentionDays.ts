import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';

export const fetchRetentionDays = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('church_settings')
    .select('chat_retention_days')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data?.chat_retention_days || 7;
};

export function useChatRetentionDays() {
  return useQuery({
    queryKey: ['retentionDays'],
    queryFn: fetchRetentionDays,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
