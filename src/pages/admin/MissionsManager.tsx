import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import type { Mission } from '../../types';
import { Globe, Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '../../utils/cloudinary';
import { motion, AnimatePresence } from 'framer-motion';

export default function MissionsManager() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  
  const [formData, setFormData] = useState<Partial<Mission>>({
    title: '',
    description: '',
    location: '',
    goal_amount: 0,
    current_amount: 0,
    status: 'active',
    image_url: '',
    scope: 'local',
    country_code: 'EC',
    region: '',
    city: '',
    is_published: true,
    metadata: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadMissions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('missions')
        .select('*', { count: 'exact' });

      if (debouncedSearch) {
        query = query.ilike('title', `%${debouncedSearch}%`);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;
      setMissions(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar proyectos misioneros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMissions();
  }, [debouncedSearch, page]);

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
        image_url: '',
        scope: 'local',
        country_code: 'EC',
        region: '',
        city: '',
        is_published: true,
        metadata: {},
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

      const { id, ...missionFields } = formData;
      const payload = {
        ...missionFields,
        image_url: finalImageUrl
      };

      if (id) {
        const { error } = await supabase
          .from('missions')
          .update(payload)
          .eq('id', id);
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

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-white/5 pb-6"
      >
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <Globe className="w-8 h-8 text-rose-500" /> 
            Proyectos Misioneros
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Gestiona el impacto global y el fondo de misiones.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-rose-500/30 transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Nuevo Proyecto
        </button>
      </motion.div>

      {/* SEARCH AND FILTERS */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl p-4"
      >
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar proyectos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white transition-all outline-none"
          />
        </div>
      </motion.div>

      {/* DATA TABLE (GLASSMORPHISM) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Proyecto</th>
                <th className="px-6 py-4">Ubicación</th>
                <th className="px-6 py-4">Progreso (Recaudado)</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                // SKELETON LOADER
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 flex gap-3 items-center">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-slate-800 rounded-lg"></div>
                      <div className="w-32 h-4 bg-gray-200 dark:bg-slate-800 rounded"></div>
                    </td>
                    <td className="px-6 py-4"><div className="w-24 h-4 bg-gray-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-40 h-8 bg-gray-200 dark:bg-slate-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-20 h-6 bg-gray-200 dark:bg-slate-800 rounded-full"></div></td>
                    <td className="px-6 py-4 text-right"><div className="w-16 h-8 bg-gray-200 dark:bg-slate-800 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : missions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Target className="w-12 h-12 opacity-20" />
                      <p>No se encontraron proyectos misioneros.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {missions.map((mission, index) => {
                    const goal = Number(mission.goal_amount) || 0;
                    const current = Number(mission.current_amount) || 0;
                    const percent = goal > 0 ? Math.min(Math.round((current / goal) * 100), 100) : 0;
                    
                    return (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ delay: index * 0.05 }}
                        key={mission.id} 
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                      >
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 flex-shrink-0 shadow-inner">
                            {mission.image_url ? (
                              <img src={mission.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                            ) : (
                              <Globe className="w-5 h-5 text-gray-400 m-2.5" />
                            )}
                          </div>
                          {mission.title}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">{mission.location}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 w-48">
                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-gray-500">
                              <span className="text-rose-500 dark:text-rose-400">${current.toLocaleString()}</span>
                              {goal > 0 && <span>Meta: ${goal.toLocaleString()}</span>}
                            </div>
                            {goal > 0 && (
                              <div className="w-full h-2 bg-gray-100 dark:bg-slate-950 rounded-full overflow-hidden shadow-inner">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percent}%` }}
                                  transition={{ duration: 1, ease: 'easeOut' }}
                                  className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full" 
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            mission.status === 'active' ? 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50' :
                            mission.status === 'completed' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50' :
                            'bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700'
                          }`}>
                            {mission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(mission)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(mission.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/30 dark:bg-slate-900/30">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Mostrando {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} de {totalCount}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* MODAL CRUD */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-white/10 shadow-2xl z-10"
            >
              <div className="p-6 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 flex justify-between items-center">
                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <Globe className="text-rose-500 w-5 h-5" />
                  {formData.id ? 'Editar Proyecto' : 'Nuevo Proyecto Misionero'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Título del Proyecto</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white outline-none transition-all"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Descripción Corta</label>
                    <textarea
                      rows={3}
                      value={formData.description || ''}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Ubicación (País/Ciudad)</label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      placeholder="Ej. Bucay, Ecuador"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Estado</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as Mission['status']})}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white outline-none transition-all"
                    >
                      <option value="active">Activo</option>
                      <option value="completed">Completado</option>
                      <option value="paused">Pausado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Ámbito</label>
                    <select
                      value={formData.scope || 'local'}
                      onChange={e => setFormData({ ...formData, scope: e.target.value as NonNullable<Mission['scope']> })}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white outline-none"
                    >
                      <option value="local">Local</option>
                      <option value="national">Nacional</option>
                      <option value="international">Internacional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Código de país</label>
                    <input value={formData.country_code || ''} maxLength={2} onChange={e => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })} placeholder="EC" className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 dark:text-white outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Provincia / Región</label>
                    <input value={formData.region || ''} onChange={e => setFormData({ ...formData, region: e.target.value })} placeholder="Guayas" className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 dark:text-white outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Ciudad</label>
                    <input value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Milagro" className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 dark:text-white outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Latitud pública</label>
                    <input type="number" step="any" value={typeof formData.metadata?.latitude === 'number' ? formData.metadata.latitude : ''} onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, latitude: e.target.value === '' ? null : Number(e.target.value) } })} placeholder="-2.134" className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 dark:text-white outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Longitud pública</label>
                    <input type="number" step="any" value={typeof formData.metadata?.longitude === 'number' ? formData.metadata.longitude : ''} onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, longitude: e.target.value === '' ? null : Number(e.target.value) } })} placeholder="-79.594" className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 dark:text-white outline-none" />
                  </div>

                  <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm font-semibold text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-200">
                    <input type="checkbox" checked={formData.is_published ?? true} onChange={e => setFormData({ ...formData, is_published: e.target.checked })} className="h-4 w-4" />
                    Publicar este proyecto en el centro de misiones
                  </label>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Meta Económica ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.goal_amount || 0}
                      onChange={e => setFormData({...formData, goal_amount: parseFloat(e.target.value)})}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Recaudado Actualmente ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.current_amount || 0}
                      onChange={e => setFormData({...formData, current_amount: parseFloat(e.target.value)})}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:text-white outline-none transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Imagen Representativa</label>
                    {formData.image_url && (
                      <img src={formData.image_url} alt="Preview" className="h-32 rounded-xl object-cover mb-4 border border-gray-200 dark:border-white/10 shadow-sm" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 dark:file:bg-rose-900/30 dark:file:text-rose-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar Proyecto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
