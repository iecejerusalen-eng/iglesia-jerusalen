import React, { useState } from 'react';
import { LayoutGrid, List as ListIcon, Table as TableIcon } from 'lucide-react';
import { AdvancedTable, type AdvancedTableProps } from './AdvancedTable';

export type ViewMode = 'table' | 'list' | 'grid';

interface DynamicDataViewProps<TData> extends AdvancedTableProps<TData> {
  title: string;
  defaultView?: ViewMode;
  renderListItem?: (item: TData) => React.ReactNode;
  renderGridItem?: (item: TData) => React.ReactNode;
}

export function DynamicDataView<TData>({ data, columns, title, defaultView = 'table', renderListItem, renderGridItem, onRowClick, isLoading }: DynamicDataViewProps<TData>) {
  const availableViews: ViewMode[] = ['table', ...(renderListItem ? ['list' as const] : []), ...(renderGridItem ? ['grid' as const] : [])];
  const [viewMode, setViewMode] = useState<ViewMode>(availableViews.includes(defaultView) ? defaultView : 'table');

  return <section className="flex flex-col space-y-4" aria-label={title}>
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="font-serif text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Formato de vista">
        {availableViews.map((view) => {
          const Icon = view === 'table' ? TableIcon : view === 'list' ? ListIcon : LayoutGrid;
          const label = view === 'table' ? 'Tabla' : view === 'list' ? 'Lista' : 'Cuadrícula';
          return <button key={view} type="button" aria-pressed={viewMode === view} onClick={() => setViewMode(view)} className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${viewMode === view ? 'border-blue-700 bg-blue-700 text-white dark:border-amber-300 dark:bg-amber-300 dark:text-slate-950' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700'}`}>
            <Icon size={16} aria-hidden="true" /> {label}
          </button>;
        })}
      </div>
    </div>

    {viewMode === 'table' && <AdvancedTable data={data} columns={columns} onRowClick={onRowClick} isLoading={isLoading} />}
    {viewMode === 'list' && renderListItem && <div className="space-y-3" aria-busy={isLoading}>
      {isLoading ? <p role="status" className="rounded-xl bg-slate-100 p-5 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">Cargando registros…</p> : data.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">Aún no hay registros.</p> : data.map((item, index) => <div key={index} onClick={() => onRowClick?.(item)} onKeyDown={(event) => { if (onRowClick && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onRowClick(item); } }} tabIndex={onRowClick ? 0 : undefined} className={onRowClick ? 'cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-blue-600' : ''}>{renderListItem(item)}</div>)}
    </div>}
    {viewMode === 'grid' && renderGridItem && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy={isLoading}>
      {isLoading ? <p role="status" className="col-span-full rounded-xl bg-slate-100 p-5 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">Cargando registros…</p> : data.length === 0 ? <p className="col-span-full rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">Aún no hay registros.</p> : data.map((item, index) => <div key={index} onClick={() => onRowClick?.(item)} onKeyDown={(event) => { if (onRowClick && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onRowClick(item); } }} tabIndex={onRowClick ? 0 : undefined} className={onRowClick ? 'h-full cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-blue-600' : 'h-full'}>{renderGridItem(item)}</div>)}
    </div>}
  </section>;
}
