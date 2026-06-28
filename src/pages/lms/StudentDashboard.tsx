import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Award, Clock, PlayCircle } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch enrollments with course details
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
      
      // Fetch progress for each course
      const coursesWithProgress = await Promise.all((enrollData || []).map(async (enr) => {
        // Fetch total lessons in course
        const { data: totalLessons } = await supabase
          .from('lms_lessons')
          .select('id, lms_modules!inner(subject_id, lms_subjects!inner(course_id))')
          .eq('lms_modules.lms_subjects.course_id', enr.course_id);

        const total = totalLessons?.length || 0;

        // Fetch completed progress
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

        const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          ...enr,
          progressPercentage,
          completed,
          total
        };
      }));

      setEnrollments(coursesWithProgress);

      // Fetch badges
      const { data: badgeData, error: badgeError } = await supabase
        .from('lms_student_badges')
        .select('*')
        .eq('student_id', user?.id)
        .order('earned_at', { ascending: false });

      if (badgeError) throw badgeError;
      setBadges(badgeData || []);

    } catch (error) {
      console.error('Error fetching student dashboard:', error);
      toast.error('Error al cargar el panel de estudiante');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 pb-12 bg-surface text-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-surface text-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading">Mi Aula Virtual</h1>
          <p className="text-secondary mt-2">Bienvenido de nuevo. Continúa con tu aprendizaje.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Courses */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              Mis Cursos
            </h2>
            
            {enrollments.length === 0 ? (
              <div className="bg-surface-light border border-border rounded-xl p-8 text-center">
                <BookOpen className="w-12 h-12 text-secondary/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No estás inscrito en ningún curso</h3>
                <p className="text-secondary mb-4">Explora nuestros programas y comienza a aprender.</p>
                <Link to="/programas" className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors inline-block">
                  Explorar Programas
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrollments.map((enr) => (
                  <motion.div
                    key={enr.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface-light border border-border rounded-xl overflow-hidden hover:border-accent/50 transition-colors group"
                  >
                    <div className="h-40 overflow-hidden relative">
                      <img loading="lazy" 
                        src={enr.lms_courses.cover_image_url || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop'} 
                        alt={enr.lms_courses.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-lg mb-2 line-clamp-1">{enr.lms_courses.title}</h3>
                      
                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-secondary mb-1">
                          <span>Progreso</span>
                          <span>{enr.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-border rounded-full h-2">
                          <div 
                            className="bg-accent h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${enr.progressPercentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-secondary mt-1 text-right">
                          {enr.completed} de {enr.total} actividades
                        </p>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <Link 
                          to={`/lms/curso/${enr.course_id}`}
                          className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
                        >
                          <PlayCircle className="w-4 h-4" />
                          {enr.progressPercentage === 0 ? 'Comenzar' : 'Continuar'}
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Badges & Stats */}
          <div className="space-y-6">
            <div className="bg-surface-light border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-yellow-500" />
                Mis Insignias
              </h2>
              
              {badges.length === 0 ? (
                <div className="text-center py-6 text-secondary text-sm">
                  Aún no tienes insignias. ¡Completa cursos para ganarlas!
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {badges.map((badge) => (
                    <div 
                      key={badge.id}
                      className="flex flex-col items-center justify-center p-4 bg-surface border border-border rounded-lg text-center"
                      title={badge.description}
                    >
                      <div className="text-3xl mb-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(badge.badge_icon) }} />
                      <span className="text-xs font-medium line-clamp-2">{badge.badge_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-surface-light border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-500" />
                Actividad Reciente
              </h2>
              <div className="text-sm text-secondary text-center py-4">
                No hay actividad reciente para mostrar.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
