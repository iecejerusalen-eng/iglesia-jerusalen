import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  Compass,
  Crown,
  Cross,
  Droplets,
  Flame,
  Globe2,
  HeartHandshake,
  Landmark,
  Maximize2,
  MapPin,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import type { Speaker } from '../../types';
import PrinciplesOfFaith from '../../components/public/PrinciplesOfFaith';
import InternationalHistory from '../../components/public/about/InternationalHistory';
import NationalHistory from '../../components/public/about/NationalHistory';
import pastorDavidPhoto from '../../assets/Jerusalén/Pastor David.png';
import pastoraCorinaPhoto from '../../assets/Jerusalén/Pastora Corina.png';
import churchFacadePhoto from '../../assets/Jerusalén/Fachada Iglesia Jerusalén.jpg';

type HistoryKey = 'local' | 'national' | 'international';

interface PageContent {
  id: string;
  title: string | null;
  subtitle: string | null;
}

interface Pillar {
  title: string;
  description: string;
  reference: string;
  color: string;
  icon: typeof Cross;
}

interface TimelineEntry {
  year: string;
  title: string;
  description: string;
}

const pillars: Pillar[] = [
  { title: 'Jesucristo, el Salvador', description: 'En Jesús encontramos perdón, reconciliación y una vida nueva por la gracia.', reference: 'Juan 3:16', color: 'from-rose-500 to-orange-400', icon: Cross },
  { title: 'Jesucristo, el Bautizador', description: 'El Espíritu Santo nos llena de poder para amar, servir y anunciar el evangelio.', reference: 'Hechos 1:8', color: 'from-amber-400 to-orange-500', icon: Flame },
  { title: 'Jesucristo, el Sanador', description: 'Creemos en el cuidado integral de Dios para el cuerpo, el alma y el espíritu.', reference: 'Marcos 16:18', color: 'from-sky-400 to-blue-600', icon: Droplets },
  { title: 'Jesucristo, el Rey que viene', description: 'Vivimos con esperanza, esperando el regreso glorioso de nuestro Rey.', reference: '1 Tes. 4:16', color: 'from-violet-500 to-indigo-600', icon: Crown },
];

const history: Record<HistoryKey, { label: string; icon: typeof MapPin; eyebrow: string; title: string; body: string; milestones: string[]; timeline: TimelineEntry[] }> = {
  local: {
    label: 'Iglesia Jerusalén', icon: MapPin, eyebrow: 'Nuestra casa', title: 'Una comunidad que sirve a su ciudad',
    body: 'La Iglesia Jerusalén nació para ser un hogar de fe, restauración y servicio. Cada generación ha sumado sus dones para formar discípulos, acompañar familias y llevar esperanza a nuestra ciudad.',
    milestones: ['Adoración centrada en Jesús', 'Discipulado para todas las edades', 'Servicio práctico a las familias'],
    timeline: [
      { year: 'Inicio', title: 'Nace la visión', description: 'Dios despierta el deseo de formar una iglesia cercana, bíblica y familiar.' },
      { year: 'Primeros años', title: 'Primeros encuentros', description: 'Las familias comienzan a reunirse para adorar, orar y acompañarse.' },
      { year: 'Consolidación', title: 'Iglesia Jerusalén', description: 'La congregación consolida su identidad y abre espacios de discipulado.' },
      { year: 'Hoy', title: 'Una casa para todos', description: 'Seguimos sirviendo a nuestra ciudad con excelencia y esperanza en Jesús.' },
    ],
  },
  national: {
    label: 'Ecuador', icon: Compass, eyebrow: 'Nuestra nación', title: 'Una familia cuadrangular que crece',
    body: 'En Ecuador caminamos junto a iglesias y ministerios que anuncian el evangelio, levantan nuevos líderes y plantan comunidades saludables en distintas regiones del país.',
    milestones: ['Iglesias y obras misioneras', 'Formación de líderes', 'Alianzas para servir mejor'],
    timeline: [
      { year: 'Inicio', title: 'La familia llega a Ecuador', description: 'El mensaje cuadrangular comienza a extenderse y formar comunidades de fe.' },
      { year: 'Crecimiento', title: 'Nuevas generaciones', description: 'Se fortalecen la formación ministerial y el liderazgo nacional.' },
      { year: 'Hoy', title: 'Una iglesia que se multiplica', description: 'Colaboramos para anunciar el evangelio y servir a Ecuador.' },
    ],
  },
  international: {
    label: 'Familia Cuadrangular', icon: Globe2, eyebrow: 'Nuestro mundo', title: 'Una misión con alcance global',
    body: 'Somos parte de una familia internacional nacida del avivamiento pentecostal y comprometida con llevar a Cristo como Salvador, Bautizador, Sanador y Rey venidero.',
    milestones: ['Misión en los continentes', 'Iglesias multiculturales', 'Un mismo evangelio, muchas naciones'],
    timeline: [
      { year: '1922', title: 'Un movimiento de avivamiento', description: 'Aimee Semple McPherson funda la Iglesia del Evangelio Cuadrangular.' },
      { year: 'Siglo XX', title: 'Una familia internacional', description: 'La misión se extiende a nuevos países con iglesias y obras de compasión.' },
      { year: 'Hoy', title: 'Cristo para cada generación', description: 'La familia cuadrangular sirve en más de cien naciones.' },
    ],
  },
};



