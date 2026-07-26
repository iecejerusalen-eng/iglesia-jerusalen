import React, { useState } from 'react';
import { LayoutGrid, List as ListIcon, Table as TableIcon, Maximize2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedTable, type AdvancedTableProps } from './AdvancedTable';

export type ViewMode = 'table' | 'list' | 'grid' | 'lateral' | 'modal';

interface DynamicDataViewProps<TData> extends AdvancedTableProps<TData> {
  title: string;
  defaultView?: ViewMode;
  renderListItem?: (item: TData) => React.ReactNode;
  renderGridItem?: (item: TData) => React.ReactNode;
}

export function DynamicDataView<TData>({
  data,
  columns,
  title,
  defaultView = 'table',
  renderListItem,
  renderGridItem,
  onRowClick,
  isLoading,
}: DynamicDataViewProps<TData>) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [showSettings, setShowSettings] = useState(false);
  const [blurIntensity, setBlurIntensity] = useState(10); // px

  return (
    <div className="flex flex-col space-y-4">
      {/* Header and View Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm" style={{ backdropFilter: `blur(${blurIntensity}px)` }}>
        <h2 className="text-xl font-serif font-bold text-gray-800 dark:text-white flex items-center gap-2">
          {title}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-gold transition-colors bg-white/50 dark:bg-slate-800/50 rounded-lg"
            title="Efectos y Vista"
          >
            <Settings size={18} />
          </button>
          
          <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>

          {/* View Modes */}
          <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-gold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
              title="Vista de Tabla"
            >
              <TableIcon size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-gold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
              title="Vista de Lista"
            >
              <ListIcon size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-gold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
              title="Vista de Cuadrícula"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('modal')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'modal' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-gold' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
              title="Vista Popup"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Global Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg"
          >
            <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-200">Configuración Global de Efectos (Glassmorphism)</h3>
            <div className="flex items-center gap-4">
              <label className="text-xs text-gray-500 dark:text-gray-400">Intensidad de Desenfoque (Blur):</label>
              <input
                type="range"
                min="0"
                max="30"
                value={blurIntensity}
                onChange={(e) => setBlurIntensity(Number(e.target.value))}
                className="w-32 accent-primary"
              />
              <span className="text-xs font-mono bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">{blurIntensity}px</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Rendering based on ViewMode */}
      <motion.div
        key={viewMode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {viewMode === 'table' && (
          <AdvancedTable
            data={data}
            columns={columns}
            onRowClick={onRowClick}
            isLoading={isLoading}
          />
        )}

        {viewMode === 'list' && (
          <div className="space-y-3" style={{ backdropFilter: `blur(${blurIntensity}px)` }}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-16 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
              ))
            ) : data.length === 0 ? (
              <div className="text-center text-gray-500 py-10">No hay registros</div>
            ) : (
              data.map((item, idx) => (
                <div key={idx} onClick={() => onRowClick && onRowClick(item)} className="cursor-pointer">
                  {renderListItem ? renderListItem(item) : (
                    <div className="p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-white/10">
                      Item {idx}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ backdropFilter: `blur(${blurIntensity}px)` }}>
            {isLoading ? (
               Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-40 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
              ))
            ) : data.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-10">No hay registros</div>
            ) : (
              data.map((item, idx) => (
                <div key={idx} onClick={() => onRowClick && onRowClick(item)} className="cursor-pointer h-full">
                  {renderGridItem ? renderGridItem(item) : (
                    <div className="h-full p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-white/10">
                      Item {idx}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {viewMode === 'modal' && (
          <div className="p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl text-center text-gray-500">
            <Maximize2 size={32} className="mx-auto mb-2 opacity-50" />
            <p>La vista Modal abrirá estos registros en una ventana emergente enfocada.</p>
            <p className="text-xs mt-2 text-primary cursor-pointer hover:underline" onClick={() => setViewMode('table')}>Volver a Tabla</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
