import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { ArrowLeft, BookOpen, User, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const LMSGradebook = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('lms_courses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (courseError) throw courseError;
      setCourse(courseData);

      // Let's do a better query to get only activities for this course
      const { data: sections } = await supabase
        .from('lms_sections')
        .select('id')
        .eq('course_id', id);
        
      const sectionIds = sections?.map(s => s.id) || [];
      
      const { data: courseActivities, error: aError } = await supabase
        .from('lms_activities')
        .select('id, title, type')
        .in('section_id', sectionIds)
        .in('type', ['assignment', 'quiz']);

      if (aError) throw aError;
      setActivities(courseActivities || []);

      // Fetch submissions
      const activityIds = courseActivities?.map(a => a.id) || [];
      if (activityIds.length > 0) {
        const { data: subs, error: subsError } = await supabase
          .from('lms_assignment_submissions')
          .select(`
            *,
            auth_users:student_id (
              id,
              email
            ),
            profiles:student_id (
              first_name,
              last_name
            )
          `)
          .in('activity_id', activityIds);
          
        if (subsError) throw subsError;
        setSubmissions(subs || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error cargando calificaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGrade = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('lms_assignment_submissions')
        .update({
          grade: gradeInput,
          teacher_feedback: feedbackInput,
          graded_at: new Date().toISOString()
        })
        .eq('id', submissionId);
        
      if (error) throw error;
      toast.success('Calificación guardada');
      setEditingSubId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la calificación');
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Cargando...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Link to="/admin/lms" className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition">
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="text-gold" size={24} />
            Libreta de Calificaciones
          </h1>
          <p className="text-slate-600 dark:text-gray-400">
            {course?.title}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-white/10">
                <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Estudiante</th>
                <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Actividad</th>
                <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Entrega</th>
                <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Calificación</th>
                <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No hay entregas registradas para este curso.
                  </td>
                </tr>
              ) : (
                submissions.map(sub => {
                  const activity = activities.find(a => a.id === sub.activity_id);
                  const isEditing = editingSubId === sub.id;
                  
                  return (
                    <tr key={sub.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-slate-800/20">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {sub.profiles ? `${sub.profiles.first_name} ${sub.profiles.last_name}` : 'Usuario'}
                            </p>
                            <p className="text-xs text-gray-500">{sub.auth_users?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                        {activity?.title || 'Actividad Desconocida'}
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {sub.file_url && (
                            <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline block mb-1">
                              Ver Archivo Adjunto
                            </a>
                          )}
                          {sub.text_content && (
                            <div className="truncate max-w-[200px]" title={sub.text_content}>
                              {sub.text_content}
                            </div>
                          )}
                          <div className="text-[10px] text-gray-400 mt-1">
                            {new Date(sub.submitted_at).toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={gradeInput}
                              onChange={e => setGradeInput(e.target.value)}
                              placeholder={`Escala: ${course?.grading_scale}`}
                              className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-950 border border-gray-300 dark:border-gray-700 rounded"
                            />
                            <textarea
                              value={feedbackInput}
                              onChange={e => setFeedbackInput(e.target.value)}
                              placeholder="Feedback (opcional)"
                              className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-950 border border-gray-300 dark:border-gray-700 rounded h-16"
                            />
                          </div>
                        ) : (
                          <div>
                            {sub.grade ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800">
                                {sub.grade}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-800">
                                Sin calificar
                              </span>
                            )}
                            {sub.teacher_feedback && (
                              <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]" title={sub.teacher_feedback}>
                                {sub.teacher_feedback}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveGrade(sub.id)} className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded">
                              <Check size={16} />
                            </button>
                            <button onClick={() => setEditingSubId(null)} className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setGradeInput(sub.grade || '');
                              setFeedbackInput(sub.teacher_feedback || '');
                              setEditingSubId(sub.id);
                            }}
                            className="text-sm text-indigo-600 font-medium hover:underline"
                          >
                            Calificar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LMSGradebook;
