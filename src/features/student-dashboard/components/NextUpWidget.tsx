import { Clock, ArrowRight, PlayCircle, FileText, CheckSquare, FileEdit } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NextUpWidgetProps {
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  type: 'video' | 'pdf' | 'quiz' | 'assignment';
  timeEstimate?: number;
}

export function NextUpWidget({ courseId, courseTitle, lessonTitle, type, timeEstimate }: NextUpWidgetProps) {
  const TypeIcon = {
    video: PlayCircle,
    pdf: FileText,
    quiz: CheckSquare,
    assignment: FileEdit
  }[type] || PlayCircle;

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700 ease-out pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">Continuar estudiando</span>
        {timeEstimate && (
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock size={12} /> {timeEstimate} min
          </span>
        )}
      </div>

      <h4 className="font-serif font-bold text-lg text-slate-800 dark:text-white leading-tight mb-1">{lessonTitle}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{courseTitle}</p>

      <Link 
        to={`/lms/course/${courseId}`}
        className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group/link"
      >
        <TypeIcon size={18} className="group-hover/link:scale-110 transition-transform" />
        Reanudar Lección
        <ArrowRight size={14} className="ml-auto opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
      </Link>
    </div>
  );
}
