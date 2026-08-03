import { Search, LayoutGrid, Table, Calendar as CalendarIcon, FileDown, CalendarDays } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';

export type BirthdayTab = 'hoy' | 'semana' | 'mes';
export type BirthdayViewMode = 'cards' | 'table' | 'calendar' | 'year';

interface BirthdaysFiltersProps {
  activeTab: BirthdayTab;
  setActiveTab: (tab: BirthdayTab) => void;
  viewMode: BirthdayViewMode;
  setViewMode: (mode: BirthdayViewMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onExportPdf: () => void;
}

export function BirthdaysFilters({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  onExportPdf
}: BirthdaysFiltersProps) {
  return (
    <AnimeFadeUp delay={0.2} duration={400} distance={20}>
      <section 
        aria-label="Filtros de cumpleaños" 
        className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
      >
        {/* Tab filters */}
        <div className="flex gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-950/80 rounded-2xl w-fit border border-slate-200/50 dark:border-white/5 shrink-0">
          <button
            onClick={() => setActiveTab('hoy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'hoy'
                ? 'bg-white dark:bg-slate-800 text-primary dark:text-church-gold-bright shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            🎂 Hoy
          </button>
          <button
            onClick={() => setActiveTab('semana')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'semana'
                ? 'bg-white dark:bg-slate-800 text-primary dark:text-church-gold-bright shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            📅 Próximos 7 días
          </button>
          <button
            onClick={() => setActiveTab('mes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'mes'
                ? 'bg-white dark:bg-slate-800 text-primary dark:text-church-gold-bright shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            🗓️ Este Mes
          </button>
        </div>

        {/* Query search input */}
        <div className="relative flex-1 max-w-sm">
          <span className="sr-only">Buscar por nombre</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-church-gold-medium focus:bg-white focus:ring-4 focus:ring-church-gold/10 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-950"
          />
        </div>

        {/* View mode buttons & Export */}
        <div className="flex gap-3 items-center shrink-0">
          <div className="flex h-12 items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-950/80 rounded-xl border border-slate-200/50 dark:border-white/5" aria-label="Modo de visualización">
            <button
              onClick={() => setViewMode('cards')}
              aria-pressed={viewMode === 'cards'}
              className={`p-2 rounded-lg transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-primary dark:text-church-gold-light shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
              }`}
              title="Vista Tarjetas"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
              className={`p-2 rounded-lg transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-primary dark:text-church-gold-light shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
              }`}
              title="Vista Tabla"
            >
              <Table size={16} />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              aria-pressed={viewMode === 'calendar'}
              className={`p-2 rounded-lg transition cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-800 text-primary dark:text-church-gold-light shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
              }`}
              title="Vista Calendario"
            >
              <CalendarIcon size={16} />
            </button>
            <button
              onClick={() => setViewMode('year')}
              aria-pressed={viewMode === 'year'}
              className={`p-2 rounded-lg transition cursor-pointer ${
                viewMode === 'year'
                  ? 'bg-white dark:bg-slate-800 text-primary dark:text-church-gold-light shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
              }`}
              title="Vista Anual"
            >
              <CalendarDays size={16} />
            </button>
          </div>

          <button
            onClick={onExportPdf}
            className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-primary dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            title="Exportar PDF"
          >
            <FileDown size={16} />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>
        </div>
      </section>
    </AnimeFadeUp>
  );
}
