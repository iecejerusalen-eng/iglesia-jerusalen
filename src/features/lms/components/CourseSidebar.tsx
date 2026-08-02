import { CheckCircle2, PlayCircle, FileText, HelpCircle, Lock, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface CourseSidebarProps {
  modules: any[];
  lessons: any[];
  completions: Record<string, boolean>;
  activeLesson: any | null;
  onSelectLesson: (lesson: any) => void;
  userRoles: string[];
}

export function CourseSidebar({
  modules,
  lessons,
  completions,
  activeLesson,
  onSelectLesson,
  userRoles
}: CourseSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(
    modules.reduce((acc, m) => ({ ...acc, [m.id]: true }), {})
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const visibleModules = modules.filter(
    (m) => userRoles.includes("admin") || userRoles.includes("maestro") || !m.is_hidden
  );

  return (
    <div className="w-full lg:w-72 xl:w-80 shrink-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-white/5 h-full overflow-y-auto hide-scrollbar sticky top-0">
      <div className="p-4 border-b border-gray-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 backdrop-blur-xl">
        <h3 className="font-bold font-serif text-lg text-slate-900 dark:text-white">Contenido del curso</h3>
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
          {Object.values(completions).filter(Boolean).length} de {lessons.length} completadas
        </p>
      </div>

      <div className="p-3 space-y-2">
        {visibleModules.map((mod, index) => {
          const moduleLessons = lessons.filter(l => l.module_id === mod.id).sort((a, b) => a.order_index - b.order_index);
          const isExpanded = expandedModules[mod.id];
          
          return (
            <div key={mod.id} className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden">
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                    {index + 1}. {mod.title}
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 block">
                    {moduleLessons.filter(l => completions[l.id]).length} / {moduleLessons.length}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown size={18} className="text-slate-400" />
                ) : (
                  <ChevronRight size={18} className="text-slate-400" />
                )}
              </button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-2 pt-0 space-y-1">
                      {moduleLessons.map(lesson => {
                        const isCompleted = completions[lesson.id];
                        const isActive = activeLesson?.id === lesson.id;
                        
                        let Icon = FileText;
                        if (lesson.type === 'video') Icon = PlayCircle;
                        if (lesson.type === 'quiz') Icon = HelpCircle;
                        if (lesson.type === 'forum') Icon = MessageSquare;
                        
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => onSelectLesson(lesson)}
                            className={`w-full text-left flex items-start gap-3 p-3 rounded-lg transition-colors text-sm ${
                              isActive 
                                ? 'bg-gold/10 text-gold font-bold' 
                                : 'hover:bg-gray-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="shrink-0 mt-0.5">
                              {isCompleted ? (
                                <CheckCircle2 size={16} className="text-green-500" />
                              ) : (
                                <Icon size={16} className={isActive ? 'text-gold' : 'text-slate-400'} />
                              )}
                            </div>
                            <span className="line-clamp-2 flex-1">
                              {lesson.title}
                            </span>
                          </button>
                        );
                      })}
                      {moduleLessons.length === 0 && (
                        <p className="text-xs text-center text-slate-500 py-3">No hay lecciones en este módulo</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
