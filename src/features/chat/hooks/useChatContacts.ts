import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { ChatContact, ChatContactsData, ChatMember, ChatMinistry } from '../types';

export const fetchContacts = async (): Promise<ChatContactsData> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Debes iniciar sesión para consultar contactos.');

  const [profilesResult, membersResult, ministriesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,first_name,last_name,role,photo_url,email,member_id')
      .eq('banned', false)
      .neq('id', user.id)
      .order('first_name'),
    supabase
      .from('members')
      .select('id,first_name,last_name,birth_date,gender,ministry_id,leadership_role,is_leader')
      .is('deleted_at', null),
    supabase.from('ministries').select('id,name,anniversary_date').order('name'),
  ]);
  if (profilesResult.error) throw profilesResult.error;
  if (membersResult.error) throw membersResult.error;
  if (ministriesResult.error) throw ministriesResult.error;

  const members = (membersResult.data ?? []) as ChatMember[];
  const memberMap = new Map(members.map((member) => [member.id, member]));
  const contacts = (profilesResult.data ?? []).map((profile): ChatContact => {
    const member = profile.member_id ? memberMap.get(profile.member_id) : undefined;
    return {
      ...profile,
      member: member ? { id: member.id, first_name: member.first_name, last_name: member.last_name } : null,
    } as ChatContact;
  });

  return { contacts, members, ministries: (ministriesResult.data ?? []) as ChatMinistry[] };
};

export function useChatContacts() {
  return useQuery<ChatContactsData, Error>({
    queryKey: ['chatContacts'],
    queryFn: fetchContacts,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
