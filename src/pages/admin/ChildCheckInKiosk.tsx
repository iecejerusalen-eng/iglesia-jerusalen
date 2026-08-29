import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertTriangle, Plus, Search, Printer, Clock, X
} from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import { competitiveService } from '../../features/competitive/services/competitiveService';
import type { ChildCheckInSession } from '../../features/competitive/types';
import { toast } from 'sonner';

export const ChildCheckInKiosk = () => {
  const [sessions, setSessions] = useState<ChildCheckInSession[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [childName, setChildName] = useState('');
  const [classroomName, setClassroomName] = useState('Semillitas (3-5 años)');
  const [allergies, setAllergies] = useState('');
  const [checkedInBy, setCheckedInBy] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchSessions = async () => {
      const data = await competitiveService.getChildCheckInSessions();
      if (isMounted) setSessions(data);
    };
    void fetchSessions();
    return () => { isMounted = false; };
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim()) return;
    try {
      const created = await competitiveService.checkInChild({
        child_name: childName,
        classroom_name: classroomName,
        allergies_medical_notes: allergies || undefined,
        checked_in_by: checkedInBy || 'Tutor Autorizado',
      });

      setSessions(current => [created, ...current]);
      setChildName('');
      setAllergies('');
      setCheckedInBy('');
      setShowModal(false);
      toast.success(`Check-In exitoso. Código de Seguridad: ${created.safety_security_code}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo registrar el check-in.');
    }
  };

  const handlePrintBadge = (session: ChildCheckInSession) => {
    toast.info(`Imprimiendo etiqueta de seguridad para ${session.child_name} [${session.safety_security_code}]`);
  };

  const filteredSessions = sessions.filter(s =>
    s.child_name.toLowerCase().includes(search.toLowerCase()) ||
    s.safety_security_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Check-In Seguro de Niños (Child Safety Kiosk)"
        description="Módulo de seguridad para ministerio infantil con códigos únicos, etiquetas térmicas y verificación de tutores"
      />

      {/* CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por niño o código de seguridad..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:scale-105 transition shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          Ingresar Niño a Clase
        </button>
      </div>

      {/* SESSIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSessions.map(session => (
          <div
            key={session.id}
            className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl backdrop-blur-md relative overflow-hidden"
          >
            {/* BADGE CODE HEADER */}
            <div className="flex items-center justify-between">
              <div className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-mono font-bold border border-amber-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                CÓDIGO: {session.safety_security_code}
              </div>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium border border-emerald-500/20">
                ● En Clase
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white">{session.child_name}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Aula: <strong className="text-slate-200">{session.classroom_name}</strong>
              </p>
            </div>

            {session.allergies_medical_notes && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span><strong>ALERTA MÉDICA:</strong> {session.allergies_medical_notes}</span>
              </div>
            )}

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>Tutor: <strong className="text-slate-300">{session.checked_in_by}</strong></span>
              <button
                onClick={() => handlePrintBadge(session)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg transition"
                title="Imprimir Etiqueta Térmica"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CHECK-IN MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" /> Nuevo Check-In Infantil
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Niño/a *</label>
                <input
                  type="text"
                  required
                  value={childName}
                  onChange={e => setChildName(e.target.value)}
                  placeholder="Ej. Mateo Ramírez"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Aula / Salón</label>
                <select
                  value={classroomName}
                  onChange={e => setClassroomName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Cuna (0-2 años)">Cuna (0-2 años)</option>
                  <option value="Semillitas (3-5 años)">Semillitas (3-5 años)</option>
                  <option value="Campeones de Fe (6-9 años)">Campeones de Fe (6-9 años)</option>
                  <option value="Pre-Adolescentes (10-12 años)">Pre-Adolescentes (10-12 años)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tutor que Ingresa</label>
                <input
                  type="text"
                  value={checkedInBy}
                  onChange={e => setCheckedInBy(e.target.value)}
                  placeholder="Ej. Carlos Ramírez (Padre)"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alergias o Notas Médicas (Opcional)</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={e => setAllergies(e.target.value)}
                  placeholder="Ej. Alergia al maní o lactosa"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl text-xs">Generar Check-In & Código</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChildCheckInKiosk;
