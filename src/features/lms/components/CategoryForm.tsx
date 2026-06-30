import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useCategories, type CategoryItem } from '../hooks/useCategories';

interface CategoryFormProps {
  editingCategory: Partial<CategoryItem> | null;
  onClose: () => void;
}

export function CategoryForm({ editingCategory: initialCategory, onClose }: CategoryFormProps) {
  const { createCategory, updateCategory } = useCategories();
  
  const [editingCategory, setEditingCategory] = useState<Partial<CategoryItem>>(
    initialCategory || { name: '', description: '' }
  );

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;
    
    const payload = {
      name: editingCategory.name,
      description: editingCategory.description || ''
    };

    if (editingCategory.id) {
      await updateCategory.mutateAsync({ id: editingCategory.id, payload });
    } else {
      await createCategory.mutateAsync(payload);
    }
    onClose();
  };

  const isSaving = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-left animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-150 dark:border-white/10">
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
            {editingCategory.id ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full cursor-pointer">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Nombre *</label>
            <input
              type="text"
              required
              value={editingCategory.name || ''}
              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs text-gray-900 dark:text-gray-100"
              placeholder="Ej. Escuela Dominical"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Descripción</label>
            <textarea
              rows={3}
              value={editingCategory.description || ''}
              onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs text-gray-900 dark:text-gray-100"
              placeholder="Describe la categoría..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-150 dark:border-white/10 bg-gray-50 dark:bg-slate-950/20 p-4 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-350 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all font-medium text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-gold hover:bg-yellow-600 text-white rounded-lg transition-all font-medium text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save size={16} />
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
