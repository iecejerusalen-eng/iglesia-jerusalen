import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { Schedule, Sermon, Event as DbEvent } from '../../../types';
import type { BirthdayMember, PageSection } from '../types';
import { DEFAULT_SECTIONS } from '../constants';
import { fetchPublicBirthdays, toBirthdayInfo } from '../../birthdays/hooks/useBirthdays';
import { fetchPublicChurchAnnouncements } from '../../announcements/service';
import type { ChurchAnnouncement } from '../../announcements/types';
import { ecuadorDateKey } from '../../../utils/dateInEcuador';

export const useHomeData = () => {
  const unpublishedStats = { members: 0, baptized: 0, cells: 0, kids: 0, youth: 0 };

  const sectionsQuery = useQuery({
    queryKey: ['homeSections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_contents')
        .select('id, page, section, name, order_index, section_type, title, subtitle, content_blocks, cover_image_url')
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
      const { data, error } = await supabase
        .from('schedules')
        .select('id, day, title, time_range, description, order_index, created_at')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return (data ?? []) as Schedule[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const sermonsQuery = useQuery({
    queryKey: ['homeSermons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sermons')
        .select('id, title, pastor_name, youtube_url, audio_url, content, date, created_at, metadata')
        .order('date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      if (data && data.length > 0) {
        return data as Sermon[];
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const eventsQuery = useQuery({
    queryKey: ['homeEvents'],
    queryFn: async () => {
      const todayStr = ecuadorDateKey();
      const { data, error } = await supabase
        .from('events')
        .select(`
          id, title, description, start_date, end_date, start_time, end_time,
          is_recurring, recurrence_type, recurrence_days, cover_image_url, emoji,
          ministry_id, leaders_in_charge, is_public, space_id,
          created_at, ministries(name, slug, theme_color)
        `)
        .eq('is_public', true)
        .or(`start_date.gte.${todayStr},and(start_date.lt.${todayStr},end_date.gte.${todayStr})`)
        .order('start_date', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: false })
        .limit(3);

      if (error) throw error;
      return (data || []).map((event) => ({
        ...event,
        ministries: Array.isArray(event.ministries) ? event.ministries[0] ?? null : event.ministries,
      })) as DbEvent[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const announcementsQuery = useQuery<ChurchAnnouncement[]>({
    queryKey: ['homeChurchAnnouncements'],
    queryFn: async () => {
      try {
        return await fetchPublicChurchAnnouncements(3, { excludePastEvents: true });
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
    stats: unpublishedStats,
    isStatsLoading: false,
    
    sections: sectionsQuery.data || DEFAULT_SECTIONS,
    isSectionsLoading: sectionsQuery.isLoading,
    
    schedules: schedulesQuery.data || [],
    loadingSchedules: schedulesQuery.isLoading,
    schedulesError: schedulesQuery.error,
    
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
