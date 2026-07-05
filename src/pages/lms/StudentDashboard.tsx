import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Award, Calendar, BarChart3, GraduationCap, ChevronRight, ShieldCheck } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';

import { CircularProgress } from '../../components/ui/CircularProgress';
import { StudentCalendar } from '../../features/student-dashboard/components/StudentCalendar';
import { StudentGrades } from '../../features/student-dashboard/components/StudentGrades';
import { StudentBadges } from '../../features/student-dashboard/components/StudentBadges';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';

// Define the interface for the enrollment progress object to replace `any`
interface CourseProgress {
  id: string;
  course_id: string;
  lms_courses?: {
    id: string;
    title: string;
    description: string;
    cover_image_url: string;
  } | null;
  progressPercentage: number;
  completed: number;
  total: number;
}

interface StudentBadgeItem {
  id: string;
  badge_name: string;
  badge_svg: string;
  awarded_at: string;
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<CourseProgress[]>([]);
  const [badges, setBadges] = useState<StudentBadgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: enrollData, error: enrollError } = await supabase
        .from('lms_enrollments')
        .select(`
          id,
          course_id,
          lms_courses (
            id,
            title,
            description,
            cover_image_url
          )
        `)
        .eq('user_id', user?.id);

      if (enrollError) throw enrollError;
      
      const coursesWithProgress = await Promise.all((enrollData || []).map(async (enr) => {
        const { data: totalLessons } = await supabase
          .from('lms_lessons')
          .select('id, lms_modules!inner(subject_id, lms_subjects!inner(course_id))')
          .eq('lms_modules.lms_subjects.course_id', enr.course_id);

        const total = totalLessons?.length || 0;
        let completed = 0;
        if (totalLessons && totalLessons.length > 0) {
          const lessonIds = totalLessons.map(l => l.id);
          const { data: progressData } = await supabase
            .from('lms_lesson_completions')
            .select('is_completed')
            .eq('student_id', user?.id)
            .in('lesson_id', lessonIds)
            .eq('is_completed', true);
          completed = progressData?.length || 0;
        }

        const progressPercentage = total > 0 ? (completed / total) * 100 : 0;
        
        // Ensure proper typing since joined tables can return objects or arrays of objects
        const courseData = Array.isArray(enr.lms_courses) ? enr.lms_courses[0] : enr.lms_courses;

        return {
          id: enr.id,
          course_id: enr.course_id,
          lms_courses: courseData,
          progressPercentage,
          completed,
          total
        } as CourseProgress;
      }));

      setEnrollments(coursesWithProgress);

      const { data: badgesData } = await supabase
        .from('lms_student_badges')
        .select('*')
        .eq('student_id', user?.id)
        .order('awarded_at', { ascending: false });
        
      if (badgesData) setBadges(badgesData);

    } catch (error) {
      console.error('Error fetching student dashboard:', error);
      toast.error('Error al cargar el panel de estudiante');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, [user, navigate, fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 pb-12 bg-gray-50 dark:bg-[#0B1120]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-gold"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'courses', label: 'Mis Cursos', icon: BookOpen },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'grades', label: 'Calificaciones', icon: Award },
    { id: 'badges', label: 'Mis Logros', icon: ShieldCheck },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50 dark:bg-[#0B1120] text-slate-800 dark:text-white">
      {/* Top Banner (Premium UI) */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="h-24 w-24 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl shrink-0">
              <img 
                src={user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user?.id} 
                alt="Avatar" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold font-serif flex items-center justify-center md:justify-start gap-3">
                Hola, {user?.user_metadata?.full_name?.split(' ')[0] || 'Estudiante'}!
                <GraduationCap className="text-gold" size={32} />
              </h1>
              <p className="text-indigo-200 mt-2 text-lg">Tu viaje de aprendizaje continúa hoy. ¡Sigue brillando!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Menu (Tabs) */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 sticky top-[72px] z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto custom-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-bold whitespace-nowrap border-b-2 transition-colors ${
                    isActive 
                      ? 'border-gold text-gold bg-gold/5 dark:bg-gold/10' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* COURSES TAB */}
        {activeTab === 'courses' && (
          <AnimeFadeUp className="space-y-8">
            {enrollments.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-gray-100 dark:border-white/10 shadow-sm">
                <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Aún no estás matriculado</h3>
                <p className="text-gray-500 mb-6 text-lg">Explora nuestros programas académicos y comienza tu formación.</p>
                <Link to="/programas" className="px-8 py-3 bg-gold text-white rounded-xl font-bold hover:bg-yellow-600 transition-colors inline-block shadow-lg hover:shadow-gold/20 hover:-translate-y-1">
                  Explorar Programas
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enr) => (
                  <motion.div
                    key={enr.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5 }}
                    className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] group flex flex-col"
                  >
                    <div className="h-48 overflow-hidden relative">
                      <img loading="lazy" 
                        src={enr.lms_courses?.cover_image_url || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop'} 
                        alt={enr.lms_courses?.title || 'Curso'}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      
                      {/* Circular Progress Overlay */}
                      <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/20">
                        <CircularProgress percentage={enr.progressPercentage} size={48} strokeWidth={4} />
                      </div>
                    </div>
                    
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="font-bold font-serif text-xl mb-2 line-clamp-2 text-slate-900 dark:text-white">
                        {enr.lms_courses?.title || 'Curso Desconocido'}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-2">
                        {enr.lms_courses?.description || 'Sin descripción disponible.'}
                      </p>
                      
                      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">
                          {enr.completed} / {enr.total} Lecciones
                        </span>
                        
                        <Link 
                          to={`/lms/curso/${enr.course_id}`}
                          className="flex items-center gap-1 text-gold hover:text-yellow-600 font-bold transition-colors group-hover:translate-x-1"
                        >
                          {enr.progressPercentage === 0 ? 'Comenzar' : enr.progressPercentage === 100 ? 'Repasar' : 'Continuar'}
                          <ChevronRight size={18} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimeFadeUp>
        )}

        {/* CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <StudentCalendar />
        )}

        {/* GRADES TAB */}
        {activeTab === 'grades' && (
          <StudentGrades />
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <AnimeFadeUp className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-gray-100 dark:border-white/10 text-center shadow-sm">
            <BarChart3 className="mx-auto text-gold mb-4" size={48} />
            <h2 className="text-2xl font-bold mb-2">Estadísticas de Aprendizaje</h2>
            <p className="text-gray-500">Próximamente: Gráficos de horas de estudio, progreso histórico e insignias ganadas detalladas.</p>
          </AnimeFadeUp>
        )}

        {/* BADGES TAB */}
        {activeTab === 'badges' && (
          <StudentBadges badges={badges} />
        )}

      </div>
    </div>
  );
}
