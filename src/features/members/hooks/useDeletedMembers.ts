import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import { getDb } from '../../../config/localDb';
import type { MemberWithRelations, LocalMemberRow } from '../utils/schema';

export const useDeletedMembers = () => {
  return useQuery({
    queryKey: ['deleted_members'],
    queryFn: async (): Promise<MemberWithRelations[]> => {
      // Try fetching from local IDB first
      let cached: LocalMemberRow[] = [];
      try {
        const db = await getDb();
        const allMembers = await db.getAll('local_members');
        cached = (allMembers || []).filter(m => m.deleted_at) as unknown as LocalMemberRow[];
        cached.sort((a, b) => new Date(b.deleted_at || '').getTime() - new Date(a.deleted_at || '').getTime());
      } catch (dbErr) {
        console.warn('Local DB failed or timed out, fallback to Supabase:', dbErr);
      }

      let loadedMembers: MemberWithRelations[];

      if (cached && cached.length > 0) {
        loadedMembers = cached.map(m => ({
          ...m,
          member_emails: m.emails ? JSON.parse(m.emails) : [],
          member_phones: m.phones ? JSON.parse(m.phones) : [],
        })) as unknown as MemberWithRelations[];
      } else {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('members')
          .select(`
            id,
            first_name,
            last_name,
            photo_url,
            created_at,
            deleted_at,
            member_emails(email),
            member_phones(phone)
          `)
          .not('deleted_at', 'is', null)
          .order('deleted_at', { ascending: false });

        if (error) throw error;
        loadedMembers = (data || []) as unknown as MemberWithRelations[];
      }

      return loadedMembers;
    },
  });
};
