import { Link } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, BookOpenText, Download, HeartHandshake, MessageCircle, Users } from 'lucide-react';
import LearningProgress from '../../features/about/LearningProgress';
import { learningTopics } from '../../features/about/learningContent';
import { supabase } from '../../config/supabase';
import type { Speaker } from '../../types';
import PremiumAboutHero from './components/PremiumAboutHero';
import QuadrangularSymbol from '../../components/public/QuadrangularSymbol';
import VolumetricIcon from '../../components/public/VolumetricIcon';
import pastorDavidPhoto from '../../assets/Jerusalén/Pastor-David-auditorio-jerusalen-v01.webp';
import pastoraCorinaPhoto from '../../assets/Jerusalén/Pastora-Corina-auditorio-jerusalen-v01.webp';


interface PageContent {
  id: string;
  title: string | null;
  subtitle: string | null;
  cover_image_url: string | null;
}

const fallbackLeadersWithPhotos: Speaker[] = [
  { id: 'pastor-david', member_id: null, first_name: 'David', last_name: 'Nicola', role: 'Pastor Principal', leadership_roles: ['Predicación', 'Discipulado'], is_public: true, display_order: 0, photo_url: pastorDavidPhoto, bio: 'Guiando a la congregación con pasión por la Palabra y cuidado espiritual.', created_at: '', updated_at: '' },
  { id: 'pastora-corina', member_id: null, first_name: 'Corina', last_name: 'Miranda', role: 'Pastora Co-Principal', leadership_roles: ['Consejería', 'Familias'], is_public: true, display_order: 1, photo_url: pastoraCorinaPhoto, bio: 'Acompañando familias y fortaleciendo los ministerios de la iglesia.', created_at: '', updated_at: '' },
];

// Estos retratos editoriales reemplazan el fondo plano de las fotografías de los pastores principales.
const featuredPastorPortraits = new Map([
  ['david nicola', pastorDavidPhoto],
  ['corina miranda', pastoraCorinaPhoto],
]);

const quadrangularSymbols = [
  { name: 'Cruz', symbol: 'cross', ministry: 'Jesucristo, el Salvador' },
  { name: 'Paloma', symbol: 'dove', ministry: 'Jesucristo, el Bautizador con el Espíritu Santo' },
  { name: 'Copa', symbol: 'cup', ministry: 'Jesucristo, el Sanador' },
  { name: 'Corona', symbol: 'crown', ministry: 'Jesucristo, el Rey que viene' },
] as const;

const aboutSections = [
  ['proposito', 'Visión y misión'],
  ['aprender', 'Conoce nuestra fe'],
  ['liderazgo', 'Liderazgo'],
  ['documentos', 'Documentos'],
] as const;

const aboutDestinations = [...learningTopics, { slug: 'pastores', title: 'Pastores', summary: 'Conoce las familias pastorales que han acompañado nuestra historia. Recorre sus retratos y su legado de servicio.' }];

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
    merged.set(key, {
      ...fallback,
      ...leader,
      bio: leader.bio?.trim() ? leader.bio : fallback?.bio ?? '',
      leadership_roles: leader.leadership_roles?.length ? leader.leadership_roles : fallback?.leadership_roles ?? [],
      photo_url: featuredPastorPortraits.get(key) ?? leader.photo_url ?? fallback?.photo_url ?? null,
    });
  });
  return Array.from(merged.values()).sort((a, b) => a.display_order - b.display_order);
};

