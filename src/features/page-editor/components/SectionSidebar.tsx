import { Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import type { DBPageSection } from '../types';

interface SectionSidebarProps {
  sections: DBPageSection[];
  selectedSection: string;
  onSelectSection: (id: string) => void;
  onAddSection: () => void;
  onMoveSection: (id: string, direction: 'up' | 'down') => void;
  onDeleteSection: (id: string) => void;
}

export const SectionSidebar = ({
  sections,
  selectedSection,
  onSelectSection,
  onAddSection,
  onMoveSection,
  onDeleteSection
}: SectionSidebarProps) => {
  return (
    <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-2xs flex flex-col space-y-3">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
          Estructura de Secciones
        </span>
        <button
          onClick={onAddSection}
          className="text-primary hover:bg-blue-50/50 p-1 rounded-lg transition-colors cursor-pointer flex items-center gap-0.5 text-[10px] font-bold uppercase"
          title="Añadir Sección"
        >
          <Plus size={12} />
          Añadir
        </button>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {sections.length === 0 ? (
          <p className="text-[10px] text-slate-400 italic text-center py-4">No hay secciones registradas.</p>
        ) : (
          sections.map((sec, idx) => {
            const isActive = selectedSection === sec.id;
            const isSystemComponent = sec.section_type !== 'custom';
            return (
              <div 
                key={sec.id}
                className={`group/item flex items-center justify-between p-1.5 rounded-xl border transition-all ${
                  isActive 
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-primary/30 dark:border-blue-500/40 text-primary dark:text-blue-400 shadow-2xs' 
                    : 'bg-white dark:bg-slate-900 border-transparent dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200/50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectSection(sec.id)}
                  className="flex-grow text-left px-2.5 py-1.5 text-xs font-bold flex flex-col gap-0.5 min-w-0"
                >
                  <span className="truncate">{sec.name}</span>
                  <span className="text-[9px] font-normal text-slate-400 dark:text-gray-500">
                    {isSystemComponent ? 'Módulo Especial' : 'Contenido por Bloques'}
                  </span>
                </button>
                
                {/* Action buttons visible on hover or if active */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button
                    disabled={idx === 0}
                    onClick={(e) => { e.stopPropagation(); onMoveSection(sec.id, 'up'); }}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-gray-250 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                    title="Subir Sección"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    disabled={idx === sections.length - 1}
                    onClick={(e) => { e.stopPropagation(); onMoveSection(sec.id, 'down'); }}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-gray-250 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                    title="Bajar Sección"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSection(sec.id); }}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                    title="Eliminar Sección"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
