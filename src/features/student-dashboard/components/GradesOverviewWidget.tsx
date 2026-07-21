import { useEffect, useState } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { BookOpen, BarChart3, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CourseProgress {
  id: string;
  course_id: string;
  lms_courses?: {
    id: string;
    title: string;
    cover_image_url: string;
  } | null;
  progressPercentage: number;
}

interface GradesOverviewWidgetProps {
  enrollments: CourseProgress[];
}

export function GradesOverviewWidget({ enrollments }: GradesOverviewWidgetProps) {
  const { user } = useAuthStore();
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourseGrades() {
      if (!user || enrollments.length === 0) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch saved grades
        const enrollmentIds = enrollments.map(e => e.id);
        const { data: gradesData } = await supabase
          .from('lms_grades')
          .select('enrollment_id, final_grade')
          .in('enrollment_id', enrollmentIds);

        const gradesMap: Record<string, number> = {};
        
        if (gradesData) {
          gradesData.forEach(g => {
            gradesMap[g.enrollment_id] = g.final_grade;
          });
        }
        
        // For courses without a final_grade in lms_grades, we display 'En Curso'.
        setGrades(gradesMap);
      } catch (error) {
        console.error('Error fetching grades overview:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCourseGrades();
  }, [user, enrollments]);

  if (!enrollments || enrollments.length === 0) return null;

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
          <BarChart3 size={20} className="text-gold" />
          Rendimiento por Curso
        </h3>
        <Link 
          to="/lms/estudiante?tab=calificaciones" 
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Ver todo
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-gold" size={24} />
        </div>
      ) : (
        <div className="space-y-4">
          {enrollments.map((enr) => {
            const course = Array.isArray(enr.lms_courses) ? enr.lms_courses[0] : enr.lms_courses;
            const finalGrade = grades[enr.id];
            
            let colorClass = 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
            let barColor = 'bg-gray-400';
            
            if (finalGrade !== undefined) {
              if (finalGrade >= 90) {
                colorClass = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
                barColor = 'bg-green-500';
              } else if (finalGrade >= 70) {
                colorClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
                barColor = 'bg-emerald-500';
              } else if (finalGrade >= 50) {
                colorClass = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
                barColor = 'bg-yellow-500';
              } else {
                colorClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                barColor = 'bg-red-500';
              }
            } else {
                // If it's in progress but has some progress, use a generic color for the bar
                barColor = 'bg-indigo-500';
            }

            return (
              <div key={enr.id} className="p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-slate-800/50 hover:border-gold/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/50 shrink-0">
                      {course?.cover_image_url ? (
                        <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-indigo-500">
                          <BookOpen size={18} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-gray-100 line-clamp-1">{course?.title || 'Curso'}</h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Progreso: {Math.round(enr.progressPercentage)}%</p>
                    </div>
                  </div>
                  
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${colorClass}`}>
                    {finalGrade !== undefined ? `${finalGrade}%` : 'En curso'}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${enr.progressPercentage > 0 ? barColor : 'bg-transparent'} transition-all duration-500`}
                    style={{ width: `${enr.progressPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
