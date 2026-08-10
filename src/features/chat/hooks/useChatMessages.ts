import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { Message, Profile, UserRole } from '../../../types';

interface SenderRelation {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  photo_url: string | null;
  email: string | null;
}

interface MessageWithSender {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: SenderRelation | SenderRelation[] | null;
}

function toProfile(sender: SenderRelation): Profile {
  return { ...sender, created_at: '', updated_at: '' };
}

export const fetchMessages = async (chatId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('id,chat_id,sender_id,content,created_at,sender:profiles(id,first_name,last_name,role,photo_url,email)')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(1000);
  if (error) throw error;

  return ((data ?? []) as MessageWithSender[]).map((message) => {
    const sender = Array.isArray(message.sender) ? message.sender[0] : message.sender;
    return { ...message, sender: sender ? toProfile(sender) : null };
  });
};

export function useChatMessages(chatId: string | undefined) {
  return useQuery<Message[], Error>({
    queryKey: ['messages', chatId],
    queryFn: () => {
      if (!chatId) throw new Error('Selecciona una conversación.');
      return fetchMessages(chatId);
    },
    enabled: Boolean(chatId),
    staleTime: 30 * 1000,
    retry: 1,
  });
}
