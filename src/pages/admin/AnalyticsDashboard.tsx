import { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { AnalyticsHeader } from '../../features/analytics/components/AnalyticsHeader';
import { DashboardTab } from '../../features/analytics/components/DashboardTab';
import { BuilderTab } from '../../features/analytics/components/BuilderTab';
import { FormsTab } from '../../features/analytics/components/FormsTab';
import { useAnalytics } from '../../features/analytics/hooks/useAnalytics';
import { useWidgets } from '../../features/analytics/hooks/useWidgets';
import type { AnalyticsTab, DateFilter, Widget } from '../../features/analytics/types';
import { PRESETS } from '../../features/analytics/constants';

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('dashboard');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const { data: datasets, isLoading, isFetching, error, refetch, dataUpdatedAt } = useAnalytics();
  const { widgets, setWidgets, isLoaded } = useWidgets();

  if (!isLoaded) return null;

  const handleAddWidget = (widgetConfig: Omit<Widget, 'id'>) => {
    const newWidget: Widget = { ...widgetConfig, id: `custom-w-${Date.now()}` };
    setWidgets([...widgets, newWidget]);
    toast.success('Informe añadido al resumen.');
    setActiveTab('dashboard');
  };

  const handleDeleteWidget = (id: string) => {
    setWidgets(widgets.filter((widget) => widget.id !== id));
    toast.success('Informe retirado del resumen.');
  };

  const handleSwitchWidgetChartType = (id: string, type: Widget['chartType']) => {
    setWidgets(widgets.map((widget) => widget.id === id ? { ...widget, chartType: type } : widget));
  };

  const handleSaveWidgetTitle = (id: string, title: string) => {
    if (!title.trim()) return;
    setWidgets(widgets.map((widget) => widget.id === id ? { ...widget, title: title.trim() } : widget));
    toast.success('Título actualizado.');
  };

  return (
    <div className="relative min-h-full space-y-7 text-slate-800 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 -top-20 -z-10 h-96 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.11),transparent_38%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.09),transparent_35%)]" aria-hidden="true" />
      <AnalyticsHeader
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        onReset={() => setWidgets(PRESETS)}
        onRefresh={() => { void refetch(); }}
        loading={isFetching}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        widgetCount={widgets.length}
      />

      {isLoading ? (
        <div aria-label="Cargando información" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-3xl border border-white/70 bg-white/70 dark:border-white/10 dark:bg-white/5" />)}
          <div className="h-80 animate-pulse rounded-3xl border border-white/70 bg-white/70 md:col-span-2 xl:col-span-4 dark:border-white/10 dark:bg-white/5" />
        </div>
      ) : error ? (
        <section role="alert" className="rounded-3xl border border-rose-200 bg-rose-50/85 p-6 shadow-sm backdrop-blur-xl dark:border-rose-400/20 dark:bg-rose-400/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300"><AlertCircle size={21} /></span>
              <div>
                <h2 className="font-semibold text-rose-950 dark:text-rose-100">No pudimos verificar todos los indicadores</h2>
                <p className="mt-1 text-sm text-rose-800 dark:text-rose-200">No se muestran cifras parciales como si fueran completas. Detalle: {error.message}</p>
              </div>
            </div>
            <button type="button" onClick={() => { void refetch(); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
              <RefreshCw size={16} /> Reintentar
            </button>
          </div>
        </section>
      ) : datasets ? (
        <>
          {activeTab === 'dashboard' && (
            <DashboardTab
              widgets={widgets}
              datasets={datasets}
              dateFilter={dateFilter}
              updatedAt={dataUpdatedAt}
              onDeleteWidget={handleDeleteWidget}
              onSwitchType={handleSwitchWidgetChartType}
              onSaveTitle={handleSaveWidgetTitle}
              onChangeTab={setActiveTab}
            />
          )}
          {activeTab === 'builder' && <BuilderTab datasets={datasets} dateFilter={dateFilter} onAddWidget={handleAddWidget} />}
          {activeTab === 'forms' && <FormsTab responses={datasets.formResponses} />}
        </>
      ) : null}
    </div>
  );
}
