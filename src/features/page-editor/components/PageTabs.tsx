import { PAGES_METADATA } from '../constants';

interface PageTabsProps {
  selectedPage: 'home' | 'about';
  onSelectPage: (page: 'home' | 'about') => void;
}

export const PageTabs = ({ selectedPage, onSelectPage }: PageTabsProps) => {
  return (
    <div className="flex gap-4 p-1.5 bg-slate-100 dark:bg-slate-950 rounded-2xl w-fit border border-slate-200 dark:border-white/10">
      {(Object.keys(PAGES_METADATA) as Array<'home' | 'about'>).map((pageKey) => (
        <button
          key={pageKey}
          type="button"
          onClick={() => onSelectPage(pageKey)}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            selectedPage === pageKey
              ? 'bg-white dark:bg-slate-900 text-primary dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {PAGES_METADATA[pageKey].name}
        </button>
      ))}
    </div>
  );
};
