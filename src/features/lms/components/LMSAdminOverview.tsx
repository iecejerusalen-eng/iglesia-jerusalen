import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  DoorOpen,
  GraduationCap,
  School,
  Settings2,
  Sparkles,
  UserCheck,
  UsersRound,
} from 'lucide-react';
import { supabase } from '../../../config/supabase';
import type { LMSCourse } from '../../../types';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';

export type LMSAdminDestination =
  | 'schools'
  | 'school-access'
  | 'courses'
  | 'categories'
  | 'requests'
  | 'participants'
  | 'analytics'
  | 'defaults'
  | 'staff'
  | 'calendar';

interface LMSAdminOverviewProps {
  selectedSchoolId: string;
  courses: LMSCourse[];
  pendingCourseRequests: number;
  onNavigate: (destination: LMSAdminDestination) => void;
  onCreateCourse: () => void;
}

interface OverviewData {
  pendingSchoolAccess: number;
  activeMemberships: number;
  uniqueStudents: number;
  uniqueTeachers: number;
  upcomingSessions: number;
  coursesWithTeacher: Set<string>;
}

export function LMSAdminOverview({
  selectedSchoolId,
  courses,
  pendingCourseRequests,
  onNavigate,
  onCreateCourse,
}: LMSAdminOverviewProps) {
  const courseIds = useMemo(() => courses.map(course => course.id).sort(), [courses]);

  const overviewQuery = useQuery({
    queryKey: ['lms-admin-overview', selectedSchoolId, courseIds],
    queryFn: async (): Promise<OverviewData> => {
      let accessQuery = supabase
        .from('lms_school_access_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      let membershipQuery = supabase
        .from('lms_school_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      if (selectedSchoolId !== 'all') {
        accessQuery = accessQuery.eq('school_id', selectedSchoolId);
        membershipQuery = membershipQuery.eq('school_id', selectedSchoolId);
      }

      const [accessResult, membershipResult] = await Promise.all([accessQuery, membershipQuery]);
      if (accessResult.error) throw accessResult.error;
      if (membershipResult.error) throw membershipResult.error;

      if (courseIds.length === 0) {
        return {
          pendingSchoolAccess: accessResult.count ?? 0,
          activeMemberships: membershipResult.count ?? 0,
          uniqueStudents: 0,
          uniqueTeachers: 0,
          upcomingSessions: 0,
          coursesWithTeacher: new Set<string>(),
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [enrollmentResult, teacherResult, sessionResult] = await Promise.all([
        supabase
          .from('lms_enrollments')
          .select('user_id')
          .in('course_id', courseIds)
          .eq('status', 'active'),
        supabase
          .from('lms_course_teachers')
          .select('course_id, user_id')
          .in('course_id', courseIds),
        supabase
          .from('lms_class_sessions')
          .select('id', { count: 'exact', head: true })
          .in('course_id', courseIds)
          .gte('session_date', today.toISOString().slice(0, 10)),
      ]);

      if (enrollmentResult.error) throw enrollmentResult.error;
      if (teacherResult.error) throw teacherResult.error;
      if (sessionResult.error) throw sessionResult.error;

      return {
        pendingSchoolAccess: accessResult.count ?? 0,
        activeMemberships: membershipResult.count ?? 0,
        uniqueStudents: new Set((enrollmentResult.data ?? []).map(row => row.user_id)).size,
        uniqueTeachers: new Set((teacherResult.data ?? []).map(row => row.user_id)).size,
        upcomingSessions: sessionResult.count ?? 0,
        coursesWithTeacher: new Set((teacherResult.data ?? []).map(row => row.course_id)),
      };
    },
  });

  const publishedCourses = courses.filter(course => course.is_published).length;
  const draftCourses = courses.length - publishedCourses;
  const coursesWithoutSchool = courses.filter(course => !course.school_id).length;
  const coursesWithoutTeacher = overviewQuery.data
    ? courses.filter(course => !overviewQuery.data.coursesWithTeacher.has(course.id)).length
    : 0;
  const totalPending = (overviewQuery.data?.pendingSchoolAccess ?? 0) + pendingCourseRequests;

  const metrics = [
    { label: 'Cursos', value: courses.length, detail: `${publishedCourses} publicados`, icon: BookOpen, color: 'from-indigo-500/20 to-blue-500/5 text-indigo-300' },
    { label: 'Estudiantes', value: overviewQuery.data?.uniqueStudents ?? 0, detail: `${overviewQuery.data?.activeMemberships ?? 0} membresías activas`, icon: GraduationCap, color: 'from-emerald-500/20 to-teal-500/5 text-emerald-300' },
    { label: 'Docentes', value: overviewQuery.data?.uniqueTeachers ?? 0, detail: `${coursesWithoutTeacher} cursos sin asignar`, icon: UserCheck, color: 'from-violet-500/20 to-fuchsia-500/5 text-violet-300' },
    { label: 'Solicitudes', value: totalPending, detail: `${overviewQuery.data?.pendingSchoolAccess ?? 0} accesos · ${pendingCourseRequests} matrículas`, icon: DoorOpen, color: 'from-amber-500/20 to-orange-500/5 text-amber-300' },
  ];

  const attentionItems = [
    { count: overviewQuery.data?.pendingSchoolAccess ?? 0, label: 'solicitudes de acceso a escuelas', destination: 'school-access' as const },
    { count: pendingCourseRequests, label: 'solicitudes de matrícula a cursos', destination: 'requests' as const },
    { count: coursesWithoutTeacher, label: 'cursos sin docente asignado', destination: 'staff' as const },
    { count: draftCourses, label: 'cursos todavía en borrador', destination: 'courses' as const },
    { count: coursesWithoutSchool, label: 'cursos sin escuela vinculada', destination: 'courses' as const },
  ].filter(item => item.count > 0);

  return (
    <AnimeFadeUp className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 p-6 text-white shadow-2xl sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative grid gap-7 xl:grid-cols-[1.25fr_.75fr] xl:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">
              <Sparkles size={13} /> Centro académico
            </span>
            <h2 className="mt-4 max-w-3xl font-serif text-3xl font-bold leading-tight sm:text-4xl">
              Todo el Aula Virtual, organizado desde una sola vista.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Supervisa escuelas, cursos, personas, solicitudes y agenda usando únicamente los registros visibles para tu rol.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={onCreateCourse} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-amber-200">
                Crear nuevo curso <ArrowRight size={16} />
              </button>
              <button onClick={() => onNavigate('school-access')} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/10">
                Revisar solicitudes
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
              <CalendarClock className="mb-5 text-amber-300" size={20} />
              <strong className="block text-3xl">{overviewQuery.data?.upcomingSessions ?? 0}</strong>
              <span className="text-xs text-slate-400">sesiones próximas</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
              <School className="mb-5 text-indigo-300" size={20} />
              <strong className="block text-3xl">{publishedCourses}</strong>
              <span className="text-xs text-slate-400">cursos publicados</span>
            </div>
          </div>
        </div>
      </section>

      {overviewQuery.isError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-200">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <div><strong>No se pudo completar el resumen.</strong><p className="mt-1 opacity-80">{overviewQuery.error instanceof Error ? overviewQuery.error.message : 'Error desconocido al consultar el Aula Virtual.'}</p></div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(metric => (
          <div key={metric.label} className="rounded-3xl border border-slate-200/70 bg-white/75 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65">
            <div className={`mb-5 inline-flex rounded-2xl bg-gradient-to-br p-3 ${metric.color}`}><metric.icon size={22} /></div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{metric.label}</p>
            <strong className="mt-1 block font-serif text-3xl text-slate-900 dark:text-white">{overviewQuery.isLoading ? '—' : metric.value}</strong>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{metric.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <div className="rounded-3xl border border-slate-200/70 bg-white/75 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div><h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">Requiere atención</h3><p className="mt-1 text-sm text-slate-500">Pendientes calculados con información real del sistema.</p></div>
            <Settings2 className="text-slate-400" size={20} />
          </div>
          <div className="mt-5 space-y-2">
            {overviewQuery.isLoading ? (
              <div className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />
            ) : attentionItems.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                <CheckCircle2 size={20} /> No hay pendientes administrativos en este contexto.
              </div>
            ) : attentionItems.map(item => (
              <button key={item.label} onClick={() => onNavigate(item.destination)} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-left transition hover:border-amber-300 hover:bg-amber-50/70 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-amber-300/5">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200"><strong className="mr-2 text-lg text-amber-600 dark:text-amber-300">{item.count}</strong>{item.label}</span>
                <ArrowRight className="shrink-0 text-slate-400" size={16} />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/75 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 sm:p-6">
          <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">Flujo de trabajo</h3>
          <p className="mt-1 text-sm text-slate-500">Accesos directos organizados según la operación académica.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Estructurar escuelas', detail: 'Niveles, edades y rangos', icon: School, destination: 'schools' as const },
              { label: 'Construir cursos', detail: 'Semanas, bloques y lecciones', icon: BookOpen, destination: 'courses' as const },
              { label: 'Asignar docentes', detail: 'Carga académica y horarios', icon: UserCheck, destination: 'staff' as const },
              { label: 'Gestionar personas', detail: 'Participantes y matrículas', icon: UsersRound, destination: 'participants' as const },
            ].map(action => (
              <button key={action.label} onClick={() => onNavigate(action.destination)} className="group rounded-2xl border border-slate-200/80 p-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-white/10">
                <action.icon className="text-indigo-500 dark:text-indigo-300" size={20} />
                <strong className="mt-3 block text-sm text-slate-800 dark:text-white">{action.label}</strong>
                <span className="mt-1 block text-xs text-slate-500">{action.detail}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </AnimeFadeUp>
  );
}
