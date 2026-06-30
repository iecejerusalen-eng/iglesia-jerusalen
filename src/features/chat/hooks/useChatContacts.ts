import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { Profile, Member, Ministry } from '../../../types';

export const fetchContacts = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { contacts: [], members: [], ministries: [] };

  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, photo_url, email, member_id')
    .neq('id', user.id);

  if (profError) throw profError;

  const { data: members, error: memError } = await supabase
    .from('members')
    .select('id, first_name, last_name, birth_date, gender, ministry_id, leadership_role, is_leader')
    .is('deleted_at', null);

  if (memError) throw memError;

  const { data: ministries, error: minError } = await supabase
    .from('ministries')
    .select('*');

  if (minError) throw minError;

  const memberMap = new Map<string, Member>();
  members?.forEach(m => memberMap.set(m.id, m as Member));

  const contactsWithMember = (profiles || []).map((profile: any) => {
    const member = profile.member_id ? memberMap.get(profile.member_id) : null;
    return {
      ...profile,
      member: member ? { id: member.id, first_name: member.first_name, last_name: member.last_name } : null
    } as Profile;
  });

  return {
    contacts: contactsWithMember,
    members: (members || []) as Member[],
    ministries: (ministries || []) as Ministry[],
  };
};

export function useChatContacts() {
  return useQuery({
    queryKey: ['chatContacts'],
    queryFn: fetchContacts,
    staleTime: 1000 * 60 * 10,
  });
}
