import { ArrowUp, ArrowDown, Edit3, Trash2, Plus, FolderOpen, ChevronRight } from 'lucide-react';
import type { Program, ProgramModule, ProgramLesson } from '../../../types';
import { useModules } from '../hooks/useModules';
import { useLessons } from '../hooks/useLessons';
import { useConfirmStore } from '../../../store/useConfirmStore';

interface ModulesListProps {
  selectedProgram: Program | null;
  readOnly?: boolean;
  onCreateModule: () => void;
  onEditModule: (module: ProgramModule) => void;
  onCreateLesson: (moduleId: string | null) => void;
  onEditLesson: (lesson: ProgramLesson) => void;
}

export function ModulesList({
  selectedProgram,
  readOnly,
  onCreateModule,
  onEditModule,
  onCreateLesson,
  onEditLesson
}: ModulesListProps) {
  const confirm = useConfirmStore((state) => state.confirm);
  const programId = selectedProgram?.id || null;
  
  const { modules, deleteModule, updateModuleOrders } = useModules(programId);
  const { lessons, deleteLesson, updateLessonOrders } = useLessons(programId);

  const handleDeleteModule = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar módulo',
      message: '¿Eliminar este volumen/módulo?\\n\\nLas lecciones vinculadas se mantendrán pero quedarán sin módulo asignado.',
      confirmText: 'Eliminar módulo',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    await deleteModule.mutateAsync(id);
  };

  const handleMoveModule = async (index: number, direction: 'up' | 'down') => {
    const newModules = [...modules];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newModules.length) return;

    const tempOrder = newModules[index].order;
    newModules[index].order = newModules[swapIndex].order;
    newModules[swapIndex].order = tempOrder;

    await updateModuleOrders.mutateAsync([
      { id: newModules[index].id, order: newModules[index].order },
      { id: newModules[swapIndex].id, order: newModules[swapIndex].order }
    ]);
  };

  const handleDeleteLesson = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar lección',
      message: '¿Estás seguro de que deseas eliminar esta lección?',
      confirmText: 'Eliminar lección',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    await deleteLesson.mutateAsync(id);
  };

  const handleMoveLesson = async (lessonId: string, direction: 'up' | 'down', moduleId: string | null) => {
    const groupLessons = lessons.filter(l => l.module_id === moduleId);
    const index = groupLessons.findIndex(l => l.id === lessonId);
    if (index === -1) return;
    
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= groupLessons.length) return;

    const currentLesson = groupLessons[index];
    const swapLesson = groupLessons[swapIndex];
    
    await updateLessonOrders.mutateAsync([
      { id: currentLesson.id, order: swapLesson.order },
      { id: swapLesson.id, order: currentLesson.order }
    ]);
  };

  if (!selectedProgram) {
    return (
      <div className="text-center py-24 text-gray-400 border-2 border-dashed border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-2xl flex flex-col items-center justify-center p-6 shadow-xxs">
        <ChevronRight size={36} className="mb-2 opacity-20 rotate-90 lg:rotate-0" />
        <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">Ningún Programa Seleccionado</p>
        <p className="text-xs text-gray-450 mt-1 max-w-xs leading-normal">Elige un estudio de la columna izquierda para estructurar sus volúmenes y contenidos.</p>
      </div>
    );
  }

  const standaloneLessons = lessons.filter(l => !l.module_id);

  if (modules.length === 0 && standaloneLessons.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl shadow-xxs">
        <FolderOpen size={40} className="mx-auto mb-2 opacity-25" />
        <p className="text-xs font-medium">Este programa de estudio no contiene módulos ni lecciones aún</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Usa los botones superiores para organizar la estructura.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Program Workspace Header */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-4 md:p-5 shadow-xxs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-bold text-indigo-600 dark:text-church-gold-bright uppercase tracking-widest">Estudio Seleccionado</span>
          <h2 className="text-base font-serif font-bold text-gray-850 dark:text-gray-100 truncate mt-0.5">{selectedProgram.title}</h2>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button onClick={onCreateModule}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 hover:text-indigo-600 hover:border-indigo-300 rounded-xl transition-all cursor-pointer text-xs font-semibold shadow-xxs">
              <Plus size={14} /> Nuevo Módulo
            </button>
            <button onClick={() => onCreateLesson(null)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer text-xs font-semibold shadow-xxs">
              <Plus size={14} /> Nueva Lección General
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {modules.map((module, modIndex) => {
        const moduleLessons = lessons.filter(l => l.module_id === module.id);
        return (
          <div key={module.id} className="bg-slate-50/50 dark:bg-slate-900/50 border border-gray-150 dark:border-white/10 rounded-2xl p-4 shadow-xxs space-y-3">
            <div className="flex items-start justify-between bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-3.5 shadow-xxs">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/50">
                    Módulo {modIndex + 1}
                  </span>
                  <span className="text-[10px] text-gray-405 dark:text-gray-400">({moduleLessons.length} lecciones)</span>
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mt-1">{module.title}</h3>
                {module.description && <p className="text-xxs text-gray-405 dark:text-gray-400 font-light mt-0.5 leading-normal">{module.description}</p>}
              </div>

              {!readOnly && (
                <div className="flex items-center gap-1">
                  <button onClick={() => handleMoveModule(modIndex, 'up')} disabled={modIndex === 0}
                    className="p-1 rounded-lg hover:bg-slate-105 dark:hover:bg-slate-800 text-gray-400 disabled:opacity-20 cursor-pointer transition-colors"><ArrowUp size={13} /></button>
                  <button onClick={() => handleMoveModule(modIndex, 'down')} disabled={modIndex === modules.length - 1}
                    className="p-1 rounded-lg hover:bg-slate-105 dark:hover:bg-slate-800 text-gray-400 disabled:opacity-20 cursor-pointer transition-colors"><ArrowDown size={13} /></button>
                  <button onClick={() => onEditModule(module)}
                    className="p-1 rounded-lg hover:bg-indigo-55 dark:hover:bg-indigo-950/30 text-gray-450 dark:text-gray-400 hover:text-indigo-650 cursor-pointer transition-colors"><Edit3 size={13} /></button>
                  <button onClick={() => handleDeleteModule(module.id)}
                    className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-455 dark:text-gray-400 hover:text-red-650 cursor-pointer transition-colors"><Trash2 size={13} /></button>
                  <button onClick={() => onCreateLesson(module.id)}
                    className="ml-1 flex items-center gap-0.5 px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-105 dark:hover:bg-indigo-955/60 hover:text-indigo-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer">
                    <Plus size={10} /> Lección
                  </button>
                </div>
              )}
            </div>

            <div className="pl-4 md:pl-6 space-y-2">
              {moduleLessons.length === 0 ? (
                <div className="text-center py-4 bg-white/60 dark:bg-slate-950/30 border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                  <p className="text-xxs text-gray-450 dark:text-gray-400 italic">Sin lecciones vinculadas a este módulo.</p>
                </div>
              ) : (
                moduleLessons.map((lesson, index) => (
                  <div key={lesson.id} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-xl p-3 flex items-center justify-between hover:border-indigo-150 transition-colors shadow-xxs">
                    <div className="flex items-center gap-2.5 min-w-0 pr-4">
                      <span className="w-5 h-5 flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-indigo-650 dark:text-indigo-400 rounded-md text-[10px] font-bold">{index + 1}</span>
                      <span className="font-medium text-gray-750 dark:text-gray-200 text-xs truncate">{lesson.title}</span>
                      {lesson.teacher_content && (
                        <span className="text-[9px] bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/55 text-purple-700 dark:text-purple-400 font-bold px-1 py-0 rounded-md shrink-0">+ Guía Maestro</span>
                      )}
                    </div>
                    {!readOnly && (
                      <div className="flex gap-0.5">
                        <button onClick={() => handleMoveLesson(lesson.id, 'up', module.id)} disabled={index === 0}
                          className="p-1 rounded hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-400 disabled:opacity-20 cursor-pointer"><ArrowUp size={12} /></button>
                        <button onClick={() => handleMoveLesson(lesson.id, 'down', module.id)} disabled={index === moduleLessons.length - 1}
                          className="p-1 rounded hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-400 disabled:opacity-20 cursor-pointer"><ArrowDown size={12} /></button>
                        <button onClick={() => onEditLesson(lesson)}
                          className="p-1 rounded hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-gray-400 hover:text-indigo-600 cursor-pointer"><Edit3 size={12} /></button>
                        <button onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-450 dark:text-gray-400 hover:text-red-655 cursor-pointer"><Trash2 size={12} /></button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
      </div>

      {standaloneLessons.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-4 shadow-xxs space-y-3">
          <div className="border-b border-gray-100 dark:border-white/5 pb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Lecciones Generales (Sin Módulo)</h3>
          </div>
          <div className="space-y-2">
            {standaloneLessons.map((lesson, index) => (
              <div key={lesson.id} className="bg-slate-50/40 dark:bg-slate-900/40 border border-gray-150 dark:border-white/10 rounded-xl p-3 flex items-center justify-between hover:border-indigo-150 transition-colors shadow-xxs">
                <div className="flex items-center gap-2.5 min-w-0 pr-4">
                  <span className="w-5 h-5 flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-450 rounded-md text-[10px] font-bold">{index + 1}</span>
                  <span className="font-medium text-gray-750 dark:text-gray-200 text-xs truncate">{lesson.title}</span>
                  {lesson.teacher_content && (
                    <span className="text-[9px] bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 text-purple-700 dark:text-purple-400 font-bold px-1 py-0 rounded-md shrink-0">+ Guía Maestro</span>
                  )}
                </div>
                {!readOnly && (
                  <div className="flex gap-0.5">
                    <button onClick={() => handleMoveLesson(lesson.id, 'up', null)} disabled={index === 0}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 disabled:opacity-20 cursor-pointer"><ArrowUp size={12} /></button>
                    <button onClick={() => handleMoveLesson(lesson.id, 'down', null)} disabled={index === standaloneLessons.length - 1}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 disabled:opacity-20 cursor-pointer"><ArrowDown size={12} /></button>
                    <button onClick={() => onEditLesson(lesson)}
                      className="p-1 rounded hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-gray-400 hover:text-indigo-600 cursor-pointer"><Edit3 size={12} /></button>
                    <button onClick={() => handleDeleteLesson(lesson.id)}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-450 dark:text-gray-400 hover:text-red-650 cursor-pointer"><Trash2 size={12} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
