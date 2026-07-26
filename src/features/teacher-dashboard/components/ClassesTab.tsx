import { useState } from 'react';
import { Search, FileText, Lock, Check, Clock, MoreVertical, Building2, Calendar as CalendarIcon, UserCheck, Video, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ClassSession {
  id: string;
  title: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  location: string | null;
  sync_link: string | null;
  notes: string | null;
}

interface ClassesTabProps {
  sessions: ClassSession[];
  courseId: string;
}

export function ClassesTab({ sessions = [], courseId }: ClassesTabProps) {
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const normalizeStatus = (status: string): 'OPEN' | 'CLOSED' => {
    const openStatuses = ['open', 'active', 'scheduled', 'in_progress'];
    return openStatuses.includes(status?.toLowerCase()) ? 'OPEN' : 'CLOSED';
  };

  const filteredSessions = sessions.filter(session => {
    const normalizedStatus = normalizeStatus(session.status);
    if (filter !== 'ALL' && normalizedStatus !== filter) return false;
    if (searchTerm && !session.title?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const openCount = sessions.filter(s => normalizeStatus(s.status) === 'OPEN').length;
  const closedCount = sessions.filter(s => normalizeStatus(s.status) === 'CLOSED').length;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '--:--';
    return timeStr.substring(0, 5);
  };

  /** Export sessions list as CSV for download */
  const handleExportReport = () => {
    if (sessions.length === 0) {
      toast.warning('No hay sesiones para exportar.');
      return;
    }
    const headers = ['Clase', 'Fecha', 'Hora Inicio', 'Hora Fin', 'Ubicación', 'Estado', 'Notas'];
    const rows = sessions.map(s => [
      s.title || '',
      s.session_date || '',
      s.start_time || '',
      s.end_time || '',
      s.location || '',
      normalizeStatus(s.status) === 'OPEN' ? 'Abierta' : 'Cerrada',
      s.notes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_clases_${courseId}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Reporte CSV descargado.');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Controls */}
      <div className="bg-[#0f172a] dark:bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Title */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Mis Clases</h2>
            <p className="text-sm text-slate-400">
              {sessions.length} sesión{sessions.length !== 1 ? 'es' : ''} registrada{sessions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
            <button 
              onClick={() => setFilter(filter === 'OPEN' ? 'ALL' : 'OPEN')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                filter === 'OPEN' || filter === 'ALL' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'text-slate-400 hover:text-slate-300 border border-transparent'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${filter === 'OPEN' || filter === 'ALL' ? 'bg-emerald-400' : 'bg-slate-500'}`}></div>
              {openCount} Abiertas
            </button>
            <button 
              onClick={() => setFilter(filter === 'CLOSED' ? 'ALL' : 'CLOSED')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                filter === 'CLOSED' || filter === 'ALL' 
                  ? 'bg-slate-700 text-slate-200 border border-slate-600' 
                  : 'text-slate-400 hover:text-slate-300 border border-transparent'
              }`}
            >
              <Check size={14} className={filter === 'CLOSED' || filter === 'ALL' ? 'text-slate-300' : 'text-slate-500'} />
              {closedCount} Cerradas
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Filtrar por clase..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 w-[200px]"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button 
          onClick={handleExportReport}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20 cursor-pointer"
        >
          <Download size={18} />
          Exportar Reporte CSV
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-rose-500/20 cursor-pointer">
          <Lock size={18} />
          Cerrar todas las Clases
        </button>
      </div>

      {/* Empty state */}
      {sessions.length === 0 ? (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-12 text-center">
          <Building2 size={48} className="mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-300 mb-1">No hay sesiones de clase</h3>
          <p className="text-sm text-slate-500">Cree una sesión desde la pestaña de Alumnos para comenzar a registrar clases.</p>
        </div>
      ) : (
        /* Classes Table */
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800">
                  <th className="py-4 px-6 font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} /> Clase
                  </th>
                  <th className="py-4 px-6 font-bold text-xs text-slate-400 uppercase tracking-wider">
                    <UserCheck size={14} className="inline mr-2" /> Notas
                  </th>
                  <th className="py-4 px-6 font-bold text-xs text-slate-400 uppercase tracking-wider">
                    <CalendarIcon size={14} className="inline mr-2" /> Fecha
                  </th>
                  <th className="py-4 px-6 font-bold text-xs text-slate-400 uppercase tracking-wider">
                    <Clock size={14} className="inline mr-2" /> Entrada
                  </th>
                  <th className="py-4 px-6 font-bold text-xs text-slate-400 uppercase tracking-wider">
                    <Clock size={14} className="inline mr-2" /> Salida
                  </th>
                  <th className="py-4 px-6 font-bold text-xs text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="py-4 px-6 font-bold text-xs text-slate-400 uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredSessions.map((session) => {
                  const status = normalizeStatus(session.status);
                  return (
                    <tr key={session.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 border border-slate-700/50">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <div className="font-bold text-white text-[15px]">
                              {session.title || 'Sesión sin título'}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                              {session.location && (
                                <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700">
                                  <Lock size={12} className="text-amber-400" />
                                  {session.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="italic text-sm text-slate-400">
                          {session.notes || 'Sin observación'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-300">
                        {formatDate(session.session_date)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400">→</span>
                          <span className="font-mono font-bold text-slate-200 border border-slate-700 bg-slate-800/50 px-2.5 py-1 rounded-md">{formatTime(session.start_time)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-rose-400">←</span>
                          <span className="font-mono font-bold text-slate-200 border border-slate-700 bg-slate-800/50 px-2.5 py-1 rounded-md">{formatTime(session.end_time)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {status === 'CLOSED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-slate-600 text-slate-400 bg-slate-800/50">
                            <Check size={12} /> CERRADA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> ABIERTA
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {session.sync_link && (
                            <a
                              href={session.sync_link}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors border border-transparent hover:border-indigo-500/30"
                              title="Unirse a sesión sincrónica"
                            >
                              <Video size={16} />
                            </a>
                          )}
                          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-600 cursor-pointer">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
    </div>
  );
}
