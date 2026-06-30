import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { Song, SongType, SongStyle } from '../../../types';

export function useSongs() {
  const { data: songs = [], isLoading: isLoadingSongs } = useQuery<Song[]>({
    queryKey: ['songs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*, song_types(*), song_styles(*)')
        .order('title');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: songTypes = [] } = useQuery<SongType[]>({
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

  const { data: songStyles = [] } = useQuery<SongStyle[]>({
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
    isLoading: isLoadingSongs
  };
}
