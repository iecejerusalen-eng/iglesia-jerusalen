import { Layers, Compass, Users, Crosshair, Plus, X, Trash2, AlertTriangle } from 'lucide-react';
import type { Cell, Profile } from '../../../types';

interface MapSidebarProps {
  showChurch: boolean;
  setShowChurch: (val: boolean) => void;
  showCells: boolean;
  setShowCells: (val: boolean) => void;
  showCoverage: boolean;
  setShowCoverage: (val: boolean) => void;
  showMembers: boolean;
  setShowMembers: (val: boolean) => void;
  showHeatmap: boolean;
  setShowHeatmap: (val: boolean) => void;
  showOtherChurches: boolean;
  setShowOtherChurches: (val: boolean) => void;
  
  cells: Cell[];
  profiles: Profile[];
  
  isCreatingCell: boolean;
  setIsCreatingCell: (val: boolean) => void;
  cellForm: any;
  setCellForm: (val: any) => void;
  handleCreateCell: (e: React.FormEvent) => void;
  handleDeleteCell: (id: string, name: string) => void;
  getCurrentLocation: () => void;
  onFocusLocation: (lat: number, lng: number) => void;
  setSelectedItem: (item: any) => void;
  locationsCount: number;
}

export const MapSidebar = ({
  showChurch, setShowChurch,
  showCells, setShowCells,
  showCoverage, setShowCoverage,
  showMembers, setShowMembers,
  showHeatmap, setShowHeatmap,
  showOtherChurches, setShowOtherChurches,
  cells, profiles,
  isCreatingCell, setIsCreatingCell,
  cellForm, setCellForm,
  handleCreateCell, handleDeleteCell,
  getCurrentLocation, onFocusLocation,
  setSelectedItem, locationsCount
}: MapSidebarProps) => {

  return (
    <div className="w-80 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex flex-col flex-shrink-0 overflow-y-auto custom-scrollbar p-6 space-y-6 shadow-sm">
      
      {/* Layer Visibility */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-gray-450 font-bold flex items-center gap-1.5 font-serif">
          <Layers size={14} className="text-gold" />
          Capas Visibles
        </h3>
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-white/10 space-y-3.5 text-xs font-semibold text-slate-750 shadow-xs">
          <label className="flex items-center gap-3 cursor-pointer select-none hover:text-slate-900 transition-colors">
            <input 
              type="checkbox" 
              checked={showChurch} 
              onChange={() => setShowChurch(!showChurch)} 
              className="rounded border-slate-350 text-primary focus:ring-primary bg-white dark:bg-slate-900 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-gray-100">
              <span className="text-sm">⛪</span>
              Iglesia Jerusalén Central
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer select-none hover:text-slate-900 transition-colors">
            <input 
              type="checkbox" 
              checked={showCells} 
              onChange={() => setShowCells(!showCells)} 
              className="rounded border-slate-350 text-primary focus:ring-primary bg-white dark:bg-slate-900 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-gray-100">
              <Compass size={14} className="text-emerald-600" />
              Células ({cells.length})
            </span>
          </label>
          {showCells && (
            <label className="flex items-center gap-3 cursor-pointer select-none hover:text-slate-900 transition-colors pl-4 animate-fadeIn">
              <input 
                type="checkbox" 
                checked={showCoverage} 
                onChange={() => setShowCoverage(!showCoverage)} 
                className="rounded border-slate-350 text-primary focus:ring-primary bg-white dark:bg-slate-900 w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center gap-1.5 text-slate-650 text-[11px] font-bold">
                <span>🌐</span>
                Cobertura de Células (500m)
              </span>
            </label>
          )}
          <label className="flex items-center gap-3 cursor-pointer select-none hover:text-slate-900 transition-colors">
            <input 
              type="checkbox" 
              checked={showMembers} 
              onChange={() => {
                setShowMembers(!showMembers);
                if (showMembers) setSelectedItem(null);
              }} 
              className="rounded border-slate-350 text-primary focus:ring-primary bg-white dark:bg-slate-900 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-blue-600" />
              Hermanos (Agrupados)
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer select-none hover:text-slate-900 transition-colors">
            <input 
              type="checkbox" 
              checked={showHeatmap} 
              onChange={() => setShowHeatmap(!showHeatmap)} 
              className="rounded border-slate-350 text-primary focus:ring-primary bg-white dark:bg-slate-900 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              <Crosshair size={14} className="text-red-500 animate-pulse" />
              Densidad (Mapa Calor)
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer select-none hover:text-slate-900 transition-colors">
            <input 
              type="checkbox" 
              checked={showOtherChurches} 
              onChange={() => {
                setShowOtherChurches(!showOtherChurches);
                if (showOtherChurches) setSelectedItem(null);
              }} 
              className="rounded border-slate-350 text-primary focus:ring-primary bg-white dark:bg-slate-900 w-4 h-4 cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              <span className="text-sm">⛪</span>
              Otras Iglesias ({locationsCount})
            </span>
          </label>
        </div>
      </div>

      {/* Cells Management */}
      <div className="space-y-4 flex-grow flex flex-col min-h-0">
        <div className="flex justify-between items-center">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-gray-450 font-bold flex items-center gap-1.5 font-serif">
            <Compass size={14} className="text-emerald-600" />
            Células / Hogares
          </h3>
          {!isCreatingCell ? (
            <button
              onClick={() => setIsCreatingCell(true)}
              className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors cursor-pointer shadow-sm shadow-emerald-600/10"
              title="Nueva Célula"
            >
              <Plus size={14} />
            </button>
          ) : (
            <button
              onClick={() => setIsCreatingCell(false)}
              className="p-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-gray-300 transition-colors cursor-pointer border border-slate-200 dark:border-white/10"
              title="Cancelar"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {isCreatingCell ? (
          <form onSubmit={handleCreateCell} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-white/10 space-y-3.5 text-xs text-left animate-fadeIn shadow-2xs">
            <div className="space-y-1">
              <label className="block text-slate-500 dark:text-gray-450 font-bold">Nombre de Célula</label>
              <input
                type="text"
                value={cellForm.name}
                onChange={e => setCellForm((prev: any) => ({ ...prev, name: e.target.value }))}
                placeholder="Ej. Célula La Roca"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-800 dark:text-gray-100 placeholder-slate-400 focus:ring-1 focus:ring-gold focus:border-gold focus:outline-none shadow-2xs transition-all"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-500 dark:text-gray-450 font-bold">Sector / Zona</label>
              <input
                type="text"
                value={cellForm.sector}
                onChange={e => setCellForm((prev: any) => ({ ...prev, sector: e.target.value }))}
                placeholder="Ej. Sector Norte"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-800 dark:text-gray-100 placeholder-slate-400 focus:ring-1 focus:ring-gold focus:border-gold focus:outline-none shadow-2xs transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-500 dark:text-gray-450 font-bold">Líder a Cargo</label>
              <select
                value={cellForm.leader_id}
                onChange={e => setCellForm((prev: any) => ({ ...prev, leader_id: e.target.value }))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-700 dark:text-gray-300 focus:ring-1 focus:ring-gold focus:border-gold focus:outline-none shadow-2xs transition-all"
              >
                <option value="">Selecciona un Líder...</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-gray-450 font-bold">Latitud</label>
                <input
                  type="number"
                  step="any"
                  value={cellForm.latitude}
                  onChange={e => setCellForm((prev: any) => ({ ...prev, latitude: Number(e.target.value) }))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-600 dark:text-gray-400 font-mono shadow-2xs focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 dark:text-gray-450 font-bold">Longitud</label>
                <input
                  type="number"
                  step="any"
                  value={cellForm.longitude}
                  onChange={e => setCellForm((prev: any) => ({ ...prev, longitude: Number(e.target.value) }))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-600 dark:text-gray-400 font-mono shadow-2xs focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-amber-50 p-2.5 rounded-xl text-[10px] text-amber-800 leading-normal flex items-start gap-2 border border-amber-200/50">
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <span>Haz clic directamente sobre el mapa para ubicar o usa el GPS.</span>
            </div>

            <div className="flex gap-2 pt-1.5">
              <button
                type="button"
                onClick={getCurrentLocation}
                className="flex-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/10 py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all shadow-2xs cursor-pointer"
              >
                <Crosshair size={12} className="text-gold" />
                Usar GPS
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl font-bold transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
              >
                Crear
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-150 dark:border-white/10 flex-grow overflow-y-auto max-h-[300px] custom-scrollbar space-y-1 text-xs text-left shadow-2xs">
            {cells.length === 0 ? (
              <span className="text-slate-400 font-bold text-center block py-8">No hay células creadas</span>
            ) : (
              cells.map(cell => (
                <div 
                  key={cell.id}
                  className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-100/50 rounded-xl transition-all border border-slate-100 dark:border-white/5 hover:border-slate-200 flex items-center justify-between group shadow-2xs mb-1"
                >
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      onFocusLocation(cell.latitude, cell.longitude);
                      setSelectedItem({ type: 'cell', data: cell });
                    }}
                    className="cursor-pointer flex-grow min-w-0"
                  >
                    <h4 className="font-bold text-slate-800 dark:text-gray-100 truncate">{cell.name}</h4>
                    <span className="text-[10px] text-slate-500 dark:text-gray-450 block truncate">
                      Sector: {cell.sector || 'General'}
                    </span>
                    {cell.profiles && (
                      <span className="text-[10px] text-emerald-600 font-bold block truncate mt-0.5">
                        Líder: {cell.profiles.first_name} {cell.profiles.last_name}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCell(cell.id, cell.name);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Eliminar célula"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
