import type { Widget, AnalyticsDatasets } from '../types';
import { WidgetCard } from './WidgetCard';
import { useChartData } from '../hooks/useChartData';

interface DashboardTabProps {
  widgets: Widget[];
  datasets: AnalyticsDatasets | undefined;
  dateFilter: string;
  onDeleteWidget: (id: string) => void;
  onSwitchType: (id: string, type: Widget['chartType']) => void;
  onSaveTitle: (id: string, title: string) => void;
}

export function DashboardTab({ widgets, datasets, dateFilter, onDeleteWidget, onSwitchType, onSaveTitle }: DashboardTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  );
}

function WidgetWrapper({ widget, datasets, dateFilter, onDeleteWidget, onSwitchType, onSaveTitle }: any) {
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
