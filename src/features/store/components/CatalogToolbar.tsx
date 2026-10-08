import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  label: string;
  search: string;
  onSearch: (value: string) => void;
  count: number;
  children?: ReactNode;
}

export default function CatalogToolbar({ label, search, onSearch, count, children }: Props) {
  return <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
    <label className="relative min-w-0 flex-1 basis-60">
      <span className="sr-only">{label}</span>
      <Search aria-hidden="true" size={17} className="absolute left-3 top-3 text-slate-400" />
      <input type="search" value={search} onChange={event => onSearch(event.target.value)} placeholder={label}
        className="h-11 w-full rounded-xl border border-slate-200 bg-transparent pl-10 pr-10 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-white/15 dark:text-white" />
      {search && <button type="button" aria-label="Limpiar búsqueda" onClick={() => onSearch('')} className="absolute right-1 top-1 rounded-lg p-2 text-slate-500"><X size={17} /></button>}
    </label>
    {children}
    <span role="status" className="text-xs text-slate-600 dark:text-slate-300">{count} resultados</span>
  </div>;
}