const fallbackLeaders: Speaker[] = [
  { id: 'pastor-david', member_id: null, first_name: 'David', last_name: 'Nicola', role: 'Pastor Principal', leadership_roles: ['Predicación', 'Discipulado'], is_public: true, display_order: 0, photo_url: '/assets/Jerusalén/Pastor David.png', bio: 'Guiando a la congregación con pasión por la Palabra y cuidado espiritual.', created_at: '', updated_at: '' },
  { id: 'pastora-corina', member_id: null, first_name: 'Corina', last_name: 'Miranda', role: 'Pastora Co-Principal', leadership_roles: ['Consejería', 'Familias'], is_public: true, display_order: 1, photo_url: '/assets/Jerusalén/Pastora Corina.png', bio: 'Acompañando familias y fortaleciendo los ministerios de la iglesia.', created_at: '', updated_at: '' },
];

const fallbackLeadersWithPhotos = fallbackLeaders.map((leader, index) => ({
  ...leader,
  photo_url: index === 0 ? pastorDavidPhoto : pastoraCorinaPhoto,
}));

const isChurchLeader = (leader: Speaker) => {
  const fullName = `${leader.first_name} ${leader.last_name}`.trim().toLocaleLowerCase('es');
  const role = leader.role?.toLocaleLowerCase('es') ?? '';
  return fullName !== 'jaime mena' && !role.includes('expositor invitado');
};

const mergeLeaders = (remote: Speaker[]) => {
  const merged = new Map<string, Speaker>();
  fallbackLeadersWithPhotos.forEach((leader) => merged.set(`${leader.first_name} ${leader.last_name}`.toLowerCase(), leader));
  remote.filter(isChurchLeader).forEach((leader) => {
    const key = `${leader.first_name} ${leader.last_name}`.toLowerCase();
    const fallback = merged.get(key);
    merged.set(key, { ...fallback, ...leader, photo_url: leader.photo_url ?? fallback?.photo_url ?? null });
  });
  return Array.from(merged.values()).sort((a, b) => a.display_order - b.display_order);
};

