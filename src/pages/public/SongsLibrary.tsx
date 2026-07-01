import { useState } from 'react';
import { useSongs } from '../../features/songs/hooks/useSongs';
import { SongsHero } from '../../features/songs/components/SongsHero';
import { SongsFilters } from '../../features/songs/components/SongsFilters';
import { SongsList } from '../../features/songs/components/SongsList';
import { SongViewer } from '../../features/songs/components/SongViewer';
import type { Song } from '../../types';

const SongsLibrary = () => {
  const { songs, songTypes, songStyles, isLoading } = useSongs();
  
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStyle, setFilterStyle] = useState('');
  const [filterDrumStyle, setFilterDrumStyle] = useState('');
  const [filterChords, setFilterChords] = useState<'all' | 'yes' | 'no'>('all');
  const [sortBy, setSortBy] = useState<'title-asc' | 'title-desc' | 'bpm-asc' | 'bpm-desc' | 'newest' | 'oldest'>('title-asc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showChords, setShowChords] = useState(true);
  const [fontFamily, setFontFamily] = useState<'mono' | 'serif' | 'sans'>('sans');
  const [activeTab, setActiveTab] = useState<'lyrics' | 'resources'>('lyrics');

  const filtered = songs.filter((s) => {
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || (s.artist || '').toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || s.type_id === filterType;
    const matchStyle = !filterStyle || s.style_id === filterStyle;
    const matchDrum = !filterDrumStyle || s.drum_style === filterDrumStyle;
    const matchChords = filterChords === 'all' || 
                        (filterChords === 'yes' && s.has_chords) || 
                        (filterChords === 'no' && !s.has_chords);
    return matchSearch && matchType && matchStyle && matchDrum && matchChords;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
    if (sortBy === 'title-desc') return b.title.localeCompare(a.title);
    if (sortBy === 'bpm-asc') return (a.bpm || 0) - (b.bpm || 0);
    if (sortBy === 'bpm-desc') return (b.bpm || 0) - (a.bpm || 0);
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 transition-colors duration-200">
      <SongsHero />
      
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <SongsFilters 
          search={search}
          setSearch={setSearch}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          filterType={filterType}
          setFilterType={setFilterType}
          filterStyle={filterStyle}
          setFilterStyle={setFilterStyle}
          filterDrumStyle={filterDrumStyle}
          setFilterDrumStyle={setFilterDrumStyle}
          filterChords={filterChords}
          setFilterChords={setFilterChords}
          sortBy={sortBy}
          setSortBy={setSortBy}
          songTypes={songTypes}
          songStyles={songStyles}
        />

        <SongsList 
          loading={isLoading}
          sorted={sorted}
          viewMode={viewMode}
          setSelectedSong={setSelectedSong}
          setActiveTab={setActiveTab}
        />
      </div>

      {selectedSong && (
        <SongViewer 
          selectedSong={selectedSong}
          setSelectedSong={setSelectedSong}
          showChords={showChords}
          setShowChords={setShowChords}
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
    </div>
  );
};

export default SongsLibrary;
