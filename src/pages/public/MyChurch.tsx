import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CalendarDays, CheckCircle2, Clock3, HeartHandshake,
  MapPin, RefreshCw, UsersRound, WalletCards,
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { CHURCH_LOCATION } from '../../components/map/churchLocation';
import type { Schedule } from '../../types';

interface EventPreview {
  id: string;
  title: string;
  emoji: string | null;
  start_date: string;
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
}

interface GroupPreview {
  id: string;
  status: string;
  small_groups: {
    name: string;
    meeting_day: string;
    meeting_time: string;
    location_name: string | null;
  } | null;
}

interface ServicePreview {
  id: string;
  status: string;
  volunteer_shifts: {
    title: string;
    start_time: string;
    end_time: string;
    location: string | null;
  } | null;
}

interface MyChurchData {
  schedules: Schedule[];
  events: EventPreview[];
  groups: GroupPreview[];
  services: ServicePreview[];
}

const EMPTY_DATA: MyChurchData = { schedules: [], events: [], groups: [], services: [] };

function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-EC', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(year, month - 1, day));
}

function formatTime(value: string | null) {
  if (!value) return 'Hora por confirmar';
  const [hours, minutes] = value.split(':').map(Number);
  return new Intl.DateTimeFormat('es-EC', { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, hours, minutes));
}

