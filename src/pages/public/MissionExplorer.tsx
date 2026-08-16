import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Church, ExternalLink,
  Globe2, Languages, Loader2, MapPin, Search, Users,
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import type { Mission } from '../../types';
import { AnimeFadeUp, AnimeStaggerGrid } from '../../components/animations/AnimeWrappers';
import { fetchJoshuaProject, formatMissionNumber } from '../../features/missions/joshuaProject';
import type { JoshuaRecord, JoshuaResource, MissionScope } from '../../features/missions/types';

type Section = 'local' | 'nacional' | 'continentes' | 'paises' | 'pueblos' | 'idiomas';

const SECTION_CONFIG: Record<Section, { title: string; eyebrow: string; description: string; resource?: JoshuaResource; scope?: MissionScope; icon: typeof Globe2 }> = {
  local: { title: 'Misión local', eyebrow: 'Milagro y comunidad', description: 'Proyectos que la Iglesia Jerusalén publica y administra directamente en su entorno cercano.', scope: 'local', icon: Church },
  nacional: { title: 'Misión en Ecuador', eyebrow: 'Alcance nacional', description: 'Iniciativas verificadas por la iglesia dentro del país, organizadas desde el panel administrativo.', scope: 'national', icon: MapPin },
  continentes: { title: 'Continentes y regiones', eyebrow: 'Panorama global', description: 'Una lectura regional de los registros disponibles, útil para aprender y orientar la oración.', resource: 'countries', icon: Globe2 },
  paises: { title: 'Países', eyebrow: 'Explorador de naciones', description: 'Perfiles resumidos y paginados de países, sin replicar el portal completo de la fuente.', resource: 'countries', icon: MapPin },
  pueblos: { title: 'Pueblos y etnias', eyebrow: 'Grupos humanos', description: 'Conoce pueblos en contexto y transforma la información en oración responsable.', resource: 'people-groups', icon: Users },
  idiomas: { title: 'Idiomas', eyebrow: 'Lengua y acceso', description: 'Explora idiomas vinculados al trabajo de traducción, comunicación y discipulado.', resource: 'languages', icon: Languages },
};

const isSection = (value: string | undefined): value is Section => Boolean(value && value in SECTION_CONFIG);

const countryNames = new Intl.DisplayNames(['es'], { type: 'region' });
const getRecordName = (record: JoshuaRecord, section: Section) => {
  if ((section === 'paises' || section === 'continentes') && /^[A-Z]{2}$/i.test(record.id)) {
    return countryNames.of(record.id.toUpperCase()) || record.name;
  }
  return record.name;
};

const DataCard = ({ record, section }: { record: JoshuaRecord; section: Section }) => (
  <article className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_18px_60px_-40px_rgba(15,23,42,.5)] backdrop-blur-xl transition hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/70">
    <div className="flex flex-1 flex-col p-6">
      <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-amber-700 dark:text-amber-300">{record.continent || record.region || 'Joshua Project'}</p>
      <h2 className="mt-3 font-serif text-2xl font-black text-slate-950 dark:text-white">{getRecordName(record, section)}</h2>
      <p className="mt-2 text-sm font-semibold text-slate-500">{[record.country, record.language, record.religion].filter(Boolean).join(' · ') || 'Contexto no especificado'}</p>
      <dl className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50"><dt className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Población</dt><dd className="mt-1 text-lg font-black text-slate-900 dark:text-white">{formatMissionNumber(record.population)}</dd></div>
        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50"><dt className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Escala de progreso</dt><dd className="mt-1 text-lg font-black text-slate-900 dark:text-white">{record.progressScale ?? 'No disponible'}</dd></div>
      </dl>
      <a href="https://joshuaproject.net" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-xs font-extrabold text-amber-700 dark:text-amber-300">Consultar fuente <ExternalLink size={13} /></a>
    </div>
  </article>
);

