import { useMemo } from 'react';
import { AlertTriangle, Award, BarChart3, FileDown } from 'lucide-react';
import { ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts';

const COLORS = ['#D4AF37', '#1E3A8A', '#8B5CF6', '#10B981', '#EF4444'];

interface GradesTabProps {
  students: any[];
  submissions: any[];
}

export function GradesTab({ students, submissions }: GradesTabProps) {
  const { averageGrade, strugglingStudents, highlightStudents, metricsData } = useMemo(() => {
    const grades = submissions
      .map(s => parseFloat(s.grade || '0'))
      .filter(g => !isNaN(g) && g > 0);
    
    const avg = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
    const average = parseFloat(avg.toFixed(1));

    const studentGrades: Record<string, number[]> = {};
    submissions.forEach(s => {
      if (!studentGrades[s.student_id]) studentGrades[s.student_id] = [];
      const val = parseFloat(s.grade || '0');
      if (!isNaN(val) && val > 0) {
        studentGrades[s.student_id].push(val);
      }
    });

    const struggling: any[] = [];
    const highPerformers: any[] = [];

    students.forEach(s => {
      const sGrades = studentGrades[s.id] || [];
      const sAvg = sGrades.length > 0 ? sGrades.reduce((a, b) => a + b, 0) / sGrades.length : 0;
      
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
  }, [students, submissions]);

  const handleExportPDF = () => {
    window.print();
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
          <h4 className="font-serif font-bold text-xs text-gray-450 dark:text-gray-400 uppercase tracking-wider mb-2">Rendimiento Grupal</h4>
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
            Matriz General de Calificaciones (Gradebook)
          </h3>
          <button 
            onClick={handleExportPDF}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
          >
            <FileDown size={14} /> Imprimir Boletines
          </button>
        </div>

        <div className="overflow-x-auto border border-gray-100 dark:border-white/5 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/40 border-b border-gray-250 dark:border-white/5">
                <th className="p-3.5 font-bold text-xs text-gray-500 dark:text-gray-400">Estudiante</th>
                <th className="p-3.5 font-bold text-xs text-gray-500 dark:text-gray-400">Calificación Promedio</th>
                <th className="p-3.5 font-bold text-xs text-gray-500 dark:text-gray-400">Estado de Aprobación</th>
              </tr>
            </thead>
            <tbody>
              {students.map(std => {
                const sAvg = highlightStudents.find(h => h.id === std.id)?.average || strugglingStudents.find(s => s.id === std.id)?.average || 0;
                return (
                  <tr key={std.id} className="border-b border-gray-100 dark:border-white/5 last:border-none hover:bg-gray-50/50">
                    <td className="p-3.5 font-bold text-xs text-slate-800 dark:text-white">{std.first_name} {std.last_name}</td>
                    <td className="p-3.5 font-mono font-bold text-xs">
                      {sAvg > 0 ? `${sAvg} / 10` : 'Sin entregas'}
                    </td>
                    <td className="p-3.5">
                      {sAvg === 0 ? (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold">N/C</span>
                      ) : sAvg >= 7 ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-[9px] font-bold">Aprobado</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-[9px] font-bold">Reprobado (Alerta)</span>
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
