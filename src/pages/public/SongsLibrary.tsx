import { useMemo, useState } from 'react';
import { useSongs } from '../../features/songs/hooks/useSongs';
import { SongsHero } from '../../features/songs/components/SongsHero';
import { SongsFilters, type ChordsFilter, type SongSort, type SongViewMode } from '../../features/songs/components/SongsFilters';
import { SongsList } from '../../features/songs/components/SongsList';
import { SongViewer } from '../../features/songs/components/SongViewer';
import type { Song } from '../../types';

const INITIAL_VISIBLE_SONGS = 18;
const SONGS_INCREMENT = 18;

const normalizeText = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es');

const SongsLibrary = () => {
  const { songs, songTypes, songStyles, isLoading, isError } = useSongs();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStyle, setFilterStyle] = useState('');
  const [filterDrumStyle, setFilterDrumStyle] = useState('');
  const [filterChords, setFilterChords] = useState<ChordsFilter>('all');
  const [sortBy, setSortBy] = useState<SongSort>('title-asc');
  const [viewMode, setViewMode] = useState<SongViewMode>('cards');
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_SONGS);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showChords, setShowChords] = useState(true);
  const [fontFamily, setFontFamily] = useState<'mono' | 'serif' | 'sans'>('sans');
  const [activeTab, setActiveTab] = useState<'lyrics' | 'resources'>('lyrics');

  const sortedSongs = useMemo(() => {
    const query = normalizeText(search.trim());
    const filtered = songs.filter((song) => {
      const searchableText = normalizeText(`${song.title} ${song.artist || ''} ${song.lyrics || ''}`);
      return (!query || searchableText.includes(query))
        && (!filterType || song.type_id === filterType)
        && (!filterStyle || song.style_id === filterStyle)
        && (!filterDrumStyle || song.drum_style === filterDrumStyle)
        && (filterChords === 'all' || (filterChords === 'yes' ? song.has_chords : !song.has_chords));
    });

    return filtered.sort((first, second) => {
      if (sortBy === 'title-asc') return first.title.localeCompare(second.title, 'es');
      if (sortBy === 'title-desc') return second.title.localeCompare(first.title, 'es');
      if (sortBy === 'bpm-asc') return (first.bpm ?? Number.MAX_SAFE_INTEGER) - (second.bpm ?? Number.MAX_SAFE_INTEGER);
      if (sortBy === 'bpm-desc') return (second.bpm ?? 0) - (first.bpm ?? 0);
      if (sortBy === 'newest') return new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
      return new Date(first.created_at).getTime() - new Date(second.created_at).getTime();
    });
  }, [filterChords, filterDrumStyle, filterStyle, filterType, search, songs, sortBy]);

  const activeFilterCount = [filterType, filterStyle, filterDrumStyle, filterChords !== 'all'].filter(Boolean).length;
  const visibleSongs = sortedSongs.slice(0, visibleCount);
  const clearFilters = () => {
    setSearch('');
    setFilterType('');
    setFilterStyle('');
    setFilterDrumStyle('');
    setFilterChords('all');
    setSortBy('title-asc');
  };
  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setActiveTab('lyrics');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 transition-colors duration-200 dark:bg-slate-950">
      <div id="songs_hero" className="scroll-mt-28">
        <SongsHero totalSongs={songs.length} songsWithChords={songs.filter((song) => song.has_chords).length} />
      </div>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:py-10">
        <div id="songs_search" className="scroll-mt-28">
          <SongsFilters
            search={search} setSearch={(value) => { setSearch(value); setVisibleCount(INITIAL_VISIBLE_SONGS); }}
            viewMode={viewMode} setViewMode={(value) => { setViewMode(value); setVisibleCount(INITIAL_VISIBLE_SONGS); }}
            showFilters={showFilters} setShowFilters={setShowFilters}
            filterType={filterType} setFilterType={(value) => { setFilterType(value); setVisibleCount(INITIAL_VISIBLE_SONGS); }}
            filterStyle={filterStyle} setFilterStyle={(value) => { setFilterStyle(value); setVisibleCount(INITIAL_VISIBLE_SONGS); }}
            filterDrumStyle={filterDrumStyle} setFilterDrumStyle={(value) => { setFilterDrumStyle(value); setVisibleCount(INITIAL_VISIBLE_SONGS); }}
            filterChords={filterChords} setFilterChords={(value) => { setFilterChords(value); setVisibleCount(INITIAL_VISIBLE_SONGS); }}
            sortBy={sortBy} setSortBy={(value) => { setSortBy(value); setVisibleCount(INITIAL_VISIBLE_SONGS); }}
            songTypes={songTypes} songStyles={songStyles}
            resultCount={sortedSongs.length} activeFilterCount={activeFilterCount} clearFilters={clearFilters}
          />
        </div>
        <div id="songs_library" className="scroll-mt-28">
          <SongsList
            loading={isLoading} error={isError} songs={visibleSongs} totalResults={sortedSongs.length} viewMode={viewMode}
            hasMore={visibleCount < sortedSongs.length} onShowMore={() => setVisibleCount((count) => count + SONGS_INCREMENT)}
            onSelectSong={handleSelectSong}
          />
        </div>
      </main>

      {selectedSong && (
        <SongViewer selectedSong={selectedSong} setSelectedSong={setSelectedSong} showChords={showChords} setShowChords={setShowChords} fontFamily={fontFamily} setFontFamily={setFontFamily} activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
};

export default SongsLibrary;
