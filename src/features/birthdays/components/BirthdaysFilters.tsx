import { Calendar as CalendarIcon, CalendarDays, CakeSlice, FileDown, LayoutGrid, Search, Table } from 'lucide-react';
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
  counts: Record<BirthdayTab, number>;
  onExportPdf: () => void;
  canExport: boolean;
}

const views: Array<{ id: BirthdayViewMode; label: string; icon: typeof LayoutGrid }> = [
  { id: 'cards', label: 'Tarjetas', icon: LayoutGrid },
  { id: 'table', label: 'Tabla', icon: Table },
  { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
  { id: 'year', label: 'Año', icon: CalendarDays },
];

export function BirthdaysFilters({ activeTab, setActiveTab, viewMode, setViewMode, searchQuery, setSearchQuery, counts, onExportPdf, canExport }: BirthdaysFiltersProps) {
  const tabs: Array<{ id: BirthdayTab; label: string }> = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'semana', label: '7 días' },
    { id: 'mes', label: 'Este mes' },
  ];

  return (
    <AnimeFadeUp delay={0.12} duration={450} distance={16}>
      <section aria-label="Controles de cumpleaños" className="mx-auto max-w-7xl rounded-3xl border border-white/70 bg-white/70 p-3 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/65">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex overflow-x-auto rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-950/70" role="tablist" aria-label="Periodo">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`flex min-w-max items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${activeTab === tab.id ? 'bg-white text-primary shadow-sm dark:bg-slate-800 dark:text-church-gold-light' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}>
                {tab.label}<span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] dark:bg-white/10">{counts[tab.id]}</span>
              </button>
            ))}
          </div>

          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Buscar por nombre o ministerio</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input type="search" placeholder="Buscar por nombre o ministerio…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white/70 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-church-gold-medium focus:ring-4 focus:ring-church-gold/10 dark:border-white/10 dark:bg-slate-950/70 dark:text-white" />
          </label>

          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex h-12 items-center gap-1 rounded-2xl bg-slate-100/80 p-1 dark:bg-slate-950/70" aria-label="Modo de visualización">
              {views.map((view) => (
                <button key={view.id} type="button" onClick={() => setViewMode(view.id)} aria-pressed={viewMode === view.id} aria-label={`Vista ${view.label}`} className={`rounded-xl p-2.5 transition ${viewMode === view.id ? 'bg-white text-primary shadow-sm dark:bg-slate-800 dark:text-church-gold-light' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'}`} title={view.label}>
                  <view.icon size={16} />
                </button>
              ))}
            </div>
            <button type="button" onClick={onExportPdf} disabled={!canExport} className="inline-flex h-12 min-w-max items-center gap-2 rounded-2xl border border-church-gold/30 bg-church-gold/10 px-4 text-xs font-bold text-church-gold-dark transition hover:bg-church-gold/20 disabled:cursor-not-allowed disabled:opacity-45 dark:text-church-gold-light">
              <FileDown size={16} /> PDF
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 px-2 text-[11px] text-slate-400"><CakeSlice size={13} /> Solo se muestran personas que autorizaron aparecer públicamente.</div>
      </section>
    </AnimeFadeUp>
  );
}
