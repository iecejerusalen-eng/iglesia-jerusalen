import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock3, Download,
  GraduationCap, Laptop, Search, Sparkles, Users, WifiOff,
} from 'lucide-react';
import { fetchProgramCatalog } from '../../features/study-programs/service';
import type { StudyProgram, StudyProgramType } from '../../features/study-programs/types';

const typeDetails: Record<StudyProgramType, { label: string; description: string; icon: typeof Users }> = {
  community_group: { label: 'Grupos en comunidad', description: 'Encuentros con facilitador, calendario y acompañamiento.', icon: Users },
  self_guided: { label: 'A tu ritmo', description: 'Avanza paso a paso sin depender de un horario o docente.', icon: Laptop },
  facilitated: { label: 'Con acompañamiento', description: 'Contenido flexible con una persona que orienta el proceso.', icon: GraduationCap },
  downloadable: { label: 'Para descargar', description: 'Guías y materiales que puedes utilizar incluso sin conexión.', icon: Download },
};

const modalityLabel = {
  online: 'En línea', in_person: 'Presencial', hybrid: 'Híbrido', offline_package: 'Sin conexión',
};

function ProgramCard({ program }: { program: StudyProgram }) {
  const details = typeDetails[program.program_type];
  const TypeIcon = details.icon;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex min-h-[27rem] flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/75 shadow-[0_24px_70px_-45px_rgba(15,23,42,.45)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-amber-300/70 hover:shadow-[0_30px_80px_-40px_rgba(37,99,235,.35)] dark:border-white/10 dark:bg-slate-900/65"
    >
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-blue-950 via-indigo-900 to-slate-900">
        {program.cover_image_url ? (
          <img src={program.cover_image_url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center"><BookOpen className="h-16 w-16 text-white/25" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/45 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md">
            <TypeIcon size={13} /> {details.label}
          </span>
          {program.is_featured && <span className="rounded-full bg-amber-400 px-3 py-1.5 text-[11px] font-black text-slate-950">Destacado</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500 dark:text-slate-400">
          <span>{program.category}</span><span className="h-1 w-1 rounded-full bg-amber-400" /><span>{program.audience}</span>
        </div>
        <h2 className="font-serif text-2xl font-bold leading-tight text-slate-950 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-amber-300">{program.title}</h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{program.summary || program.description}</p>
        <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-2 rounded-xl bg-slate-100/80 px-3 py-2 dark:bg-white/5"><Laptop size={14} />{modalityLabel[program.modality]}</span>
          <span className="flex items-center gap-2 rounded-xl bg-slate-100/80 px-3 py-2 dark:bg-white/5"><BookOpen size={14} />{program.lesson_count ?? 0} lecciones</span>
          {program.duration_label && <span className="col-span-2 flex items-center gap-2 px-1 pt-1"><Clock3 size={14} />{program.duration_label}</span>}
        </div>
        <Link to={`/programas/${program.source === 'study_programs' ? program.slug : program.id}`} className="mt-auto flex items-center justify-between border-t border-slate-200 pt-5 font-bold text-blue-700 dark:border-white/10 dark:text-amber-300">
          Ver programa <ArrowRight size={18} className="transition group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.article>
  );
}

export default function ProgramsOverview() {
  const [programs, setPrograms] = useState<StudyProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compatibilityMode, setCompatibilityMode] = useState(false);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | StudyProgramType>('all');

  useEffect(() => {
    let active = true;
    fetchProgramCatalog()
      .then((result) => {
        if (!active) return;
        setPrograms(result.programs);
        setCompatibilityMode(result.compatibilityMode);
      })
      .catch((reason: unknown) => {
        console.error('No fue posible cargar el catálogo de programas.', reason);
        if (active) setError('No pudimos cargar los programas en este momento. Inténtalo nuevamente.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    return programs.filter((program) => {
      const matchesType = type === 'all' || program.program_type === type;
      const haystack = `${program.title} ${program.summary} ${program.category} ${program.audience} ${program.tags.join(' ')}`.toLocaleLowerCase('es');
      return matchesType && (!normalized || haystack.includes(normalized));
    });
  }, [programs, query, type]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-950 dark:bg-[#030817] dark:text-white">
      <section id="programs" className="relative isolate scroll-mt-28 px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,.2),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(245,158,11,.13),transparent_28%)]" />
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-white/20 bg-gradient-to-br from-[#0b1f52] via-[#172f78] to-[#07122f] px-6 py-14 text-white shadow-[0_35px_100px_-35px_rgba(20,45,120,.65)] sm:px-10 lg:px-14">
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_.75fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-amber-200"><Sparkles size={14} /> Crecer juntos</span>
              <h1 className="mt-6 max-w-3xl font-serif text-4xl font-bold leading-[1.05] sm:text-6xl">Programas para vivir la fe, a tu ritmo o en comunidad.</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-blue-100/85 sm:text-lg">Grupos en vivo, devocionales, lecturas guiadas y cursos gratuitos. Aquí no hay notas ni matrículas académicas: eliges una experiencia y comienzas.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
              <div className="rounded-2xl bg-white/10 p-4"><strong className="text-3xl">{programs.length}</strong><span className="mt-1 block text-xs text-blue-100">programas disponibles</span></div>
              <div className="rounded-2xl bg-white/10 p-4"><strong className="text-3xl">4</strong><span className="mt-1 block text-xs text-blue-100">formas de aprender</span></div>
              <div className="col-span-2 flex items-center gap-3 rounded-2xl bg-amber-300/10 p-4 text-sm text-amber-100"><CheckCircle2 size={20} /> Contenido gratuito y acompañamiento pastoral</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="-mt-8 mb-10 rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/75">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <label className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
              <span className="sr-only">Buscar programas</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por tema, audiencia o nombre…" className="h-13 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950" />
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar por tipo de programa">
              <button onClick={() => setType('all')} className={`shrink-0 rounded-xl px-4 py-3 text-xs font-bold transition ${type === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'}`}>Todos</button>
              {(Object.entries(typeDetails) as Array<[StudyProgramType, (typeof typeDetails)[StudyProgramType]]>).map(([value, details]) => (
                <button key={value} onClick={() => setType(value)} className={`shrink-0 rounded-xl px-4 py-3 text-xs font-bold transition ${type === value ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'}`}>{details.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div id="categories" className="mb-8 grid scroll-mt-28 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.entries(typeDetails) as Array<[StudyProgramType, (typeof typeDetails)[StudyProgramType]]>).map(([value, details]) => {
            const Icon = details.icon;
            return <button key={value} onClick={() => setType(value)} className="rounded-2xl border border-slate-200 bg-white/65 p-5 text-left transition hover:border-blue-300 dark:border-white/10 dark:bg-white/5"><Icon className="mb-3 text-blue-700 dark:text-amber-300" /><strong className="block text-sm">{details.label}</strong><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{details.description}</span></button>;
          })}
        </div>

        <div id="catalog" className="scroll-mt-28">
        {compatibilityMode && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300/40 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-400/10 dark:text-amber-100">
            <WifiOff className="mt-0.5 shrink-0" size={18} /><p>Mostrando los recursos existentes en modo de compatibilidad. Al instalar la migración, se habilitarán grupos, cohortes, progreso sincronizado y material privado del facilitador.</p>
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-[27rem] animate-pulse rounded-[2rem] bg-slate-200/70 dark:bg-white/5" />)}</div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-100"><p>{error}</p><button onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-red-700 px-5 py-2.5 text-sm font-bold text-white">Reintentar</button></div>
        ) : filtered.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filtered.map((program) => <ProgramCard key={`${program.source}-${program.id}`} program={program} />)}</div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center dark:border-white/15 dark:bg-white/5"><CalendarDays className="mx-auto mb-4 text-slate-400" size={42} /><h2 className="font-serif text-2xl font-bold">No encontramos programas</h2><p className="mt-2 text-sm text-slate-500">Prueba otro término o selecciona una forma de aprendizaje diferente.</p></div>
        )}
        </div>
      </section>
    </main>
  );
}
