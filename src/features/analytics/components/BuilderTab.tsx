import { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { Sparkles, Search, Plus, Settings, X } from 'lucide-react';
import type { Widget } from '../types';
import { COLORS } from '../constants';
import { getDimensionLabel } from '../utils';
import { useNLP } from '../hooks/useNLP';
import { useChartData } from '../hooks/useChartData';

interface BuilderTabProps {
  datasets: any;
  dateFilter: string;
  onAddWidget: (widget: Omit<Widget, 'id'>) => void;
}

export function BuilderTab({ datasets, dateFilter, onAddWidget }: BuilderTabProps) {
  const { searchQuery, setSearchQuery, parsedNLP, setParsedNLP, handleNLPSearch } = useNLP();

  const [builderSettings, setBuilderSettings] = useState<Omit<Widget, 'id'>>({
    title: 'Nuevo Reporte Personalizado',
    source: 'members',
    dimension: 'gender',
    metric: 'Conteo de Registros',
    aggregation: 'count',
    targetField: '',
    chartType: 'bar'
  });

  const previewData = useChartData(parsedNLP || builderSettings, datasets, dateFilter);
  const manualPreviewData = useChartData(builderSettings, datasets, dateFilter);

  const handleAddWidget = (widgetConfig: Omit<Widget, 'id'>) => {
    onAddWidget(widgetConfig);
    setParsedNLP(null);
    setSearchQuery('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-3 bg-[#0B1530] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative space-y-4">
          <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
            <Sparkles className="text-gold" />
            Asistente Inteligente de Datos
          </h3>
          <p className="text-slate-300 text-xs">
            Pregunta al asistente para configurar reportes instantáneamente con palabras clave (ej: *"mostrar donaciones por mes"*, *"inventario por estado"*, *"diezmos totales por miembros"*, *"alabanzas por estilo"*).
          </p>

          <form onSubmit={handleNLPSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Escribe tu consulta analítica..."
                className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:bg-white/15 transition-all font-semibold"
              />
              <Search size={18} className="absolute right-3.5 top-3.5 text-white/50" />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gold hover:bg-gold/90 text-slate-900 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              Analizar
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2 text-[11px] items-center text-slate-350">
            <span className="font-bold">Sugerencias:</span>
            {[
              'diezmos por mes',
              'miembros por genero',
              'inventario por estado',
              'alabanzas por estilo',
              'peticiones por estado',
              'donaciones por metodo de pago'
            ].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  setSearchQuery(tag);
                  setTimeout(() => handleNLPSearch(e, tag), 50);
                }}
                className="bg-white/5 hover:bg-white/15 px-2.5 py-1 rounded-full text-slate-200 border border-white/10 transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {parsedNLP && (
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-amber-100 rounded-2xl p-6 shadow-xs animate-fadeIn space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-amber-50">
            <h3 className="font-serif font-bold text-amber-800 text-sm flex items-center gap-1.5">
              <Sparkles size={16} className="text-gold animate-bounce" />
              Resultado del Asistente Inteligente: {parsedNLP.title}
            </h3>
            <button
              onClick={() => setParsedNLP(null)}
              className="p-1 rounded-full hover:bg-slate-100 text-gray-400"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="space-y-3">
              <div className="text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-white/10 space-y-2">
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[9px]">Fuente</span>
                  <span className="font-bold text-slate-800 dark:text-gray-100 capitalize">{parsedNLP.source}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[9px]">Dimensión (Eje X)</span>
                  <span className="font-bold text-slate-800 dark:text-gray-100">{getDimensionLabel(parsedNLP.dimension)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[9px]">Agregación (Eje Y)</span>
                  <span className="font-bold text-slate-800 dark:text-gray-100 capitalize">
                    {parsedNLP.aggregation} {parsedNLP.targetField && `(${parsedNLP.targetField})`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[9px]">Gráfico</span>
                  <span className="font-bold text-slate-800 dark:text-gray-100 capitalize">{parsedNLP.chartType}</span>
                </div>
              </div>

              <button
                onClick={() => handleAddWidget(parsedNLP)}
                className="w-full py-3 bg-primary hover:bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Plus size={16} />
                Guardar en mi Dashboard
              </button>
            </div>

            <div className="md:col-span-2 border border-slate-100 dark:border-white/5 rounded-xl p-4 min-h-[220px] flex items-center justify-center bg-slate-50/50">
              {(() => {
                if (previewData.length === 0) {
                  return <span className="text-xs text-gray-400 italic">No se hallaron registros coincidentes.</span>;
                }
                if (parsedNLP.chartType === 'kpi') {
                  const val = previewData.map(d => d.valor).reduce((a, b) => a + b, 0);
                  return (
                    <div className="text-center">
                      <p className="text-5xl font-mono font-extrabold text-slate-800 dark:text-gray-100">
                        {parsedNLP.targetField.includes('amount') || parsedNLP.targetField.includes('total')
                          ? `$${val.toLocaleString('es-ES')}` 
                          : val.toLocaleString('es-ES')}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">Vista Previa de Tarjeta</p>
                    </div>
                  );
                }
                if (parsedNLP.chartType === 'table') {
                  return (
                    <div className="w-full max-h-[200px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 font-bold">
                          <tr className="border-b border-slate-100 dark:border-white/5 text-gray-500 dark:text-gray-450">
                            <th className="p-2">Eje X</th>
                            <th className="p-2 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-650">
                          {previewData.map((d, i) => (
                            <tr key={i}>
                              <td className="p-2 font-semibold">{d.name}</td>
                              <td className="p-2 text-right font-mono font-bold">{d.valor}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }
                return (
                  <div className="h-48 w-full text-[9px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      {parsedNLP.chartType === 'bar' ? (
                        <BarChart data={previewData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tickLine={false} />
                          <YAxis tickLine={false} />
                          <Tooltip />
                          <Bar dataKey="valor" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : parsedNLP.chartType === 'line' ? (
                        <LineChart data={previewData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tickLine={false} />
                          <YAxis tickLine={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                      ) : parsedNLP.chartType === 'area' ? (
                        <AreaChart data={previewData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tickLine={false} />
                          <YAxis tickLine={false} />
                          <Tooltip />
                          <Area type="monotone" dataKey="valor" stroke="#3b82f6" fill="#eff6ff" />
                        </AreaChart>
                      ) : (
                        <PieChart>
                          <Pie
                            data={previewData}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            dataKey="valor"
                            label={({ name, percent }) => `${(name || "").slice(0, 8)} (${((percent || 0) * 100).toFixed(0)}%)`}
                          >
                            {previewData.map((_e, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-slate-800 dark:text-gray-100 text-sm flex items-center gap-1.5">
          <Settings size={16} className="text-slate-500 dark:text-gray-450" />
          Constructor Manual de Reportes
        </h3>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Título del Gráfico</label>
            <input
              type="text"
              value={builderSettings.title}
              onChange={(e) => setBuilderSettings(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-slate-350"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Origen de Datos</label>
            <select
              value={builderSettings.source}
              onChange={(e) => {
                const val = e.target.value;
                let defaultDim = 'gender';
                if (val === 'donations' || val === 'orders') defaultDim = 'payment_method';
                else if (val === 'inventory' || val === 'petitions') defaultDim = 'status';
                else if (val === 'songs') defaultDim = 'artist';
                else if (val === 'events') defaultDim = 'recurrence';
                else if (val === 'form_responses') defaultDim = 'block_id';

                setBuilderSettings(prev => ({
                  ...prev,
                  source: val as Widget['source'],
                  dimension: defaultDim,
                  aggregation: 'count',
                  targetField: ''
                }));
              }}
              className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer bg-white dark:bg-slate-900"
            >
              <option value="members">Miembros (CRM)</option>
              <option value="donations">Diezmos y Ofrendas (Finanzas)</option>
              <option value="inventory">Inventario de Equipos</option>
              <option value="form_responses">Cuestionarios y Notas</option>
              <option value="petitions">Peticiones de Oración</option>
              <option value="orders">Pedidos de Tienda</option>
              <option value="songs">Alabanzas y Himnos</option>
              <option value="events">Eventos (Calendario)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Dimensión (Eje X / Agrupación)</label>
            <select
              value={builderSettings.dimension}
              onChange={(e) => setBuilderSettings(prev => ({ ...prev, dimension: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer bg-white dark:bg-slate-900"
            >
              {builderSettings.source === 'members' && (
                <>
                  <option value="gender">Género</option>
                  <option value="leadership_role">Rol de Liderazgo</option>
                  <option value="age_group">Grupos de Edad</option>
                  <option value="month">Mes de Registro</option>
                </>
              )}
              {builderSettings.source === 'donations' && (
                <>
                  <option value="payment_method">Método de Pago</option>
                  <option value="category">Categoría</option>
                  <option value="status">Estado del Pago</option>
                  <option value="month">Mes de Donación</option>
                </>
              )}
              {builderSettings.source === 'inventory' && (
                <>
                  <option value="status">Estado Físico</option>
                  <option value="category">Categoría de Inventario</option>
                  <option value="month">Mes de Adquisición</option>
                </>
              )}
              {builderSettings.source === 'form_responses' && (
                <>
                  <option value="block_id">Bloque / Cuestionario</option>
                  <option value="score_range">Rango de Calificación</option>
                  <option value="month">Mes de Envío</option>
                </>
              )}
              {builderSettings.source === 'petitions' && (
                <>
                  <option value="status">Estado de Petición</option>
                  <option value="month">Mes de Solicitud</option>
                </>
              )}
              {builderSettings.source === 'orders' && (
                <>
                  <option value="status">Estado del Pedido</option>
                  <option value="payment_method">Método de Pago</option>
                  <option value="month">Mes de Compra</option>
                </>
              )}
              {builderSettings.source === 'songs' && (
                <>
                  <option value="artist">Artista / Autor</option>
                  <option value="bpm_range">BPM / Tempo</option>
                  <option value="month">Mes de Registro</option>
                </>
              )}
              {builderSettings.source === 'events' && (
                <>
                  <option value="recurrence">Es Recurrente (Sí/No)</option>
                  <option value="recurrence_type">Tipo Recurrencia</option>
                  <option value="month">Mes de Evento</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Métrica (Eje Y / Agregación)</label>
            <select
              value={`${builderSettings.aggregation}:${builderSettings.targetField}`}
              onChange={(e) => {
                const [agg, field] = e.target.value.split(':');
                setBuilderSettings(prev => ({
                  ...prev,
                  aggregation: agg as Widget['aggregation'],
                  targetField: field || ''
                }));
              }}
              className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer bg-white dark:bg-slate-900"
            >
              <option value="count:">Conteo de Registros</option>
              
              {builderSettings.source === 'members' && (
                <>
                  <option value="sum:tithes_sum">Suma de Diezmos</option>
                  <option value="avg:tithes_sum">Promedio de Diezmos</option>
                </>
              )}
              {builderSettings.source === 'donations' && (
                <>
                  <option value="sum:amount">Suma de Monto</option>
                  <option value="avg:amount">Promedio de Monto</option>
                </>
              )}
              {builderSettings.source === 'inventory' && (
                <>
                  <option value="sum:quantity">Suma de Cantidades</option>
                  <option value="sum:price * quantity">Valor Estimado Total</option>
                  <option value="avg:price">Precio Unitario Promedio</option>
                </>
              )}
              {builderSettings.source === 'form_responses' && (
                <>
                  <option value="avg:score">Calificación Promedio</option>
                </>
              )}
              {builderSettings.source === 'orders' && (
                <>
                  <option value="sum:total">Suma de Totales</option>
                  <option value="avg:total">Monto de Compra Promedio</option>
                </>
              )}
              {builderSettings.source === 'songs' && (
                <>
                  <option value="avg:bpm">Promedio de BPM</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tipo de Visualización</label>
            <select
              value={builderSettings.chartType}
              onChange={(e) => setBuilderSettings(prev => ({ ...prev, chartType: e.target.value as Widget['chartType'] }))}
              className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer bg-white dark:bg-slate-900"
            >
              <option value="bar">Gráfico de Barras</option>
              <option value="line">Gráfico de Líneas</option>
              <option value="area">Gráfico de Área</option>
              <option value="pie">Gráfico Circular (Pastel)</option>
              <option value="kpi">Tarjeta KPI (Valor Único)</option>
              <option value="table">Tabla de Resumen</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => handleAddWidget(builderSettings)}
          className="w-full py-2.5 bg-primary hover:bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
        >
          <Plus size={16} />
          Añadir al Dashboard
        </button>
      </div>

      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/10 rounded-2xl p-6 shadow-sm min-h-[350px] flex flex-col justify-between">
        <div>
          <h3 className="font-serif font-bold text-slate-800 dark:text-gray-100 text-xs md:text-sm mb-1">{builderSettings.title}</h3>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Previsualización en Tiempo Real</span>
        </div>

        <div className="flex-1 flex items-center justify-center my-6">
          {(() => {
            if (manualPreviewData.length === 0) {
              return <span className="text-xs text-gray-400 italic">No se hallaron registros coincidentes.</span>;
            }
            if (builderSettings.chartType === 'kpi') {
              const val = manualPreviewData.map(d => d.valor).reduce((a, b) => a + b, 0);
              return (
                <div className="text-center">
                  <p className="text-6xl font-mono font-extrabold text-slate-850">
                    {builderSettings.targetField.includes('amount') || builderSettings.targetField.includes('total') || builderSettings.targetField.includes('price')
                      ? `$${val.toLocaleString('es-ES')}` 
                      : val.toLocaleString('es-ES')}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">Valor Único Agregado</p>
                </div>
              );
            }
            if (builderSettings.chartType === 'table') {
              return (
                <div className="w-full max-h-[220px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 font-bold border-b border-slate-100 dark:border-white/5 text-gray-500 dark:text-gray-450">
                      <tr>
                        <th className="p-2">Eje X</th>
                        <th className="p-2 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-650">
                      {manualPreviewData.map((d, i) => (
                        <tr key={i}>
                          <td className="p-2 font-semibold">{d.name}</td>
                          <td className="p-2 text-right font-mono font-bold">
                            {builderSettings.targetField.includes('amount') || builderSettings.targetField.includes('total') || builderSettings.targetField.includes('price')
                              ? `$${d.valor.toLocaleString('es-ES')}`
                              : d.valor.toLocaleString('es-ES')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
            return (
              <div className="h-60 w-full text-[10px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  {builderSettings.chartType === 'bar' ? (
                    <BarChart data={manualPreviewData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="valor" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : builderSettings.chartType === 'line' ? (
                    <LineChart data={manualPreviewData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  ) : builderSettings.chartType === 'area' ? (
                    <AreaChart data={manualPreviewData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="valor" stroke="#d97706" fill="#fef3c7" strokeWidth={2} />
                    </AreaChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={manualPreviewData}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="valor"
                        label={({ name, percent }) => `${(name || "").slice(0, 10)} (${((percent || 0) * 100).toFixed(0)}%)`}
                      >
                        {manualPreviewData.map((_e, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            );
          })()}
        </div>
        <div className="text-[10px] text-gray-400 text-center italic">
          Cambia la configuración del Constructor en la barra lateral para actualizar esta previsualización.
        </div>
      </div>
    </div>
  );
}
