
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
