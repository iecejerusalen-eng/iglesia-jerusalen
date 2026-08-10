import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { Chat, Message, Profile, UserRole } from '../../../types';
import type { BroadcastResult, ChatMinistry } from '../types';
import { isValidChatContent, MAX_BROADCAST_RECIPIENTS, normalizeChatContent, uniqueRecipientIds } from '../chatRules';
import { fetchChats } from './useChats';

interface SenderRelation {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  photo_url: string | null;
  email: string | null;
}

interface InsertedMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: SenderRelation | SenderRelation[] | null;
}

interface BroadcastInput {
  targetProfileIds: string[];
  messageContent: string;
  ministries?: ChatMinistry[];
  onProgress?: (sent: number, total: number) => void;
}

function toProfile(sender: SenderRelation): Profile {
  return { ...sender, created_at: '', updated_at: '' };
}

async function authenticatedUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Debes iniciar sesión para usar la mensajería.');
  return user.id;
}

export function useChatMutations() {
  const queryClient = useQueryClient();

  const sendMessage = useMutation<Message, Error, { chatId: string; content: string }>({
    mutationFn: async ({ chatId, content }) => {
      const userId = await authenticatedUserId();
      const normalized = normalizeChatContent(content);
      if (!isValidChatContent(normalized)) {
        throw new Error('El mensaje debe contener entre 1 y 1000 caracteres.');
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({ chat_id: chatId, sender_id: userId, content: normalized })
        .select('id,chat_id,sender_id,content,created_at,sender:profiles(id,first_name,last_name,role,photo_url,email)')
        .single();
      if (error) throw error;

      const inserted = data as InsertedMessage;
      const sender = Array.isArray(inserted.sender) ? inserted.sender[0] : inserted.sender;
      return { ...inserted, sender: sender ? toProfile(sender) : null };
    },
    onSuccess: (newMessage, { chatId }) => {
      queryClient.setQueryData<Message[]>(['messages', chatId], (current = []) =>
        current.some((message) => message.id === newMessage.id) ? current : [...current, newMessage],
      );
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  const startChatWith = useMutation<Chat, Error, string>({
    mutationFn: async (profileId) => {
      await authenticatedUserId();
      const { data, error } = await supabase.rpc('get_or_create_direct_chat', { target_user_id: profileId });
      if (error) throw error;
      if (typeof data !== 'string') throw new Error('La base de datos no devolvió una conversación válida.');

      const chats = await fetchChats();
      const chat = chats.find((candidate) => candidate.id === data);
      if (!chat) throw new Error('La conversación se creó, pero no pudo recuperarse. Actualiza e inténtalo de nuevo.');
      return chat;
    },
    onSuccess: (newChat) => {
      queryClient.setQueryData<Chat[]>(['chats'], (current = []) => {
        const withoutDuplicate = current.filter((chat) => chat.id !== newChat.id);
        return [newChat, ...withoutDuplicate];
      });
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  const sendBroadcast = useMutation<BroadcastResult, Error, BroadcastInput>({
    mutationFn: async ({ targetProfileIds, messageContent, onProgress }) => {
      await authenticatedUserId();
      const normalized = normalizeChatContent(messageContent);
      const uniqueTargets = uniqueRecipientIds(targetProfileIds);
      if (!isValidChatContent(normalized)) {
        throw new Error('La difusión debe contener entre 1 y 1000 caracteres.');
      }
      if (uniqueTargets.length === 0 || uniqueTargets.length > MAX_BROADCAST_RECIPIENTS) {
        throw new Error('Selecciona entre 1 y 100 destinatarios.');
      }

      onProgress?.(0, uniqueTargets.length);
      const { data, error } = await supabase.rpc('send_chat_broadcast', {
        target_profile_ids: uniqueTargets,
        message_content: normalized,
      });
      if (error) throw error;
      if (typeof data !== 'number' || data !== uniqueTargets.length) {
        throw new Error('La difusión no confirmó todos los destinatarios y fue cancelada.');
      }
      onProgress?.(data, uniqueTargets.length);
      return { sent: data };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  const deleteMessage = useMutation<string, Error, string>({
    mutationFn: async (messageId) => {
      const { data, error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .select('id')
        .single();
      if (error) throw error;
      if (data.id !== messageId) throw new Error('No se confirmó la eliminación del mensaje.');
      return messageId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['messages'] });
      void queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  const leaveChat = useMutation<string, Error, string>({
    mutationFn: async (chatId) => {
      const userId = await authenticatedUserId();
      const { data, error } = await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .select('chat_id')
        .single();
      if (error) throw error;
      if (data.chat_id !== chatId) throw new Error('No se confirmó la salida de la conversación.');
      return chatId;
    },
    onSuccess: (chatId) => {
      queryClient.setQueryData<Chat[]>(['chats'], (current = []) => current.filter((chat) => chat.id !== chatId));
      queryClient.removeQueries({ queryKey: ['messages', chatId] });
    },
  });

  return { sendMessage, startChatWith, sendBroadcast, deleteMessage, leaveChat };
}
