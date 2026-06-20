import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Plus, BookOpen, LayoutDashboard, Edit, Trash2, X, Save } from 'lucide-react';
import type { OpenResource } from '../../types';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import MediaUploader from '../../components/common/MediaUploader';

const OpenResourcesManager = () => {
  const [resources, setResources] = useState<OpenResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Partial<OpenResource> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('open_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (err) {
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (resource?: OpenResource) => {
    if (resource) {
      setEditingResource(resource);
    } else {
      setEditingResource({
        title: '',
        description: '',
        is_published: false,
        cover_image_url: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingResource(null);
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource?.title) return;
    
    setSaving(true);
    try {
      if (editingResource.id) {
        // Update
        const { error } = await supabase
          .from('open_resources')
          .update({
            title: editingResource.title,
            description: editingResource.description,
            is_published: editingResource.is_published,
            cover_image_url: editingResource.cover_image_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingResource.id);
        
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('open_resources')
          .insert([{
            title: editingResource.title,
            description: editingResource.description,
            is_published: editingResource.is_published,
            cover_image_url: editingResource.cover_image_url
          }]);
          
        if (error) throw error;
      }
      
      await fetchResources();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving resource:', err);
      alert('Error al guardar el recurso.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este recurso? Se eliminarán todas sus secciones y actividades.')) return;
    
    try {
      const { error } = await supabase
        .from('open_resources')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      setResources(resources.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error deleting resource:', err);
      alert('Error al eliminar el recurso.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-3">
            <BookOpen className="text-gold" size={32} />
            Recursos Abiertos
          </h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1">
            Administra los programas y recursos de estudio gratuitos para todo público.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Nuevo Recurso
        </button>
      </div>

      {/* Stats/Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg text-blue-600 dark:text-blue-400">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Recursos</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{resources.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg text-green-600 dark:text-green-400">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Recursos Publicados</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {resources.filter(r => r.is_published).length}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10">
          <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hay recursos creados</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Comienza creando el primer programa o recurso de estudio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <AnimeFadeUp key={resource.id} delay={index * 0.1}>
              <div 
                className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.location.href = `/admin/recursos-abiertos/builder/${resource.id}`}
              >
                <div className="h-40 bg-gray-200 dark:bg-slate-800 relative">
                  {resource.cover_image_url ? (
                    <img src={resource.cover_image_url} alt={resource.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="text-gray-400" size={40} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${resource.is_published ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                      {resource.is_published ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-gold transition-colors">{resource.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 flex-1">
                    {resource.description || 'Sin descripción'}
                  </p>
                  
                  <div className="flex items-center justify-end mt-auto pt-4 border-t border-gray-100 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenModal(resource)}
                        className="p-2 text-gray-500 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                        title="Editar Datos"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteResource(resource.id)}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Eliminar Recurso"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </AnimeFadeUp>
          ))}
        </div>
      )}

      {/* Modal Crear/Editar Recurso */}
      {isModalOpen && editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                {editingResource.id ? 'Editar Recurso' : 'Nuevo Recurso'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveResource} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título del Recurso *</label>
                  <input
                    type="text"
                    required
                    value={editingResource.title || ''}
                    onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none"
                    placeholder="Ej. Estudio en Romanos"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                  <textarea
                    rows={3}
                    value={editingResource.description || ''}
                    onChange={(e) => setEditingResource({ ...editingResource, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none"
                    placeholder="Describe brevemente el contenido..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Imagen de Portada
                  </label>
                  <div className="p-4 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl">
                    <MediaUploader
                      onUploadSuccess={(url) => setEditingResource({ ...editingResource, cover_image_url: url })}
                      folder="open_resources"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center gap-3 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={editingResource.is_published || false}
                      onChange={(e) => setEditingResource({ ...editingResource, is_published: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold/30 dark:peer-focus:ring-gold/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                  </label>
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white block">Recurso Publicado</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Si está desactivado, no aparecerá en la sección de Programas.</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-gold hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save size={20} />
                      Guardar Recurso
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenResourcesManager;
