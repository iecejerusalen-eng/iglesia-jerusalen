import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Search } from 'lucide-react';
import type { Program } from '../../../types';
import MediaUploader from '../../../components/common/MediaUploader';
import MediaSearchModal from '../../../components/admin/MediaSearchModal';
import { usePrograms } from '../hooks/usePrograms';

const programSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
});
type ProgramFormData = z.infer<typeof programSchema>;

interface ProgramFormProps {
  editingProgram: Program | null;
  onClose: () => void;
}

export function ProgramForm({ editingProgram, onClose }: ProgramFormProps) {
  const { createProgram, updateProgram } = usePrograms();
  const [coverImage, setCoverImage] = useState(editingProgram?.cover_image || '');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const programForm = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      title: editingProgram?.title || '',
      description: editingProgram?.description || '',
    },
  });

  const onSubmit = async (data: ProgramFormData) => {
    const payload = { title: data.title, description: data.description || null, cover_image: coverImage || null };
    
    if (editingProgram) {
      await updateProgram.mutateAsync({ id: editingProgram.id, payload });
    } else {
      await createProgram.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose}></div>
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-150 dark:border-white/10">
          <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-white/5">
            <h2 className="text-base font-serif font-bold text-gray-800 dark:text-gray-100">
              {editingProgram ? 'Editar Programa' : 'Nuevo Programa'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 dark:text-gray-450 cursor-pointer">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={programForm.handleSubmit(onSubmit)} className="p-5 space-y-4">
            <div>
              <label htmlFor="program-title" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Título *</label>
              <input id="program-title" {...programForm.register('title')} className="w-full bg-white dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-800 dark:text-gray-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none" placeholder="Ej: Escuela de Liderazgo" />
              {programForm.formState.errors.title && <p className="text-red-500 text-xxs mt-1">{programForm.formState.errors.title.message}</p>}
            </div>
            <div>
              <label htmlFor="program-description" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
              <textarea id="program-description" {...programForm.register('description')} rows={3} className="w-full bg-white dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-800 dark:text-gray-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none resize-none" placeholder="Descripción corta del programa..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Imagen de Portada</label>
              {coverImage ? (
                <div className="relative inline-block w-full">
                  <img loading="lazy" src={coverImage} alt="" className="w-full h-36 object-cover rounded-xl border border-gray-200 dark:border-white/10" />
                  <button type="button" onClick={() => setCoverImage('')} className="absolute top-2 right-2 bg-red-505 text-white p-1 rounded-full cursor-pointer shadow-sm"><X size={12} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <MediaUploader folder="programas" onUploadSuccess={(url: string) => setCoverImage(url)} />
                  <span className="text-xxs text-gray-400">o</span>
                  <div className="flex-1 flex gap-1.5">
                    <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="Pegar URL de imagen" className="flex-grow bg-white dark:bg-slate-800 border border-gray-305 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-800 dark:text-gray-100 focus:border-indigo-400 outline-none" />
                    <button
                      type="button"
                      onClick={() => setIsMediaModalOpen(true)}
                      className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-400 cursor-pointer flex items-center justify-center shrink-0 border border-gray-250 dark:border-white/10"
                      title="Buscar en internet"
                    >
                      <Search size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-white/5">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-450 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer">Cancelar</button>
              <button type="submit" disabled={createProgram.isPending || updateProgram.isPending} className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer shadow-sm">
                {editingProgram ? 'Actualizar' : 'Crear Programa'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <MediaSearchModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(url) => setCoverImage(url)}
        allowedTypes={['image']}
        title="Buscar Imagen de Portada"
      />
    </>
  );
}
