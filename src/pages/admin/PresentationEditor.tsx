import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Plus, Edit2, Trash2, Presentation, AlertCircle, Save, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { uploadFileToCloudinary } from '../../lib/cloudinaryService';

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
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<PresentationSlide>>({
    title: '',
    subtitle: '',
    content: '',
    department: 'General',
    icon: 'Presentation',
    image_url: '',
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
        image_url: '',
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      setUploadingImage(true);
      const publicUrl = await uploadFileToCloudinary(file, 'presentation_slides', 'image');
      setFormData({ ...formData, image_url: publicUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error subiendo imagen.');
    } finally {
      setUploadingImage(false);
    }
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
      {/* HEADER PREMIUM */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-2xl p-8 text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center">
          <Presentation size={200} className="text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="bg-indigo-500/30 text-indigo-100 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              Gestor Visual
            </span>
            <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-2 flex items-center gap-3">
              Editor de Presentación (Pitch Deck)
            </h1>
            <p className="text-indigo-100 text-sm max-w-xl">
              Configura las diapositivas de la ruta pública `/presentacion`. Modifica imágenes, textos, layouts y características para brindar la mejor primera impresión de la iglesia.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            <Plus className="h-5 w-5" />
            Nueva Diapositiva
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700 shadow-sm">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {!error && slides.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-dashed border-gray-300 dark:border-gray-700 shadow-sm">
          <Presentation className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No hay diapositivas</h3>
          <p className="text-gray-500">Crea la primera diapositiva para tu presentación institucional.</p>
        </div>
      )}

      {/* GRID DE DIAPOSITIVAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {slides.map((slide) => (
          <div key={slide.id} className={`bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl flex flex-col ${slide.is_active ? 'border-gray-200 dark:border-gray-700 shadow-md' : 'border-dashed border-gray-300 opacity-70'}`}>
            <div className="h-40 w-full relative bg-gray-100 dark:bg-slate-800 shrink-0">
              {slide.image_url ? (
                <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-gray-400">
                  <ImageIcon size={48} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent"></div>
              
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/80 backdrop-blur-sm uppercase">
                    Orden: {slide.order_index}
                  </span>
                  {!slide.is_active && (
                    <span className="text-[10px] font-bold bg-red-500/80 backdrop-blur-sm px-2 py-0.5 rounded uppercase">Inactiva</span>
                  )}
                </div>
                <h3 className="font-bold text-lg leading-tight line-clamp-1">{slide.title}</h3>
              </div>
            </div>
            
            <div className="p-5 flex flex-col flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
                {slide.subtitle || slide.content || "Sin descripción..."}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="text-xs text-gray-500 font-medium">
                  {slide.layout} layout
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenModal(slide)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(slide.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-100 dark:border-gray-800">
            
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 rounded-t-3xl">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Presentation className="h-5 w-5 text-indigo-500" />
                {editingSlide ? 'Editar Diapositiva' : 'Nueva Diapositiva'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 bg-white dark:bg-slate-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full shadow-sm hover:shadow transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* IMAGEN - NUEVO CAMPO AÑADIDO Y MEJORADO */}
              <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Imagen de Fondo (Cloudinary)
                </label>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {formData.image_url ? (
                    <div className="relative group rounded-xl overflow-hidden shadow-md">
                      <img src={formData.image_url} alt="Preview" className="h-32 w-56 object-cover" />
                      <button 
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        className="absolute inset-0 bg-red-500/80 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-6 w-6 mb-1" />
                        <span className="text-xs font-bold">Quitar</span>
                      </button>
                    </div>
                  ) : (
                    <div className="h-32 w-56 bg-gray-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <ImageIcon className="h-10 w-10 opacity-50" />
                    </div>
                  )}
                  
                  <div className="flex-1 w-full space-y-3">
                    <label className="cursor-pointer flex items-center justify-center gap-2 w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all font-semibold shadow-sm">
                      <ImageIcon className="h-5 w-5 text-indigo-500" />
                      {uploadingImage ? 'Subiendo imagen...' : 'Subir Imagen'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
                      <span className="text-xs text-gray-500 font-medium">O pega la URL</span>
                      <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
                    </div>
                    <input
                      type="text"
                      className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-white"
                      value={formData.image_url || ''}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>
                </div>
              </div>

              {/* CAMPOS TEXTUALES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Título</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-gray-700 dark:text-white shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Subtítulo</label>
                  <input
                    type="text"
                    value={formData.subtitle || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-gray-700 dark:text-white shadow-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Contenido / Descripción</label>
                  <textarea
                    value={formData.content || ''}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-gray-700 dark:text-white shadow-sm"
                  />
                </div>
              </div>

              {/* CONFIGURACIÓN VISUAL (NUEVOS CAMPOS AÑADIDOS) */}
              <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-4 text-sm">Configuración Visual y Avanzada</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-400 mb-1">Layout</label>
                    <select
                      value={formData.layout || 'standard'}
                      onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-gray-700 dark:text-white shadow-sm text-sm"
                    >
                      <option value="standard">Estándar</option>
                      <option value="split">Dividido (Split)</option>
                      <option value="centered">Centrado</option>
                      <option value="grid">Grid (Rejilla)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-400 mb-1">Animación</label>
                    <select
                      value={formData.animation_type || 'fade'}
                      onChange={(e) => setFormData({ ...formData, animation_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-gray-700 dark:text-white shadow-sm text-sm"
                    >
                      <option value="fade">Fade In (Suave)</option>
                      <option value="slide_up">Slide Up (Arriba)</option>
                      <option value="zoom">Zoom</option>
                      <option value="spring">Spring (Rebote)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-400 mb-1">Color Tema</label>
                    <select
                      value={formData.theme_color || 'indigo'}
                      onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-gray-700 dark:text-white shadow-sm text-sm"
                    >
                      <option value="indigo">Indigo / Púrpura</option>
                      <option value="blue">Azul</option>
                      <option value="emerald">Esmeralda</option>
                      <option value="rose">Rosa</option>
                      <option value="amber">Ambar / Dorado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-400 mb-1">Ícono (Lucide)</label>
                    <input
                      type="text"
                      value={formData.icon || ''}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="Ej: Church, Globe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-gray-700 dark:text-white shadow-sm text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-400 mb-1">Departamento</label>
                    <input
                      type="text"
                      value={formData.department || ''}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-gray-700 dark:text-white shadow-sm text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-400 mb-1">Orden (Index)</label>
                    <input
                      type="number"
                      value={formData.order_index || 0}
                      onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-gray-700 dark:text-white shadow-sm text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Características (Features) - Separadas por comas
                </label>
                <input
                  type="text"
                  value={formData.features?.join(', ') || ''}
                  onChange={(e) => {
                    const vals = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                    setFormData({ ...formData, features: vals });
                  }}
                  placeholder="Ej: Modernidad, Escalabilidad, Comunidad"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-gray-700 dark:text-white shadow-sm"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-gray-900 dark:text-white cursor-pointer select-none">
                  Diapositiva Activa (Visible en la presentación pública)
                </label>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4 bg-gray-50/80 dark:bg-slate-800/80 rounded-b-3xl">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:bg-slate-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-slate-600 transition-colors shadow-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Save className="h-5 w-5" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
