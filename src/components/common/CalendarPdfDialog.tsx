import { useState } from 'react';
import { X, FileDown, LayoutPanelLeft, LayoutPanelTop, LayoutGrid, Table } from 'lucide-react';
import { AnimeFadeUp } from '../animations/AnimeWrappers';

interface CalendarPdfDialogProps {
  onClose: () => void;
  onExport: (orientation: 'portrait' | 'landscape', viewMode: 'cards' | 'table') => void;
  title?: string;
}

export default function CalendarPdfDialog({
  onClose,
  onExport,
  title = "Exportar PDF de Calendario"
}: CalendarPdfDialogProps) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fadeIn">
      <AnimeFadeUp className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-150 dark:border-white/10">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-amber-400 flex items-center justify-center border border-blue-600/20 dark:border-amber-400/20">
              <FileDown size={20} />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-gray-800 dark:text-white">{title}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Personaliza la apariencia y el formato de tu reporte en PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-gray-400 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Estilo de Formato */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Estilo de Formato
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'border-blue-600 dark:border-amber-400 bg-blue-50 dark:bg-amber-400/10 text-blue-700 dark:text-amber-300 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <LayoutGrid size={24} />
                <span className="text-xs">Tarjetas Visuales</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'border-blue-600 dark:border-amber-400 bg-blue-50 dark:bg-amber-400/10 text-blue-700 dark:text-amber-300 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Table size={24} />
                <span className="text-xs">Tabla Ejecutiva</span>
              </button>
            </div>
          </div>

          {/* Orientacion de Pagina */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Orientación de la Página
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  orientation === 'portrait'
                    ? 'border-blue-600 dark:border-amber-400 bg-blue-50 dark:bg-amber-400/10 text-blue-700 dark:text-amber-300 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <LayoutPanelTop size={24} />
                <span className="text-xs">Vertical (Portrait)</span>
              </button>

              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  orientation === 'landscape'
                    ? 'border-blue-600 dark:border-amber-400 bg-blue-50 dark:bg-amber-400/10 text-blue-700 dark:text-amber-300 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <LayoutPanelLeft size={24} />
                <span className="text-xs">Horizontal (Recomendado)</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onExport(orientation, viewMode);
              onClose();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/30 active:scale-[0.98] cursor-pointer text-sm"
          >
            <FileDown size={18} />
            Generar y Descargar PDF
          </button>
        </div>
      </AnimeFadeUp>
    </div>
  );
}
