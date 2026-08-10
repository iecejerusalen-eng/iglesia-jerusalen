import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { Message, Profile, UserRole } from '../../../types';
import type { RealtimeStatus } from '../types';

interface RealtimeMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface SenderProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  photo_url: string | null;
  email: string | null;
}

function isRealtimeMessage(value: unknown): value is RealtimeMessage {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return ['id', 'chat_id', 'sender_id', 'content', 'created_at'].every((key) => typeof row[key] === 'string');
}

export function useChatRealtime(activeChatId: string | null) {
  const queryClient = useQueryClient();
  const [connection, setConnection] = useState<{ chatId: string | null; status: RealtimeStatus }>({
    chatId: null,
    status: 'idle',
  });

  useEffect(() => {
    if (!activeChatId) return;

    const channel = supabase
      .channel(`messages-realtime-${activeChatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${activeChatId}` },
        async (payload) => {
          if (!isRealtimeMessage(payload.new)) {
            console.error('Supabase Realtime devolvió un mensaje con formato inválido.', payload.new);
            return;
          }
          const newMessage = payload.new;
          const { data: sender, error } = await supabase
            .from('profiles')
            .select('id,first_name,last_name,role,photo_url,email')
            .eq('id', newMessage.sender_id)
            .single();
          if (error) {
            console.error('No se pudo recuperar el remitente del mensaje en tiempo real.', error);
            void queryClient.invalidateQueries({ queryKey: ['messages', activeChatId] });
            return;
          }

          const senderProfile: Profile = {
            ...(sender as SenderProfile),
            created_at: '',
            updated_at: '',
          };
          const fullMessage: Message = { ...newMessage, sender: senderProfile };
          queryClient.setQueryData<Message[]>(['messages', activeChatId], (current = []) =>
            current.some((message) => message.id === fullMessage.id) ? current : [...current, fullMessage],
          );
          void queryClient.invalidateQueries({ queryKey: ['chats'] });
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          const deletedId = payload.old && typeof payload.old.id === 'string' ? payload.old.id : null;
          if (!deletedId) return;
          queryClient.setQueryData<Message[]>(['messages', activeChatId], (current = []) =>
            current.filter((message) => message.id !== deletedId),
          );
          void queryClient.invalidateQueries({ queryKey: ['chats'] });
        },
      )
      .subscribe((channelStatus) => {
        if (channelStatus === 'SUBSCRIBED') setConnection({ chatId: activeChatId, status: 'connected' });
        if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT') {
          console.error('La suscripción de mensajería en tiempo real falló.', { channelStatus, activeChatId });
          setConnection({ chatId: activeChatId, status: 'error' });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeChatId, queryClient]);

  if (!activeChatId) return 'idle';
  return connection.chatId === activeChatId ? connection.status : 'connecting';
}
