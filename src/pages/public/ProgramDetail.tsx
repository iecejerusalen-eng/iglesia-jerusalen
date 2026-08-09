import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, CalendarDays, Check, ChevronDown, ChevronRight, Clock3, ExternalLink, Laptop, LockKeyhole, MessageSquareText, Play, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import BlockLessonRenderer from '../../components/public/BlockLessonRenderer';
import { fetchProgramDetail } from '../../features/study-programs/service';
import type { StudyProgramDetail, StudyProgramLesson } from '../../features/study-programs/types';
import { fetchEditorialSpace, isEditorialSchemaMissing } from '../../features/editorial/service';
import type { EditorialSpaceFeed } from '../../features/editorial/types';

const typeLabel = { community_group: 'Grupo en comunidad', self_guided: 'Curso a tu ritmo', facilitated: 'Programa acompañado', downloadable: 'Material descargable' };
const accessLabel = { public: 'Acceso público', account: 'Requiere una cuenta', approval: 'Ingreso con aprobación', invitation: 'Solo con invitación' };

const readLocalProgress = (programId: string): string[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(`study-progress-${programId}`) ?? '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch (error: unknown) {
    console.warn('No se pudo leer el progreso local del programa.', error);
    return [];
  }
};

export default function ProgramDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [program, setProgram] = useState<StudyProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeLesson, setActiveLesson] = useState<StudyProgramLesson | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [joining, setJoining] = useState(false);
  const [meetingLinks, setMeetingLinks] = useState<Record<string, string>>({});
  const [editorialFeed, setEditorialFeed] = useState<EditorialSpaceFeed | null>(null);

  useEffect(() => {
    let active = true;
    fetchProgramDetail(id)
      .then((result) => {
        if (!active) return;
        setProgram(result);
        if (result) {
          setCompleted(readLocalProgress(result.id));
          setExpanded(result.sections[0] ? { [result.sections[0].id]: true } : {});
        }
      })
      .catch((reason: unknown) => {
        console.error('No fue posible cargar el programa.', reason);
        if (active) setError('No pudimos cargar este programa.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!program || program.source !== 'study_programs') return;
    let active = true;
    fetchEditorialSpace(program.slug).then((result) => { if (active) setEditorialFeed(result); }).catch((reason: unknown) => {
      if (!isEditorialSchemaMissing(reason as { code?: string; message?: string })) console.error('No se pudo cargar la bitácora vinculada.', reason);
    });
    return () => { active = false; };
  }, [program]);

  useEffect(() => {
    if (!user || !program || program.source !== 'study_programs' || program.cohorts.length === 0) return;
    let active = true;
    supabase.from('study_cohort_private_access').select('cohort_id, meeting_url').in('cohort_id', program.cohorts.map((cohort) => cohort.id))
      .then(({ data, error: accessError }) => {
        if (accessError) { console.error('No se pudieron consultar los enlaces privados del grupo.', accessError); return; }
        if (!active) return;
        setMeetingLinks(Object.fromEntries((data ?? []).filter((row) => typeof row.meeting_url === 'string' && row.meeting_url).map((row) => [row.cohort_id, row.meeting_url as string])));
      });
    return () => { active = false; };
  }, [program, user]);

  const totalLessons = program?.sections.reduce((total, section) => total + section.lessons.length, 0) ?? 0;
  const progress = totalLessons ? Math.round((completed.length / totalLessons) * 100) : 0;
  const firstLesson = useMemo(() => program?.sections.flatMap((section) => section.lessons)[0] ?? null, [program]);

  const markCompleted = async (lesson: StudyProgramLesson) => {
    if (!program) return;
    const next = completed.includes(lesson.id) ? completed.filter((value) => value !== lesson.id) : [...completed, lesson.id];
    setCompleted(next);
    localStorage.setItem(`study-progress-${program.id}`, JSON.stringify(next));
    if (user && program.source === 'study_programs') {
      const isComplete = next.includes(lesson.id);
      const { error: progressError } = await supabase.from('study_progress').upsert({
        user_id: user.id,
        lesson_id: lesson.id,
        status: isComplete ? 'completed' : 'in_progress',
        progress_percent: isComplete ? 100 : 0,
        completed_at: isComplete ? new Date().toISOString() : null,
      }, { onConflict: 'user_id,lesson_id' });
      if (progressError) {
        console.error('El progreso se guardó localmente, pero no se pudo sincronizar.', progressError);
        toast.warning('Tu avance quedó guardado en este dispositivo, pero aún no se sincronizó.');
      }
    }
  };

  const requestAccess = async (cohortId?: string) => {
    if (!program || program.source !== 'study_programs') return;
    if (!user) {
      window.location.href = `/login?redirectTo=${encodeURIComponent(`/programas/${id}`)}`;
      return;
    }
    setJoining(true);
    const automatic = program.access_type === 'public' || program.access_type === 'account';
    const { error: joinError } = await supabase.from('study_memberships').insert({
      program_id: program.id, cohort_id: cohortId ?? null, user_id: user.id, member_role: 'participant', status: automatic ? 'active' : 'pending', joined_at: automatic ? new Date().toISOString() : null,
    });
    setJoining(false);
    if (joinError?.code === '23505') toast.info('Ya formas parte de este programa o tienes una solicitud pendiente.');
    else if (joinError) {
      console.error('No fue posible registrar la participación.', joinError);
      toast.error('No pudimos registrar tu solicitud. Inténtalo nuevamente.');
    } else {
      toast.success(automatic ? 'Ya puedes comenzar el programa.' : 'Tu solicitud fue enviada para revisión.');
      if (automatic) {
        const refreshed = await fetchProgramDetail(id);
        if (refreshed) setProgram(refreshed);
      }
    }
  };

  if (loading) return <main className="min-h-screen bg-slate-50 px-4 py-20 dark:bg-[#030817]"><div className="mx-auto h-[34rem] max-w-6xl animate-pulse rounded-[2.5rem] bg-slate-200 dark:bg-white/5" /></main>;
  if (error || !program) return <main className="min-h-screen bg-slate-50 px-4 py-24 text-center dark:bg-[#030817] dark:text-white"><BookOpen className="mx-auto mb-5 text-slate-400" size={52} /><h1 className="font-serif text-3xl font-bold">Programa no disponible</h1><p className="mt-3 text-slate-500">{error ?? 'El programa no existe o todavía no está publicado.'}</p><Link to="/programas" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"><ArrowLeft size={17} /> Volver a programas</Link></main>;

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-950 dark:bg-[#030817] dark:text-white">
      <section id="program_hero" className="relative overflow-hidden bg-gradient-to-br from-[#071631] via-[#13327d] to-[#08142d] px-4 py-16 text-white sm:px-6 lg:px-8 scroll-mt-28">
        {program.cover_image_url && <img src={program.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />}
        <div className="absolute inset-0 bg-gradient-to-r from-[#071631] via-[#071631]/90 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <Link to="/programas" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-blue-100 hover:text-white"><ArrowLeft size={17} /> Todos los programas</Link>
          <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-end">
            <div>
              <div className="flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-amber-300 px-3 py-1.5 text-slate-950">{typeLabel[program.program_type]}</span><span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">{program.category}</span></div>
              <h1 className="mt-6 max-w-4xl font-serif text-4xl font-bold leading-tight sm:text-6xl">{program.title}</h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-blue-100/90 sm:text-lg">{program.summary || program.description}</p>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-blue-100"><span className="flex items-center gap-2"><BookOpen size={17} />{totalLessons} lecciones</span><span className="flex items-center gap-2"><Laptop size={17} />{accessLabel[program.access_type]}</span>{program.duration_label && <span className="flex items-center gap-2"><Clock3 size={17} />{program.duration_label}</span>}</div>
            </div>
            <div id="program_enroll" className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-2xl scroll-mt-28">
              <div className="flex items-end justify-between"><span className="text-sm text-blue-100">Tu avance</span><strong className="text-3xl">{progress}%</strong></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-amber-300 transition-all" style={{ width: `${progress}%` }} /></div>
              <button onClick={() => firstLesson && setActiveLesson(firstLesson)} disabled={!firstLesson} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-blue-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"><Play size={17} /> {progress ? 'Continuar' : 'Comenzar ahora'}</button>
              {program.source === 'study_programs' && program.access_type !== 'public' && program.cohorts.length === 0 && <button onClick={() => requestAccess()} disabled={joining} className="mt-2 w-full rounded-2xl border border-white/20 px-5 py-3 text-sm font-bold hover:bg-white/10 disabled:opacity-50">{joining ? 'Procesando…' : program.access_type === 'approval' ? 'Solicitar acceso' : 'Unirme al programa'}</button>}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_22rem] lg:px-8">
        <section id="program_curriculum" className="scroll-mt-28">
          <div className="mb-6"><span className="text-xs font-black uppercase tracking-[.18em] text-blue-700 dark:text-amber-300">Ruta del programa</span><h2 className="mt-2 font-serif text-3xl font-bold">Contenido y actividades</h2></div>
          {program.sections.length ? <div className="space-y-4">{program.sections.map((section, index) => (
            <article key={section.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <button onClick={() => setExpanded((current) => ({ ...current, [section.id]: !current[section.id] }))} className="flex w-full items-center justify-between gap-4 p-5 text-left">
                <span><span className="text-[11px] font-black uppercase tracking-widest text-blue-700 dark:text-amber-300">Etapa {index + 1}</span><strong className="mt-1 block font-serif text-xl">{section.title}</strong>{section.description && <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{section.description}</span>}</span>
                {expanded[section.id] ? <ChevronDown /> : <ChevronRight />}
              </button>
              {expanded[section.id] && <div className="border-t border-slate-200 p-3 dark:border-white/10">{section.lessons.map((lesson, lessonIndex) => (
                <button key={lesson.id} onClick={() => setActiveLesson(lesson)} className="group flex w-full items-center gap-4 rounded-xl p-3 text-left transition hover:bg-blue-50 dark:hover:bg-white/5">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${completed.includes(lesson.id) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/10'}`}>{completed.includes(lesson.id) ? <Check size={18} /> : lessonIndex + 1}</span>
                  <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{lesson.title}</strong><span className="mt-0.5 block text-xs text-slate-500">{lesson.lesson_type === 'devotional' ? 'Devocional' : lesson.lesson_type === 'reading' ? 'Lectura' : lesson.lesson_type === 'activity' ? 'Actividad interactiva' : 'Lección'}{lesson.estimated_minutes ? ` · ${lesson.estimated_minutes} min` : ''}</span></span>
                  <Play size={16} className="text-blue-700 opacity-0 transition group-hover:opacity-100 dark:text-amber-300" />
                </button>
              ))}</div>}
            </article>
          ))}</div> : <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-white/15">Este programa está publicado, pero todavía no tiene lecciones disponibles.</div>}
        </section>

        <aside id="program_docent" className="space-y-5 scroll-mt-28">
          {program.cohorts.length > 0 && <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5"><div className="flex items-center gap-2 font-bold"><Users size={18} className="text-blue-700 dark:text-amber-300" /> Grupos disponibles</div><div className="mt-4 space-y-3">{program.cohorts.map((cohort) => <div key={cohort.id} className="rounded-2xl bg-slate-100 p-4 dark:bg-white/5"><strong className="text-sm">{cohort.name}</strong>{cohort.schedule_text && <span className="mt-2 flex gap-2 text-xs text-slate-500"><CalendarDays size={14} />{cohort.schedule_text}</span>}{meetingLinks[cohort.id] ? <a href={meetingLinks[cohort.id]} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">Entrar a la reunión <ExternalLink size={13} /></a> : <button onClick={() => requestAccess(cohort.id)} className="mt-3 text-xs font-bold text-blue-700 dark:text-amber-300">Solicitar participación</button>}</div>)}</div></div>}
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5"><div className="flex items-center gap-2 font-bold"><LockKeyhole size={18} className="text-emerald-600" /> Contenido seguro</div><p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Las guías con respuestas y notas internas solo son visibles para facilitadores autorizados. Tu progreso personal se guarda en este dispositivo y se sincroniza al iniciar sesión.</p></div>
          {editorialFeed && <Link to={`/publicaciones/${editorialFeed.space.slug}`} className="group block rounded-3xl border border-amber-300/30 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:from-amber-300/10 dark:to-white/5"><div className="flex items-center gap-2 font-bold"><MessageSquareText size={18} className="text-amber-600 dark:text-amber-300" /> Bitácora del grupo</div><p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-300">Lecturas, anuncios, devocionales y conversaciones. Algunas entradas son exclusivas para integrantes.</p><span className="mt-4 flex items-center gap-1 text-xs font-black text-blue-700 dark:text-amber-300">Ver {editorialFeed.documents.length} publicaciones <ChevronRight size={14} /></span></Link>}
        </aside>
      </div>

      {activeLesson && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-label={activeLesson.title}>
          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} className="mx-auto min-h-[calc(100vh-1.5rem)] max-w-4xl rounded-[2rem] bg-white p-5 shadow-2xl sm:min-h-0 sm:p-8 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-5 border-b border-slate-200 pb-5 dark:border-white/10"><div><span className="text-xs font-black uppercase tracking-widest text-blue-700 dark:text-amber-300">{activeLesson.lesson_type}</span><h2 className="mt-1 font-serif text-2xl font-bold">{activeLesson.title}</h2></div><button onClick={() => setActiveLesson(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold dark:border-white/10">Cerrar</button></div>
            <div className="py-8"><BlockLessonRenderer content={JSON.stringify(activeLesson.content_blocks)} lessonId={activeLesson.id} /></div>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between dark:border-white/10"><button onClick={() => setActiveLesson(null)} className="rounded-xl px-5 py-3 text-sm font-bold text-slate-600 dark:text-slate-300">Volver al contenido</button><button onClick={() => markCompleted(activeLesson)} className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white ${completed.includes(activeLesson.id) ? 'bg-slate-600' : 'bg-emerald-600'}`}><Check size={17} />{completed.includes(activeLesson.id) ? 'Marcar como pendiente' : 'Completar lección'}</button></div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
