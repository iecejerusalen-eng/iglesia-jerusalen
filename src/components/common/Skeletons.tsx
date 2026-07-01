
export const CardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs flex items-center justify-between animate-pulse">
      <div className="space-y-2.5 flex-1">
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-24"></div>
        <div className="h-7 bg-gray-200 dark:bg-slate-700 rounded w-16"></div>
      </div>
      <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-xl"></div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) => {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs overflow-hidden animate-pulse">
      <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-150 dark:border-white/10 flex justify-between items-center">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-48"></div>
        <div className="h-8 bg-gray-250 dark:bg-slate-600 rounded w-28"></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-150 dark:border-white/10">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="py-4 px-6">
                  <div className="h-3 bg-gray-250 dark:bg-slate-600 rounded w-16"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/10">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="py-4 px-6">
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-24"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ChartSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs space-y-6 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-48 mb-2"></div>
      <div className="h-60 w-full flex items-end gap-3 pt-4 border-b border-l border-gray-150 dark:border-white/20 pb-2 pl-2">
        <div className="bg-gray-100 dark:bg-slate-700 rounded-t w-full h-1/3"></div>
        <div className="bg-gray-100 dark:bg-slate-700 rounded-t w-full h-2/3"></div>
        <div className="bg-gray-100 dark:bg-slate-700 rounded-t w-full h-1/2"></div>
        <div className="bg-gray-100 dark:bg-slate-700 rounded-t w-full h-4/5"></div>
        <div className="bg-gray-100 dark:bg-slate-700 rounded-t w-full h-2/5"></div>
        <div className="bg-gray-100 dark:bg-slate-700 rounded-t w-full h-3/5"></div>
      </div>
    </div>
  );
};

/** Full-page skeleton shown when a lazy route is loading via Suspense */
export const PageSkeleton = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col animate-pulse">
      {/* Navbar placeholder */}
      <div className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-white/10 px-6 flex items-center gap-4">
        <div className="h-8 w-8 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
        <div className="flex-1" />
        <div className="h-8 w-8 bg-gray-200 dark:bg-slate-700 rounded-full" />
      </div>
      {/* Content placeholder */}
      <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
        <div className="h-8 w-64 bg-gray-200 dark:bg-slate-700 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-150 dark:border-white/10" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/** List skeleton for pages that show a grid/list of cards (Sermons, Store, Events…) */
export const ListSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-150 dark:border-white/10 overflow-hidden">
          <div className="h-40 bg-gray-200 dark:bg-slate-700 w-full" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-3 bg-gray-100 dark:bg-slate-600 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

/** Form skeleton for admin detail/edit pages */
export const FormSkeleton = ({ fields = 6 }: { fields?: number }) => {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-150 dark:border-white/10 p-6 space-y-5 animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-48" />
      <div className="h-px bg-gray-100 dark:bg-white/10" />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-24" />
          <div className="h-10 bg-gray-100 dark:bg-slate-700/50 rounded-lg w-full" />
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-2">
        <div className="h-10 bg-gray-100 dark:bg-slate-700 rounded-lg w-24" />
        <div className="h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-32" />
      </div>
    </div>
  );
};
