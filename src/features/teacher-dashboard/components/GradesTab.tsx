import { useMemo, useState } from 'react';
import { AlertTriangle, Award, BarChart3, FileDown, Edit, Check, X } from 'lucide-react';
import { ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts';
import { supabase } from '../../../config/supabase';
import { toast } from 'sonner';

const COLORS = ['#D4AF37', '#1E3A8A', '#8B5CF6', '#10B981', '#EF4444'];

interface GradesTabProps {
  students: any[];
  submissions: any[];
  finalGrades: any[];
  courseId: string;
}

export function GradesTab({ students, submissions, finalGrades = [], courseId }: GradesTabProps) {
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState<string>('');
  const [editComment, setEditComment] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // We should also have access to enrollment mapping to find the enrollment_id for each student.
  // Because lms_grades needs enrollment_id, not just user_id. We map it out in finalGrades, but
  // if a student doesn't have a finalGrade yet, we need their enrollment_id to create one.
  const [enrollmentsMap, setEnrollmentsMap] = useState<Record<string, string>>({});

  // Fetch enrollments mapped by user_id for this course
  useMemo(() => {
    supabase
      .from('lms_enrollments')
      .select('id, user_id')
      .eq('course_id', courseId)
      .eq('role', 'student')
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach(e => { map[e.user_id] = e.id; });
          setEnrollmentsMap(map);
        }
      });
  }, [courseId]);

  const { averageGrade, strugglingStudents, highlightStudents, metricsData } = useMemo(() => {
    // Determine grades by submissions OR finalGrades
    const numericFinalGrades = finalGrades.map(fg => parseFloat(fg.final_grade)).filter(g => !isNaN(g));
    
    // Fallback to submissions if no final grades exist
    const gradesSource = numericFinalGrades.length > 0 ? numericFinalGrades : submissions.map(s => parseFloat(s.grade || '0')).filter(g => !isNaN(g) && g > 0);
    
    const avg = gradesSource.length > 0 ? gradesSource.reduce((a, b) => a + b, 0) / gradesSource.length : 0;
    const average = parseFloat(avg.toFixed(1));

    const struggling: any[] = [];
    const highPerformers: any[] = [];

    students.forEach(s => {
      // Find final grade first
      const fGrade = finalGrades.find(fg => fg.user_id === s.id);
      let sAvg = 0;
      
      if (fGrade && fGrade.final_grade) {
        sAvg = parseFloat(fGrade.final_grade);
      } else {
        // Fallback to submissions average
        const sSubmissions = submissions.filter(sub => sub.student_id === s.id);
        const sGrades = sSubmissions.map(sub => parseFloat(sub.grade || '0')).filter(g => !isNaN(g) && g > 0);
        sAvg = sGrades.length > 0 ? sGrades.reduce((a, b) => a + b, 0) / sGrades.length : 0;
      }
      
      if (sAvg > 0) {
        const studentInfo = { ...s, average: parseFloat(sAvg.toFixed(1)) };
        if (sAvg < 7.0) {
          struggling.push(studentInfo);
        } else if (sAvg >= 9.0) {
          highPerformers.push(studentInfo);
        }
      }
    });

    const metrics = [
      { name: 'Excelente (9-10)', value: highPerformers.length },
      { name: 'Regular (7-8.9)', value: Math.max(0, students.length - highPerformers.length - struggling.length) },
      { name: 'Rezago (< 7)', value: struggling.length }
    ].filter(d => d.value > 0);

    return {
      averageGrade: average,
      strugglingStudents: struggling,
      highlightStudents: highPerformers,
      metricsData: metrics
    };
  }, [students, submissions, finalGrades]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleEditClick = (studentId: string, currentGrade: string, currentComment: string) => {
    setEditingStudentId(studentId);
    setEditGrade(currentGrade);
    setEditComment(currentComment);
  };

  const handleSaveGrade = async (studentId: string) => {
    const enrollmentId = enrollmentsMap[studentId];
    if (!enrollmentId) {
      toast.error('Error de vinculación: No se encontró la matrícula del estudiante');
      return;
    }

    setIsSaving(true);
    try {
      const existingGrade = finalGrades.find(fg => fg.user_id === studentId);
      
      const payload = {
        enrollment_id: enrollmentId,
        final_grade: parseFloat(editGrade) || 0,
        comments: editComment,
        updated_at: new Date().toISOString()
      };

      if (existingGrade?.id) {
        // Update
        const { error } = await supabase
          .from('lms_grades')
          .update(payload)
          .eq('id', existingGrade.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('lms_grades')
          .insert(payload);
        if (error) throw error;
      }
      
      toast.success('Calificación final guardada correctamente');
      setEditingStudentId(null);
      // Let the react-query auto-refetch handle the UI update (we assume the parent will refetch on focus or interval)
      // For immediate response, one would invalidate the query, but a page refresh/tab switch also does it.
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h4 className="font-serif font-bold text-xs text-gray-450 dark:text-gray-400 uppercase tracking-wider mb-2">Promedio General</h4>
            <p className="text-4xl font-extrabold font-serif text-slate-900 dark:text-white">{averageGrade} <span className="text-sm font-sans font-semibold text-gray-400">/ 10</span></p>
          </div>
          <div className="border-t border-gray-100 dark:border-white/5 pt-3 mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>Entregas Procesadas:</span>
            <span className="font-bold font-mono text-slate-900 dark:text-white">{submissions.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full">
          <h4 className="font-serif font-bold text-xs text-gray-455 dark:text-gray-400 uppercase tracking-wider mb-2">Rendimiento Grupal</h4>
          <div className="h-28 flex justify-center items-center">
            {metricsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie
                    data={metricsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={45}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {metricsData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-gray-400">Sin registros</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full text-left space-y-3">
          <h4 className="font-serif font-bold text-xs text-gray-455 uppercase tracking-wider">Centro de Alertas Académicas</h4>
          
          <div className="space-y-2 overflow-y-auto max-h-24">
            {strugglingStudents.map(std => (
              <div key={std.id} className="flex items-center gap-1.5 text-xs text-red-600 font-bold bg-red-50 dark:bg-red-950/20 p-1.5 rounded-lg">
                <AlertTriangle size={12} />
                <span>Rezago: {std.first_name} {std.last_name} ({std.average})</span>
              </div>
            ))}
            {highlightStudents.map(std => (
              <div key={std.id} className="flex items-center gap-1.5 text-xs text-green-600 font-bold bg-green-50 dark:bg-green-950/20 p-1.5 rounded-lg">
                <Award size={12} />
                <span>Destacado: {std.first_name} {std.last_name} ({std.average})</span>
              </div>
            ))}
            {strugglingStudents.length === 0 && highlightStudents.length === 0 && (
              <p className="text-[10px] text-gray-400">No hay alertas disponibles.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 size={18} className="text-gold" />
            Matriz General de Calificaciones (Gradebook Final)
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => window.open(`/admin/lms/gradebook/${courseId}`, '_blank')}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 dark:text-indigo-400 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
            >
              <FileDown size={14} /> Revisar Entregas
            </button>
            <button 
              onClick={handleExportPDF}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
            >
              <FileDown size={14} /> Imprimir Boletines
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-100 dark:border-white/5 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/40 border-b border-gray-250 dark:border-white/5">
                <th className="p-3.5 font-bold text-xs text-gray-500 dark:text-gray-400">Estudiante</th>
                <th className="p-3.5 font-bold text-xs text-gray-500 dark:text-gray-400">Prom. Entregas</th>
                <th className="p-3.5 font-bold text-xs text-gray-500 dark:text-gray-400">Nota Final (Boletín)</th>
                <th className="p-3.5 font-bold text-xs text-gray-500 dark:text-gray-400">Comentario del Docente</th>
                <th className="p-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {students.map(std => {
                const fGrade = finalGrades.find(fg => fg.user_id === std.id);
                
                // Calculate submissions average just for reference
                const sSubmissions = submissions.filter(sub => sub.student_id === std.id);
                const sGrades = sSubmissions.map(sub => parseFloat(sub.grade || '0')).filter(g => !isNaN(g) && g > 0);
                const calcAvg = sGrades.length > 0 ? sGrades.reduce((a, b) => a + b, 0) / sGrades.length : 0;

                const isEditing = editingStudentId === std.id;
                const finalGradeValue = fGrade?.final_grade;
                const finalCommentValue = fGrade?.comments || '';

                return (
                  <tr key={std.id} className="border-b border-gray-100 dark:border-white/5 last:border-none hover:bg-gray-50/50">
                    <td className="p-3.5 font-bold text-xs text-slate-800 dark:text-white">{std.first_name} {std.last_name}</td>
                    <td className="p-3.5 font-mono text-xs text-gray-500">
                      {calcAvg > 0 ? calcAvg.toFixed(1) : '-'}
                    </td>
                    <td className="p-3.5">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editGrade}
                          onChange={(e) => setEditGrade(e.target.value)}
                          className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-800 outline-none focus:border-gold"
                          placeholder="0-10"
                          step="0.1"
                          max="10"
                        />
                      ) : (
                        <div className="font-mono font-bold text-xs">
                          {finalGradeValue ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${finalGradeValue >= 7 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {finalGradeValue} / 10
                            </span>
                          ) : (
                            <span className="text-gray-400">Sin asignar</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          className="w-full min-w-[150px] px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-800 outline-none focus:border-gold"
                          placeholder="Comentarios (opcional)"
                        />
                      ) : (
                        <div className="text-xs text-gray-500 max-w-[200px] truncate" title={finalCommentValue}>
                          {finalCommentValue || '-'}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-1">
                          <button 
                            disabled={isSaving}
                            onClick={() => handleSaveGrade(std.id)}
                            className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            disabled={isSaving}
                            onClick={() => setEditingStudentId(null)}
                            className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(std.id, finalGradeValue?.toString() || '', finalCommentValue)}
                          className="p-1.5 text-gray-400 hover:text-gold hover:bg-gold/10 rounded transition-colors cursor-pointer"
                          title="Editar Nota Final"
                        >
                          <Edit size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