export default function MyChurch() {
  const { user, member, firstName, lastName } = useAuth();
  const [data, setData] = useState<MyChurchData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [schedulesResult, eventsResult, groupsResult, servicesResult] = await Promise.all([
        supabase.from('schedules').select('*').order('order_index', { ascending: true }).limit(8),
        supabase.from('events').select('id,title,emoji,start_date,start_time,end_time,location_name').eq('is_public', true).gte('start_date', today).order('start_date', { ascending: true }).limit(4),
        supabase.from('group_memberships').select('id,status,small_groups(name,meeting_day,meeting_time,location_name)').eq('user_id', user.id).in('status', ['active', 'pending']).limit(4),
        member?.id
          ? supabase.from('volunteer_assignments').select('id,status,volunteer_shifts(title,start_time,end_time,location)').eq('member_id', member.id).in('status', ['pending', 'confirmed']).limit(4)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const firstError = schedulesResult.error || eventsResult.error || groupsResult.error || servicesResult.error;
      if (firstError) throw firstError;

      setData({
        schedules: (schedulesResult.data ?? []) as Schedule[],
        events: (eventsResult.data ?? []) as EventPreview[],
        groups: (groupsResult.data ?? []).map((group): GroupPreview => {
          const relatedGroup = Array.isArray(group.small_groups) ? group.small_groups[0] : group.small_groups;
          return {
            id: group.id,
            status: group.status,
            small_groups: relatedGroup ? {
              name: relatedGroup.name,
              meeting_day: relatedGroup.meeting_day,
              meeting_time: relatedGroup.meeting_time,
              location_name: relatedGroup.location_name,
            } : null,
          };
        }),
        services: (servicesResult.data ?? []) as ServicePreview[],
      });
    } catch (loadError) {
      console.error('No se pudo cargar Mi Iglesia:', loadError);
      setError('No pudimos cargar tu resumen. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [member, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  if (!user) {
    return (
      <>
        <Helmet><title>Mi Iglesia | Iglesia Jerusalén</title><meta name="description" content="Accede a tus horarios, grupos y próximos pasos en Iglesia Jerusalén." /></Helmet>
        <main className="min-h-[70vh] bg-[#f7f7f3] px-5 pb-20 pt-32 dark:bg-slate-950">
          <div className="mx-auto max-w-3xl rounded-[2rem] bg-[#071633] px-6 py-16 text-center text-white shadow-2xl sm:px-12">
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-400 text-slate-950"><UsersRound size={30} /></span>
            <p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-amber-300">Tu espacio personal</p>
            <h1 className="mt-3 font-serif text-4xl font-black sm:text-5xl">Todo lo que necesitas, en un solo lugar.</h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-blue-100/75">Inicia sesión para consultar tus grupos, oportunidades de servicio, eventos y horarios de Iglesia Jerusalén.</p>
            <Link to="/login?redirect=/mi-iglesia" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-3.5 text-sm font-black text-slate-950 transition hover:bg-amber-300">Ingresar a mi cuenta <ArrowRight size={17} /></Link>
            <p className="mt-5 text-xs text-blue-100/55">¿Es tu primera vez? <Link className="font-bold text-amber-300 underline underline-offset-4" to="/visita">Planifica tu visita</Link></p>
          </div>
        </main>
      </>
    );
  }

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'familia';

  return (
    <>
      <Helmet><title>Mi Iglesia | Iglesia Jerusalén</title><meta name="description" content="Tu resumen personal de horarios, grupos, eventos y servicio en Iglesia Jerusalén." /></Helmet>
      <main className="min-h-screen bg-[#f7f7f3] px-5 pb-24 pt-28 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="relative overflow-hidden rounded-[2rem] bg-[#071633] px-6 py-10 text-white shadow-2xl sm:px-10 sm:py-12">
            <div className="absolute -right-20 -top-24 size-72 rounded-full bg-amber-400/15 blur-3xl" />
            <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Mi Iglesia</p><h1 className="mt-3 max-w-3xl font-serif text-4xl font-black leading-tight sm:text-6xl">Hola, {displayName}.</h1><p className="mt-4 max-w-xl text-sm leading-7 text-blue-100/75">Aquí tienes tus próximos pasos y lo que está pasando en tu comunidad.</p></div><Link to="/eventos" className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold backdrop-blur hover:bg-white/15">Explorar agenda <ArrowRight size={16} /></Link></div>
          </section>

          {error && <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"><span>{error}</span><button type="button" onClick={() => void loadData()} className="inline-flex items-center gap-2 font-bold underline underline-offset-4"><RefreshCw size={15} /> Reintentar</button></div>}

          {loading ? <div className="mt-8 grid gap-5 md:grid-cols-3"><div className="h-44 animate-pulse rounded-3xl bg-slate-200 dark:bg-white/5" /><div className="h-44 animate-pulse rounded-3xl bg-slate-200 dark:bg-white/5" /><div className="h-44 animate-pulse rounded-3xl bg-slate-200 dark:bg-white/5" /></div> : <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-amber-600 dark:text-amber-400">Próximos eventos</p><h2 className="mt-2 font-serif text-2xl font-black">Tu agenda cercana</h2></div><CalendarDays className="text-amber-500" /></div><div className="mt-5 space-y-3">{data.events.length ? data.events.map((event) => <Link key={event.id} to={`/eventos?event=${event.id}`} className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-amber-300 hover:bg-amber-50/50 dark:border-white/10 dark:hover:bg-white/5"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-xl dark:bg-blue-500/10">{event.emoji || '📅'}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{event.title}</strong><small className="mt-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">{formatDate(event.start_date)} · {formatTime(event.start_time)}{event.location_name ? ` · ${event.location_name}` : ''}</small></span><ArrowRight size={16} className="shrink-0 text-slate-400" /></Link>) : <Empty text="No tienes eventos próximos publicados." href="/eventos" label="Ver agenda" />}</div></section>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-emerald-600 dark:text-emerald-400">Tu comunidad</p><h2 className="mt-2 font-serif text-2xl font-black">Grupos y servicio</h2></div><HeartHandshake className="text-emerald-500" /></div><div className="mt-5 space-y-3">{data.groups.map((group) => group.small_groups ? <div key={group.id} className="rounded-2xl border border-slate-100 p-4 dark:border-white/10"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{group.small_groups.name}</strong><span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black uppercase text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{group.status === 'pending' ? 'Pendiente' : 'Activo'}</span></div><p className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><Clock3 size={14} /> {group.small_groups.meeting_day} · {group.small_groups.meeting_time}</p></div> : null)}{data.services.map((service) => service.volunteer_shifts ? <div key={service.id} className="rounded-2xl border border-slate-100 p-4 dark:border-white/10"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{service.volunteer_shifts.title}</strong><CheckCircle2 size={17} className="text-emerald-500" /></div><p className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><Clock3 size={14} /> {formatTime(service.volunteer_shifts.start_time)} – {formatTime(service.volunteer_shifts.end_time)}</p></div> : null)}{!data.groups.length && !data.services.length && <Empty text="Todavía no tienes un grupo o servicio asignado." href="/mi-horario" label="Encontrar una oportunidad" />}</div></section>
          </div>}

          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><QuickAction icon={Clock3} title="Horarios" description="Consulta reuniones semanales" href="#horarios" /><QuickAction icon={UsersRound} title="Comunidad" description="Encuentra un grupo" href="/comunidad" /><QuickAction icon={HeartHandshake} title="Servir" description="Descubre oportunidades" href="/mi-horario" /><QuickAction icon={WalletCards} title="Generosidad" description="Gestiona tus aportes" href="/donaciones" /></section>

          <section id="horarios" className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-blue-700 dark:text-blue-300">Ritmo de la casa</p><h2 className="mt-2 font-serif text-2xl font-black">Horarios de reunión</h2></div><MapPin className="text-blue-700 dark:text-blue-300" /></div><div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">{data.schedules.length ? data.schedules.map((schedule) => <div key={schedule.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{schedule.day}</p><p className="mt-2 text-sm font-bold">{schedule.title}</p><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{schedule.time_range}</p></div>) : <Empty text="No hay horarios publicados." href="/eventos" label="Ver agenda" />}</div><a href={CHURCH_LOCATION.googleMapsUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-blue-800 underline decoration-amber-400 decoration-2 underline-offset-4 dark:text-blue-200"><MapPin size={14} /> {CHURCH_LOCATION.address}</a></section>
        </div>
      </main>
    </>
  );
}

function Empty({ text, href, label }: { text: string; href: string; label: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 p-4 dark:border-white/10"><p className="text-sm text-slate-500 dark:text-slate-400">{text}</p><Link to={href} className="mt-2 inline-flex items-center gap-1 text-xs font-black text-blue-800 dark:text-blue-200">{label} <ArrowRight size={13} /></Link></div>;
}

function QuickAction({ icon: Icon, title, description, href }: { icon: typeof Clock3; title: string; description: string; href: string }) {
  return <Link to={href} className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg dark:border-white/10 dark:bg-slate-900"><span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600 transition group-hover:bg-amber-400 group-hover:text-slate-950 dark:bg-amber-500/10 dark:text-amber-300"><Icon size={19} /></span><strong className="mt-4 block text-sm">{title}</strong><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{description}</span></Link>;
}
