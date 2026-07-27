import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import { AnimeFadeUp, AnimeHoverCard } from '../../components/animations/AnimeWrappers';
import AdminHeader from '../../components/admin/AdminHeader';
import { Plus, Edit2, Trash2, X, Loader2, User, Mic, FileText, Image as ImageIcon, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import type { Speaker, Member } from '../../types';
import { DynamicDataView } from '../../components/ui/DynamicDataView';
import type { ColumnDef } from '@tanstack/react-table';
import MediaSearchModal from '../../components/admin/MediaSearchModal';

const speakerSchema = z.object({
  first_name: z.string().min(1, 'El nombre es obligatorio'),
  last_name: z.string().min(1, 'El apellido es obligatorio'),
  role: z.string().min(1, 'El cargo es obligatorio'),
  bio: z.string().optional(),
  photo_url: z.string().optional().nullable(),
  member_id: z.string().optional().nullable(),
});

type SpeakerForm = z.infer<typeof speakerSchema>;

const SpeakersManager = () => {
  const { isReadOnly } = usePermissions();
  const readOnly = isReadOnly('sermons'); // Reusing sermons permission for speakers
  const confirm = useConfirmStore((state) => state.confirm);
  
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<SpeakerForm>({
    resolver: zodResolver(speakerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      role: 'Pastor',
      bio: '',
      photo_url: '',
      member_id: '',
    }
  });

  const selectedMemberId = watch('member_id');

  // Auto-fill from member if selected
  useEffect(() => {
    if (selectedMemberId && !editingSpeaker) {
      const member = members.find(m => m.id === selectedMemberId);
      if (member) {
        setValue('first_name', member.first_name);
        setValue('last_name', member.last_name);
        if (member.photo_url) setValue('photo_url', member.photo_url);
      }
    }
  }, [selectedMemberId, members, setValue, editingSpeaker]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: speakersData, error: speakersError } = await supabase
        .from('speakers')
        .select('*, members(*)')
        .order('created_at', { ascending: false });
      if (speakersError) throw speakersError;
      setSpeakers(speakersData as Speaker[]);

      const { data: membersData, error: membersError } = await supabase
        .from('profiles') // using profiles/members as appropriate for CRM
        .select('id, first_name, last_name, photo_url')
        .order('first_name');
      if (membersError) {
        console.warn('Could not load CRM profiles, might be profiles or members table depending on schema', membersError);
      } else {
        setMembers(membersData as Member[]);
      }
    } catch (err: unknown) {
      console.error('Error fetching speakers:', err);
      toast.error('Error al cargar oradores: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingSpeaker(null);
    reset({
      first_name: '',
      last_name: '',
      role: 'Pastor',
      bio: '',
      photo_url: '',
      member_id: '',
    });
    setShowForm(true);
  };

  const handleOpenEdit = (speaker: Speaker) => {
    setEditingSpeaker(speaker);
    reset({
      first_name: speaker.first_name,
      last_name: speaker.last_name,
      role: speaker.role || 'Pastor',
      bio: speaker.bio || '',
      photo_url: speaker.photo_url || '',
      member_id: speaker.member_id || '',
    });
    setShowForm(true);
  };

  const onSubmit = async (data: SpeakerForm) => {
    setActionLoading(true);
    try {
      const payload = {
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        bio: data.bio || null,
        photo_url: data.photo_url || null,
        member_id: data.member_id || null,
        updated_at: new Date().toISOString()
      };

      if (editingSpeaker) {
        const { error } = await supabase.from('speakers').update(payload).eq('id', editingSpeaker.id);
        if (error) throw error;
        toast.success('Orador actualizado con éxito.');
      } else {
        const { error } = await supabase.from('speakers').insert(payload);
        if (error) throw error;
        toast.success('Orador agregado con éxito.');
      }

      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      console.error('Error saving speaker:', err);
      toast.error('Error al guardar: ' + (err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar orador',
      message: '¿Estás seguro de eliminar este orador? Las prédicas asociadas no se eliminarán, pero perderán el vínculo con este orador.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        const { error } = await supabase.from('speakers').delete().eq('id', id);
        if (error) throw error;
        toast.success('Orador eliminado exitosamente.');
        fetchData();
      } catch (err: unknown) {
        console.error('Error deleting speaker:', err);
        toast.error('No se pudo eliminar el registro. ' + (err as Error).message);
      }
    }
  };

  const columns: ColumnDef<Speaker>[] = [
    {
      accessorKey: 'photo_url',
      header: 'Foto',
      cell: ({ row }) => (
        row.original.photo_url ? (
          <img src={row.original.photo_url} alt={row.original.first_name} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <User size={20} />
          </div>
        )
      ),
    },
    {
      id: 'name',
      header: 'Nombre Completo',
      cell: ({ row }) => <span className="font-medium text-slate-900 dark:text-white">{row.original.first_name} {row.original.last_name}</span>,
    },
    {
      accessorKey: 'role',
      header: 'Cargo/Rol',
      cell: ({ row }) => (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {row.getValue('role')}
        </span>
      ),
    },
    {
      id: 'crm_link',
      header: 'Vinculado a CRM',
      cell: ({ row }) => (
        row.original.member_id ? (
          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
            <LinkIcon size={14} /> CRM
          </span>
        ) : (
          <span className="text-xs text-slate-400">Libre</span>
        )
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenEdit(row.original)}
            disabled={readOnly}
            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50"
            title="Editar"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            disabled={readOnly}
            className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-4 md:p-8">
      <AdminHeader 
        title="Catálogo de Pastores y Oradores" 
        description="Administra los perfiles de quienes imparten prédicas y devocionales"
      />

      {!showForm ? (
        <AnimeFadeUp delay={100}>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Estos perfiles se usan para etiquetar Sermones. Puedes vincularlos con un miembro del CRM para mantener consistencia.
              </p>
            </div>
            {!readOnly && (
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-medium"
              >
                <Plus size={18} />
                Nuevo Orador
              </button>
            )}
          </div>

          <DynamicDataView
            data={speakers}
            columns={columns}
            title="Oradores Registrados"
            defaultView="table"
            isLoading={loading}
            renderListItem={(speaker) => (
              <div className="flex items-center gap-4 p-4">
                {speaker.photo_url ? (
                  <img src={speaker.photo_url} alt={speaker.first_name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <User size={24} />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white">{speaker.first_name} {speaker.last_name}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{speaker.role}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEdit(speaker)} disabled={readOnly} className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-full transition-colors disabled:opacity-50"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(speaker.id)} disabled={readOnly} className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-full transition-colors disabled:opacity-50"><Trash2 size={18} /></button>
                </div>
              </div>
            )}
            renderGridItem={(speaker) => (
              <AnimeHoverCard className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-col h-full">
                <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                  {speaker.photo_url ? (
                    <img src={speaker.photo_url} alt={speaker.first_name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-slate-300 dark:text-slate-700" />
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-xs font-bold text-primary dark:text-gold uppercase tracking-wider mb-1">{speaker.role}</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{speaker.first_name} {speaker.last_name}</h3>
                  {speaker.bio && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">{speaker.bio}</p>
                  )}
                  {speaker.member_id && (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium mb-4">
                      <LinkIcon size={12} /> Perfil CRM Vinculado
                    </div>
                  )}
                  <div className="flex justify-end gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <button onClick={() => handleOpenEdit(speaker)} disabled={readOnly} className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(speaker.id)} disabled={readOnly} className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"><Trash2 size={16} /></button>
                  </div>
                </div>
              </AnimeHoverCard>
            )}
          />
        </AnimeFadeUp>
      ) : (
        <AnimeFadeUp>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden max-w-3xl mx-auto">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Mic size={20} className="text-primary dark:text-gold" />
                {editingSpeaker ? 'Editar Orador' : 'Nuevo Orador'}
              </h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 flex gap-3">
                <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Vinculación con CRM (Opcional)</p>
                  <p>Si vinculas este orador con un miembro del CRM, puedes importar su nombre automáticamente.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Vincular con Miembro CRM
                  </label>
                  <select 
                    {...register('member_id')}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="">-- No vincular (Orador Invitado o Externo) --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    {...register('first_name')}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Ej. Roberto"
                  />
                  {errors.first_name && <p className="mt-1 text-sm text-red-500">{errors.first_name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    {...register('last_name')}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Ej. Gómez"
                  />
                  {errors.last_name && <p className="mt-1 text-sm text-red-500">{errors.last_name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Cargo / Rol *
                  </label>
                  <input
                    type="text"
                    {...register('role')}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Ej. Pastor Principal, Maestro, Líder..."
                  />
                  {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Foto (URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      {...register('photo_url')}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={() => setIsMediaModalOpen(true)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                      title="Explorar bóveda"
                    >
                      <ImageIcon size={20} />
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                    Biografía <FileText size={14} className="text-slate-400" />
                  </label>
                  <textarea
                    {...register('bio')}
                    rows={4}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                    placeholder="Breve reseña biográfica del orador..."
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-medium flex items-center gap-2 disabled:opacity-70"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={20} /> : null}
                  {editingSpeaker ? 'Guardar Cambios' : 'Crear Orador'}
                </button>
              </div>
            </form>
          </div>
        </AnimeFadeUp>
      )}

      {isMediaModalOpen && (
        <MediaSearchModal
          onSelect={(url) => {
            setValue('photo_url', url);
            setIsMediaModalOpen(false);
          }}
          isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SpeakersManager;
