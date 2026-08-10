import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  Clock3,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminHeader from '../../components/admin/AdminHeader';
import { supabase } from '../../config/supabase';
import { useConfirmStore } from '../../store/useConfirmStore';
import type { Schedule } from '../../types';

interface ScheduleFormValues {
  day: string;
  title: string;
  timeRange: string;
  description: string;
}

interface SchedulePayload {
  day: string;
  title: string;
  time_range: string;
  description: string | null;
  order_index: number;
}

const EMPTY_FORM: ScheduleFormValues = {
  day: '',
  title: '',
  timeRange: '',
  description: '',
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Ocurrió un error inesperado.';

const validateSchedule = (values: ScheduleFormValues): string | null => {
  if (!values.day.trim()) return 'Indica el día o la frecuencia del horario.';
  if (!values.title.trim()) return 'Escribe el nombre del culto o actividad.';
  if (!values.timeRange.trim()) return 'Indica la hora o el rango de horas.';
  if (values.day.trim().length > 80) return 'El día no puede superar 80 caracteres.';
  if (values.title.trim().length > 140) return 'El nombre no puede superar 140 caracteres.';
  if (values.timeRange.trim().length > 80) return 'El horario no puede superar 80 caracteres.';
  if (values.description.trim().length > 500) return 'La descripción no puede superar 500 caracteres.';
  return null;
};

const SchedulesManager = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [form, setForm] = useState<ScheduleFormValues>(EMPTY_FORM);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('id, day, title, time_range, description, order_index, created_at')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSchedules(data ?? []);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error('No se pudieron cargar los horarios:', error);
      setLoadError(`No pudimos cargar los horarios. ${message}`);
      toast.error('No se pudieron cargar los horarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchSchedules();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchSchedules]);

  const filteredSchedules = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es');
    if (!query) return schedules;
    return schedules.filter((schedule) =>
      [schedule.day, schedule.title, schedule.time_range, schedule.description ?? '']
        .some((value) => value.toLocaleLowerCase('es').includes(query)),
    );
  }, [schedules, search]);

  const openCreateForm = () => {
    setEditingSchedule(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setForm({
      day: schedule.day,
      title: schedule.title,
      timeRange: schedule.time_range,
      description: schedule.description ?? '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setIsFormOpen(false);
    setEditingSchedule(null);
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateSchedule(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError(null);
    const payload: SchedulePayload = {
      day: form.day.trim(),
      title: form.title.trim(),
      time_range: form.timeRange.trim(),
      description: form.description.trim() || null,
      order_index: editingSchedule
        ? editingSchedule.order_index
        : Math.max(0, ...schedules.map((schedule) => schedule.order_index)) + 1,
    };

    try {
      const request = editingSchedule
        ? supabase.from('schedules').update(payload).eq('id', editingSchedule.id)
        : supabase.from('schedules').insert(payload);
      const { error } = await request;
      if (error) throw error;

      toast.success(editingSchedule ? 'Horario actualizado.' : 'Horario creado.');
      setIsFormOpen(false);
      setEditingSchedule(null);
      setForm(EMPTY_FORM);
      await fetchSchedules();
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error('No se pudo guardar el horario:', error);
      setFormError(`No pudimos guardar el horario. ${message}`);
      toast.error('No se pudo guardar el horario.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (schedule: Schedule) => {
    const accepted = await confirm({
      title: 'Eliminar horario',
      message: `Se eliminará “${schedule.title}” de la portada. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!accepted) return;

    try {
      const { error } = await supabase.from('schedules').delete().eq('id', schedule.id);
      if (error) throw error;
      toast.success('Horario eliminado.');
      await fetchSchedules();
    } catch (error: unknown) {
      console.error('No se pudo eliminar el horario:', error);
      toast.error(`No se pudo eliminar el horario. ${getErrorMessage(error)}`);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    const current = schedules[index];
    const target = schedules[targetIndex];
    if (!current || !target || movingId) return;

    setMovingId(current.id);
    try {
      const { error: currentError } = await supabase
        .from('schedules')
        .update({ order_index: target.order_index })
        .eq('id', current.id);
      if (currentError) throw currentError;

      const { error: targetError } = await supabase
        .from('schedules')
        .update({ order_index: current.order_index })
        .eq('id', target.id);

      if (targetError) {
        const { error: rollbackError } = await supabase
          .from('schedules')
          .update({ order_index: current.order_index })
          .eq('id', current.id);
        if (rollbackError) {
          throw new Error(
            `Falló el cambio de orden y también su reversión: ${targetError.message}; ${rollbackError.message}`,
          );
        }
        throw targetError;
      }

      toast.success('Orden actualizado.');
    } catch (error: unknown) {
      console.error('No se pudo cambiar el orden de los horarios:', error);
      toast.error(`No se pudo cambiar el orden. ${getErrorMessage(error)}`);
    } finally {
      await fetchSchedules();
      setMovingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <AdminHeader
        title="Horarios de la iglesia"
        description="Organiza los cultos y actividades recurrentes que se muestran en la portada."
        eyebrow="Contenido del sitio"
        action={
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Plus size={17} />
            Nuevo horario
          </button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Resumen de horarios">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            <CalendarClock size={20} />
          </span>
          <div>
            <p className="text-2xl font-black text-slate-950 dark:text-white">{schedules.length}</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Horarios publicados</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <span className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
            <Clock3 size={20} />
          </span>
          <div>
            <p className="text-sm font-black text-slate-950 dark:text-white">Orden manual</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">El primer elemento aparece primero en la portada.</p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-md">
          <span className="sr-only">Buscar horarios</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por día, actividad u hora…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </label>
        <button
          type="button"
          onClick={() => void fetchSchedules()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {loadError && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
          <p className="font-bold">No se pudo mostrar la lista.</p>
          <p className="mt-1">{loadError}</p>
          <button type="button" onClick={() => void fetchSchedules()} className="mt-3 font-bold underline underline-offset-4">
            Intentar de nuevo
          </button>
        </div>
      )}

      {loading && schedules.length === 0 ? (
        <div className="flex min-h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900" aria-live="polite">
          <LoaderCircle className="animate-spin text-primary" size={28} />
          <span className="ml-3 text-sm font-semibold text-slate-500">Cargando horarios…</span>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-white/15 dark:bg-slate-900">
          <CalendarClock className="mx-auto text-slate-300 dark:text-slate-600" size={40} />
          <h2 className="mt-4 font-serif text-xl font-bold text-slate-900 dark:text-white">
            {search ? 'No encontramos coincidencias' : 'Todavía no hay horarios'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {search ? 'Prueba con otra palabra.' : 'Crea el primer horario para mostrarlo en la portada.'}
          </p>
        </div>
      ) : (
        <ol className="space-y-3" aria-label="Horarios, en orden de aparición">
          {filteredSchedules.map((schedule) => {
            const realIndex = schedules.findIndex((item) => item.id === schedule.id);
            const isMoving = movingId === schedule.id;
            return (
              <li key={schedule.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300" aria-label={`Posición ${realIndex + 1}`}>
                    {realIndex + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                        {schedule.day}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                        <Clock3 size={14} /> {schedule.time_range}
                      </span>
                    </div>
                    <h2 className="mt-2 text-base font-black text-slate-950 dark:text-white">{schedule.title}</h2>
                    {schedule.description && <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{schedule.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => void handleMove(realIndex, -1)}
                      disabled={realIndex === 0 || movingId !== null || search.trim() !== ''}
                      aria-label={`Subir ${schedule.title}`}
                      title={search ? 'Limpia la búsqueda para cambiar el orden' : 'Subir'}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      {isMoving ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowUp size={17} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleMove(realIndex, 1)}
                      disabled={realIndex === schedules.length - 1 || movingId !== null || search.trim() !== ''}
                      aria-label={`Bajar ${schedule.title}`}
                      title={search ? 'Limpia la búsqueda para cambiar el orden' : 'Bajar'}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <ArrowDown size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditForm(schedule)}
                      aria-label={`Editar ${schedule.title}`}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(schedule)}
                      aria-label={`Eliminar ${schedule.title}`}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeForm()}>
          <section role="dialog" aria-modal="true" aria-labelledby="schedule-form-title" className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-white/10 sm:p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gold">Horario recurrente</p>
                <h2 id="schedule-form-title" className="mt-1 font-serif text-2xl font-bold text-primary dark:text-white">
                  {editingSchedule ? 'Editar horario' : 'Nuevo horario'}
                </h2>
              </div>
              <button type="button" onClick={closeForm} disabled={saving} aria-label="Cerrar formulario" className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5 p-5 sm:p-6" noValidate>
              {formError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">{formError}</div>}

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Día o frecuencia <span className="text-red-500">*</span>
                  <input
                    autoFocus
                    value={form.day}
                    onChange={(event) => setForm((current) => ({ ...current, day: event.target.value }))}
                    maxLength={80}
                    placeholder="Ej. Miércoles"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Hora o rango <span className="text-red-500">*</span>
                  <input
                    value={form.timeRange}
                    onChange={(event) => setForm((current) => ({ ...current, timeRange: event.target.value }))}
                    maxLength={80}
                    placeholder="Ej. 7:30 p. m. – 9:00 p. m."
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  />
                </label>
              </div>

              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                Nombre del culto o actividad <span className="text-red-500">*</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  maxLength={140}
                  placeholder="Ej. Culto de enseñanza"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
              </label>

              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                Descripción <span className="font-normal text-slate-400">(opcional)</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  maxLength={500}
                  rows={4}
                  placeholder="Explica brevemente a quién está dirigido o qué encontrará la persona."
                  className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
                <span className="mt-1 block text-right text-xs font-normal text-slate-400">{form.description.length}/500</span>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeForm} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-900 disabled:cursor-wait disabled:opacity-60">
                  {saving && <LoaderCircle size={17} className="animate-spin" />}
                  {saving ? 'Guardando…' : editingSchedule ? 'Guardar cambios' : 'Crear horario'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default SchedulesManager;
