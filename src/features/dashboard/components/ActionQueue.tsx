import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '../../../config/supabase';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuthStore } from '../../../store/useAuthStore';
import { expiredAnnouncementCount } from '../../announcements/adminHealth';

interface PendingItem { label: string; count: number; href: string }
export default function ActionQueue() {
  const { hasPermission } = usePermissions();
  const userId = useAuthStore(state => state.user?.id);
  const chat = hasPermission('chat', 'view'); const pages = hasPermission('pages', 'view'); const editorial = hasPermission('editorial', 'view');
  const query = useQuery({ queryKey: ['admin-action-queue', userId, chat, pages, editorial], enabled: Boolean(userId), staleTime: 60000, queryFn: async () => {
    const items: PendingItem[] = [];
    if (chat) {
      const unread = await supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'unread');
      if (unread.error) throw unread.error;
      items.push({ label: 'Mensajes sin leer', count: unread.count ?? 0, href: '/admin/comunicaciones' });
      const due = await supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('assigned_to', userId!).neq('followup_stage', 'completed').lte('followup_due_at', new Date().toISOString());
      if (due.error) throw due.error;
      items.push({ label: 'Mis seguimientos vencidos', count: due.count ?? 0, href: '/admin/comunicaciones?seguimiento=mine' });
      const assigned = await supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('assigned_to', userId!).neq('followup_stage','completed');
      if (assigned.error) throw assigned.error;
      items.push({ label: 'Solicitudes asignadas a mí', count: assigned.count ?? 0, href: '/admin/comunicaciones?seguimiento=mine' });
    }
    if (pages) {
      const review = await supabase.from('about_learning_drafts').select('slug', { count: 'exact', head: true }).eq('status', 'review');
      if (review.error) throw review.error;
      items.push({ label: 'Lecturas para revisar', count: review.count ?? 0, href: '/admin/paginas/lecturas' });
    }
    if (editorial) {
      items.push({ label: 'Anuncios publicados vencidos', count: await expiredAnnouncementCount(), href: '/admin/anuncios' });
    }
    return items;
  } });
  if (!chat && !pages && !editorial) return null;
  return <section className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60" aria-labelledby="admin-pending-title"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="admin-pending-title" className="font-serif text-xl font-bold">Lo que necesita atención</h2><button disabled={query.isFetching} onClick={() => void query.refetch()} className="min-h-11 px-3 text-sm font-semibold underline">Actualizar</button></div>{query.isPending ? <p role="status">Consultando pendientes…</p> : query.isError ? <p role="alert" className="text-sm text-red-700 dark:text-red-300">No se pudieron consultar los pendientes. Intenta actualizar.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{query.data?.map(item => <Link key={item.label} to={item.href} className="flex min-h-20 items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 hover:border-blue-400 focus-visible:ring-2 dark:border-white/15"><span className="text-sm font-semibold">{item.label}</span><strong className={`text-2xl ${item.count ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500'}`}>{item.count}</strong></Link>)}</div>}</section>;
}
