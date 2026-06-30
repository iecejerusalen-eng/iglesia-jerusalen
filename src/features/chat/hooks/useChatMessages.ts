import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { Message, Profile } from '../../../types';

export const fetchMessages = async (chatId: string): Promise<Message[]> => {
  if (!chatId) return [];
  
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      chat_id,
      sender_id,
      content,
      created_at,
      sender:profiles (
        id,
        first_name,
        last_name,
        role,
        photo_url,
        email
      )
    `)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const formattedMessages: Message[] = (data || []).map((msg: any) => ({
    id: msg.id,
    chat_id: msg.chat_id,
    sender_id: msg.sender_id,
    content: msg.content,
    created_at: msg.created_at,
    sender: msg.sender ? (msg.sender as Profile) : null,
  }));

  return formattedMessages;
};

export function useChatMessages(chatId: string | undefined) {
  return useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => fetchMessages(chatId as string),
    enabled: !!chatId,
    staleTime: 1000 * 60 * 5,
  });
}
