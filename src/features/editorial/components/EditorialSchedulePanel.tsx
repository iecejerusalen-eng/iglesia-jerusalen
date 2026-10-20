import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock3, FileText, Megaphone, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../config/supabase';
import { usePermissions } from '../../../hooks/usePermissions';

type ScheduleEntry = {
  id: string;
  title: string;
  date: string;
  kind: 'activity' | 'announcement' | 'publication';
  href: string;
};

const dateInChurchTimezone = (date: Date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date);

const formatScheduleDate = (value: string) => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00-05:00`) : new Date(value);
  return new Intl.DateTimeFormat('es-EC', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' }).format(date);
};

export default function EditorialSchedulePanel() {
  const { hasPermission } = usePermissions();
  const canSeeEvents = hasPermission('events', 'view');
  const canSeeEditorial = hasPermission('editorial', 'view');
  const canSeePages = hasPermission('pages', 'view');
  const enabled = canSeeEvents || canSeeEditorial || canSeePages;
  const query = useQuery({
    queryKey: ['admin-editorial-schedule', canSeeEvents, canSeeEditorial],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const now = new Date();
      const from = now.toISOString();
      const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const today = dateInChurchTimezone(now);
      const endDay = dateInChurchTimezone(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));

      const [eventsResult, announcementsResult, publicationsResult, draftPublications, draftAnnouncements, reviewReadings, scheduledPublications, scheduledAnnouncements, publishedPublications, publishedAnnouncements] = await Promise.all([
        canSeeEvents
          ? supabase.from('events').select('id,title,start_date,start_time,is_public').eq('is_public', true).gte('start_date', today).lte('start_date', endDay).order('start_date').limit(12)
          : Promise.resolve({ data: [], error: null }),
        canSeeEditorial
          ? supabase.from('church_announcements').select('id,title,publish_at,status').eq('status', 'published').gt('publish_at', from).lte('publish_at', end).order('publish_at').limit(12)
          : Promise.resolve({ data: [], error: null }),
        canSeeEditorial
          ? supabase.from('editorial_documents').select('id,title,scheduled_at,status').eq('status', 'scheduled').gte('scheduled_at', from).lte('scheduled_at', end).order('scheduled_at').limit(12)
          : Promise.resolve({ data: [], error: null }),
        canSeeEditorial ? supabase.from('editorial_documents').select('id', { count: 'exact', head: true }).eq('status', 'draft') : Promise.resolve({ count: 0, error: null }),
        canSeeEditorial ? supabase.from('church_announcements').select('id', { count: 'exact', head: true }).eq('status', 'draft') : Promise.resolve({ count: 0, error: null }),
        canSeePages ? supabase.from('about_learning_drafts').select('slug', { count: 'exact', head: true }).eq('status', 'review') : Promise.resolve({ count: 0, error: null }),
        canSeeEditorial ? supabase.from('editorial_documents').select('id', { count: 'exact', head: true }).eq('status', 'scheduled') : Promise.resolve({ count: 0, error: null }),
        canSeeEditorial ? supabase.from('church_announcements').select('id', { count: 'exact', head: true }).eq('status', 'published').gt('publish_at', from) : Promise.resolve({ count: 0, error: null }),
        canSeeEditorial ? supabase.from('editorial_documents').select('id', { count: 'exact', head: true }).eq('status', 'published') : Promise.resolve({ count: 0, error: null }),
        canSeeEditorial ? supabase.from('church_announcements').select('id', { count: 'exact', head: true }).eq('status', 'published').lte('publish_at', from) : Promise.resolve({ count: 0, error: null }),
      ]);
      const countResults = [draftPublications, draftAnnouncements, reviewReadings, scheduledPublications, scheduledAnnouncements, publishedPublications, publishedAnnouncements];
      const error = eventsResult.error ?? announcementsResult.error ?? publicationsResult.error ?? countResults.find((item) => item.error)?.error;
      if (error) throw error;

      const entries: ScheduleEntry[] = [
        ...((eventsResult.data ?? []) as Array<{ id: string; title: string; start_date: string; start_time: string | null }>).map((item) => ({
          id: `event:${item.id}`, title: item.title, date: item.start_time ? `${item.start_date}T${item.start_time}-05:00` : item.start_date,
          kind: 'activity' as const, href: '/admin/eventos',
        })),
        ...((announcementsResult.data ?? []) as Array<{ id: string; title: string; publish_at: string }>).map((item) => ({
          id: `announcement:${item.id}`, title: item.title, date: item.publish_at, kind: 'announcement' as const, href: '/admin/anuncios',
        })),
        ...((publicationsResult.data ?? []) as Array<{ id: string; title: string; scheduled_at: string }>).map((item) => ({
          id: `publication:${item.id}`, title: item.title, date: item.scheduled_at, kind: 'publication' as const, href: '/admin/publicaciones',
        })),
      ];
      return {
        entries: entries.sort((a, b) => Date.parse(a.date) - Date.parse(b.date)).slice(0, 10),
        workflow: {
          draft: (draftPublications.count ?? 0) + (draftAnnouncements.count ?? 0),
          review: reviewReadings.count ?? 0,
          scheduled: (scheduledPublications.count ?? 0) + (scheduledAnnouncements.count ?? 0),
          published: (publishedPublications.count ?? 0) + (publishedAnnouncements.count ?? 0),
        },
      };
    },
  });

  if (!enabled) return null;
  const entries = query.data?.entries ?? [];
  const workflow = query.data?.workflow;

  return (
    <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60 sm:p-6" aria-labelledby="editorial-schedule-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-church-gold-emphasis">Agenda compartida</p>
          <h2 id="editorial-schedule-title" className="mt-1 font-serif text-xl font-bold text-slate-950 dark:text-white">Próximas publicaciones y actividades</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Programaciones visibles para tu rol durante los próximos 30 días.</p>
        </div>
        {canSeeEvents && <Link to="/admin/eventos" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 transition hover:border-gold/50 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/15 dark:text-slate-200">Abrir calendario <CalendarDays size={16} aria-hidden="true" /></Link>}
      </div>

      {(canSeeEditorial || canSeePages) && workflow && <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Estado del flujo editorial">
        {[
          { label: 'Borradores', count: workflow.draft, href: '/admin/publicaciones', visible: canSeeEditorial, tone: 'border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.03]' },
          { label: 'En revisión', count: workflow.review, href: '/admin/paginas/lecturas', visible: canSeePages, tone: 'border-amber-200 bg-amber-50/70 dark:border-amber-300/20 dark:bg-amber-300/[0.05]' },
          { label: 'Programados', count: workflow.scheduled, href: '/admin/publicaciones', visible: canSeeEditorial, tone: 'border-blue-200 bg-blue-50/70 dark:border-blue-300/20 dark:bg-blue-300/[0.05]' },
          { label: 'Publicados', count: workflow.published, href: '/admin/publicaciones', visible: canSeeEditorial, tone: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-300/20 dark:bg-emerald-300/[0.05]' },
        ].filter((item) => item.visible).map((item) => <Link key={item.label} to={item.href} className={`flex min-h-20 items-center justify-between gap-3 rounded-2xl border p-4 transition hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 ${item.tone}`}><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.label}</span><strong className="text-xl text-slate-950 dark:text-white">{item.count}</strong></Link>)}
      </div>}

      {query.isPending ? <p role="status" className="mt-5 rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-white/5">Cargando agenda compartida…</p> : query.isError ? (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
          <span>No se pudo cargar la agenda editorial. Tus accesos siguen disponibles.</span>
          <button type="button" onClick={() => void query.refetch()} className="inline-flex min-h-11 items-center gap-2 font-bold underline"><RefreshCw size={14} aria-hidden="true" /> Reintentar</button>
        </div>
      ) : entries.length ? (
        <ol className="mt-5 divide-y divide-slate-200 dark:divide-white/10">
          {entries.map((entry) => {
            const Icon = entry.kind === 'activity' ? CalendarDays : entry.kind === 'announcement' ? Megaphone : FileText;
            const label = entry.kind === 'activity' ? 'Actividad' : entry.kind === 'announcement' ? 'Anuncio' : 'Publicación';
            return <li key={entry.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-300/10 dark:text-amber-200"><Icon size={18} aria-hidden="true" /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{entry.title}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><Clock3 size={13} aria-hidden="true" /> {label} · {formatScheduleDate(entry.date)}</p></div>
              <Link to={entry.href} className="inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-bold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-church-gold-bright">Gestionar</Link>
            </li>;
          })}
        </ol>
      ) : <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center dark:border-white/15"><CalendarDays className="mx-auto text-slate-400" size={24} aria-hidden="true" /><p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">No hay publicaciones o actividades programadas para este período.</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Se consultaron las fuentes autorizadas para tu rol.</p></div>}
    </section>
  );
}
