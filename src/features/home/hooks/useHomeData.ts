import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import { getDb } from '../../../config/localDb';
import type { Member, Schedule, Sermon, Event as DbEvent } from '../../../types';
import type { BirthdayMember, PageSection } from '../types';
import { DEFAULT_SECTIONS, FALLBACK_SCHEDULES, MOCK_SERMONS } from '../constants';
import { fetchPublicBirthdays, toBirthdayInfo } from '../../birthdays/hooks/useBirthdays';
import { fetchPublicChurchAnnouncements } from '../../announcements/service';
import type { ChurchAnnouncement } from '../../announcements/types';

type HomeMemberSnapshot = Pick<Member, 'birth_date' | 'baptism_date'> & { deleted_at?: string | null };

export const useHomeData = () => {
  const statsQuery = useQuery({
    queryKey: ['homeStats'],
    queryFn: async () => {
      const db = await getDb();
      let allMembers = (await db.getAll('local_members')) as HomeMemberSnapshot[];
      allMembers = allMembers.filter((member) => !member.deleted_at);

      if (allMembers.length === 0) {
        const { data, error } = await supabase.from('members').select('id, birth_date, baptism_date').is('deleted_at', null);
        if (!error && data) allMembers = data as HomeMemberSnapshot[];
      }

      const { count: cellsCount } = await supabase.from('cells').select('id', { count: 'exact', head: true });

      let baptizedCount = 0;
      let kidsCount = 0;
      let youthCount = 0;

      const currentYear = new Date().getFullYear();

      allMembers.forEach((member) => {
        if (member.baptism_date) baptizedCount++;
        if (member.birth_date) {
          const bYear = Number(member.birth_date.split('-')[0]);
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
        const allSchedules = (await db.getAll('local_schedules')) as Schedule[];
        allSchedules.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
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

  const announcementsQuery = useQuery<ChurchAnnouncement[]>({
    queryKey: ['homeChurchAnnouncements'],
    queryFn: async () => {
      try {
        return await fetchPublicChurchAnnouncements(3);
      } catch (error) {
        console.error('No se pudieron cargar los anuncios de la iglesia:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const birthdaysQuery = useQuery({
    queryKey: ['publicBirthdaysRaw'],
    queryFn: fetchPublicBirthdays,
  });

  const homeBirthdayMembers = useMemo((): BirthdayMember[] => {
    const now = new Date();
    return (birthdaysQuery.data || [])
        .map((member) => toBirthdayInfo(member, now))
        .filter((birthday) => birthday.isThisWeek)
        .sort((a, b) => a.daysRemaining - b.daysRemaining)
        .map(({ member }) => member);
  }, [birthdaysQuery.data]);

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

    announcements: announcementsQuery.data || [],
    loadingAnnouncements: announcementsQuery.isLoading,
    announcementsError: announcementsQuery.error,
    
    birthdayMembers: homeBirthdayMembers,
    isBirthdaysLoading: birthdaysQuery.isLoading,
  };
};
