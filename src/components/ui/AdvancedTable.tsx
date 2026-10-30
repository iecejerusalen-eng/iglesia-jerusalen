import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  getSortedRowModel,
} from '@tanstack/react-table';
import type { SortingState, ColumnDef, VisibilityState } from '@tanstack/react-table';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, List, Search, SlidersHorizontal } from 'lucide-react';

export interface AdvancedTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
}

export function AdvancedTable<TData>({ data, columns, onRowClick, isLoading }: AdvancedTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showConfig, setShowConfig] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, globalFilter },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) =>
      row.getVisibleCells().some((cell) => String(cell.getValue() ?? '').toLocaleLowerCase().includes(String(filterValue).toLocaleLowerCase())),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });
  const rows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white/70 p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 dark:border-white/10 dark:bg-slate-950 sm:max-w-md">
          <Search size={17} className="shrink-0 text-slate-500" aria-hidden="true" />
          <span className="sr-only">Buscar en la tabla</span>
          <input value={globalFilter} onChange={(event) => { setGlobalFilter(event.target.value); table.setPageIndex(0); }} placeholder="Buscar registros…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </label>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300" aria-live="polite">
            <List size={18} className="text-primary dark:text-gold" />
            <span>{isLoading ? 'Cargando…' : `${filteredCount} ${filteredCount === 1 ? 'registro' : 'registros'}`}</span>
          </div>
          <button type="button" aria-expanded={showConfig} onClick={() => setShowConfig(!showConfig)} className="flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-slate-800 dark:hover:bg-slate-700">
            <SlidersHorizontal size={16} /> Columnas
          </button>
        </div>
      </div>

      {showConfig && <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/80 sm:grid-cols-3 md:grid-cols-4">
        {table.getAllLeafColumns().map((column) => <label key={column.id} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} className="size-4 accent-primary" />
          {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
        </label>)}
      </div>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white/70 shadow-sm dark:border-white/10 dark:bg-slate-950/60" aria-busy={isLoading}>
        <table className="w-full border-collapse text-left">
          <thead>{table.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id} className="border-b border-gray-200 bg-gray-50/80 dark:border-white/10 dark:bg-slate-900/80">
            {headerGroup.headers.map((header) => <th key={header.id} colSpan={header.colSpan} scope="col" aria-sort={header.column.getCanSort() ? header.column.getIsSorted() === 'asc' ? 'ascending' : header.column.getIsSorted() === 'desc' ? 'descending' : 'none' : undefined} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              {header.isPlaceholder ? null : header.column.getCanSort() ? <button type="button" onClick={header.column.getToggleSortingHandler()} className="inline-flex min-h-9 items-center gap-1 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 hover:text-gray-950 dark:hover:text-white">
                {flexRender(header.column.columnDef.header, header.getContext())}
                {header.column.getIsSorted() === 'asc' ? <ChevronUp size={14} aria-hidden="true" /> : header.column.getIsSorted() === 'desc' ? <ChevronDown size={14} aria-hidden="true" /> : null}
              </button> : flexRender(header.column.columnDef.header, header.getContext())}
            </th>)}
          </tr>)}</thead>
          <tbody>
            {isLoading ? Array.from({ length: 5 }).map((_, rowIndex) => <tr key={rowIndex} className="border-b border-gray-100 dark:border-white/5" aria-hidden="true">{table.getVisibleLeafColumns().map((column, cellIndex) => <td key={column.id} className="px-4 py-4"><div className={`h-5 animate-pulse rounded bg-gray-200 dark:bg-slate-800 ${cellIndex % 2 ? 'w-2/3' : 'w-4/5'}`} /></td>)}</tr>)
              : rows.length === 0 ? <tr><td colSpan={table.getVisibleLeafColumns().length || 1} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"><div className="flex flex-col items-center justify-center gap-2"><List size={32} className="opacity-30" aria-hidden="true" /><p>{globalFilter ? 'No hay coincidencias. Prueba con otras palabras.' : 'Aún no hay registros disponibles.'}</p></div></td></tr>
                : rows.map((row) => <tr key={row.id} onClick={() => onRowClick?.(row.original)} onKeyDown={(event) => { if (onRowClick && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onRowClick(row.original); } }} tabIndex={onRowClick ? 0 : undefined} className={`border-b border-gray-100 transition-colors last:border-0 dark:border-white/5 ${onRowClick ? 'cursor-pointer hover:bg-gray-50/70 focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-white/5' : ''}`}>
                  {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                </tr>)}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex min-h-11 items-center gap-2">Filas por página
          <select aria-label="Filas por página" value={table.getState().pagination.pageSize} onChange={(event) => table.setPageSize(Number(event.target.value))} className="min-h-10 rounded-lg border border-gray-200 bg-white px-2 dark:border-white/10 dark:bg-slate-900">
            {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span aria-live="polite">{filteredCount ? `${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–${Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredCount)} de ${filteredCount}` : '0 de 0'}</span>
          <button type="button" aria-label="Página anterior" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} className="grid size-11 place-items-center rounded-lg border border-gray-200 disabled:opacity-40 dark:border-white/10"><ChevronLeft size={18} /></button>
          <button type="button" aria-label="Página siguiente" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} className="grid size-11 place-items-center rounded-lg border border-gray-200 disabled:opacity-40 dark:border-white/10"><ChevronRight size={18} /></button>
        </div>
      </div>
    </div>
  );
}
