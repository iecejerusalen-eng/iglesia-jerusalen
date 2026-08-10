import React from 'react';
import { Minus, Plus, Settings, Type, Guitar, Piano, LayoutPanelTop, Eye, EyeOff, Drum } from 'lucide-react';
import type { InstrumentType } from '../../utils/chordDictionary';

interface SongSettingsSidebarProps {
  instrument: InstrumentType;
  setInstrument: (inst: InstrumentType) => void;
  transpose: number;
  setTranspose: (val: number) => void;
  textSize: number;
  setTextSize: (val: number) => void;
  showDiagramsAtTop: boolean;
  setShowDiagramsAtTop: (val: boolean) => void;
  showChords: boolean;
  setShowChords: (val: boolean) => void;
}

export function SongSettingsSidebar({
  instrument, setInstrument,
  transpose, setTranspose,
  textSize, setTextSize,
  showDiagramsAtTop, setShowDiagramsAtTop,
  showChords, setShowChords
}: SongSettingsSidebarProps) {
  
  return (
    <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 w-full lg:w-72 flex-shrink-0 lg:sticky top-20 h-max rounded-3xl lg:rounded-none overflow-hidden shadow-xl lg:shadow-none mb-8 lg:mb-0">
      <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
          <Settings size={16} className="text-amber-500" /> Herramientas
        </h3>
      </div>
      
      <div className="p-5 space-y-8">
        
        {/* Acordes Visibility */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visibilidad de Acordes</label>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setShowChords(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${showChords ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Eye size={14} /> Ver
            </button>
            <button
              onClick={() => setShowChords(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${!showChords ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <EyeOff size={14} /> Ocultar
            </button>
          </div>
        </div>

        {/* Instrument */}
        <div className={`space-y-3 transition-opacity ${!showChords ? 'opacity-30 pointer-events-none' : ''}`}>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instrumento</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'guitarra', label: 'Guitarra', icon: Guitar },
              { id: 'ukelele', label: 'Ukelele', icon: Guitar },
              { id: 'piano', label: 'Piano', icon: Piano },
              { id: 'bateria', label: 'Batería', icon: Drum },
              { id: 'ninguno', label: 'Ninguno', icon: EyeOff }
            ].map(inst => {
              const Icon = inst.icon;
              const isActive = instrument === inst.id;
              return (
                <button
                  key={inst.id}
                  onClick={() => setInstrument(inst.id as InstrumentType)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-amber-500' : 'text-slate-400'} />
                  {inst.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Transpose */}
        <div className={`space-y-3 transition-opacity ${!showChords ? 'opacity-30 pointer-events-none' : ''}`}>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
            Tonalidad <span>{transpose === 0 ? 'Original' : transpose > 0 ? `+${transpose}` : transpose}</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTranspose(transpose - 1)}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Minus size={16} />
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-black text-slate-800 dark:text-white">
                Transponer
              </span>
            </div>
            <button
              onClick={() => setTranspose(transpose + 1)}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Text Size */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
            Tamaño de Letra <span>{textSize}%</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTextSize(Math.max(60, textSize - 10))}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Type size={14} />
            </button>
            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, ((textSize - 60) / 140) * 100))}%` }}
              />
            </div>
            <button
              onClick={() => setTextSize(Math.min(200, textSize + 10))}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Type size={18} />
            </button>
          </div>
        </div>

        {/* Diagrams Display */}
        <div className={`space-y-3 transition-opacity ${(!showChords || instrument === 'ninguno') ? 'opacity-30 pointer-events-none' : ''}`}>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diagramas</label>
          <button
            onClick={() => setShowDiagramsAtTop(!showDiagramsAtTop)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
              showDiagramsAtTop
                ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <LayoutPanelTop size={16} />
              <span className="text-xs font-bold">Mostrar al inicio</span>
            </div>
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${showDiagramsAtTop ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${showDiagramsAtTop ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}
