import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ChevronDown,
  Compass,
  Crown,
  Cross,
  Droplets,
  Flame,
  Globe2,
  HeartHandshake,
  Landmark,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import type { Speaker } from '../../types';

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

const pillars: Pillar[] = [
  { title: 'Jesucristo, el Salvador', description: 'En Jesús encontramos perdón, reconciliación y una vida nueva por la gracia.', reference: 'Juan 3:16', color: 'from-rose-500 to-orange-400', icon: Cross },
  { title: 'Jesucristo, el Bautizador', description: 'El Espíritu Santo nos llena de poder para amar, servir y anunciar el evangelio.', reference: 'Hechos 1:8', color: 'from-amber-400 to-orange-500', icon: Flame },
  { title: 'Jesucristo, el Sanador', description: 'Creemos en el cuidado integral de Dios para el cuerpo, el alma y el espíritu.', reference: 'Marcos 16:18', color: 'from-sky-400 to-blue-600', icon: Droplets },
  { title: 'Jesucristo, el Rey que viene', description: 'Vivimos con esperanza, esperando el regreso glorioso de nuestro Rey.', reference: '1 Tes. 4:16', color: 'from-violet-500 to-indigo-600', icon: Crown },
];

const history: Record<HistoryKey, { label: string; icon: typeof MapPin; eyebrow: string; title: string; body: string; milestones: string[] }> = {
  local: {
    label: 'Iglesia Jerusalén', icon: MapPin, eyebrow: 'Nuestra casa', title: 'Una comunidad que sirve a su ciudad',
    body: 'La Iglesia Jerusalén nació para ser un hogar de fe, restauración y servicio. Cada generación ha sumado sus dones para formar discípulos, acompañar familias y llevar esperanza a nuestra ciudad.',
    milestones: ['Adoración centrada en Jesús', 'Discipulado para todas las edades', 'Servicio práctico a las familias'],
  },
  national: {
    label: 'Ecuador', icon: Compass, eyebrow: 'Nuestra nación', title: 'Una familia cuadrangular que crece',
    body: 'En Ecuador caminamos junto a iglesias y ministerios que anuncian el evangelio, levantan nuevos líderes y plantan comunidades saludables en distintas regiones del país.',
    milestones: ['Iglesias y obras misioneras', 'Formación de líderes', 'Alianzas para servir mejor'],
  },
  international: {
    label: 'Familia Cuadrangular', icon: Globe2, eyebrow: 'Nuestro mundo', title: 'Una misión con alcance global',
    body: 'Somos parte de una familia internacional nacida del avivamiento pentecostal y comprometida con llevar a Cristo como Salvador, Bautizador, Sanador y Rey venidero.',
    milestones: ['Misión en los continentes', 'Iglesias multiculturales', 'Un mismo evangelio, muchas naciones'],
  },
};

const principles = [
  ['La Biblia', 'Creemos que la Biblia es inspirada por Dios y guía segura para nuestra fe y práctica.'],
  ['La Trinidad', 'Adoramos a un solo Dios: Padre, Hijo y Espíritu Santo, eternamente uno.'],
  ['La salvación', 'La salvación es por gracia, mediante la fe en Jesucristo y su obra redentora.'],
  ['El Espíritu Santo', 'El Espíritu Santo transforma, capacita y forma en nosotros el carácter de Cristo.'],
  ['La iglesia', 'La iglesia es una familia que adora, discipula, sirve y anuncia las buenas noticias.'],
  ['La esperanza', 'Esperamos la resurrección y el regreso de Jesús con una esperanza viva.'],
];

