import { lazy, Suspense, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ShieldCheck, RefreshCw, Plus, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';
import { useConfirmStore } from '../../store/useConfirmStore';
import { supabase } from '../../config/supabase';
import {
  generateDue,
  loadAdminMonth,
  loadAudit,
  loadPeople,
  loadFunds,
  messageOf,
  useFinanceAccess,
} from '../../features/finance/api';
import {
  currentMonth,
  money,
  summarize,
  type Movement,
} from '../../features/finance/model';
import { primaryButton } from '../../features/finance/styles';
import MovementTable from '../../features/finance/MovementTable';
import FinancePlanning from '../../features/finance/FinancePlanning';
const MovementForm = lazy(() => import('../../features/finance/MovementForm'));
const FinanceMessages = lazy(
  () => import('../../features/finance/FinanceMessages'),
);
type Tab =
  | 'messages'
  | 'summary'
  | 'movements'
  | 'budgets'
  | 'recurring'
  | 'funds'
  | 'audit';
export default function FinanceDashboard() {
  const user = useAuthStore((s) => s.user);
  const access = useFinanceAccess();
  const client = useQueryClient();
  const confirm = useConfirmStore((s) => s.confirm);
  const [month, setMonth] = useState(currentMonth());
  const [tab, setTab] = useState<Tab>('summary');
  const [editing, setEditing] = useState<Movement | null>(null);
  const [form, setForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const allowed = access.data?.view === true;
  const canEdit = access.data?.edit === true;
  const funds = useQuery({
    queryKey: ['finance-funds', user?.id],
    queryFn: loadFunds,
    enabled: allowed,
    retry: false,
  });
  const data = useQuery({
    queryKey: ['finance-month', user?.id, month, canEdit],
    enabled: allowed,
    retry: false,
    queryFn: async () => {
      if (canEdit) await generateDue();
      return loadAdminMonth(month);
    },
  });
  const people = useQuery({
    queryKey: ['finance-people', user?.id],
    queryFn: loadPeople,
    enabled: allowed,
    retry: false,
  });
  const audit = useQuery({
    queryKey: ['finance-audit', user?.id],
    queryFn: loadAudit,
    enabled: allowed && tab === 'audit',
    retry: false,
  });
  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['finance-month'] }),
      client.invalidateQueries({ queryKey: ['finance-audit'] }),
      client.invalidateQueries({ queryKey: ['finance-funds'] }),
      client.invalidateQueries({ queryKey: ['my-contributions'] }),
    ]);
  }
  async function period() {
    if (!canEdit || busy) return;
    const closed = data.data?.closed;
    if (
      !(await confirm({
        title: closed ? 'Reabrir período' : 'Cerrar período',
        message: closed
          ? 'Se permitirán correcciones auditadas.'
          : 'El mes quedará bloqueado. Revisa los movimientos pendientes antes de continuar.',
      }))
    )
      return;
    if (!closed && data.data?.movements.some((m) => m.status === 'pending')) {
      toast.error('Resuelve los movimientos pendientes antes de cerrar.');
      return;
    }
    setBusy(true);
    try {
      const result = closed
        ? await supabase
            .from('finance_periods')
            .delete()
            .eq('month', month)
            .select('month')
            .single()
        : await supabase
            .from('finance_periods')
            .insert({ month, closed_by: user?.id })
            .select('month')
            .single();
      if (result.error) throw result.error;
      await refresh();
      toast.success('Período actualizado');
    } catch (error) {
      toast.error(messageOf(error));
    } finally {
      setBusy(false);
    }
  }
  async function exportReport() {
    const rows = data.data?.movements;
    if (!rows?.length) return;
    const { exportToCsv } = await import('../../utils/exportUtils');
    exportToCsv(
      rows.map((m) => ({
        Recibo: m.receipt_number,
        Fecha: m.occurred_on,
        Tipo: m.kind === 'income' ? 'Ingreso' : 'Egreso',
        Fondo: `'${funds.data?.find((f) => f.id === m.fund_id)?.name || ''}`,
        Importe: Number(m.amount),
        Estado: m.status,
        Metodo: m.method,
        Concepto: `'${m.description}`,
        Referencia: m.reference ? `'${m.reference}` : '',
      })),
      `finanzas-${month.slice(0, 7)}`,
    );
  }
  if (access.isPending)
    return (
      <p role="status" className="p-8">
        Verificando acceso financiero…
      </p>
    );
  if (access.isError)
    return (
      <div role="alert" className="p-8">
        No se pudo comprobar tu acceso.{' '}
        <button className="underline" onClick={() => void access.refetch()}>
          Reintentar
        </button>
      </div>
    );
  if (!allowed)
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <LockKeyhole className="mx-auto mb-4" />
        <h1 className="font-serif text-2xl">Finanzas privadas</h1>
        <p className="my-4">
          Solo pastores, secretaría, tesorería y cuerpo de apoyo autorizado
          pueden consultar esta información.
        </p>
        <Link to="/mis-aportes" className={primaryButton}>
          Ver mis aportes
        </Link>
      </div>
    );
  const report = data.data;
  const totals = summarize(report?.movements || []);
  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 text-slate-900 dark:text-white sm:p-6">
      <Helmet>
        <title>Finanzas privadas | Iglesia Jerusalén</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-300">
            <ShieldCheck size={16} />
            Administración privada
          </p>
          <h1 className="font-serif text-3xl font-bold">
            Finanzas de la iglesia
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Diezmos, ofrendas, egresos y planificación. Los reportes suman
            únicamente movimientos confirmados.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            aria-label="Actualizar finanzas"
            className="rounded-xl border p-3"
            onClick={() => void refresh()}
          >
            <RefreshCw size={18} />
          </button>
          {canEdit && (
            <button
              className={primaryButton}
              disabled={report?.closed || !funds.data?.length}
              onClick={() => {
                setEditing(null);
                setForm(true);
              }}
            >
              <Plus size={16} className="mr-1 inline" />
              Movimiento
            </button>
          )}
        </div>
      </header>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="text-sm">
          Período
          <input
            type="month"
            className="ml-3 rounded-xl border bg-transparent p-2"
            value={month.slice(0, 7)}
            onChange={(e) => {
              if (e.target.value) setMonth(e.target.value + '-01');
            }}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          {report?.closed && (
            <p className="text-sm text-amber-700">Período cerrado</p>
          )}
          <button
            disabled={!report}
            onClick={() => void exportReport()}
            className="text-sm underline"
          >
            Exportar CSV privado
          </button>
          {canEdit && (
            <button
              disabled={!report || busy}
              className="text-sm underline"
              onClick={() => void period()}
            >
              {report?.closed ? 'Reabrir período' : 'Cerrar período'}
            </button>
          )}
        </div>
      </div>
      {!canEdit && (
        <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          Tu acceso es de consulta.
        </p>
      )}
      <nav
        aria-label="Secciones financieras"
        className="flex flex-wrap gap-2 border-b pb-3"
      >
        {(
          [
            ['summary', 'Resumen'],
            ['movements', 'Movimientos'],
            ['budgets', 'Presupuestos'],
            ['recurring', 'Gastos recurrentes'],
            ['funds', 'Fondos'],
            ['audit', 'Auditoría'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === key ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
          >
            {label}
          </button>
        ))}
        {canEdit && (
          <button
            aria-pressed={tab === 'messages'}
            className={
              tab === 'messages'
                ? primaryButton
                : 'rounded-xl px-4 py-2 text-sm'
            }
            onClick={() => setTab('messages')}
          >
            Avisos privados
          </button>
        )}
      </nav>
      {data.isPending || funds.isPending ? (
        <p role="status">Cargando registros…</p>
      ) : data.isError || funds.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 p-5 text-red-700"
        >
          No se pudo cargar un reporte completo.{' '}
          {messageOf(data.error || funds.error)}{' '}
          <button className="underline" onClick={() => void refresh()}>
            Reintentar
          </button>
        </div>
      ) : (
        report && (
          <>
            {tab === 'summary' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ['Ingresos confirmados', money(totals.income)],
                    ['Egresos confirmados', money(totals.expenses)],
                    ['Resultado del período', money(totals.net)],
                    ['Por revisar', String(totals.pending)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border bg-white p-5 dark:border-white/10 dark:bg-slate-900"
                    >
                      <p className="text-sm text-slate-500">{label}</p>
                      <p className="mt-3 text-3xl font-bold tabular-nums">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                <section className="rounded-2xl border p-5">
                  <h2 className="font-serif text-xl font-bold">
                    Ingresos y uso por destino
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Los fondos destinados se muestran por separado para cuidar
                    su propósito.
                  </p>
                  <div className="mt-5 space-y-4">
                    {funds.data?.map((f) => {
                      const t = summarize(
                        report.movements.filter((m) => m.fund_id === f.id),
                      );
                      return (
                        <div
                          key={f.id}
                          className="flex flex-wrap justify-between gap-3 border-b pb-3"
                        >
                          <p className="font-semibold">
                            {f.name}
                            {f.restricted && (
                              <span className="ml-2 text-xs text-amber-700">
                                Destinado
                              </span>
                            )}
                          </p>
                          <p className="text-sm">
                            Ingresos {money(t.income)} · Egresos{' '}
                            {money(t.expenses)} · Neto {money(t.net)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
                <div className="grid gap-4 sm:grid-cols-2">
                  <p className="rounded-xl bg-slate-100 p-4 text-sm dark:bg-slate-900">
                    Flujo neto en efectivo:{' '}
                    <strong>{money(totals.cash)}</strong>
                  </p>
                  <p className="rounded-xl bg-slate-100 p-4 text-sm dark:bg-slate-900">
                    Flujo neto por transferencia:{' '}
                    <strong>{money(totals.bank)}</strong>
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  Estos flujos corresponden al período elegido; no sustituyen el
                  saldo bancario conciliado ni incluyen movimientos ajenos a
                  este registro.
                </p>
              </>
            )}
            {tab === 'movements' && people.isError && (
              <p role="alert">
                No se pudo cargar el directorio de titulares.{' '}
                <button
                  className="underline"
                  onClick={() => void people.refetch()}
                >
                  Reintentar
                </button>
              </p>
            )}
            {tab === 'movements' && (
              <MovementTable
                people={people.data}
                movements={report.movements}
                funds={funds.data || []}
                onEdit={
                  canEdit && !report.closed
                    ? (m) => {
                        setEditing(m);
                        setForm(true);
                      }
                    : undefined
                }
              />
            )}
            {(tab === 'budgets' || tab === 'recurring' || tab === 'funds') && (
              <FinancePlanning
                tab={tab}
                month={month}
                funds={funds.data || []}
                budgets={report.budgets}
                recurring={report.recurring}
                movements={report.movements}
                canEdit={canEdit && !report.closed}
                onSaved={refresh}
              />
            )}
            {tab === 'messages' && canEdit && (
              <Suspense fallback={<p>Cargando comunicaciones…</p>}>
                <FinanceMessages />
              </Suspense>
            )}
            {tab === 'audit' && (
              <section>
                <h2 className="mb-4 font-serif text-xl font-bold">
                  Historial de cambios
                </h2>
                {audit.isPending ? (
                  <p>Cargando auditoría…</p>
                ) : audit.isError ? (
                  <p role="alert">
                    No se pudo cargar la auditoría.{' '}
                    <button
                      className="underline"
                      onClick={() => void audit.refetch()}
                    >
                      Reintentar
                    </button>
                  </p>
                ) : (
                  <>
                    <p className="mb-3 text-xs text-slate-500">
                      Últimos 100 eventos. El historial completo se conserva en
                      la base privada.
                    </p>
                    {!audit.data?.length && <p>No hay eventos todavía.</p>}
                    {audit.data?.map((a) => (
                      <article key={a.id} className="border-b py-3 text-sm">
                        <p>
                          {new Date(a.created_at).toLocaleString('es-EC')} ·{' '}
                          {a.action} ·{' '}
                          {a.movement_id?.slice(0, 8) || 'Configuración'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Actor: {a.actor_id || 'Automatización'}
                          {a.reason ? ` · Motivo: ${a.reason}` : ''}
                        </p>
                      </article>
                    ))}
                  </>
                )}
              </section>
            )}
          </>
        )
      )}
      {form && funds.data && (
        <Suspense fallback={<p>Cargando formulario…</p>}>
          <MovementForm
            staff
            funds={funds.data}
            initial={editing || undefined}
            onClose={() => setForm(false)}
            onSaved={() => {
              setForm(false);
              void refresh();
              toast.success('Movimiento guardado');
            }}
          />
        </Suspense>
      )}
    </main>
  );
}
