import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, Loader2, Eye } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { ActivityDetailModal } from './components/ActivityDetailModal';

interface CourseActivitiesTabProps {
  courseId: string;
}

interface Activity {
  id: string;
  title: string;
  module: string;
  dueDate: string;
  status: string;
  grade: number | string | null;
  type: string;
}

interface Submission {
  id: string;
  lesson_id: string;
  student_id: string;
  grade: string | null;
  [key: string]: unknown;
}

type FilterStatus = 'all' | 'pending' | 'submitted' | 'graded';

export function CourseActivitiesTab({ courseId }: CourseActivitiesTabProps) {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchActivities() {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch subjects
      const { data: subjects } = await supabase.from('lms_subjects').select('id').eq('course_id', courseId);
      if (!subjects || subjects.length === 0) return;
      const subjectIds = subjects.map(s => s.id);

      // 2. Fetch modules
      const { data: modules } = await supabase.from('lms_modules').select('id, title').in('subject_id', subjectIds);
      if (!modules || modules.length === 0) return;
      const moduleIds = modules.map(m => m.id);
      
      const moduleMap = modules.reduce((acc, curr) => {
        acc[curr.id] = curr.title;
        return acc;
      }, {} as Record<string, string>);

      // 3. Fetch lessons of type assignment
      const { data: assignments, error: lessonsError } = await supabase
        .from('lms_lessons')
        .select('*')
        .in('module_id', moduleIds)
        .eq('type', 'assignment');

      if (lessonsError) throw lessonsError;

      // 4. Fetch submissions for this student
      const lessonIds = (assignments || []).map(a => a.id);
      let submissions: Submission[] = [];
      
      if (lessonIds.length > 0) {
        const { data: subs } = await supabase
          .from('lms_lesson_submissions')
          .select('*')
          .eq('student_id', user.id)
          .in('lesson_id', lessonIds);
        submissions = subs || [];
      }

      const mappedActivities = (assignments || []).map(assignment => {
        const submission = submissions.find(s => s.lesson_id === assignment.id);
        
        let status = 'pending';
        let grade = null;
        
        if (submission) {
          if (submission.grade) {
            status = 'graded';
            grade = submission.grade;
          } else {
            status = 'submitted';
          }
        }
        
        // assignment.metadata or settings might contain dueDate
        const dueDate = assignment.settings?.dueDate || null; 

        return {
          id: assignment.id,
          title: assignment.title,
          module: moduleMap[assignment.module_id] || 'Módulo General',
          dueDate: dueDate || new Date(Date.now() + 86400000 * 7).toISOString(), // Mock next week if no date
          status,
          grade,
          type: 'assignment'
        };
      });

      setActivities(mappedActivities);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  }
  
  const handleFetchActivities = () => {
    fetchActivities();
  };
  
  handleFetchActivities();
  }, [courseId, user]);

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.status === filter);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-gray-150 dark:border-white/10 shadow-sm relative z-10 min-h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-gray-150 dark:border-white/10 shadow-sm relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Actividades</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Gestiona tus tareas y entregables del curso.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${filter === 'all' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-gray-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Todas
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${filter === 'pending' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-gray-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Pendientes
          </button>
          <button 
            onClick={() => setFilter('submitted')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${filter === 'submitted' ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-gray-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Enviadas
          </button>
          <button 
            onClick={() => setFilter('graded')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${filter === 'graded' ? 'bg-green-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-gray-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Calificadas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
            <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 font-medium">No hay actividades en esta categoría.</p>
          </div>
        ) : (
          filteredActivities.map(activity => (
            <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl mt-1 ${
                  activity.status === 'pending' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30' :
                  activity.status === 'submitted' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' :
                  'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30'
                }`}>
                  {activity.status === 'pending' ? <Clock size={20} /> :
                   activity.status === 'submitted' ? <FileText size={20} /> :
                   <CheckCircle size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {activity.module}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-gray-100 text-lg group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {activity.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                    <Clock size={14} /> 
                    Vence: {new Date(activity.dueDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:items-end gap-2 border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100 dark:border-white/5">
                {activity.status === 'graded' ? (
                  <div className="text-center sm:text-right">
                    <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">{activity.grade}/100</span>
                    <span className="text-xs font-bold text-gray-400 uppercase">Calificación</span>
                  </div>
                ) : activity.status === 'pending' ? (
                  <button 
                    onClick={() => { setSelectedActivity(activity); setIsModalOpen(true); }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText size={16} /> Entregar
                  </button>
                ) : (
                  <button 
                    onClick={() => { setSelectedActivity(activity); setIsModalOpen(true); }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye size={16} /> Ver Entrega
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <ActivityDetailModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedActivity(null); }}
        activity={selectedActivity}
        courseId={courseId}
        onSuccess={() => {
          // Refresh list to update status
          setIsModalOpen(false);
          // fetchActivities relies on useEffect, but since we didn't export it, 
          // a quick hack is to let the user see the change, or we could trigger a reload.
          // For now, we update the local state optimistically or reload.
          window.location.reload(); 
        }}
      />
    </div>
  );
}
