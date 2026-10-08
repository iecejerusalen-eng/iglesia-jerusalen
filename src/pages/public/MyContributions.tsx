import { lazy, Suspense, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ShieldCheck, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../config/supabase';
import {
  loadFunds,
  loadMovements,
  loadNotices,
  messageOf,
} from '../../features/finance/api';
import {
  money,
  titheCalendar,
  summarize,
  todayInEcuador,
} from '../../features/finance/model';
import MovementTable from '../../features/finance/MovementTable';
import { primaryButton } from '../../features/finance/styles';
const MovementForm = lazy(() => import('../../features/finance/MovementForm'));
export default function MyContributions() {
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.isLoading);
  const client = useQueryClient();
  const [year, setYear] = useState(Number(todayInEcuador().slice(0, 4)));
  const [form, setForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const funds = useQuery({
    queryKey: ['finance-funds', user?.id],
    queryFn: loadFunds,
    enabled: Boolean(user),
    retry: false,
  });
  const records = useQuery({
    queryKey: ['my-contributions', user?.id, year],
    enabled: Boolean(user),
    retry: false,
    queryFn: () => loadMovements(`${year}-01-01`, `${year}-12-31`, user?.id),
  });
  const notices = useQuery({
    queryKey: ['finance-notices', user?.id],
    queryFn: loadNotices,
    enabled: Boolean(user),
    retry: false,
  });
  const preference = useQuery({
    queryKey: ['finance-preference', user?.id],
    enabled: Boolean(user),
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_preferences')
        .select('monthly_reminder')
        .eq('user_id', user?.id)
        .maybeSingle();
      if (error) throw error;
      return data?.monthly_reminder === true;
    },
  });
  async function refresh() {
    await Promise.all([
      records.refetch(),
      notices.refetch(),
      client.invalidateQueries({ queryKey: ['finance-month'] }),
    ]);
  }
  async function reminder(enabled: boolean) {
    if (!user || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from('finance_preferences')
        .upsert({ user_id: user.id, monthly_reminder: enabled })
        .select('user_id')
        .single();
      if (error) throw error;
      await preference.refetch();
      toast.success(
        enabled
          ? 'Recordatorio voluntario activado'
          : 'Recordatorio desactivado',
      );
    } catch (error) {
      toast.error(messageOf(error));
    } finally {
      setBusy(false);
    }
  }
  async function markRead(id: string) {
    try {
      const { error } = await supabase
        .from('finance_notices')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .select('id')
        .single();
      if (error) throw error;
      await notices.refetch();
    } catch (error) {
      toast.error(messageOf(error));
    }
  }
  if (authLoading)
    return (
      <p role="status" className="p-12">
        Verificando tu sesión…
      </p>
    );
  if (!user)
    return (
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <ShieldCheck className="mx-auto" />
        <h1 className="my-4 font-serif text-3xl">Tus aportes son privados</h1>
        <p className="mb-6">
          Inicia sesión para consultar tu historial y registrar una contribución
          voluntaria.
        </p>
        <Link className={primaryButton} to="/login?redirectTo=%2Fmis-aportes">
          Iniciar sesión
        </Link>
      </main>
    );
  const calendar = titheCalendar(records.data || [], funds.data || [], year);
  const total = summarize(records.data || []).income;
  return (
    <main className="mx-auto max-w-6xl space-y-7 px-4 py-12 text-slate-900 dark:text-white">
      <Helmet>
        <title>Mis aportes privados | Iglesia Jerusalén</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-300">
            <ShieldCheck size={16} />
            Solo tú y el equipo autorizado
          </p>
          <h1 className="font-serif text-3xl font-bold">Mis aportes</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Consulta tus contribuciones voluntarias. Un mes sin registro no
            indica una deuda ni una obligación.
          </p>
        </div>
        <Link to="/donaciones" className="text-sm underline">
          Consultar cuenta para transferencias
        </Link>
        <button
          className={primaryButton}
          disabled={!funds.data?.length}
          onClick={() => setForm(true)}
        >
          Registrar aporte
        </button>
      </header>
      <div className="flex flex-wrap justify-between gap-3">
        <label>
          Año
          <input
            type="number"
            min="2000"
            max="2100"
            className="ml-3 w-24 rounded-lg border bg-transparent p-2"
            value={year}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= 2000 && value <= 2100) setYear(value);
            }}
          />
        </label>
        <button onClick={() => void refresh()} className="text-sm underline">
          Actualizar registros
        </button>
      </div>
      {records.isPending || funds.isPending ? (
        <p role="status">Cargando tu historial…</p>
      ) : records.isError || funds.isError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 p-5 text-red-700"
        >
          No se pudo cargar tu historial.{' '}
          {messageOf(records.error || funds.error)}{' '}
          <button
            className="underline"
            onClick={() => {
              void funds.refetch();
              void refresh();
            }}
          >
            Reintentar
          </button>
        </p>
      ) : (
        <>
          <p className="text-lg">
            Aportes confirmados correspondientes al año:{' '}
            <strong>{money(total)}</strong>
          </p>
          <section>
            <h2 className="mb-4 font-serif text-xl font-bold">
              Calendario de diezmos
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {calendar.map((m) => (
                <article
                  key={m.month}
                  className={`rounded-xl border p-4 ${m.status === 'confirmed' ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100' : m.status === 'pending' ? 'border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100' : 'border-slate-200 dark:border-slate-700'}`}
                >
                  <h3 className="capitalize font-semibold">
                    {new Date(m.month + 'T12:00:00Z').toLocaleDateString(
                      'es-EC',
                      { month: 'long' },
                    )}
                  </h3>
                  <p className="mt-2 text-xs">
                    {m.status === 'confirmed'
                      ? 'Registro confirmado'
                      : m.status === 'pending'
                        ? 'Por verificar'
                        : 'Sin registro'}
                  </p>
                  {m.status === 'confirmed' && (
                    <p className="mt-2 font-semibold">{money(m.amount)}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
          <MovementTable
            movements={records.data || []}
            funds={funds.data || []}
          />
        </>
      )}
      <section className="rounded-2xl border p-5">
        <h2 className="mb-3 flex items-center gap-2 font-serif text-xl font-bold">
          <Bell size={18} />
          Notificaciones privadas
        </h2>
        {preference.isError ? (
          <p role="alert">
            No se pudo cargar tu preferencia.{' '}
            <button
              className="underline"
              onClick={() => void preference.refetch()}
            >
              Reintentar
            </button>
          </p>
        ) : (
          <label className="flex gap-3 text-sm">
            <input
              type="checkbox"
              disabled={busy || preference.isPending}
              checked={preference.data === true}
              onChange={(e) => void reminder(e.target.checked)}
            />
            Quiero un recordatorio mensual voluntario dentro de la plataforma.
          </label>
        )}
        {notices.isPending ? (
          <p className="mt-4">Cargando avisos…</p>
        ) : notices.isError ? (
          <p role="alert">
            No se pudieron cargar los avisos.{' '}
            <button
              className="underline"
              onClick={() => void notices.refetch()}
            >
              Reintentar
            </button>
          </p>
        ) : (
          notices.data?.map((n) => (
            <article key={n.id} className="mt-4 border-t pt-3 text-sm">
              <p>{n.message}</p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(n.created_at).toLocaleDateString('es-EC')}
              </p>
              {!n.read_at && (
                <button
                  className="mt-2 underline"
                  onClick={() => void markRead(n.id)}
                >
                  Marcar leído
                </button>
              )}
            </article>
          ))
        )}
      </section>
      {form && funds.data && (
        <Suspense fallback={<p>Cargando formulario…</p>}>
          <MovementForm
            funds={funds.data}
            onClose={() => setForm(false)}
            onSaved={() => {
              setForm(false);
              void refresh();
              toast.success('Aporte registrado para revisión');
            }}
          />
        </Suspense>
      )}
    </main>
  );
}
