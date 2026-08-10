import { BarChart3, FileQuestion, LayoutDashboard, Plus, RefreshCw, RotateCcw } from 'lucide-react';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { toast } from 'sonner';
import type { AnalyticsTab, DateFilter } from '../types';

interface AnalyticsHeaderProps {
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  onReset: () => void;
  onRefresh: () => void;
  loading: boolean;
  activeTab: AnalyticsTab;
  setActiveTab: (tab: AnalyticsTab) => void;
  widgetCount: number;
}

const filters: Array<{ value: DateFilter; label: string }> = [
  { value: 'all', label: 'Todo el historial' },
  { value: '30days', label: 'Últimos 30 días' },
  { value: '90days', label: 'Últimos 90 días' },
  { value: 'thisyear', label: `Este año (${new Date().getFullYear()})` },
];

const tabs: Array<{ id: AnalyticsTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { id: 'builder', label: 'Crear informe', icon: Plus },
  { id: 'forms', label: 'Cuestionarios', icon: FileQuestion },
];

export function AnalyticsHeader({
  dateFilter,
  setDateFilter,
  onReset,
  onRefresh,
  loading,
  activeTab,
  setActiveTab,
  widgetCount,
}: AnalyticsHeaderProps) {
  const confirm = useConfirmStore((state) => state.confirm);

  const handleReset = async () => {
    const confirmed = await confirm({
      title: 'Restablecer informes',
      message: 'Se reemplazarán los informes personalizados por los ocho informes predeterminados.',
      confirmText: 'Restablecer',
      cancelText: 'Cancelar',
      variant: 'warning',
    });
    if (!confirmed) return;
    onReset();
    toast.success('Informes predeterminados restaurados.');
  };

  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:p-7 dark:border-white/10 dark:bg-slate-950/65">
      <div className="absolute -right-20 -top-24 size-64 rounded-full bg-blue-500/10 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-28 left-1/3 size-56 rounded-full bg-violet-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
            <span className="grid size-8 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <BarChart3 size={16} aria-hidden="true" />
            </span>
            Datos para decidir
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            Análisis y decisiones
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Indicadores verificables de comunidad, finanzas, atención pastoral y operaciones, con filtros aplicados a las fuentes reales.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:max-w-xl xl:justify-end">
          <label className="sr-only" htmlFor="analytics-date-filter">Periodo de análisis</label>
          <select
            id="analytics-date-filter"
            value={dateFilter}
            onChange={(event) => {
              const next = filters.find((filter) => filter.value === event.target.value)?.value;
              if (next) setDateFilter(next);
            }}
            className="min-h-11 rounded-2xl border border-slate-200/80 bg-white/85 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            {filters.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
          </select>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            Actualizar
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-4 text-sm font-semibold text-slate-600 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
          >
            <RotateCcw size={15} aria-hidden="true" />
            Restablecer
          </button>
        </div>
      </div>

      <nav aria-label="Secciones de análisis" className="relative mt-7 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/70 bg-slate-100/70 p-1.5 dark:border-white/10 dark:bg-white/5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={selected ? 'page' : undefined}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                selected
                  ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {tab.label}{tab.id === 'dashboard' ? ` (${widgetCount})` : ''}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
