import React, { useState, useEffect } from 'react';
import {
  Globe2, Plus, MapPin, User, X
} from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import { competitiveService } from '../../features/competitive/services/competitiveService';
import type { Campus } from '../../features/competitive/types';
import { toast } from 'sonner';

export const CampusManager = () => {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('');
  const [pastorName, setPastorName] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchCampuses = async () => {
      const data = await competitiveService.getCampuses();
      if (isMounted) setCampuses(data);
    };
    void fetchCampuses();
    return () => { isMounted = false; };
  }, []);

  const handleCreateCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const created = await competitiveService.createCampus({
      name,
      code: code || name.substring(0, 4).toUpperCase(),
      city: city || 'Ciudad Principal',
      pastor_name: pastorName || 'Pastor Principal',
      status: 'active',
    });

    setCampuses([...campuses, created]);
    setName('');
    setCode('');
    setCity('');
    setPastorName('');
    setShowModal(false);
    toast.success('Sede registrada exitosamente');
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Gestión de Sedes (Multi-Campus / Multi-Site)"
        description="Administra múltiples locaciones físicas y campos de misión bajo una sola base de datos central"
      />

      {/* ACTION BAR */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <p className="text-xs text-slate-400">
          Sedes registradas en el sistema: <strong className="text-amber-300">{campuses.length}</strong>
        </p>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 hover:scale-105 transition shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          Registrar Nueva Sede
        </button>
      </div>

      {/* CAMPUSES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {campuses.map(camp => (
          <div
            key={camp.id}
            className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl backdrop-blur-md hover:border-amber-500/30 transition relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{camp.name}</h3>
                  <span className="text-[11px] text-amber-300/80 font-mono">CÓDIGO: {camp.code || 'MAIN'}</span>
                </div>
              </div>
              {camp.is_main && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  SEDE PRINCIPAL
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-white/5 space-y-2 text-xs text-slate-300">
              <p className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> {camp.city || 'Ciudad Central'}
              </p>
              <p className="flex items-center gap-2 text-slate-400">
                <User className="w-3.5 h-3.5 text-amber-400" /> Pastor: <strong className="text-slate-200">{camp.pastor_name || 'Pastor Principal'}</strong>
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                  Status: {camp.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-amber-400" /> Registrar Nueva Sede
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCreateCampus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de la Sede *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej. Sede Norte - Vida Nueva"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Código Único</label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="Ej. NORTE"
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ciudad / Sector</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Ej. Distrito Norte"
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pastor a Cargo</label>
                <input
                  type="text"
                  value={pastorName}
                  onChange={e => setPastorName(e.target.value)}
                  placeholder="Ej. Pr. Carlos Mendoza"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl text-xs">Guardar Sede</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CampusManager;