const ProjectCard = ({ mission }: { mission: Mission }) => {
  const goal = Number(mission.goal_amount) || 0;
  const current = Number(mission.current_amount) || 0;
  const percentage = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : null;
  return <article className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
    <div className="aspect-[16/8] bg-slate-100 dark:bg-slate-800">{mission.image_url ? <img src={mission.image_url} alt={mission.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Church className="text-slate-300" size={42} /></div>}</div>
    <div className="p-6"><p className="flex items-center gap-1.5 text-xs font-bold text-amber-700"><MapPin size={13} />{mission.location || mission.city || 'Ubicación por confirmar'}</p><h2 className="mt-3 font-serif text-2xl font-black text-slate-950 dark:text-white">{mission.title}</h2><p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{mission.description || 'Sin descripción publicada.'}</p>{percentage != null && <div className="mt-5"><div className="mb-2 flex justify-between text-xs font-bold text-slate-500"><span>Avance financiero registrado</span><span>{percentage}%</span></div><div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-amber-500" style={{ width: `${percentage}%` }} /></div></div>}</div>
  </article>;
};

export default function MissionExplorer() {
  const { section: sectionParam } = useParams<{ section: string }>();
  const section: Section = isSection(sectionParam) ? sectionParam : 'pueblos';
  const config = SECTION_CONFIG[section];
  const Icon = config.icon;
  const [records, setRecords] = useState<JoshuaRecord[]>([]);
  const [projects, setProjects] = useState<Mission[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 450);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    window.scrollTo(0, 0);
    window.setTimeout(() => setLoading(true), 0);
    window.setTimeout(() => setError(null), 0);
    const load = async () => {
      try {
        if (config.scope) {
          const { data, error: dbError } = await supabase.from('missions').select('*').eq('scope', config.scope).eq('is_published', true).order('created_at', { ascending: false });
          if (dbError) throw dbError;
          setProjects((data || []) as Mission[]);
        } else if (config.resource) {
          const response = await fetchJoshuaProject({ resource: config.resource, page, limit: 12, search: debouncedSearch });
          setRecords(response.records);
          setFetchedAt(response.fetchedAt);
        }
      } catch (loadError: unknown) {
        console.error(`No se pudo cargar la sección ${section}:`, loadError);
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar esta sección.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [config.resource, config.scope, debouncedSearch, page, section]);

  const visibleRecords = useMemo(() => {
    if (section !== 'continentes') return records;
    const continentMap = new Map<string, JoshuaRecord>();
    for (const record of records) {
      const continent = record.continent || 'Región no especificada';
      if (!continentMap.has(continent)) continentMap.set(continent, { ...record, id: continent, name: continent, country: undefined, language: undefined, religion: undefined });
    }
    return [...continentMap.values()];
  }, [records, section]);

  return <main className="min-h-screen bg-slate-50 pb-24 dark:bg-slate-950">
    <Helmet><title>{config.title} | Misiones Jerusalén</title><meta name="description" content={config.description} /></Helmet>
    <section className="px-4 pt-8 md:px-8 md:pt-12"><AnimeFadeUp className="mx-auto max-w-7xl rounded-[2.5rem] border border-white/10 bg-[#07152d] p-8 text-white shadow-2xl md:p-14">
      <Link to="/misiones" className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-amber-300"><ArrowLeft size={15} /> Centro de misiones</Link>
      <div className="mt-10 grid gap-6 md:grid-cols-[auto_1fr] md:items-end"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-400 text-slate-950"><Icon size={28} /></div><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-amber-300">{config.eyebrow}</p><h1 className="mt-3 font-serif text-5xl font-black md:text-6xl">{config.title}</h1><p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">{config.description}</p></div></div>
    </AnimeFadeUp></section>

    <section className="mx-auto mt-8 max-w-7xl px-4 md:px-8">
      {!config.scope && <div className="flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 sm:flex-row">
        <label className="relative flex-1"><span className="sr-only">Buscar</span><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar en los registros disponibles" className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-amber-400 dark:border-white/10 dark:bg-slate-950" /></label>
        <div className="flex items-center gap-2 text-xs text-slate-500"><BookOpen size={15} className="text-amber-600" />Resultados limitados y paginados · valor educativo</div>
      </div>}

      {error && <div className="mt-8 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-950/20 dark:text-red-300"><AlertTriangle className="shrink-0" size={18} /><div><p className="font-bold">No pudimos consultar los datos</p><p className="mt-1">{error}</p></div></div>}
      {loading ? <div className="grid min-h-72 place-items-center"><Loader2 className="animate-spin text-amber-600" size={32} /></div> : config.scope ? (
        projects.length ? <AnimeStaggerGrid className="mt-8 grid gap-6 md:grid-cols-2">{projects.map(project => <ProjectCard key={project.id} mission={project} />)}</AnimeStaggerGrid> : <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white/60 p-12 text-center dark:border-white/15 dark:bg-slate-900/50"><Church className="mx-auto text-slate-300" size={40} /><h2 className="mt-5 font-serif text-2xl font-black text-slate-950 dark:text-white">Sin proyectos publicados</h2><p className="mt-2 text-sm text-slate-500">No se mostrarán proyectos ficticios. El equipo puede publicarlos desde Administración.</p></div>
      ) : !error && visibleRecords.length ? <AnimeStaggerGrid className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{visibleRecords.map(record => <DataCard key={`${record.id}-${record.name}`} record={record} section={section} />)}</AnimeStaggerGrid> : !error && <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 p-12 text-center"><p className="font-bold text-slate-700 dark:text-slate-300">No hay registros para esta consulta.</p></div>}

      {!config.scope && !error && <div className="mt-10 flex items-center justify-between"><button disabled={page === 1 || loading} onClick={() => setPage(current => Math.max(1, current - 1))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40 dark:border-white/10">Anterior</button><span className="text-xs font-bold text-slate-500">Página {page}</span><button disabled={loading || records.length < 12} onClick={() => setPage(current => current + 1)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-40 dark:bg-white dark:text-slate-950">Siguiente <ArrowRight size={14} /></button></div>}

      {!config.scope && <div className="mt-12 rounded-[2rem] border border-slate-200 bg-white/70 p-6 text-sm leading-relaxed text-slate-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300"><p><strong>Datos proporcionados por <a className="text-amber-700 underline" href="https://joshuaproject.net" target="_blank" rel="noreferrer">Joshua Project</a>.</strong> Son estimaciones de investigación; un cero puede significar cero, una cifra muy pequeña redondeada o un valor desconocido.</p>{fetchedAt && <p className="mt-2 text-xs text-slate-400">Última consulta almacenada: {new Intl.DateTimeFormat('es-EC', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(fetchedAt))}.</p>}</div>}
    </section>
  </main>;
}
