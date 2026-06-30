import { Filter } from 'lucide-react';
import { useMinistries } from '../hooks/useLogos';

interface LogosFilterBarProps {
  filterMinistry: string;
  setFilterMinistry: (val: string) => void;
  filterVariant: string;
  setFilterVariant: (val: string) => void;
}

export default function LogosFilterBar({
  filterMinistry,
  setFilterMinistry,
  filterVariant,
  setFilterVariant
}: LogosFilterBarProps) {
  const { data: ministries = [] } = useMinistries();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm p-4 flex flex-wrap items-center gap-4 justify-between">
      <div className="flex items-center gap-2">
        <Filter className="text-gray-400" size={18} />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filtros:</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Ministry Filter */}
        <div>
          <label htmlFor="filter_ministry" className="sr-only">Filtrar por Ministerio</label>
          <select
            id="filter_ministry"
            value={filterMinistry}
            onChange={(e) => setFilterMinistry(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg text-xs bg-white dark:bg-slate-900 focus:outline-none"
          >
            <option value="all">Todos los Propietarios</option>
            <option value="general">Iglesia General</option>
            {ministries.map((min) => (
              <option key={min.id} value={min.id}>
                {min.name}
              </option>
            ))}
          </select>
        </div>

        {/* Variant Filter */}
        <div>
          <label htmlFor="filter_variant" className="sr-only">Filtrar por Variante</label>
          <select
            id="filter_variant"
            value={filterVariant}
            onChange={(e) => setFilterVariant(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg text-xs bg-white dark:bg-slate-900 focus:outline-none"
          >
            <option value="all">Todas las Variantes</option>
            <option value="cuadrado">Cuadrados</option>
            <option value="circular">Circulares</option>
            <option value="vertical">Verticales</option>
            <option value="horizontal">Horizontales</option>
          </select>
        </div>
      </div>
    </div>
  );
}
