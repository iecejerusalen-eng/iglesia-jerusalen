import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import BlockEditor from '../../components/admin/BlockEditor';
import type { LessonBlock } from '../../components/admin/BlockEditor';
import { Plus, Edit2, Trash2, X, Loader2, Users, Image as ImageIcon, Gift, Eye, Search, Settings } from 'lucide-react';
import MediaUploader from '../../components/common/MediaUploader';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuthStore } from '../../store/useAuthStore';
import MediaSearchModal from '../../components/admin/MediaSearchModal';
import { useConfirmStore } from '../../store/useConfirmStore';

// Esquema de Validación Zod
const ministrySchema = z.object({
  name: z.string().min(3, 'El nombre del ministerio debe tener al menos 3 caracteres'),
  slug: z.string().min(3, 'El slug debe tener al menos 3 caracteres').regex(/^[a-z0-9-]+$/, 'El slug solo debe contener minúsculas, números y guiones'),
  leader_name: z.string().min(3, 'El nombre del responsable/líder debe tener al menos 3 caracteres'),
  schedule: z.string().min(3, 'El horario de reunión debe tener al menos 3 caracteres'),
  category: z.enum(['departamento', 'servicio']),
  description: z.string().optional(),
  image_url: z.string().nullable().optional(),
  anniversary_date: z.string().nullable().optional(),
  theme_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Formato de color hexadecimal inválido').optional().or(z.literal('')),
});

type MinistryFormValues = z.infer<typeof ministrySchema>;

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
};

const compileBlocksToHtml = (blocks: LessonBlock[]): string => {
  if (!blocks || blocks.length === 0) return '';
  return blocks.map((block) => {
    switch (block.type) {
      case 'text':
        return block.text || '';
      case 'html':
        return block.html || '';
      case 'image':
        return `
          <div style="margin: 24px 0; text-align: center;">
            <div style="border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05); background-color: #F8FAFC;">
              <img src="${block.image_url || ''}" alt="${block.text || 'Imagen'}" style="width: 100%; object-fit: cover; max-height: 500px;" />
            </div>
            ${block.text ? `<p style="font-size: 12px; color: #94A3B8; font-style: italic; margin-top: 8px;">${block.text}</p>` : ''}
          </div>
        `;
      case 'section':
        return block.title ? `<h3 style="font-size: 20px; font-weight: bold; color: #1E3A8A; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">${block.title}</h3>` : '';
      case 'question':
        return block.question_text ? `<div style="margin: 24px 0; padding: 20px; background-color: #F0F4F8; border-radius: 16px; border: 1px solid #D9E2EC;"><p style="font-weight: bold; margin: 0;">${block.question_text}</p></div>` : '';
      case 'multiple_choice':
        return block.question_text ? `<div style="margin: 24px 0; padding: 20px; background-color: #F5F0F6; border-radius: 16px; border: 1px solid #E6D9EC;"><p style="font-weight: bold; margin-bottom: 12px;">${block.question_text}</p><ul style="list-style-type: none; padding-left: 0;">${(block.options || []).map((o: string) => `<li style="padding: 8px 12px; background: white; margin-bottom: 6px; border-radius: 8px; border: 1px solid #E2E8F0;">${o}</li>`).join('')}</ul></div>` : '';
      case 'true_false':
        return block.question_text ? `<div style="margin: 24px 0; padding: 20px; background-color: #FDF2F2; border-radius: 16px; border: 1px solid #FDE8E8;"><p style="font-weight: bold; margin-bottom: 12px;">${block.question_text}</p><div style="display: flex; gap: 12px;"><span style="padding: 6px 16px; border: 1px solid #E2E8F0; border-radius: 8px; font-weight: bold; background: white;">Verdadero</span><span style="padding: 6px 16px; border: 1px solid #E2E8F0; border-radius: 8px; font-weight: bold; background: white;">Falso</span></div></div>` : '';
      default:
        return '';
    }
  }).join('\n');
};

