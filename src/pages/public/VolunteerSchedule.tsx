import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  HandHeart,
  Heart,
  LogIn,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { VolunteerAssignment, VolunteerShift } from '../../types';
import { useConfirmStore } from '../../store/useConfirmStore';

const CATEGORY_META: Record<string, { label: string; emoji: string; tone: string }> = {
  cocina: { label: 'Cocina y hospitalidad', emoji: '🍲', tone: 'from-orange-500/15 to-amber-500/5' },
  limpieza: { label: 'Limpieza y orden', emoji: '✨', tone: 'from-sky-500/15 to-cyan-500/5' },
  mantenimiento: { label: 'Mantenimiento', emoji: '🛠️', tone: 'from-slate-500/15 to-zinc-500/5' },
  pintura: { label: 'Pintura y espacios', emoji: '🎨', tone: 'from-violet-500/15 to-fuchsia-500/5' },
  ninos: { label: 'Niños y familias', emoji: '🧩', tone: 'from-emerald-500/15 to-teal-500/5' },
  medios: { label: 'Medios y producción', emoji: '🎥', tone: 'from-indigo-500/15 to-blue-500/5' },
  bienvenida: { label: 'Bienvenida', emoji: '🤝', tone: 'from-rose-500/15 to-pink-500/5' },
  general: { label: 'Servicio general', emoji: '💛', tone: 'from-amber-500/15 to-yellow-500/5' },
};

