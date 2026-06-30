import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { ProgramModule } from '../../../types';
import { useModules } from '../hooks/useModules';

const moduleSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
});
type ModuleFormData = z.infer<typeof moduleSchema>;

interface ModuleFormProps {
  programId: string;
  editingModule: ProgramModule | null;
  modulesCount: number;
  onClose: () => void;
}

export function ModuleForm({ programId, editingModule, modulesCount, onClose }: ModuleFormProps) {
  const { createModule, updateModule } = useModules(programId);

  const moduleForm = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: editingModule?.title || '',
      description: editingModule?.description || '',
    },
  });

  const onSubmit = async (data: ModuleFormData) => {
    const payload = {
      program_id: programId,
      title: data.title,
      description: data.description || null,
      order: editingModule ? editingModule.order : modulesCount,
    };

    if (editingModule) {
      await updateModule.mutateAsync({ id: editingModule.id, payload });
    } else {
      await createModule.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-150 dark:border-white/10">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-white/5">
          <h2 className="text-base font-serif font-bold text-gray-800 dark:text-gray-100">
            {editingModule ? 'Editar Módulo' : 'Nuevo Módulo / Volumen'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 dark:text-gray-450 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={moduleForm.handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label htmlFor="module-title" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Título del Módulo *</label>
            <input id="module-title" {...moduleForm.register('title')} className="w-full bg-white dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-800 dark:text-gray-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none" placeholder="Ej: Volumen 1: Fundamentos Doctrinarios" />
            {moduleForm.formState.errors.title && <p className="text-red-500 text-xxs mt-1">{moduleForm.formState.errors.title.message}</p>}
          </div>
          <div>
            <label htmlFor="module-description" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
            <textarea id="module-description" {...moduleForm.register('description')} rows={3} className="w-full bg-white dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-800 dark:text-gray-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none resize-none" placeholder="Resumen del contenido de este volumen..." />
          </div>
          <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-white/5">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-455 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer">Cancelar</button>
            <button type="submit" disabled={createModule.isPending || updateModule.isPending} className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer shadow-sm">
              {editingModule ? 'Actualizar' : 'Crear Módulo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
