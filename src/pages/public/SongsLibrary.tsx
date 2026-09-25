import { lazy, Suspense, useDeferredValue, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Download, Guitar, KeyboardMusic, Loader2, Music2, RefreshCw, Sparkles, X } from 'lucide-react';
import { useSongDetails, useSongs } from '../../features/songs/hooks/useSongs';
import { SongsHero } from '../../features/songs/components/SongsHero';
import { SongsFilters, type ChordsFilter, type SongSort, type SongViewMode } from '../../features/songs/components/SongsFilters';
import { SongsList } from '../../features/songs/components/SongsList';
import type { Song } from '../../types';
import { slugifySongTitle } from '../../features/songs/utils/musicEngine';
import { useDrumStyles } from '../../features/songs/services/drumStylesService';

const SongViewer = lazy(() => import('../../features/songs/components/SongViewer').then((module) => ({ default: module.SongViewer })));

const INITIAL_VISIBLE_SONGS = 18;
const SONGS_INCREMENT = 18;

const SongsLibrary = () => {
  const navigate = useNavigate();
  const { songSlug } = useParams<{ songSlug?: string }>();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStyle, setFilterStyle] = useState('');
  const [filterDrumStyle, setFilterDrumStyle] = useState('');
  const [filterChords, setFilterChords] = useState<ChordsFilter>('all');
  const [sortBy, setSortBy] = useState<SongSort>('title-asc');
  const [viewMode, setViewMode] = useState<SongViewMode>('cards');
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_SONGS);
  const [selectedSongState, setSelectedSongState] = useState<Song | null>(null);
  const [showChords, setShowChords] = useState(true);
  const [fontFamily, setFontFamily] = useState<'mono' | 'serif' | 'sans'>('sans');
  const [activeTab, setActiveTab] = useState<'lyrics' | 'resources'>('lyrics');
  const deferredSearch = useDeferredValue(search);
  const { songs, songTypes, songStyles, isLoading, isError, refetch } = useSongs(deferredSearch);
  const { allDrumStyles } = useDrumStyles(songs);

  const sortedSongs = useMemo(() => {
    const filtered = songs.filter((song) => {
      return (!filterType || song.type_id === filterType)
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
  }, [filterChords, filterDrumStyle, filterStyle, filterType, songs, sortBy]);

  const activeFilterCount = [filterType, filterStyle, filterDrumStyle, filterChords !== 'all'].filter(Boolean).length;
  const visibleSongs = sortedSongs.slice(0, visibleCount);
  const routeSong = useMemo(() => songSlug
    ? songs.find((song) => (song.slug || slugifySongTitle(song.title)) === songSlug) ?? null
    : null, [songSlug, songs]);
  const selectedSongSummary = routeSong ?? selectedSongState;
  const {
    data: selectedSong,
    isLoading: isLoadingSongDetails,
    isError: isSongDetailsError,
    refetch: retrySongDetails,
  } = useSongDetails(selectedSongSummary?.id ?? null);

  const clearFilters = () => {
    setSearch('');
    setFilterType('');
    setFilterStyle('');
    setFilterDrumStyle('');
    setFilterChords('all');
    setSortBy('title-asc');
    setVisibleCount(INITIAL_VISIBLE_SONGS);
  };

  const handleSelectSong = (song: Song) => {
    setSelectedSongState(song);
    setActiveTab('lyrics');
    navigate(`/recursos/alabanzas/${song.slug || slugifySongTitle(song.title)}`);
  };

  const closeViewer = () => {
    setSelectedSongState(null);
    navigate('/recursos/alabanzas');
  };

  const handleExplore = () => {
    const searchElement = document.getElementById('songs_search');
    if (searchElement) {
      searchElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRandomSong = () => {
    if (!songs || songs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * songs.length);
    handleSelectSong(songs[randomIndex]);
  };

  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-slate-800 transition-colors duration-300 dark:bg-[#040816] dark:text-slate-100">
      {/* ─── Ambient Glow in Body ─── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(199,157,63,0.06),transparent_70%)]"
      />

      <div id="songs_hero" className="scroll-mt-28">
        <SongsHero
          totalSongs={songs.length}
          songsWithChords={songs.filter((song) => song.has_chords).length}
          onExplore={handleExplore}
          onRandomSong={handleRandomSong}
        />
      </div>

      <main className="relative mx-auto max-w-6xl space-y-8 px-4 py-8 md:py-12">
        <div id="songs_search" className="scroll-mt-28">
          <SongsFilters
            search={search}
            setSearch={(value) => { setSearch(value); setVisibleCount(INITIAL_VISIBLE_SONGS); }}
            viewMode={viewMode}
            setViewMode={(value) => { setViewMode(value); setVisibleCount(INITIAL_VISIBLE_SONGS); }}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            filterType={filterType}
            setFilterType={(value) => { setFilterType(value); setVisibleCount(INITIAL_VISIBLE_SONGS); }}
            filterStyle={filterStyle}
            setFilterStyle={(value) => { setFilterStyle(value); setVisibleCount(INITIAL_VISIBLE_SONGS); }}
            filterDrumStyle={filterDrumStyle}
            setFilterDrumStyle={(value) => { setFilterDrumStyle(value); setVisibleCount(INITIAL_VISIBLE_SONGS); }}
            drumStyles={allDrumStyles}
            filterChords={filterChords}
            setFilterChords={(value) => { setFilterChords(value); setVisibleCount(INITIAL_VISIBLE_SONGS); }}
            sortBy={sortBy}
            setSortBy={(value) => { setSortBy(value); setVisibleCount(INITIAL_VISIBLE_SONGS); }}
            songTypes={songTypes}
            songStyles={songStyles}
            resultCount={sortedSongs.length}
            activeFilterCount={activeFilterCount}
            clearFilters={clearFilters}
          />
        </div>

        <div id="songs_library" className="scroll-mt-28">
          <SongsList
            loading={isLoading}
            error={isError}
            songs={visibleSongs}
            totalResults={sortedSongs.length}
            viewMode={viewMode}
            hasMore={visibleCount < sortedSongs.length}
            onShowMore={() => setVisibleCount((count) => count + SONGS_INCREMENT)}
            onSelectSong={handleSelectSong}
            onRetry={() => void refetch()}
          />
        </div>

        {/* ─── Worship Ministry & Musicians Resource Ribbon ─── */}
        <section
          aria-labelledby="worship-ministry-title"
          className="relative overflow-hidden rounded-3xl border border-church-gold/25 bg-gradient-to-br from-white/95 via-slate-50/90 to-amber-50/50 p-6 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-blue-950/40 sm:p-8"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-church-gold/30 bg-church-gold/10 px-3 py-1 text-xs font-bold text-church-gold-dark dark:text-church-gold-bright">
                <Sparkles size={13} aria-hidden="true" />
                <span>Ministerio de Alabanza & Adoración</span>
              </div>
              <h2
                id="worship-ministry-title"
                className="font-serif text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl"
              >
                Prepara cada culto con excelencia espiritual y musical
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                El cancionero cuenta con transposición tonal instantánea, diagramas de acordes para guitarra, bajo y piano, metrónomo visual y descarga en PDF para ensayos del ministerio de alabanza.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Guitar size={15} className="text-church-gold-medium" />
                  Acordes interactivos
                </span>
                <span className="flex items-center gap-1.5">
                  <KeyboardMusic size={15} className="text-blue-500" />
                  Diagramas para instrumentos
                </span>
                <span className="flex items-center gap-1.5">
                  <Download size={15} className="text-emerald-500" />
                  Exportación a PDF
                </span>
                <span className="flex items-center gap-1.5">
                  <Music2 size={15} className="text-amber-500" />
                  Integración ProPresenter
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col">
              <button
                type="button"
                onClick={handleRandomSong}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-church-gold-dark via-amber-600 to-church-gold-medium px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-amber-900/20 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95"
              >
                <Music2 size={15} />
                <span>Canción aleatoria de hoy</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Modal Loading / Error states ─── */}
      {selectedSongSummary && isLoadingSongDetails && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`Cargando ${selectedSongSummary.title}`}
        >
          <div className="relative w-full max-w-sm rounded-3xl border border-white/70 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/90">
            <button
              type="button"
              onClick={closeViewer}
              className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
            <Loader2 className="mx-auto animate-spin text-church-gold-dark dark:text-church-gold-bright" size={32} />
            <h2 className="mt-4 font-serif text-xl font-bold text-slate-900 dark:text-white">
              Preparando el espacio musical
            </h2>
            <p className="mt-2 truncate text-sm text-slate-500 dark:text-slate-400">
              {selectedSongSummary.title}
            </p>
          </div>
        </div>
      )}

      {selectedSongSummary && isSongDetailsError && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="song-detail-error-title"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-red-200/80 bg-white/95 p-8 text-center shadow-2xl dark:border-red-400/20 dark:bg-slate-950/95">
            <button
              type="button"
              onClick={closeViewer}
              className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
            <AlertCircle className="mx-auto text-red-500" size={36} />
            <h2 id="song-detail-error-title" className="mt-4 font-serif text-xl font-bold text-slate-900 dark:text-white">
              No pudimos abrir esta alabanza
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              El cancionero sigue disponible. Comprueba tu conexión e intenta cargar el contenido otra vez.
            </p>
            <button
              type="button"
              onClick={() => void retrySongDetails()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-900"
            >
              <RefreshCw size={15} />
              <span>Reintentar</span>
            </button>
          </div>
        </div>
      )}

      {selectedSong && (
        <Suspense
          fallback={
            <div
              className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-md"
              role="dialog"
              aria-modal="true"
              aria-label={`Cargando ${selectedSong.title}`}
            >
              <div className="rounded-3xl border border-white/20 bg-white/95 px-7 py-6 text-center shadow-2xl backdrop-blur-xl dark:bg-slate-900/95">
                <Loader2 className="mx-auto animate-spin text-church-gold-dark dark:text-church-gold-bright" size={28} />
                <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                  Cargando alabanza…
                </p>
              </div>
            </div>
          }
        >
          <SongViewer
            key={selectedSong.id}
            selectedSong={selectedSong}
            setSelectedSong={setSelectedSongState}
            onClose={closeViewer}
            showChords={showChords}
            setShowChords={setShowChords}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </Suspense>
      )}
    </div>
  );
};

export default SongsLibrary;
