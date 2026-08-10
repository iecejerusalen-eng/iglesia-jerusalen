import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookMarked,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Layers3,
  Loader2,
  LockKeyhole,
  RefreshCw,
  School,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePublicSchoolCatalog, type PublicSchoolCourse } from '../hooks/usePublicSchoolCatalog';

const FALLBACK_COURSE_IMAGE = 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=82&w=1200';

function schoolModelLabel(type: 'age_based' | 'rank_based' | 'custom') {
  if (type === 'age_based') return 'Formación por edades';
  if (type === 'rank_based') return 'Formación por rangos';
  return 'Ruta académica';
}

function courseActionLabel(course: PublicSchoolCourse, isAuthenticated: boolean) {
  if (course.access === 'enrolled') return 'Continuar curso';
  if (course.access === 'pending') return 'Solicitud en revisión';
  if (course.access === 'approved') return 'Matrícula aprobada';
  if (course.access === 'rejected') return 'Solicitar revisión';
  return isAuthenticated ? 'Solicitar matrícula' : 'Iniciar sesión para inscribirme';
}

export function PublicSchoolCatalog() {
  const navigate = useNavigate();
  const { schools, isLoading, error, refetch, requestEnrollment, isAuthenticated } = usePublicSchoolCatalog();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [requestingCourseId, setRequestingCourseId] = useState<string | null>(null);

  const selectedSchool = schools.find(school => school.id === selectedSchoolId) ?? schools[0] ?? null;
  const groupedCourses = useMemo(() => {
    const groups = new Map<string, PublicSchoolCourse[]>();
    selectedSchool?.courses.forEach(course => {
      const group = course.levelName || 'Formación general';
      groups.set(group, [...(groups.get(group) ?? []), course]);
    });
    return [...groups.entries()];
  }, [selectedSchool]);

  const handleCourseAction = async (course: PublicSchoolCourse) => {
    if (course.access === 'enrolled') {
      navigate(`/lms/curso/${course.id}`);
      return;
    }
    if (course.access === 'pending' || course.access === 'approved') return;
    if (!isAuthenticated) {
      navigate(`/login?redirectTo=${encodeURIComponent('/aula-virtual#lms_schools')}`);
      return;
    }

    setRequestingCourseId(course.id);
    try {
      await requestEnrollment.mutateAsync({ courseId: course.id });
      toast.success(course.access === 'rejected' ? 'Solicitud reenviada para revisión.' : 'Solicitud de matrícula enviada.');
    } catch (requestError) {
      console.error('No se pudo solicitar la matrícula al curso:', requestError);
      toast.error(requestError instanceof Error ? requestError.message : 'No se pudo enviar la solicitud de matrícula.');
    } finally {
      setRequestingCourseId(null);
    }
  };

  return (
    <section id="lms_schools" className="scroll-mt-28" aria-labelledby="lms-schools-title">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/75 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700 shadow-sm backdrop-blur-xl dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-200">
          <School size={13} /> Escuelas de formación
        </span>
        <h2 id="lms-schools-title" className="mt-4 font-serif text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">Primero elige tu escuela</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
          Cada escuela reúne sus niveles y cursos. Puedes explorar el catálogo públicamente; para abrir las clases necesitas una matrícula aprobada.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-9 grid gap-5 md:grid-cols-2">
          {[0, 1].map(item => <div key={item} className="h-64 animate-pulse rounded-[2rem] border border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/5" />)}
        </div>
      ) : error ? (
        <div className="mx-auto mt-9 max-w-2xl rounded-[2rem] border border-rose-200 bg-rose-50/90 p-7 text-center dark:border-rose-400/20 dark:bg-rose-500/10">
          <LockKeyhole className="mx-auto text-rose-500" size={34} />
          <h3 className="mt-4 font-serif text-xl font-bold text-rose-950 dark:text-rose-100">No pudimos cargar las escuelas</h3>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-200/80">{error instanceof Error ? error.message : 'Ocurrió un error al consultar el catálogo académico.'}</p>
          <button type="button" onClick={() => void refetch()} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white transition hover:bg-rose-700"><RefreshCw size={16} /> Reintentar</button>
        </div>
      ) : schools.length === 0 ? (
        <div className="mx-auto mt-9 max-w-2xl rounded-[2rem] border border-dashed border-slate-300 bg-white/50 p-10 text-center dark:border-white/15 dark:bg-white/5">
          <School className="mx-auto text-slate-300" size={38} />
          <h3 className="mt-4 font-bold text-slate-800 dark:text-white">Aún no hay escuelas publicadas</h3>
          <p className="mt-2 text-sm text-slate-500">La administración académica debe activar una escuela y vincular sus cursos.</p>
        </div>
      ) : (
        <>
          <div className="mt-9 grid gap-5 md:grid-cols-2">
            {schools.map((school, index) => {
              const isSelected = selectedSchool?.id === school.id;
              const Icon = school.schoolType === 'rank_based' ? ShieldCheck : UsersRound;
              return (
                <motion.button
                  key={school.id}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedSchoolId(school.id)}
                  aria-pressed={isSelected}
                  className={`group relative min-h-64 overflow-hidden rounded-[2rem] border p-6 text-left shadow-sm transition duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 sm:p-7 ${isSelected ? 'border-indigo-300 bg-slate-950 text-white shadow-2xl shadow-indigo-950/20 dark:border-indigo-400/40' : 'border-white/80 bg-white/75 text-slate-900 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.055] dark:text-white'}`}
                >
                  {school.coverImageUrl ? <img src={school.coverImageUrl} alt="" loading="lazy" decoding="async" className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105 ${isSelected ? 'opacity-25' : 'opacity-10 dark:opacity-15'}`} /> : null}
                  <div className={`absolute inset-0 ${isSelected ? 'bg-gradient-to-br from-slate-950/80 via-indigo-950/75 to-slate-950/90' : 'bg-gradient-to-br from-white/80 via-white/70 to-indigo-50/80 dark:from-slate-950/80 dark:via-slate-950/70 dark:to-indigo-950/60'}`} />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <span className="grid size-12 place-items-center rounded-2xl border border-current/10 bg-current/5" style={{ color: school.color }}><Icon size={23} /></span>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${isSelected ? 'bg-white/10 text-indigo-100' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200'}`}>{schoolModelLabel(school.schoolType)}</span>
                    </div>
                    <div className="mt-auto pt-12">
                      <h3 className="font-serif text-2xl font-black sm:text-3xl">{school.name}</h3>
                      <p className={`mt-2 line-clamp-2 text-sm leading-6 ${isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'}`}>{school.description || 'Formación bíblica y acompañamiento para cada etapa de vida.'}</p>
                      <div className={`mt-5 flex items-center gap-4 border-t pt-4 text-xs font-bold ${isSelected ? 'border-white/10 text-slate-300' : 'border-slate-200/70 text-slate-500 dark:border-white/10 dark:text-slate-300'}`}>
                        <span className="flex items-center gap-1.5"><BookMarked size={14} /> {school.courses.length} {school.courses.length === 1 ? 'curso' : 'cursos'}</span>
                        <span className="ml-auto flex items-center gap-1.5">Ver escuela <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {selectedSchool ? (
            <div className="mt-7 overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-white/75 shadow-2xl shadow-slate-200/40 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/65 dark:shadow-none">
              <header className="relative overflow-hidden border-b border-slate-200/70 px-5 py-7 dark:border-white/10 sm:px-8">
                <div className="absolute inset-0 opacity-[0.08]" style={{ background: `linear-gradient(120deg, ${selectedSchool.color}, transparent 68%)` }} />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Cursos dentro de la escuela</p>
                    <h3 className="mt-2 font-serif text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">{selectedSchool.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    <CheckCircle2 size={16} className="text-emerald-500" /> Acceso únicamente con matrícula activa
                  </div>
                </div>
              </header>

              {groupedCourses.length === 0 ? (
                <div className="p-10 text-center sm:p-14">
                  <GraduationCap className="mx-auto text-slate-300 dark:text-slate-600" size={40} />
                  <h4 className="mt-4 font-bold text-slate-800 dark:text-white">Esta escuela todavía no tiene cursos publicados</h4>
                  <p className="mt-2 text-sm text-slate-500">Los cursos aparecerán aquí cuando estén vinculados y publicados desde el panel académico.</p>
                </div>
              ) : (
                <div className="space-y-8 p-4 sm:p-7">
                  {groupedCourses.map(([levelName, courses]) => (
                    <section key={levelName} aria-labelledby={`level-${courses[0]?.levelId ?? levelName.replaceAll(' ', '-')}`}>
                      <div className="mb-4 flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><Layers3 size={17} /></span>
                        <div><p className="text-[10px] font-black uppercase tracking-[0.17em] text-slate-400">Nivel o grupo</p><h4 id={`level-${courses[0]?.levelId ?? levelName.replaceAll(' ', '-')}`} className="font-bold text-slate-900 dark:text-white">{levelName}</h4></div>
                      </div>
                      <div className="grid gap-4 lg:grid-cols-2">
                        {courses.map(course => {
                          const waiting = requestingCourseId === course.id;
                          const disabled = course.access === 'pending' || course.access === 'approved' || requestEnrollment.isPending;
                          return (
                            <article key={course.id} className="group grid overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-lg dark:border-white/10 dark:bg-slate-950/70 sm:grid-cols-[9rem_1fr]">
                              <div className="relative min-h-40 overflow-hidden bg-slate-100 dark:bg-slate-800 sm:min-h-full">
                                <img src={course.coverImageUrl || FALLBACK_COURSE_IMAGE} alt={`Portada de ${course.title}`} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 to-transparent" />
                                {course.access === 'enrolled' ? <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white">Inscrito</span> : null}
                              </div>
                              <div className="flex min-w-0 flex-col p-5">
                                <h5 className="line-clamp-2 font-serif text-xl font-bold text-slate-950 dark:text-white">{course.title}</h5>
                                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{course.description || 'Contenido organizado para avanzar paso a paso con acompañamiento docente.'}</p>
                                <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                  <span className="flex items-center gap-1.5"><CalendarDays size={13} /> {course.duration || course.schedule || 'Horario por confirmar'}</span>
                                  <span className="flex items-center gap-1.5"><Clock3 size={13} /> Acceso privado</span>
                                </div>
                                <button type="button" disabled={disabled} onClick={() => void handleCourseAction(course)} className={`mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-black transition sm:w-auto ${course.access === 'enrolled' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : course.access === 'pending' || course.access === 'approved' ? 'cursor-default border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200' : 'border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'}`}>
                                  {waiting ? <Loader2 className="animate-spin" size={15} /> : course.access === 'enrolled' ? <ArrowRight size={15} /> : <LockKeyhole size={15} />}
                                  {waiting ? 'Enviando solicitud…' : courseActionLabel(course, isAuthenticated)}
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
