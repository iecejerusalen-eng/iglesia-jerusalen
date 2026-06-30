import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout, CheckCircle2, Maximize, Minimize2, AppWindow, PanelLeftClose, List, LayoutGrid, Rows, ChevronsUpDown, Layers, LockOpen, Grid, ArrowUp, ArrowDown } from 'lucide-react';
import { useThemeStore, type SidebarViewMode, type SidebarMenuMode, type SidebarAccordionMode, type SidebarGridSort } from '../../../../store/useThemeStore';
import { ADMIN_MODULES } from '../../../../config/adminModules';

const NavigationTab = () => {
  const { 
    sidebarViewMode, setSidebarViewMode,
    sidebarMenuMode, setSidebarMenuMode,
    sidebarAccordionMode, setSidebarAccordionMode,
    sidebarDefaultClosed, setSidebarDefaultClosed,
    sidebarGridColumns, setSidebarGridColumns,
    sidebarGridSort, setSidebarGridSort,
    sidebarCustomOrder, setSidebarCustomOrder
  } = useThemeStore();

  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    // Needed for Firefox
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    // Pequeño timeout para que el estilo de "arrastrando" no oculte el fantasma del cursor
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.classList.add('opacity-50');
      }
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverItem !== id) {
      setDragOverItem(id);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null);
    setDragOverItem(null);
    if (e.target instanceof HTMLElement) {
      e.target.classList.remove('opacity-50');
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId || !sidebarCustomOrder) return;
    
    const currentOrder = sidebarCustomOrder.length > 0 ? sidebarCustomOrder : ADMIN_MODULES.map(m => m.id);
    const oldIndex = currentOrder.indexOf(draggedItem);
    const newIndex = currentOrder.indexOf(targetId);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newOrder = [...currentOrder];
    newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, draggedItem);
    
    setSidebarCustomOrder(newOrder);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const sidebarOptions: { value: SidebarViewMode; label: string; desc: string; icon: React.ElementType }[] = [
    { value: 'full', label: 'Completo', desc: 'Barra lateral siempre visible con textos.', icon: Maximize },
    { value: 'compact', label: 'Compacto', desc: 'Solo iconos para maximizar espacio.', icon: Minimize2 },
    { value: 'floating', label: 'Flotante', desc: 'Diseño moderno estilo isla separada.', icon: AppWindow },
    { value: 'drawer', label: 'Cajón (Drawer)', desc: 'Oculta por defecto, desliza para abrir.', icon: PanelLeftClose },
  ];

  const menuModeOptions: { value: SidebarMenuMode; label: string; desc: string; icon: React.ElementType }[] = [
    { value: 'list', label: 'Lista Clásica', desc: 'Elementos en lista simple tradicional.', icon: List },
    { value: 'cards_grouped', label: 'Tarjetas Agrupadas', desc: 'Estilo botón agrupados por categoría.', icon: LayoutGrid },
    { value: 'cards_ungrouped', label: 'Tarjetas Simples', desc: 'Estilo botón sin divisiones de categoría.', icon: Rows },
    { value: 'grid', label: 'Cuadrícula (Matriz)', desc: 'Elementos organizados en columnas ajustables.', icon: Grid },
  ];

  const accordionOptions: { value: SidebarAccordionMode; label: string; desc: string; icon: React.ElementType }[] = [
    { value: 'single', label: 'Acordeón Único', desc: 'Al abrir una categoría, las demás se cierran.', icon: ChevronsUpDown },
    { value: 'multiple', label: 'Múltiple', desc: 'Puedes mantener varias categorías abiertas.', icon: Layers },
    { value: 'all_open', label: 'Todo Abierto', desc: 'Todas las categorías siempre expandidas.', icon: LockOpen },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-10"
    >
      {/* Sección 1: Layout General */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layout size={20} className="text-gold" />
            Formato de la Barra Lateral
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configura el comportamiento base y el tamaño de la barra lateral.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sidebarOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = sidebarViewMode === opt.value;
            
            return (
              <button
                key={opt.value}
                onClick={() => setSidebarViewMode(opt.value)}
                className={`relative flex items-center p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                  isActive 
                    ? 'border-gold bg-gold/5 shadow-md shadow-gold/10' 
                    : 'border-gray-200 dark:border-slate-800 hover:border-gold/30 bg-white dark:bg-slate-900 hover:shadow-lg'
                }`}
              >
                <div className={`p-3 rounded-xl mr-4 shrink-0 transition-colors ${
                  isActive ? 'bg-gold text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
                }`}>
                  <Icon size={24} />
                </div>
                
                <div className="text-left flex-grow">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-bold text-base ${isActive ? 'text-gold' : 'text-gray-800 dark:text-white'}`}>{opt.label}</h3>
                    {isActive && <CheckCircle2 size={18} className="text-gold" />}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                </div>
                
                {isActive && (
                  <motion.div layoutId="active-nav-outline" className="absolute inset-0 rounded-2xl border-2 border-gold pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Sección 2: Estilo de Elementos */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <List size={20} className="text-gold" />
            Estilo de los Elementos
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Elige cómo se ven los botones de navegación dentro del menú.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {menuModeOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = sidebarMenuMode === opt.value;
            
            return (
              <button
                key={opt.value}
                onClick={() => setSidebarMenuMode(opt.value)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-center group overflow-hidden ${
                  isActive 
                    ? 'border-gold bg-gold/5 shadow-md shadow-gold/10' 
                    : 'border-gray-200 dark:border-slate-800 hover:border-gold/30 bg-white dark:bg-slate-900 hover:shadow-lg'
                }`}
              >
                <div className={`p-3 rounded-full mb-2 transition-colors ${
                  isActive ? 'bg-gold text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 group-hover:bg-gold/20 group-hover:text-gold'
                }`}>
                  <Icon size={24} />
                </div>
                <h3 className={`font-bold text-sm mb-1 ${isActive ? 'text-gold' : 'text-gray-800 dark:text-white'}`}>{opt.label}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{opt.desc}</p>
                
                {isActive && (
                  <motion.div layoutId="active-menumode-outline" className="absolute inset-0 rounded-2xl border-2 border-gold pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>

        {sidebarMenuMode === 'grid' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 p-5 border border-gold/30 bg-gold/5 rounded-2xl space-y-5"
          >
            <div>
              <h3 className="font-bold text-sm text-gray-800 dark:text-white mb-3">Número de Columnas</h3>
              <div className="flex flex-wrap gap-3">
                {[2, 3, 4, 5].map(cols => (
                  <button
                    key={cols}
                    onClick={() => setSidebarGridColumns(cols)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors border ${
                      sidebarGridColumns === cols 
                        ? 'bg-gold text-white border-gold shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-gold/50'
                    }`}
                  >
                    {cols} Columnas
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-sm text-gray-800 dark:text-white mb-3">Modo de Agrupación</h3>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'name', label: 'Alfabético (Nombre)' },
                  { id: 'category', label: 'Por Categoría' },
                  { id: 'custom', label: 'Orden Libre (Personalizado)' }
                ].map(sortMode => (
                  <button
                    key={sortMode.id}
                    onClick={() => {
                      setSidebarGridSort(sortMode.id as SidebarGridSort);
                      if (sortMode.id === 'custom' && (!sidebarCustomOrder || sidebarCustomOrder.length === 0)) {
                        setSidebarCustomOrder(ADMIN_MODULES.map(m => m.id));
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors border ${
                      sidebarGridSort === sortMode.id 
                        ? 'bg-gold text-white border-gold shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-gold/50'
                    }`}
                  >
                    {sortMode.label}
                  </button>
                ))}
              </div>
            </div>

            {sidebarGridSort === 'custom' && (
              <div className="mt-4 pt-4 border-t border-gold/20">
                <h3 className="font-bold text-sm text-gray-800 dark:text-white mb-3">Personalizar Orden (Libre)</h3>
                <p className="text-xs text-gray-500 mb-4">Usa las flechas o arrastra y suelta para ordenar los elementos a tu gusto.</p>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                  {(sidebarCustomOrder && sidebarCustomOrder.length > 0 ? sidebarCustomOrder : ADMIN_MODULES.map(m => m.id)).map((moduleId, index, array) => {
                    const module = ADMIN_MODULES.find(m => m.id === moduleId);
                    if (!module) return null;
                    return (
                      <div 
                        key={moduleId} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, moduleId)}
                        onDragOver={(e) => handleDragOver(e, moduleId)}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, moduleId)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                          dragOverItem === moduleId 
                            ? 'bg-gold/10 border-gold border-dashed shadow-inner' 
                            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <module.icon size={16} className="text-gold" />
                          <span className="text-sm font-semibold text-gray-800 dark:text-white">{module.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            disabled={index === 0}
                            onClick={() => {
                              const newOrder = [...array];
                              [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
                              setSidebarCustomOrder(newOrder);
                            }}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button 
                            disabled={index === array.length - 1}
                            onClick={() => {
                              const newOrder = [...array];
                              [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                              setSidebarCustomOrder(newOrder);
                            }}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </section>

      {/* Sección 3: Comportamiento Acordeón */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChevronsUpDown size={20} className="text-gold" />
            Comportamiento de las Categorías
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Controla cómo se abren y cierran las categorías del menú.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {accordionOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = sidebarAccordionMode === opt.value;
            
            return (
              <button
                key={opt.value}
                onClick={() => setSidebarAccordionMode(opt.value)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-center group overflow-hidden ${
                  isActive 
                    ? 'border-gold bg-gold/5 shadow-md shadow-gold/10' 
                    : 'border-gray-200 dark:border-slate-800 hover:border-gold/30 bg-white dark:bg-slate-900 hover:shadow-lg'
                }`}
              >
                <div className={`p-3 rounded-full mb-2 transition-colors ${
                  isActive ? 'bg-gold text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 group-hover:bg-gold/20 group-hover:text-gold'
                }`}>
                  <Icon size={24} />
                </div>
                <h3 className={`font-bold text-sm mb-1 ${isActive ? 'text-gold' : 'text-gray-800 dark:text-white'}`}>{opt.label}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{opt.desc}</p>
                
                {isActive && (
                  <motion.div layoutId="active-accordion-outline" className="absolute inset-0 rounded-2xl border-2 border-gold pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>

        {sidebarAccordionMode !== 'all_open' && (
          <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 cursor-pointer hover:border-gold/30 transition-colors">
            <input 
              type="checkbox" 
              checked={sidebarDefaultClosed}
              onChange={(e) => setSidebarDefaultClosed(e.target.checked)}
              className="w-5 h-5 rounded text-gold focus:ring-gold/50 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600" 
            />
            <div>
              <p className="font-semibold text-sm text-gray-800 dark:text-white">Iniciar con todas las categorías cerradas</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Por defecto, ninguna categoría se expandirá al cargar la página (excepto la activa si es necesario).</p>
            </div>
          </label>
        )}
      </section>

    </motion.div>
  );
};

export default NavigationTab;
