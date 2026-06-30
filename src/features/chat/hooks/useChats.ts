import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { Chat, Profile, Message } from '../../../types';

export const fetchChats = async (): Promise<Chat[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: participantData, error: partError } = await supabase
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', user.id);

  if (partError) throw partError;
  if (!participantData || participantData.length === 0) return [];

  const chatIds = participantData.map((p) => p.chat_id);

  const { data: chatsData, error: chatsError } = await supabase
    .from('chats')
    .select(`
      id,
      name,
      is_group,
      created_at,
      chat_participants (
        user_id,
        profiles (
          id,
          first_name,
          last_name,
          role,
          photo_url,
          email
        )
      )
    `)
    .in('id', chatIds);

  if (chatsError) throw chatsError;

  const { data: lastMessages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .in('chat_id', chatIds)
    .order('created_at', { ascending: false });

  if (msgError) throw msgError;

  const lastMessageMap: Record<string, Message> = {};
  if (lastMessages) {
    lastMessages.forEach((msg) => {
      if (!lastMessageMap[msg.chat_id]) {
        lastMessageMap[msg.chat_id] = msg as Message;
      }
    });
  }

  const formattedChats: Chat[] = (chatsData || []).map((chat: any) => {
    const participants = chat.chat_participants
      ?.map((cp: any) => cp.profiles)
      .filter(Boolean) as Profile[];

    return {
      id: chat.id,
      name: chat.name,
      is_group: chat.is_group,
      created_at: chat.created_at,
      participants,
      last_message: lastMessageMap[chat.id] || null,
    };
  });

  formattedChats.sort((a, b) => {
    const dateA = a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.created_at).getTime();
    const dateB = b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.created_at).getTime();
    return dateB - dateA;
  });

  return formattedChats;
};

export function useChats() {
  return useQuery({
    queryKey: ['chats'],
    queryFn: fetchChats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
