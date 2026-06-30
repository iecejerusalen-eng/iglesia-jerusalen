import { Edit, Trash2 } from 'lucide-react';
import { useCategories, type CategoryItem } from '../hooks/useCategories';
import { useConfirmStore } from '../../../store/useConfirmStore';

interface CategoriesListProps {
  onEditCategory: (category: CategoryItem) => void;
}

export function CategoriesList({ onEditCategory }: CategoriesListProps) {
  const { categories, deleteCategory } = useCategories();
  const confirm = useConfirmStore((state) => state.confirm);

  const handleDeleteCategory = async (id: string) => {
    const confirmed = await confirm({
      title: 'Eliminar categoría',
      message: '¿Estás seguro de eliminar esta categoría? Los cursos asociados se mantendrán sin categoría.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    await deleteCategory.mutateAsync(id);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-white/10">
              <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Nombre</th>
              <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Descripción</th>
              <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500">No hay categorías configuradas.</td>
              </tr>
            ) : (
              categories.map(cat => (
                <tr key={cat.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-bold text-sm text-gray-900 dark:text-white">{cat.name}</td>
                  <td className="p-4 text-xs text-gray-600 dark:text-gray-400">{cat.description || 'Sin descripción'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onEditCategory(cat)} className="p-2 text-gray-400 hover:text-gold rounded-lg cursor-pointer"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
