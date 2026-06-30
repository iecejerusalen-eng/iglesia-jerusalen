import React, { useState } from 'react';
import { Users, Calendar, Shield, Plus, PlusCircle, Activity, X } from 'lucide-react';
import { useSessionAttendance } from '../hooks/useTeacherData';

interface StudentsTabProps {
  students: any[];
  sessions: any[];
  groups: any[];
  onAddSession: (e: React.FormEvent, title: string, date: string) => void;
  onAddGroup: (e: React.FormEvent, name: string, desc: string) => void;
  onAttendanceChange: (sessionId: string, studentId: string, status: 'present'|'absent'|'late'|'excused') => void;
}

export function StudentsTab({
  students,
  sessions,
  groups,
  onAddSession,
  onAddGroup,
  onAttendanceChange
}: StudentsTabProps) {
  const [selectedSession, setSelectedSession] = useState<string>(sessions.length > 0 ? sessions[0].id : '');
  const { data: attendanceMap = {} } = useSessionAttendance(selectedSession);

  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().split('T')[0]);

  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const handleAddSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle || !newSessionDate) return;
    onAddSession(e, newSessionTitle, newSessionDate);
    setIsAddSessionOpen(false);
    setNewSessionTitle('');
  };

  const handleAddGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;
    onAddGroup(e, newGroupName, newGroupDesc);
    setIsAddGroupOpen(false);
    setNewGroupName('');
    setNewGroupDesc('');
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={18} className="text-gold" />
              Directorio de Alumnos ({students.length})
            </h3>
            
            <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-96 overflow-y-auto pr-1">
              {students.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">No hay alumnos inscritos en este curso.</p>
              ) : (
                students.map(std => (
                  <div key={std.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
                    <div>
                      <p className="font-bold text-sm text-slate-850 dark:text-white">{std.first_name} {std.last_name}</p>
                      <p className="text-[10px] text-gray-400">Contacto: {std.phone} | Correo: {std.email}</p>
                    </div>
                    
                    <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-2.5 rounded-xl text-left max-w-xs md:max-w-md">
                      <p className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1">
                        <Activity size={10} />
                        Datos Médicos y de Emergencia
                      </p>
                      <p className="text-[10px] text-gray-700 dark:text-gray-300 mt-1">Contacto: {std.emergency_name} ({std.emergency_phone})</p>
                      <p className="text-[10px] text-gray-500 italic">Notas: {std.medical_notes}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Shield size={18} className="text-gold" />
                Subgrupos de Trabajo / Talleres ({groups.length})
              </h3>
              <button 
                onClick={() => setIsAddGroupOpen(true)}
                className="text-xs text-gold font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Nuevo Grupo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.length === 0 ? (
                <p className="text-xs text-gray-400 col-span-2 py-4">No hay subgrupos creado.</p>
              ) : (
                groups.map(group => (
                  <div key={group.id} className="p-4 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-200 dark:border-white/5 rounded-xl text-left space-y-2">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{group.name}</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{group.description || 'Sin descripción'}</p>
                    <span className="text-[9px] bg-gold/15 text-gold font-bold px-2 py-0.5 rounded-full select-none inline-block">Grupo de Discipulado</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
          <div className="flex justify-between items-center">
            <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={18} className="text-gold" />
              Control de Asistencia
            </h3>
            <button 
              onClick={() => setIsAddSessionOpen(true)}
              className="p-1 text-gold hover:bg-gold/10 rounded-lg cursor-pointer"
              title="Registrar fecha de clase"
            >
              <PlusCircle size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Fecha de Sesión</label>
              {sessions.length === 0 ? (
                <p className="text-xs text-red-500 font-semibold">Crea una sesión para registrar asistencia.</p>
              ) : (
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl text-xs font-semibold outline-none"
                >
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.title} ({new Date(s.session_date).toLocaleDateString()})</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {students.map(std => {
                const status = attendanceMap[std.id] || 'present';
                return (
                  <div key={std.id} className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-2 last:border-none">
                    <span className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate max-w-[120px]">{std.first_name} {std.last_name[0]}.</span>
                    
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => onAttendanceChange(selectedSession, std.id, 'present')}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase transition-all cursor-pointer ${
                          status === 'present' ? 'bg-green-500 text-white shadow-2xs' : 'text-gray-400 hover:text-green-500'
                        }`}
                        title="Presente"
                      >
                        P
                      </button>
                      <button
                        type="button"
                        onClick={() => onAttendanceChange(selectedSession, std.id, 'absent')}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase transition-all cursor-pointer ${
                          status === 'absent' ? 'bg-red-500 text-white shadow-2xs' : 'text-gray-400 hover:text-red-500'
                        }`}
                        title="Ausente"
                      >
                        F
                      </button>
                      <button
                        type="button"
                        onClick={() => onAttendanceChange(selectedSession, std.id, 'late')}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase transition-all cursor-pointer ${
                          status === 'late' ? 'bg-amber-500 text-white shadow-2xs' : 'text-gray-400 hover:text-amber-500'
                        }`}
                        title="Atraso"
                      >
                        A
                      </button>
                      <button
                        type="button"
                        onClick={() => onAttendanceChange(selectedSession, std.id, 'excused')}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase transition-all cursor-pointer ${
                          status === 'excused' ? 'bg-blue-500 text-white shadow-2xs' : 'text-gray-400 hover:text-blue-500'
                        }`}
                        title="Justificado"
                      >
                        J
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {isAddSessionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleAddSessionSubmit} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden text-left animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-150 dark:border-white/10">
              <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar size={18} className="text-gold" />
                Registrar Clase / Sesión
              </h2>
              <button 
                type="button" 
                onClick={() => setIsAddSessionOpen(false)}
                className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-1.5 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Título de la Sesión *</label>
                <input
                  type="text"
                  required
                  value={newSessionTitle}
                  onChange={e => setNewSessionTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                  placeholder="Ej. Sesión 1: Introducción a Gálatas"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Fecha *</label>
                <input
                  type="date"
                  required
                  value={newSessionDate}
                  onChange={e => setNewSessionDate(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-150 dark:border-white/10 bg-gray-50 dark:bg-slate-950/20">
              <button
                type="button"
                onClick={() => setIsAddSessionOpen(false)}
                className="px-5 py-2 border border-gray-350 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 transition-all font-medium text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold hover:bg-yellow-600 text-white rounded-lg transition-all font-medium text-xs shadow-sm cursor-pointer"
              >
                Registrar Sesión
              </button>
            </div>
          </form>
        </div>
      )}

      {isAddGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleAddGroupSubmit} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden text-left animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-150 dark:border-white/10">
              <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                <Shield size={18} className="text-gold" />
                Nuevo Subgrupo / Taller
              </h2>
              <button 
                type="button" 
                onClick={() => setIsAddGroupOpen(false)}
                className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-1.5 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Nombre del Grupo *</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                  placeholder="Ej. Taller Bíblico A"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
                  placeholder="Describe la tarea o integrantes asignados..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-150 dark:border-white/10 bg-gray-50 dark:bg-slate-950/20">
              <button
                type="button"
                onClick={() => setIsAddGroupOpen(false)}
                className="px-5 py-2 border border-gray-350 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 transition-all font-medium text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold hover:bg-yellow-600 text-white rounded-lg transition-all font-medium text-xs shadow-sm cursor-pointer"
              >
                Crear Grupo
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
