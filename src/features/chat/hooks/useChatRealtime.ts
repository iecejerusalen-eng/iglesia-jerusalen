import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { Message, Profile } from '../../../types';

export function useChatRealtime(activeChatId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as any;

            if (activeChatId && newMsg.chat_id === activeChatId) {
              const { data: senderProf } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, role, photo_url, email')
                .eq('id', newMsg.sender_id)
                .single();

              const fullMsg: Message = {
                id: newMsg.id,
                chat_id: newMsg.chat_id,
                sender_id: newMsg.sender_id,
                content: newMsg.content,
                created_at: newMsg.created_at,
                sender: senderProf ? (senderProf as Profile) : null,
              };

              queryClient.setQueryData(['messages', activeChatId], (old: Message[] | undefined) => {
                if (!old) return [fullMsg];
                if (old.some(m => m.id === fullMsg.id)) return old;
                return [...old, fullMsg];
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const oldMsg = payload.old as any;
            // Since we might not know which chat it belongs to from the payload easily without querying,
            // we invalidate all messages or the active one
            if (activeChatId) {
              queryClient.setQueryData(['messages', activeChatId], (old: Message[] | undefined) => {
                if (!old) return old;
                return old.filter(m => m.id !== oldMsg.id);
              });
            }
          }

          queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, activeChatId]);
}
