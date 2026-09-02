import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Accessibility, ArrowRight, Baby, Car, Check,
  ChevronDown, Clock3, ExternalLink, HeartHandshake, MapPin,
  MessageCircle, Send, Shirt, Sparkles, UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { CHURCH_LOCATION } from '../../components/map/churchLocation';
import churchFacadePhoto from '../../assets/Jerusalén/Fachada Iglesia Jerusalén.jpg';
import type { Event as DbEvent, Schedule } from '../../types';
import { formatEventDateRange, formatEventTime } from '../../features/events/utils/eventPresentation';
import { toast } from 'sonner';

type VisitForm = {
  fullName: string;
  phone: string;
  email: string;
  visitDate: string;
  needs: string[];
  notes: string;
};

const INITIAL_FORM: VisitForm = {
  fullName: '', phone: '', email: '', visitDate: '', needs: [], notes: '',
};

const NEEDS = [
  { id: 'children', label: 'Voy con niños', icon: Baby },
  { id: 'accessibility', label: 'Necesito accesibilidad', icon: Accessibility },
  { id: 'parking', label: 'Necesito parqueo', icon: Car },
  { id: 'questions', label: 'Tengo preguntas', icon: MessageCircle },
] as const;

const FAQS = [
  ['¿Qué debo llevar?', 'Solo ven como eres. Si vienes con niños, nuestro equipo te orientará al llegar.'],
  ['¿Cómo debo vestirme?', 'No tenemos un código de vestimenta. Encontrarás personas vestidas de distintas maneras.'],
  ['¿Puedo ir sin registrarme?', 'Claro. El registro es opcional y nos ayuda a prepararnos para recibirte mejor.'],
  ['¿Dónde está la iglesia?', CHURCH_LOCATION.address],
] as const;

const VISIT_STEPS: ReadonlyArray<{ number: string; title: string; description: string; icon: LucideIcon }> = [
  { number: '01', title: 'Consulta', description: 'Mira horarios y encuentra el momento que mejor te funcione.', icon: Clock3 },
  { number: '02', title: 'Prepárate', description: 'Cuéntanos si vienes con niños o necesitas alguna ayuda.', icon: Baby },
  { number: '03', title: 'Conecta', description: 'Al llegar, nuestro equipo te ayudará a ubicarte sin presión.', icon: HeartHandshake },
];

function useVisitData() {
  const schedules = useQuery({
    queryKey: ['publicVisitSchedules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('schedules').select('id, day, title, time_range, description, order_index, created_at').order('order_index', { ascending: true });
      if (error) throw error;
      return data ? data as Schedule[] : [];
    },
    staleTime: 5 * 60 * 1000,
  });
  const events = useQuery({
    queryKey: ['publicVisitEvents'],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, start_date, end_date, start_time, end_time, is_recurring, recurrence_type, recurrence_days, cover_image_url, emoji, ministry_id, leaders_in_charge, is_public, space_id, created_at, ministries(name, slug, theme_color)')
        .eq('is_public', true)
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(3);
      if (error) throw error;
      return (data ?? []).map((event) => ({
        ...event,
        ministries: Array.isArray(event.ministries) ? event.ministries[0] ?? null : event.ministries,
      })) as DbEvent[];
    },
    staleTime: 5 * 60 * 1000,
  });
  return { schedules, events };
}

