import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { Song, SongType, SongStyle } from '../../../types';

export function useSongs() {
  const { data: songs = [], isLoading: isLoadingSongs, isError: isSongsError } = useQuery<Song[]>({
    queryKey: ['songs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*, song_types(*), song_styles(*)')
        .order('title');
      if (error) throw error;
      // RLS is the publication boundary after the editorial migration. This
      // filter also keeps drafts out of the public library for signed-in editors
      // while remaining compatible with rows created before `status` existed.
      return ((data as Song[]) || []).filter(
        (song) => (song.status ?? 'published') === 'published',
      );
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
