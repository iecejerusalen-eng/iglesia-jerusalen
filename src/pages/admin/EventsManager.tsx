import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirmStore } from '../../store/useConfirmStore';
import { fadeInUp } from '../../utils/animations';
import AdminHeader from '../../components/admin/AdminHeader';
import { 
  Plus, Edit2, Trash2, Calendar, Clock, 
  X, Loader2, Save, Smile, Image as ImageIcon 
} from 'lucide-react';
import MediaUploader from '../../components/common/MediaUploader';
import type { Event as DbEvent, Profile } from '../../types';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

// Zod validation schema
const eventSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().or(z.literal('')),
  start_date: z.string().min(1, 'La fecha de inicio es obligatoria'),
  end_date: z.string().min(1, 'La fecha de finalización es obligatoria'),
  start_time: z.string().or(z.literal('')),
  end_time: z.string().or(z.literal('')),
  is_recurring: z.boolean(),
  is_public: z.boolean(),
  recurrence_type: z.string().nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
  emoji: z.string().nullable().optional(),
  ministry_id: z.string().nullable(),
  leaders_in_charge_raw: z.string().or(z.literal('')),
});

type EventForm = z.infer<typeof eventSchema>;

const WEEK_DAYS = [
  { id: 1, label: 'Lunes', short: 'L' },
  { id: 2, label: 'Martes', short: 'M' },
  { id: 3, label: 'Miércoles', short: 'M' },
  { id: 4, label: 'Jueves', short: 'J' },
  { id: 5, label: 'Viernes', short: 'V' },
  { id: 6, label: 'Sábado', short: 'S' },
  { id: 7, label: 'Domingo', short: 'D' },
];

