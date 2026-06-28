import { useState } from 'react';
import { toast } from 'sonner';
import { AnalyticsHeader } from '../../features/analytics/components/AnalyticsHeader';
import { DashboardTab } from '../../features/analytics/components/DashboardTab';
import { BuilderTab } from '../../features/analytics/components/BuilderTab';
import { FormsTab } from '../../features/analytics/components/FormsTab';
import { useAnalytics } from '../../features/analytics/hooks/useAnalytics';
import { useWidgets } from '../../features/analytics/hooks/useWidgets';
import type { Widget } from '../../features/analytics/types';
import { PRESETS } from '../../features/analytics/constants';

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'builder' | 'forms'>('dashboard');
  const [dateFilter, setDateFilter] = useState<'all' | '30days' | '90days' | 'thisyear'>('all');

  const { data: datasets, isLoading: loading, refetch } = useAnalytics();
  const { widgets, setWidgets, isLoaded } = useWidgets();

  if (!isLoaded) return null;

  const handleAddWidget = (widgetConfig: Omit<Widget, 'id'>) => {
    const newWidget: Widget = { ...widgetConfig, id: "custom-w-" + Date.now() };
    setWidgets([...widgets, newWidget]);
    toast.success('Reporte añadido con éxito al Dashboard.');
    setActiveTab('dashboard');
  };

  const handleDeleteWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
    toast.success('Reporte removido del Dashboard.');
  };

  const handleSwitchWidgetChartType = (id: string, type: Widget['chartType']) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, chartType: type } : w));
  };

  const handleSaveWidgetTitle = (id: string, title: string) => {
    if (!title.trim()) return;
    setWidgets(widgets.map(w => w.id === id ? { ...w, title } : w));
    toast.success('Título del reporte actualizado.');
  };

  const handleResetWidgets = () => {
    setWidgets(PRESETS);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-gray-100">
      <AnalyticsHeader
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        onReset={handleResetWidgets}
        onRefresh={() => refetch()}
        loading={loading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        widgetCount={widgets.length}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-white dark:bg-slate-900 rounded-3xl animate-pulse col-span-full"></div>
          <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl animate-pulse"></div>
          <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl animate-pulse"></div>
          <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl animate-pulse"></div>
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <DashboardTab
              widgets={widgets}
              datasets={datasets}
              dateFilter={dateFilter}
              onDeleteWidget={handleDeleteWidget}
              onSwitchType={handleSwitchWidgetChartType}
              onSaveTitle={handleSaveWidgetTitle}
            />
          )}

          {activeTab === 'builder' && (
            <BuilderTab
              datasets={datasets}
              dateFilter={dateFilter}
              onAddWidget={handleAddWidget}
            />
          )}

          {activeTab === 'forms' && (
            <FormsTab
              responses={datasets?.formResponses as any || []}
            />
          )}
        </>
      )}
    </div>
  );
}