export default function PlanYourVisit() {
  const { schedules, events } = useVisitData();
  const [form, setForm] = useState<VisitForm>(INITIAL_FORM);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const groupedSchedules = useMemo(() => {
    const groups = new Map<string, Schedule[]>();
    (schedules.data ?? []).forEach((schedule) => {
      const current = groups.get(schedule.day) ?? [];
      current.push(schedule);
      groups.set(schedule.day, current);
    });
    return [...groups.entries()];
  }, [schedules.data]);

  const toggleNeed = (id: string) => {
    setForm((current) => ({
      ...current,
      needs: current.needs.includes(id) ? current.needs.filter((need) => need !== id) : [...current.needs, id],
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error('Completa tu nombre y teléfono para continuar.');
      setFormStep(1);
      return;
    }
    setSubmitting(true);
    try {
      const needsLabel = form.needs.length > 0 ? form.needs.join(', ') : 'Sin necesidad específica';
      const { error } = await supabase.from('contact_messages').insert([{
        full_name: form.fullName.trim(), email: form.email.trim() || null, phone: form.phone.trim(),
        subject: 'Planifica tu visita',
        message: `Fecha prevista: ${form.visitDate || 'Por confirmar'}\nNecesidades: ${needsLabel}\nNotas: ${form.notes.trim() || 'Ninguna'}`,
        status: 'unread',
      }]);
      if (error) throw error;
      setSubmitted(true);
      toast.success('Tu visita quedó registrada. ¡Te esperamos!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pudimos registrar tu visita. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Planifica tu visita | Iglesia Jerusalén</title>
        <meta name="description" content="Descubre qué esperar, consulta horarios y planifica tu primera visita a Iglesia Jerusalén en Milagro." />
        <meta property="og:title" content="Planifica tu visita | Iglesia Jerusalén" />
        <meta property="og:description" content="Todo lo que necesitas para sentirte en casa desde el primer día." />
      </Helmet>

      <main className="bg-[#f7f7f3] text-slate-950 dark:bg-slate-950 dark:text-white">
        <section className="relative isolate overflow-hidden bg-[#071633] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(201,157,63,.24),transparent_34%),linear-gradient(115deg,#071633_10%,#112d55_62%,#183e66)]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:gap-16">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3.5 py-2 text-[10px] font-black uppercase tracking-[.2em] text-amber-200">
                <Sparkles size={14} /> Tu primera visita
              </span>
              <h1 className="mt-6 max-w-2xl font-serif text-5xl font-black leading-[.98] tracking-tight sm:text-7xl">
                Ven como eres.<br /><span className="text-amber-300">Siéntete en casa.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-blue-100/80 sm:text-lg">
                Queremos que sepas qué esperar antes de cruzar la puerta. Encuentra horarios, ubicación y una forma sencilla de avisarnos que vienes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#planifica" className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3.5 text-sm font-black text-slate-950 shadow-xl shadow-amber-950/20 transition hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200">
                  Quiero visitar <ArrowRight size={17} />
                </a>
                <a href={CHURCH_LOCATION.googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200">
                  <MapPin size={17} /> Cómo llegar <ExternalLink size={13} />
                </a>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-blue-100/70">
                <span className="inline-flex items-center gap-2"><HeartHandshake size={16} className="text-amber-300" /> Ambiente familiar</span>
                <span className="inline-flex items-center gap-2"><UsersRound size={16} className="text-amber-300" /> Para todas las edades</span>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .6, delay: .08 }} className="relative">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-amber-300/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur-sm">
                <img src={churchFacadePhoto} alt="Fachada de Iglesia Jerusalén" className="aspect-[4/3] w-full rounded-[1.5rem] object-cover" />
                <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/20 bg-[#071633]/85 p-4 backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-300">Estamos en Milagro</p>
                  <p className="mt-1 text-sm font-semibold text-white">{CHURCH_LOCATION.address}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 sm:px-8 sm:py-14 md:grid-cols-3">
          {VISIT_STEPS.map(({ number, title, description, icon: Icon }) => (
            <div key={number} className="flex gap-4 border-b border-slate-200 pb-6 dark:border-white/10 md:border-b-0 md:border-r md:pb-0 md:pr-6 last:border-0">
              <span className="font-serif text-3xl font-black text-amber-500/60">{number}</span>
              <div><h2 className="font-serif text-xl font-bold">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p></div>
              <Icon className="ml-auto hidden text-amber-500/70 sm:block" size={22} />
            </div>
          ))}
        </section>

        <section className="border-y border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/40">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:py-20">
            <div>
              <p className="text-xs font-black uppercase tracking-[.2em] text-amber-600 dark:text-amber-400">Plan simple, llegada tranquila</p>
              <h2 className="mt-3 max-w-md font-serif text-4xl font-black leading-tight sm:text-5xl">Elige el momento para encontrarnos.</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400">Estos horarios se actualizan desde la agenda pública de la iglesia.</p>
              <a href="/eventos" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-blue-800 underline decoration-amber-400 decoration-2 underline-offset-4 dark:text-blue-200">Ver agenda completa <ArrowRight size={15} /></a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {schedules.isLoading && <p className="text-sm text-slate-500">Cargando horarios…</p>}
              {!schedules.isLoading && groupedSchedules.length === 0 && <p className="text-sm text-slate-500">Aún no hay horarios publicados. Consulta la agenda para ver próximas actividades.</p>}
              {groupedSchedules.map(([day, daySchedules]) => (
                <div key={day} className="rounded-2xl border border-slate-200 bg-[#f7f7f3] p-5 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-600 dark:text-amber-400">{day}</p>
                  <div className="mt-3 space-y-3">{daySchedules.map((schedule) => <div key={schedule.id}><p className="text-sm font-bold">{schedule.title}</p><p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400"><Clock3 size={13} /> {schedule.time_range}</p></div>)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-amber-600 dark:text-amber-400">También puede interesarte</p><h2 className="mt-2 font-serif text-3xl font-black sm:text-4xl">Lo que está pasando</h2></div><a href="/eventos" className="inline-flex items-center gap-2 text-sm font-black text-blue-800 dark:text-blue-200">Ver todos <ArrowRight size={15} /></a></div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {events.isLoading && <p className="text-sm text-slate-500">Cargando actividades…</p>}
            {!events.isLoading && (events.data ?? []).length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-white/15">No hay actividades próximas publicadas todavía. Revisa la agenda más adelante.</div>}
            {(events.data ?? []).map((event) => <a key={event.id} href={`/eventos?event=${event.id}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg dark:border-white/10 dark:bg-slate-900"><span className="text-2xl" aria-hidden="true">{event.emoji || '📅'}</span><h3 className="mt-4 font-serif text-xl font-bold group-hover:text-blue-800 dark:group-hover:text-amber-300">{event.title}</h3><p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{formatEventDateRange(event.start_date, event.end_date)} · {formatEventTime(event.start_time, event.end_time)}</p></a>)}
          </div>
        </section>

        <section id="planifica" className="bg-[#071633] px-5 py-14 text-white sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
            <div><p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Un paso opcional</p><h2 className="mt-3 max-w-lg font-serif text-4xl font-black leading-tight sm:text-5xl">Avísanos que vienes y te recibiremos mejor.</h2><p className="mt-5 max-w-md text-sm leading-7 text-blue-100/75">Solo pedimos lo necesario para que tu llegada sea más cómoda. Nunca necesitas registrarte para entrar.</p><div className="mt-8 space-y-3 text-sm text-blue-100/80"><p className="flex items-center gap-3"><MapPin size={17} className="text-amber-300" /> {CHURCH_LOCATION.address}</p><p className="flex items-center gap-3"><Shirt size={17} className="text-amber-300" /> Ven como eres, sin código de vestimenta</p></div></div>
            <div className="rounded-[2rem] bg-white p-5 text-slate-950 shadow-2xl sm:p-8 dark:bg-slate-900 dark:text-white">
              {submitted ? <div className="py-10 text-center"><div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><Check size={32} /></div><h3 className="mt-5 font-serif text-3xl font-black">¡Te esperamos!</h3><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">Recibimos tu aviso. Si necesitas cambiar algo, puedes escribirnos nuevamente.</p><button type="button" onClick={() => { setSubmitted(false); setForm(INITIAL_FORM); setFormStep(1); }} className="mt-6 text-sm font-bold text-blue-800 underline underline-offset-4 dark:text-blue-200">Registrar otra visita</button></div> : <form onSubmit={handleSubmit} className="space-y-5" aria-label="Planificar visita">
                <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-600 dark:text-amber-400">Paso {formStep} de 2</p><h3 className="mt-1 font-serif text-2xl font-black">{formStep === 1 ? 'Cuéntanos de ti' : 'Hagamos tu llegada fácil'}</h3></div><span className="text-xs font-bold text-slate-400">{formStep === 1 ? 'Lo esencial' : 'Opcional'}</span></div>
                {formStep === 1 ? <><div><label htmlFor="visit-name" className="mb-1.5 block text-xs font-bold">Nombre completo *</label><input id="visit-name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} autoComplete="name" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-white/5" placeholder="¿Cómo te llamamos?" /></div><div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="visit-phone" className="mb-1.5 block text-xs font-bold">Teléfono / WhatsApp *</label><input id="visit-phone" required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-white/5" placeholder="Tu número" /></div><div><label htmlFor="visit-email" className="mb-1.5 block text-xs font-bold">Correo (opcional)</label><input id="visit-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-white/5" placeholder="tu@correo.com" /></div></div><button type="button" onClick={() => setFormStep(2)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 py-3.5 text-sm font-black text-white transition hover:bg-blue-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300">Continuar <ArrowRight size={16} /></button></> : <><div><label className="mb-2 block text-xs font-bold">¿Cómo podemos prepararnos?</label><div className="grid grid-cols-2 gap-2">{NEEDS.map(({ id, label, icon: Icon }) => { const selected = form.needs.includes(id); return <button type="button" key={id} onClick={() => toggleNeed(id)} aria-pressed={selected} className={`flex min-h-14 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${selected ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-amber-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}><Icon size={16} /> {label}</button>; })}</div></div><div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="visit-date" className="mb-1.5 block text-xs font-bold">Fecha prevista</label><input id="visit-date" type="date" value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-amber-500 dark:border-white/10 dark:bg-white/5" /></div><div><label htmlFor="visit-notes" className="mb-1.5 block text-xs font-bold">Nota breve</label><input id="visit-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-amber-500 dark:border-white/10 dark:bg-white/5" placeholder="¿Alguna pregunta?" /></div></div><div className="flex gap-3"><button type="button" onClick={() => setFormStep(1)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold dark:border-white/10">Atrás</button><button type="submit" disabled={submitting} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-black text-slate-950 transition hover:bg-amber-400 disabled:cursor-wait disabled:opacity-60">{submitting ? 'Enviando…' : 'Avisar que voy'} <Send size={16} /></button></div></>}
                <p className="text-center text-[11px] leading-5 text-slate-500">Al enviar, tu información llega al equipo de bienvenida de la iglesia.</p>
              </form>}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20"><div className="text-center"><p className="text-xs font-black uppercase tracking-[.2em] text-amber-600 dark:text-amber-400">Preguntas rápidas</p><h2 className="mt-2 font-serif text-3xl font-black sm:text-4xl">Antes de venir</h2></div><div className="mt-8 divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">{FAQS.map(([question, answer], index) => <div key={question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index} className="flex w-full items-center justify-between gap-4 py-5 text-left font-bold"><span>{question}</span><ChevronDown size={18} className={`shrink-0 text-amber-600 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} /></button>{openFaq === index && <p className="-mt-2 max-w-2xl pb-5 text-sm leading-7 text-slate-600 dark:text-slate-400">{answer}</p>}</div>)}</div></section>
      </main>
    </>
  );
}
