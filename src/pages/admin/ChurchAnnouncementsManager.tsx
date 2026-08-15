import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, Edit3, ImagePlus, Megaphone, Plus, RefreshCw, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../config/supabase';
import AdminHeader from '../../components/admin/AdminHeader';
import { AdminErrorState } from '../../components/admin/AdminState';
import MediaUploader from '../../components/common/MediaUploader';
import { Button } from '../../components/ui/button';
import { usePermissions } from '../../hooks/usePermissions';
import { fetchChurchAnnouncements } from '../../features/announcements/service';
import type { AnnouncementDraft, ChurchAnnouncement } from '../../features/announcements/types';
import type { Event } from '../../types';

type EventOption = Pick<Event, 'id' | 'title' | 'start_date' | 'end_date' | 'start_time' | 'location_name'>;

const nowInputValue = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const toInputValue = (value: string | null) => value ? new Date(value).toISOString().slice(0, 16) : '';
const formatDate = (value: string) => new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));

const emptyDraft = (): AnnouncementDraft => ({
  title: '',
  summary: '',
  body: '',
  image_url: null,
  event_id: null,
  status: 'draft',
  is_featured: false,
  publish_at: new Date().toISOString(),
  expires_at: null,
});

export default function ChurchAnnouncementsManager() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('editorial', 'edit');
  const [announcements, setAnnouncements] = useState<ChurchAnnouncement[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [draft, setDraft] = useState<AnnouncementDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [announcementData, eventsResult] = await Promise.all([
        fetchChurchAnnouncements(),
        supabase
          .from('events')
          .select('id, title, start_date, end_date, start_time, location_name')
          .order('start_date', { ascending: true })
          .limit(250),
      ]);
      if (eventsResult.error) throw eventsResult.error;
      setAnnouncements(announcementData);
      setEvents((eventsResult.data as unknown as EventOption[] | null) ?? []);
    } catch (loadError) {
      console.error('No se pudieron cargar anuncios y eventos:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los anuncios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const publishedCount = useMemo(() => announcements.filter((announcement) => announcement.status === 'published').length, [announcements]);
  const featuredCount = useMemo(() => announcements.filter((announcement) => announcement.is_featured && announcement.status === 'published').length, [announcements]);

  const resetForm = () => {
    setDraft(emptyDraft());
    setEditingId(null);
  };

  const editAnnouncement = (announcement: ChurchAnnouncement) => {
    setEditingId(announcement.id);
    setDraft({
      title: announcement.title,
      summary: announcement.summary,
      body: announcement.body,
      image_url: announcement.image_url,
      event_id: announcement.event_id,
      status: announcement.status,
      is_featured: announcement.is_featured,
      publish_at: announcement.publish_at,
      expires_at: announcement.expires_at,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveAnnouncement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit) return;
    if (!draft.title.trim()) {
      toast.error('Escribe un título para el anuncio.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: draft.title.trim(),
        summary: draft.summary.trim(),
        body: draft.body.trim(),
        image_url: draft.image_url || null,
        event_id: draft.event_id || null,
        status: draft.status,
        is_featured: draft.is_featured,
        publish_at: new Date(draft.publish_at || nowInputValue()).toISOString(),
        expires_at: draft.expires_at ? new Date(draft.expires_at).toISOString() : null,
      };

      const result = editingId
        ? await supabase.from('church_announcements').update(payload).eq('id', editingId)
        : await supabase.from('church_announcements').insert(payload);
      if (result.error) throw result.error;

      toast.success(editingId ? 'Anuncio actualizado.' : 'Anuncio creado.');
      resetForm();
      await load();
    } catch (saveError) {
      console.error('No se pudo guardar el anuncio:', saveError);
      toast.error(saveError instanceof Error ? saveError.message : 'No se pudo guardar el anuncio.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (announcement: ChurchAnnouncement) => {
    if (!canEdit) return;
    const nextStatus = announcement.status === 'published' ? 'draft' : 'published';
    try {
      const { error: updateError } = await supabase.from('church_announcements').update({ status: nextStatus }).eq('id', announcement.id);
      if (updateError) throw updateError;
      toast.success(nextStatus === 'published' ? 'Anuncio publicado y enviado a notificaciones.' : 'Anuncio guardado como borrador.');
      await load();
    } catch (updateError) {
      console.error('No se pudo cambiar el estado del anuncio:', updateError);
      toast.error('No se pudo cambiar el estado del anuncio.');
    }
  };

  const deleteAnnouncement = async (announcement: ChurchAnnouncement) => {
    if (!canEdit || !window.confirm(`¿Eliminar "${announcement.title}"?`)) return;
    try {
      const { error: deleteError } = await supabase.from('church_announcements').delete().eq('id', announcement.id);
      if (deleteError) throw deleteError;
      toast.success('Anuncio eliminado.');
      if (editingId === announcement.id) resetForm();
      await load();
    } catch (deleteError) {
      console.error('No se pudo eliminar el anuncio:', deleteError);
      toast.error('No se pudo eliminar el anuncio.');
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Anuncios de la Iglesia"
        description="Publica comunicados generales con imágenes y enlázalos a un evento del calendario para que la comunidad reciba toda la información en un solo lugar."
        action={<div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => { void load(); }} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualizar</Button>{canEdit && <Button type="button" onClick={resetForm}><Plus size={16} /> Nuevo anuncio</Button>}</div>}
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Resumen de anuncios">
        {[['Total', announcements.length], ['Publicados', publishedCount], ['Destacados', featuredCount]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900"><p className="text-2xl font-black text-slate-950 dark:text-white">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p></div>)}
      </section>

      {error && <AdminErrorState description={`Detalle: ${error}`} onAction={() => { void load(); }} />}

      {canEdit && <form onSubmit={saveAnnouncement} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-600 dark:text-amber-300">{editingId ? 'Editar anuncio' : 'Nuevo comunicado'}</p><h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Información visible para toda la iglesia</h2></div>{editingId && <Button type="button" size="icon-sm" variant="ghost" onClick={resetForm} aria-label="Cancelar edición"><X size={17} /></Button>}</div>
        <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">Título *<input required value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} maxLength={160} placeholder="Ej. Venta de comida para apoyar la construcción" className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-400 dark:border-white/10 dark:bg-slate-950" /></label>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">Resumen<textarea value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} maxLength={500} rows={3} placeholder="Lo que la congregación debe saber de inmediato..." className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-400 dark:border-white/10 dark:bg-slate-950" /></label>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">Detalles adicionales<textarea value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} maxLength={6000} rows={5} placeholder="Información ampliada, instrucciones, precios, responsables..." className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-400 dark:border-white/10 dark:bg-slate-950" /></label>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200"><span className="flex items-center gap-2"><CalendarDays size={15} /> Evento vinculado</span><select value={draft.event_id ?? ''} onChange={(event) => setDraft((current) => ({ ...current, event_id: event.target.value || null }))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-400 dark:border-white/10 dark:bg-slate-950"><option value="">Sin evento vinculado</option>{events.map((item) => <option key={item.id} value={item.id}>{item.title} · {formatDate(item.start_date)}</option>)}</select><span className="mt-1 block text-[11px] font-normal text-slate-500">El evento seguirá administrándose desde Calendario de Eventos.</span></label>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 dark:border-white/15 dark:bg-white/[0.03]"><div className="mb-3 flex items-center gap-2 text-xs font-black text-slate-800 dark:text-white"><ImagePlus size={16} className="text-amber-500" /> Imagen del anuncio</div>{draft.image_url ? <div className="relative overflow-hidden rounded-xl"><img src={draft.image_url} alt="Vista previa del anuncio" className="aspect-video w-full object-cover" /><button type="button" onClick={() => setDraft((current) => ({ ...current, image_url: null }))} className="absolute right-2 top-2 rounded-lg bg-slate-950/70 p-2 text-white" aria-label="Eliminar imagen"><Trash2 size={14} /></button></div> : <MediaUploader folder="announcements" allowedFormats={['jpg', 'jpeg', 'png', 'webp']} label="Subir imagen" onUploadSuccess={(url) => setDraft((current) => ({ ...current, image_url: url }))} />}<label className="mt-3 block text-[11px] font-semibold text-slate-500">O pega una URL<input type="url" value={draft.image_url ?? ''} onChange={(event) => setDraft((current) => ({ ...current, image_url: event.target.value || null }))} placeholder="https://..." className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-amber-400 dark:border-white/10 dark:bg-slate-950" /></label></div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">Estado<select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as AnnouncementDraft['status'] }))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-400 dark:border-white/10 dark:bg-slate-950"><option value="draft">Borrador</option><option value="published">Publicar ahora</option><option value="archived">Archivado</option></select></label>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">Publicar desde<input type="datetime-local" value={toInputValue(draft.publish_at)} onChange={(event) => setDraft((current) => ({ ...current, publish_at: event.target.value ? new Date(event.target.value).toISOString() : current.publish_at }))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-400 dark:border-white/10 dark:bg-slate-950" /></label>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">Mostrar hasta (opcional)<input type="datetime-local" value={toInputValue(draft.expires_at)} onChange={(event) => setDraft((current) => ({ ...current, expires_at: event.target.value ? new Date(event.target.value).toISOString() : null }))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-400 dark:border-white/10 dark:bg-slate-950" /></label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-xs font-bold dark:border-white/10"><input type="checkbox" checked={draft.is_featured} onChange={(event) => setDraft((current) => ({ ...current, is_featured: event.target.checked }))} className="size-4 accent-amber-500" /> Destacar en Inicio y Publicaciones</label>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2"><Button type="button" variant="ghost" onClick={resetForm}>Limpiar</Button><Button type="submit" loading={saving}><Upload size={16} /> {editingId ? 'Guardar cambios' : 'Crear anuncio'}</Button></div>
      </form>}

      <section className="space-y-4" aria-label="Anuncios creados">
        {loading && announcements.length === 0 ? <div className="grid gap-4 md:grid-cols-2">{[1, 2].map((item) => <div key={item} className="h-52 animate-pulse rounded-3xl bg-slate-200 dark:bg-white/5" />)}</div> : announcements.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-white/15"><Megaphone className="mx-auto text-amber-500" size={32} /><p className="mt-3 text-sm font-bold">Todavía no hay anuncios creados.</p></div> : announcements.map((announcement) => <article key={announcement.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900"><div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"><div className="h-28 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:w-48 dark:bg-white/5">{announcement.image_url ? <img src={announcement.image_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-300"><Megaphone size={30} /></div>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${announcement.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : announcement.status === 'archived' ? 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300'}`}>{announcement.status === 'published' ? 'Publicado' : announcement.status === 'archived' ? 'Archivado' : 'Borrador'}</span>{announcement.is_featured && <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">Destacado</span>}</div><h3 className="mt-2 truncate text-lg font-black text-slate-950 dark:text-white">{announcement.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{announcement.summary || announcement.body || 'Sin resumen.'}</p>{announcement.event && <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300"><CalendarDays size={14} /> {announcement.event.title} · {formatDate(announcement.event.start_date)}</p>}</div><div className="flex shrink-0 items-center gap-2 sm:flex-col"><Button type="button" size="icon-sm" variant="outline" onClick={() => editAnnouncement(announcement)} aria-label="Editar anuncio"><Edit3 size={15} /></Button>{canEdit && <Button type="button" size="sm" variant={announcement.status === 'published' ? 'secondary' : 'default'} onClick={() => { void toggleStatus(announcement); }}>{announcement.status === 'published' ? 'Borrador' : 'Publicar'}</Button>}<Button type="button" size="icon-sm" variant="ghost" onClick={() => { void deleteAnnouncement(announcement); }} aria-label="Eliminar anuncio"><Trash2 size={15} /></Button></div></div></article>)}
      </section>
    </div>
  );
}
