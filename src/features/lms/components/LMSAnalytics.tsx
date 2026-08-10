import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Award, BookOpen, Loader2, TrendingUp, Users } from 'lucide-react';
import { supabase } from '../../../config/supabase';

interface LMSAnalyticsProps {
  schoolId?: string;
}

interface AnalyticsResult {
  totalStudents: number;
  totalCourses: number;
  certificatesIssued: number;
  averageGrade: number;
}

export function LMSAnalytics({ schoolId = 'all' }: LMSAnalyticsProps) {
  const analyticsQuery = useQuery({
    queryKey: ['lms-analytics-summary', schoolId],
    queryFn: async (): Promise<AnalyticsResult> => {
      let coursesQuery = supabase
        .from('lms_courses')
        .select('id')
        .eq('is_published', true);
      if (schoolId !== 'all') coursesQuery = coursesQuery.eq('school_id', schoolId);

      const { data: courseRows, error: courseError } = await coursesQuery;
      if (courseError) throw courseError;
      const courseIds = (courseRows ?? []).map(course => course.id);
      if (courseIds.length === 0) {
        return { totalStudents: 0, totalCourses: 0, certificatesIssued: 0, averageGrade: 0 };
      }

      const [enrollmentResult, certificateResult] = await Promise.all([
        supabase
          .from('lms_enrollments')
          .select('user_id')
          .in('course_id', courseIds)
          .eq('role', 'student')
          .eq('status', 'active'),
        supabase
          .from('lms_certificates')
          .select('grade')
          .in('course_id', courseIds),
      ]);
      if (enrollmentResult.error) throw enrollmentResult.error;
      if (certificateResult.error) throw certificateResult.error;

      const grades = (certificateResult.data ?? [])
        .map(certificate => Number(certificate.grade))
        .filter(grade => Number.isFinite(grade));

      return {
        totalStudents: new Set((enrollmentResult.data ?? []).map(enrollment => enrollment.user_id)).size,
        totalCourses: courseIds.length,
        certificatesIssued: certificateResult.data?.length ?? 0,
        averageGrade: grades.length > 0 ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length : 0,
      };
    },
  });

  if (analyticsQuery.isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;
  }

  if (analyticsQuery.isError) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-300/30 bg-red-500/10 p-5 text-sm text-red-700 dark:text-red-200">
        <AlertCircle className="mt-0.5 shrink-0" size={19} />
        <div><strong>No se pudieron cargar las analíticas.</strong><p className="mt-1 opacity-80">{analyticsQuery.error instanceof Error ? analyticsQuery.error.message : 'Error desconocido.'}</p></div>
      </div>
    );
  }

  const stats = analyticsQuery.data ?? { totalStudents: 0, totalCourses: 0, certificatesIssued: 0, averageGrade: 0 };
  const cards = [
    { label: 'Estudiantes únicos', value: stats.totalStudents, icon: Users, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-300' },
    { label: 'Cursos publicados', value: stats.totalCourses, icon: BookOpen, color: 'bg-violet-500/10 text-violet-600 dark:text-violet-300' },
    { label: 'Certificados emitidos', value: stats.certificatesIssued, icon: Award, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
    { label: 'Promedio certificado', value: stats.certificatesIssued > 0 ? `${stats.averageGrade.toFixed(2)}/100` : 'Sin datos', icon: TrendingUp, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-300' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-bold text-slate-900 dark:text-white">Analíticas académicas</h2>
        <p className="mt-1 text-sm text-slate-500">Resultados reales de los cursos publicados dentro del contexto seleccionado.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => (
          <div key={card.label} className="rounded-3xl border border-slate-200/70 bg-white/75 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65">
            <div className={`mb-5 inline-flex rounded-2xl p-3 ${card.color}`}><card.icon size={23} /></div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">{card.label}</p>
            <strong className="mt-1 block font-serif text-3xl text-slate-900 dark:text-white">{card.value}</strong>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-slate-200/70 bg-white/75 p-6 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65">
        <TrendingUp className="mx-auto text-slate-300 dark:text-slate-700" size={44} />
        <h3 className="mt-3 font-bold text-slate-700 dark:text-slate-200">Los indicadores aparecen cuando existe actividad real</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">No se generan cifras de demostración. Las métricas cambian con matrículas activas, cursos publicados y certificados registrados.</p>
      </div>
    </div>
  );
}
