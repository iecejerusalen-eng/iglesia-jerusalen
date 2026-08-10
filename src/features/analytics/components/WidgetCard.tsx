import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Check, Download, Pencil, Trash2, TrendingUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import type { ChartDataPoint, Widget } from '../types';
import { COLORS } from '../constants';
import { getDimensionLabel } from '../utils';

interface WidgetCardProps {
  widget: Widget;
  chartData: ChartDataPoint[];
  onDelete: (id: string) => void;
  onSwitchType: (id: string, type: Widget['chartType']) => void;
  onSaveTitle: (id: string, newTitle: string) => void;
}

const chartTypes: Array<{ id: Exclude<Widget['chartType'], 'kpi'>; label: string }> = [
  { id: 'bar', label: 'Barras' },
  { id: 'line', label: 'Línea' },
  { id: 'area', label: 'Área' },
  { id: 'pie', label: 'Circular' },
  { id: 'table', label: 'Tabla' },
];

function isMoney(widget: Widget) {
  return ['amount', 'total', 'price'].some((field) => widget.targetField.includes(field));
}

function formatValue(value: number, money: boolean) {
  return money
    ? new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)
    : value.toLocaleString('es-ES', { maximumFractionDigits: 2 });
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function WidgetCard({ widget, chartData, onDelete, onSwitchType, onSaveTitle }: WidgetCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitleText, setEditTitleText] = useState(widget.title);
  const isKPI = widget.chartType === 'kpi';
  const isTable = widget.chartType === 'table';
  const money = isMoney(widget);
  const totalCount = chartData.reduce((sum, point) => sum + point.count, 0);
  const totalValue = chartData.reduce((sum, point) => sum + point.total, 0);
  const kpiValue = widget.aggregation === 'avg'
    ? totalCount > 0 ? totalValue / totalCount : 0
    : chartData.reduce((sum, point) => sum + point.valor, 0);
  const horizontalBars = widget.dimension !== 'month';

  const handleExportCSV = () => {
    if (chartData.length === 0) {
      toast.error('No hay datos disponibles para exportar.');
      return;
    }
    const rows = chartData.map((point) => `${csvCell(point.name)};${csvCell(point.valor)}`);
    const csvContent = [`${csvCell('Agrupación')};${csvCell('Valor')}`, ...rows].join('\n');
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${widget.title.toLowerCase().replace(/[^a-z0-9]+/gi, '_')}_datos.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Datos exportados.');
  };

  const saveTitle = () => {
    if (!editTitleText.trim()) return;
    onSaveTitle(widget.id, editTitleText.trim());
    setIsEditing(false);
  };

  return (
    <AnimeFadeUp className="group/card relative flex min-h-[390px] flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/78 p-5 shadow-[0_18px_55px_-35px_rgba(15,23,42,0.5)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-blue-200 dark:border-white/10 dark:bg-slate-900/72 dark:hover:border-blue-400/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <label className="sr-only" htmlFor={`widget-title-${widget.id}`}>Título del informe</label>
              <input
                id={`widget-title-${widget.id}`}
                value={editTitleText}
                onChange={(event) => setEditTitleText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') saveTitle();
                  if (event.key === 'Escape') setIsEditing(false);
                }}
                className="min-h-10 w-full rounded-xl border border-blue-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none ring-blue-500/20 focus:ring-2 dark:bg-slate-950 dark:text-white"
                autoFocus
              />
              <button type="button" onClick={saveTitle} aria-label="Guardar título" className="grid size-10 shrink-0 place-items-center rounded-xl text-emerald-600 hover:bg-emerald-50"><Check size={16} /></button>
              <button type="button" onClick={() => setIsEditing(false)} aria-label="Cancelar edición" className="grid size-10 shrink-0 place-items-center rounded-xl text-rose-500 hover:bg-rose-50"><X size={16} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-950 dark:text-white">{widget.title}</h3>
              <button type="button" onClick={() => setIsEditing(true)} aria-label={`Renombrar ${widget.title}`} className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 group-hover/card:opacity-100 focus:opacity-100 dark:hover:bg-white/10 dark:hover:text-white"><Pencil size={13} /></button>
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {getDimensionLabel(widget.dimension)} · {widget.aggregation === 'count' ? 'cantidad' : widget.aggregation === 'sum' ? 'suma' : 'promedio'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={handleExportCSV} aria-label={`Exportar ${widget.title} en CSV`} className="grid size-10 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-white/10 dark:hover:text-white"><Download size={16} /></button>
          <button type="button" onClick={() => onDelete(widget.id)} aria-label={`Quitar ${widget.title} del panel`} className="grid size-10 place-items-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:hover:bg-rose-400/10"><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="flex min-h-[245px] flex-1 flex-col justify-center pt-4">
        {chartData.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-10 text-center dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Sin registros en este periodo</p>
            <p className="mt-1 text-xs text-slate-400">Prueba un periodo más amplio o actualiza los datos.</p>
          </div>
        ) : isKPI ? (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-950 p-7 text-white shadow-xl shadow-blue-950/15">
            <div className="absolute -right-8 -top-10 size-36 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <TrendingUp size={22} className="text-blue-200" aria-hidden="true" />
            <p className="mt-5 text-4xl font-bold tracking-tight">{formatValue(kpiValue, money)}</p>
            <p className="mt-2 text-xs font-medium text-blue-100">Resultado global · {totalCount.toLocaleString('es-ES')} registros</p>
          </div>
        ) : isTable ? (
          <div className="max-h-[240px] overflow-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr><th className="px-3 py-3 font-semibold">Agrupación</th><th className="px-3 py-3 text-right font-semibold">Valor</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {chartData.map((point) => (
                  <tr key={point.name} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.03]">
                    <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">{point.name}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900 dark:text-white">{formatValue(point.valor, money)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-60 w-full text-xs" role="img" aria-label={`${widget.title}: ${chartData.length} grupos`}>
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              {widget.chartType === 'bar' ? (
                <BarChart data={chartData} layout={horizontalBars ? 'vertical' : 'horizontal'} margin={horizontalBars ? { top: 4, right: 12, left: 12, bottom: 4 } : { top: 4, right: 8, left: -20, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={!horizontalBars} vertical={horizontalBars} stroke="#e2e8f0" opacity={0.65} />
                  {horizontalBars ? <XAxis type="number" axisLine={false} tickLine={false} /> : <XAxis dataKey="name" axisLine={false} tickLine={false} />}
                  {horizontalBars ? <YAxis type="category" dataKey="name" width={95} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} /> : <YAxis axisLine={false} tickLine={false} />}
                  <Tooltip cursor={{ fill: '#eff6ff', opacity: 0.55 }} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 14, color: '#fff' }} formatter={(value) => [formatValue(Number(value), money), 'Valor']} />
                  <Bar dataKey="valor" fill="#2563eb" radius={horizontalBars ? [0, 7, 7, 0] : [7, 7, 0, 0]} maxBarSize={30} />
                </BarChart>
              ) : widget.chartType === 'line' ? (
                <LineChart data={chartData} margin={{ top: 8, right: 10, left: -18, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.65} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 14, color: '#fff' }} formatter={(value) => [formatValue(Number(value), money), 'Valor']} />
                  <Line type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : widget.chartType === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -18, bottom: 4 }}>
                  <defs><linearGradient id={`analytics-gradient-${widget.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.65} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 14, color: '#fff' }} formatter={(value) => [formatValue(Number(value), money), 'Valor']} />
                  <Area type="monotone" dataKey="valor" stroke="#8b5cf6" strokeWidth={3} fill={`url(#analytics-gradient-${widget.id})`} />
                </AreaChart>
              ) : (
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3} dataKey="valor" nameKey="name">
                    {chartData.map((point, index) => <Cell key={point.name} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 14, color: '#fff' }} formatter={(value) => [formatValue(Number(value), money), 'Valor']} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {!isKPI && chartData.length > 0 && (
        <div className="mt-4 flex gap-1 overflow-x-auto border-t border-slate-100 pt-3 dark:border-white/5" aria-label="Cambiar visualización">
          {chartTypes.map((type) => (
            <button key={type.id} type="button" onClick={() => onSwitchType(widget.id, type.id)} className={`min-h-9 shrink-0 rounded-xl px-2.5 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${widget.chartType === type.id ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10'}`}>{type.label}</button>
          ))}
        </div>
      )}
    </AnimeFadeUp>
  );
}
