import { FileText, Home, Info } from 'lucide-react';
import { PAGES_METADATA } from '../constants';

interface PageTabsProps {
  selectedPage: 'home' | 'about';
  onSelectPage: (page: 'home' | 'about') => void;
}

export const PageTabs = ({ selectedPage, onSelectPage }: PageTabsProps) => {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-label="Seleccionar página pública">
      {(Object.keys(PAGES_METADATA) as Array<'home' | 'about'>).map((pageKey) => (
        <button
          key={pageKey}
          type="button"
          onClick={() => onSelectPage(pageKey)}
          className={`flex min-h-20 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all cursor-pointer ${
            selectedPage === pageKey
              ? 'border-blue-300 bg-blue-50 text-primary shadow-sm dark:border-blue-500/40 dark:bg-blue-950/30 dark:text-white'
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${selectedPage === pageKey ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/5'}`}>
            {pageKey === 'home' ? <Home size={18} /> : <Info size={18} />}
          </span>
          <span className="min-w-0"><strong className="block text-sm font-black">{PAGES_METADATA[pageKey].name}</strong><span className="mt-1 block text-xs font-medium text-slate-400">{pageKey === 'home' ? 'Entrada principal y llamados' : 'Identidad, historia y liderazgo'}</span></span>
          <FileText size={15} className="ml-auto shrink-0 opacity-40" />
        </button>
      ))}
    </div>
  );
};
