import { BookOpen, Edit3, Trash2 } from 'lucide-react';
import type { Program } from '../../../types';
import { usePrograms } from '../hooks/usePrograms';
import { useConfirmStore } from '../../../store/useConfirmStore';

interface ProgramsListProps {
  programs: Program[];
  isLoading: boolean;
  selectedProgram: Program | null;
  onSelectProgram: (program: Program) => void;
  onEditProgram: (program: Program) => void;
  readOnly?: boolean;
}

export function ProgramsList({
  programs,
  isLoading,
  selectedProgram,
  onSelectProgram,
  onEditProgram,
  readOnly
}: ProgramsListProps) {
  const { deleteProgram } = usePrograms();
  const confirm = useConfirmStore((state) => state.confirm);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Eliminar programa de estudio',
      message: '¿Estás seguro de que deseas eliminar este programa, todos sus módulos y sus lecciones vinculadas?\\n\\nEsta acción no se puede deshacer.',
      confirmText: 'Eliminar todo',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    await deleteProgram.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-600 dark:border-church-gold-bright"></div>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl text-gray-400">
        <BookOpen size={36} className="mx-auto mb-2 opacity-25" />
        <p className="text-xs font-medium">No hay programas de estudio creados</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {programs.map((p) => (
        <div key={p.id}
          onClick={() => onSelectProgram(p)}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            selectedProgram?.id === p.id
              ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-500/40 ring-1 ring-indigo-200 dark:ring-indigo-500/20 shadow-xxs'
              : 'bg-white dark:bg-slate-900 border-gray-150 dark:border-white/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
          }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {p.cover_image ? (
                <img loading="lazy" src={p.cover_image} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-gray-150 dark:border-white/10 shadow-xxs" />
              ) : (
                <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 rounded-lg flex items-center justify-center flex-shrink-0 border border-indigo-100 dark:border-indigo-900/50">
                  <BookOpen size={18} />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{p.title}</h3>
                {p.description && <p className="text-xxs text-gray-450 line-clamp-2 mt-0.5 font-light leading-normal">{p.description}</p>}
              </div>
            </div>
            {!readOnly && (
              <div className="flex gap-1 flex-shrink-0 ml-2">
                <button onClick={(e) => { e.stopPropagation(); onEditProgram(p); }}
                  className="p-1 rounded-lg hover:bg-indigo-100/50 dark:hover:bg-indigo-950/30 text-gray-400 hover:text-indigo-650 cursor-pointer transition-colors"><Edit3 size={13} /></button>
                <button onClick={(e) => handleDelete(p.id, e)}
                  className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-650 cursor-pointer transition-colors"><Trash2 size={13} /></button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
