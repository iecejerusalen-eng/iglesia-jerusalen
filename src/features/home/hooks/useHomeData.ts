import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import { getDb } from '../../../config/localDb';
import type { Schedule, Sermon, Event as DbEvent, Member } from '../../../types';
import type { PageSection } from '../types';
import { DEFAULT_SECTIONS, FALLBACK_SCHEDULES, MOCK_SERMONS } from '../constants';
import { isBirthdayInNext7Days, calculateAgeTurning, getBirthdayTimestampInWindow } from '../utils';

export const useHomeData = () => {
  const statsQuery = useQuery({
    queryKey: ['homeStats'],
    queryFn: async () => {
      const db = await getDb();
      let allMembers = await db.getAll('local_members');
      allMembers = allMembers.filter((m: any) => !m.deleted_at);

      if (allMembers.length === 0) {
        const { data, error } = await supabase.from('members').select('id, birth_date, baptism_date').is('deleted_at', null);
        if (!error && data) allMembers = data;
      }

      const { count: cellsCount } = await supabase.from('cells').select('id', { count: 'exact', head: true });

      let baptizedCount = 0;
      let kidsCount = 0;
      let youthCount = 0;

      const currentYear = new Date().getFullYear();

      allMembers.forEach((m: any) => {
        if (m.baptism_date) baptizedCount++;
        if (m.birth_date) {
          const bYear = Number(m.birth_date.split('-')[0]);
          if (!isNaN(bYear)) {
            const age = currentYear - bYear;
            if (age <= 12) kidsCount++;
            else if (age > 12 && age <= 25) youthCount++;
          }
        }
      });

      return {
        members: allMembers.length || 350,
        baptized: baptizedCount || 180,
        cells: cellsCount || 18,
        kids: kidsCount || 120,
        youth: youthCount || 80
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const sectionsQuery = useQuery({
    queryKey: ['homeSections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_contents')
        .select('*')
        .eq('page', 'home')
        .order('order_index', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        return data as PageSection[];
      }
      return DEFAULT_SECTIONS as PageSection[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const schedulesQuery = useQuery({
    queryKey: ['homeSchedules'],
    queryFn: async () => {
      let localData: Schedule[] = [];
      try {
        const db = await getDb();
        const allSchedules = await db.getAll('local_schedules');
        allSchedules.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
        localData = allSchedules;
      } catch (dbErr) {
        console.warn('Local database query failed, trying Supabase:', dbErr);
      }

      if (localData && localData.length > 0) {
        return localData;
      }

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        return data as Schedule[];
      }
      return FALLBACK_SCHEDULES;
    },
    staleTime: 5 * 60 * 1000,
  });

  const sermonsQuery = useQuery({
    queryKey: ['homeSermons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sermons')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      if (data && data.length > 0) {
        return data as Sermon[];
      }
      return MOCK_SERMONS;
    },
    staleTime: 5 * 60 * 1000,
  });

  const eventsQuery = useQuery({
    queryKey: ['homeEvents'],
    queryFn: async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('events')
        .select('*, ministries(name)')
        .eq('is_public', true)
        .gte('start_date', todayStr)
        .order('start_date', { ascending: true })
        .limit(3);

      if (error) throw error;
      return (data || []) as DbEvent[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const birthdaysQuery = useQuery({
    queryKey: ['homeBirthdays'],
    queryFn: async () => {
      let data: Partial<Member>[] = [];
      try {
        const db = await getDb();
        const allMembers = await db.getAll('local_members');
        const localData = allMembers.filter((m: any) => !m.deleted_at && m.birth_date);
        data = localData || [];
      } catch (dbErr) {
        console.warn('Local database query failed, trying Supabase:', dbErr);
      }

      if (!data || data.length === 0) {
        const { data: dbData, error } = await supabase
          .from('members')
          .select('id, first_name, last_name, birth_date, photo_url')
          .is('deleted_at', null)
          .not('birth_date', 'is', null);
        if (error) throw error;
        data = dbData || [];
      }

      const filtered = data
        .filter((m) => isBirthdayInNext7Days(m.birth_date!))
        .map((m) => ({
          id: m.id!,
          first_name: m.first_name || '',
          last_name: m.last_name || '',
          birth_date: m.birth_date!,
          photo_url: m.photo_url,
          ageTurning: calculateAgeTurning(m.birth_date!)
        }));

      return filtered.sort((a, b) => {
        const aTime = getBirthdayTimestampInWindow(a.birth_date);
        const bTime = getBirthdayTimestampInWindow(b.birth_date);
        return aTime - bTime;
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    stats: statsQuery.data || { members: 350, baptized: 180, cells: 18, kids: 120, youth: 80 },
    isStatsLoading: statsQuery.isLoading,
    
    sections: sectionsQuery.data || DEFAULT_SECTIONS,
    isSectionsLoading: sectionsQuery.isLoading,
    
    schedules: schedulesQuery.data || [],
    loadingSchedules: schedulesQuery.isLoading,
    
    sermons: sermonsQuery.data || [],
    loadingSermons: sermonsQuery.isLoading,
    
    events: eventsQuery.data || [],
    loadingEvents: eventsQuery.isLoading,
    
    birthdayMembers: birthdaysQuery.data || [],
    isBirthdaysLoading: birthdaysQuery.isLoading,
  };
};
