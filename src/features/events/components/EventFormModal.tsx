import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../../config/supabase';
import { toast } from 'sonner';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { X, Loader2, Save, Smile } from 'lucide-react';
import MediaUploader from '../../../components/common/MediaUploader';
import type { Event as DbEvent, Profile } from '../../../types';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { RoutePickerSection, type RouteConfig } from '@/components/map/RoutePickerSection';
import { JERUSALEN_CHURCH_COORDS } from '@/components/map/ChurchRouteMap';

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

interface EventFormModalProps {
  editingEvent: DbEvent | null;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  onClose: () => void;
  onSuccess: () => void;
  userRoles: string[];
  userProfile: Profile | null;
  ministries: { id: string; name: string }[];
}

export default function EventFormModal({ 
  editingEvent, 
  initialDate,
  initialStartTime,
  initialEndTime,
  onClose, 
  onSuccess,
  userRoles,
  userProfile,
  ministries
}: EventFormModalProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(editingEvent?.cover_image_url || null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(editingEvent?.emoji || null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>(editingEvent?.recurrence_days || []);

  const [routeConfig, setRouteConfig] = useState<RouteConfig>(() => ({
    has_route: editingEvent?.has_route ?? Boolean(editingEvent?.latitude && editingEvent?.longitude),
    origin_name: editingEvent?.origin_name || JERUSALEN_CHURCH_COORDS.name,
    origin_lat: editingEvent?.origin_lat || JERUSALEN_CHURCH_COORDS.lat,
    origin_lng: editingEvent?.origin_lng || JERUSALEN_CHURCH_COORDS.lng,
    destination_name: editingEvent?.location_name || '',
    destination_lat: editingEvent?.latitude || -2.1322,
    destination_lng: editingEvent?.longitude || -79.5912,
  }));

  const defaultMinistry = userRoles.includes('leader') && userProfile?.ministry_id 
    ? userProfile.ministry_id 
    : null;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: editingEvent?.title || '',
      description: editingEvent?.description || '',
      start_date: editingEvent?.start_date || initialDate || '',
      end_date: editingEvent?.end_date || initialDate || '',
      start_time: editingEvent?.start_time || initialStartTime || '',
      end_time: editingEvent?.end_time || initialEndTime || '',
      is_recurring: editingEvent?.is_recurring || false,
      is_public: editingEvent?.is_public ?? true,
      recurrence_type: editingEvent?.recurrence_type || 'semanal',
      cover_image_url: editingEvent?.cover_image_url || '',
      emoji: editingEvent?.emoji || '',
      ministry_id: editingEvent?.ministry_id || defaultMinistry,
      leaders_in_charge_raw: editingEvent?.leaders_in_charge ? editingEvent.leaders_in_charge.join(', ') : '',
    }
  });

  const isRecurringWatched = watch('is_recurring');
  const recurrenceTypeWatched = watch('recurrence_type');

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

      const finalCoverUrl = formData.cover_image_url || null;

      const eventPayload: Record<string, unknown> = {
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
        location_name: routeConfig.has_route ? routeConfig.destination_name : null,
        latitude: routeConfig.has_route ? routeConfig.destination_lat : null,
        longitude: routeConfig.has_route ? routeConfig.destination_lng : null,
        has_route: routeConfig.has_route,
        origin_name: routeConfig.has_route ? routeConfig.origin_name : null,
        origin_lat: routeConfig.has_route ? routeConfig.origin_lat : null,
        origin_lng: routeConfig.has_route ? routeConfig.origin_lng : null,
      };

      if (editingEvent) {
        let { error } = await supabase
          .from('events')
          .update(eventPayload)
          .eq('id', editingEvent.id);

        if (error && error.message?.includes('column')) {
          delete eventPayload.has_route;
          delete eventPayload.origin_name;
          delete eventPayload.origin_lat;
          delete eventPayload.origin_lng;
          const retryRes = await supabase.from('events').update(eventPayload).eq('id', editingEvent.id);
          error = retryRes.error;
        }

        if (error) throw error;
        toast.success('Evento actualizado con éxito.');
      } else {
        let { error } = await supabase
          .from('events')
          .insert(eventPayload);

        if (error && error.message?.includes('column')) {
          delete eventPayload.has_route;
          delete eventPayload.origin_name;
          delete eventPayload.origin_lat;
          delete eventPayload.origin_lng;
          const retryRes = await supabase.from('events').insert(eventPayload);
          error = retryRes.error;
        }

        if (error) throw error;
        toast.success('Evento creado con éxito.');
      }

      onSuccess();
    } catch (err: unknown) {
      console.error('Error saving event:', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('No se pudo guardar el evento: ' + msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <AnimeFadeUp className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-150 dark:border-white/10 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white dark:bg-slate-900 z-10 pt-2">
          <h3 className="font-serif font-bold text-gray-800 dark:text-white text-lg">
            {editingEvent ? 'Editar Evento' : 'Registrar Nuevo Evento'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-650 rounded-lg p-1.5 transition-colors"
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
                    onEmojiSelect={(emoji: { native: string }) => {
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
                    <img loading="lazy" src={coverImagePreview} alt="Cover Preview" className="w-full h-full object-cover" />
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
                disabled={userRoles.includes('leader')}
                className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer"
              >
                <option value="">General (Ninguno)</option>
                {ministries.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              {userRoles.includes('leader') && (
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
            <div className="bg-gray-50/50 p-4 border border-gray-150 dark:border-white/10 rounded-2xl space-y-4 animate-fadeUp">
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
            </div>
          )}

          {/* Route Map Picker Section */}
          <RoutePickerSection
            value={routeConfig}
            onChange={setRouteConfig}
            eventTitle={watch('title')}
          />

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">Líderes Encargados (Separados por coma)</label>
            <input
              type="text"
              {...register('leaders_in_charge_raw')}
              className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              placeholder="Ej. Bertha Corina, David Nicola"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
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
      </AnimeFadeUp>
    </div>
  );
}
