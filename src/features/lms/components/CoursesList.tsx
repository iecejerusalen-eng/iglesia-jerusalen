import { useState } from 'react';
import { BookOpen, Edit, Trash2, FileText, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { LMSCourse } from '../../../types';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { useCourses } from '../hooks/useCourses';
import { motion, AnimatePresence } from 'framer-motion';

interface CoursesListProps {
  courses: LMSCourse[];
  onEditCourse?: (course?: LMSCourse) => void;
}

export function CoursesList({ courses, onEditCourse }: CoursesListProps) {
  const navigate = useNavigate();
  const { deleteCourse } = useCourses();
  const [courseToDelete, setCourseToDelete] = useState<LMSCourse | null>(null);

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    await deleteCourse.mutateAsync(courseToDelete.id);
    setCourseToDelete(null);
  };

  if (courses.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10">
        <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hay cursos creados</h3>
        <p className="text-gray-500 dark:text-gray-400">Comienza creando tu primer curso o programa educativo.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course, index) => (
          <AnimeFadeUp key={course.id} delay={index * 0.05}>
            <div 
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md transition-shadow cursor-pointer text-left"
              onClick={() => navigate(`/admin/lms/course/${course.id}`)}
            >
              <div className="h-40 bg-gray-200 dark:bg-slate-800 relative">
                {course.cover_image_url ? (
                  <img loading="lazy" src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="text-gray-400" size={40} />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${course.is_published ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                    {course.is_published ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  {(course.lms_schools || course.lms_levels) && (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      {course.lms_schools && (
                        <span
                          className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white uppercase tracking-wider"
                          style={{ backgroundColor: course.lms_schools.color || '#6366F1' }}
                        >
                          {course.lms_schools.name}
                        </span>
                      )}
                      {course.lms_levels && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
                          {course.lms_levels.name}
                        </span>
                      )}
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-gold transition-colors">{course.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                    {course.description || 'Sin descripción'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Formato: <span className="capitalize font-medium text-slate-700 dark:text-gray-300">{course.format === 'weekly' ? 'Semanal' : 'Temas'}</span>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/lms/gradebook/${course.id}`); }}
                      className="p-2 text-gray-500 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                      title="Calificaciones (Gradebook)"
                    >
                      <FileText size={16} />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (onEditCourse) {
                          onEditCourse(course);
                        } else {
                          navigate(`/admin/lms/course/settings/${course.id}`); 
                        }
                      }}
                      className="p-2 text-gray-500 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                      title="Configuración de Curso"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCourseToDelete(course); }}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Eliminar Curso"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </AnimeFadeUp>
        ))}
      </div>

      <AnimatePresence>
        {courseToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-white/10 relative"
            >
              <button 
                onClick={() => setCourseToDelete(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white bg-gray-100 dark:bg-slate-800 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
              
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Eliminar Curso</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                ¿Estás seguro de que deseas eliminar el curso <span className="font-bold text-slate-800 dark:text-gray-200">"{courseToDelete.title}"</span>? Esta acción no se puede deshacer y eliminará todos los módulos, lecciones y progreso asociado.
              </p>
              
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setCourseToDelete(null)}
                  className="px-4 py-2 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  disabled={deleteCourse.isPending}
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={deleteCourse.isPending}
                  className="px-4 py-2 font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleteCourse.isPending ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
