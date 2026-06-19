import { create } from 'zustand';
import { supabase } from '../config/supabase';
import type { Chat, Message, Profile, Member, Ministry } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  contacts: Profile[];
  members: Member[];
  ministries: Ministry[];
  loadingChats: boolean;
  loadingMessages: boolean;
  loadingContacts: boolean;
  retentionDays: number;
  realtimeChannel: RealtimeChannel | null;

  fetchChats: () => Promise<void>;
  fetchContacts: () => Promise<void>;
  fetchRetentionDays: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (chatId: string, content: string) => Promise<void>;
  startChatWith: (profileId: string) => Promise<Chat>;
  sendBroadcast: (
    targetProfileIds: string[],
    messageContent: string,
    onProgress?: (sent: number, total: number) => void
  ) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  subscribeToRealtime: () => void;
  unsubscribeFromRealtime: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  contacts: [],
  members: [],
  ministries: [],
  loadingChats: false,
  loadingMessages: false,
  loadingContacts: false,
  retentionDays: 7,
  realtimeChannel: null,

  fetchChats: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ loadingChats: true });
    try {
      // Fetch chats where current user is a participant
      const { data: participantData, error: partError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);

      if (partError) throw partError;

      if (!participantData || participantData.length === 0) {
        set({ chats: [], loadingChats: false });
        return;
      }

      const chatIds = participantData.map((p) => p.chat_id);

      // Fetch the chat details and their participants
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

      // Fetch last messages for these chats
      const { data: lastMessages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      // Group last messages by chat_id
      const lastMessageMap: Record<string, Message> = {};
      if (lastMessages) {
        lastMessages.forEach((msg) => {
          if (!lastMessageMap[msg.chat_id]) {
            lastMessageMap[msg.chat_id] = msg as Message;
          }
        });
      }

      // Map profiles into the chat format
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

      // Sort chats by last message date, or creation date
      formattedChats.sort((a, b) => {
        const dateA = a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.created_at).getTime();
        const dateB = b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.created_at).getTime();
        return dateB - dateA;
      });

      set({ chats: formattedChats, loadingChats: false });
    } catch (error) {
      console.error('Error fetching chats:', error);
      set({ loadingChats: false });
    }
  },

  fetchContacts: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ loadingContacts: true });
    try {
      // 1. Fetch other user profiles
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, photo_url, email, member_id')
        .neq('id', user.id);

      if (profError) throw profError;

      // 2. Fetch CRM members
      const { data: members, error: memError } = await supabase
        .from('members')
        .select('id, first_name, last_name, birth_date, gender, ministry_id, leadership_role, is_leader')
        .is('deleted_at', null);

      if (memError) throw memError;

      // 3. Fetch Ministries
      const { data: ministries, error: minError } = await supabase
        .from('ministries')
        .select('*');

      if (minError) throw minError;

      // Map member object into each profile if link exists
      const memberMap = new Map<string, Member>();
      members?.forEach(m => memberMap.set(m.id, m as Member));

      const contactsWithMember = (profiles || []).map((profile: any) => {
        const member = profile.member_id ? memberMap.get(profile.member_id) : null;
        return {
          ...profile,
          member: member ? { id: member.id, first_name: member.first_name, last_name: member.last_name } : null
        };
      });

      set({
        contacts: contactsWithMember,
        members: (members || []) as Member[],
        ministries: (ministries || []) as Ministry[],
        loadingContacts: false
      });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      set({ loadingContacts: false });
    }
  },

  fetchRetentionDays: async () => {
    try {
      const { data, error } = await supabase
        .from('church_settings')
        .select('chat_retention_days')
        .eq('id', 1)
        .single();
      if (error) throw error;
      if (data) {
        set({ retentionDays: data.chat_retention_days });
      }
    } catch (error) {
      console.error('Error fetching retention days:', error);
    }
  },

  fetchMessages: async (chatId) => {
    set({ loadingMessages: true });
    try {
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

      // Format sender mapping
      const formattedMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        chat_id: msg.chat_id,
        sender_id: msg.sender_id,
        content: msg.content,
        created_at: msg.created_at,
        sender: msg.sender ? (msg.sender as Profile) : null,
      }));

      set({ messages: formattedMessages, loadingMessages: false });
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ loadingMessages: false });
    }
  },

  setActiveChat: (chat) => {
    set({ activeChat: chat, messages: [] });
    if (chat) {
      get().fetchMessages(chat.id);
    }
  },

  sendMessage: async (chatId, content) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
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

      // Add to current message list (if it's still the active chat)
      const currentActive = get().activeChat;
      if (currentActive && currentActive.id === chatId) {
        const senderObj = Array.isArray(data.sender) ? data.sender[0] : data.sender;
        const newMsg: Message = {
          id: data.id,
          chat_id: data.chat_id,
          sender_id: data.sender_id,
          content: data.content,
          created_at: data.created_at,
          sender: senderObj ? (senderObj as unknown as Profile) : null,
        };
        set((state) => ({
          messages: [...state.messages, newMsg],
        }));
      }

      // Refresh chats list to update last message
      get().fetchChats();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  startChatWith: async (profileId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    try {
      // Check if a direct chat already exists
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
        // Chat exists, find it in local state or refetch
        await get().fetchChats();
        const found = get().chats.find((c) => c.id === existingChatId);
        if (found) {
          set({ activeChat: found });
          get().fetchMessages(found.id);
          return found;
        }
      }

      // Chat does not exist, create new one
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({ name: null, is_group: false })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add participants
      const { error: partError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_id: newChat.id, user_id: user.id },
          { chat_id: newChat.id, user_id: profileId },
        ]);

      if (partError) throw partError;

      // Fetch profiles for the chat
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

      const fullNewChat: Chat = {
        id: newChat.id,
        name: null,
        is_group: false,
        created_at: newChat.created_at,
        participants: [myProfile as Profile, targetProfile as Profile],
        last_message: null,
      };

      set((state) => ({
        chats: [fullNewChat, ...state.chats],
        activeChat: fullNewChat,
        messages: [],
      }));

      return fullNewChat;
    } catch (error) {
      console.error('Error starting chat:', error);
      throw error;
    }
  },

  sendBroadcast: async (targetProfileIds, messageContent, onProgress) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const total = targetProfileIds.length;
    let sentCount = 0;

    for (const targetId of targetProfileIds) {
      try {
        // Find or create direct chat
        // 1. Get user's chats
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
          // Create new chat
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
          // Send message
          await supabase.from('messages').insert({
            chat_id: chatToUseId,
            sender_id: user.id,
            content: messageContent.trim(),
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

    // Refresh chats
    get().fetchChats();
  },

  deleteMessage: async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      set((state) => ({
        messages: state.messages.filter((m) => m.id !== messageId),
      }));

      // Refresh chats list to update last message preview
      get().fetchChats();
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  deleteChat: async (chatId) => {
    try {
      // 1. Delete chat participants first to respect references
      const { error: partErr } = await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', chatId);

      if (partErr) throw partErr;

      // 2. Delete all messages associated with the chat
      const { error: msgErr } = await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId);

      if (msgErr) throw msgErr;

      // 3. Delete the chat itself
      const { error: chatErr } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (chatErr) throw chatErr;

      // 4. Reset state locally
      set((state) => ({
        chats: state.chats.filter((c) => c.id !== chatId),
        activeChat: state.activeChat?.id === chatId ? null : state.activeChat,
        messages: state.activeChat?.id === chatId ? [] : state.messages
      }));
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  },

  subscribeToRealtime: () => {
    // Clean up existing subscription
    get().unsubscribeFromRealtime();

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        async (payload) => {
          const active = get().activeChat;

          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as any;

            // If the message belongs to our active chat, fetch details and append
            if (active && newMsg.chat_id === active.id) {
              // Fetch sender profile to be consistent
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

              // Prevent duplicate message inserts
              set((state) => {
                if (state.messages.some((m) => m.id === fullMsg.id)) {
                  return state;
                }
                return { messages: [...state.messages, fullMsg] };
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const oldMsg = payload.old as any;
            set((state) => ({
              messages: state.messages.filter((m) => m.id !== oldMsg.id),
            }));
          }

          // Trigger chat list reload to update last message/order
          get().fetchChats();
        }
      )
      .subscribe();

    set({ realtimeChannel: channel });
  },

  unsubscribeFromRealtime: () => {
    const channel = get().realtimeChannel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ realtimeChannel: null });
    }
  },
}));
