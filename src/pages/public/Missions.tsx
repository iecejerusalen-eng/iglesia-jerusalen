import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import type { COBEOptions } from 'cobe';
import {
  ArrowRight, BookOpen, Church, Compass, Database, Globe2,
  Languages, Map as MapIcon, MapPin, RefreshCw, Users,
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import type { Mission } from '../../types';
import { AnimeStaggerGrid } from '../../components/animations/AnimeWrappers';
import { fetchJoshuaProject, formatMissionNumber } from '../../features/missions/joshuaProject';
import type { JoshuaRecord } from '../../features/missions/types';
import { useThemeStore } from '../../store/useThemeStore';
import PremiumMissionsHero from './components/PremiumMissionsHero';

const explorationLinks = [
  { to: '/misiones/local', label: 'Misión local', description: 'Obras verificadas en Milagro y nuestra comunidad.', icon: Church, tone: 'emerald' },
  { to: '/misiones/nacional', label: 'Ecuador', description: 'Proyectos nacionales publicados por la iglesia.', icon: MapPin, tone: 'amber' },
  { to: '/misiones/continentes', label: 'Continentes', description: 'Panorama mundial y prioridades regionales.', icon: Globe2, tone: 'blue' },
  { to: '/misiones/paises', label: 'Países', description: 'Contexto demográfico y avance por nación.', icon: MapIcon, tone: 'violet' },
  { to: '/misiones/pueblos', label: 'Pueblos', description: 'Grupos étnicos para aprender, orar y servir.', icon: Users, tone: 'rose' },
  { to: '/misiones/idiomas', label: 'Idiomas', description: 'Lenguas y acceso a recursos del evangelio.', icon: Languages, tone: 'cyan' },
] as const;

const toneClasses = {
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
  cyan: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
};

const MissionCard = ({ mission }: { mission: Mission }) => {
  const goal = Number(mission.goal_amount) || 0;
  const current = Number(mission.current_amount) || 0;
  const progress = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : null;

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_18px_60px_-38px_rgba(15,23,42,.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {mission.image_url ? <img src={mission.image_url} alt={mission.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><Compass className="text-slate-300" size={42} /></div>}
        <span className="absolute left-4 top-4 rounded-full border border-white/60 bg-white/85 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-800 backdrop-blur-md">
          {mission.scope === 'national' ? 'Ecuador' : mission.scope === 'international' ? 'Internacional' : 'Local'}
        </span>
      </div>
      <div className="p-6">
        <p className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300"><MapPin size={13} /> {mission.location || mission.city || 'Ubicación por confirmar'}</p>
        <h3 className="mt-3 font-serif text-2xl font-black text-slate-900 dark:text-white">{mission.title}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{mission.description || 'El equipo de misiones actualizará pronto la descripción de este proyecto.'}</p>
        {progress != null && (
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-[11px] font-bold text-slate-500"><span>Financiamiento registrado</span><span>{progress}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
      </div>
    </article>
  );
};

export default function Missions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionsError, setMissionsError] = useState<string | null>(null);
  const [dailyPeople, setDailyPeople] = useState<JoshuaRecord | null>(null);
  const [joshuaError, setJoshuaError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useThemeStore((state) => state.theme);
  const globeIsDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
    const load = async () => {
      setLoading(true);
      const [missionsResult, dailyResult] = await Promise.allSettled([
        supabase.from('missions').select('id, title, description, location, goal_amount, current_amount, image_url, status, scope, country_code, region, city, is_published, metadata, start_date, end_date, created_at, updated_at').eq('is_published', true).order('created_at', { ascending: false }),
        fetchJoshuaProject({ resource: 'daily', limit: 1 }),
      ]);

      if (missionsResult.status === 'fulfilled' && !missionsResult.value.error) {
        setMissions((missionsResult.value.data || []) as Mission[]);
      } else {
        const message = missionsResult.status === 'rejected' ? String(missionsResult.reason) : missionsResult.value.error?.message;
        console.error('No se pudieron cargar los proyectos misioneros:', message);
        setMissionsError('Los proyectos institucionales no están disponibles en este momento.');
      }

      if (dailyResult.status === 'fulfilled') {
        setDailyPeople(dailyResult.value.records[0] || null);
      } else {
        console.warn('No se pudo cargar Joshua Project:', dailyResult.reason);
        setJoshuaError(dailyResult.reason instanceof Error ? dailyResult.reason.message : 'La fuente internacional no está disponible.');
      }
      setLoading(false);
    };
    void load();
  }, []);

  const activeMissions = missions.filter((mission) => mission.status === 'active');
  const countries = new Set(missions.map((mission) => mission.country_code).filter(Boolean)).size;
  const markers = useMemo(() => missions.flatMap((mission) => {
    const latitude = mission.metadata?.latitude;
    const longitude = mission.metadata?.longitude;
    return typeof latitude === 'number' && typeof longitude === 'number'
      ? [{ location: [latitude, longitude] as [number, number], size: 0.055 }]
      : [];
  }), [missions]);
  const globeConfig = useMemo<COBEOptions>(() => ({
    width: 720, height: 720, onRender: () => {}, devicePixelRatio: 1.2,
    phi: 0.5, theta: 0.2, dark: globeIsDark ? 1 : 0.15, diffuse: globeIsDark ? 1.1 : 0.8, mapSamples: 7000,
    mapBrightness: globeIsDark ? 2.2 : 1.6,
    baseColor: globeIsDark ? [0.04, 0.09, 0.18] : [0.38, 0.53, 0.72],
    markerColor: globeIsDark ? [0.96, 0.65, 0.15] : [0.78, 0.36, 0.04],
    glowColor: globeIsDark ? [0.08, 0.18, 0.32] : [0.62, 0.76, 1], markers,
  }), [globeIsDark, markers]);

  return (
    <>
      <Helmet>
        <title>Misiones | Iglesia Jerusalén</title>
        <meta name="description" content="Conoce la obra misionera de Iglesia Jerusalén y explora datos de pueblos, países e idiomas con atribución a Joshua Project." />
      </Helmet>
      <div className="relative min-h-screen overflow-hidden bg-slate-50 pb-24 dark:bg-slate-950">
        <div className="pointer-events-none absolute -left-56 top-96 h-[32rem] w-[32rem] rounded-full bg-amber-300/15 blur-[130px]" />

        <div className="px-4 pt-8 md:px-8 md:pt-12">
          <div className="mx-auto max-w-7xl">
            <PremiumMissionsHero
              globeConfig={globeConfig}
              missionCount={missions.length}
              activeMissionCount={activeMissions.length}
              countryCount={countries}
              markerCount={markers.length}
              loading={loading}
            />
          </div>
        </div>

        <section className="relative z-10 mx-auto -mt-5 max-w-6xl px-4 md:px-8">
          <div className="grid grid-cols-2 gap-3 rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/75 md:grid-cols-4">
            {[
              ['Proyectos activos', loading ? '—' : String(activeMissions.length)],
              ['Ámbitos publicados', loading ? '—' : String(new Set(missions.map(m => m.scope || 'local')).size)],
              ['Países registrados', loading ? '—' : String(countries)],
              ['Fuente internacional', 'Joshua Project'],
            ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-100 bg-white/60 p-4 dark:border-white/5 dark:bg-slate-950/40"><p className="text-xl font-black text-slate-950 dark:text-white md:text-2xl">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p></div>)}
          </div>
        </section>

        <section id="missions_fields" className="mx-auto mt-20 max-w-7xl px-4 md:px-8 scroll-mt-28">
          <div className="mb-8 max-w-2xl"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-amber-600">Centro misionero</p><h2 className="mt-3 font-serif text-4xl font-black text-slate-950 dark:text-white">Explora desde lo cercano hasta lo global</h2></div>
          <AnimeStaggerGrid className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {explorationLinks.map(({ to, label, description, icon: Icon, tone }) => (
              <Link key={to} to={to} className="group rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_18px_60px_-42px_rgba(15,23,42,.6)] backdrop-blur-xl transition hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/70">
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${toneClasses[tone]}`}><Icon size={22} /></div>
                <h3 className="mt-6 font-serif text-2xl font-black text-slate-900 dark:text-white">{label}</h3><p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-amber-700 dark:text-amber-300">Abrir sección <ArrowRight size={14} /></span>
              </Link>
            ))}
          </AnimeStaggerGrid>
        </section>

        <section id="missions_projects" className="mx-auto mt-20 grid max-w-7xl gap-6 px-4 md:px-8 lg:grid-cols-[.85fr_1.15fr] scroll-mt-28">
          <div id="missions_support" className="rounded-[2.2rem] border border-white/10 bg-[#0a1932] p-8 text-white shadow-2xl scroll-mt-28">
            <div className="flex items-center gap-2 text-amber-300"><Database size={17} /><span className="text-[10px] font-extrabold uppercase tracking-[.18em]">Enfoque de oración</span></div>
            {dailyPeople ? <>
              <h2 className="mt-5 font-serif text-4xl font-black">{dailyPeople.name}</h2>
              <p className="mt-2 text-sm font-bold text-amber-300">{[dailyPeople.country, dailyPeople.continent].filter(Boolean).join(' · ') || 'Contexto global'}</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/5 p-4"><p className="text-2xl font-black">{formatMissionNumber(dailyPeople.population)}</p><p className="text-[10px] uppercase tracking-wider text-slate-400">Población estimada</p></div>
                <div className="rounded-2xl bg-white/5 p-4"><p className="text-2xl font-black">{dailyPeople.evangelicalPercent == null ? 'No disponible' : `${dailyPeople.evangelicalPercent}%`}</p><p className="text-[10px] uppercase tracking-wider text-slate-400">Evangélicos estimados</p></div>
              </div>
              <Link to="/misiones/pueblos" className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-amber-300">Ver contexto y orar <ArrowRight size={15} /></Link>
            </> : <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5"><p className="font-bold">Fuente internacional pendiente</p><p className="mt-2 text-sm text-slate-300">{joshuaError || 'No se recibió un registro válido.'}</p></div>}
          </div>
          <div>
            <div className="mb-5 flex items-end justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-emerald-600">Nuestra iglesia</p><h2 className="mt-2 font-serif text-3xl font-black text-slate-950 dark:text-white">Proyectos publicados</h2></div><Link to="/misiones/local" className="text-xs font-extrabold text-amber-700">Ver todos</Link></div>
            {missionsError ? <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">{missionsError}</div> : missions.length ? <div className="grid gap-5 sm:grid-cols-2">{missions.slice(0, 2).map(mission => <MissionCard key={mission.id} mission={mission} />)}</div> : <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/60 p-10 text-center dark:border-white/15 dark:bg-slate-900/50"><RefreshCw className="mx-auto text-slate-300" /><h3 className="mt-4 font-serif text-xl font-black text-slate-900 dark:text-white">Aún no hay proyectos publicados</h3><p className="mt-2 text-sm text-slate-500">La administración puede publicar el primer proyecto sin inventar cifras ni ubicaciones.</p></div>}
          </div>
        </section>

        <section id="missions_guide" className="mx-auto mt-16 max-w-7xl px-4 md:px-8 scroll-mt-28">
          <div className="rounded-[2rem] border border-slate-200 bg-white/70 p-6 text-sm leading-relaxed text-slate-600 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300">
            <div className="flex items-start gap-3"><BookOpen className="mt-0.5 shrink-0 text-amber-600" size={19} /><div><p className="font-bold text-slate-900 dark:text-white">Cómo interpretar estos datos</p><p className="mt-1">Las poblaciones, porcentajes y escalas son estimaciones para oración, enseñanza e investigación. No deben usarse como localización operativa ni sustituir la verificación con líderes locales.</p><p className="mt-3 text-xs">Datos proporcionados por <a href="https://joshuaproject.net" target="_blank" rel="noreferrer" className="font-extrabold text-amber-700 underline">Joshua Project</a>. Acceso: agosto de 2026.</p></div></div>
          </div>
        </section>
      </div>
    </>
  );
}