const MinistryManager = () => {
  const { role, ministryId } = useAuthStore();
  const { hasPermission, isReadOnly } = usePermissions();
  const confirm = useConfirmStore((state) => state.confirm);

  const isGlobalReadOnly = isReadOnly('ministries');
  const [isEditingReadOnly, setIsEditingReadOnly] = useState(false);

  const [ministries, setMinistries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<any | null>(null);
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<MinistryFormValues>({
    resolver: zodResolver(ministrySchema),
    defaultValues: {
      name: '',
      slug: '',
      leader_name: '',
      schedule: '',
      category: 'departamento',
      description: '',
      image_url: '',
      anniversary_date: '',
      theme_color: '#1E3A8A',
    }
  });

  const watchedName = watch('name');

  // Auto-generación de slug amigable desde el nombre
  useEffect(() => {
    if (!editingMinistry && watchedName) {
      const generatedSlug = watchedName
        .toLowerCase()
        .normalize('NFD') // Separar letras de tildes
        .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
        .replace(/[^a-z0-9\s-]/g, '') // Eliminar todo menos letras, números y espacios
        .trim()
        .replace(/\s+/g, '-'); // Reemplazar espacios por guión
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [watchedName, editingMinistry, setValue]);

  useEffect(() => {
    fetchMinistries();
  }, []);

  const fetchMinistries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ministries')
        .select('*')
        .order('name');
      if (error) throw error;
      setMinistries(data || []);
    } catch (err) {
      console.error('Error fetching ministries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditingReadOnly(false);
    setEditingMinistry(null);
    setBlocks([]);
    reset({
      name: '',
      slug: '',
      leader_name: '',
      schedule: '',
      category: 'departamento',
      description: '',
      image_url: '',
      anniversary_date: '',
      theme_color: '#1E3A8A',
    });
    setImagePreview(null);
    setShowForm(true);
  };

  const handleOpenEdit = (min: any) => {
    const canEditThis = role === 'admin' || (role === 'leader' && min.id === ministryId) || (role !== 'leader' && !isGlobalReadOnly && hasPermission('ministries', 'edit'));
    setIsEditingReadOnly(!canEditThis);
    setEditingMinistry(min);
    
    if (min.content_blocks && Array.isArray(min.content_blocks)) {
      const normalizedBlocks = min.content_blocks.map((b: any) => ({
        id: b.id,
        type: b.type === 'form' ? 'question' : b.type,
        text: b.text || b.textContent || '',
        image_url: b.image_url || b.imageUrl || '',
        html: b.html || b.htmlContent || '',
        title: b.title || '',
        question_text: b.question_text || (b.formQuestions && b.formQuestions[0]?.questionText) || '',
        options: b.options || (b.formQuestions && b.formQuestions[0]?.options) || undefined,
        correct_option_idx: b.correct_option_idx || 0,
        correct_boolean: b.correct_boolean ?? true
      }));
      setBlocks(normalizedBlocks);
    } else {
      setBlocks([
        {
          id: `text-${Date.now()}`,
          type: 'text',
          text: min.description || ''
        }
      ]);
    }
    reset({
      name: min.name,
      slug: min.slug,
      leader_name: min.leader_name || '',
      schedule: min.schedule || '',
      category: min.category,
      description: min.description || '',
      image_url: min.image_url || '',
      anniversary_date: min.anniversary_date || '',
      theme_color: min.theme_color || '#1E3A8A',
    });
    setImagePreview(min.image_url || null);
    setShowForm(true);
  };

  const onSubmitForm = async (values: MinistryFormValues) => {
    if (isEditingReadOnly) return;
    setActionLoading(true);
    try {
      const payload = {
        name: values.name,
        slug: values.slug,
        category: values.category,
        description: compileBlocksToHtml(blocks),
        content_blocks: blocks,
        leader_name: values.leader_name,
        schedule: values.schedule,
        image_url: values.image_url || null,
        anniversary_date: values.anniversary_date || null,
        theme_color: values.theme_color || '#1E3A8A',
      };

      if (editingMinistry) {
        const { error } = await supabase
          .from('ministries')
          .update(payload)
          .eq('id', editingMinistry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ministries')
          .insert(payload);
        if (error) throw error;
      }

      setShowForm(false);
      fetchMinistries();
    } catch (err: any) {
      console.error('Error saving ministry:', err);
      alert(err.message || 'Error al guardar el ministerio.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const canDeleteThis = role !== 'leader' && hasPermission('ministries', 'edit') && !isGlobalReadOnly;
    if (!canDeleteThis) return;
    const confirmed = await confirm({
      title: 'Eliminar ministerio',
      message: `¿Estás seguro de eliminar el ministerio "${name}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('ministries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchMinistries();
    } catch (err) {
      console.error('Error deleting ministry:', err);
      alert('Hubo un error al eliminar el ministerio.');
    } finally {
      setActionLoading(false);
    }
  };

  const canCreate = role !== 'leader' && !isGlobalReadOnly && hasPermission('ministries', 'edit');
  const canDeleteGlobal = role !== 'leader' && !isGlobalReadOnly && hasPermission('ministries', 'edit');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">Gestor de Ministerios</h1>
          <p className="text-gray-500 dark:text-gray-450 text-sm">Administra las actividades, departamentos y servicios dinámicos de la iglesia.</p>
        </div>
        {canCreate && (
          <button
            onClick={handleOpenCreate}
            className="bg-primary hover:bg-blue-900 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer border border-transparent"
          >
            <Plus size={16} />
            Nuevo Ministerio
          </button>
        )}
      </div>

      {/* Lista de Ministerios */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : ministries.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-450 text-xs font-semibold uppercase tracking-wider border-b border-gray-150 dark:border-white/10">
                  <th className="py-4 px-6">Detalle Ministerio</th>
                  <th className="py-4 px-6">Categoría</th>
                  <th className="py-4 px-6">Responsable</th>
                  <th className="py-4 px-6">Horarios</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm text-gray-700 dark:text-gray-300">
                {ministries.map((min) => {
                  const canEditThisRow = role === 'admin' || (role === 'leader' && min.id === ministryId) || (role !== 'leader' && !isGlobalReadOnly && hasPermission('ministries', 'edit'));
                  
                  return (
                    <tr key={min.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          {min.image_url ? (
                            <img
                              src={min.image_url}
                              alt={min.name}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-100 dark:border-white/5 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-55 rounded-lg flex items-center justify-center text-gray-300 flex-shrink-0">
                              <ImageIcon size={20} />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-gray-850 block">{min.name}</span>
                            <span className="text-xs text-gray-400 font-mono block">/{min.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          min.category === 'departamento' 
                            ? 'bg-gold/15 text-gold border border-gold/25' 
                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {min.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-650 dark:text-gray-400">
                        {min.leader_name || 'No asignado'}
                      </td>
                      <td className="py-4 px-6 text-gray-500 dark:text-gray-450 truncate max-w-[200px]" title={min.schedule}>
                        <span className="font-semibold block text-gray-700 dark:text-gray-300">{min.schedule || 'No especificado'}</span>
                        {min.anniversary_date && (
                          <span className="text-xs text-amber-600 flex items-center gap-1 mt-0.5" title="Fecha de Aniversario">
                            <Gift size={12} className="inline text-amber-500" />
                            <span>Aniv: {formatDate(min.anniversary_date)}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {canEditThisRow ? (
                          <button
                            onClick={() => handleOpenEdit(min)}
                            className="text-gray-400 hover:text-primary p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Editar Info General"
                          >
                            <Edit2 size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenEdit(min)}
                            className="text-gray-400 hover:text-primary p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Ver Detalles"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <Link
                          to={`/admin/ministerios/${min.id}`}
                          className="text-gray-400 hover:text-primary p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer inline-flex"
                          title="Panel del Ministerio"
                        >
                          <Settings size={16} />
                        </Link>
                        {canDeleteGlobal && (
                          <button
                            onClick={() => handleDelete(min.id, min.name)}
                            disabled={actionLoading}
                            className="text-gray-400 hover:text-accent-red p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
          <Users className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-serif font-bold text-gray-700 dark:text-gray-300">No hay ministerios registrados</h3>
          <p className="text-gray-400 text-sm mt-1">Comienza agregando los departamentos o servicios de la iglesia.</p>
        </div>
      )}

      {/* Modal / Formulario CRUD */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl border border-gray-150 dark:border-white/10 overflow-hidden animate-scale-in my-8">
            <div className="bg-gray-50 dark:bg-slate-950 border-b border-gray-150 dark:border-white/10 py-4 px-6 flex justify-between items-center">
              <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-lg">
                {isEditingReadOnly 
                  ? 'Detalles del Ministerio' 
                  : editingMinistry 
                    ? 'Editar Ministerio' 
                    : 'Crear Nuevo Ministerio'
                }
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Nombre del Ministerio</label>
                  <input
                    {...register('name')}
                    type="text"
                    disabled={isEditingReadOnly}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                    placeholder="Ej. Dep. Jóvenes"
                  />
                  {errors.name && <p className="text-accent-red text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Slug URL</label>
                  <input
                    {...register('slug')}
                    type="text"
                    disabled={isEditingReadOnly}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none bg-gray-50/50 disabled:bg-gray-50 disabled:text-gray-400"
                    placeholder="ej-jovenes"
                  />
                  {errors.slug && <p className="text-accent-red text-xs mt-1">{errors.slug.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Categoría</label>
                  <select
                    {...register('category')}
                    disabled={isEditingReadOnly}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-gray-50"
                  >
                    <option value="departamento">Departamento</option>
                    <option value="servicio">Servicio</option>
                  </select>
                  {errors.category && <p className="text-accent-red text-xs mt-1">{errors.category.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Líder o Responsable</label>
                  <input
                    {...register('leader_name')}
                    type="text"
                    disabled={isEditingReadOnly}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                    placeholder="Ej. Líderes Juveniles"
                  />
                  {errors.leader_name && <p className="text-accent-red text-xs mt-1">{errors.leader_name.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Horario de Reunión</label>
                  <input
                    {...register('schedule')}
                    type="text"
                    disabled={isEditingReadOnly}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                    placeholder="Ej. Sábados 7:30pm"
                  />
                  {errors.schedule && <p className="text-accent-red text-xs mt-1">{errors.schedule.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Fecha de Aniversario</label>
                  <input
                    {...register('anniversary_date')}
                    type="date"
                    disabled={isEditingReadOnly}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  {errors.anniversary_date && <p className="text-accent-red text-xs mt-1">{errors.anniversary_date.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Color del Tema</label>
                  <div className="flex items-center gap-2">
                    <input
                      {...register('theme_color')}
                      type="color"
                      disabled={isEditingReadOnly}
                      className="w-10 h-10 border border-gray-200 dark:border-white/10 rounded-lg cursor-pointer p-0.5 bg-white dark:bg-slate-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    <input
                      type="text"
                      value={watch('theme_color') || '#1E3A8A'}
                      onChange={(e) => setValue('theme_color', e.target.value)}
                      disabled={isEditingReadOnly}
                      placeholder="#1E3A8A"
                      className="flex-grow px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                  {errors.theme_color && <p className="text-accent-red text-xs mt-1">{errors.theme_color.message}</p>}
                </div>
              </div>

              {/* Imagen de Portada */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Imagen de Portada (Banner)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {!isEditingReadOnly ? (
                    <div className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-200 dark:border-white/10 rounded-xl bg-gray-50/50">
                      <MediaUploader
                        folder="ministerios"
                        allowedFormats={['jpg', 'jpeg', 'png', 'webp']}
                        onUploadSuccess={(url) => {
                          setValue('image_url', url);
                          setImagePreview(url);
                        }}
                        label="Subir Portada"
                        className="w-full justify-center"
                      />
                      <span className="text-[10px] text-gray-400 block mt-2">JPG, PNG o WEBP</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-slate-950 text-gray-400 text-xs">
                      Carga de archivos deshabilitada
                    </div>
                  )}

                  {/* Preview de la imagen */}
                  <div className="flex items-center gap-3">
                    {imagePreview ? (
                      <div className="relative w-24 h-24 rounded-xl border border-gray-150 dark:border-white/10 overflow-hidden bg-gray-55 flex-shrink-0">
                        <img src={imagePreview} alt="Cover Preview" className="w-full h-full object-cover" />
                        {!isEditingReadOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setValue('image_url', '');
                            }}
                            className="absolute top-1 right-1 bg-red-650 text-white rounded-full p-0.5 hover:bg-red-700 shadow-sm transition-all"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-950 flex items-center justify-center text-gray-300 text-xs">
                        Sin Imagen
                      </div>
                    )}
                    <div className="flex-grow">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-gray-450 font-semibold uppercase block">O escribe URL directa</span>
                        {!isEditingReadOnly && (
                          <button
                            type="button"
                            onClick={() => setIsMediaModalOpen(true)}
                            className="text-[10px] text-primary hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Search size={12} />
                            Buscar en Internet
                          </button>
                        )}
                      </div>
                      <input
                        {...register('image_url')}
                        type="url"
                        disabled={isEditingReadOnly}
                        className="w-full px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:bg-gray-50 disabled:text-gray-400"
                        placeholder="https://ejemplo.com/portada.jpg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor de Bloques */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-2.5">
                  Contenido de la Página (Bloques de Diseño)
                </label>
                <BlockEditor 
                  content={JSON.stringify(blocks)} 
                  onChange={(json) => {
                    try {
                      setBlocks(JSON.parse(json));
                    } catch (e) {
                      // ignore
                    }
                  }} 
                  disabled={isEditingReadOnly}
                />
              </div>

              {/* Botones de Envío */}
              <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-250 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {isEditingReadOnly ? 'Cerrar' : 'Cancelar'}
                </button>
                {!isEditingReadOnly && (
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-primary hover:bg-blue-900 disabled:bg-gray-200 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border border-transparent"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Guardando...
                      </>
                    ) : (
                      'Guardar Ministerio'
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Media Search Modal */}
      <MediaSearchModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(url) => {
          setValue('image_url', url);
          setImagePreview(url);
        }}
        allowedTypes={['image']}
        title="Buscar Imagen de Portada"
      />
    </div>
  );
};

export default MinistryManager;
