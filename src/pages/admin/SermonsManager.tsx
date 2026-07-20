import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import { useAuthStore } from '../../store/useAuthStore';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import AdminHeader from '../../components/admin/AdminHeader';
import BlockEditor from '../../components/admin/BlockEditor';
import { Plus, Edit2, Trash2, X, Loader2, Video, FileText, Search, Grid, List, Folder, Calendar as CalendarIcon, Settings } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import MediaSearchModal from '../../components/admin/MediaSearchModal';
import type { Sermon, SermonCategory } from '../../types';

// Zod Validation Schema for Sermon
const sermonSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  pastor_name: z.string().min(1, 'El nombre del predicador es obligatorio'),
  date: z.string().min(1, 'La fecha de la prédica es obligatoria'),
  youtube_url: z.string().url('Ingresa una URL de YouTube válida').or(z.literal('')),
  content: z.string().min(1, 'El contenido del mensaje es obligatorio'),
  category_id: z.string().optional().nullable(),
});

type SermonForm = z.infer<typeof sermonSchema>;

// Zod Validation Schema for Category
const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  color: z.string().min(1, 'El color es obligatorio'),
});

type CategoryForm = z.infer<typeof categorySchema>;

// Helper to extract YouTube video ID
const getYoutubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Calendar helper for simple month view
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const SermonsManager = () => {
  const { isReadOnly } = usePermissions();
  const readOnly = isReadOnly('sermons');
  const { firstName, lastName } = useAuthStore();
  const currentEditorName = [firstName, lastName].filter(Boolean).join(' ') || 'Editor Desconocido';
  
  const confirm = useConfirmStore((state) => state.confirm);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [categories, setCategories] = useState<SermonCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null);
  const [editingCategory, setEditingCategory] = useState<SermonCategory | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  
  // Views: table, cards, categories, calendar
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'categories' | 'calendar'>('table');
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm<SermonForm>({
    resolver: zodResolver(sermonSchema),
    defaultValues: {
      title: '',
      pastor_name: 'Pastor Roberto Gómez',
      date: new Date().toISOString().split('T')[0],
      youtube_url: '',
      content: '',
      category_id: '',
    }
  });

  const { register: registerCat, handleSubmit: handleSubmitCat, reset: resetCat, formState: { errors: catErrors } } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '', color: '#4F46E5' }
  });

  const watchedYoutubeUrl = watch('youtube_url');
  const youtubeId = getYoutubeId(watchedYoutubeUrl);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sermonsRes, catsRes] = await Promise.all([
        supabase
          .from('sermons')
          .select('*, sermon_categories(*)')
          .order('date', { ascending: false }),
        supabase
          .from('sermon_categories')
          .select('*')
          .order('name')
      ]);

      if (sermonsRes.error) throw sermonsRes.error;
      if (catsRes.error) throw catsRes.error;
      
      setSermons(sermonsRes.data as Sermon[]);
      setCategories(catsRes.data as SermonCategory[]);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      toast.error('Error al cargar datos: ' + err.message);
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
      category_id: '',
    });
    setShowForm(true);
  };

  const handleOpenEdit = (sermon: Sermon) => {
    setEditingSermon(sermon);
    reset({
      title: sermon.title,
      pastor_name: sermon.pastor_name,
      date: sermon.date || new Date().toISOString().split('T')[0],
      youtube_url: sermon.youtube_url || '',
      content: sermon.content || '',
      category_id: sermon.category_id || '',
    });
    setShowForm(true);
  };

  const onSubmit = async (data: SermonForm) => {
    setActionLoading(true);
    try {
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

      const payload: any = {
        title: data.title,
        pastor_name: data.pastor_name,
        date: data.date,
        youtube_url: data.youtube_url || null,
        content: data.content,
        description: plainTextDescription,
        category_id: data.category_id || null,
      };

      if (editingSermon) {
        payload.editors = Array.from(new Set([...(editingSermon.editors || []), currentEditorName]));
        const { error } = await supabase.from('sermons').update(payload).eq('id', editingSermon.id);
        if (error) throw error;
        toast.success('Prédica actualizada con éxito.');
      } else {
        payload.editors = [currentEditorName];
        const { error } = await supabase.from('sermons').insert(payload);
        if (error) throw error;
        toast.success('Prédica publicada con éxito.');
      }

      setShowForm(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving sermon:', err);
      toast.error('Error al guardar la prédica: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar prédica',
      message: '¿Estás seguro de eliminar esta prédica?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const { error } = await supabase.from('sermons').delete().eq('id', id);
      if (error) throw error;
      toast.success('Prédica eliminada correctamente.');
      fetchData();
    } catch (err: any) {
      console.error('Error deleting sermon:', err);
      toast.error('Error al eliminar: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Category Management
  const handleSaveCategory = async (data: CategoryForm) => {
    setActionLoading(true);
    try {
      if (editingCategory) {
        const { error } = await supabase.from('sermon_categories').update(data).eq('id', editingCategory.id);
        if (error) throw error;
        toast.success('Categoría actualizada');
      } else {
        const { error } = await supabase.from('sermon_categories').insert(data);
        if (error) throw error;
        toast.success('Categoría creada');
      }
      resetCat();
      setEditingCategory(null);
      fetchData(); // Reload both
    } catch (err: any) {
      toast.error('Error al guardar categoría: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar categoría',
      message: '¿Estás seguro de eliminar esta categoría? Las prédicas en esta categoría quedarán sin categoría.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const { error } = await supabase.from('sermon_categories').delete().eq('id', id);
      if (error) throw error;
      toast.success('Categoría eliminada');
      fetchData();
    } catch (err: any) {
      toast.error('Error al eliminar categoría: ' + err.message);
    }
  };

  // Sub-components for views
  const renderTable = () => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-450 text-xs font-semibold uppercase tracking-wider border-b border-gray-150 dark:border-white/10">
              <th className="py-4 px-6">Prédica</th>
              <th className="py-4 px-6">Categoría</th>
              <th className="py-4 px-6">Pastor / Predicador</th>
              <th className="py-4 px-6">Editores</th>
              <th className="py-4 px-6">Fecha</th>
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
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/20 text-primary dark:text-church-gold-bright rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText size={18} />
                      </div>
                    )}
                    <span className="font-bold text-gray-800 dark:text-gray-100 truncate max-w-xs md:max-w-sm" title={sermon.title}>
                      {sermon.title}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  {sermon.sermon_categories ? (
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${sermon.sermon_categories.color}20`, color: sermon.sermon_categories.color }}
                    >
                      {sermon.sermon_categories.name}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Sin categoría</span>
                  )}
                </td>
                <td className="py-4 px-6 text-gray-600 dark:text-gray-400 font-medium">
                  {sermon.pastor_name}
                </td>
                <td className="py-4 px-6 text-gray-500 dark:text-gray-450 text-xs">
                  {sermon.editors && sermon.editors.length > 0 ? sermon.editors.join(', ') : '—'}
                </td>
                <td className="py-4 px-6 text-gray-400 text-xs font-medium">
                  {sermon.date ? new Date(sermon.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha'}
                </td>
                <td className="py-4 px-6 text-right space-x-1.5">
                  {!readOnly ? (
                    <>
                      <button onClick={() => handleOpenEdit(sermon)} className="text-gray-400 hover:text-primary p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" title="Editar"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(sermon.id)} disabled={actionLoading} className="text-gray-400 hover:text-accent-red p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer" title="Eliminar"><Trash2 size={16} /></button>
                    </>
                  ) : (
                    <button onClick={() => handleOpenEdit(sermon)} className="text-primary hover:underline font-semibold text-xs cursor-pointer">Ver Detalles</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sermons.map(sermon => (
        <div key={sermon.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs overflow-hidden flex flex-col transition-transform hover:-translate-y-1">
          {sermon.youtube_url ? (
            <div className="aspect-video bg-gray-100 relative">
              <img src={`https://img.youtube.com/vi/${getYoutubeId(sermon.youtube_url)}/maxresdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <Video className="text-white drop-shadow-md" size={32} />
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-blue-50 flex items-center justify-center">
              <FileText className="text-primary" size={40} />
            </div>
          )}
          <div className="p-5 flex-1 flex flex-col">
            {sermon.sermon_categories && (
              <span className="self-start px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3" style={{ backgroundColor: `${sermon.sermon_categories.color}15`, color: sermon.sermon_categories.color }}>
                {sermon.sermon_categories.name}
              </span>
            )}
            <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-gray-100 mb-1 leading-tight line-clamp-2">{sermon.title}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">{sermon.description || 'Sin resumen disponible.'}</p>
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{sermon.pastor_name}</p>
                {sermon.editors && sermon.editors.length > 0 && (
                  <p className="text-[10px] text-gray-500 italic mt-0.5">Por: {sermon.editors.join(', ')}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-1">{sermon.date}</p>
              </div>
              <div className="flex gap-1">
                {!readOnly && (
                  <>
                    <button onClick={() => handleOpenEdit(sermon)} className="p-1.5 text-gray-400 hover:text-primary"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(sermon.id)} className="p-1.5 text-gray-400 hover:text-accent-red"><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCategories = () => {
    // Group sermons by category
    const grouped: Record<string, Sermon[]> = {};
    sermons.forEach(s => {
      const catName = s.sermon_categories?.name || 'Sin Categoría';
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(s);
    });

    return (
      <div className="space-y-8">
        {Object.keys(grouped).map(catName => (
          <div key={catName}>
            <div className="flex items-center gap-2 mb-4">
              <Folder size={20} className="text-gray-400" />
              <h3 className="text-xl font-serif font-bold text-gray-800 dark:text-gray-100">{catName} <span className="text-gray-400 text-sm font-sans font-normal ml-2">({grouped[catName].length})</span></h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {grouped[catName].map(sermon => (
                 <div key={sermon.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-white/10 shadow-sm flex gap-4">
                    <div className="w-16 h-16 shrink-0 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                      {sermon.youtube_url ? (
                        <img src={`https://img.youtube.com/vi/${getYoutubeId(sermon.youtube_url)}/default.jpg`} className="w-full h-full object-cover" />
                      ) : <FileText className="text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">{sermon.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{sermon.date}</p>
                      {sermon.editors && sermon.editors.length > 0 && (
                        <p className="text-[10px] text-gray-400 italic truncate mt-0.5">Por: {sermon.editors.join(', ')}</p>
                      )}
                      <button onClick={() => handleOpenEdit(sermon)} className="text-primary text-xs font-semibold mt-2 hover:underline">Ver / Editar</button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => i); // Adjust if week starts on Monday

    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-serif font-bold text-gray-800 dark:text-gray-100 capitalize">{monthName}</h3>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">Anterior</button>
            <button onClick={nextMonth} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">Siguiente</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="bg-gray-50 dark:bg-slate-800 py-2 text-center text-xs font-bold text-gray-500">{d}</div>
          ))}
          {blanks.map(b => <div key={`blank-${b}`} className="bg-white dark:bg-slate-900 min-h-[100px]" />)}
          {days.map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const daySermons = sermons.filter(s => s.date === dateStr);
            return (
              <div key={day} className="bg-white dark:bg-slate-900 min-h-[100px] p-2 flex flex-col gap-1 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-400">{day}</span>
                {daySermons.map(s => (
                  <div key={s.id} onClick={() => handleOpenEdit(s)} className="p-1 rounded bg-blue-50 dark:bg-blue-900/20 text-[10px] text-blue-700 dark:text-blue-300 font-medium truncate cursor-pointer hover:bg-blue-100">
                    • {s.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AnimeFadeUp className="space-y-6 max-w-6xl">
      <AdminHeader 
        title="Gestor de Prédicas" 
        description="Publica prédicas dominicales, reflexiones pastorales y estudios de la palabra, organízalas por categorías."
        action={
          !showForm && !readOnly && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Settings size={16} />
                Categorías
              </button>
              <button
                onClick={handleOpenCreate}
                className="bg-primary hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus size={16} />
                Publicar Prédica
              </button>
            </div>
          )
        }
      />

      <div className="relative">
        {showForm ? (
          <AnimeFadeUp key="form">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-150 dark:border-white/10 p-6 md:p-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-xl font-serif font-bold text-gray-800 dark:text-gray-100">
                {editingSermon ? 'Editar Prédica' : 'Publicar Nueva Prédica'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 cursor-pointer"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Título de la Prédica</label>
                  <input type="text" {...register('title')} disabled={readOnly} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none" />
                  {errors.title && <p className="text-accent-red text-xs mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Categoría</label>
                  <select {...register('category_id')} disabled={readOnly} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none">
                    <option value="">Sin Categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Predicador / Pastor</label>
                  <input type="text" {...register('pastor_name')} disabled={readOnly} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fecha</label>
                  <input type="date" {...register('date')} disabled={readOnly} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 rounded-xl text-sm" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Video de YouTube</label>
                    {!readOnly && <button type="button" onClick={() => setIsMediaModalOpen(true)} className="text-[10px] text-primary hover:text-blue-900 font-bold flex items-center gap-1"><Search size={12} />Asistente</button>}
                  </div>
                  <input type="url" {...register('youtube_url')} disabled={readOnly} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 rounded-xl text-sm" placeholder="https://youtube.com/..." />
                </div>
              </div>

              {youtubeId && (
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Previsualización</span>
                  <div className="aspect-video w-full max-w-md bg-black rounded-xl overflow-hidden shadow-xs">
                    <iframe src={`https://www.youtube.com/embed/${youtubeId}`} title="YouTube video player" className="w-full h-full border-0" allowFullScreen />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Contenido / Resumen del Mensaje</label>
                <Controller name="content" control={control} render={({ field }) => (
                  <BlockEditor content={field.value} onChange={field.onChange} disabled={readOnly} />
                )} />
                {errors.content && <p className="text-accent-red text-xs mt-1">{errors.content.message}</p>}
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border border-gray-250 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
                {!readOnly && (
                  <button type="submit" disabled={actionLoading} className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                    {actionLoading && <Loader2 className="animate-spin" size={16} />}
                    {editingSermon ? 'Actualizar Prédica' : 'Publicar Prédica'}
                  </button>
                )}
              </div>
            </form>
            </div>
          </AnimeFadeUp>
        ) : (
          <AnimeFadeUp key="list">
            <div className="space-y-4">
              {/* View Toggles */}
              <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                <button onClick={() => setViewMode('table')} className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                  <List size={16} /> Tabla
                </button>
                <button onClick={() => setViewMode('cards')} className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'cards' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Grid size={16} /> Tarjetas
                </button>
                <button onClick={() => setViewMode('categories')} className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'categories' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Folder size={16} /> Categorías
                </button>
                <button onClick={() => setViewMode('calendar')} className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'calendar' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                  <CalendarIcon size={16} /> Calendario
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-20 bg-white rounded-2xl"><Loader2 className="animate-spin text-primary" size={32} /></div>
              ) : sermons.length > 0 ? (
                <>
                  {viewMode === 'table' && renderTable()}
                  {viewMode === 'cards' && renderCards()}
                  {viewMode === 'categories' && renderCategories()}
                  {viewMode === 'calendar' && renderCalendar()}
                </>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                  <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                  <h3 className="text-lg font-serif font-bold text-gray-700">No hay prédicas publicadas</h3>
                </div>
              )}
            </div>
          </AnimeFadeUp>
        )}
      </div>

      {/* Modal Categorías */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-serif font-bold text-lg">Administrar Categorías</h3>
                <button onClick={() => setShowCategoryModal(false)} className="text-gray-500 hover:bg-gray-200 p-1 rounded-lg"><X size={20}/></button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <h4 className="font-bold text-sm text-gray-700 mb-4">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h4>
                    <form onSubmit={handleSubmitCat(handleSaveCategory)} className="space-y-4">
                       <div>
                         <label className="block text-xs text-gray-500 mb-1">Nombre</label>
                         <input type="text" {...registerCat('name')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                       </div>
                       <div>
                         <label className="block text-xs text-gray-500 mb-1">Descripción</label>
                         <textarea {...registerCat('description')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} />
                       </div>
                       <div>
                         <label className="block text-xs text-gray-500 mb-1">Color (Hex)</label>
                         <div className="flex gap-2">
                           <input type="color" {...registerCat('color')} className="w-10 h-10 p-1 border border-gray-200 rounded-lg" />
                           <input type="text" {...registerCat('color')} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                         </div>
                       </div>
                       <div className="flex gap-2 pt-2">
                         {editingCategory && <button type="button" onClick={() => { setEditingCategory(null); resetCat(); }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancelar</button>}
                         <button type="submit" disabled={actionLoading} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold">Guardar</button>
                       </div>
                    </form>
                 </div>
                 <div>
                    <h4 className="font-bold text-sm text-gray-700 mb-4">Categorías Existentes ({categories.length})</h4>
                    <div className="space-y-2">
                       {categories.map(c => (
                         <div key={c.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                               <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }}></div>
                               <span className="font-medium text-sm text-gray-800">{c.name}</span>
                            </div>
                            <div className="flex gap-1">
                               <button onClick={() => { setEditingCategory(c); resetCat({ name: c.name, description: c.description || '', color: c.color }); }} className="p-1.5 text-gray-400 hover:text-primary"><Edit2 size={14}/></button>
                               <button onClick={() => handleDeleteCategory(c.id)} className="p-1.5 text-gray-400 hover:text-accent-red"><Trash2 size={14}/></button>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
      
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
    </AnimeFadeUp>
  );
};

export default SermonsManager;
