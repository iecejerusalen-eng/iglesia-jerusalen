import { useState } from 'react';
import { Search, FileText, Lock, Check, Clock, MoreVertical, Building2, Calendar as CalendarIcon, UserCheck } from 'lucide-react';

interface ClassSession {
  id: string;
  courseTitle: string;
  level: string;
  shift: string;
  room: string;
  observation: string;
  date: string;
  entryTime: string;
  exitTime: string;
  status: 'OPEN' | 'CLOSED';
}

const mockSessions: ClassSession[] = [
  {
    id: '1',
    courseTitle: 'Ciencias Sociales',
    level: '6TO EGB - A',
    shift: 'Turno 7 (11:15 AM a 12:00 PM)',
    room: 'Aula 111',
    observation: 'Sin observación',
    date: '20 Jul 2026',
    entryTime: '11:15',
    exitTime: '12:00',
    status: 'CLOSED'
  },
  {
    id: '2',
    courseTitle: 'Ciencias Sociales',
    level: '6TO EGB - C',
    shift: 'Turno 6 (10:30 AM a 11:15 AM)',
    room: 'Aula 111',
    observation: 'Sin observación',
    date: '20 Jul 2026',
    entryTime: '10:30',
    exitTime: '11:15',
    status: 'CLOSED'
  },
  {
    id: '3',
    courseTitle: 'Ciencias Sociales',
    level: '7MO EGB - B',
    shift: 'Turno 4 (09:15 AM a 10:00 AM)',
    room: 'Aula 115',
    observation: 'Comportamiento excelente',
    date: '20 Jul 2026',
    entryTime: '09:15',
    exitTime: '10:00',
    status: 'OPEN'
  }
];

export function ClassesTab() {
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = mockSessions.filter(session => {
    if (filter !== 'ALL' && session.status !== filter) return false;
    if (searchTerm && !session.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const openCount = mockSessions.filter(s => s.status === 'OPEN').length;
  const closedCount = mockSessions.filter(s => s.status === 'CLOSED').length;

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
            <p className="text-sm text-slate-400">Clases del profesor</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
            <button 
              onClick={() => setFilter(filter === 'OPEN' ? 'ALL' : 'OPEN')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
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
              placeholder="Filtrar por materia..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 w-[200px]"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
          <FileText size={18} />
          Informe de Asistencia
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-rose-500/20">
          <Lock size={18} />
          Cerrar todas las Clases
        </button>
      </div>

      {/* Classes Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800">
                <th className="py-4 px-6 font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={14} /> Materia
                </th>
                <th className="py-4 px-6 font-bold text-xs text-slate-400 uppercase tracking-wider">
                  <UserCheck size={14} className="inline mr-2" /> Observación
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
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 border border-slate-700/50">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-white text-[15px]">
                          {session.courseTitle} - {session.level}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700">
                            <Clock size={12} className="text-indigo-400" />
                            {session.shift}
                          </span>
                          <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700">
                            <Lock size={12} className="text-amber-400" />
                            {session.room}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="italic text-sm text-slate-400">
                      {session.observation}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm font-bold text-slate-300">
                    <div className="flex flex-col">
                      <span>{session.date.split(' ')[0]} {session.date.split(' ')[1]}</span>
                      <span className="text-slate-500">{session.date.split(' ')[2]}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400">→</span>
                      <span className="font-mono font-bold text-slate-200 border border-slate-700 bg-slate-800/50 px-2.5 py-1 rounded-md">{session.entryTime}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400">←</span>
                      <span className="font-mono font-bold text-slate-200 border border-slate-700 bg-slate-800/50 px-2.5 py-1 rounded-md">{session.exitTime}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {session.status === 'CLOSED' ? (
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
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-600">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
