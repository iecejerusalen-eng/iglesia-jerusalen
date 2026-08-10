import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileClock,
  RefreshCw,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import { Button } from '../../components/ui/button';
import { supabase } from '../../config/supabase';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_email: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  details: JsonValue;
}

interface AuditFilters {
  search: string;
  action: string;
  resource: string;
  fromDate: string;
  toDate: string;
}

const EMPTY_FILTERS: AuditFilters = {
  search: '',
  action: '',
  resource: '',
  fromDate: '',
  toDate: '',
};

const PAGE_SIZE = 20;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const sanitizeSearchTerm = (value: string) =>
  value.replace(/[,%()]/g, ' ').replace(/\s+/g, ' ').trim();

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));

const formatDetails = (value: JsonValue) => JSON.stringify(value, null, 2);

const AuditLogViewer = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState<AuditFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AuditFilters>(EMPTY_FILTERS);
  const [actionOptions, setActionOptions] = useState<string[]>([]);
  const [resourceOptions, setResourceOptions] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadFilterOptions = useCallback(async () => {
    try {
      const { data, error: optionsError } = await supabase
        .from('audit_logs')
        .select('action,resource')
        .order('timestamp', { ascending: false })
        .limit(500);

      if (optionsError) throw optionsError;
      const options = (data ?? []) as Array<{ action: string; resource: string }>;
      setActionOptions([...new Set(options.map((item) => item.action))].sort());
      setResourceOptions([...new Set(options.map((item) => item.resource))].sort());
    } catch (caughtError) {
      console.error('No se pudieron cargar las opciones de filtros de auditoría:', caughtError);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const cleanSearch = sanitizeSearchTerm(appliedFilters.search);

      let query = supabase
        .from('audit_logs')
        .select('id,timestamp,user_id,user_email,action,resource,resource_id,details', { count: 'exact' })
        .order('timestamp', { ascending: false })
        .range(from, to);

      if (cleanSearch) {
        query = query.or(
          `user_email.ilike.%${cleanSearch}%,action.ilike.%${cleanSearch}%,resource.ilike.%${cleanSearch}%,resource_id.ilike.%${cleanSearch}%`,
        );
      }
      if (appliedFilters.action) query = query.eq('action', appliedFilters.action);
      if (appliedFilters.resource) query = query.eq('resource', appliedFilters.resource);
      if (appliedFilters.fromDate) query = query.gte('timestamp', `${appliedFilters.fromDate}T00:00:00`);
      if (appliedFilters.toDate) query = query.lte('timestamp', `${appliedFilters.toDate}T23:59:59.999`);

      const { data, count, error: queryError } = await query;
      if (queryError) throw queryError;

      const nextLogs = (data ?? []) as AuditLog[];
      const nextTotal = count ?? 0;
      setLogs(nextLogs);
      setTotal(nextTotal);

      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
      if (page > nextTotalPages) setPage(nextTotalPages);
    } catch (caughtError) {
      console.error('No se pudo cargar la auditoría del sistema:', caughtError);
      setError(`No se pudo cargar la auditoría. ${getErrorMessage(caughtError)}`);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    const requestTimer = window.setTimeout(() => {
      void loadFilterOptions();
    }, 0);

    return () => window.clearTimeout(requestTimer);
  }, [loadFilterOptions]);

  useEffect(() => {
    const requestTimer = window.setTimeout(() => {
      void loadLogs();
    }, 0);

    return () => window.clearTimeout(requestTimer);
  }, [loadLogs]);

  const pageRange = useMemo(() => {
    if (total === 0) return '0 registros';
    const first = (page - 1) * PAGE_SIZE + 1;
    const last = Math.min(page * PAGE_SIZE, total);
    return `${first}–${last} de ${total}`;
  }, [page, total]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);
  };

  const clearFilters = () => {
    setPage(1);
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  return (
    <AnimeFadeUp className="mx-auto max-w-[1600px] space-y-6">
      <AdminHeader
        title="Auditoría del sistema"
        description="Consulta el historial inmutable de acciones administrativas, sus responsables y el contexto registrado."
        action={
          <Button variant="outline" onClick={() => void loadLogs()} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualizar
          </Button>
        }
      />

      <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-12">
          <label className="relative block lg:col-span-4">
            <span className="sr-only">Buscar en la auditoría</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              onKeyDown={(event) => { if (event.key === 'Enter') applyFilters(); }}
              placeholder="Correo, acción, recurso o ID…"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="lg:col-span-2">
            <span className="sr-only">Acción</span>
            <select value={filters.action} onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white">
              <option value="">Todas las acciones</option>
              {actionOptions.map((action) => <option key={action} value={action}>{action}</option>)}
            </select>
          </label>
          <label className="lg:col-span-2">
            <span className="sr-only">Recurso</span>
            <select value={filters.resource} onChange={(event) => setFilters((current) => ({ ...current, resource: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white">
              <option value="">Todos los recursos</option>
              {resourceOptions.map((resource) => <option key={resource} value={resource}>{resource}</option>)}
            </select>
          </label>
          <label className="lg:col-span-2">
            <span className="sr-only">Fecha inicial</span>
            <input type="date" value={filters.fromDate} max={filters.toDate || undefined} onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white" />
          </label>
          <label className="lg:col-span-2">
            <span className="sr-only">Fecha final</span>
            <input type="date" value={filters.toDate} min={filters.fromDate || undefined} onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={clearFilters}>Limpiar</Button>
          <Button onClick={applyFilters}><Search size={16} /> Aplicar filtros</Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
        {error ? (
          <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-400/20 dark:bg-red-500/10">
            <p className="font-semibold text-red-800 dark:text-red-200">{error}</p>
            <Button className="mt-4" variant="outline" onClick={() => void loadLogs()}>Intentar de nuevo</Button>
          </div>
        ) : loading ? (
          <div className="space-y-3 p-4" aria-label="Cargando auditoría">
            {Array.from({ length: 7 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileClock className="mx-auto text-slate-300 dark:text-slate-600" size={48} />
            <h2 className="mt-4 font-serif text-xl font-bold text-slate-800 dark:text-white">No hay registros con estos filtros</h2>
            <p className="mt-1 text-sm text-slate-500">Amplía el rango de fechas o limpia los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 font-black">Fecha</th>
                  <th className="px-4 py-3 font-black">Usuario</th>
                  <th className="px-4 py-3 font-black">Acción</th>
                  <th className="px-4 py-3 font-black">Recurso</th>
                  <th className="px-4 py-3 font-black">Referencia</th>
                  <th className="px-4 py-3 text-right font-black">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="text-sm transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatDate(log.timestamp)}</td>
                    <td className="max-w-60 truncate px-4 py-3 font-semibold text-slate-800 dark:text-slate-100" title={log.user_email || log.user_id}>{log.user_email || log.user_id}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">{log.action}</span></td>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{log.resource}</td>
                    <td className="max-w-48 truncate px-4 py-3 font-mono text-xs text-slate-500" title={log.resource_id || ''}>{log.resource_id || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}><Eye size={15} /> Ver</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="flex flex-col gap-3 border-t border-slate-200/80 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-slate-500">{pageRange}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={16} /> Anterior</Button>
            <span className="min-w-20 text-center text-xs font-bold text-slate-600 dark:text-slate-300">Página {page} de {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Siguiente <ChevronRight size={16} /></Button>
          </div>
        </footer>
      </section>

      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="audit-detail-title">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/20 bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-amber-300">Registro de solo lectura</p>
                <h2 id="audit-detail-title" className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">{selectedLog.action} · {selectedLog.resource}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedLog(null)} aria-label="Cerrar detalle"><X size={20} /></Button>
            </div>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><dt className="flex items-center gap-2 text-xs font-black uppercase text-slate-400"><Clock3 size={14} /> Fecha</dt><dd className="mt-2 text-sm font-semibold text-slate-800 dark:text-white">{formatDate(selectedLog.timestamp)}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><dt className="flex items-center gap-2 text-xs font-black uppercase text-slate-400"><UserRound size={14} /> Usuario</dt><dd className="mt-2 break-all text-sm font-semibold text-slate-800 dark:text-white">{selectedLog.user_email || selectedLog.user_id}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><dt className="flex items-center gap-2 text-xs font-black uppercase text-slate-400"><Activity size={14} /> Acción y recurso</dt><dd className="mt-2 text-sm font-semibold text-slate-800 dark:text-white">{selectedLog.action} · {selectedLog.resource}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><dt className="text-xs font-black uppercase text-slate-400">ID de referencia</dt><dd className="mt-2 break-all font-mono text-xs text-slate-700 dark:text-slate-200">{selectedLog.resource_id || 'Sin referencia'}</dd></div>
            </dl>
            <div className="mt-5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Contexto registrado</h3>
              <pre className="mt-2 max-h-80 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-emerald-200">{formatDetails(selectedLog.details)}</pre>
            </div>
            <p className="mt-4 break-all text-[11px] text-slate-400">ID de auditoría: {selectedLog.id}</p>
          </div>
        </div>
      )}
    </AnimeFadeUp>
  );
};

export default AuditLogViewer;
