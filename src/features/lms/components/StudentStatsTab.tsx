import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen, CheckCircle2, Layers3, TrendingUp } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';

interface StudentCourseStat {
  course_id: string;
  lms_courses?: { title: string } | null;
  progressPercentage: number;
  completed: number;
  total: number;
}

interface StudentStatsTabProps {
  courses: StudentCourseStat[];
}

export function StudentStatsTab({ courses }: StudentStatsTabProps) {
  const completedLessons = courses.reduce((sum, course) => sum + course.completed, 0);
  const totalLessons = courses.reduce((sum, course) => sum + course.total, 0);
  const averageProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const chartData = courses.map(course => ({
    name: course.lms_courses?.title || 'Curso',
    progreso: Math.round(course.progressPercentage),
    completadas: course.completed,
    total: course.total,
  }));

  const cards = [
    { icon: BookOpen, label: 'Cursos activos', value: courses.length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: CheckCircle2, label: 'Lecciones completadas', value: completedLessons, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: Layers3, label: 'Lecciones disponibles', value: totalLessons, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { icon: TrendingUp, label: 'Progreso general', value: `${averageProgress}%`, color: 'text-gold', bg: 'bg-gold/10' },
  ];

  return (
    <AnimeFadeUp className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(stat => (
          <div key={stat.label} className="bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl border border-gray-150 dark:border-white/10 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
              <h4 className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl border border-gray-150 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-white">Progreso real por curso</h3>
        <p className="text-sm text-gray-500 mt-1 mb-6">Calculado con las lecciones publicadas y completadas en esta escuela.</p>
        {chartData.length === 0 ? (
          <div className="min-h-52 grid place-items-center text-center text-sm text-gray-500">
            Todavía no hay cursos asignados para mostrar estadísticas.
          </div>
        ) : (
          <div className="h-72 w-full" role="img" aria-label="Gráfico del progreso por curso">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} unit="%" axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={120} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`${Number(value)}%`, 'Progreso']} />
                <Bar dataKey="progreso" fill="#c39d67" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </AnimeFadeUp>
  );
}
