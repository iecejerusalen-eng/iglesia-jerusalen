import { useMemo, useState } from 'react';
import { AlertTriangle, Award, BarChart3, FileDown, Check, X, Search, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts';
import { supabase } from '../../../config/supabase';
import { toast } from 'sonner';

const COLORS = ['#D4AF37', '#1E3A8A', '#8B5CF6', '#10B981', '#EF4444'];

interface GradesTabProps {
  students: any[];
  submissions: any[];
  finalGrades: any[];
  courseId: string;
  activities?: any[];
}

export function GradesTab({ students, submissions, finalGrades = [], courseId, activities = [] }: GradesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{ studentId: string, activityId: string } | null>(null);
  const [editGrade, setEditGrade] = useState<string>('');
  
  const [editingFinalGrade, setEditingFinalGrade] = useState<string | null>(null);
  const [editFinal, setEditFinal] = useState<string>('');
  
  const [isSaving, setIsSaving] = useState(false);

  // Enrollments mapping
  const [enrollmentsMap, setEnrollmentsMap] = useState<Record<string, string>>({});
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
    const numericFinalGrades = finalGrades.map(fg => parseFloat(fg.final_grade)).filter(g => !isNaN(g));
    const gradesSource = numericFinalGrades.length > 0 ? numericFinalGrades : submissions.map(s => parseFloat(s.grade || '0')).filter(g => !isNaN(g) && g > 0);
    const avg = gradesSource.length > 0 ? gradesSource.reduce((a, b) => a + b, 0) / gradesSource.length : 0;
    const average = parseFloat(avg.toFixed(1));

    const struggling: any[] = [];
    const highPerformers: any[] = [];

    students.forEach(s => {
      const fGrade = finalGrades.find(fg => fg.user_id === s.id);
      let sAvg = 0;
      if (fGrade && fGrade.final_grade) {
        sAvg = parseFloat(fGrade.final_grade);
      } else {
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

    return { averageGrade: average, strugglingStudents: struggling, highlightStudents: highPerformers, metricsData: metrics };
  }, [students, submissions, finalGrades]);

  const handleExportPDF = () => window.print();

  // Helper to find submission for a specific student and activity
  const getSubmission = (studentId: string, activityId: string) => {
    return submissions.find(s => s.student_id === studentId && s.lesson_id === activityId);
  };

  const handleEditCell = (studentId: string, activityId: string, currentGrade: string) => {
    setEditingCell({ studentId, activityId });
    setEditGrade(currentGrade || '');
  };

  const handleSaveCell = async (studentId: string, activityId: string) => {
    setIsSaving(true);
    try {
      const existingSub = getSubmission(studentId, activityId);
      
      if (existingSub) {
        // Update existing submission
        const { error } = await supabase
          .from('lms_lesson_submissions')
          .update({
            grade: editGrade,
            graded_at: new Date().toISOString(),
            status: 'graded'
          })
          .eq('id', existingSub.id);
        if (error) throw error;
      } else {
        // Create a teacher-initiated submission (override) if student hasn't submitted yet
        const { error } = await supabase
          .from('lms_lesson_submissions')
          .insert({
            lesson_id: activityId,
            student_id: studentId,
            grade: editGrade,
            status: 'graded',
            graded_at: new Date().toISOString(),
            teacher_feedback: 'Calificación ingresada directamente en la matriz.'
          });
        if (error) throw error;
      }
      
      toast.success('Calificación actualizada');
      setEditingCell(null);
    } catch (err: any) {
      toast.error('Error al calificar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFinalGrade = async (studentId: string) => {
    const enrollmentId = enrollmentsMap[studentId];
    if (!enrollmentId) {
      toast.error('Error: No se encontró matrícula');
      return;
    }

    setIsSaving(true);
    try {
      const existingGrade = finalGrades.find(fg => fg.user_id === studentId);
      const payload = {
        enrollment_id: enrollmentId,
        final_grade: parseFloat(editFinal) || 0,
        updated_at: new Date().toISOString()
      };

      if (existingGrade?.id) {
        const { error } = await supabase.from('lms_grades').update(payload).eq('id', existingGrade.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('lms_grades').insert(payload);
        if (error) throw error;
      }
      
      toast.success('Nota final guardada');
      setEditingFinalGrade(null);
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h4 className="font-serif font-bold text-xs text-gray-450 dark:text-gray-400 uppercase tracking-wider mb-2">Promedio General</h4>
            <p className="text-4xl font-extrabold font-serif text-slate-900 dark:text-white">{averageGrade} <span className="text-sm font-sans font-semibold text-gray-400">/ 10</span></p>
          </div>
          <div className="border-t border-gray-100 dark:border-white/5 pt-3 mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>Entregas Registradas:</span>
            <span className="font-bold font-mono text-slate-900 dark:text-white">{submissions.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full">
          <h4 className="font-serif font-bold text-xs text-gray-455 dark:text-gray-400 uppercase tracking-wider mb-2">Rendimiento Grupal</h4>
          <div className="h-28 flex justify-center items-center">
            {metricsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie data={metricsData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} paddingAngle={3} dataKey="value">
                    {metricsData.map((_entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <span className="text-xs text-gray-400">Sin registros</span>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full text-left space-y-3">
          <h4 className="font-serif font-bold text-xs text-gray-455 uppercase tracking-wider">Centro de Alertas</h4>
          <div className="space-y-2 overflow-y-auto max-h-24">
            {strugglingStudents.map(std => (
              <div key={std.id} className="flex items-center gap-1.5 text-[11px] text-red-600 font-bold bg-red-50 dark:bg-red-950/20 p-2 rounded-lg">
                <AlertTriangle size={12} />
                <span>Rezago: {std.first_name} {std.last_name} ({std.average})</span>
              </div>
            ))}
            {highlightStudents.map(std => (
              <div key={std.id} className="flex items-center gap-1.5 text-[11px] text-green-600 font-bold bg-green-50 dark:bg-green-950/20 p-2 rounded-lg">
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

      {/* GRADEBOOK MATRIX */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-150 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center text-gold">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white">Matriz de Calificaciones (Gradebook)</h3>
              <p className="text-xs text-gray-500">Haz clic en cualquier celda para ingresar o editar una nota (Modo Interactivo).</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Buscar estudiante..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-gold outline-none w-full md:w-64"
              />
            </div>
            <button 
              onClick={handleExportPDF}
              className="bg-slate-800 hover:bg-slate-900 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap"
            >
              <FileDown size={14} /> Exportar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950/60 border-b border-gray-250 dark:border-white/10">
                <th className="p-4 font-bold text-xs text-slate-700 dark:text-gray-300 sticky left-0 bg-slate-100 dark:bg-slate-950/95 z-10 w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Estudiante
                </th>
                {/* Dynamically render activity columns */}
                {activities.map((act, i) => (
                  <th key={act.id} className="p-4 font-bold text-[10px] text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-white/5 w-24 text-center">
                    <div className="truncate w-20 mx-auto" title={act.title}>
                      A{i+1}: {act.title}
                    </div>
                    <div className="font-normal text-[9px] mt-1 text-gold">{act.type === 'assignment' ? 'Tarea' : 'Quiz'}</div>
                  </th>
                ))}
                
                <th className="p-4 font-bold text-xs text-slate-700 dark:text-gray-300 border-l border-gray-300 dark:border-white/10 w-24 text-center bg-gray-50 dark:bg-slate-900/40">
                  Promedio
                </th>
                <th className="p-4 font-bold text-xs text-blue-700 dark:text-blue-400 border-l border-gray-300 dark:border-white/10 w-28 text-center bg-blue-50 dark:bg-blue-900/10">
                  Nota Final
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={activities.length + 3} className="p-8 text-center text-sm text-gray-500">
                    No hay estudiantes para mostrar.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(std => {
                  const fGrade = finalGrades.find(fg => fg.user_id === std.id);
                  const sSubmissions = submissions.filter(sub => sub.student_id === std.id);
                  const sGrades = sSubmissions.map(sub => parseFloat(sub.grade || '0')).filter(g => !isNaN(g) && g > 0);
                  const calcAvg = sGrades.length > 0 ? sGrades.reduce((a, b) => a + b, 0) / sGrades.length : 0;
                  
                  const isEditingFinal = editingFinalGrade === std.id;

                  return (
                    <tr key={std.id} className="border-b border-gray-150 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 group">
                      {/* Name Column (Sticky) */}
                      <td className="p-4 text-xs font-medium text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-gray-50 dark:group-hover:bg-slate-800/30 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-between">
                          <span className="truncate pr-2">{std.last_name} {std.first_name}</span>
                          <ChevronRight size={12} className="text-gray-300" />
                        </div>
                      </td>

                      {/* Dynamic Activity Cells */}
                      {activities.map(act => {
                        const sub = getSubmission(std.id, act.id);
                        const isEditingThis = editingCell?.studentId === std.id && editingCell?.activityId === act.id;
                        const gradeVal = sub?.grade ? parseFloat(sub.grade) : null;
                        
                        return (
                          <td 
                            key={act.id} 
                            className={`p-2 border-l border-gray-150 dark:border-white/5 text-center cursor-pointer transition-colors ${isEditingThis ? 'bg-gold/10' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                            onClick={() => !isEditingThis && handleEditCell(std.id, act.id, sub?.grade || '')}
                          >
                            {isEditingThis ? (
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  autoFocus
                                  type="number"
                                  value={editGrade}
                                  onChange={(e) => setEditGrade(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCell(std.id, act.id);
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  className="w-12 px-1 py-1 text-[11px] font-mono text-center border-b-2 border-gold bg-transparent outline-none"
                                  placeholder="-"
                                  step="0.1"
                                  max="10"
                                />
                                <div className="flex gap-1">
                                  <button onClick={(e) => { e.stopPropagation(); handleSaveCell(std.id, act.id); }} className="text-green-600"><Check size={12}/></button>
                                  <button onClick={(e) => { e.stopPropagation(); setEditingCell(null); }} className="text-red-500"><X size={12}/></button>
                                </div>
                              </div>
                            ) : (
                              <div className={`font-mono text-xs font-bold ${!gradeVal ? 'text-gray-300' : gradeVal >= 7 ? 'text-green-600' : 'text-red-500'}`}>
                                {gradeVal ? gradeVal.toFixed(1) : '-'}
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Calculated Average */}
                      <td className="p-4 font-mono text-xs font-bold text-gray-500 border-l border-gray-300 dark:border-white/10 text-center bg-gray-50/50 dark:bg-slate-900/20">
                        {calcAvg > 0 ? calcAvg.toFixed(1) : '-'}
                      </td>

                      {/* Final Grade (Editable) */}
                      <td 
                        className={`p-2 font-mono text-xs font-bold border-l border-gray-300 dark:border-white/10 text-center cursor-pointer ${isEditingFinal ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-blue-50/50 dark:bg-blue-900/5 hover:bg-blue-100 dark:hover:bg-blue-900/20'}`}
                        onClick={() => !isEditingFinal && (setEditingFinalGrade(std.id), setEditFinal(fGrade?.final_grade || ''))}
                      >
                        {isEditingFinal ? (
                           <div className="flex flex-col items-center gap-1">
                             <input
                               autoFocus
                               type="number"
                               value={editFinal}
                               onChange={(e) => setEditFinal(e.target.value)}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') handleSaveFinalGrade(std.id);
                                 if (e.key === 'Escape') setEditingFinalGrade(null);
                               }}
                               className="w-12 px-1 py-1 text-[11px] font-mono text-center border-b-2 border-blue-500 bg-transparent outline-none"
                               placeholder="-"
                             />
                             <div className="flex gap-1">
                               <button onClick={(e) => { e.stopPropagation(); handleSaveFinalGrade(std.id); }} className="text-blue-600"><Check size={12}/></button>
                               <button onClick={(e) => { e.stopPropagation(); setEditingFinalGrade(null); }} className="text-red-500"><X size={12}/></button>
                             </div>
                           </div>
                        ) : (
                          <div className={fGrade?.final_grade ? (parseFloat(fGrade.final_grade) >= 7 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500') : 'text-gray-400'}>
                            {fGrade?.final_grade ? parseFloat(fGrade.final_grade).toFixed(1) : 'S/N'}
                          </div>
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
}
