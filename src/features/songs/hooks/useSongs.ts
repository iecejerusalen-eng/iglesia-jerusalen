import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { Song, SongArrangement, SongType, SongStyle } from '../../../types';

export function useSongs() {
  const { data: songs = [], isLoading: isLoadingSongs, isError: isSongsError } = useQuery<Song[]>({
    queryKey: ['songs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*, song_types(*), song_styles(*)')
        .order('title');
      if (error) throw error;
      const baseSongs = (data as Song[]) || [];
      const { data: arrangementsData, error: arrangementsError } = await supabase
        .from('song_arrangements')
        .select('*')
        .eq('status', 'published')
        .order('is_default', { ascending: false })
        .order('name');
      if (arrangementsError) {
        const migrationPending = arrangementsError.code === '42P01' || arrangementsError.code === 'PGRST205';
        if (!migrationPending) throw arrangementsError;
        console.warn('Las versiones de alabanzas todavía no están disponibles porque falta aplicar su migración.', arrangementsError);
      }
      const arrangements = (arrangementsData as SongArrangement[] | null) ?? [];

      // RLS is the publication boundary after the editorial migration. This
      // filter also keeps drafts out of the public library for signed-in editors
      // while remaining compatible with rows created before `status` existed.
      return baseSongs.filter((song) => (song.status ?? 'published') === 'published').map((song) => ({
        ...song,
        song_arrangements: arrangements.filter((arrangement) => arrangement.song_id === song.id),
      }));
    }
  });

  const { data: songTypes = [], isLoading: isLoadingTypes, isError: isTypesError } = useQuery<SongType[]>({
    queryKey: ['song_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('song_types')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: songStyles = [], isLoading: isLoadingStyles, isError: isStylesError } = useQuery<SongStyle[]>({
    queryKey: ['song_styles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('song_styles')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  return {
    songs,
    songTypes,
    songStyles,
    isLoading: isLoadingSongs || isLoadingTypes || isLoadingStyles,
    isError: isSongsError || isTypesError || isStylesError,
  };
}
