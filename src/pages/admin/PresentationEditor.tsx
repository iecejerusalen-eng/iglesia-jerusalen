import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Plus, Edit2, Trash2, Presentation, AlertCircle, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface PresentationSlide {
  id: string;
  order_index: number;
  title: string;
  subtitle: string | null;
  content: string | null;
  department: string | null;
  icon: string | null;
  image_url: string | null;
  theme_color: string;
  animation_type: string;
  layout: string;
  features: string[];
  is_active: boolean;
}

export const PresentationEditor = () => {
  const [slides, setSlides] = useState<PresentationSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<PresentationSlide | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<PresentationSlide>>({
    title: '',
    subtitle: '',
    content: '',
    department: 'General',
    icon: 'Presentation',
    layout: 'standard',
    theme_color: 'indigo',
    animation_type: 'fade',
    features: [],
    is_active: true,
    order_index: 0
  });

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('presentation_slides')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
           setError('La tabla presentation_slides no existe. Por favor ejecuta el archivo SQL de migración en Supabase.');
           setLoading(false);
           return;
        }
        throw error;
      }
      setSlides(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching slides:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (slide?: PresentationSlide) => {
    if (slide) {
      setEditingSlide(slide);
      setFormData(slide);
    } else {
      setEditingSlide(null);
      setFormData({
        title: '',
        subtitle: '',
        content: '',
        department: 'General',
        icon: 'Presentation',
        layout: 'standard',
        theme_color: 'indigo',
        animation_type: 'fade',
        features: [],
        is_active: true,
        order_index: slides.length + 1
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSlide(null);
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error('El título es requerido');
      return;
    }

    try {
      if (editingSlide) {
        // Update
        const { error } = await supabase
          .from('presentation_slides')
          .update(formData)
          .eq('id', editingSlide.id);
        
        if (error) throw error;
        toast.success('Diapositiva actualizada');
      } else {
        // Create
        const { error } = await supabase
          .from('presentation_slides')
          .insert([formData]);
        
        if (error) throw error;
        toast.success('Diapositiva creada');
      }
      
      handleCloseModal();
      fetchSlides();
    } catch (err: any) {
      console.error('Error saving slide:', err);
      toast.error('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta diapositiva?')) return;

    try {
      const { error } = await supabase
        .from('presentation_slides')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Diapositiva eliminada');
      fetchSlides();
    } catch (err: any) {
      console.error('Error deleting slide:', err);
      toast.error('Error al eliminar: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Presentation className="h-6 w-6 text-indigo-600" />
          Editor de Presentación (Pitch Deck)
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva Diapositiva
        </button>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-700">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {!error && slides.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <Presentation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay diapositivas</h3>
          <p className="text-gray-500">Crea la primera diapositiva para tu presentación institucional.</p>
        </div>
      )}

      <div className="grid gap-4">
        {slides.map((slide) => (
          <div key={slide.id} className={`bg-white dark:bg-gray-800 p-4 rounded-xl border flex justify-between items-center ${slide.is_active ? 'border-gray-200 dark:border-gray-700' : 'border-dashed border-gray-300 opacity-60'}`}>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{slide.title}</h3>
                {!slide.is_active && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Inactiva</span>}
              </div>
              <p className="text-sm text-gray-500">{slide.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full dark:bg-gray-700 dark:text-gray-300">
                Orden: {slide.order_index}
              </span>
              <button 
                onClick={() => handleOpenModal(slide)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg dark:hover:bg-indigo-900/50"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button 
                onClick={() => handleDelete(slide.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingSlide ? 'Editar Diapositiva' : 'Nueva Diapositiva'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subtítulo</label>
                  <input
                    type="text"
                    value={formData.subtitle || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Departamento</label>
                  <input
                    type="text"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ícono (Lucide)</label>
                  <input
                    type="text"
                    value={formData.icon || ''}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Orden</label>
                  <input
                    type="number"
                    value={formData.order_index || 0}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Layout</label>
                  <select
                    value={formData.layout || 'standard'}
                    onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="standard">Estándar</option>
                    <option value="split">Dividido (Split)</option>
                    <option value="centered">Centrado</option>
                    <option value="full-image">Imagen Completa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenido / Descripción</label>
                <textarea
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Características (Features) - Separadas por comas
                </label>
                <input
                  type="text"
                  value={formData.features?.join(', ') || ''}
                  onChange={(e) => {
                    const vals = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                    setFormData({ ...formData, features: vals });
                  }}
                  placeholder="Ej: Directrices, Normas, Valores"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                  Diapositiva Activa (Visible)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-gray-50 dark:bg-gray-800/80 backdrop-blur-sm">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