function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-white/60 bg-white/70 shadow-[0_18px_60px_-32px_rgba(35,51,84,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 ${className}`}>{children}</div>;
}

const About = () => {
  const [activeHistory, setActiveHistory] = useState<HistoryKey>('local');
  const [historyModal, setHistoryModal] = useState<HistoryKey | null>(null);
  const [leaders, setLeaders] = useState<Speaker[]>(fallbackLeadersWithPhotos);
  const [content, setContent] = useState<PageContent | null>(null);
  const [contentError, setContentError] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data: pageData, error: pageError }, { data: speakerData, error: speakerError }] = await Promise.all([
        supabase.from('page_contents').select('id,title,subtitle').eq('page', 'about').eq('id', 'about_hero').maybeSingle(),
        supabase.from('speakers').select('id,member_id,first_name,last_name,role,leadership_roles,is_public,display_order,photo_url,bio,created_at,updated_at').eq('is_public', true).order('display_order', { ascending: true }).order('created_at', { ascending: true }),
      ]);

      if (pageError) {
        console.error('No se pudo cargar la configuración de Nosotros:', pageError);
        setContentError(true);
      } else if (pageData) {
        setContent(pageData as PageContent);
      }

      if (speakerError) {
        console.error('No se pudo cargar el liderazgo del CRM:', speakerError);
        const { data: legacySpeakers, error: legacyError } = await supabase
          .from('speakers')
          .select('id,member_id,first_name,last_name,role,photo_url,bio,created_at,updated_at')
          .order('created_at', { ascending: true });
        if (legacyError) {
          console.error('Tampoco se pudo cargar el catálogo legado de liderazgo:', legacyError);
        } else if (legacySpeakers && legacySpeakers.length > 0) {
          setLeaders(mergeLeaders(legacySpeakers.map((speaker) => ({ ...speaker, leadership_roles: [], is_public: true, display_order: 0 })) as Speaker[]));
        }
      } else if (speakerData && speakerData.length > 0) {
        setLeaders(mergeLeaders(speakerData as Speaker[]));
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!historyModal) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHistoryModal(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [historyModal]);

  const active = history[activeHistory];
  const ActiveIcon = active.icon;
  const heroTitle = content?.title || 'Somos una familia con propósito';
  const heroSubtitle = content?.subtitle || 'Una iglesia local, parte de una misión nacional e internacional, centrada en Jesús y abierta a todas las generaciones.';
  const notice = useMemo(() => contentError ? 'Mostrando la presentación principal mientras se sincroniza el contenido editable.' : null, [contentError]);

  return (
    <main className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-indigo-50/50 px-4 py-6 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/30 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-36 top-16 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-500/10" />
      <div className="pointer-events-none absolute -right-32 top-[38rem] h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/10" />

      <div className="relative mx-auto max-w-6xl">
        <section className="relative mb-14 flex min-h-[560px] items-center justify-center overflow-hidden rounded-[2.25rem] border border-white/15 bg-slate-950 px-5 py-14 text-center text-white shadow-[0_32px_90px_-36px_rgba(15,23,42,.9)] sm:px-10 lg:px-14">
          <img src={churchFacadePhoto} alt="Fachada de la Iglesia Jerusalén" className="absolute inset-0 h-full w-full scale-[1.02] object-cover opacity-35" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,23,.72),rgba(7,21,47,.88)_55%,rgba(2,8,23,.96)),radial-gradient(circle_at_50%_20%,rgba(245,180,54,.22),transparent_38%)]" />
          <div className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
          <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-slate-950/35 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-amber-200 backdrop-blur-xl"><HeartHandshake size={15} /> Nuestra identidad</span>
            <h1 className="mt-6 max-w-3xl text-balance font-serif text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">{heroTitle}</h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-slate-200 sm:text-lg">{heroSubtitle}</p>
            {notice && <p className="mt-4 text-xs text-slate-400">{notice}</p>}
            <div className="mt-8 flex flex-wrap justify-center gap-3"><a href="#historia" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-400/20 transition hover:-translate-y-0.5 hover:bg-amber-300">Conoce nuestra historia <ArrowRight size={16} /></a><a href="#liderazgo" className="inline-flex min-h-12 items-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/15">Conoce al equipo</a></div>
            <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3">
              {[{ icon: Landmark, value: '1', label: 'Iglesia local' }, { icon: Globe2, value: '4', label: 'Pilares de fe' }, { icon: Users, value: 'Una familia', label: 'Todas las generaciones' }].map(({ icon: Icon, value, label }) => <div key={label} className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-left backdrop-blur-xl"><Icon size={18} className="shrink-0 text-amber-300" /><span><strong className="block text-sm text-white">{value}</strong><span className="text-[11px] text-slate-300">{label}</span></span></div>)}
            </div>
          </div>
        </section>

        <section id="historia" className="scroll-mt-24 space-y-7">
          <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Raíces y horizonte</p><h2 className="mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Una historia, tres perspectivas</h2><p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">Explora el recorrido de nuestra iglesia local y su conexión con la obra cuadrangular en Ecuador y el mundo.</p></div>
          <GlassCard className="overflow-hidden p-2 sm:p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(history) as HistoryKey[]).map((key) => {
                const item = history[key];
                const Icon = item.icon;
                const selected = activeHistory === key;
                return <button key={key} type="button" onClick={() => setActiveHistory(key)} className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-left transition ${selected ? 'bg-slate-950 text-white shadow-lg dark:bg-white dark:text-slate-950' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'}`} aria-pressed={selected}><span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-amber-400 text-slate-950' : 'bg-amber-400/15 text-amber-700 dark:text-amber-300'}`}><Icon size={18} /></span><span><strong className="block text-sm">{item.label}</strong><span className={`text-xs ${selected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>{item.eyebrow}</span></span></button>;
              })}
            </div>
          </GlassCard>
          <motion.article key={activeHistory} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-900 p-6 text-white shadow-[0_26px_70px_-34px_rgba(15,23,42,.9)] sm:p-9">
            <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_.8fr] lg:items-center">
              <div><div className="flex items-center gap-3 text-sm font-bold text-amber-300"><ActiveIcon size={18} /> {active.label}</div><h3 className="mt-5 max-w-xl font-serif text-3xl font-bold sm:text-4xl">{active.title}</h3><p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">{active.body}</p><button type="button" onClick={() => setHistoryModal(activeHistory)} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-amber-300"><Maximize2 size={15} /> Ver historia completa</button></div>
              <div className="grid gap-3">{active.timeline.slice(0, 3).map((entry) => <div key={`${entry.year}-${entry.title}`} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl"><span className="mt-0.5 h-fit rounded-lg bg-amber-400/15 px-2 py-1 text-[10px] font-black text-amber-200">{entry.year}</span><div><h4 className="text-sm font-bold">{entry.title}</h4><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{entry.description}</p></div></div>)}</div>
            </div>
          </motion.article>
        </section>

        <section id="pilares" className="scroll-mt-24 py-16"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Nuestra identidad</p><h2 className="mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Los Pilares Cuadrangulares</h2></div><p className="max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">Cuatro expresiones de una misma esperanza: Jesús sigue siendo suficiente.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{pillars.map((pillar, index) => { const Icon = pillar.icon; return <motion.article key={pillar.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }} className="group rounded-3xl border border-white/70 bg-white/75 p-6 shadow-[0_15px_45px_-30px_rgba(35,51,84,0.5)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60"><div className={`mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${pillar.color} text-white shadow-lg`}><Icon size={23} /></div><h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">{pillar.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{pillar.description}</p><span className="mt-6 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-300">{pillar.reference}</span></motion.article>; })}</div></section>

        <section id="principios" className="scroll-mt-24 py-8"><PrinciplesOfFaith /></section>

        </section>
      </div>
      <AnimatePresence>{historyModal && <HistoryModal historyKey={historyModal} onChange={setHistoryModal} onClose={() => setHistoryModal(null)} />}</AnimatePresence>
    </main>
  );
};