const fallbackLeaders: Speaker[] = [
  { id: 'pastor-david', member_id: null, first_name: 'David', last_name: 'Nicola', role: 'Pastor Principal', leadership_roles: ['Predicación', 'Discipulado'], is_public: true, display_order: 0, photo_url: '/assets/Jerusalén/Pastor David.png', bio: 'Guiando a la congregación con pasión por la Palabra y cuidado espiritual.', created_at: '', updated_at: '' },
  { id: 'pastora-corina', member_id: null, first_name: 'Corina', last_name: 'Miranda', role: 'Pastora Co-Principal', leadership_roles: ['Consejería', 'Familias'], is_public: true, display_order: 1, photo_url: '/assets/Jerusalén/Pastora Corina.png', bio: 'Acompañando familias y fortaleciendo los ministerios de la iglesia.', created_at: '', updated_at: '' },
];

function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-white/60 bg-white/70 shadow-[0_18px_60px_-32px_rgba(35,51,84,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 ${className}`}>{children}</div>;
}

const About = () => {
  const [activeHistory, setActiveHistory] = useState<HistoryKey>('local');
  const [openPrinciple, setOpenPrinciple] = useState(0);
  const [leaders, setLeaders] = useState<Speaker[]>(fallbackLeaders);
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
          setLeaders(legacySpeakers.map((speaker) => ({ ...speaker, leadership_roles: [], is_public: true, display_order: 0 })) as Speaker[]);
        }
      } else if (speakerData && speakerData.length > 0) {
        setLeaders(speakerData as Speaker[]);
      }
    };
    void load();
  }, []);

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
        <GlassCard className="mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400"><Sparkles size={15} className="text-amber-500" /> Nosotros</div>
          <nav aria-label="Secciones de Nosotros" className="flex max-w-full gap-1 overflow-x-auto text-sm text-slate-600 dark:text-slate-300">
            {['historia', 'pilares', 'principios', 'liderazgo'].map((id) => <a key={id} href={`#${id}`} className="whitespace-nowrap rounded-full px-3 py-1.5 transition hover:bg-white hover:text-primary dark:hover:bg-white/10">{id[0].toUpperCase() + id.slice(1)}</a>)}
          </nav>
        </GlassCard>

        <section className="relative mb-12 overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950 px-6 py-12 text-white shadow-2xl sm:px-12 lg:px-16 lg:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(245,180,54,0.28),transparent_35%),radial-gradient(circle_at_10%_90%,rgba(59,130,246,0.25),transparent_40%)]" />
          <div className="relative grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200"><HeartHandshake size={15} /> Quiénes somos</span>
              <h1 className="max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-6xl">{heroTitle}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">{heroSubtitle}</p>
              {notice && <p className="mt-5 text-xs text-slate-400">{notice}</p>}
              <div className="mt-8 flex flex-wrap gap-3"><a href="#historia" className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300">Conoce nuestra historia <ArrowRight size={16} /></a><a href="#liderazgo" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Conoce al equipo</a></div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-lg"><Landmark className="mb-6 text-amber-300" /><strong className="block text-2xl">1</strong><span className="text-sm text-slate-300">iglesia local</span></div><div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-lg"><Globe2 className="mb-6 text-sky-300" /><strong className="block text-2xl">4</strong><span className="text-sm text-slate-300">pilares de fe</span></div><div className="col-span-2 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-lg sm:col-span-1 lg:col-span-2"><Users className="mb-6 text-violet-300" /><strong className="block text-2xl">Una familia</strong><span className="text-sm text-slate-300">sirviendo a cada generación</span></div></div>
          </div>
        </section>

        <section id="historia" className="scroll-mt-24 space-y-6">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Raíces y horizonte</p><h2 className="mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Historia en tres escalas</h2><p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">Descubre cómo una comunidad local forma parte de una familia que sirve en Ecuador y en el mundo.</p></div>
          <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]"><GlassCard className="p-3"><div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">{(Object.keys(history) as HistoryKey[]).map((key) => { const item = history[key]; const Icon = item.icon; return <button key={key} onClick={() => setActiveHistory(key)} className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-left transition ${activeHistory === key ? 'bg-slate-900 text-white shadow-lg dark:bg-white dark:text-slate-950' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'}`}><span className={`rounded-xl p-2 ${activeHistory === key ? 'bg-amber-400 text-slate-950' : 'bg-amber-400/15 text-amber-600'}`}><Icon size={18} /></span><span><strong className="block text-sm">{item.label}</strong><span className={`text-xs ${activeHistory === key ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>{item.eyebrow}</span></span></button>; })}</div></GlassCard><motion.div key={activeHistory} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-to-br from-indigo-950 to-slate-900 p-7 text-white shadow-xl sm:p-10"><div className="flex items-center gap-3 text-sm font-semibold text-amber-300"><ActiveIcon size={18} /> {active.label}</div><h3 className="mt-6 max-w-2xl font-serif text-3xl font-bold sm:text-4xl">{active.title}</h3><p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">{active.body}</p><div className="mt-8 grid gap-3 sm:grid-cols-3">{active.milestones.map((milestone) => <div key={milestone} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200">{milestone}</div>)}</div></motion.div></div>
        </section>

        <section id="pilares" className="scroll-mt-24 py-16"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Nuestra identidad</p><h2 className="mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Los Pilares Cuadrangulares</h2></div><p className="max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">Cuatro expresiones de una misma esperanza: Jesús sigue siendo suficiente.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{pillars.map((pillar, index) => { const Icon = pillar.icon; return <motion.article key={pillar.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }} className="group rounded-3xl border border-white/70 bg-white/75 p-6 shadow-[0_15px_45px_-30px_rgba(35,51,84,0.5)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60"><div className={`mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${pillar.color} text-white shadow-lg`}><Icon size={23} /></div><h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">{pillar.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{pillar.description}</p><span className="mt-6 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-300">{pillar.reference}</span></motion.article>; })}</div></section>

        <section id="principios" className="scroll-mt-24 py-4"><div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Lo que creemos</p><h2 className="mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Principios de la fe</h2><p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">Una síntesis clara para conocer nuestra fe sin recorrer una página interminable. Abre cada principio para leer más.</p></div><GlassCard className="divide-y divide-slate-200/70 overflow-hidden dark:divide-white/10">{principles.map(([title, description], index) => <div key={title}><button className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left" onClick={() => setOpenPrinciple(openPrinciple === index ? -1 : index)} aria-expanded={openPrinciple === index}><span className="flex items-center gap-3 font-semibold text-slate-800 dark:text-white"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/15 text-xs text-amber-700 dark:text-amber-300">{String(index + 1).padStart(2, '0')}</span>{title}</span><ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${openPrinciple === index ? 'rotate-180' : ''}`} /></button>{openPrinciple === index && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-5 pb-5 pl-[4.25rem] text-sm leading-7 text-slate-600 dark:text-slate-400">{description}</motion.p>}</div>)}</GlassCard></div></section>

        <section id="liderazgo" className="scroll-mt-24 py-16"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Personas que sirven</p><h2 className="mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Liderazgo de la iglesia</h2><p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">Perfiles administrados desde el catálogo de pastores y vinculados al CRM.</p></div><a href="/admin/pastores" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">Editar liderazgo <ArrowRight size={16} /></a></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{leaders.map((leader) => <GlassCard key={leader.id} className="overflow-hidden"><div className="aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">{leader.photo_url ? <img src={leader.photo_url} alt={`Foto de ${leader.first_name} ${leader.last_name}`} className="h-full w-full object-cover object-top transition duration-700 hover:scale-105" /> : <div className="flex h-full items-center justify-center text-slate-300"><Users size={52} /></div>}</div><div className="p-6"><span className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">{leader.role}</span><h3 className="mt-2 font-serif text-2xl font-bold text-slate-900 dark:text-white">{leader.first_name} {leader.last_name}</h3>{leader.bio && <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{leader.bio}</p>}{leader.member_id && <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Users size={13} /> Perfil CRM vinculado</span>}</div></GlassCard>)}</div></section>
      </div>
    </main>
  );
};

export default About;
