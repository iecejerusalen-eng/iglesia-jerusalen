import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { TrendingUp, Users, Award, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function LMSAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    certificatesIssued: 0,
    averageGrade: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Basic global counts
      const [
        { count: studentsCount },
        { count: coursesCount },
        { count: certsCount, data: certsData }
      ] = await Promise.all([
        supabase.from('lms_enrollments').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('lms_courses').select('*', { count: 'exact', head: true }),
        supabase.from('lms_certificates').select('grade', { count: 'exact' })
      ]);

      let avgGrade = 0;
      if (certsData && certsData.length > 0) {
        const sum = certsData.reduce((acc, curr) => acc + (Number(curr.grade) || 0), 0);
        avgGrade = sum / certsData.length;
      }

      setStats({
        totalStudents: studentsCount || 0,
        totalCourses: coursesCount || 0,
        certificatesIssued: certsCount || 0,
        averageGrade: avgGrade
      });

    } catch (err) {
      console.error(err);
      toast.error('Error al cargar analíticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gold" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Estudiantes</p>
              <h4 className="text-2xl font-bold font-serif">{stats.totalStudents}</h4>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center flex-shrink-0">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Cursos Activos</p>
              <h4 className="text-2xl font-bold font-serif">{stats.totalCourses}</h4>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Award size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Certificados</p>
              <h4 className="text-2xl font-bold font-serif">{stats.certificatesIssued}</h4>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center flex-shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Promedio Global</p>
              <h4 className="text-2xl font-bold font-serif">{stats.averageGrade.toFixed(2)}/100</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center h-64 text-center">
          <TrendingUp className="text-gray-300 dark:text-slate-700 mb-4" size={48} />
          <h4 className="font-bold text-gray-500">Más analíticas en camino...</h4>
          <p className="text-sm text-gray-400 max-w-sm mt-2">Los gráficos avanzados de retención e histogramas de calificaciones estarán disponibles a medida que se acumulen más datos de evaluaciones.</p>
        </div>
      </div>

    </div>
  );
}
