import { Edit2, Trash2, Plus, Check, Loader2, X } from 'lucide-react';
import type { StoreCategory } from '../types';

interface CategoryManagerProps {
  categories: StoreCategory[];
  onOpenCreate: (cat?: StoreCategory) => void;
  onDelete: (id: string) => void;
  showModal: boolean;
  onCloseModal: () => void;
  editingCategory: Partial<StoreCategory> | null;
  onCategoryChange: (cat: Partial<StoreCategory>) => void;
  onSave: (e: React.FormEvent) => void;
  saving: boolean;
}

const CategoryManager = ({
  categories,
  onOpenCreate,
  onDelete,
  showModal,
  onCloseModal,
  editingCategory,
  onCategoryChange,
  onSave,
  saving
}: CategoryManagerProps) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-white/10">
        <span className="text-xs font-semibold text-gray-500">Gestión de categorías dinámicas de la tienda</span>
        <button
          onClick={() => onOpenCreate()}
          className="bg-primary text-white hover:bg-blue-900 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
        >
          <Plus size={14} />
          Nueva Categoría
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-150 dark:border-white/10">
                <th className="py-4 px-6">Nombre de Categoría</th>
                <th className="py-4 px-6">Descripción</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium text-gray-700 dark:text-gray-300">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-bold">{cat.name}</td>
                  <td className="py-4 px-6 text-gray-550">{cat.description || 'Sin descripción'}</td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button onClick={() => onOpenCreate(cat)} className="text-gray-400 hover:text-primary cursor-pointer">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => onDelete(cat.id)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Categoría */}
      {showModal && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-150 dark:border-white/10 animate-scale-in text-xs font-medium">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-serif font-bold text-gray-800 dark:text-white text-base">
                {editingCategory.id ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button onClick={onCloseModal} className="text-gray-400 p-1">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={onSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) => onCategoryChange({ ...editingCategory, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                  placeholder="Ej. Biblias de Estudio"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Descripción (Opcional)</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) => onCategoryChange({ ...editingCategory, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                  placeholder="Descripción breve..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150 dark:border-white/5">
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="px-4 py-2 border border-gray-250 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-blue-900 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
