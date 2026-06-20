import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp } from '../../utils/animations';
import AdminHeader from '../../components/admin/AdminHeader';
import BlockEditor from '../../components/admin/BlockEditor';
import { Plus, Edit2, Trash2, X, Loader2, Video, FileText, Search } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import MediaSearchModal from '../../components/admin/MediaSearchModal';

// Zod Validation Schema
const sermonSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  pastor_name: z.string().min(1, 'El nombre del predicador es obligatorio'),
  date: z.string().min(1, 'La fecha de la prédica es obligatoria'),
  youtube_url: z.string().url('Ingresa una URL de YouTube válida').or(z.literal('')),
  content: z.string().min(1, 'El contenido del mensaje es obligatorio'),
});

type SermonForm = z.infer<typeof sermonSchema>;

interface DbSermon {
  id: string;
  title: string;
  pastor_name: string;
  youtube_url: string | null;
  description: string | null;
  content: string;
  date: string;
  created_at: string;
}

// Helper to extract YouTube video ID
const getYoutubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const SermonsManager = () => {
  const { isReadOnly } = usePermissions();
  const readOnly = isReadOnly('sermons');
  const confirm = useConfirmStore((state) => state.confirm);
  const [sermons, setSermons] = useState<DbSermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSermon, setEditingSermon] = useState<DbSermon | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm<SermonForm>({
    resolver: zodResolver(sermonSchema),
    defaultValues: {
      title: '',
      pastor_name: 'Pastor Roberto Gómez',
      date: new Date().toISOString().split('T')[0],
      youtube_url: '',
      content: '',
    }
  });

  // Watch URL to trigger real-time preview
  const watchedYoutubeUrl = watch('youtube_url');
  const youtubeId = getYoutubeId(watchedYoutubeUrl);

  useEffect(() => {
    fetchSermons();
  }, []);

  const fetchSermons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sermons')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setSermons(data || []);
    } catch (err: any) {
      console.error('Error fetching sermons:', err);
      toast.error('Error al cargar sermones: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingSermon(null);
    reset({
      title: '',
      pastor_name: 'Pastor Roberto Gómez',
      date: new Date().toISOString().split('T')[0],
      youtube_url: '',
      content: '',
    });
    setShowForm(true);
  };

  const handleOpenEdit = (sermon: DbSermon) => {
    setEditingSermon(sermon);
    reset({
      title: sermon.title,
      pastor_name: sermon.pastor_name,
      date: sermon.date || new Date().toISOString().split('T')[0],
      youtube_url: sermon.youtube_url || '',
      content: sermon.content || '',
    });
    setShowForm(true);
  };

  const onSubmit = async (data: SermonForm) => {
    setActionLoading(true);
    try {
      // Strip HTML tags for the text-only description column
      let plainTextDescription = '';
      if (data.content) {
        if (data.content.trim().startsWith('[')) {
          try {
            const parsedBlocks = JSON.parse(data.content);
            if (Array.isArray(parsedBlocks)) {
              plainTextDescription = parsedBlocks
                .map((b: any) => {
                  if (b.type === 'text' && b.text) return b.text.replace(/<[^>]*>/g, '');
                  if (b.type === 'section' && b.title) return b.title;
                  if (['question', 'multiple_choice', 'true_false'].includes(b.type) && b.question_text) return b.question_text;
                  return '';
                })
                .filter(Boolean)
                .join(' ')
                .substring(0, 200);
            }
          } catch (e) {
            plainTextDescription = data.content.replace(/<[^>]*>/g, '').substring(0, 200);
          }
        } else {
          plainTextDescription = data.content.replace(/<[^>]*>/g, '').substring(0, 200);
        }
      }

      const payload = {
        title: data.title,
        pastor_name: data.pastor_name,
        date: data.date,
        youtube_url: data.youtube_url || null,
        content: data.content,
        description: plainTextDescription,
      };

      if (editingSermon) {
        const { error } = await supabase
          .from('sermons')
          .update(payload)
          .eq('id', editingSermon.id);

        if (error) throw error;
        toast.success('Sermón actualizado con éxito.');
      } else {
        const { error } = await supabase
          .from('sermons')
          .insert(payload);

        if (error) throw error;
        toast.success('Sermón publicado con éxito.');
      }

      setShowForm(false);
      fetchSermons();
    } catch (err: any) {
      console.error('Error saving sermon:', err);
      toast.error('Error al guardar el sermón: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar sermón',
      message: '¿Estás seguro de eliminar este sermón?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('sermons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Sermón eliminado correctamente.');
      fetchSermons();
    } catch (err: any) {
      console.error('Error deleting sermon:', err);
      toast.error('Error al eliminar: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={fadeInUp}
      className="space-y-6 max-w-5xl"
    >
      <AdminHeader 
        title="Gestor de Sermones" 
        description="Publica prédicas dominicales, reflexiones pastorales y estudios de la palabra con previsualización de YouTube."
        action={
          !showForm && !readOnly && (
            <button
              onClick={handleOpenCreate}
              className="bg-primary hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus size={16} />
              Publicar Sermón
            </button>
          )
        }
      />

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-150 dark:border-white/10 p-6 md:p-8"
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-xl font-serif font-bold text-gray-800 dark:text-gray-100">
                {editingSermon ? 'Editar Sermón' : 'Publicar Nuevo Sermón'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Título del Sermón</label>
                  <input
                    type="text"
                    {...register('title')}
                    disabled={readOnly}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Ej. El poder de la fe en tiempos difíciles"
                  />
                  {errors.title && <p className="text-accent-red text-xs mt-1">{errors.title.message}</p>}
                </div>

                {/* Preacher */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Predicador / Pastor</label>
                  <input
                    type="text"
                    {...register('pastor_name')}
                    disabled={readOnly}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Ej. Pastor Roberto Gómez"
                  />
                  {errors.pastor_name && <p className="text-accent-red text-xs mt-1">{errors.pastor_name.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Fecha de la Prédica</label>
                  <input
                    type="date"
                    {...register('date')}
                    disabled={readOnly}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  {errors.date && <p className="text-accent-red text-xs mt-1">{errors.date.message}</p>}
                </div>

                {/* YouTube Link */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider">Video de YouTube (Enlace Opcional)</label>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => setIsMediaModalOpen(true)}
                        className="text-[10px] text-primary hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Search size={12} />
                        Asistente de Video
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    {...register('youtube_url')}
                    disabled={readOnly}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  {errors.youtube_url && <p className="text-accent-red text-xs mt-1">{errors.youtube_url.message}</p>}
                </div>
              </div>

              {/* YouTube Iframe Live Preview */}
              {youtubeId && (
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider">Previsualización del Video</span>
                  <div className="aspect-video w-full max-w-md bg-black rounded-xl overflow-hidden shadow-xs border border-gray-150 dark:border-white/10">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title="YouTube video player"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Rich Text Editor for Content */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1.5">Contenido / Resumen del Mensaje</label>
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <BlockEditor
                      content={field.value}
                      onChange={field.onChange}
                      disabled={readOnly}
                    />
                  )}
                />
                {errors.content && <p className="text-accent-red text-xs mt-1">{errors.content.message}</p>}
              </div>

              {/* Footer controls */}
              <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2 border border-gray-250 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {readOnly ? 'Cerrar' : 'Cancelar'}
                </button>
                {!readOnly && (
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-primary hover:bg-blue-900 disabled:bg-gray-200 text-white px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" size={16} /> : null}
                    {editingSermon ? 'Actualizar Sermón' : 'Publicar Sermón'}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        ) : (
          /* List View */
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="flex justify-center items-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : sermons.length > 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-450 text-xs font-semibold uppercase tracking-wider border-b border-gray-150 dark:border-white/10">
                        <th className="py-4 px-6">Sermón</th>
                        <th className="py-4 px-6">Pastor / Predicador</th>
                        <th className="py-4 px-6">Fecha de Prédica</th>
                        <th className="py-4 px-6 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm text-gray-750">
                      {sermons.map((sermon) => (
                        <tr key={sermon.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              {sermon.youtube_url ? (
                                <div className="w-10 h-10 bg-red-50 text-accent-red rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Video size={18} />
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-blue-50 text-primary rounded-lg flex items-center justify-center flex-shrink-0">
                                  <FileText size={18} />
                                </div>
                              )}
                              <span className="font-bold text-gray-800 dark:text-gray-100 truncate max-w-xs md:max-w-sm" title={sermon.title}>
                                {sermon.title}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-600 dark:text-gray-400 font-medium">
                            {sermon.pastor_name}
                          </td>
                          <td className="py-4 px-6 text-gray-400 text-xs font-medium">
                            {sermon.date ? new Date(sermon.date).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            }) : 'Sin fecha'}
                          </td>
                          <td className="py-4 px-6 text-right space-x-1.5">
                            {!readOnly ? (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(sermon)}
                                  className="text-gray-400 hover:text-primary p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(sermon.id)}
                                  disabled={actionLoading}
                                  className="text-gray-400 hover:text-accent-red p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleOpenEdit(sermon)}
                                className="text-primary hover:underline font-semibold text-xs cursor-pointer"
                                title="Ver detalles"
                              >
                                Ver Detalles
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 shadow-xs">
                <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-serif font-bold text-gray-700 dark:text-gray-300">No hay sermones publicados</h3>
                <p className="text-gray-400 text-sm mt-1 font-medium">Comparte las enseñanzas semanales publicando tu primer sermón.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Media Search Modal */}
      <MediaSearchModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(_, options) => {
          if (options?.videoUrl) {
            setValue('youtube_url', options.videoUrl);
          }
        }}
        allowedTypes={['video']}
        title="Asistente de Enlace de Video"
      />
    </motion.div>
  );
};

export default SermonsManager;