function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-white/60 bg-white/70 shadow-[0_18px_60px_-32px_rgba(35,51,84,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 ${className}`}>{children}</div>;
}

const About = () => {
  const [leaders, setLeaders] = useState<Speaker[]>(fallbackLeadersWithPhotos);
  const [content, setContent] = useState<PageContent | null>(null);
  const [contentError, setContentError] = useState(false);
  const [leadersError, setLeadersError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [activeSection, setActiveSection] = useState<(typeof aboutSections)[number][0]>('proposito');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const load = async () => {
      const [pageResult, speakerResult] = await Promise.allSettled([
        supabase.from('page_contents').select('id,title,subtitle,cover_image_url').eq('page', 'about').eq('id', 'about_hero').abortSignal(controller.signal).maybeSingle(),
        supabase.from('speakers').select('id,first_name,last_name,role,leadership_roles,is_public,display_order,photo_url,bio,created_at,updated_at').eq('is_public', true).order('display_order', { ascending: true }).order('created_at', { ascending: true }).abortSignal(controller.signal),
      ]);
      if (cancelled) return;
      if (pageResult.status === 'rejected' || pageResult.value.error) {
        console.error('No se pudo cargar la configuración de Nosotros:', pageResult.status === 'rejected' ? pageResult.reason : pageResult.value.error);
        setContentError(true);
      } else {
        setContent(pageResult.value.data as PageContent | null);
        setContentError(false);
      }
      if (speakerResult.status === 'rejected' || speakerResult.value.error) {
        console.error('No se pudo cargar el liderazgo público:', speakerResult.status === 'rejected' ? speakerResult.reason : speakerResult.value.error);
        setLeadersError(true);
      } else {
        setLeaders(mergeLeaders((speakerResult.value.data ?? []) as Speaker[]));
        setLeadersError(false);
      }
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; controller.abort(); };
  }, [reload]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const sections = aboutSections
      .map(([id]) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (current?.target.id) {
        setActiveSection(current.target.id as (typeof aboutSections)[number][0]);
      }
    }, { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.25, 0.5, 1] });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const retry = () => { setLoading(true); setReload(value => value + 1); };

  const heroTitle = content?.title || 'Somos una familia con propósito';
  const heroSubtitle = content?.subtitle || 'Una iglesia local, parte de una misión nacional e internacional, centrada en Jesús y abierta a todas las generaciones.';
  const notice = contentError ? 'No se pudo cargar el contenido actualizado. Mostramos la presentación principal.' : null;
  const errorMessage = contentError && leadersError
    ? 'No se pudieron actualizar la presentación de la iglesia ni la información del liderazgo. Se conserva el contenido disponible.'
    : leadersError
      ? 'No se pudo actualizar la información del liderazgo. Se conserva la presentación disponible.'
      : 'No se pudo actualizar la presentación de la iglesia.';

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-indigo-50/50 px-4 py-6 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/30 sm:px-6 lg:px-8">
      <Helmet>
        <title>Nosotros | Iglesia Jerusalén</title>
        <meta name="description" content="Conoce la historia, los pilares de fe, el Himno Cuadrangular y el liderazgo de Iglesia Jerusalén en Milagro." />
        <meta property="og:title" content="Nosotros | Iglesia Jerusalén" />
        <meta property="og:description" content="Nuestra historia, identidad y fe como parte de la familia Cuadrangular." />
      </Helmet>
      <div className="pointer-events-none absolute -left-36 top-16 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-500/10" />
      <div className="pointer-events-none absolute -right-32 top-[38rem] h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/10" />

      <div className="relative mx-auto max-w-6xl">
        <PremiumAboutHero title={heroTitle} subtitle={heroSubtitle} notice={notice} coverImage={content?.cover_image_url} />

        <nav aria-label="En esta página" className="mb-12 flex flex-wrap gap-2 border-b border-slate-200 pb-6 dark:border-white/10">
          {aboutSections.map(([id, label]) => (
            <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'location' : undefined} className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition hover:border-amber-400 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-4 dark:hover:bg-white/5 ${activeSection === id ? 'border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-300/40 dark:bg-amber-300/10 dark:text-amber-200' : 'border-slate-200 text-slate-700 dark:border-white/15 dark:text-slate-200'}`}>{label}</a>
          ))}
        </nav>

        {(contentError || leadersError) && <div role="alert" className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100"><p>{errorMessage}</p><button type="button" disabled={loading} onClick={retry} className="min-h-11 rounded-lg border border-amber-500 px-4 py-2 font-semibold disabled:opacity-50">{loading ? 'Actualizando…' : 'Volver a intentar'}</button></div>}


        <section id="proposito" aria-labelledby="purpose-heading" className="scroll-mt-28 py-8">
          <div className="mb-6 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-600">Nuestra identidad</p>
            <h2 id="purpose-heading" className="editorial-heading-accent mt-3 font-serif text-3xl font-bold text-slate-950 dark:text-white sm:text-4xl">Visión y misión</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-[0_18px_60px_-40px_rgba(35,51,84,0.4)] dark:border-white/10 dark:bg-slate-900/65 sm:p-8">
              <VolumetricIcon imageSrc="/assets/about/vision-eye-3d.png" tone="indigo" />
              <h3 className="mt-5 font-serif text-2xl font-bold text-slate-950 dark:text-white">Nuestra visión</h3>
              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">Ser una iglesia que evangeliza y discípula en el Ecuador y el mundo, estableciendo comunidades cristianas saludables y multiplicadoras, en todas las provincias del país, enviando misioneros a otros países y con una administración eficiente.</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-[0_18px_60px_-40px_rgba(35,51,84,0.4)] dark:border-white/10 dark:bg-slate-900/65 sm:p-8">
              <VolumetricIcon imageSrc="/assets/about/mission-heart-3d.png" tone="amber" />
              <h3 className="mt-5 font-serif text-2xl font-bold text-slate-950 dark:text-white">Nuestra misión</h3>
              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">Predicar el Evangelio de Nuestro Señor Jesucristo como Salvador, Bautizador con el Espíritu Santo, Sanador y Rey que viene pronto, formar discípulos llenos de santidad, amor fraternal y servicio.</p>
            </article>
          </div>
        </section>

        <LearningProgress />
        <section id="aprender" className="scroll-mt-28 py-8">
          <div className="mb-8 max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-600">Conoce nuestra fe</p><h2 className="editorial-heading-accent mt-3 font-serif text-3xl font-bold text-slate-950 dark:text-white sm:text-4xl">Un camino para aprender y vivir el Evangelio</h2><p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">Somos Iglesia Jerusalén, una comunidad en Milagro que anuncia a Jesucristo como Salvador, Bautizador con el Espíritu Santo, Sanador y Rey que viene. Explora nuestra identidad con explicaciones, referencias bíblicas y preguntas para conversar en familia o en tu grupo de discipulado.</p></div>
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white/75 p-5 dark:border-white/10 dark:bg-slate-900/60 sm:p-7">
            <div className="max-w-2xl">
              <h3 className="font-serif text-2xl font-bold text-slate-950 dark:text-white">Cuatro símbolos, un mismo mensaje</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">La cruz, la paloma, la copa y la corona nos recuerdan los cuatro ministerios de Jesucristo.</p>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
              {quadrangularSymbols.map((symbol) => (
                <li key={symbol.name} className="flex flex-col items-center gap-3 text-center">
                  <QuadrangularSymbol symbol={symbol.symbol} className="size-16 rounded-2xl shadow-sm sm:size-[4.5rem]" />
                  <div className="w-full max-w-[12rem]">
                    <p className="font-semibold text-slate-900 dark:text-white">{symbol.name}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{symbol.ministry}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/nosotros/simbolos" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold text-indigo-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 dark:text-amber-300">
              Conoce el significado de los símbolos <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{aboutDestinations.map((topic, index) => <Link key={topic.slug} to={`/nosotros/${topic.slug}`} className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-amber-400 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 dark:border-white/15 dark:bg-slate-900"><span className="flex items-center justify-between text-sm font-bold text-amber-700 dark:text-amber-300"><span>0{index + 1}</span><BookOpenText size={22} /></span><h3 className="mt-6 font-serif text-2xl font-bold text-slate-950 dark:text-white">{topic.title}</h3><p className="mt-3 flex-1 leading-7 text-slate-600 dark:text-slate-300">{topic.summary}</p><span className="mt-6 inline-flex items-center gap-2 font-semibold text-indigo-800 dark:text-amber-300">Explorar <ArrowRight size={18} /></span></Link>)}</div>
        </section>

        <section id="liderazgo" className="scroll-mt-24 py-16">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Personas que sirven</p>
            <h2 className="editorial-heading-accent editorial-heading-accent-center mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Liderazgo de la iglesia</h2>
            <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">Pastores que acompañan, enseñan y sirven a nuestra comunidad.</p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
            {leaders.map((leader) => (
              <GlassCard key={leader.id} className="group overflow-hidden border-t-2 border-t-church-gold-emphasis-soft">
                <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-amber-100 via-slate-100 to-indigo-100 dark:from-amber-950/50 dark:via-slate-800 dark:to-indigo-950">
                  {leader.photo_url ? (
                    <img
                      src={leader.photo_url}
                      alt={`${leader.role || 'Liderazgo de Iglesia Jerusalén'}: ${leader.first_name} ${leader.last_name}, retrato editorial ambientado en el auditorio de la iglesia`}
                      loading="lazy"
                      decoding="async"
                      width={600}
                      height={450}
                      sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw"
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <Users size={52} />
                    </div>
                  )}
                </div>
                <div className="p-6 text-center">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-600">{leader.role}</span>
                  <h3 className="mt-2 font-serif text-2xl font-bold text-slate-900 dark:text-white">
                    {leader.first_name} {leader.last_name}
                  </h3>
                  {leader.bio && <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">{leader.bio}</p>}
                  {leader.leadership_roles?.length > 0 && <ul aria-label={`Áreas de servicio de ${leader.first_name} ${leader.last_name}`} className="mt-4 flex flex-wrap justify-center gap-2">{leader.leadership_roles.slice(0, 3).map((role) => <li key={role} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-950 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">{role}</li>)}</ul>}
                </div>
              </GlassCard>
            ))}
          </div>
          <div className="mx-auto mt-7 flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/75 p-5 text-center dark:border-white/10 dark:bg-slate-900/55 sm:flex-row sm:text-left">
            <div><p className="font-semibold text-slate-900 dark:text-white">¿Podemos acompañarte?</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Escríbenos por los canales oficiales de la iglesia o comparte una petición de oración.</p></div>
            <div className="flex w-full flex-wrap justify-center gap-2 sm:w-auto">
              <Link to="/contacto" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2"><MessageCircle size={16} aria-hidden="true" /> Contactar a la iglesia</Link>
              <Link to="/peticiones" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-800 transition hover:border-amber-500 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/20 dark:text-white"><HeartHandshake size={16} aria-hidden="true" /> Pedir oración</Link>
            </div>
          </div>
        </section>
        <section id="documentos" aria-labelledby="documents-heading" className="my-10 scroll-mt-28 rounded-3xl bg-slate-950 p-7 text-white sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-300">Nuestra organización</p>
          <h2 id="documents-heading" className="mt-3 font-serif text-3xl">Conoce los estatutos y el reglamento</h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-300">Consulta los documentos de la Iglesia Cuadrangular, léelos en línea o descarga los PDF originales.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-white/15 bg-white/[0.06] p-4">
              <h3 className="font-semibold">Estatuto de la iglesia</h3>
              <div className="mt-3 flex flex-wrap gap-3"><Link to="/nosotros/documentos/estatutos" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-church-gold-gradient px-4 text-sm font-bold text-white shadow-md shadow-amber-950/15 transition hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 dark:text-slate-950">Leer en línea <ArrowRight size={16} aria-hidden="true" /></Link><a href="/documentos/estatutos.pdf" download className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-white underline underline-offset-4"><Download size={15} aria-hidden="true" /> Descargar PDF</a></div>
            </article>
            <article className="rounded-2xl border border-white/15 bg-white/[0.06] p-4">
              <h3 className="font-semibold">Reglamento interno</h3>
              <div className="mt-3 flex flex-wrap gap-3"><Link to="/nosotros/documentos/reglamento-interno" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-church-gold-gradient px-4 text-sm font-bold text-white shadow-md shadow-amber-950/15 transition hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 dark:text-slate-950">Leer en línea <ArrowRight size={16} aria-hidden="true" /></Link><a href="/documentos/reglamento-interno.pdf" download className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-white underline underline-offset-4"><Download size={15} aria-hidden="true" /> Descargar PDF</a></div>
            </article>
          </div>
        </section>

      </div>
    </div>
  );
};

export default About;
