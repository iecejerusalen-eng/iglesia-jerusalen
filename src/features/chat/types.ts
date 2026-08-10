import type { Chat, Member, Ministry, Profile } from '../../types';

export type ChatContact = Pick<Profile, 'id' | 'first_name' | 'last_name' | 'role' | 'photo_url' | 'email' | 'member_id'> & {
  member: Pick<Member, 'id' | 'first_name' | 'last_name'> | null;
};

export type ChatMember = Pick<
  Member,
  'id' | 'first_name' | 'last_name' | 'birth_date' | 'gender' | 'ministry_id' | 'leadership_role' | 'is_leader'
>;

export type ChatMinistry = Pick<Ministry, 'id' | 'name' | 'anniversary_date'>;

export interface ChatContactsData {
  contacts: ChatContact[];
  members: ChatMember[];
  ministries: ChatMinistry[];
}

export interface BroadcastResult {
  sent: number;
}

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface ChatListState {
  chats: Chat[];
  unavailableReason: string | null;
}
