import { ChevronDown, Filter, LayoutGrid, List, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { DRUM_STYLES } from '../utils/songUtils';
import type { SongStyle, SongType } from '../../../types';

export type SongSort = 'title-asc' | 'title-desc' | 'bpm-asc' | 'bpm-desc' | 'newest' | 'oldest';
export type SongViewMode = 'cards' | 'table';
export type ChordsFilter = 'all' | 'yes' | 'no';

interface SongsFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  viewMode: SongViewMode;
  setViewMode: (value: SongViewMode) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  filterType: string;
  setFilterType: (value: string) => void;
  filterStyle: string;
  setFilterStyle: (value: string) => void;
  filterDrumStyle: string;
  setFilterDrumStyle: (value: string) => void;
  filterChords: ChordsFilter;
  setFilterChords: (value: ChordsFilter) => void;
  sortBy: SongSort;
  setSortBy: (value: SongSort) => void;
  songTypes: SongType[];
  songStyles: SongStyle[];
  resultCount: number;
  activeFilterCount: number;
  clearFilters: () => void;
}

const selectClassName = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-church-gold-medium focus:ring-4 focus:ring-church-gold/10 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200';

export const SongsFilters = ({
  search, setSearch, viewMode, setViewMode, showFilters, setShowFilters,
  filterType, setFilterType, filterStyle, setFilterStyle,
  filterDrumStyle, setFilterDrumStyle, filterChords, setFilterChords,
  sortBy, setSortBy, songTypes, songStyles, resultCount, activeFilterCount, clearFilters,
}: SongsFiltersProps) => (
  <section aria-label="Buscar y filtrar alabanzas" className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900 md:p-4">
    <div className="flex flex-col gap-3 lg:flex-row">
      <label className="relative flex-1">
        <span className="sr-only">Buscar alabanzas</span>
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar título, artista o letra…"
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-church-gold-medium focus:bg-white focus:ring-4 focus:ring-church-gold/10 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-950"
        />
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition lg:flex-none ${
            activeFilterCount > 0
              ? 'border-church-gold/40 bg-church-gold/10 text-church-gold-dark dark:text-church-gold-bright'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5'
          }`}
        >
          <SlidersHorizontal size={17} aria-hidden="true" />
          Filtros
          {activeFilterCount > 0 && <span className="rounded-full bg-church-gold-dark px-1.5 py-0.5 text-[10px] text-white">{activeFilterCount}</span>}
          <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-slate-950" aria-label="Modo de visualización">
          <button type="button" onClick={() => setViewMode('cards')} aria-label="Vista en tarjetas" aria-pressed={viewMode === 'cards'} className={`rounded-lg p-2 transition ${viewMode === 'cards' ? 'bg-white text-primary shadow-sm dark:bg-slate-800 dark:text-church-gold-light' : 'text-slate-400'}`}>
            <LayoutGrid size={17} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setViewMode('table')} aria-label="Vista en lista" aria-pressed={viewMode === 'table'} className={`rounded-lg p-2 transition ${viewMode === 'table' ? 'bg-white text-primary shadow-sm dark:bg-slate-800 dark:text-church-gold-light' : 'text-slate-400'}`}>
            <List size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    {showFilters && (
      <AnimeFadeUp delay={0} duration={250} distance={10}>
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-white/5">
          <label className="space-y-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Tipo
            <select value={filterType} onChange={(event) => setFilterType(event.target.value)} className={selectClassName}>
              <option value="">Todos</option>
              {songTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Estilo musical
            <select value={filterStyle} onChange={(event) => setFilterStyle(event.target.value)} className={selectClassName}>
              <option value="">Todos</option>
              {songStyles.map((style) => <option key={style.id} value={style.id}>{style.name}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Ritmo
            <select value={filterDrumStyle} onChange={(event) => setFilterDrumStyle(event.target.value)} className={selectClassName}>
              <option value="">Todos</option>
              {DRUM_STYLES.map((style) => <option key={style} value={style}>{style}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Contenido
            <select value={filterChords} onChange={(event) => setFilterChords(event.target.value as ChordsFilter)} className={selectClassName}>
              <option value="all">Letra y acordes</option>
              <option value="yes">Con acordes</option>
              <option value="no">Solo letra</option>
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Orden
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SongSort)} className={selectClassName}>
              <option value="title-asc">Título A–Z</option>
              <option value="title-desc">Título Z–A</option>
              <option value="bpm-asc">BPM: menor a mayor</option>
              <option value="bpm-desc">BPM: mayor a menor</option>
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguas</option>
            </select>
          </label>
        </div>
      </AnimeFadeUp>
    )}

    <div className="mt-3 flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
      <span className="inline-flex items-center gap-1.5"><Filter size={13} aria-hidden="true" /> {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}</span>
      {(activeFilterCount > 0 || search) && (
        <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline dark:text-church-gold-light">
          <RotateCcw size={13} aria-hidden="true" /> Limpiar
        </button>
      )}
    </div>
  </section>
);
