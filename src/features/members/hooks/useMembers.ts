import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import { getDb } from '../../../config/localDb';
import type { MemberWithRelations, LocalMemberRow } from '../utils/schema';

export const useMembers = () => {
  return useQuery({
    queryKey: ['members'],
    queryFn: async (): Promise<MemberWithRelations[]> => {
      // Fetch user profiles first to map linked accounts
      let profilesList: Array<{ id: string; member_id: string; email: string; role: string }> = [];
      try {
        const { data: pData } = await supabase
          .from('profiles')
          .select('id, member_id, email, role');
        profilesList = (pData || []) as Array<{ id: string; member_id: string; email: string; role: string }>;
      } catch (pe) {
        console.warn('Could not load profiles for linkage mapping:', pe);
      }

      // Try fetching from local IDB first
      let cached: LocalMemberRow[] = [];
      try {
        const db = await getDb();
        const allMembers = await db.getAll('local_members');
        cached = (allMembers || []).filter(m => !m.deleted_at) as unknown as LocalMemberRow[];
        cached.sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));
      } catch (dbErr) {
        console.warn('Local DB failed or timed out, fallback to Supabase:', dbErr);
      }

      let loadedMembers: MemberWithRelations[] = [];

      if (cached && cached.length > 0) {
        // Map SQLite attributes back to type model
        loadedMembers = cached.map(m => ({
          ...m,
          is_leader: m.is_leader === 1,
          is_studying: m.is_studying === 1,
          member_emails: m.emails ? JSON.parse(m.emails) : [],
          member_service_areas: m.service_areas ? JSON.parse(m.service_areas) : [],
          member_talents: m.talents ? JSON.parse(m.talents) : [],
          member_spiritual_gifts: m.spiritual_gifts ? JSON.parse(m.spiritual_gifts) : []
        })) as unknown as MemberWithRelations[];
      } else {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('members')
          .select(`
            *,
            member_emails(email),
            member_service_areas(catalog_roles(id, name)),
            member_talents(catalog_roles(id, name)),
            member_spiritual_gifts(catalog_roles(id, name)),
            ministries(id, name),
            catalog_roles!role_id(id, name),
            careers!career_id(id, name),
            studying_careers:careers!studying_career_id(id, name)
          `)
          .is('deleted_at', null)
          .order('last_name', { ascending: true });

        if (error) throw error;
        loadedMembers = (data || []) as unknown as MemberWithRelations[];
      }

      // Map profiles onto loaded members
      const finalMembers = loadedMembers.map(m => ({
        ...m,
        profiles: profilesList.filter(p => p.member_id === m.id)
      }));

      return finalMembers;
    },
  });
};
