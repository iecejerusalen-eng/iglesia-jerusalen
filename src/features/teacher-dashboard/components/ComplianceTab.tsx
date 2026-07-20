import { useState, useMemo } from 'react';
import { AlertTriangle, Clock, MessageSquare, Search, ChevronDown, ChevronUp, Bell, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import { toast } from 'sonner';
import { useNotifications } from '../hooks/useNotifications';

interface ComplianceTabProps {
  students: any[];
  submissions: any[];
  activities: any[];
  courseId: string;
}

export function ComplianceTab({ students, submissions, activities, courseId }: ComplianceTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const { sendNotification, isSending } = useNotifications();

  // Calculate missing assignments
  const complianceData = useMemo(() => {
    const data: any[] = [];
    
    // Only consider activities of type assignment or quiz
    const gradableActivities = activities.filter(a => a.type === 'assignment' || a.type === 'quiz');

    students.forEach(student => {
      const pendingActivities: any[] = [];
      
      gradableActivities.forEach(activity => {
        const submission = submissions.find(s => s.student_id === student.id && s.lesson_id === activity.id);
        
        // If there's no submission, or submission is just a draft with no grade/file, we count it as pending.
        // For simplicity, if there's no submission record at all:
        if (!submission) {
          pendingActivities.push({
            activityId: activity.id,
            activityTitle: activity.title,
            type: activity.type,
            status: 'missing'
          });
        }
      });

      if (pendingActivities.length > 0) {
        data.push({
          student,
          pendingActivities,
          totalPending: pendingActivities.length
        });
      }
    });

    // Sort by most pending activities
    return data.sort((a, b) => b.totalPending - a.totalPending);
  }, [students, submissions, activities]);

  const filteredData = complianceData.filter(item => 
    `${item.student.first_name} ${item.student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNotifyStudent = async (student: any, pendingCount: number) => {
    await sendNotification({
      userId: student.id,
      userEmail: student.email || `${student.first_name.toLowerCase()}@jerusalen.edu.ec`, // Fallback si no está cargado el email en la vista
      userName: `${student.first_name} ${student.last_name}`,
      courseName: 'Aula Virtual',
      type: 'missing_homework',
      extraData: { missingTasksCount: pendingCount }
    });
  };

  const handleNotifyAll = async () => {
    if (complianceData.length === 0) return;
    
    // Para simplificar, notificamos en secuencia (podría paralelizarse)
    let count = 0;
    for (const item of complianceData) {
      const success = await sendNotification({
        userId: item.student.id,
        userEmail: item.student.email || `${item.student.first_name.toLowerCase()}@jerusalen.edu.ec`,
        userName: `${item.student.first_name} ${item.student.last_name}`,
        courseName: 'Aula Virtual',
        type: 'missing_homework',
        extraData: { missingTasksCount: item.totalPending }
      });
      if (success) count++;
    }
    
    toast.success(`Se enviaron ${count} notificaciones a estudiantes rezagados.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="text-orange-500" />
            Centro de Incumplimientos
          </h2>
          <p className="text-sm text-gray-500">Monitorea y alerta a estudiantes con tareas y evaluaciones pendientes.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Buscar estudiante..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-gold outline-none w-full md:w-64"
            />
          </div>
          <button 
            onClick={handleNotifyAll}
            disabled={isSending || complianceData.length === 0}
            className="bg-gold hover:bg-yellow-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap shadow-sm"
          >
            <Bell size={14} /> Notificar a Todos
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm">
          <h4 className="font-serif font-bold text-xs text-gray-450 dark:text-gray-400 uppercase tracking-wider mb-2">Total Rezagados</h4>
          <p className="text-4xl font-extrabold font-serif text-slate-900 dark:text-white">
            {complianceData.length} <span className="text-sm font-sans font-normal text-gray-400">estudiantes</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm">
          <h4 className="font-serif font-bold text-xs text-gray-450 dark:text-gray-400 uppercase tracking-wider mb-2">Tareas Pendientes (Global)</h4>
          <p className="text-4xl font-extrabold font-serif text-orange-500">
            {complianceData.reduce((acc, curr) => acc + curr.totalPending, 0)} <span className="text-sm font-sans font-normal text-gray-400">tareas</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
           <div className="flex items-center gap-3 text-green-600 bg-green-50 dark:bg-green-950/30 p-3 rounded-xl border border-green-100 dark:border-green-900/50">
             <CheckCircle2 size={24} />
             <div>
               <p className="font-bold text-sm">Al día</p>
               <p className="text-xs">{students.length - complianceData.length} estudiantes sin pendientes</p>
             </div>
           </div>
        </div>
      </div>

      {/* Compliance List */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <CheckCircle2 size={48} className="text-green-400 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-gray-300">¡Excelente!</h3>
            <p className="text-sm">Todos los estudiantes están al día con sus tareas.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {filteredData.map((item) => (
              <div key={item.student.id} className="group">
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors"
                  onClick={() => setExpandedStudent(expandedStudent === item.student.id ? null : item.student.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold font-serif">
                      {item.student.first_name?.[0]}{item.student.last_name?.[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {item.student.first_name} {item.student.last_name}
                      </h4>
                      <p className="text-xs text-orange-500 font-medium flex items-center gap-1 mt-0.5">
                        <AlertTriangle size={12} /> {item.totalPending} {item.totalPending === 1 ? 'actividad pendiente' : 'actividades pendientes'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleNotifyStudent(item.student, item.totalPending); }}
                      disabled={isSending}
                      className="hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                      <MessageSquare size={14} /> Alertar
                    </button>
                    <div className="text-gray-400">
                      {expandedStudent === item.student.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedStudent === item.student.id && (
                  <div className="px-5 pb-5 pt-2 bg-gray-50/50 dark:bg-slate-900/50">
                    <div className="pl-14">
                      <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Detalle de Incumplimientos</h5>
                      <div className="space-y-2">
                        {item.pendingActivities.map((act: any) => (
                          <div key={act.activityId} className="flex items-center justify-between bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 p-3 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${act.type === 'quiz' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                <Clock size={14} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{act.activityTitle}</p>
                                <p className="text-xs text-gray-500">{act.type === 'assignment' ? 'Tarea/Deber' : 'Evaluación'}</p>
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold rounded-md uppercase">
                              No Entregado
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
