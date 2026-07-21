import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { Loader2, Search, Edit2, FileText, X, Save } from 'lucide-react';
import { toast } from 'sonner';

interface GradebookProProps {
  courseId: string;
}

interface GBStudent {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url?: string;
  doc_id?: string;
}

interface GBActivity {
  id: string;
  title: string;
  type: string;
  weighting: number;
  section_id?: string;
}

interface GBSubmission {
  id: string;
  student_id: string;
  activity_id: string;
  grade: string | number | null;
  teacher_feedback: string | null;
  status?: string;
  file_url?: string;
  text_content?: string;
}

export function GradebookPro({ courseId }: GradebookProProps) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<GBStudent[]>([]);
  const [activities, setActivities] = useState<GBActivity[]>([]);
  const [submissions, setSubmissions] = useState<GBSubmission[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<GBStudent | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<GBActivity | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<GBSubmission | null>(null);

  // Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: enrollments, error: enrollError } = await supabase
          .from('lms_enrollments')
          .select(`
            user_id,
            profiles:user_id (id, first_name, last_name, avatar_url, doc_id)
          `)
          .eq('course_id', courseId)
          .eq('role', 'student');
        
        if (enrollError) throw enrollError;
        setStudents((enrollments?.map(e => e.profiles) as unknown as GBStudent[]) || []);

        const { data: fetchedActivities, error: actError } = await supabase
          .from('lms_activities')
          .select('id, title, type, weighting, section_id')
          .in('type', ['assignment', 'quiz', 'forum']) 
          .gt('weighting', 0) 
          .order('order_index', { ascending: true });

        if (actError) throw actError;
        setActivities((fetchedActivities as GBActivity[]) || []);

        if (fetchedActivities && fetchedActivities.length > 0) {
          const actIds = fetchedActivities.map(a => a.id);
          const { data: fetchedSubmissions, error: subError } = await supabase
            .from('lms_assignment_submissions')
            .select('*')
            .in('activity_id', actIds);

          if (subError) throw subError;
          setSubmissions((fetchedSubmissions as GBSubmission[]) || []);
        }
      } catch (err) {
        console.error(err);
        toast.error('Error al cargar la libreta de calificaciones');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadData();
    }
  }, [courseId]);

  const fetchData = async () => {
    // This is used by handleSaveGrade
    try {
      const { data: fetchedSubmissions, error: subError } = await supabase
        .from('lms_assignment_submissions')
        .select('*')
        .in('activity_id', activities.map(a => a.id));

      if (subError) throw subError;
      setSubmissions((fetchedSubmissions as GBSubmission[]) || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getSubmission = (studentId: string, activityId: string) => {
    return submissions.find(s => s.student_id === studentId && s.activity_id === activityId);
  };

  const openGradingPanel = (student: GBStudent, activity: GBActivity) => {
    setSelectedStudent(student);
    setSelectedActivity(activity);
    const sub = getSubmission(student.id, activity.id);
    setActiveSubmission(sub || null);
    setGradeInput(sub?.grade?.toString() || '');
    setFeedbackInput(sub?.teacher_feedback || '');
    setIsPanelOpen(true);
  };

  const handleSaveGrade = async () => {
    if (!selectedStudent || !selectedActivity) return;
    setSavingGrade(true);
    
    try {
      const payload = {
        activity_id: selectedActivity.id,
        student_id: selectedStudent.id,
        grade: gradeInput,
        teacher_feedback: feedbackInput,
        graded_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('lms_assignment_submissions')
        .upsert(payload);

      if (error) throw error;
      toast.success('Calificación guardada exitosamente');
      await fetchData(); // Refresh
      setIsPanelOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar calificación');
    } finally {
      setSavingGrade(false);
    }
  };

  const calculateFinalGrade = (studentId: string) => {
    let total = 0;
    activities.forEach(act => {
      const sub = getSubmission(studentId, act.id);
      if (sub && sub.grade) {
        // Assume grade is out of 10 or 100, weighting is percentage (0-100)
        // If grade is a string, try to parse it
        const numericGrade = parseFloat(sub.grade?.toString() || '');
        if (!isNaN(numericGrade)) {
          // If grade scale is 10/10, multiply by weight% / 10
          // If weight is 30(%), and grade is 10, total += (10/10) * 30 = 30 points of 100
          // For simplicity, let's assume numericGrade is out of 10
          total += (numericGrade / 10) * (act.weighting || 0);
        }
      }
    });
    return total.toFixed(2);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gold" size={32} /></div>;

  const filteredStudents = students.filter(s => {
    const fullName = `${s?.first_name || ''} ${s?.last_name || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || s?.doc_id?.includes(searchTerm);
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden relative">
      <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
        <h2 className="font-bold text-lg">Matriz de Calificaciones</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar estudiante..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-gold focus:border-gold outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50">
              <th className="p-4 font-bold text-sm text-gray-600 dark:text-gray-300 border-b border-r border-gray-200 dark:border-white/10 sticky left-0 z-10 bg-slate-50 dark:bg-slate-900">
                Estudiante
              </th>
              {activities.map(act => (
                <th key={act.id} className="p-4 font-bold text-xs text-center text-gray-600 dark:text-gray-300 border-b border-r border-gray-200 dark:border-white/10 w-32 whitespace-nowrap">
                  <div className="truncate w-full" title={act.title}>{act.title}</div>
                  <div className="text-[10px] text-gold mt-1">({act.weighting}%)</div>
                </th>
              ))}
              <th className="p-4 font-bold text-sm text-center text-indigo-600 dark:text-indigo-400 border-b border-gray-200 dark:border-white/10 w-24">
                Total / 100
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr><td colSpan={activities.length + 2} className="text-center p-8 text-gray-500">No hay estudiantes matriculados o no coinciden con la búsqueda</td></tr>
            ) : (
              filteredStudents.map(student => (
                <tr key={student.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="p-4 border-r border-gray-100 dark:border-white/5 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
                        {student.avatar_url ? (
                          <img src={student.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold">{student.first_name?.charAt(0)}</div>
                        )}
                      </div>
                      <div className="truncate max-w-[200px]">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{student.doc_id || 'Sin Cédula'}</p>
                      </div>
                    </div>
                  </td>
                  
                  {activities.map(act => {
                    const sub = getSubmission(student.id, act.id);
                    return (
                      <td key={act.id} className="p-3 border-r border-gray-100 dark:border-white/5 text-center">
                        <button
                          onClick={() => openGradingPanel(student, act)}
                          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 hover:ring-2 hover:ring-gold/50 ${
                            sub?.grade 
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                              : sub 
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                : 'bg-gray-50 text-gray-400 dark:bg-slate-800 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {sub?.grade || (sub ? 'Pendiente' : '-')}
                          {sub && !sub.grade && <Edit2 size={12} className="ml-1" />}
                        </button>
                      </td>
                    );
                  })}

                  <td className="p-4 text-center font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/10">
                    {calculateFinalGrade(student.id)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Grading Slide-over Panel */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsPanelOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-in-right border-l border-gray-200 dark:border-white/10">
            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-lg">Evaluar Entrega</h3>
              <button onClick={() => setIsPanelOpen(false)} className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full hover:bg-gray-200">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Student Info */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-white/5">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                  {selectedStudent?.avatar_url && <img src={selectedStudent.avatar_url} className="w-full h-full object-cover" />}
                </div>
                <div>
                  <p className="font-bold">{selectedStudent?.first_name} {selectedStudent?.last_name}</p>
                  <p className="text-xs text-gray-500">{selectedActivity?.title}</p>
                </div>
              </div>

              {/* Submission Content */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Archivo del Estudiante</h4>
                {!activeSubmission ? (
                  <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                    El estudiante no ha enviado nada aún.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeSubmission.file_url && (
                      <a 
                        href={`${import.meta.env.VITE_R2_PUBLIC_URL}/${activeSubmission.file_url}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl hover:border-gold transition-colors"
                      >
                        <FileText className="text-blue-500" size={24} />
                        <div>
                          <p className="font-bold text-sm">Ver Documento Adjunto</p>
                          <p className="text-xs text-gray-500">Abrir en nueva pestaña</p>
                        </div>
                      </a>
                    )}
                    {activeSubmission.text_content && (
                      <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-white/5 text-sm italic">
                        "{activeSubmission.text_content}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Grading Form */}
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Calificación (0 - 10)</label>
                  <input
                    type="number"
                    step="0.01"
                    max="10"
                    min="0"
                    value={gradeInput}
                    onChange={e => setGradeInput(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-gold outline-none font-bold text-lg"
                    placeholder="Ej. 9.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Retroalimentación / Comentarios</label>
                  <textarea
                    rows={4}
                    value={feedbackInput}
                    onChange={e => setFeedbackInput(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-gold outline-none text-sm"
                    placeholder="Escribe comentarios de mejora o felicitaciones para el alumno..."
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-white/10 bg-slate-50 dark:bg-slate-950">
              <button
                onClick={handleSaveGrade}
                disabled={savingGrade || (!gradeInput && !feedbackInput)}
                className="w-full bg-gold hover:bg-yellow-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                {savingGrade ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Guardar Calificación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
