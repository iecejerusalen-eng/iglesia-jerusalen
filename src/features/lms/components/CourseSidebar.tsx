import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, FileText, HelpCircle, MessageSquare, PlayCircle } from 'lucide-react';

interface CourseModuleItem {
  id: string;
  title: string;
  is_hidden?: boolean;
}

interface CourseLessonItem {
  id: string;
  module_id: string;
  title: string;
  type: string;
  order_index: number;
}

interface CourseSidebarProps<TLesson extends CourseLessonItem> {
  modules: CourseModuleItem[];
  lessons: TLesson[];
  completions: Record<string, boolean>;
  activeLesson: TLesson | null;
  onSelectLesson: (lesson: TLesson) => void;
  userRoles: string[];
}

const LESSON_ICONS: Record<string, typeof FileText> = {
  video: PlayCircle,
  video_link: PlayCircle,
  quiz: HelpCircle,
  forum: MessageSquare,
};

export function CourseSidebar<TLesson extends CourseLessonItem>({ modules, lessons, completions, activeLesson, onSelectLesson, userRoles }: CourseSidebarProps<TLesson>) {
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const canSeeHidden = userRoles.some((role) => ['admin', 'maestro', 'docente', 'teacher'].includes(role));
  const visibleModules = useMemo(() => modules.filter((module) => canSeeHidden || !module.is_hidden), [canSeeHidden, modules]);
  const completedLessons = Object.values(completions).filter(Boolean).length;
  const progress = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;

  const toggleModule = (moduleId: string) => {
    setCollapsedModules((current) => ({ ...current, [moduleId]: !current[moduleId] }));
  };

  return (
    <aside className="hide-scrollbar h-full w-full shrink-0 overflow-y-auto border-r border-slate-200 bg-white dark:border-white/5 dark:bg-slate-950 lg:w-72 xl:w-80" aria-label="Contenido del curso">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 p-4 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/95 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Ruta de aprendizaje</p>
            <h2 className="mt-1 font-serif text-lg font-bold text-slate-900 dark:text-white">Contenido del curso</h2>
          </div>
          <span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-black text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{progress}%</span>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{completedLessons} de {lessons.length} lecciones completadas</p>
      </div>

      <div className="space-y-2 p-3 sm:p-4">
        {visibleModules.map((module, index) => {
          const moduleLessons = lessons
            .filter((lesson) => lesson.module_id === module.id)
            .sort((a, b) => a.order_index - b.order_index);
          const isExpanded = !collapsedModules[module.id];
          const moduleCompleted = moduleLessons.filter((lesson) => completions[lesson.id]).length;
          const moduleProgress = moduleLessons.length > 0 ? Math.round((moduleCompleted / moduleLessons.length) * 100) : 0;

          return (
            <section key={module.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-white/5 dark:bg-white/[0.035]">
              <button type="button" onClick={() => toggleModule(module.id)} className="flex min-h-14 w-full items-center gap-3 p-3.5 text-left transition hover:bg-slate-100 dark:hover:bg-white/5" aria-expanded={isExpanded}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300">{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-bold leading-tight text-slate-900 dark:text-white">{module.title}</span>
                  <span className="mt-1 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    {moduleCompleted}/{moduleLessons.length} completadas
                    <span className="h-1 w-1 rounded-full bg-slate-300" />{moduleProgress}%
                  </span>
                </span>
                <ChevronDown size={17} className={`shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="space-y-1 border-t border-slate-200/80 p-2 dark:border-white/5">
                      {moduleLessons.map((lesson, lessonIndex) => {
                        const isCompleted = Boolean(completions[lesson.id]);
                        const isActive = activeLesson?.id === lesson.id;
                        const Icon = LESSON_ICONS[lesson.type] ?? FileText;
                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => onSelectLesson(lesson)}
                            aria-current={isActive ? 'step' : undefined}
                            className={`flex min-h-12 w-full items-start gap-3 rounded-xl p-3 text-left text-sm transition ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' : 'text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-white/5'}`}
                          >
                            <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-white/15' : isCompleted ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                              {isCompleted ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={`block text-[9px] font-extrabold uppercase tracking-wider ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>Lección {lessonIndex + 1}</span>
                              <span className="mt-0.5 line-clamp-2 block font-semibold leading-snug">{lesson.title}</span>
                            </span>
                          </button>
                        );
                      })}
                      {moduleLessons.length === 0 && <p className="py-4 text-center text-xs font-medium text-slate-400">Este módulo aún no tiene lecciones.</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          );
        })}
      </div>
    </aside>
  );
}
