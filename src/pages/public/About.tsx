import { Link } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, BookOpenText, Users } from 'lucide-react';
import LearningProgress from '../../features/about/LearningProgress';
import { learningTopics } from '../../features/about/learningContent';
import { supabase } from '../../config/supabase';
import type { Speaker } from '../../types';
import PremiumAboutHero from './components/PremiumAboutHero';
import pastorDavidPhoto from '../../assets/Jerusalén/Pastor David.webp';
import pastoraCorinaPhoto from '../../assets/Jerusalén/Pastora Corina.webp';


interface PageContent {
  id: string;
  title: string | null;
  subtitle: string | null;
  cover_image_url: string | null;
}

const fallbackLeaders: Speaker[] = [
  { id: 'pastor-david', member_id: null, first_name: 'David', last_name: 'Nicola', role: 'Pastor Principal', leadership_roles: ['Predicación', 'Discipulado'], is_public: true, display_order: 0, photo_url: '/assets/Jerusalén/Pastor David.webp', bio: 'Guiando a la congregación con pasión por la Palabra y cuidado espiritual.', created_at: '', updated_at: '' },
  { id: 'pastora-corina', member_id: null, first_name: 'Corina', last_name: 'Miranda', role: 'Pastora Co-Principal', leadership_roles: ['Consejería', 'Familias'], is_public: true, display_order: 1, photo_url: '/assets/Jerusalén/Pastora Corina.webp', bio: 'Acompañando familias y fortaleciendo los ministerios de la iglesia.', created_at: '', updated_at: '' },
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
  const [leaders, setLeaders] = useState<Speaker[]>(fallbackLeadersWithPhotos);
  const [content, setContent] = useState<PageContent | null>(null);
  const [contentError, setContentError] = useState(false);
  const [leadersError, setLeadersError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

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

  const retry = () => { setLoading(true); setReload(value => value + 1); };

  const heroTitle = content?.title || 'Somos una familia con propósito';
  const heroSubtitle = content?.subtitle || 'Una iglesia local, parte de una misión nacional e internacional, centrada en Jesús y abierta a todas las generaciones.';
  const notice = contentError ? 'No se pudo cargar el contenido actualizado. Mostramos la presentación principal.' : null;

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
          {[['aprender', 'Conoce nuestra fe'], ['liderazgo', 'Liderazgo'], ['documentos', 'Documentos']].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-4 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5">{label}</a>
          ))}
        </nav>

        {(contentError || leadersError) && <div role="alert" className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100"><p>{leadersError ? 'No se pudo actualizar la información del liderazgo. Se conserva la presentación disponible.' : 'No se pudo actualizar la presentación de la iglesia.'}</p><button type="button" disabled={loading} onClick={retry} className="min-h-11 rounded-lg border border-amber-500 px-4 py-2 font-semibold disabled:opacity-50">{loading ? 'Actualizando…' : 'Volver a intentar'}</button></div>}



        <LearningProgress />
        <section id="aprender" className="scroll-mt-28 py-8">
          <div className="mb-8 max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-600">Conoce nuestra fe</p><h2 className="mt-3 font-serif text-3xl font-bold text-slate-950 dark:text-white sm:text-4xl">Un camino para aprender y vivir el Evangelio</h2><p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">Somos Iglesia Jerusalén, una comunidad en Milagro que anuncia a Jesucristo como Salvador, Bautizador con el Espíritu Santo, Sanador y Rey que viene. Explora nuestra identidad con explicaciones, referencias bíblicas y preguntas para conversar en familia o en tu grupo de discipulado.</p></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{learningTopics.map((topic, index) => <Link key={topic.slug} to={`/nosotros/${topic.slug}`} className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-amber-400 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 dark:border-white/15 dark:bg-slate-900"><span className="flex items-center justify-between text-sm font-bold text-amber-700 dark:text-amber-300"><span>0{index + 1}</span><BookOpenText size={22} /></span><h3 className="mt-6 font-serif text-2xl font-bold text-slate-950 dark:text-white">{topic.title}</h3><p className="mt-3 flex-1 leading-7 text-slate-600 dark:text-slate-300">{topic.summary}</p><span className="mt-6 inline-flex items-center gap-2 font-semibold text-indigo-800 dark:text-amber-300">Explorar <ArrowRight size={18} /></span></Link>)}</div>
        </section>

        <section id="liderazgo" className="scroll-mt-24 py-16">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Personas que sirven</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Liderazgo de la iglesia</h2>
            <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">Pastores que acompañan, enseñan y sirven a nuestra comunidad.</p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
            {leaders.map((leader) => (
              <GlassCard key={leader.id} className="group overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {leader.photo_url ? (
                    <img
                      src={leader.photo_url}
                      alt={`Foto de ${leader.first_name} ${leader.last_name}`}
                      loading="lazy"
                      width={600}
                      height={450}
                      className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-105"
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

                </div>
              </GlassCard>
            ))}
          </div>
        </section>
        <section id="documentos" aria-labelledby="documents-heading" className="my-10 scroll-mt-28 rounded-3xl bg-slate-950 p-7 text-white sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-300">Nuestra organización</p>
          <h2 id="documents-heading" className="mt-3 font-serif text-3xl">Conoce los estatutos y el reglamento</h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-300">Consulta los documentos de la Iglesia Cuadrangular, léelos en línea o descarga los PDF originales.</p>
          <div className="mt-6 flex flex-wrap gap-5"><Link to="/nosotros/documentos" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-amber-300 px-5 font-semibold text-slate-950">Aprender más <ArrowRight size={18} /></Link><a href="/documentos/estatutos.pdf" download className="inline-flex min-h-12 items-center underline underline-offset-4">Descargar estatuto PDF</a><a href="/documentos/reglamento-interno.pdf" download className="inline-flex min-h-12 items-center underline underline-offset-4">Descargar reglamento PDF</a></div>
        </section>

      </div>
    </div>
  );
};

export default About;
