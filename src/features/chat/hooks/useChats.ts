import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { Chat, Message, Profile, UserRole } from '../../../types';

interface ParticipantRelation {
  profiles: ProfileRelation | ProfileRelation[] | null;
}

interface ProfileRelation {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  photo_url: string | null;
  email: string | null;
}

interface ChatRow {
  id: string;
  name: string | null;
  is_group: boolean;
  created_at: string;
  chat_participants: ParticipantRelation[] | null;
}

interface MessageRow {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

function toProfile(relation: ProfileRelation): Profile {
  return {
    ...relation,
    created_at: '',
    updated_at: '',
  };
}

export const fetchChats = async (): Promise<Chat[]> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Debes iniciar sesión para abrir la mensajería.');

  const { data: participantData, error: participantError } = await supabase
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', user.id);
  if (participantError) throw participantError;
  if (!participantData?.length) return [];

  const chatIds = participantData.map((participant) => participant.chat_id);
  const [{ data: chatResult, error: chatsError }, { data: messageResult, error: messageError }] = await Promise.all([
    supabase
      .from('chats')
      .select('id,name,is_group,created_at,chat_participants(user_id,profiles(id,first_name,last_name,role,photo_url,email))')
      .in('id', chatIds),
    supabase
      .from('messages')
      .select('id,chat_id,sender_id,content,created_at')
      .in('chat_id', chatIds)
      .order('created_at', { ascending: false })
      .limit(5000),
  ]);
  if (chatsError) throw chatsError;
  if (messageError) throw messageError;

  const lastMessageMap = new Map<string, Message>();
  (messageResult as MessageRow[] | null)?.forEach((message) => {
    if (!lastMessageMap.has(message.chat_id)) lastMessageMap.set(message.chat_id, message);
  });

  const chats = ((chatResult ?? []) as ChatRow[]).map((chat): Chat => ({
    id: chat.id,
    name: chat.name,
    is_group: chat.is_group,
    created_at: chat.created_at,
    participants: (chat.chat_participants ?? []).flatMap((participant) => {
      const relation = Array.isArray(participant.profiles) ? participant.profiles[0] : participant.profiles;
      return relation ? [toProfile(relation)] : [];
    }),
    last_message: lastMessageMap.get(chat.id) ?? null,
  }));

  return chats.sort((left, right) => {
    const leftDate = left.last_message?.created_at ?? left.created_at;
    const rightDate = right.last_message?.created_at ?? right.created_at;
    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });
};

export function useChats() {
  return useQuery<Chat[], Error>({
    queryKey: ['chats'],
    queryFn: fetchChats,
    staleTime: 60 * 1000,
    retry: 1,
  });
}
