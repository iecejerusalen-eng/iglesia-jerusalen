import { useState } from 'react';
import { Award, Search, Save, Edit2, Trash2, X, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { useCareers } from '../hooks/useCareers';
import { useCareersMutations } from '../hooks/useCareersMutations';

interface CareersModalProps {
  onClose: () => void;
}

export const CareersModal = ({ onClose }: CareersModalProps) => {
  const confirm = useConfirmStore((state) => state.confirm);
  const { data: careersList = [], isLoading } = useCareers();
  const { addCareerMutation, updateCareerMutation, deleteCareerMutation } = useCareersMutations();

  const [newCareerName, setNewCareerName] = useState('');
  const [editingCareerId, setEditingCareerId] = useState<string | null>(null);
  const [editingCareerName, setEditingCareerName] = useState('');
  const [careerSearchQuery, setCareerSearchQuery] = useState('');

  const savingCareer = addCareerMutation.isPending || updateCareerMutation.isPending || deleteCareerMutation.isPending;

  const handleAddCareer = async () => {
    if (!newCareerName.trim()) return;
    try {
      await addCareerMutation.mutateAsync(newCareerName);
      toast.success('Carrera agregada exitosamente.');
      setNewCareerName('');
    } catch (err: any) {
      toast.error('Error al agregar carrera: ' + (err.message || 'Nombre duplicado o sin conexión.'));
    }
  };

  const handleUpdateCareer = async (id: string) => {
    if (!editingCareerName.trim()) return;
    try {
      await updateCareerMutation.mutateAsync({ id, name: editingCareerName });
      toast.success('Carrera actualizada exitosamente.');
      setEditingCareerId(null);
      setEditingCareerName('');
    } catch (err: any) {
      toast.error('Error al actualizar carrera: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleDeleteCareer = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Eliminar carrera',
      message: `¿Estás seguro de eliminar la carrera "${name}"?\n\nEsto removerá la referencia en todos los miembros vinculados.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteCareerMutation.mutateAsync(id);
      toast.success('Carrera eliminada exitosamente.');
    } catch (err: any) {
      toast.error('Error al eliminar carrera: ' + (err.message || 'Error desconocido'));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col h-[520px] relative text-left animate-scale-in">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-150 dark:border-white/10 flex-shrink-0">
          <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-base flex items-center gap-1.5">
            <Award className="text-primary" size={18} />
            Catálogo de Carreras Universitarias
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-650 rounded-lg p-1 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex-grow flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-xl p-3 shadow-2xs">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Registrar Nueva Carrera</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCareerName}
                onChange={(e) => setNewCareerName(e.target.value)}
                placeholder="Ej. Licenciatura en Teología"
                className="flex-grow bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
              />
              <button
                type="button"
                onClick={handleAddCareer}
                disabled={savingCareer || !newCareerName.trim()}
                className="px-4 bg-primary hover:bg-blue-800 disabled:bg-slate-200 disabled:text-gray-400 text-white rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {savingCareer && !editingCareerId ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} />}
                Añadir
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Search className="text-gray-400" size={14} />
            <input
              type="text"
              value={careerSearchQuery}
              onChange={(e) => setCareerSearchQuery(e.target.value)}
              placeholder="Filtrar carreras..."
              className="flex-grow text-xs focus:outline-none text-gray-700 dark:text-gray-300 bg-transparent font-semibold"
            />
            {careerSearchQuery && (
              <button onClick={() => setCareerSearchQuery('')} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex-grow bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl overflow-y-auto divide-y divide-gray-100 dark:divide-white/5 shadow-2xs max-h-[260px]">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400 text-xs font-medium">Cargando carreras...</div>
            ) : (() => {
              const filtered = careersList.filter(c =>
                c.name.toLowerCase().includes(careerSearchQuery.toLowerCase())
              );

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-400 text-xs font-medium">
                    No se encontraron carreras.
                  </div>
                );
              }

              return filtered.map(c => (
                <div key={c.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                  {editingCareerId === c.id ? (
                    <div className="flex-grow flex gap-2 items-center">
                      <input
                        type="text"
                        value={editingCareerName}
                        onChange={(e) => setEditingCareerName(e.target.value)}
                        className="flex-grow bg-white dark:bg-slate-900 border border-primary rounded px-2.5 py-1 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateCareer(c.id)}
                        disabled={savingCareer || !editingCareerName.trim()}
                        className="text-emerald-600 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50 cursor-pointer"
                        title="Guardar"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCareerId(null);
                          setEditingCareerName('');
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                        title="Cancelar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{c.name}</span>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCareerId(c.id);
                            setEditingCareerName(c.name);
                          }}
                          className="text-gray-400 hover:text-primary p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Editar nombre"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCareer(c.id, c.name)}
                          className="text-gray-400 hover:text-accent-red p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar carrera"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ));
            })()}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-150 dark:border-white/10 flex justify-end flex-shrink-0 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
