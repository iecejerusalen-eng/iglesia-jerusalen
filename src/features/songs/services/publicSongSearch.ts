import { supabase } from '../../../config/supabase';

export type PublicSongSearchResult = {
  id: string;
  title: string;
  artist: string | null;
  slug: string | null;
};

const STOP_WORDS = new Set([
  'alabanza', 'alabanzas', 'cancion', 'canciones', 'himno', 'himnos', 'himnario',
  'letra', 'letras', 'repertorio', 'coro', 'coros', 'musica', 'quiero', 'busco',
  'buscar', 'dime', 'muestra', 'mostrar', 'hay', 'tienen', 'tiene', 'estan', 'esta',
  'publicada', 'publicadas', 'publicado', 'publicados', 'sobre', 'para', 'una', 'uno',
  'cancionero', 'otra', 'otras', 'otro', 'otros', 'mas', 'parecida', 'parecido', 'similar',
  'que', 'cual', 'cuales', 'del', 'de', 'la', 'el', 'los', 'las', 'con', 'por',
]);

function getSearchTerms(query: string) {
  return [...new Set(query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !STOP_WORDS.has(term)))].slice(0, 6);
}

export async function searchPublicSongs(query: string): Promise<PublicSongSearchResult[]> {
  const terms = getSearchTerms(query);
  let request = supabase
    .from('songs')
    .select('id,title,artist,slug')
    .eq('status', 'published')
    .order('title', { ascending: true })
    .limit(30);

  if (terms.length) {
    const filters = terms.flatMap((term) => [
      `title.ilike.%${term}%`,
      `artist.ilike.%${term}%`,
      `lyrics.ilike.%${term}%`,
    ]);
    request = request.or(filters.join(','));
  }

  const { data, error } = await request;
  if (error) throw error;
  return ((data ?? []) as PublicSongSearchResult[]).map((song) => ({
    ...song,
    title: song.title.trim(),
    artist: song.artist?.trim() || null,
    slug: song.slug?.trim() || null,
  }));
}
