import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { Award, FileText } from 'lucide-react';

interface GradeRecord {
  id: string;
  final_grade: number;
  comments: string;
  updated_at: string;
  enrollment_id: string;
  course_title: string;
  lms_subjects?: { name: string };
}

export function StudentGrades() {
  const { user } = useAuthStore();
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchGrades() {
      if (!user) return;
      try {
        const { data: enrollments, error: enrollError } = await supabase
          .from('lms_enrollments')
          .select('id, course_id, lms_courses(title)')
          .eq('user_id', user.id);

        if (enrollError) throw enrollError;
        
        const enrollmentIds = enrollments?.map(e => e.id) || [];
        if (enrollmentIds.length === 0) {
          setGrades([]);
          setIsLoading(false);
          return;
        }

        const { data: gradesData, error: gradesError } = await supabase
          .from('lms_grades')
          .select(`
            id,
            final_grade,
            comments,
            updated_at,
            enrollment_id,
            lms_subjects (
              name
            )
          `)
          .in('enrollment_id', enrollmentIds);

        if (gradesError) throw gradesError;

        // Map grades to course titles
        const enrichedGrades: GradeRecord[] = (gradesData || []).map(grade => {
          const enrollment = enrollments.find(e => e.id === grade.enrollment_id);
          // Handle Supabase potential array or object return for joined tables
          let title = 'Curso Desconocido';
          if (enrollment?.lms_courses) {
            const courseData = enrollment.lms_courses as unknown as { title: string } | { title: string }[];
            title = Array.isArray(courseData) ? courseData[0]?.title : courseData?.title;
          }

          // Handle lms_subjects typing
          const subjectData = grade.lms_subjects as unknown as { name: string } | { name: string }[] | null;
          const subjectName = Array.isArray(subjectData) ? subjectData[0]?.name : subjectData?.name;

          return {
            id: grade.id,
            final_grade: grade.final_grade,
            comments: grade.comments,
            updated_at: grade.updated_at,
            enrollment_id: grade.enrollment_id,
            course_title: title || 'Curso Desconocido',
            lms_subjects: subjectName ? { name: subjectName } : undefined
          };
        });

        setGrades(enrichedGrades);
      } catch (err) {
        console.error('Error fetching grades:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGrades();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <AnimeFadeUp className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
        <h2 className="text-2xl font-bold font-serif mb-6 flex items-center gap-3 text-slate-800 dark:text-white">
          <Award className="text-gold" size={28} />
          Historial de Calificaciones
        </h2>

        {grades.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 dark:text-gray-300">Sin calificaciones aún</h3>
            <p className="text-gray-500 mt-1">Tus notas aparecerán aquí cuando los docentes califiquen tus entregas finales.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 px-4">Curso / Materia</th>
                  <th className="pb-3 px-4 text-center">Calificación</th>
                  <th className="pb-3 px-4">Retroalimentación</th>
                  <th className="pb-3 px-4 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {grades.map(grade => (
                  <tr key={grade.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800 dark:text-white">{grade.course_title}</div>
                      <div className="text-sm text-gray-500">{grade.lms_subjects?.name || 'Materia General'}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${
                        grade.final_grade >= 70 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {grade.final_grade}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-slate-600 dark:text-gray-300 italic">
                        {grade.comments || <span className="text-gray-400">Sin comentarios</span>}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-gray-500">
                      {new Date(grade.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AnimeFadeUp>
  );
}
