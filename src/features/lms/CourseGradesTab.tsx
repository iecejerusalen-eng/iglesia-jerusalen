import { useState, useEffect } from 'react';
import { Award, FileCheck, MessageSquare, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';

interface CourseGradesTabProps {
  courseId: string;
}

interface GradeItem {
  id: string;
  name: string;
  date: string;
  grade: number;
  max: number;
}

interface Category {
  id: string;
  name: string;
  weight: number;
  grade: number;
  icon: React.ReactNode;
  items: GradeItem[];
}

export function CourseGradesTab({ courseId }: CourseGradesTabProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [overallGrade, setOverallGrade] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function fetchGrades() {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch subjects & modules & lessons
      const { data: subjects } = await supabase.from('lms_subjects').select('id').eq('course_id', courseId);
      if (!subjects || subjects.length === 0) return;
      const subjectIds = subjects.map(s => s.id);

      const { data: modules } = await supabase.from('lms_modules').select('id, title').in('subject_id', subjectIds);
      if (!modules || modules.length === 0) return;
      const moduleIds = modules.map(m => m.id);

      const { data: lessons, error: lessonsError } = await supabase
        .from('lms_lessons')
        .select('*')
        .in('module_id', moduleIds);

      if (lessonsError) throw lessonsError;

      const assignmentLessons = lessons?.filter(l => l.type === 'assignment') || [];
      const quizLessons = lessons?.filter(l => l.type === 'quiz') || [];
      const forumLessons = lessons?.filter(l => l.type === 'forum') || [];

      // 2. Fetch grades data
      const [subsRes, quizRes, forumRes] = await Promise.all([
        supabase.from('lms_lesson_submissions').select('*').eq('student_id', user.id).in('lesson_id', assignmentLessons.map(a => a.id)),
        supabase.from('lms_lesson_quiz_grades').select('*').eq('student_id', user.id).in('lesson_id', quizLessons.map(q => q.id)),
        supabase.from('lms_lesson_forum_posts').select('lesson_id').eq('user_id', user.id).in('lesson_id', forumLessons.map(f => f.id))
      ]);

      const submissions = subsRes.data || [];
      const quizzes = quizRes.data || [];
      const forumPosts = forumRes.data || [];

      // Process Assignments (40%)
      const assignmentItems = assignmentLessons.map(a => {
        const sub = submissions.find(s => s.lesson_id === a.id);
        const gradeValue = sub?.grade ? parseInt(sub.grade, 10) : 0;
        return {
          id: a.id,
          name: a.title,
          date: sub?.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pendiente',
          grade: gradeValue,
          max: 100
        };
      });
      const assignmentAvg = assignmentItems.length > 0 
        ? Math.round(assignmentItems.reduce((acc, curr) => acc + curr.grade, 0) / assignmentItems.length) 
        : 0;

      // Process Quizzes (30%)
      const quizItems = quizLessons.map(q => {
        const qg = quizzes.find(s => s.lesson_id === q.id);
        const gradeValue = qg?.score ? (qg.score / qg.max_score) * 100 : 0; // Scale to 100
        return {
          id: q.id,
          name: q.title,
          date: qg?.completed_at ? new Date(qg.completed_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pendiente',
          grade: Math.round(gradeValue),
          max: 100
        };
      });
      const quizAvg = quizItems.length > 0 
        ? Math.round(quizItems.reduce((acc, curr) => acc + curr.grade, 0) / quizItems.length) 
        : 0;

      // Process Forums (30%)
      // If student posted at least once in the forum lesson, they get 100, else 0
      const forumItems = forumLessons.map(f => {
        const posted = forumPosts.some(p => p.lesson_id === f.id);
        return {
          id: f.id,
          name: f.title,
          date: posted ? 'Participó' : 'Pendiente',
          grade: posted ? 100 : 0,
          max: 100
        };
      });
      const forumAvg = forumItems.length > 0 
        ? Math.round(forumItems.reduce((acc, curr) => acc + curr.grade, 0) / forumItems.length) 
        : 0;

      // Overall formula
      const overall = Math.round((assignmentAvg * 0.40) + (quizAvg * 0.30) + (forumAvg * 0.30));
      setOverallGrade(overall);

      setCategories([
        {
          id: 'assignments',
          name: 'Tareas y Entregables',
          weight: 40,
          grade: assignmentAvg,
          icon: <FileCheck size={18} className="text-emerald-500" />,
          items: assignmentItems
        },
        {
          id: 'quizzes',
          name: 'Cuestionarios',
          weight: 30,
          grade: quizAvg,
          icon: <BookOpen size={18} className="text-purple-500" />,
          items: quizItems
        },
        {
          id: 'forums',
          name: 'Foros de Debate',
          weight: 30,
          grade: forumAvg,
          icon: <MessageSquare size={18} className="text-blue-500" />,
          items: forumItems
        }
      ]);
    } catch (err) {
      console.error('Error fetching grades:', err);
    } finally {
      setLoading(false);
    }
  }
  fetchGrades();
  }, [courseId, user]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-gray-150 dark:border-white/10 shadow-sm relative z-10 min-h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-gray-150 dark:border-white/10 shadow-sm relative z-10">
      <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
              <Award size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Calificaciones</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Resumen de tu rendimiento académico en este curso.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-gray-150 dark:border-white/5 min-w-[200px]">
          <CircularProgress 
            percentage={overallGrade} 
            size={100} 
            strokeWidth={8} 
            color={overallGrade >= 70 ? "#10B981" : "#F59E0B"}
          />
          <h3 className="mt-4 font-bold text-slate-800 dark:text-white">Promedio General</h3>
          <p className="text-sm text-gray-500">
            {overallGrade}/100 Puntos
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-gray-200 mb-4">Desglose de Calificaciones</h3>
        
        {categories.map((category) => (
          <div key={category.id} className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            {/* Category Header */}
            <div className="p-4 md:p-5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                  {category.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-gray-100 text-base">{category.name}</h4>
                  <p className="text-xs text-gray-500 font-medium">Ponderación: {category.weight}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="block text-sm font-bold text-slate-800 dark:text-white">{category.grade}/100</span>
                  <span className="block text-[10px] text-gray-400 uppercase tracking-wider">Promedio</span>
                </div>
              </div>
            </div>
            
            {/* Category Items */}
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {category.items.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <div className="flex-1">
                    <h5 className="font-semibold text-sm text-slate-700 dark:text-gray-300">{item.name}</h5>
                    <p className="text-xs text-gray-400 mt-1">Calificado el {item.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`font-bold text-sm ${item.grade >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500 dark:text-orange-400'}`}>
                        {item.grade}
                      </span>
                      <span className="text-xs text-gray-400">/{item.max}</span>
                    </div>
                    <button className="text-gray-400 hover:text-gold transition-colors">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
