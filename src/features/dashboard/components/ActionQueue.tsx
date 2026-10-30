import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '../../../config/supabase';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuthStore } from '../../../store/useAuthStore';
import { expiredAnnouncementCount } from '../../announcements/adminHealth';

interface PendingItem { label: string; detail: string; count: number; href: string; level: 'urgent' | 'review' | 'followup' }

const guayaquilToday = (value: Date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(value);

export default function ActionQueue() {
  const { hasPermission } = usePermissions();
  const userId = useAuthStore(state => state.user?.id);
  const chat = hasPermission('chat', 'view'); const pages = hasPermission('pages', 'view'); const editorial = hasPermission('editorial', 'view');
  const events = hasPermission('events', 'view');
  const query = useQuery({ queryKey: ['admin-action-queue', userId, chat, pages, editorial, events], enabled: Boolean(userId), staleTime: 60000, queryFn: async () => {
    const items: PendingItem[] = [];
    const errors: string[] = [];
    if (chat) {
      try {
        const unread = await supabase.from('contact_messages').select('id', { count: 'exact' }).eq('status', 'unread').order('created_at', { ascending: true }).limit(1);
        if (unread.error) throw unread.error;
        const unreadHref = unread.data?.[0] ? `/admin/comunicaciones?estado=unread&record=${unread.data[0].id}` : '/admin/comunicaciones?estado=unread';
        items.push({ label: 'Mensajes sin leer', detail: 'Aún no tienen una primera lectura.', count: unread.count ?? 0, href: unreadHref, level: 'followup' });
      } catch (error) { console.error('No se pudo consultar la bandeja sin leer:', error); errors.push('mensajes sin leer'); }
      try {
        const due = await supabase.from('contact_messages').select('id', { count: 'exact' }).eq('assigned_to', userId!).neq('followup_stage', 'completed').lte('followup_due_at', new Date().toISOString()).order('followup_due_at', { ascending: true }).limit(1);
        if (due.error) throw due.error;
        const dueHref = due.data?.[0] ? `/admin/comunicaciones?seguimiento=due&record=${due.data[0].id}` : '/admin/comunicaciones?seguimiento=due';
        items.push({ label: 'Mis seguimientos vencidos', detail: 'Revisa las solicitudes con fecha pendiente.', count: due.count ?? 0, href: dueHref, level: 'urgent' });
      } catch (error) { console.error('No se pudieron consultar seguimientos vencidos:', error); errors.push('seguimientos vencidos'); }
      try {
        const assigned = await supabase.from('contact_messages').select('id', { count: 'exact' }).eq('assigned_to', userId!).neq('followup_stage','completed').order('created_at', { ascending: true }).limit(1);
        if (assigned.error) throw assigned.error;
        const assignedHref = assigned.data?.[0] ? `/admin/comunicaciones?seguimiento=mine&record=${assigned.data[0].id}` : '/admin/comunicaciones?seguimiento=mine';
        items.push({ label: 'Solicitudes asignadas a mí', detail: 'Casos que están bajo tu responsabilidad.', count: assigned.count ?? 0, href: assignedHref, level: 'followup' });
      } catch (error) { console.error('No se pudieron consultar solicitudes asignadas:', error); errors.push('solicitudes asignadas'); }
    }
    if (pages) {
      try {
        const review = await supabase.from('about_learning_drafts').select('slug', { count: 'exact', head: true }).eq('status', 'review');
        if (review.error) throw review.error;
        items.push({ label: 'Lecturas para revisar', detail: 'Esperan revisión pastoral antes de publicarse.', count: review.count ?? 0, href: '/admin/paginas/lecturas', level: 'review' });
      } catch (error) { console.error('No se pudieron consultar lecturas en revisión:', error); errors.push('lecturas para revisar'); }
    }
    if (editorial) {
      try { items.push({ label: 'Anuncios publicados vencidos', detail: 'Confirma si deben actualizarse o archivarse.', count: await expiredAnnouncementCount(), href: '/admin/anuncios', level: 'urgent' }); }
      catch (error) { console.error('No se pudieron consultar anuncios vencidos:', error); errors.push('anuncios vencidos'); }
      try {
        const drafts = await supabase.from('editorial_documents').select('id', { count: 'exact', head: true }).eq('status', 'draft');
        if (drafts.error) throw drafts.error;
        items.push({ label: 'Publicaciones en borrador', detail: 'Puedes continuar su edición en el centro editorial.', count: drafts.count ?? 0, href: '/admin/publicaciones', level: 'review' });
      } catch (error) { console.error('No se pudieron consultar publicaciones en borrador:', error); errors.push('publicaciones en borrador'); }
      try {
        const overdue = await supabase.from('editorial_documents').select('id', { count: 'exact', head: true }).eq('status', 'scheduled').lt('scheduled_at', new Date().toISOString());
        if (overdue.error) throw overdue.error;
        items.push({ label: 'Publicaciones atrasadas', detail: 'La fecha programada ya pasó; revisa su estado.', count: overdue.count ?? 0, href: '/admin/publicaciones', level: 'urgent' });
      } catch (error) { console.error('No se pudieron consultar publicaciones programadas:', error); errors.push('publicaciones atrasadas'); }
    }
    if (events) {
      try {
        const day = guayaquilToday(new Date());
        const start = new Date(`${day}T00:00:00-05:00`).toISOString();
        const nextDay = new Date(new Date(`${day}T00:00:00-05:00`).getTime() + 24 * 60 * 60 * 1000).toISOString();
        const agenda = await supabase.from('agenda_items').select('id', { count: 'exact', head: true }).eq('usuario_id', userId!).neq('estado', 'cancelado').gte('fecha_inicio', start).lt('fecha_inicio', nextDay);
        if (agenda.error) throw agenda.error;
        items.push({ label: 'Actividades de mi agenda hoy', detail: 'Tu agenda es privada y muestra solo tus actividades.', count: agenda.count ?? 0, href: '/admin/agenda', level: 'followup' });
      } catch (error) { console.error('No se pudo consultar la agenda privada:', error); errors.push('agenda de hoy'); }
    }
    return { items, errors };
  } });
  if (!chat && !pages && !editorial && !events) return null;
  const pending = (query.data?.items ?? []).filter((item) => item.count > 0);
  const sourceErrors = query.data?.errors ?? [];
  // Categories can overlap (for example, unread messages can also be assigned
  // follow-ups), so do not present their sum as a unique task count.
  const categoriesNeedingAttention = pending.length;
  const levelStyles = {
    urgent: 'border-rose-200/80 bg-rose-50/70 dark:border-rose-400/20 dark:bg-rose-400/[0.06]',
    review: 'border-amber-200/80 bg-amber-50/70 dark:border-amber-300/20 dark:bg-amber-300/[0.05]',
    followup: 'border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]',
  };
  return <section className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60 sm:p-6" aria-labelledby="admin-pending-title">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-church-gold-emphasis">Bandeja de trabajo</p><h2 id="admin-pending-title" className="mt-1 font-serif text-xl font-bold">Lo que necesita atención</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{categoriesNeedingAttention ? `${categoriesNeedingAttention} categorías necesitan atención en tus áreas autorizadas.` : 'Resumen de tareas, seguimientos y revisiones asignadas a tus permisos.'}</p></div><button type="button" disabled={query.isFetching} onClick={() => void query.refetch()} className="min-h-11 rounded-xl px-3 text-sm font-semibold underline disabled:opacity-50">{query.isFetching ? 'Actualizando…' : 'Actualizar'}</button></div>
    {query.isPending ? <p role="status" className="mt-4 rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500 dark:bg-white/5">Consultando pendientes autorizados…</p> : query.isError ? <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">No se pudieron consultar las tareas. Intenta actualizar.</p> : <>
      {sourceErrors.length > 0 && <p role="alert" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">No se pudieron consultar: {sourceErrors.join(', ')}. Los demás resultados siguen disponibles; actualiza para reintentar.</p>}
      {pending.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{pending.map(item => <Link key={item.label} to={item.href} className={`group flex min-h-28 items-start justify-between gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${levelStyles[item.level]}`}><span className="min-w-0"><strong className="block text-sm text-slate-900 dark:text-white">{item.label}</strong><span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">{item.detail}</span></span><strong className={`grid size-9 shrink-0 place-items-center rounded-xl text-lg ${item.level === 'urgent' ? 'bg-rose-600/10 text-rose-700 dark:text-rose-300' : item.level === 'review' ? 'bg-amber-500/10 text-amber-800 dark:text-amber-200' : 'bg-primary/10 text-primary dark:text-church-gold-bright'}`}>{item.count}</strong></Link>)}</div> : sourceErrors.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-emerald-300/80 bg-emerald-50/60 p-5 text-sm text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-300/[0.05] dark:text-emerald-100"><strong>Sin pendientes críticos.</strong><span className="ml-1">Tus tareas se consultaron según los permisos asignados.</span></div> : null}
    </>}
  </section>;
}
