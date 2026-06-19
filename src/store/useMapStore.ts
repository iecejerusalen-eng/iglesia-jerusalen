import { create } from 'zustand';
import { supabase } from '../config/supabase';
import type { Member, Cell, Profile } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface MapState {
  members: Member[];
  cells: Cell[];
  profiles: Profile[];
  locations: any[];
  isLoading: boolean;
  channel: RealtimeChannel | null;
  fetchMapData: () => Promise<void>;
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
}

export const useMapStore = create<MapState>((set, get) => {
  return {
    members: [],
    cells: [],
    profiles: [],
    locations: [],
    isLoading: false,
    channel: null,

    fetchMapData: async () => {
      set({ isLoading: true });
      try {
        // 1. Fetch members with valid coordinates
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('*')
          .is('deleted_at', null);
        if (membersError) throw membersError;

        // 2. Fetch cells (joined with leader profiles)
        const { data: cellsData, error: cellsError } = await supabase
          .from('cells')
          .select('*, profiles(first_name, last_name)')
          .is('deleted_at', null);
        if (cellsError) throw cellsError;

        // 3. Fetch locations (otras iglesias)
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('*');
        if (locationsError) throw locationsError;

        // 4. Fetch profiles for leader selection
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
        if (profilesError) throw profilesError;

        set({
          members: membersData || [],
          cells: cellsData || [],
          locations: locationsData || [],
          profiles: profilesData || [],
          isLoading: false
        });
      } catch (err: any) {
        console.error('Error fetching strategic map data:', err);
        set({ isLoading: false });
        throw err;
      }
    },

    subscribeRealtime: () => {
      const activeChannel = get().channel;
      if (activeChannel) return; // Already subscribed

      const channel = supabase
        .channel('public:map_realtime_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'members' },
          (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const currentMembers = [...get().members];

            if (eventType === 'INSERT') {
              const m = newRecord as Member;
              if (!m.deleted_at && m.latitude !== null && m.longitude !== null && m.latitude !== undefined && m.longitude !== undefined) {
                set({ members: [...currentMembers, m] });
              }
            } else if (eventType === 'UPDATE') {
              const m = newRecord as Member;
              if (m.deleted_at || m.latitude === null || m.longitude === null || m.latitude === undefined || m.longitude === undefined) {
                // Remove member if soft deleted or if coordinates removed
                set({ members: currentMembers.filter(item => item.id !== m.id) });
              } else {
                // Update member
                const idx = currentMembers.findIndex(item => item.id === m.id);
                if (idx >= 0) {
                  currentMembers[idx] = m;
                  set({ members: currentMembers });
                } else {
                  set({ members: [...currentMembers, m] });
                }
              }
            } else if (eventType === 'DELETE') {
              const id = oldRecord.id;
              set({ members: currentMembers.filter(item => item.id !== id) });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'cells' },
          (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const currentCells = [...get().cells];
            const profiles = get().profiles;

            const attachProfile = (c: any) => {
              if (!c.leader_id) return { ...c, profiles: null };
              const prof = profiles.find(p => p.id === c.leader_id);
              return {
                ...c,
                profiles: prof ? { first_name: prof.first_name, last_name: prof.last_name } : null
              };
            };

            if (eventType === 'INSERT') {
              const c = newRecord as Cell;
              if (!c.deleted_at) {
                const enrichedCell = attachProfile(c);
                set({ cells: [...currentCells, enrichedCell] });
              }
            } else if (eventType === 'UPDATE') {
              const c = newRecord as Cell;
              if (c.deleted_at) {
                // Remove cell if soft deleted
                set({ cells: currentCells.filter(item => item.id !== c.id) });
              } else {
                const enrichedCell = attachProfile(c);
                const idx = currentCells.findIndex(item => item.id === c.id);
                if (idx >= 0) {
                  currentCells[idx] = enrichedCell;
                  set({ cells: currentCells });
                } else {
                  set({ cells: [...currentCells, enrichedCell] });
                }
              }
            } else if (eventType === 'DELETE') {
              const id = oldRecord.id;
              set({ cells: currentCells.filter(item => item.id !== id) });
            }
          }
        )
        .subscribe();

      set({ channel });
    },

    unsubscribeRealtime: () => {
      const channel = get().channel;
      if (channel) {
        supabase.removeChannel(channel);
        set({ channel: null });
      }
    }
  };
});
