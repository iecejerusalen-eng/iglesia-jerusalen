import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import type { Member, Cell, Profile } from '../../../types';

export const useStrategicMapData = () => {
  const queryClient = useQueryClient();

  // Members Query
  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ['map-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .is('deleted_at', null);
      if (error) throw error;
      return data as Member[];
    }
  });

  // Cells Query
  const { data: cells = [], isLoading: isLoadingCells } = useQuery({
    queryKey: ['map-cells'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cells')
        .select('*, profiles(first_name, last_name)')
        .is('deleted_at', null);
      if (error) throw error;
      return data as Cell[];
    }
  });

  // Locations Query
  const { data: locations = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ['map-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  // Profiles Query
  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['map-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) throw error;
      return data as Profile[];
    }
  });

  // Setup Realtime Subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('public:map_realtime_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        () => queryClient.invalidateQueries({ queryKey: ['map-members'] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cells' },
        () => queryClient.invalidateQueries({ queryKey: ['map-cells'] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const isLoading = isLoadingMembers || isLoadingCells || isLoadingLocations || isLoadingProfiles;

  return { members, cells, locations, profiles, isLoading };
};