const EventsManager = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  const { user, userRole } = useAuthStore();
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [ministries, setMinistries] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DbEvent | null>(null);

  // Cover & Emoji states
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      is_recurring: false,
      is_public: true,
      recurrence_type: 'semanal',
      cover_image_url: '',
      emoji: '',
      ministry_id: null,
      leaders_in_charge_raw: '',
    }
  });

  const isRecurringWatched = watch('is_recurring');
  const recurrenceTypeWatched = watch('recurrence_type');

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profile) setUserProfile(profile);
      }

      const { data: minData } = await supabase
        .from('ministries')
        .select('id, name');
      setMinistries(minData || []);

      await fetchEvents();
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      let query = supabase.from('events').select('*, ministries(name, slug)');
      const { data, error } = await query.order('start_date', { ascending: false });
      if (error) throw error;
      setEvents(data || []);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      toast.error('Error al cargar eventos: ' + err.message);
    }
  };

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setCoverImagePreview(null);
    setSelectedEmoji(null);
    setSelectedDays([]);
    setShowEmojiPicker(false);
    
    const defaultMinistry = userRole === 'leader' && userProfile?.ministry_id 
      ? userProfile.ministry_id 
      : null;

    reset({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      is_recurring: false,
      is_public: true,
      recurrence_type: 'semanal',
      cover_image_url: '',
      emoji: '',
      ministry_id: defaultMinistry,
      leaders_in_charge_raw: '',
    });
    setShowForm(true);
  };

  const handleOpenEdit = (event: DbEvent) => {
    setEditingEvent(event);
    setCoverImagePreview(event.cover_image_url || null);
    setSelectedEmoji(event.emoji || null);
    setSelectedDays(event.recurrence_days || []);
    setShowEmojiPicker(false);

    reset({
      title: event.title,
      description: event.description || '',
      start_date: event.start_date,
      end_date: event.end_date,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      is_recurring: event.is_recurring,
      is_public: event.is_public ?? true,
      recurrence_type: event.recurrence_type || 'semanal',
      cover_image_url: event.cover_image_url || '',
      emoji: event.emoji || '',
      ministry_id: event.ministry_id,
      leaders_in_charge_raw: event.leaders_in_charge ? event.leaders_in_charge.join(', ') : '',
    });
    setShowForm(true);
  };

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const onSubmit = async (formData: EventForm) => {
    setActionLoading(true);
    try {
      const leadersList = formData.leaders_in_charge_raw
        ? formData.leaders_in_charge_raw.split(',').map(x => x.trim()).filter(Boolean)
        : [];

      let finalCoverUrl = formData.cover_image_url || null;

      const eventPayload = {
        title: formData.title,
        description: formData.description || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        is_recurring: formData.is_recurring,
        is_public: formData.is_public,
        recurrence_type: formData.is_recurring ? (formData.recurrence_type || null) : null,
        recurrence_days: formData.is_recurring && formData.recurrence_type === 'semanal' ? selectedDays : null,
        cover_image_url: finalCoverUrl,
        emoji: selectedEmoji || null,
        ministry_id: formData.ministry_id || null,
        leaders_in_charge: leadersList,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(eventPayload)
          .eq('id', editingEvent.id);

        if (error) throw error;
        toast.success('Evento actualizado con éxito.');
      } else {
        const { error } = await supabase
          .from('events')
          .insert(eventPayload);

        if (error) throw error;
        toast.success('Evento creado con éxito.');
      }

      setShowForm(false);
      fetchEvents();
    } catch (err: any) {
      console.error('Error saving event:', err);
      toast.error('No se pudo guardar el evento: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar evento',
      message: '¿Estás seguro de eliminar este evento?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Evento eliminado con éxito.');
      fetchEvents();
    } catch (err: any) {
      console.error('Error deleting event:', err);
      toast.error('No se pudo eliminar el evento: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const visibleEvents = events.filter(e => {
    if (userRole === 'leader' && userProfile?.ministry_id) {
      return e.ministry_id === userProfile.ministry_id;
    }
    return true;
  });

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={fadeInUp}
      className="space-y-6 max-w-5xl"
    >
      <AdminHeader 
        title="Gestión de Eventos" 
        description="Publica y edita los cultos y actividades especiales en el calendario interactivo de la iglesia."
        action={
          !showForm && (
            <button
              onClick={handleOpenCreate}
              className="bg-primary hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus size={16} />
              Nuevo Evento
            </button>
          )
        }
      />

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-150 dark:border-white/10 p-6 md:p-8"
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-serif font-bold text-gray-800 dark:text-white text-lg">
                {editingEvent ? 'Editar Evento' : 'Registrar Nuevo Evento'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-650 rounded-lg p-1.5 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {/* Cover Image & Emoji Selector Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50/50 dark:bg-slate-800 p-4 rounded-2xl border border-gray-150 dark:border-white/10">
                {/* Emoji Selector */}
                <div className="md:col-span-1 flex flex-col items-center justify-center border-r border-gray-150 dark:border-white/10 pr-6 relative">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-2">Icono / Emoji</span>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-gray-255 flex items-center justify-center text-3xl shadow-xs hover:border-primary transition-all cursor-pointer"
                  >
                    {selectedEmoji ? selectedEmoji : <Smile size={28} className="text-gray-400" />}
                  </button>
                  {selectedEmoji && (
                    <button
                      type="button"
                      onClick={() => setSelectedEmoji(null)}
                      className="text-[10px] text-red-500 font-bold hover:underline mt-1"
                    >
                      Quitar emoji
                    </button>
                  )}

                  {showEmojiPicker && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 shadow-xl rounded-2xl overflow-hidden border border-gray-150 dark:border-white/10 bg-white dark:bg-slate-900">
                      <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-950 p-2 border-b">
                        <span className="text-[10px] font-bold text-gray-550 dark:text-gray-400">Selecciona un Emoji</span>
                        <button type="button" onClick={() => setShowEmojiPicker(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                      </div>
                      <Picker 
                        data={data} 
                        onEmojiSelect={(emoji: any) => {
                          setSelectedEmoji(emoji.native);
                          setShowEmojiPicker(false);
                        }} 
                        theme="light"
                        locale="es"
                      />
                    </div>
                  )}
                </div>

                {/* Cover Image Upload */}
                <div className="md:col-span-2 space-y-3">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider block">Imagen de Portada</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-200 dark:border-white/10 rounded-xl bg-gray-50/50">
                      <MediaUploader
                        folder="eventos"
                        allowedFormats={['jpg', 'jpeg', 'png', 'webp']}
                        onUploadSuccess={(url) => {
                          setValue('cover_image_url', url);
                          setCoverImagePreview(url);
                        }}
                        label="Subir Portada"
                        className="w-full justify-center"
                      />
                      <span className="text-[9px] text-gray-400 block mt-2">JPG, PNG o WEBP</span>
                    </div>

                    {coverImagePreview ? (
                      <div className="relative w-28 h-20 rounded-xl border border-gray-150 dark:border-white/10 overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={coverImagePreview} alt="Cover Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setCoverImagePreview(null);
                            setValue('cover_image_url', '');
                          }}
                          className="absolute top-1 right-1 bg-red-650 text-white rounded-full p-0.5 hover:bg-red-700 shadow-sm"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-28 h-20 rounded-xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 flex items-center justify-center text-gray-300 text-xs">
                        Sin Imagen
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 font-semibold uppercase block mb-1">O escribe URL directa</span>
                    <input
                      {...register('cover_image_url')}
                      type="url"
                      className="w-full px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                      placeholder="https://ejemplo.com/portada-evento.jpg"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Título del Evento</label>
                <input
                  type="text"
                  {...register('title')}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  placeholder="Ej. Gran Vigilia de Oración"
                />
                {errors.title && <p className="text-accent-red text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Descripción</label>
                <textarea
                  {...register('description')}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none"
                  placeholder="Detalles sobre el evento..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    {...register('start_date')}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                  {errors.start_date && <p className="text-accent-red text-xs mt-1">{errors.start_date.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Fecha de Finalización</label>
                  <input
                    type="date"
                    {...register('end_date')}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                  {errors.end_date && <p className="text-accent-red text-xs mt-1">{errors.end_date.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Hora de Inicio</label>
                  <input
                    type="time"
                    {...register('start_time')}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Hora de Finalización</label>
                  <input
                    type="time"
                    {...register('end_time')}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Área / Ministerio Responsable</label>
                  <select
                    {...register('ministry_id')}
                    disabled={userRole === 'leader'}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer"
                  >
                    <option value="">General (Ninguno)</option>
                    {ministries.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  {userRole === 'leader' && (
                    <span className="text-[10px] text-gray-400 mt-1 block">Tu rol restringe los eventos únicamente a tu ministerio.</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-950 border border-gray-150 dark:border-white/10 p-3.5 rounded-xl">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      {...register('is_recurring')}
                      className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="is_recurring" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                      ¿Recurrente?
                    </label>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-950 border border-gray-150 dark:border-white/10 p-3.5 rounded-xl">
                    <input
                      type="checkbox"
                      id="is_public"
                      {...register('is_public')}
                      className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="is_public" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                      ¿Público?
                    </label>
                  </div>
                </div>
              </div>

              {/* Dynamic Recurrence Options */}
              {isRecurringWatched && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-gray-50/50 p-4 border border-gray-150 dark:border-white/10 rounded-2xl space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Frecuencia de Recurrencia</label>
                    <select
                      {...register('recurrence_type')}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer"
                    >
                      <option value="diario">Diario</option>
                      <option value="semanal">Semanal</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>

                  {recurrenceTypeWatched === 'semanal' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider">Días de Recurrencia</label>
                      <div className="flex flex-wrap gap-1.5">
                        {WEEK_DAYS.map(day => {
                          const checked = selectedDays.includes(day.id);
                          return (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => toggleDay(day.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                checked 
                                  ? 'bg-primary text-white border-primary shadow-2xs' 
                                  : 'bg-white border-gray-200 text-gray-650 hover:bg-gray-55'
                              }`}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Líderes Encargados (Separados por coma)</label>
                <input
                  type="text"
                  {...register('leaders_in_charge_raw')}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  placeholder="Ej. Bertha Corina, David Nicola"
                />
              </div>

              {/* Form Actions Footer */}
              <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2 border border-gray-250 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-primary hover:bg-blue-900 disabled:bg-gray-200 text-white px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {editingEvent ? 'Actualizar Evento' : 'Crear Evento'}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          
          /* EVENTS LIST VIEW */
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
            ) : visibleEvents.length > 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-150 dark:border-white/10">
                        <th className="py-4 px-6">Evento</th>
                        <th className="py-4 px-6">Fecha y Horarios</th>
                        <th className="py-4 px-6">Ministerio</th>
                        <th className="py-4 px-6">Líderes</th>
                        <th className="py-4 px-6 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm text-gray-750 dark:text-gray-300">
                      {visibleEvents.map((event) => (
                        <tr key={event.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              {event.cover_image_url ? (
                                <img
                                  src={event.cover_image_url}
                                  alt={event.title}
                                  className="w-12 h-10 rounded-lg object-cover border border-gray-100 dark:border-white/5 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-10 bg-gray-50 dark:bg-slate-950 text-gray-300 rounded-lg border border-dashed flex items-center justify-center flex-shrink-0">
                                  <ImageIcon size={16} />
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-gray-800 dark:text-gray-100 block flex items-center gap-1.5">
                                  {event.emoji && <span className="text-sm">{event.emoji}</span>}
                                  {event.title}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500 block max-w-xs truncate">{event.description || 'Sin descripción'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-1">
                              <Calendar size={12} className="text-gold" />
                              {event.start_date}
                              {event.is_recurring && (
                                <span className="text-[9px] bg-gold/15 text-gold border border-gold/25 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1.5">
                                  {event.recurrence_type}
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 block font-bold flex items-center gap-1 mt-0.5">
                              <Clock size={12} className="text-gold" />
                              {event.start_time || 'Todo el día'}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-semibold">
                            {event.ministries ? (
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-primary border border-blue-100">
                                {event.ministries.name}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">General</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-gray-500 dark:text-gray-450 font-semibold">
                            {event.leaders_in_charge && event.leaders_in_charge.length > 0 ? (
                              <span className="text-xs font-semibold">{event.leaders_in_charge.join(', ')}</span>
                            ) : (
                              <span className="text-gray-300 text-xs">Ninguno</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right space-x-1.5">
                            <button
                              onClick={() => handleOpenEdit(event)}
                              className="text-gray-400 hover:text-primary p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(event.id)}
                              disabled={actionLoading}
                              className="text-gray-400 hover:text-accent-red p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 shadow-xs">
                <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-serif font-bold text-gray-700 dark:text-gray-300">No hay eventos programados</h3>
                <p className="text-gray-400 text-sm mt-1 font-medium">Comienza agregando un nuevo evento al calendario.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EventsManager;
