import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock3, FileText, Loader2, Palette, Save, Settings2, ShieldCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';
import type { Event as ChurchEvent, Ministry, MinistryMeetingNote } from '../../../types';

interface MinistryOverviewProps {
  ministry: Ministry;
  canEdit: boolean;
  onUpdated: (ministry: Ministry) => void;
}

interface OverviewData {
  memberCount: number;
  upcomingEvents: ChurchEvent[];
  notes: MinistryMeetingNote[];
  availabilityCount: number;
}

interface OverviewForm {
  leader_name: string;
  schedule: string;
  anniversary_date: string;
  theme_color: string;
}

const EMPTY_DATA: OverviewData = { memberCount: 0, upcomingEvents: [], notes: [], availabilityCount: 0 };

function plainText(html: string | null): string {
  if (!html) return 'Aún no se ha registrado una descripción pública.';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function MinistryOverview({ ministry, canEdit, onUpdated }: MinistryOverviewProps) {
  const [data, setData] = useState<OverviewData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<OverviewForm>({
    leader_name: ministry.leader_name || '',
    schedule: ministry.schedule || '',
    anniversary_date: ministry.anniversary_date || '',
    theme_color: ministry.theme_color || '#1E3A8A',
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setForm({
      leader_name: ministry.leader_name || '',
      schedule: ministry.schedule || '',
      anniversary_date: ministry.anniversary_date || '',
      theme_color: ministry.theme_color || '#1E3A8A',
    }), 0);
    return () => window.clearTimeout(timer);
  }, [ministry]);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [membersResult, eventsResult, notesResult] = await Promise.all([
        supabase.from('ministry_members').select('member_id').eq('ministry_id', ministry.id),
        supabase.from('events').select('id, title, description, start_date, end_date, start_time, end_time, location_name, emoji, cover_image_url, is_public, is_recurring, leaders_in_charge, ministry_id, created_at').eq('ministry_id', ministry.id).gte('start_date', today).order('start_date').limit(5),
        supabase.from('ministry_meeting_notes').select('*').eq('ministry_id', ministry.id).order('date', { ascending: false }).limit(5),
      ]);

      if (membersResult.error) throw membersResult.error;
      if (eventsResult.error) throw eventsResult.error;
      if (notesResult.error) throw notesResult.error;

      const memberIds = (membersResult.data || [])
        .map((row) => row.member_id)
        .filter((memberId): memberId is string => typeof memberId === 'string');

      let availabilityCount = 0;
      if (memberIds.length > 0) {
        const availabilityResult = await supabase.from('member_availabilities').select('member_id').in('member_id', memberIds);
        if (availabilityResult.error) throw availabilityResult.error;
        availabilityCount = new Set((availabilityResult.data || []).map((row) => row.member_id)).size;
      }

      setData({
        memberCount: membersResult.data?.length || 0,
        upcomingEvents: eventsResult.data || [],
        notes: notesResult.data || [],
        availabilityCount,
      });
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : 'No fue posible consultar los indicadores.';
      console.error('Error loading ministry overview:', caughtError);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [ministry.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadOverview(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOverview]);

  const readinessItems = useMemo(() => [
    { label: 'Liderazgo definido', ready: Boolean(ministry.leader_name) },
    { label: 'Horario publicado', ready: Boolean(ministry.schedule) },
    { label: 'Descripción pública', ready: Boolean(ministry.description) },
    { label: 'Imagen institucional', ready: Boolean(ministry.image_url) },
    { label: 'Equipo registrado', ready: data.memberCount > 0 },
    { label: 'Próxima actividad', ready: data.upcomingEvents.length > 0 },
  ], [data.memberCount, data.upcomingEvents.length, ministry]);

  const readiness = Math.round((readinessItems.filter((item) => item.ready).length / readinessItems.length) * 100);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEdit || saving) return;
    setSaving(true);
    try {
      const payload = {
        leader_name: form.leader_name.trim() || null,
        schedule: form.schedule.trim() || null,
        anniversary_date: form.anniversary_date || null,
        theme_color: form.theme_color,
      };
      const { data: updated, error: updateError } = await supabase
        .from('ministries')
        .update(payload)
        .eq('id', ministry.id)
        .select('*')
        .single();
      if (updateError) throw updateError;
      onUpdated(updated);
      toast.success('Información operativa actualizada.');
    } catch (caughtError: unknown) {
      console.error('Error updating ministry overview:', caughtError);
      toast.error('No fue posible guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const metrics = [
    { label: 'Equipo', value: data.memberCount, helper: 'personas asignadas', icon: Users, tone: 'text-blue-600 bg-blue-500/10' },
    { label: 'Agenda', value: data.upcomingEvents.length, helper: 'próximas actividades', icon: CalendarDays, tone: 'text-emerald-600 bg-emerald-500/10' },
    { label: 'Disponibilidad', value: data.availabilityCount, helper: 'miembros configurados', icon: Clock3, tone: 'text-violet-600 bg-violet-500/10' },
    { label: 'Actas recientes', value: data.notes.length, helper: 'últimos registros', icon: FileText, tone: 'text-amber-600 bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-950/20 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between">
          <span>No se pudieron cargar los indicadores reales: {error}</span>
          <button type="button" onClick={() => void loadOverview()} className="font-bold underline">Reintentar</button>
        </div>
      )}

      <section aria-label="Indicadores del ministerio" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,.5)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65">
            <div className="flex items-start justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{metric.label}</p><strong className="mt-2 block text-3xl text-slate-900 dark:text-white">{loading ? '—' : metric.value}</strong></div>
              <span className={`rounded-2xl p-3 ${metric.tone}`}><metric.icon size={20} /></span>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{metric.helper}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <section className="rounded-3xl border border-white/70 bg-white/70 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-church-gold-dark dark:text-church-gold-light">Identidad pública</p><h2 className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">{ministry.name}</h2></div>
            <Link to="/admin/ministerios" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"><Settings2 size={14} /> Editor avanzado</Link>
          </div>
          <p className="mt-5 line-clamp-5 text-sm leading-7 text-slate-600 dark:text-slate-300">{plainText(ministry.description)}</p>

          <form onSubmit={handleSave} className="mt-6 grid gap-4 border-t border-slate-200/70 pt-6 dark:border-white/10 md:grid-cols-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Responsable
              <input value={form.leader_name} onChange={(event) => setForm((current) => ({ ...current, leader_name: event.target.value }))} disabled={!canEdit} placeholder="Nombre del líder o coordinador" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-primary dark:border-white/10 dark:bg-slate-950/60 dark:text-white" />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Horario habitual
              <input value={form.schedule} onChange={(event) => setForm((current) => ({ ...current, schedule: event.target.value }))} disabled={!canEdit} placeholder="Ej. Sábados, 18:00" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-primary dark:border-white/10 dark:bg-slate-950/60 dark:text-white" />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Aniversario
              <input type="date" value={form.anniversary_date} onChange={(event) => setForm((current) => ({ ...current, anniversary_date: event.target.value }))} disabled={!canEdit} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-primary dark:border-white/10 dark:bg-slate-950/60 dark:text-white" />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Color institucional
              <span className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-2 dark:border-white/10 dark:bg-slate-950/60"><Palette size={16} className="text-slate-400" /><input type="color" value={form.theme_color} onChange={(event) => setForm((current) => ({ ...current, theme_color: event.target.value }))} disabled={!canEdit} className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent" /><span className="text-xs font-normal normal-case tracking-normal text-slate-500">{form.theme_color}</span></span>
            </label>
            {canEdit && <div className="md:col-span-2 flex justify-end"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white shadow-lg shadow-primary/15 transition hover:bg-primary-dark disabled:opacity-50">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar información</button></div>}
          </form>
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/70 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Preparación administrativa</p><h2 className="mt-1 font-serif text-xl font-bold text-slate-900 dark:text-white">Estado del departamento</h2></div><span className="text-2xl font-bold text-primary dark:text-church-gold-light">{loading ? '—' : `${readiness}%`}</span></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-primary to-church-gold-medium transition-all" style={{ width: `${readiness}%` }} /></div>
          <ul className="mt-5 space-y-3">
            {readinessItems.map((item) => <li key={item.label} className="flex items-center justify-between text-sm"><span className="text-slate-600 dark:text-slate-300">{item.label}</span>{item.ready ? <CheckCircle2 size={17} className="text-emerald-500" /> : <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400 dark:bg-slate-800">Pendiente</span>}</li>)}
          </ul>
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/[0.04] p-4 text-xs leading-5 text-slate-500 dark:text-slate-400"><ShieldCheck size={18} className="shrink-0 text-primary dark:text-church-gold-light" /> Este indicador se calcula únicamente con información real registrada en el sistema.</div>
        </section>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/70 bg-white/70 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65">
          <h2 className="font-serif text-xl font-bold text-slate-900 dark:text-white">Próximas actividades</h2>
          <div className="mt-4 space-y-3">{data.upcomingEvents.length === 0 ? <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-400 dark:bg-slate-950/40">No hay actividades futuras registradas.</p> : data.upcomingEvents.map((event) => <div key={event.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 dark:border-white/5"><span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/8 text-primary dark:text-church-gold-light"><strong className="text-sm">{new Date(`${event.start_date}T12:00:00`).getDate()}</strong><span className="text-[9px] uppercase">{new Date(`${event.start_date}T12:00:00`).toLocaleDateString('es-EC', { month: 'short' })}</span></span><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800 dark:text-white">{event.title}</p><p className="text-xs text-slate-400">{event.start_time ? event.start_time.slice(0, 5) : 'Todo el día'} · {event.is_public ? 'Público' : 'Interno'}</p></div></div>)}</div>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/70 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65">
          <h2 className="font-serif text-xl font-bold text-slate-900 dark:text-white">Registro documental</h2>
          <div className="mt-4 space-y-3">{data.notes.length === 0 ? <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-400 dark:bg-slate-950/40">Todavía no existen actas de reunión.</p> : data.notes.map((note) => <div key={note.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4 dark:border-white/5"><div><p className="text-sm font-bold text-slate-700 dark:text-white">Acta del {new Date(`${note.date}T12:00:00`).toLocaleDateString('es-EC', { day: 'numeric', month: 'long' })}</p><p className="mt-1 text-xs text-slate-400">Actualizada {new Date(note.updated_at).toLocaleDateString('es-EC')}</p></div><FileText size={18} className="shrink-0 text-church-gold-medium" /></div>)}</div>
        </div>
      </section>
    </div>
  );
}