function HistoryModal({ historyKey, onChange, onClose }: { historyKey: HistoryKey; onChange: (key: HistoryKey) => void; onClose: () => void }) {
  const item = history[historyKey];
  const Icon = item.icon;
  return (
    <motion.div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/75 p-0 backdrop-blur-md sm:items-center sm:p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <motion.section initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }} className="flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[2rem] border border-white/60 bg-slate-50/95 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/95 sm:rounded-[2rem]" role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
        <header className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-900 px-5 py-5 text-white sm:px-8">
          <div className="pointer-events-none absolute right-0 top-0 size-56 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300"><BookOpenText size={14} /> Archivo histórico</div><h2 id="history-modal-title" className="mt-2 font-serif text-2xl font-bold sm:text-3xl">{item.label}</h2><p className="mt-1 text-sm text-slate-300">{item.title}</p></div><button type="button" onClick={onClose} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white" aria-label="Cerrar historia"><X size={18} /></button></div>
          <div className="relative mt-5 flex gap-2 overflow-x-auto pb-1">{(Object.keys(history) as HistoryKey[]).map((key) => { const tab = history[key]; const TabIcon = tab.icon; return <button key={key} type="button" onClick={() => onChange(key)} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-black transition ${historyKey === key ? 'bg-amber-400 text-slate-950' : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}><TabIcon size={14} />{tab.label}</button>; })}</div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-8 sm:py-8">
          {historyKey === 'national' ? <NationalHistory /> : historyKey === 'international' ? <InternationalHistory /> : <div className="mx-auto grid max-w-5xl gap-7 lg:grid-cols-[.85fr_1.15fr]"><div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900"><img src={churchFacadePhoto} alt="Fachada de la Iglesia Jerusalén" className="aspect-[4/3] w-full object-cover" /><div className="p-6"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-amber-600"><Icon size={15} /> Nuestra casa</div><h3 className="mt-3 font-serif text-2xl font-bold text-slate-900 dark:text-white">{item.title}</h3><p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.body}</p><div className="mt-5 flex flex-wrap gap-2">{item.milestones.map((milestone) => <span key={milestone} className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">{milestone}</span>)}</div></div></div><div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-amber-600"><CalendarDays size={15} /> Línea de tiempo</div><div className="relative mt-5 space-y-4 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-px before:bg-gradient-to-b before:from-amber-400 before:to-slate-200 dark:before:to-slate-700">{item.timeline.map((entry) => <article key={`${entry.year}-${entry.title}`} className="relative flex gap-4"><span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-4 border-slate-50 bg-amber-400 text-[9px] font-black text-slate-950 shadow dark:border-slate-950">{entry.year === 'Primeros años' ? '•••' : entry.year.slice(0, 4)}</span><div className="flex-1 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5"><span className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-600">{entry.year}</span><h4 className="mt-1 font-bold text-slate-900 dark:text-white">{entry.title}</h4><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{entry.description}</p></div></article>)}</div></div></div>}
        </div>
      </motion.section>
    </motion.div>
  );
}

export default About;
