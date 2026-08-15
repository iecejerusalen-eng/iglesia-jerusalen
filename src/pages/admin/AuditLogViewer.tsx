import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileClock,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import { Button } from '../../components/ui/button';
import { supabase } from '../../config/supabase';
import { usePermissions } from '../../hooks/usePermissions';

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

interface AuditFilterQuery {
  or: (filters: string) => this;
  eq: (column: string, value: string) => this;
  gte: (column: string, value: string) => this;
  lte: (column: string, value: string) => this;
}

const EMPTY_FILTERS: AuditFilters = { search: '', action: '', resource: '', fromDate: '', toDate: '' };
const PAGE_SIZE = 20;
const EXPORT_LIMIT = 5000;

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);
const sanitizeSearchTerm = (value: string) => value.replace(/[,%()]/g, ' ').replace(/\s+/g, ' ').trim();
const formatDate = (value: string) => new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const formatDetails = (value: JsonValue) => JSON.stringify(value, null, 2);
const dateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

const actionTone = (action: string) => {
  if (action.includes('DELETE')) return 'border-rose-400/25 bg-rose-500/10 text-rose-700 dark:text-rose-200';
  if (action.includes('CREATE') || action.includes('LOGIN')) return 'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200';
  if (action.includes('UPDATE')) return 'border-amber-400/25 bg-amber-500/10 text-amber-700 dark:text-amber-200';
  return 'border-blue-400/25 bg-blue-500/10 text-blue-700 dark:text-blue-200';
};

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
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filterOptionsError, setFilterOptionsError] = useState<string | null>(null);
  const { hasPermission } = usePermissions();
  const canExport = hasPermission('users', 'edit');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  const applyQueryFilters = useCallback(<T extends AuditFilterQuery>(query: T, nextFilters: AuditFilters): T => {
    const cleanSearch = sanitizeSearchTerm(nextFilters.search);
    let filteredQuery: T = query;

    if (cleanSearch) filteredQuery = filteredQuery.or(`user_email.ilike.%${cleanSearch}%,action.ilike.%${cleanSearch}%,resource.ilike.%${cleanSearch}%,resource_id.ilike.%${cleanSearch}%`);
    if (nextFilters.action) filteredQuery = filteredQuery.eq('action', nextFilters.action);
    if (nextFilters.resource) filteredQuery = filteredQuery.eq('resource', nextFilters.resource);
    if (nextFilters.fromDate) filteredQuery = filteredQuery.gte('timestamp', `${nextFilters.fromDate}T00:00:00`);
    if (nextFilters.toDate) filteredQuery = filteredQuery.lte('timestamp', `${nextFilters.toDate}T23:59:59.999`);
    return filteredQuery;
  }, []);

  const loadFilterOptions = useCallback(async () => {
    try {
      setFilterOptionsError(null);
      const { data, error: optionsError } = await supabase.from('audit_logs').select('action,resource').order('timestamp', { ascending: false }).limit(500);
      if (optionsError) throw optionsError;
      const options = (data ?? []) as Array<{ action: string; resource: string }>;
      setActionOptions([...new Set(options.map((item) => item.action))].sort());
      setResourceOptions([...new Set(options.map((item) => item.resource))].sort());
    } catch (caughtError) {
      console.error('No se pudieron cargar las opciones de filtros de auditoría:', caughtError);
      setFilterOptionsError(`No se pudieron cargar las opciones de filtros. ${getErrorMessage(caughtError)}`);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const baseQuery = supabase
        .from('audit_logs')
        .select('id,timestamp,user_id,user_email,action,resource,resource_id,details', { count: 'exact' })
        .order('timestamp', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      const { data, count, error: queryError } = await applyQueryFilters(baseQuery, appliedFilters);
      if (queryError) throw queryError;

      const nextLogs = (data ?? []) as AuditLog[];
      const nextTotal = count ?? 0;
      setLogs(nextLogs);
      setTotal(nextTotal);
      setLastUpdated(new Date());
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
      if (page > nextTotalPages) setPage(nextTotalPages);
    } catch (caughtError) {
      console.error('No se pudo cargar la auditoría del sistema:', caughtError);
      setError(`No se pudo cargar la auditoría. ${getErrorMessage(caughtError)}`);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, applyQueryFilters, page]);

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => {
      void loadFilterOptions();
      void loadLogs();
    }, 0);
    return () => window.clearTimeout(initialLoadTimer);
  }, [loadFilterOptions, loadLogs]);

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      void loadLogs();
      void loadFilterOptions();
    }, 60_000);
    return () => window.clearInterval(refreshTimer);
  }, [loadFilterOptions, loadLogs]);

  const pageRange = useMemo(() => {
    if (total === 0) return '0 registros';
    return `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} de ${total}`;
  }, [page, total]);

  const visibleActors = useMemo(() => new Set(logs.map((log) => log.user_email || log.user_id)).size, [logs]);
  const leadingAction = useMemo(() => {
    const counts = new Map<string, number>();
    logs.forEach((log) => counts.set(log.action, (counts.get(log.action) ?? 0) + 1));
    return [...counts.entries()].sort(([, left], [, right]) => right - left)[0]?.[0] ?? '—';
  }, [logs]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);
  };

  const clearFilters = () => {
    setPage(1);
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const setDatePreset = (days: number | null) => {
    if (days === null) {
      clearFilters();
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    const nextFilters = { ...filters, fromDate: dateInputValue(start), toDate: dateInputValue(end) };
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const baseQuery = supabase
        .from('audit_logs')
        .select('timestamp,user_email,user_id,action,resource,resource_id,details')
        .order('timestamp', { ascending: false })
        .limit(EXPORT_LIMIT);
      const { data, error: exportError } = await applyQueryFilters(baseQuery, appliedFilters);
      if (exportError) throw exportError;
      const rows = (data ?? []) as Omit<AuditLog, 'id'>[];
      const header = ['Fecha', 'Usuario', 'Acción', 'Recurso', 'Referencia', 'Contexto'];
      const body = rows.map((log) => [formatDate(log.timestamp), log.user_email || log.user_id, log.action, log.resource, log.resource_id || '', JSON.stringify(log.details)].map(csvCell).join(','));
      const blob = new Blob([`\uFEFF${[header.map(csvCell).join(','), ...body].join('\n')}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `auditoria-${dateInputValue(new Date())}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caughtError) {
      console.error('No se pudo exportar la auditoría:', caughtError);
      setError(`No se pudo exportar la auditoría. ${getErrorMessage(caughtError)}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AnimeFadeUp className="relative mx-auto max-w-[1600px] space-y-5 overflow-hidden pb-4">
      <div aria-hidden="true" className="pointer-events-none absolute -left-36 top-20 size-80 rounded-full bg-blue-500/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-56 size-72 rounded-full bg-amber-300/10 blur-3xl" />
      <AdminHeader
        eyebrow="Seguridad y trazabilidad"
        title="Actividad administrativa"
        description="Monitorea las acciones registradas, filtra incidentes y conserva evidencia operativa de cada cambio."
        action={<div className="flex gap-2"><Button variant="outline" onClick={() => void loadLogs()} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualizar</Button>{canExport && <Button variant="glass-primary" onClick={() => void handleExport()} loading={exporting} disabled={loading}><Download size={16} /> Exportar</Button>}</div>}
      />

      <section className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de la consulta">
        {[
          { label: 'Registros encontrados', value: total.toLocaleString('es-CO'), detail: activeFilterCount ? `${activeFilterCount} filtros activos` : 'Consulta completa', icon: Activity, tone: 'from-blue-500/15 to-cyan-400/5 text-blue-700 dark:text-blue-200' },
          { label: 'En esta vista', value: logs.length.toString(), detail: pageRange, icon: ShieldCheck, tone: 'from-violet-500/15 to-fuchsia-400/5 text-violet-700 dark:text-violet-200' },
          { label: 'Responsables visibles', value: visibleActors.toString(), detail: 'En los resultados actuales', icon: UsersRound, tone: 'from-emerald-500/15 to-teal-400/5 text-emerald-700 dark:text-emerald-200' },
          { label: 'Acción predominante', value: leadingAction, detail: 'En los resultados actuales', icon: Filter, tone: 'from-amber-400/20 to-orange-400/5 text-amber-700 dark:text-amber-200' },
        ].map(({ label, value, detail, icon: Icon, tone }) => <article key={label} className={`rounded-3xl border border-white/70 bg-gradient-to-br ${tone} p-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10`}><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">{label}</p><p className="mt-2 truncate text-2xl font-black tracking-tight" title={value}>{value}</p><p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{detail}</p></div><span className="grid size-10 place-items-center rounded-2xl border border-white/50 bg-white/40 shadow-sm dark:border-white/10 dark:bg-slate-950/20"><Icon size={19} /></span></div></article>)}
      </section>

      <section className="relative rounded-[1.75rem] border border-white/70 bg-white/65 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white">Explorar el historial</h2><p className="mt-0.5 text-xs text-slate-500">Los filtros se aplican juntos para acotar la investigación.</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="glass" onClick={() => setDatePreset(0)}><CalendarDays size={14} /> Hoy</Button><Button size="sm" variant="glass" onClick={() => setDatePreset(6)}>7 días</Button><Button size="sm" variant="glass" onClick={() => setDatePreset(29)}>30 días</Button><Button size="sm" variant="ghost" onClick={() => setDatePreset(null)}>Ver todo</Button></div></div>
        <div className="grid gap-3 lg:grid-cols-12">
          <label className="relative block lg:col-span-4"><span className="sr-only">Buscar en la auditoría</span><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="search" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter') applyFilters(); }} placeholder="Correo, acción, recurso o referencia…" className="h-11 w-full rounded-2xl border border-slate-200/80 bg-white/65 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-slate-950/45 dark:text-white" /></label>
          <label className="lg:col-span-2"><span className="sr-only">Acción</span><select value={filters.action} onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200/80 bg-white/65 px-3 text-sm dark:border-white/10 dark:bg-slate-950/45 dark:text-white"><option value="">Todas las acciones</option>{actionOptions.map((action) => <option key={action} value={action}>{action}</option>)}</select></label>
          <label className="lg:col-span-2"><span className="sr-only">Recurso</span><select value={filters.resource} onChange={(event) => setFilters((current) => ({ ...current, resource: event.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200/80 bg-white/65 px-3 text-sm dark:border-white/10 dark:bg-slate-950/45 dark:text-white"><option value="">Todos los recursos</option>{resourceOptions.map((resource) => <option key={resource} value={resource}>{resource}</option>)}</select></label>
          <label className="lg:col-span-2"><span className="sr-only">Fecha inicial</span><input type="date" value={filters.fromDate} max={filters.toDate || undefined} onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200/80 bg-white/65 px-3 text-sm dark:border-white/10 dark:bg-slate-950/45 dark:text-white" /></label>
          <label className="lg:col-span-2"><span className="sr-only">Fecha final</span><input type="date" value={filters.toDate} min={filters.fromDate || undefined} onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200/80 bg-white/65 px-3 text-sm dark:border-white/10 dark:bg-slate-950/45 dark:text-white" /></label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-semibold text-slate-500">{activeFilterCount ? `${activeFilterCount} filtros aplicados` : 'Sin filtros aplicados'}</p><div className="flex gap-2"><Button variant="ghost" onClick={clearFilters}>Limpiar</Button><Button onClick={applyFilters}><Search size={16} /> Aplicar filtros</Button></div></div>
        {filterOptionsError && <p role="status" className="mt-3 rounded-xl border border-amber-300/50 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-400/20 dark:text-amber-200">{filterOptionsError}</p>}
      </section>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/65 shadow-[0_18px_55px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60">
        <header className="flex flex-col gap-2 border-b border-slate-200/70 px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black tracking-tight text-slate-900 dark:text-white">Registro de actividad</h2><p className="mt-0.5 text-xs text-slate-500">Selecciona un registro para ver el contexto completo.</p></div><p className="text-xs font-medium text-slate-400" aria-live="polite">{lastUpdated ? `Actualizado ${formatDate(lastUpdated.toISOString())}` : 'Actualizando…'}</p></header>
        {error ? <div className="m-4 rounded-2xl border border-red-300/40 bg-red-500/10 p-6 text-center"><p className="font-semibold text-red-800 dark:text-red-200">{error}</p><Button className="mt-4" variant="outline" onClick={() => void loadLogs()}>Intentar de nuevo</Button></div> : loading ? <div className="space-y-3 p-4" aria-label="Cargando auditoría">{Array.from({ length: 7 }, (_, index) => <div key={index} className="h-[76px] animate-pulse rounded-2xl bg-slate-100/80 dark:bg-white/5" />)}</div> : logs.length === 0 ? <div className="px-6 py-16 text-center"><FileClock className="mx-auto text-slate-300 dark:text-slate-600" size={48} /><h2 className="mt-4 font-serif text-xl font-bold text-slate-800 dark:text-white">No hay registros con estos filtros</h2><p className="mt-1 text-sm text-slate-500">Amplía el rango de fechas o limpia los filtros para volver a explorar.</p><Button className="mt-5" variant="outline" onClick={clearFilters}>Limpiar filtros</Button></div> : <><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[940px] text-left"><thead className="border-b border-slate-200/70 bg-white/35 text-[10px] uppercase tracking-[0.14em] text-slate-500 dark:border-white/10 dark:bg-white/[0.03]"><tr><th className="px-5 py-3.5 font-black">Momento</th><th className="px-4 py-3.5 font-black">Responsable</th><th className="px-4 py-3.5 font-black">Acción</th><th className="px-4 py-3.5 font-black">Recurso</th><th className="px-4 py-3.5 font-black">Referencia</th><th className="px-5 py-3.5 text-right font-black">Detalle</th></tr></thead><tbody className="divide-y divide-slate-100/80 dark:divide-white/5">{logs.map((log) => <tr key={log.id} className="group text-sm transition hover:bg-white/70 dark:hover:bg-white/[0.04]"><td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-500">{formatDate(log.timestamp)}</td><td className="max-w-60 truncate px-4 py-4 font-semibold text-slate-800 dark:text-slate-100" title={log.user_email || log.user_id}>{log.user_email || log.user_id}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wide ${actionTone(log.action)}`}>{log.action}</span></td><td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">{log.resource}</td><td className="max-w-48 truncate px-4 py-4 font-mono text-xs text-slate-500" title={log.resource_id || ''}>{log.resource_id || '—'}</td><td className="px-5 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}><Eye size={15} /> Ver</Button></td></tr>)}</tbody></table></div><div className="divide-y divide-slate-100 dark:divide-white/5 md:hidden">{logs.map((log) => <button key={log.id} type="button" onClick={() => setSelectedLog(log)} className="w-full px-5 py-4 text-left transition hover:bg-white/70 dark:hover:bg-white/[0.04]"><div className="flex items-start justify-between gap-3"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${actionTone(log.action)}`}>{log.action}</span><span className="shrink-0 text-[11px] text-slate-400">{formatDate(log.timestamp)}</span></div><p className="mt-3 truncate text-sm font-bold text-slate-800 dark:text-slate-100">{log.resource}</p><p className="mt-1 truncate text-xs text-slate-500">{log.user_email || log.user_id}</p></button>)}</div></>}
        <footer className="flex flex-col gap-3 border-t border-slate-200/70 px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-semibold text-slate-500">{pageRange}</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={16} /> Anterior</Button><span className="min-w-24 text-center text-xs font-bold text-slate-600 dark:text-slate-300">Página {page} de {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Siguiente <ChevronRight size={16} /></Button></div></footer>
      </section>

      {selectedLog && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-md sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="audit-detail-title"><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] border border-white/30 bg-white/90 p-5 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/90 sm:rounded-[2rem] sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700 dark:text-amber-300"><ShieldCheck size={14} /> Registro de solo lectura</p><h2 id="audit-detail-title" className="mt-2 font-serif text-2xl font-bold text-slate-900 dark:text-white">{selectedLog.action} · {selectedLog.resource}</h2></div><Button variant="ghost" size="icon" onClick={() => setSelectedLog(null)} aria-label="Cerrar detalle"><X size={20} /></Button></div><dl className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/60 bg-white/45 p-4 dark:border-white/10 dark:bg-white/5"><dt className="flex items-center gap-2 text-xs font-black uppercase text-slate-400"><Clock3 size={14} /> Fecha</dt><dd className="mt-2 text-sm font-semibold text-slate-800 dark:text-white">{formatDate(selectedLog.timestamp)}</dd></div><div className="rounded-2xl border border-white/60 bg-white/45 p-4 dark:border-white/10 dark:bg-white/5"><dt className="flex items-center gap-2 text-xs font-black uppercase text-slate-400"><UserRound size={14} /> Responsable</dt><dd className="mt-2 break-all text-sm font-semibold text-slate-800 dark:text-white">{selectedLog.user_email || selectedLog.user_id}</dd></div><div className="rounded-2xl border border-white/60 bg-white/45 p-4 dark:border-white/10 dark:bg-white/5"><dt className="flex items-center gap-2 text-xs font-black uppercase text-slate-400"><Activity size={14} /> Acción y recurso</dt><dd className="mt-2 text-sm font-semibold text-slate-800 dark:text-white">{selectedLog.action} · {selectedLog.resource}</dd></div><div className="rounded-2xl border border-white/60 bg-white/45 p-4 dark:border-white/10 dark:bg-white/5"><dt className="text-xs font-black uppercase text-slate-400">ID de referencia</dt><dd className="mt-2 break-all font-mono text-xs text-slate-700 dark:text-slate-200">{selectedLog.resource_id || 'Sin referencia'}</dd></div></dl><div className="mt-5"><h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Contexto registrado</h3><pre className="mt-2 max-h-80 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-emerald-200">{formatDetails(selectedLog.details)}</pre></div><p className="mt-4 break-all text-[11px] text-slate-400">ID de auditoría: {selectedLog.id}</p></div></div>}
    </AnimeFadeUp>
  );
};

export default AuditLogViewer;
