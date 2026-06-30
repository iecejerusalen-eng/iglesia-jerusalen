import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { Chat, Message, Profile } from '../../../types';
import { fetchChats } from './useChats';

export function useChatMutations() {
  const queryClient = useQueryClient();

  const sendMessage = useMutation({
    mutationFn: async ({ chatId, content }: { chatId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: content.trim(),
        })
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
        .single();

      if (error) throw error;
      
      const senderObj = Array.isArray(data.sender) ? data.sender[0] : data.sender;
      return {
        id: data.id,
        chat_id: data.chat_id,
        sender_id: data.sender_id,
        content: data.content,
        created_at: data.created_at,
        sender: senderObj ? (senderObj as unknown as Profile) : null,
      } as Message;
    },
    onSuccess: (newMessage, { chatId }) => {
      // Optimistically update messages query
      queryClient.setQueryData(['messages', chatId], (old: Message[] | undefined) => {
        if (!old) return [newMessage];
        return [...old, newMessage];
      });
      // Invalidate chats to update last message
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  const startChatWith = useMutation({
    mutationFn: async (profileId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: myParticipants, error: myPartError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);

      if (myPartError) throw myPartError;

      let existingChatId: string | null = null;

      if (myParticipants && myParticipants.length > 0) {
        const myChatIds = myParticipants.map((p) => p.chat_id);
        const { data: commonParticipants, error: commonError } = await supabase
          .from('chat_participants')
          .select(`
            chat_id,
            chats!inner (
              id,
              name,
              is_group,
              created_at
            )
          `)
          .in('chat_id', myChatIds)
          .eq('user_id', profileId)
          .eq('chats.is_group', false);

        if (commonError) throw commonError;
        if (commonParticipants && commonParticipants.length > 0) {
          existingChatId = commonParticipants[0].chat_id;
        }
      }

      if (existingChatId) {
        const chats = await fetchChats();
        const found = chats.find((c) => c.id === existingChatId);
        if (found) return found;
      }

      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({ name: null, is_group: false })
        .select()
        .single();

      if (chatError) throw chatError;

      const { error: partError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_id: newChat.id, user_id: user.id },
          { chat_id: newChat.id, user_id: profileId },
        ]);

      if (partError) throw partError;

      const { data: targetProfile, error: pError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, photo_url, email')
        .eq('id', profileId)
        .single();

      if (pError) throw pError;

      const { data: myProfile, error: mError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, photo_url, email')
        .eq('id', user.id)
        .single();

      if (mError) throw mError;

      return {
        id: newChat.id,
        name: null,
        is_group: false,
        created_at: newChat.created_at,
        participants: [myProfile as Profile, targetProfile as Profile],
        last_message: null,
      } as Chat;
    },
    onSuccess: (newChat) => {
      queryClient.setQueryData(['chats'], (old: Chat[] | undefined) => {
        if (!old) return [newChat];
        // Ensure not duplicated
        if (old.some(c => c.id === newChat.id)) return old;
        return [newChat, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  const sendBroadcast = useMutation({
    mutationFn: async ({
      targetProfileIds,
      messageContent,
      ministries,
      onProgress,
    }: {
      targetProfileIds: string[];
      messageContent: string;
      ministries: any[];
      onProgress?: (sent: number, total: number) => void;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const total = targetProfileIds.length;
      let sentCount = 0;

      const { data: targetProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, ministry_id')
        .in('id', targetProfileIds);
      
      const profileMap = new Map<string, any>();
      targetProfiles?.forEach(p => profileMap.set(p.id, p));

      const getRoleLabel = (role: string) => {
        switch (role) {
          case 'admin': return 'Administrador';
          case 'pastor': return 'Pastor';
          case 'leader': return 'Líder';
          case 'secretary':
          case 'secretaria': return 'Secretaría';
          case 'member': return 'Miembro';
          case 'guest': return 'Invitado';
          default: return 'Miembro';
        }
      };

      for (const targetId of targetProfileIds) {
        try {
          const targetProfile = profileMap.get(targetId);
          let dynamicContent = messageContent.trim();
          if (targetProfile) {
            const name = targetProfile.first_name || '';
            const lastName = targetProfile.last_name || '';
            const roleLabel = getRoleLabel(targetProfile.role || '');
            
            let ministryName = '';
            if (targetProfile.ministry_id) {
              const min = ministries.find(m => m.id === targetProfile.ministry_id);
              if (min) ministryName = min.name;
            }
            
            dynamicContent = dynamicContent
              .replace(/\[Nombre\]/g, name)
              .replace(/\[Apellido\]/g, lastName)
              .replace(/\[Rol\]/g, roleLabel)
              .replace(/\[Ministerio\]/g, ministryName);
          }

          const { data: myParticipants } = await supabase
            .from('chat_participants')
            .select('chat_id')
            .eq('user_id', user.id);

          let chatToUseId: string | null = null;

          if (myParticipants && myParticipants.length > 0) {
            const myChatIds = myParticipants.map((p) => p.chat_id);
            const { data: commonParticipants } = await supabase
              .from('chat_participants')
              .select(`
                chat_id,
                chats!inner (
                  is_group
                )
              `)
              .in('chat_id', myChatIds)
              .eq('user_id', targetId)
              .eq('chats.is_group', false);

            if (commonParticipants && commonParticipants.length > 0) {
              chatToUseId = commonParticipants[0].chat_id;
            }
          }

          if (!chatToUseId) {
            const { data: newChat } = await supabase
              .from('chats')
              .insert({ name: null, is_group: false })
              .select()
              .single();

            if (newChat) {
              chatToUseId = newChat.id;
              await supabase
                .from('chat_participants')
                .insert([
                  { chat_id: newChat.id, user_id: user.id },
                  { chat_id: newChat.id, user_id: targetId },
                ]);
            }
          }

          if (chatToUseId) {
            await supabase.from('messages').insert({
              chat_id: chatToUseId,
              sender_id: user.id,
              content: dynamicContent,
            });
          }

          sentCount++;
          if (onProgress) {
            onProgress(sentCount, total);
          }
        } catch (err) {
          console.error(`Error sending broadcast to profile ID ${targetId}:`, err);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      return messageId;
    },
    onSuccess: () => {
      // Invalidate all messages since we don't necessarily have chatId in mutation variable here unless we pass it
      // Let's pass chatId if we want to selectively invalidate, but invalidating all is fine for now
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    }
  });

  const deleteChat = useMutation({
    mutationFn: async (chatId: string) => {
      const { error: partErr } = await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', chatId);
      if (partErr) throw partErr;

      const { error: msgErr } = await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId);
      if (msgErr) throw msgErr;

      const { error: chatErr } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);
      if (chatErr) throw chatErr;

      return chatId;
    },
    onSuccess: (chatId) => {
      queryClient.setQueryData(['chats'], (old: Chat[] | undefined) => {
        if (!old) return old;
        return old.filter((c) => c.id !== chatId);
      });
      queryClient.removeQueries({ queryKey: ['messages', chatId] });
    }
  });

  return {
    sendMessage,
    startChatWith,
    sendBroadcast,
    deleteMessage,
    deleteChat,
  };
}
