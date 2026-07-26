import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  SortingState,
  ColumnDef,
  VisibilityState,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, Eye, EyeOff, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AdvancedTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  enableRowSelection?: boolean;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
}

export function AdvancedTable<TData>({ data, columns, onRowClick, isLoading }: AdvancedTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showConfig, setShowConfig] = useState(false);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col space-y-4">
      {/* Table Toolbar */}
      <div className="flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <List size={18} className="text-primary dark:text-gold" />
          <span>{data.length} Registros</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <SlidersHorizontal size={16} />
            Configurar Columnas
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl shadow-sm grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {table.getAllLeafColumns().map(column => {
                return (
                  <label key={column.id} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      className="rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                    />
                    {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                  </label>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10 shadow-sm bg-white/40 dark:bg-slate-950/40 backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-slate-900/50">
                {headerGroup.headers.map(header => {
                  return (
                    <th key={header.id} colSpan={header.colSpan} className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none">
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? 'cursor-pointer select-none flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors'
                              : '',
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: <ChevronUp size={14} />,
                            desc: <ChevronDown size={14} />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              // Skeletons
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-white/5">
                  {columns.map((col, i) => (
                    <td key={i} className="px-4 py-4">
                      <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" style={{ width: Math.random() * 50 + 50 + '%' }}></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <List size={32} className="opacity-20" />
                    <p>No hay datos disponibles en esta vista.</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row.original)}
                  className={`border-b border-gray-100 dark:border-white/5 transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/5' : ''
                  }`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
