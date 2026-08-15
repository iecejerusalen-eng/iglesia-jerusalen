import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import type { Cell, Profile } from '../../../types';
import type { StrategicMapLocation, StrategicMapMember } from '../types';

export const useStrategicMapData = () => {
  const queryClient = useQueryClient();

  // Members Query
  const { data: members, isLoading: isLoadingMembers, error: membersError, refetch: refetchMembers } = useQuery({
    queryKey: ['map-members'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_strategic_map_members');
      if (error) throw error;
      return (data ?? []) as StrategicMapMember[];
    }
  });

  // Cells Query
  const { data: cells, isLoading: isLoadingCells, error: cellsError, refetch: refetchCells } = useQuery({
    queryKey: ['map-cells'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cells')
        .select('id, name, leader_id, sector, latitude, longitude, deleted_at, status, capacity, coverage_radius_m, created_at, updated_at, profiles(first_name, last_name)')
        .is('deleted_at', null);
      if (error) throw error;
      return (data ?? []).map((cell) => ({
        ...cell,
        profiles: Array.isArray(cell.profiles) ? cell.profiles[0] ?? null : cell.profiles ?? null,
      })) as Cell[];
    }
  });

  // Locations Query
  const { data: locations, isLoading: isLoadingLocations, error: locationsError, refetch: refetchLocations } = useQuery({
    queryKey: ['map-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, lat, lng, icon_type, icon_value, address_street, description');
      if (error) throw error;
      return (data ?? []) as StrategicMapLocation[];
    }
  });

  // Profiles Query
  const { data: profiles, isLoading: isLoadingProfiles, error: profilesError, refetch: refetchProfiles } = useQuery({
    queryKey: ['map-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');
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

  const errors = [membersError, cellsError, locationsError, profilesError].filter(
    (error): error is Error => error instanceof Error,
  );

  return {
    members: members ?? [],
    cells: cells ?? [],
    locations: locations ?? [],
    profiles: profiles ?? [],
    isLoading,
    error: errors[0] ?? null,
    refetch: async () => {
      await Promise.all([refetchMembers(), refetchCells(), refetchLocations(), refetchProfiles()]);
    },
  };
};
