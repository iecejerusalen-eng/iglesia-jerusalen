import { ChevronDown, Filter, Guitar, LayoutGrid, List, Music, RotateCcw, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
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
  drumStyles?: string[];
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

const selectClassName =
  'w-full rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-church-gold-medium focus:ring-4 focus:ring-church-gold/10 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200';

export const SongsFilters = ({
  search,
  setSearch,
  viewMode,
  setViewMode,
  showFilters,
  setShowFilters,
  filterType,
  setFilterType,
  filterStyle,
  setFilterStyle,
  filterDrumStyle,
  setFilterDrumStyle,
  drumStyles,
  filterChords,
  setFilterChords,
  sortBy,
  setSortBy,
  songTypes,
  songStyles,
  resultCount,
  activeFilterCount,
  clearFilters,
}: SongsFiltersProps) => {
  const availableDrumStyles = drumStyles && drumStyles.length > 0 ? drumStyles : DRUM_STYLES;

  return (
    <section
      aria-label="Buscar y filtrar alabanzas"
      className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80 md:p-5"
    >
      {/* ─── Top Bar: Search Input & Controls ─── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search input with ambient focus */}
        <label className="relative flex-1">
          <span className="sr-only">Buscar alabanzas por título, artista o letra</span>
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por título, artista, estrofa o temática…"
            className="h-12 w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 pl-11 pr-10 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-church-gold/60 focus:bg-white focus:shadow-md focus:shadow-amber-500/5 focus:ring-4 focus:ring-church-gold/15 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              aria-label="Limpiar búsqueda"
            >
              <X size={15} />
            </button>
          )}
        </label>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Advanced Filters Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border px-4 text-xs font-bold transition-all lg:flex-none ${
              activeFilterCount > 0
                ? 'border-church-gold/50 bg-church-gold/15 text-church-gold-dark shadow-sm dark:text-church-gold-bright'
                : 'border-slate-200/80 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-300 dark:hover:bg-white/5'
            }`}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            <span>Filtros avanzados</span>
            {activeFilterCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-church-gold-dark text-[10px] font-black text-white shadow-sm">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {/* View Mode Toggle */}
          <div
            className="flex h-12 items-center rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1 dark:border-white/10 dark:bg-slate-950/80"
            aria-label="Modo de visualización"
          >
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              aria-label="Vista en cuadrícula de tarjetas"
              aria-pressed={viewMode === 'cards'}
              className={`flex size-10 items-center justify-center rounded-xl transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-church-gold-dark shadow-md dark:bg-slate-800 dark:text-church-gold-bright'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <LayoutGrid size={17} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Vista en lista compacta"
              aria-pressed={viewMode === 'table'}
              className={`flex size-10 items-center justify-center rounded-xl transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-church-gold-dark shadow-md dark:bg-slate-800 dark:text-church-gold-bright'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <List size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Quick Worship Theme Pills (Horizontal Scroll) ─── */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
        <span className="shrink-0 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Explorar:
        </span>

        {/* All pill */}
        <button
          type="button"
          onClick={() => {
            setFilterType('');
            setFilterChords('all');
            setFilterStyle('');
          }}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
            !filterType && filterChords === 'all' && !filterStyle
              ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950'
              : 'border border-slate-200/80 bg-slate-50/70 text-slate-600 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          Todo el catálogo
        </button>

        {/* With chords pill */}
        <button
          type="button"
          onClick={() => setFilterChords(filterChords === 'yes' ? 'all' : 'yes')}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
            filterChords === 'yes'
              ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-800 shadow-sm dark:text-emerald-300'
              : 'border border-slate-200/80 bg-slate-50/70 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-400'
          }`}
        >
          <Guitar size={13} className="text-emerald-500" aria-hidden="true" />
          <span>Con acordes</span>
        </button>

        {/* Dynamic song types pills (Adoración, Alabanza, etc.) */}
        {songTypes.map((type) => {
          const isActive = filterType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setFilterType(isActive ? '' : type.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                isActive
                  ? 'border border-church-gold/40 bg-church-gold/15 text-church-gold-dark shadow-sm dark:text-church-gold-bright'
                  : 'border border-slate-200/80 bg-slate-50/70 text-slate-600 hover:border-church-gold/30 hover:bg-amber-50/30 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-400'
              }`}
            >
              <span className="flex items-center gap-1">
                <Music size={11} className="text-church-gold-medium" />
                {type.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Expandable Advanced Filters ─── */}
      {showFilters && (
        <AnimeFadeUp delay={0} duration={250} distance={10}>
          <div className="mt-4 grid grid-cols-1 gap-3.5 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-white/[0.06]">
            <label className="space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span>Tipo de canto</span>
              <select
                value={filterType}
                onChange={(event) => setFilterType(event.target.value)}
                className={selectClassName}
              >
                <option value="">Todos los tipos</option>
                {songTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span>Estilo musical</span>
              <select
                value={filterStyle}
                onChange={(event) => setFilterStyle(event.target.value)}
                className={selectClassName}
              >
                <option value="">Todos los estilos</option>
                {songStyles.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span>Patrón de batería</span>
              <select
                value={filterDrumStyle}
                onChange={(event) => setFilterDrumStyle(event.target.value)}
                className={selectClassName}
              >
                <option value="">Todos los ritmos</option>
                {availableDrumStyles.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span>Cifrado / Acordes</span>
              <select
                value={filterChords}
                onChange={(event) => setFilterChords(event.target.value as ChordsFilter)}
                className={selectClassName}
              >
                <option value="all">Todo el repertorio</option>
                <option value="yes">Con acordes interactivos</option>
                <option value="no">Solo letra</option>
              </select>
            </label>

            <label className="space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span>Ordenar por</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SongSort)}
                className={selectClassName}
              >
                <option value="title-asc">Título (A – Z)</option>
                <option value="title-desc">Título (Z – A)</option>
                <option value="bpm-asc">BPM (Menor a Mayor)</option>
                <option value="bpm-desc">BPM (Mayor a Menor)</option>
                <option value="newest">Más recientes agregadas</option>
                <option value="oldest">Más antiguas</option>
              </select>
            </label>
          </div>
        </AnimeFadeUp>
      )}

      {/* ─── Bottom Meta Bar: Results counter & Clear button ─── */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100/80 px-1 pt-3 text-xs text-slate-500 dark:border-white/[0.05] dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <Filter size={13} className="text-church-gold-medium" aria-hidden="true" />
          <span>
            {resultCount} {resultCount === 1 ? 'alabanza encontrada' : 'alabanzas encontradas'}
          </span>
        </span>

        {(activeFilterCount > 0 || search) && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold text-church-gold-dark hover:bg-amber-50 hover:underline dark:text-church-gold-bright dark:hover:bg-white/5"
          >
            <RotateCcw size={12} aria-hidden="true" />
            <span>Restablecer filtros</span>
          </button>
        )}
      </div>
    </section>
  );
};
