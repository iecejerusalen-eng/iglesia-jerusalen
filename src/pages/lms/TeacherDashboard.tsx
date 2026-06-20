import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Users, Settings, Plus, ChevronRight } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';

export default function TeacherDashboard() {
  const { user, role } = useAuthStore();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    checkTeacherAndFetchCourses();
  }, [user]);

  const checkTeacherAndFetchCourses = async () => {
    try {
      // 1. Verify if user is a teacher or admin/pastor
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_teacher, role')
        .eq('id', user?.id)
        .single();
        
      if (profileError) throw profileError;
      
      const isGlobalAdmin = ['admin', 'pastor'].includes(profileData?.role || '');
      const hasTeacherFlag = profileData?.is_teacher || false;
      
      setIsTeacher(hasTeacherFlag || isGlobalAdmin);

      if (!hasTeacherFlag && !isGlobalAdmin) {
        setIsLoading(false);
        return;
      }

      // 2. Fetch assigned courses
      let coursesQuery;
      
      if (isGlobalAdmin) {
        // Admins see all courses
        coursesQuery = supabase.from('lms_courses').select('id, title, description, cover_image_url, is_published, format');
      } else {
        // Teachers see only assigned courses
        coursesQuery = supabase
          .from('lms_course_teachers')
          .select(`
            course_id,
            lms_courses (
              id,
              title,
              description,
              cover_image_url,
              is_published,
              format
            )
          `)
          .eq('user_id', user?.id);
      }

      const { data: courseData, error: courseError } = await coursesQuery;
      
      if (courseError) throw courseError;

      // Format data
      let formattedCourses = [];
      if (isGlobalAdmin) {
        formattedCourses = courseData || [];
      } else {
        formattedCourses = (courseData || []).map((ct: any) => ct.lms_courses);
      }
      
      // Fetch stats for each course (number of students)
      const coursesWithStats = await Promise.all(formattedCourses.map(async (course: any) => {
        const { count } = await supabase
          .from('lms_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('course_id', course.id);
          
        return {
          ...course,
          studentCount: count || 0
        };
      }));

      setCourses(coursesWithStats);

    } catch (error) {
      console.error('Error fetching teacher dashboard:', error);
      toast.error('Error al cargar el panel de docente');
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

  if (!isTeacher) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-surface text-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold font-heading mb-4">Acceso Denegado</h1>
          <p className="text-secondary mb-6">No tienes permisos de docente para acceder a esta área.</p>
          <Link to="/" className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-surface text-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-heading">Panel de Docente</h1>
            <p className="text-secondary mt-2">Gestiona tus clases, estudiantes y calificaciones.</p>
          </div>
          <Link 
            to="/admin/lms"
            className="flex items-center gap-2 px-4 py-2 bg-surface-light border border-border rounded-lg hover:bg-border/50 transition-colors text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            Configuración Avanzada
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-accent" />
            Mis Cursos Asignados
          </h2>
          
          {courses.length === 0 ? (
            <div className="bg-surface-light border border-border rounded-xl p-8 text-center max-w-2xl mx-auto">
              <BookOpen className="w-12 h-12 text-secondary/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tienes cursos asignados</h3>
              <p className="text-secondary">Los administradores aún no te han asignado ningún curso para dictar. Contacta al soporte para más información.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface-light border border-border rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="h-32 overflow-hidden relative">
                    <img 
                      src={course.cover_image_url || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop'} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    {!course.is_published && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                        Borrador
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg mb-2 line-clamp-1">{course.title}</h3>
                    
                    <div className="flex items-center gap-2 text-sm text-secondary mb-4">
                      <Users className="w-4 h-4" />
                      <span>{course.studentCount} Estudiantes</span>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <Link 
                        to={`/admin/lms/course/${course.id}`}
                        className="text-center px-3 py-2 bg-surface border border-border rounded hover:bg-border/50 text-sm transition-colors"
                      >
                        Editar Contenido
                      </Link>
                      <Link 
                        to={`/admin/lms/gradebook/${course.id}`}
                        className="text-center px-3 py-2 bg-accent text-white rounded hover:bg-accent/90 text-sm transition-colors"
                      >
                        Calificaciones
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
