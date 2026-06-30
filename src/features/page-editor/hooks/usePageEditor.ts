import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { DBPageSection } from '../types';
import { PAGES_METADATA } from '../constants';

export const usePageEditor = () => {
  const [selectedPage, setSelectedPage] = useState<'home' | 'about'>('home');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [sections, setSections] = useState<DBPageSection[]>([]);

  // Query for fetching sections
  const { data: serverSections, isLoading, refetch } = useQuery({
    queryKey: ['page_contents', selectedPage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_contents')
        .select('*')
        .eq('page', selectedPage)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as DBPageSection[];
    },
  });

  // Sync server state to local state
  useEffect(() => {
    if (serverSections && serverSections.length > 0) {
      setSections(serverSections);
      setSelectedSection(current => {
        if (!current || !serverSections.some(s => s.id === current)) {
          return serverSections[0].id;
        }
        return current;
      });
    } else if (serverSections && serverSections.length === 0) {
      const defaults: DBPageSection[] = PAGES_METADATA[selectedPage].sections.map((sec, idx) => ({
        id: sec.id,
        page: selectedPage,
        section: sec.id.replace(`${selectedPage}_`, ''),
        name: sec.name,
        title: sec.defaultTitle,
        subtitle: sec.defaultSubtitle,
        content_blocks: [],
        order_index: (idx + 1) * 10,
        section_type: sec.id.includes('schedules') ? 'system_schedules' :
                      sec.id.includes('events') ? 'system_events' :
                      sec.id.includes('sermons') ? 'system_sermons' :
                      sec.id.includes('birthdays') ? 'system_birthdays' :
                      sec.id.includes('gallery') ? 'system_gallery' :
                      sec.id.includes('pillars') ? 'system_about_pillars' : 'custom',
        cover_image_url: ''
      }));
      setSections(defaults);
      setSelectedSection(defaults[0].id);
    }
  }, [serverSections, selectedPage]);

  // Local state updaters
  const handleUpdateField = useCallback(<K extends keyof DBPageSection>(
    key: K, 
    value: DBPageSection[K] | ((prev: DBPageSection[K]) => DBPageSection[K])
  ) => {
    setSections(prev => prev.map(s => {
      if (s.id !== selectedSection) return s;
      const updatedValue = typeof value === 'function' 
        ? (value as (prev: DBPageSection[K]) => DBPageSection[K])(s[key]) 
        : value;
      return { ...s, [key]: updatedValue };
    }));
  }, [selectedSection]);

  const activeSec = sections.find(s => s.id === selectedSection);

  return {
    selectedPage,
    setSelectedPage,
    selectedSection,
    setSelectedSection,
    sections,
    setSections,
    activeSec,
    loading: isLoading,
    refetch,
    handleUpdateField
  };
};
