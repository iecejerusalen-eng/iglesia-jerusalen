import { Clock, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { differenceInDays, differenceInHours } from 'date-fns';

interface PendingTask {
  id: string;
  title: string;
  courseTitle: string;
  dueDate: Date;
  status: 'PENDING' | 'SUBMITTED' | 'LATE';
}

interface PendingTasksWidgetProps {
  tasks: PendingTask[];
}

export function PendingTasksWidget({ tasks }: PendingTasksWidgetProps) {
  
  if (!tasks || tasks.length === 0) {
    return null;
  }

  const getUrgencyConfig = (dueDate: Date) => {
    const now = new Date();
    const daysLeft = differenceInDays(dueDate, now);
    const hoursLeft = differenceInHours(dueDate, now);

    if (hoursLeft < 0) {
      return {
        label: 'Atrasada',
        color: 'text-rose-500',
        bg: 'bg-rose-500/10 dark:bg-rose-900/30',
        border: 'border-rose-200 dark:border-rose-900',
        icon: <AlertCircle size={14} className="text-rose-500" />
      };
    }
    
    if (hoursLeft <= 24) {
      return {
        label: `${hoursLeft}h rest.`,
        color: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-100 dark:bg-rose-900/40',
        border: 'border-rose-300 dark:border-rose-700/50',
        icon: <Clock size={14} className="animate-pulse" />
      };
    }
    
    if (daysLeft <= 3) {
      return {
        label: `${daysLeft}d rest.`,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        border: 'border-amber-300 dark:border-amber-700/50',
        icon: <Clock size={14} />
      };
    }
    
    return {
      label: `${daysLeft}d rest.`,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      border: 'border-emerald-200 dark:border-emerald-800/50',
      icon: <CheckCircle size={14} />
    };
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
          <FileText size={20} className="text-gold" />
          Tareas Pendientes
        </h3>
        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3 overflow-y-auto custom-scrollbar flex-grow pr-2">
        {tasks.map(task => {
          const urgency = getUrgencyConfig(task.dueDate);
          return (
            <div 
              key={task.id}
              className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer
                bg-white dark:bg-slate-800/50 ${urgency.border} hover:border-gold/50`}
            >
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-gray-100 group-hover:text-gold transition-colors line-clamp-1">
                  {task.title}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider font-medium">
                  {task.courseTitle}
                </p>
              </div>

              <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-tight ${urgency.bg} ${urgency.color}`}>
                {urgency.icon}
                {urgency.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
