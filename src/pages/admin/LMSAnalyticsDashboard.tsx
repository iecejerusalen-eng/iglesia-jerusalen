import { useState } from 'react';
import { useLMSAnalytics } from '../../features/lms/hooks/useLMSAnalytics';
import { 
  Users, BookOpen, CheckCircle, TrendingUp, 
  Loader2, RefreshCw, ChevronLeft 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts';
import { AnimeFadeUp, AnimeStaggerGrid } from '../../components/animations/AnimeWrappers';

const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b'];

export default function LMSAnalyticsDashboard() {
  const { data, isLoading, error } = useLMSAnalytics();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Wait a bit to simulate refresh since the hook fetches on mount
    // In a real app we'd expose a refetch function from the hook
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Error al cargar analíticas: {error.message}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link 
            to="/admin/lms"
            className="p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-serif flex items-center gap-2">
              <TrendingUp className="text-indigo-500" />
              LMS Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">Métricas de rendimiento y progreso del Aula Virtual.</p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isLoading || refreshing}
          className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refrescar
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
        </div>
      ) : data ? (
        <AnimeStaggerGrid staggerDelay={100} className="space-y-8">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimeFadeUp delay={0}>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-150 dark:border-white/10 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Estudiantes</p>
                  <p className="text-2xl font-bold">{data.totalStudents}</p>
                </div>
              </div>
            </AnimeFadeUp>

            <AnimeFadeUp delay={100}>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-150 dark:border-white/10 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
                  <BookOpen size={24} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cursos Activos</p>
                  <p className="text-2xl font-bold">{data.activeCourses}</p>
                </div>
              </div>
            </AnimeFadeUp>

            <AnimeFadeUp delay={200}>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-150 dark:border-white/10 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center shrink-0">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Lecciones Comp.</p>
                  <p className="text-2xl font-bold">{data.totalCompletions}</p>
                </div>
              </div>
            </AnimeFadeUp>

            <AnimeFadeUp delay={300}>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-150 dark:border-white/10 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gold/10 text-gold rounded-2xl flex items-center justify-center shrink-0">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Promedio Notas</p>
                  <p className="text-2xl font-bold">{data.averageScore} / 10</p>
                </div>
              </div>
            </AnimeFadeUp>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Timeline Area Chart */}
            <AnimeFadeUp delay={400} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-150 dark:border-white/10 shadow-sm">
              <h3 className="font-serif font-bold text-lg mb-6">Actividad de Lecciones (Últimos 30 días)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.completionTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-slate-800" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: '#6b7280', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCompletions)" name="Completadas" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </AnimeFadeUp>

            {/* Bar Chart Enrollment */}
            <AnimeFadeUp delay={500} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-150 dark:border-white/10 shadow-sm">
              <h3 className="font-serif font-bold text-lg mb-6">Matrículas por Curso (Top 5)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.enrollmentByCourse} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" className="dark:stroke-slate-800" />
                    <XAxis type="number" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" tick={{fontSize: 11}} width={120} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(99, 102, 241, 0.05)'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" name="Matriculados" radius={[0, 4, 4, 0]}>
                      {data.enrollmentByCourse.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AnimeFadeUp>
            
          </div>
        </AnimeStaggerGrid>
      ) : null}
    </div>
  );
}
