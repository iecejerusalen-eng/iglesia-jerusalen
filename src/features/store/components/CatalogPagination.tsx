interface Props { page: number; total: number; pageSize: number; onPage: (page: number) => void }
export default function CatalogPagination({ page, total, pageSize, onPage }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages === 1) return null;
  return <nav aria-label="Páginas del listado" className="flex items-center justify-between gap-3 py-4 text-sm text-slate-700 dark:text-slate-300">
    <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="min-h-11 rounded-xl border px-4 disabled:opacity-40">Anterior</button>
    <span>Página {page} de {pages}</span>
    <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="min-h-11 rounded-xl border px-4 disabled:opacity-40">Siguiente</button>
  </nav>;
}
