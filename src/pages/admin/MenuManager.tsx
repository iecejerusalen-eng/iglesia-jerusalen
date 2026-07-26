import { useEffect, useState, useMemo } from 'react';
import { useMenuStore } from '../../store/useMenuStore';
import type { MenuItem } from '../../services/menuService';
import { 
  Plus, Edit2, Trash2, Eye, EyeOff, 
  ArrowUp, ArrowDown, Save, X, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MenuManager() {
  const { items, isLoading, error, fetchMenu, updateOrder, addMenu, editMenu, deleteMenu } = useMenuStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // Local form state
  const [formData, setFormData] = useState({
    label: '',
    url: '',
    icon: '',
    parent_id: '',
    is_visible: true
  });

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Organize items hierarchically
  const topLevelItems = useMemo(() => 
    items.filter(i => !i.parent_id).sort((a, b) => a.order_index - b.order_index),
  [items]);

  const getChildren = (parentId: string) => 
    items.filter(i => i.parent_id === parentId).sort((a, b) => a.order_index - b.order_index);

  const resetForm = () => {
    setFormData({ label: '', url: '', icon: '', parent_id: '', is_visible: true });
    setIsAdding(false);
    setEditingItem(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await editMenu(editingItem.id, {
          label: formData.label,
          url: formData.url,
          icon: formData.icon,
          parent_id: formData.parent_id || null,
          is_visible: formData.is_visible
        });
      } else {
        await addMenu({
          label: formData.label,
          url: formData.url,
          icon: formData.icon,
          parent_id: formData.parent_id || null,
          is_visible: formData.is_visible,
          order_index: (items.length + 1) * 10
        });
      }
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      url: item.url,
      icon: item.icon || '',
      parent_id: item.parent_id || '',
      is_visible: item.is_visible
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleVisibility = (item: MenuItem) => {
    editMenu(item.id, { is_visible: !item.is_visible });
  };

  const moveItem = (item: MenuItem, direction: 'up' | 'down') => {
    const siblings = item.parent_id ? getChildren(item.parent_id) : topLevelItems;
    const currentIndex = siblings.findIndex(i => i.id === item.id);
    if (currentIndex < 0) return;
    
    if (direction === 'up' && currentIndex > 0) {
      const newItems = items.map(i => ({ ...i })); // deep copy to avoid state mutation
      const newSiblings = item.parent_id ? newItems.filter(i => i.parent_id === item.parent_id).sort((a, b) => a.order_index - b.order_index) : newItems.filter(i => !i.parent_id).sort((a, b) => a.order_index - b.order_index);
      
      const temp = newSiblings[currentIndex].order_index;
      const targetId = newSiblings[currentIndex].id;
      const swapId = newSiblings[currentIndex - 1].id;
      
      newItems.find(i => i.id === targetId)!.order_index = newSiblings[currentIndex - 1].order_index;
      newItems.find(i => i.id === swapId)!.order_index = temp;
      updateOrder(newItems);
    } else if (direction === 'down' && currentIndex < siblings.length - 1) {
      const newItems = items.map(i => ({ ...i })); // deep copy
      const newSiblings = item.parent_id ? newItems.filter(i => i.parent_id === item.parent_id).sort((a, b) => a.order_index - b.order_index) : newItems.filter(i => !i.parent_id).sort((a, b) => a.order_index - b.order_index);
      
      const temp = newSiblings[currentIndex].order_index;
      const targetId = newSiblings[currentIndex].id;
      const swapId = newSiblings[currentIndex + 1].id;
      
      newItems.find(i => i.id === targetId)!.order_index = newSiblings[currentIndex + 1].order_index;
      newItems.find(i => i.id === swapId)!.order_index = temp;
      updateOrder(newItems);
    }
  };

  const renderItemRow = (item: MenuItem, isChild = false) => {
    const isFirst = (isChild ? getChildren(item.parent_id!) : topLevelItems)[0]?.id === item.id;
    const isLast = (isChild ? getChildren(item.parent_id!) : topLevelItems).slice(-1)[0]?.id === item.id;

    return (
      <motion.div 
        key={item.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`flex items-center gap-4 p-4 mb-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border ${
          isChild ? 'border-dashed border-gray-200 dark:border-slate-700 ml-8 bg-gray-50 dark:bg-slate-800/50' : 'border-gray-100 dark:border-slate-700'
        } ${!item.is_visible ? 'opacity-50' : ''}`}
      >
        <div className="flex flex-col gap-1 text-gray-400">
          <button disabled={isFirst} onClick={() => moveItem(item, 'up')} className="hover:text-primary disabled:opacity-30"><ArrowUp size={16} /></button>
          <button disabled={isLast} onClick={() => moveItem(item, 'down')} className="hover:text-primary disabled:opacity-30"><ArrowDown size={16} /></button>
        </div>
        
        <div className="flex-grow min-w-0">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">{item.label}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate font-mono">{item.url}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleVisibility(item)}
            className={`p-2 rounded-lg transition-colors ${item.is_visible ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
            title={item.is_visible ? "Ocultar" : "Mostrar"}
          >
            {item.is_visible ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button
            onClick={() => startEdit(item)}
            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => {
              if(window.confirm('¿Eliminar este elemento del menú?')) deleteMenu(item.id);
            }}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-serif text-gray-900 dark:text-white">Gestión de Navegación</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Modifica el menú principal y la barra móvil de la aplicación.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 font-medium"
          >
            <Plus size={20} />
            Añadir Enlace
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-100 flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 mb-8">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                {editingItem ? 'Editar Enlace' : 'Nuevo Enlace'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Etiqueta</label>
                  <input
                    required
                    type="text"
                    value={formData.label}
                    onChange={e => setFormData({...formData, label: e.target.value})}
                    placeholder="Ej. Inicio, Eventos..."
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-transparent focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ruta / URL</label>
                  <input
                    required
                    type="text"
                    value={formData.url}
                    onChange={e => setFormData({...formData, url: e.target.value})}
                    placeholder="Ej. /nosotros, https://..."
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-transparent focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Menú Padre (Opcional)</label>
                  <select
                    value={formData.parent_id}
                    onChange={e => setFormData({...formData, parent_id: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-transparent focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                  >
                    <option value="">-- Sin Padre (Nivel Superior) --</option>
                    {topLevelItems.filter(i => i.id !== editingItem?.id).map(item => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Icono Lucide (Móvil)</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={e => setFormData({...formData, icon: e.target.value})}
                    placeholder="Ej. Home, Users..."
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-transparent focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
                <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium">
                  <Save size={18} />
                  Guardar
                </button>
                <button type="button" onClick={resetForm} className="flex items-center gap-2 px-6 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium">
                  <X size={18} />
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {isLoading && items.length === 0 ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Cargando menú...</div>
        ) : (
          <AnimatePresence>
            {topLevelItems.map((item) => (
              <div key={item.id}>
                {renderItemRow(item, false)}
                <div className="space-y-2 mt-2">
                  {getChildren(item.id).map(child => renderItemRow(child, true))}
                </div>
              </div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
