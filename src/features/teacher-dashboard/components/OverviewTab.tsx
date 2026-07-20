import { Users, BookOpen, Clock, FileCheck, ChevronRight, Layers, FileText } from 'lucide-react';

interface OverviewTabProps {
  studentsCount: number;
  coursesCount: number;
  classesToday: number;
  assignmentsToGrade: number;
  recentSubmissions: any[];
  courses?: any[];
  activities?: any[];
}

export function OverviewTab({
  studentsCount,
  coursesCount,
  classesToday,
  assignmentsToGrade,
  recentSubmissions,
  courses = [],
  activities = []
}: OverviewTabProps) {
  
  // Calculate graded vs total for activities
  // As an approximation, total submissions expected = studentsCount (per course)
  // Let's filter active activities (e.g. recent 5)
  const activeActivities = activities.slice(0, 6);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Column */}
      <div className="flex-1 space-y-6">
        
        {/* Top Stats - Glassmorphism style */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 border border-indigo-800/50 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-indigo-500/20 rounded-full blur-xl group-hover:bg-indigo-500/30 transition-all"></div>
            <div className="w-10 h-10 bg-indigo-800/50 text-indigo-300 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
              <BookOpen size={18} />
            </div>
            <p className="font-extrabold text-3xl text-white font-mono tracking-tight">{coursesCount}</p>
            <p className="text-[11px] uppercase tracking-wider font-bold text-indigo-300 mt-1">Carga Académica</p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/50 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="w-10 h-10 bg-slate-800/50 text-emerald-400 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
              <FileCheck size={18} />
            </div>
            <p className="font-extrabold text-3xl text-white font-mono tracking-tight">{assignmentsToGrade}</p>
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mt-1">Por Calificar</p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/50 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
            <div className="w-10 h-10 bg-slate-800/50 text-amber-400 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
              <Users size={18} />
            </div>
            <p className="font-extrabold text-3xl text-white font-mono tracking-tight">0</p>
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mt-1">Asist. Ptes.</p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/50 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all"></div>
            <div className="w-10 h-10 bg-slate-800/50 text-rose-400 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
              <Clock size={18} />
            </div>
            <p className="font-extrabold text-3xl text-white font-mono tracking-tight">{classesToday}</p>
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mt-1">Planificadores</p>
          </div>
        </div>

        {/* Actividades por Calificar Panel */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <h3 className="font-serif font-bold text-[15px] text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck size={18} className="text-emerald-500" />
              Actividades por Calificar
            </h3>
          </div>
          
          <div className="p-2 space-y-1">
            {activeActivities.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">No hay actividades pendientes en este momento.</p>
            ) : (
              activeActivities.map(activity => {
                // Approximate grading logic (for visual demo, in reality we count submissions with grades)
                const activitySubmissions = recentSubmissions.filter(s => s.activity_id === activity.id);
                const gradedCount = activitySubmissions.filter(s => s.grade).length;
                const totalStudentsForCourse = studentsCount; // fallback
                
                const ratio = `${gradedCount}/${totalStudentsForCourse || activitySubmissions.length || 29}`;
                const isFullyGraded = gradedCount >= (totalStudentsForCourse || activitySubmissions.length || 29);

                return (
                  <div key={activity.id} className="group flex items-center justify-between p-4 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileText size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-850 dark:text-gray-100 uppercase tracking-wide group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {activity.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            {/* Resolve course name if possible */}
                            {courses.find(c => c.id === activity.course_id)?.title || 'Curso General'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-tight ${
                      isFullyGraded 
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}>
                      {ratio}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Right Sidebar - Mis Materias */}
      <div className="w-full lg:w-[320px] shrink-0">
        <div className="bg-[#0f172a] dark:bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden h-full">
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900">
            <h3 className="font-serif font-bold text-[15px] text-white flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-400" />
              Mis Materias
            </h3>
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold">
              {coursesCount}
            </div>
          </div>
          
          <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
            {courses.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No tiene materias asignadas.</p>
            ) : (
              courses.map(course => (
                <div key={course.id} className="group flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/30 rounded-xl transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                      <Layers size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[13px] text-slate-200 line-clamp-1 leading-tight group-hover:text-indigo-300 transition-colors">
                        {course.title}
                      </span>
                      <span className="text-[10px] font-medium text-emerald-400 mt-0.5">
                        {studentsCount} Est.
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
