import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, FileText, GraduationCap } from 'lucide-react';
import type { ProgramLesson } from '../../../types';
import BlockEditor from '../../../components/admin/BlockEditor';
import { useLessons } from '../hooks/useLessons';
import { useModules } from '../hooks/useModules';

const lessonSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
});
type LessonFormData = z.infer<typeof lessonSchema>;

interface LessonFormProps {
  programId: string;
  moduleId: string | null;
  editingLesson: ProgramLesson | null;
  lessonsCount: number;
  readOnly?: boolean;
  onClose: () => void;
}

export function LessonForm({ programId, moduleId, editingLesson, lessonsCount, readOnly, onClose }: LessonFormProps) {
  const { createLesson, updateLesson } = useLessons(programId);
  const { modules } = useModules(programId);

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(moduleId);
  const [publicContent, setPublicContent] = useState(editingLesson?.public_content || '');
  const [teacherContent, setTeacherContent] = useState(editingLesson?.teacher_content || '');

  const lessonForm = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: editingLesson?.title || '',
    },
  });

  const onSubmit = async (data: LessonFormData) => {
    const payload = {
      program_id: programId,
      module_id: selectedModuleId || null,
      title: data.title,
      public_content: publicContent,
      teacher_content: teacherContent,
      order: editingLesson && editingLesson.module_id === selectedModuleId ? editingLesson.order : lessonsCount,
    };

    if (editingLesson) {
      await updateLesson.mutateAsync({ id: editingLesson.id, payload });
    } else {
      await createLesson.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-150 dark:border-white/10 my-4">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-white/5">
          <h2 className="text-base font-serif font-bold text-gray-800 dark:text-gray-100">
            {editingLesson ? 'Editar Lección' : 'Nueva Lección'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 dark:text-gray-450 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={lessonForm.handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lesson-title" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Título de la Lección *</label>
              <input id="lesson-title" {...lessonForm.register('title')} className="w-full bg-white dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-800 dark:text-gray-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none" placeholder="Ej: Lección 1 - Dios en la Creación" />
              {lessonForm.formState.errors.title && <p className="text-red-500 text-xxs mt-1">{lessonForm.formState.errors.title.message}</p>}
            </div>
            <div>
              <label htmlFor="lesson-module" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Vincular a Módulo / Volumen</label>
              <select
                id="lesson-module"
                value={selectedModuleId || ''}
                onChange={(e) => setSelectedModuleId(e.target.value || null)}
                className="w-full border border-gray-305 dark:border-white/10 bg-white dark:bg-slate-900 text-gray-850 dark:text-gray-100 rounded-lg px-3 py-2 text-xs focus:border-indigo-400 outline-none"
              >
                <option value="">Lección General (Sin Módulo)</option>
                {modules.map(mod => (
                  <option key={mod.id} value={mod.id}>{mod.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-750 dark:text-gray-300 mb-1.5 flex items-center gap-1">
              <FileText size={13} className="text-indigo-500 dark:text-indigo-400" />
              📖 Contenido Público (para Estudiantes)
            </label>
            <BlockEditor content={publicContent} onChange={setPublicContent} disabled={readOnly} />
          </div>

          <div className="bg-purple-50/40 dark:bg-purple-950/10 border border-purple-150 dark:border-purple-900/30 rounded-xl p-4 space-y-2">
            <label className="block text-xs font-semibold text-purple-800 dark:text-purple-400 flex items-center gap-1">
              <GraduationCap size={14} className="text-purple-600" />
              🎓 Guía del Maestro (Acceso Restringido)
            </label>
            <p className="text-xxs text-purple-600 dark:text-purple-450 font-light">Este material solo se mostrará a los roles autorizados (Maestro, Pastor, Admin).</p>
            <BlockEditor content={teacherContent} onChange={setTeacherContent} disabled={readOnly} />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-white/5">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-450 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer">Cancelar</button>
            <button type="submit" disabled={createLesson.isPending || updateLesson.isPending} className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer shadow-sm">
              {editingLesson ? 'Actualizar Lección' : 'Crear Lección'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
