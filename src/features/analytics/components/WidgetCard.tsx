import { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { Download, Trash2, TrendingUp, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import type { Widget } from '../types';
import { COLORS } from '../constants';
import { getDimensionLabel } from '../utils';

interface WidgetCardProps {
  widget: Widget;
  chartData: any[];
  onDelete: (id: string) => void;
  onSwitchType: (id: string, type: Widget['chartType']) => void;
  onSaveTitle: (id: string, newTitle: string) => void;
}

export function WidgetCard({ widget, chartData, onDelete, onSwitchType, onSaveTitle }: WidgetCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitleText, setEditTitleText] = useState(widget.title);

  const isKPI = widget.chartType === 'kpi';
  const isTable = widget.chartType === 'table';

  let kpiValue = 0;
  if (isKPI) {
    if (chartData.length > 0) {
      const values = chartData.map(d => d.valor);
      if (widget.aggregation === 'avg') {
        kpiValue = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
      } else {
        kpiValue = values.reduce((a, b) => a + b, 0);
      }
    }
  }

  const handleExportCSV = () => {
    if (chartData.length === 0) {
      toast.error('No hay datos disponibles para exportar.');
      return;
    }
    const headers = ['Dimensión/Agrupamiento', `Valor (${widget.aggregation === 'count' ? 'Conteo' : widget.aggregation})`].join(';');
    const rows = chartData.map(d => [d.name, d.valor].join(';'));
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${widget.title.toLowerCase().replace(/ /g, '_')}_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Datos del reporte exportados con éxito.');
  };

  return (
    <AnimeFadeUp className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/10 rounded-2xl p-5 shadow-xs flex flex-col justify-between group/card relative hover:border-slate-300 transition-all">
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={editTitleText}
                onChange={(e) => setEditTitleText(e.target.value)}
                className="px-2 py-0.5 border border-slate-350 rounded-lg text-xs font-serif font-bold text-gray-800 dark:text-gray-100 w-full focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => {
                  onSaveTitle(widget.id, editTitleText);
                  setIsEditing(false);
                }}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <h3 
              onClick={() => setIsEditing(true)}
              className="font-serif font-bold text-xs md:text-sm text-slate-800 dark:text-gray-100 hover:text-primary dark:hover:text-church-gold-bright cursor-pointer truncate"
              title="Haz clic para renombrar"
            >
              {widget.title}
            </h3>
          )}
          <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-wider mt-0.5">
            {widget.source} por {getDimensionLabel(widget.dimension)}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover/card:opacity-100 transition-opacity">
          <button
            onClick={handleExportCSV}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Descargar CSV"
          >
            <Download size={13} />
          </button>
          <button
            onClick={() => onDelete(widget.id)}
            className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
            title="Remover de panel"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center min-h-[220px]">
        {chartData.length === 0 ? (
          <div className="text-center py-10 text-xs text-gray-400 font-semibold italic">
            Sin datos registrados en el rango seleccionado.
          </div>
        ) : isKPI ? (
          <div className="text-center space-y-2 py-4">
            <TrendingUp size={36} className="text-gold mx-auto" />
            <p className="text-4xl font-extrabold text-slate-800 dark:text-gray-100 font-mono tracking-tight">
              {widget.targetField.includes('amount') || widget.targetField.includes('total') || widget.targetField.includes('price')
                ? `$${kpiValue.toLocaleString('es-ES')}` 
                : kpiValue.toLocaleString('es-ES')}
            </p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Métrica Global ({widget.aggregation})
            </p>
          </div>
        ) : isTable ? (
          <div className="overflow-y-auto max-h-[210px] border border-slate-100 dark:border-white/5 rounded-xl">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-white/5 sticky top-0">
                <tr className="text-gray-500 dark:text-gray-450 font-bold uppercase">
                  <th className="px-3 py-2">Eje X</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {chartData.map((d, index) => (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="px-3 py-1.5 font-semibold text-slate-700 dark:text-gray-300">{d.name}</td>
                    <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-600 dark:text-gray-400">
                      {widget.targetField.includes('amount') || widget.targetField.includes('total') || widget.targetField.includes('price')
                        ? `$${d.valor.toLocaleString('es-ES')}`
                        : d.valor.toLocaleString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-56 w-full text-[10px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              {widget.chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0b1530', border: 'none', borderRadius: '12px', color: '#fff' }} />
                  <Bar dataKey="valor" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : widget.chartType === 'line' ? (
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0b1530', border: 'none', borderRadius: '12px', color: '#fff' }} />
                  <Line type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              ) : widget.chartType === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id={`grad-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0b1530', border: 'none', borderRadius: '12px', color: '#fff' }} />
                  <Area type="monotone" dataKey="valor" stroke="#d97706" strokeWidth={2} fill={`url(#grad-${widget.id})`} />
                </AreaChart>
              ) : (
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="valor"
                    label={({ name, percent }) => `${(name || "").slice(0, 10)} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {chartData.map((_entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0b1530', border: 'none', borderRadius: '12px', color: '#fff' }} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {!isKPI && chartData.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[10px] text-gray-400">
          <span>Ver en otro formato:</span>
          <div className="flex gap-1">
            {['bar', 'line', 'area', 'pie', 'table'].map((t) => (
              <button
                key={t}
                onClick={() => onSwitchType(widget.id, t as Widget['chartType'])}
                className={`px-1.5 py-0.5 rounded capitalize ${
                  widget.chartType === t ? 'bg-primary text-white font-bold' : 'hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {t === 'bar' ? 'Barras' : t === 'line' ? 'Línea' : t === 'area' ? 'Área' : t === 'pie' ? 'Tarta' : 'Tabla'}
              </button>
            ))}
          </div>
        </div>
      )}
    </AnimeFadeUp>
  );
}