const inferCategory = (shift: VolunteerShift) => {
  if (shift.category && CATEGORY_META[shift.category]) return shift.category;
  const text = `${shift.title} ${shift.description ?? ''}`.toLocaleLowerCase('es');
  if (/cocin|comida|café|hospitalidad/.test(text)) return 'cocina';
  if (/limp|aseo|orden/.test(text)) return 'limpieza';
  if (/eléctric|repar|manten|instala/.test(text)) return 'mantenimiento';
  if (/pint/.test(text)) return 'pintura';
  if (/niñ|famil/.test(text)) return 'ninos';
  if (/audio|video|foto|stream|producci/.test(text)) return 'medios';
  if (/bienven|ujier|recibir/.test(text)) return 'bienvenida';
  return 'general';
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' });
const formatTime = (value: string) => new Date(value).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

export default function VolunteerSchedule() {
  const { user, member } = useAuth();
  const confirm = useConfirmStore((state) => state.confirm);
  const [shifts, setShifts] = useState<VolunteerShift[]>([]);
  const [myAssignments, setMyAssignments] = useState<VolunteerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [busyShift, setBusyShift] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('volunteer_shifts')
        .select('*, ministries(name, theme_color)')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });
      if (shiftsError) throw shiftsError;
      setShifts(shiftsData ?? []);

      if (member?.id) {
        const { data, error } = await supabase.from('volunteer_assignments').select('*').eq('member_id', member.id);
        if (error) throw error;
        setMyAssignments(data ?? []);
      } else {
        setMyAssignments([]);
      }
    } catch (error) {
      console.error('No se pudieron cargar las oportunidades de servicio:', error);
      toast.error('No pudimos cargar las oportunidades de servicio.');
    } finally {
      setLoading(false);
    }
  }, [member]);

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.resolve().then(() => loadData());
  }, [loadData]);

  const visibleShifts = useMemo(() => shifts.filter((shift) => {
    const term = search.trim().toLocaleLowerCase('es');
    const matchesText = !term || `${shift.title} ${shift.description ?? ''} ${shift.ministries?.name ?? ''} ${(shift.skills_needed ?? []).join(' ')}`.toLocaleLowerCase('es').includes(term);
    return matchesText && (category === 'all' || inferCategory(shift) === category);
  }), [category, search, shifts]);

  const register = async (shiftId: string) => {
    if (!user) {
      toast.error('Inicia sesión para sumarte a esta oportunidad.');
      return;
    }
    if (!member?.id) {
      toast.error('Tu cuenta aún no está vinculada a una ficha de miembro.');
      return;
    }
    setBusyShift(shiftId);
    try {
      const { error } = await supabase.from('volunteer_assignments').insert({ shift_id: shiftId, member_id: member.id, status: 'pending' });
      if (error?.code === '23505') {
        toast.error('Ya enviaste una solicitud para esta oportunidad.');
        return;
      }
      if (error) throw error;
      toast.success('Solicitud enviada. Un líder conversará contigo antes de confirmar.');
      await loadData();
    } catch (error) {
      console.error('No se pudo registrar la solicitud de servicio:', error);
      toast.error('No pudimos enviar tu solicitud.');
    } finally {
      setBusyShift(null);
    }
  };

  const cancel = async (assignmentId: string) => {
    const accepted = await confirm({ title: 'Retirar solicitud', message: 'Dejarás de estar apuntado a esta oportunidad.', confirmText: 'Retirar', variant: 'warning' });
    if (!accepted) return;
    try {
      const { error } = await supabase.from('volunteer_assignments').delete().eq('id', assignmentId);
      if (error) throw error;
      toast.success('Solicitud retirada.');
      await loadData();
    } catch (error) {
      console.error('No se pudo retirar la solicitud:', error);
      toast.error('No pudimos retirar tu solicitud.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Quiero servir | Iglesia Jerusalén</title>
        <meta name="description" content="Descubre oportunidades concretas para servir con tus dones, talentos y habilidades en la Iglesia Jerusalén." />
      </Helmet>

      <main className="min-h-screen bg-surface pb-24 pt-28 dark:bg-slate-950">
        <section id="volunteer_hero" className="px-4 scroll-mt-28">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-white/15 bg-[linear-gradient(135deg,#172554,#312e81_55%,#0f172a)] px-6 py-12 text-white shadow-2xl md:px-12 md:py-16">
            <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-church-gold/25 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] backdrop-blur-xl"><HandHeart size={15} className="text-church-gold-bright" /> Todos podemos servir</span>
                <h1 className="mt-5 max-w-3xl font-serif text-4xl font-bold leading-[1.05] md:text-6xl">Lo cotidiano también puede convertirse en <span className="text-church-gold-bright">ministerio.</span></h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100/80">Cocinar, limpiar, pintar, reparar, recibir, enseñar o producir: encuentra una necesidad concreta, sirve de forma saludable y hazlo junto a una comunidad.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl"><p className="text-3xl font-black">{shifts.length}</p><p className="mt-1 text-xs text-blue-100/70">oportunidades abiertas</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl"><p className="text-3xl font-black">{new Set(shifts.map(inferCategory)).size}</p><p className="mt-1 text-xs text-blue-100/70">formas diferentes de ayudar</p></div>
              </div>
            </div>
          </div>
        </section>

        <section id="volunteer_roster" className="mx-auto mt-10 max-w-7xl px-4 scroll-mt-28">
          <div className="glass-card rounded-[1.75rem] p-4 md:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative flex-1"><span className="sr-only">Buscar oportunidades</span><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Busca cocina, pintura, electricidad, niños…" className="h-12 w-full rounded-xl border border-slate-200 bg-white/70 pl-11 pr-10 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-slate-950/60" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Limpiar búsqueda" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={17} /></button>}</label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:max-w-[58%]"><span className="sticky left-0 inline-flex items-center gap-1.5 bg-white/80 px-2 text-xs font-bold text-slate-400 backdrop-blur dark:bg-slate-900/80"><Filter size={14} /> Tipo</span>{[['all', 'Todos'], ...Object.entries(CATEGORY_META).map(([key, value]) => [key, value.label])].map(([key, label]) => <button key={key} type="button" onClick={() => setCategory(key)} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-bold ${category === key ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white/70 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}>{label}</button>)}</div>
            </div>
          </div>

          <div className={`mt-6 grid gap-6 ${user ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
            <div>
              <div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary dark:text-church-gold-bright">Necesidades abiertas</p><h2 className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">Encuentra dónde puedes aportar</h2></div><span className="text-xs font-bold text-slate-400">{visibleShifts.length} resultados</span></div>
              {loading ? <div className="grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-3xl bg-slate-200/60 dark:bg-white/5" />)}</div> : visibleShifts.length ? (
                <div className={`grid gap-4 ${user ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
                  {visibleShifts.map((shift) => {
                    const key = inferCategory(shift);
                    const meta = CATEGORY_META[key];
                    const assignment = myAssignments.find((item) => item.shift_id === shift.id);
                    return <article key={shift.id} className={`group relative overflow-hidden rounded-[1.65rem] border border-slate-200/80 bg-gradient-to-br ${meta.tone} bg-white p-5 shadow-[0_20px_60px_-44px_rgba(15,23,42,.8)] transition hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl dark:border-white/10 dark:bg-slate-900`}>
                      <div className="flex items-start justify-between gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/70 bg-white/75 text-2xl shadow-sm dark:border-white/10 dark:bg-white/10">{meta.emoji}</span>{assignment && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><CheckCircle2 size={12} /> {assignment.status === 'pending' ? 'Solicitado' : 'Confirmado'}</span>}</div>
                      <p className="mt-4 text-[10px] font-black uppercase tracking-[.14em] text-primary/70 dark:text-church-gold-bright">{meta.label}</p><h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">{shift.title}</h3><p className="mt-2 line-clamp-3 min-h-[3.75rem] text-sm leading-5 text-slate-500 dark:text-slate-400">{shift.description || 'Una oportunidad concreta para aportar tiempo, cuidado y experiencia.'}</p>
                      <div className="mt-4 space-y-2 border-t border-slate-200/70 pt-4 text-xs font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300"><p className="flex items-center gap-2"><Calendar size={14} className="text-primary" /> {formatDate(shift.start_time)}</p><p className="flex items-center gap-2"><Clock size={14} className="text-primary" /> {formatTime(shift.start_time)} – {formatTime(shift.end_time)}</p><p className="flex items-center gap-2"><Users size={14} className="text-primary" /> Equipo planeado para {shift.required_volunteers} persona(s)</p>{shift.location && <p className="flex items-center gap-2"><MapPin size={14} className="text-primary" /> {shift.location}</p>}</div>
                      {(shift.skills_needed?.length ?? 0) > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{shift.skills_needed?.slice(0, 4).map((skill) => <span key={skill} className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-200">{skill}</span>)}</div>}
                      <button type="button" disabled={Boolean(assignment) || busyShift === shift.id} onClick={() => void register(shift.id)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/15 transition hover:bg-blue-900 disabled:cursor-default disabled:bg-emerald-600"><span>{assignment ? 'Solicitud enviada' : user ? 'Quiero conversar' : 'Ingresar para sumarme'}</span>{user ? <ArrowRight size={16} /> : <LogIn size={16} />}</button>
                    </article>;
                  })}
                </div>
              ) : <div className="rounded-3xl border border-dashed border-slate-300 bg-white/50 py-16 text-center dark:border-white/10 dark:bg-white/[.02]"><Search className="mx-auto text-slate-300" size={38} /><h3 className="mt-4 font-bold text-slate-700 dark:text-slate-200">No encontramos oportunidades con estos filtros.</h3><button type="button" onClick={() => { setSearch(''); setCategory('all'); }} className="mt-3 text-sm font-bold text-primary dark:text-church-gold-bright">Ver todas</button></div>}
            </div>

            {user && <aside id="volunteer_signups" className="scroll-mt-28"><div className="sticky top-24 rounded-[1.75rem] border border-indigo-100 bg-indigo-50/80 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white"><Heart size={18} /></span><div><p className="font-bold text-slate-900 dark:text-white">Mi servicio</p><p className="text-xs text-slate-500">Solicitudes y confirmaciones</p></div></div><div className="mt-5 space-y-3">{myAssignments.length ? myAssignments.map((assignment) => { const shift = shifts.find((item) => item.id === assignment.shift_id); if (!shift) return null; return <div key={assignment.id} className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70"><p className="font-bold text-slate-900 dark:text-white">{shift.title}</p><p className="mt-1 text-xs text-slate-500">{formatDate(shift.start_time)} · {formatTime(shift.start_time)}</p><div className="mt-3 flex items-center justify-between"><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${assignment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{assignment.status === 'confirmed' ? 'Confirmado' : 'En conversación'}</span><button type="button" onClick={() => void cancel(assignment.id)} className="text-[10px] font-bold text-red-500">Retirar</button></div></div>; }) : <p className="rounded-2xl bg-white/70 p-4 text-sm leading-6 text-slate-500 dark:bg-white/5">Todavía no has solicitado una oportunidad. Elige una que conecte con tu disponibilidad.</p>}</div></div></aside>}
          </div>
        </section>

        {!user && <section className="mx-auto mt-10 max-w-7xl px-4"><div className="flex flex-col items-center justify-between gap-5 rounded-[1.75rem] border border-church-gold/25 bg-[linear-gradient(120deg,rgba(199,157,63,.13),rgba(30,58,138,.08))] p-6 text-center md:flex-row md:text-left"><div className="flex flex-col items-center gap-4 md:flex-row"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-primary shadow-md dark:bg-white/10 dark:text-church-gold-bright"><ShieldCheck /></span><div><h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">Tu información de servicio es privada</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Puedes explorar sin cuenta. Al ingresar, solo tú y el equipo autorizado verán tus solicitudes.</p></div></div><Link to="/login" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">Iniciar sesión <ArrowRight size={16} /></Link></div></section>}

        <section className="mx-auto mt-10 grid max-w-7xl gap-4 px-4 md:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white/65 p-5 dark:border-white/10 dark:bg-white/5"><Sparkles className="text-violet-500" /><h3 className="mt-3 font-bold text-slate-900 dark:text-white">No necesitas un título</h3><p className="mt-1 text-sm leading-6 text-slate-500">Muchas necesidades se resuelven con disposición, acompañamiento y una habilidad cotidiana.</p></div><div className="rounded-2xl border border-slate-200 bg-white/65 p-5 dark:border-white/10 dark:bg-white/5"><Wrench className="text-sky-500" /><h3 className="mt-3 font-bold text-slate-900 dark:text-white">Tareas claras y reales</h3><p className="mt-1 text-sm leading-6 text-slate-500">Cada oportunidad indica cuándo, qué se necesita y con qué equipo vas a servir.</p></div><div className="rounded-2xl border border-slate-200 bg-white/65 p-5 dark:border-white/10 dark:bg-white/5"><Heart className="text-rose-500" /><h3 className="mt-3 font-bold text-slate-900 dark:text-white">Servir también requiere descanso</h3><p className="mt-1 text-sm leading-6 text-slate-500">Pedir una pausa o decir “esta vez no puedo” forma parte de una cultura sana.</p></div></section>
      </main>
    </>
  );
}
