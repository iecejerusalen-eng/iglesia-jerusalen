import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import type { Mission } from '../../types';
import { Globe, Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '../../utils/cloudinary';

export default function MissionsManager() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Partial<Mission>>({
    title: '',
    description: '',
    location: '',
    goal_amount: 0,
    current_amount: 0,
    status: 'active',
    image_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadMissions = async () => {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMissions(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar proyectos misioneros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadMissions();
    });
  }, []);

  const handleOpenModal = (mission?: Mission) => {
    if (mission) {
      setFormData(mission);
    } else {
      setFormData({
        title: '',
        description: '',
        location: '',
        goal_amount: 0,
        current_amount: 0,
        status: 'active',
        image_url: ''
      });
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return toast.error('El título es requerido');
    
    setIsSubmitting(true);
    try {
      let finalImageUrl = formData.image_url;

      if (selectedFile) {
        toast.loading('Subiendo imagen...', { id: 'upload' });
        const result = await uploadImage(selectedFile, 'missions');
        if (result.secure_url) {
          finalImageUrl = result.secure_url;
        }
        toast.dismiss('upload');
      }

      const payload = {
        ...formData,
        image_url: finalImageUrl
      };

      if (formData.id) {
        const { error } = await supabase
          .from('missions')
          .update(payload)
          .eq('id', formData.id);
        if (error) throw error;
        toast.success('Proyecto actualizado');
      } else {
        const { error } = await supabase
          .from('missions')
          .insert([payload]);
        if (error) throw error;
        toast.success('Proyecto creado');
      }

      setIsModalOpen(false);
      loadMissions();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el proyecto');
      toast.dismiss('upload');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este proyecto misionero?')) return;
    try {
      const { error } = await supabase.from('missions').delete().eq('id', id);
      if (error) throw error;
      toast.success('Proyecto eliminado');
      loadMissions();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  const filteredMissions = missions.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white flex items-center gap-3">
            <Globe className="w-8 h-8 text-rose-500" /> Proyectos Misioneros
          </h1>
          <p className="text-slate-500 mt-2">Gestiona el impacto global y el fondo de misiones.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all"
        >
          <Plus className="w-5 h-5" /> Nuevo Proyecto
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm mb-8">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Proyecto</th>
                <th className="px-6 py-4">Ubicación</th>
                <th className="px-6 py-4">Progreso (Recaudado)</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500">Cargando proyectos...</td>
                </tr>
              ) : filteredMissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500">No se encontraron proyectos misioneros.</td>
                </tr>
              ) : (
                filteredMissions.map((mission) => {
                  const goal = Number(mission.goal_amount) || 0;
                  const current = Number(mission.current_amount) || 0;
                  const percent = goal > 0 ? Math.min(Math.round((current / goal) * 100), 100) : 0;
                  
                  return (
                    <tr key={mission.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                          {mission.image_url ? (
                            <img src={mission.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Globe className="w-5 h-5 text-slate-400 m-2.5" />
                          )}
                        </div>
                        {mission.title}
                      </td>
                      <td className="px-6 py-4">{mission.location}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 w-48">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>${current.toLocaleString()}</span>
                            {goal > 0 && <span>${goal.toLocaleString()}</span>}
                          </div>
                          {goal > 0 && (
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${percent}%` }} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          mission.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          mission.status === 'completed' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {mission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenModal(mission)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(mission.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white">
                {formData.id ? 'Editar Proyecto Misionero' : 'Nuevo Proyecto Misionero'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Título del Proyecto</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Descripción Corta</label>
                  <textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Ubicación (País/Ciudad)</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    placeholder="Ej. Bucay, Ecuador"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Estado</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as Mission['status']})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white"
                  >
                    <option value="active">Activo</option>
                    <option value="completed">Completado</option>
                    <option value="paused">Pausado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Meta Económica ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.goal_amount || 0}
                    onChange={e => setFormData({...formData, goal_amount: parseFloat(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Recaudado Actualmente ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.current_amount || 0}
                    onChange={e => setFormData({...formData, current_amount: parseFloat(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Imagen Representativa</label>
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Preview" className="h-32 rounded-xl object-cover mb-4 border border-slate-200 dark:border-slate-800" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 dark:file:bg-rose-900/30 dark:file:text-rose-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
