import type { AnalyticsDatasets, AnalyticsTab, DateFilter, Widget } from '../types';
import { WidgetCard } from './WidgetCard';
import { useChartData } from '../hooks/useChartData';
import { AnalyticsOverview } from './AnalyticsOverview';

interface DashboardTabProps {
  widgets: Widget[];
  datasets: AnalyticsDatasets;
  dateFilter: DateFilter;
  updatedAt: number;
  onDeleteWidget: (id: string) => void;
  onSwitchType: (id: string, type: Widget['chartType']) => void;
  onSaveTitle: (id: string, title: string) => void;
  onChangeTab: (tab: AnalyticsTab) => void;
}

interface WidgetWrapperProps {
  widget: Widget;
  datasets: AnalyticsDatasets;
  dateFilter: DateFilter;
  onDeleteWidget: (id: string) => void;
  onSwitchType: (id: string, type: Widget['chartType']) => void;
  onSaveTitle: (id: string, title: string) => void;
}

export function DashboardTab({
  widgets,
  datasets,
  dateFilter,
  updatedAt,
  onDeleteWidget,
  onSwitchType,
  onSaveTitle,
  onChangeTab,
}: DashboardTabProps) {
  return (
    <div className="space-y-7">
      <AnalyticsOverview datasets={datasets} dateFilter={dateFilter} updatedAt={updatedAt} />

      <section aria-labelledby="custom-reports-title" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Exploración visual
            </p>
            <h2 id="custom-reports-title" className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
              Informes guardados
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onChangeTab('builder')}
            className="min-h-11 rounded-2xl border border-blue-200 bg-blue-50/80 px-4 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200"
          >
            Crear informe
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {widgets.map((widget) => (
            <WidgetWrapper
              key={widget.id}
              widget={widget}
              datasets={datasets}
              dateFilter={dateFilter}
              onDeleteWidget={onDeleteWidget}
              onSwitchType={onSwitchType}
              onSaveTitle={onSaveTitle}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function WidgetWrapper({
  widget,
  datasets,
  dateFilter,
  onDeleteWidget,
  onSwitchType,
  onSaveTitle,
}: WidgetWrapperProps) {
  const chartData = useChartData(widget, datasets, dateFilter);
  return (
    <WidgetCard
      widget={widget}
      chartData={chartData}
      onDelete={onDeleteWidget}
      onSwitchType={onSwitchType}
      onSaveTitle={onSaveTitle}
    />
  );
}
