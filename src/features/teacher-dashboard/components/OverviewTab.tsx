import { Users, BookOpen, Clock, FileCheck, CheckCircle } from 'lucide-react';

interface OverviewTabProps {
  studentsCount: number;
  coursesCount: number;
  classesToday: number;
  assignmentsToGrade: number;
  recentSubmissions: any[];
}

export function OverviewTab({
  studentsCount,
  coursesCount,
  classesToday,
  assignmentsToGrade,
  recentSubmissions
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm text-center">
          <div className="w-10 h-10 mx-auto bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-3">
            <Users size={18} />
          </div>
          <p className="font-extrabold text-2xl text-slate-900 dark:text-white font-mono">{studentsCount}</p>
          <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mt-1">Alumnos (Total)</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm text-center">
          <div className="w-10 h-10 mx-auto bg-gold/15 text-gold rounded-full flex items-center justify-center mb-3">
            <BookOpen size={18} />
          </div>
          <p className="font-extrabold text-2xl text-slate-900 dark:text-white font-mono">{coursesCount}</p>
          <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mt-1">Cursos Asignados</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm text-center">
          <div className="w-10 h-10 mx-auto bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-3">
            <Clock size={18} />
          </div>
          <p className="font-extrabold text-2xl text-slate-900 dark:text-white font-mono">{classesToday}</p>
          <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mt-1">Clases Hoy</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm text-center">
          <div className="w-10 h-10 mx-auto bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-3">
            <FileCheck size={18} />
          </div>
          <p className="font-extrabold text-2xl text-slate-900 dark:text-white font-mono">{assignmentsToGrade}</p>
          <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mt-1">Por Calificar</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4 text-left">
        <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <CheckCircle size={18} className="text-gold" />
          Entregas Recientes (Últimas 5)
        </h3>
        
        {recentSubmissions.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">No hay entregas pendientes recientes de los alumnos en este momento.</p>
        ) : (
          <div className="space-y-3">
            {recentSubmissions.slice(0, 5).map(sub => (
              <div key={sub.id} className="p-3 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-white/5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-850 dark:text-white">Alumno ID: {sub.student_id}</p>
                  <p className="text-[10px] text-gray-500">Actividad ID: {sub.activity_id}</p>
                </div>
                <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-full font-bold">
                  {sub.status === 'submitted' ? 'Entregado' : 'Sin calificar'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
