import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Phone, MapPin, UserPlus, X
} from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import { competitiveService } from '../../features/competitive/services/competitiveService';
import type { Family } from '../../features/competitive/types';
import { toast } from 'sonner';

export const FamiliesManager = () => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyPhone, setNewFamilyPhone] = useState('');
  const [newFamilyCity, setNewFamilyCity] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchFamilies = async () => {
      const data = await competitiveService.getFamilies();
      if (isMounted) setFamilies(data);
    };
    void fetchFamilies();
    return () => { isMounted = false; };
  }, []);

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;

    const created = await competitiveService.createFamily({
      name: newFamilyName,
      phone: newFamilyPhone,
      city: newFamilyCity,
    });

    setFamilies([created, ...families]);
    setNewFamilyName('');
    setNewFamilyPhone('');
    setNewFamilyCity('');
    setShowModal(false);
    toast.success('Unidad Familiar registrada con éxito');
  };

  const filteredFamilies = families.filter(fam =>
    fam.name.toLowerCase().includes(search.toLowerCase()) ||
    (fam.phone && fam.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Gestión de Familias (Family Units)"
        description="Agrupa miembros en hogares para seguimiento integral, recibos unificados y check-in infantil"
      />

      {/* ACTION BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar familia por nombre o teléfono..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:scale-105 transition shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          Registrar Nueva Familia
        </button>
      </div>

      {/* FAMILIES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFamilies.map(fam => (
          <div
            key={fam.id}
            className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl backdrop-blur-md hover:border-amber-500/30 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{fam.name}</h3>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" /> {fam.city || 'Sede Central'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 space-y-2 text-xs text-slate-300">
              {fam.phone && (
                <p className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-amber-400" /> {fam.phone}
                </p>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-amber-300 text-[11px] font-medium">
                  {fam.members_count || 1} Miembros asociados
                </span>
                <button
                  onClick={() => toast.info('Detalle de familia disponible próximamente')}
                  className="text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Ver Hogar
                </button>
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
                <Users className="w-4 h-4 text-amber-400" /> Nueva Unidad Familiar
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCreateFamily} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de la Familia *</label>
                <input
                  type="text"
                  required
                  value={newFamilyName}
                  onChange={e => setNewFamilyName(e.target.value)}
                  placeholder="Ej. Familia Ramírez López"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono Principal</label>
                <input
                  type="text"
                  value={newFamilyPhone}
                  onChange={e => setNewFamilyPhone(e.target.value)}
                  placeholder="+57 300 123 4567"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ciudad / Sector</label>
                <input
                  type="text"
                  value={newFamilyCity}
                  onChange={e => setNewFamilyCity(e.target.value)}
                  placeholder="Ej. Sede Central"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl text-xs">Guardar Familia</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default FamiliesManager;
