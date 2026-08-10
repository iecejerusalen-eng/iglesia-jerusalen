import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { Song, SongArrangement, SongType, SongStyle } from '../../../types';

const SONG_CATALOG_COLUMNS = `
  id,
  title,
  artist,
  bpm,
  type_id,
  style_id,
  has_chords,
  drum_style,
  slug,
  original_key,
  preferred_accidentals,
  capo,
  time_signature,
  status,
  published_at,
  created_at,
  updated_at,
  song_types(id, name, created_at),
  song_styles(id, name, created_at)
`;

function asCatalogSong(row: Song): Song {
  return {
    ...row,
    lyrics: '',
    resource_links: [],
    structure_blocks: [],
    composers: [],
    song_arrangements: [],
  };
}

export function useSongs() {
  const { data: songs = [], isLoading: isLoadingSongs, isError: isSongsError } = useQuery<Song[]>({
    queryKey: ['songs', 'public-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select(SONG_CATALOG_COLUMNS)
        .eq('status', 'published')
        .order('title');
      if (error) throw error;
      return ((data ?? []) as unknown as Song[]).map(asCatalogSong);
    },
    staleTime: 5 * 60 * 1000,
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

export function useSongDetails(songId: string | null) {
  return useQuery<Song>({
    queryKey: ['songs', 'public-detail', songId],
    enabled: Boolean(songId),
    queryFn: async () => {
      if (!songId) throw new Error('No se indicó la canción que se debe cargar.');
      const { data, error } = await supabase
        .from('songs')
        .select('*, song_types(*), song_styles(*)')
        .eq('id', songId)
        .eq('status', 'published')
        .single();
      if (error) throw error;

      const { data: arrangementsData, error: arrangementsError } = await supabase
        .from('song_arrangements')
        .select('*')
        .eq('song_id', songId)
        .eq('status', 'published')
        .order('is_default', { ascending: false })
        .order('name');
      if (arrangementsError) {
        const migrationPending = arrangementsError.code === '42P01' || arrangementsError.code === 'PGRST205';
        if (!migrationPending) throw arrangementsError;
        console.warn('Las versiones de alabanzas todavía no están disponibles porque falta aplicar su migración.', arrangementsError);
      }

      return {
        ...(data as unknown as Song),
        song_arrangements: ((arrangementsData ?? []) as unknown as SongArrangement[]),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
