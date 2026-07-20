import { useState } from 'react';
import { X, FileDown, LayoutPanelLeft, LayoutPanelTop } from 'lucide-react';
import { AnimeFadeUp } from '../animations/AnimeWrappers';

interface CalendarPdfDialogProps {
  onClose: () => void;
  onExport: (orientation: 'portrait' | 'landscape') => void;
  title?: string;
}

export default function CalendarPdfDialog({ onClose, onExport, title = "Exportar PDF" }: CalendarPdfDialogProps) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn">
      <AnimeFadeUp className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-150 dark:border-white/10">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary dark:text-gold flex items-center justify-center border border-primary/20 dark:border-gold/20">
              <FileDown size={20} />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-gray-800 dark:text-white">{title}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Configura las opciones de exportación</p>
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
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
              Orientación de Página
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setOrientation('portrait')}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  orientation === 'portrait'
                    ? 'border-primary dark:border-gold bg-primary/5 dark:bg-gold/10 text-primary dark:text-gold'
                    : 'border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <LayoutPanelTop size={32} strokeWidth={1.5} />
                <span className="font-bold text-sm">Vertical</span>
              </button>
              
              <button
                onClick={() => setOrientation('landscape')}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  orientation === 'landscape'
                    ? 'border-primary dark:border-gold bg-primary/5 dark:bg-gold/10 text-primary dark:text-gold'
                    : 'border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <LayoutPanelLeft size={32} strokeWidth={1.5} />
                <span className="font-bold text-sm">Horizontal</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              onExport(orientation);
              onClose();
            }}
            className="w-full bg-primary hover:bg-blue-900 text-white font-bold rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 active:scale-[0.98] cursor-pointer"
          >
            <FileDown size={18} />
            Generar PDF
          </button>
        </div>
      </AnimeFadeUp>
    </div>
  );
}
