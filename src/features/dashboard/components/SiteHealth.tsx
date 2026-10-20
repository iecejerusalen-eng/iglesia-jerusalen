import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '../../../config/supabase';
import { usePermissions } from '../../../hooks/usePermissions';
import { readSessionErrors } from '../../../utils/sessionErrors';

interface HealthResult {
  checkedAt: string;
  scope: string;
  results: { path: string; status: number | null; ok: boolean; detail: string }[];
}

const formatDate = (value: string | null) => value
  ? new Date(value).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
  : 'Sin fecha registrada';

export default function SiteHealth() {
  const { hasPermission } = usePermissions();
  const [result, setResult] = useState<HealthResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState(readSessionErrors);
  const canSeeSecurity = hasPermission('users', 'view');
  const security = useQuery({
    queryKey: ['admin-security-checks'],
    enabled: canSeeSecurity,
    queryFn: async () => {
      const response = await supabase.from('admin_security_checks')
        .select('key,status,summary,source_url,checked_at').order('key');
      if (response.error) throw response.error;
      return response.data;
    },
  });

  const check = async () => {
    setBusy(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      if (session.error) throw session.error;
      if (!session.data.session) throw new Error('Inicia sesión nuevamente.');
      const response = await fetch('/api/admin-health', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.data.session.access_token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo comprobar el sitio.');
      setResult(payload as HealthResult);
      setErrors(readSessionErrors());
    } catch (caught) {
      console.error('No se pudo revisar salud', caught);
      setError(caught instanceof Error ? caught.message : 'No se pudo comprobar el sitio.');
    } finally {
      setBusy(false);
    }
  };

  const securityRows = security.data ?? [];
  const securitySummary = {
    pending: securityRows.filter((item) => item.status === 'pending').length,
    reviewed: securityRows.filter((item) => item.status === 'reviewed').length,
    resolved: securityRows.filter((item) => item.status === 'resolved').length,
  };

  return (
    <section className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60" aria-labelledby="site-health-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="site-health-title" className="font-serif text-xl font-bold">Salud del sitio</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Fuentes, estado y hora de la última revisión disponible.</p>
        </div>
        <button type="button" disabled={busy} onClick={() => void check()} className="min-h-11 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-50">
          {busy ? 'Comprobando…' : 'Comprobar HTTPS y enlaces'}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Esta comprobación manual verifica páginas y enlaces desde el servidor. No representa una monitorización continua.</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
      {result && <>
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">Última comprobación manual: {formatDate(result.checkedAt)} · {result.scope}</p>
        <ul className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
          {result.results.map((item) => <li key={item.path} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
            <a className="min-h-11 break-all font-semibold underline underline-offset-2 focus-visible:outline-2" href={`https://www.iecejerusalen.com${item.path}`} target="_blank" rel="noreferrer">{item.path}</a>
            <span className={item.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}>{item.status ?? 'Red'} · {item.detail}</span>
          </li>)}
        </ul>
      </>}

      <details className="mt-4 border-t border-slate-200 pt-3 dark:border-white/10">
        <summary className="min-h-11 cursor-pointer text-sm font-semibold">Errores de esta pestaña · {errors.length}</summary>
        <p className="text-xs text-slate-500 dark:text-slate-400">Registro local de rutas y hora, sin mensajes ni datos personales; no es un registro global de visitantes.</p>
        <button type="button" onClick={() => setErrors(readSessionErrors())} className="min-h-11 text-sm underline focus-visible:outline-2">Actualizar errores</button>
        <ul className="text-xs text-slate-600 dark:text-slate-300">{errors.map((item, index) => <li key={`${item.path}:${item.at}:${index}`}>{item.path} · {formatDate(item.at)}</li>)}</ul>
      </details>

      {hasPermission('editorial', 'view') && <Link to="/admin/anuncios" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-2 focus-visible:outline-2">Revisar anuncios y caducidad</Link>}
      {canSeeSecurity && <details className="mt-3 border-t border-slate-200 pt-3 dark:border-white/10">
        <summary className="min-h-11 cursor-pointer font-semibold">Revisiones de seguridad · {securityRows.length}</summary>
        {security.isPending ? <p role="status" className="py-3 text-sm text-slate-500">Cargando revisiones…</p> : security.isError ? <p role="alert" className="py-3 text-sm text-red-700 dark:text-red-300">No se pudo leer la información registrada.</p> : <>
          <div className="grid gap-2 py-3 text-center text-xs sm:grid-cols-3">
            <p className="rounded-xl bg-rose-50 p-3 text-rose-800 dark:bg-rose-400/10 dark:text-rose-200"><strong className="block text-lg">{securitySummary.pending}</strong>Pendientes</p>
            <p className="rounded-xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-300/10 dark:text-amber-100"><strong className="block text-lg">{securitySummary.reviewed}</strong>Revisados</p>
            <p className="rounded-xl bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200"><strong className="block text-lg">{securitySummary.resolved}</strong>Resueltos</p>
          </div>
          <ul className="divide-y divide-slate-200 text-sm dark:divide-white/10">
            {securityRows.map((item) => <li key={item.key} className="py-3">
              <strong>{item.status === 'resolved' ? 'Resuelto' : item.status === 'reviewed' ? 'Revisado' : 'Pendiente'}</strong> · {item.summary}
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Revisado: {formatDate(item.checked_at)} · <a href={item.source_url} target="_blank" rel="noreferrer" className="underline underline-offset-2 focus-visible:outline-2">Fuente y configuración</a></p>
            </li>)}
          </ul>
        </>}
        <Link to="/admin/usuarios" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-2 focus-visible:outline-2">Abrir usuarios, roles y permisos</Link>
      </details>}
    </section>
  );
}
