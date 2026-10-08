import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/useAuthStore';
import { loadPeople, messageOf, saveMovement, uploadProof } from './api';
import {
  currentMonth,
  todayInEcuador,
  expenseCategories,
  type Fund,
  type Movement,
  type MovementInput,
} from './model';
import { useStoreDialog } from '../store/hooks/useStoreDialog';

import { fieldClass, primaryButton } from './styles';
export default function MovementForm({
  funds,
  initial,
  staff = false,
  onClose,
  onSaved,
}: {
  funds: Fund[];
  initial?: Movement;
  staff?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const [draft, setDraft] = useState<MovementInput>(
    () =>
      initial || {
        id: crypto.randomUUID(),
        kind: 'income',
        fund_id: funds.find((f) => f.active)?.id || '',
        user_id: user?.id || null,
        amount: 0,
        occurred_on: todayInEcuador(),
        contribution_month: currentMonth(),
        method: 'transfer',
        status: 'pending',
        category: 'Aporte voluntario',
        description: 'Aporte voluntario',
        reference: null,
        proof_path: null,
        beneficiary: null,
        correction_reason: null,
      },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const ref = useStoreDialog(true, () => {
    if (!busy) onClose();
  });
  const people = useQuery({
    queryKey: ['finance-people', user?.id],
    queryFn: loadPeople,
    enabled: staff,
    retry: false,
  });
  const set = <K extends keyof MovementInput>(
    key: K,
    value: MovementInput[K],
  ) => setDraft((previous) => ({ ...previous, [key]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user || busy) return;
    setBusy(true);
    setError('');
    try {
      const path = proof ? await uploadProof(proof, user.id) : draft.proof_path;
      // Retain the uploaded path and the stable ID if saving fails, avoiding duplicate writes on retry.
      set('proof_path', path);
      setProof(null);
      await saveMovement(
        {
          ...draft,
          proof_path: path,
          user_id:
            draft.kind === 'expense' ? null : staff ? draft.user_id : user.id,
          contribution_month:
            draft.kind === 'expense' ? null : draft.contribution_month,
          status: staff ? draft.status : 'pending',
        },
        initial?.version,
      );
      onSaved();
    } catch (caught) {
      setError(messageOf(caught));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/60 p-4">
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="movement-title"
        tabIndex={-1}
        className="mx-auto my-6 max-w-2xl rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-950 dark:text-white"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="movement-title" className="font-serif text-2xl font-bold">
            {initial
              ? 'Modificar movimiento'
              : staff
                ? 'Registrar movimiento'
                : 'Registrar mi aporte'}
          </h2>
          <button
            disabled={busy}
            onClick={onClose}
            aria-label="Cerrar formulario"
            className="p-2"
          >
            ✕
          </button>
        </div>
        <p className="my-3 text-sm text-slate-500">
          {staff
            ? 'Confirma únicamente fondos recibidos o pagos realizados. Los cambios quedan auditados.'
            : 'Tu aporte es voluntario y privado. El equipo autorizado verificará el registro.'}
        </p>
        <form onSubmit={submit}>
          <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
            {staff && (
              <label>
                Tipo
                <select
                  className={fieldClass}
                  value={draft.kind}
                  onChange={(e) => {
                    const expense = e.target.value === 'expense';
                    setDraft((d) => ({
                      ...d,
                      kind: expense ? 'expense' : 'income',
                      user_id: null,
                      contribution_month: expense ? null : currentMonth(),
                      category: expense
                        ? expenseCategories[0]
                        : 'Aporte voluntario',
                    }));
                  }}
                >
                  <option value="income">Ingreso</option>
                  <option value="expense">Egreso</option>
                </select>
              </label>
            )}
            <label>
              Destino / fondo
              <select
                required
                className={fieldClass}
                value={draft.fund_id}
                onChange={(e) => set('fund_id', e.target.value)}
              >
                {funds
                  .filter((f) => f.active || f.id === draft.fund_id)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                      {f.restricted ? ' · destinado' : ''}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Importe (USD)
              <input
                required
                min="0.01"
                max="100000000"
                step="0.01"
                type="number"
                className={fieldClass}
                value={draft.amount || ''}
                onChange={(e) => set('amount', Number(e.target.value))}
              />
            </label>
            <label>
              Fecha de movimiento
              <input
                required
                type="date"
                className={fieldClass}
                value={draft.occurred_on}
                onChange={(e) => set('occurred_on', e.target.value)}
              />
            </label>
            {draft.kind === 'income' && (
              <label>
                Mes al que corresponde
                <input
                  required
                  type="month"
                  className={fieldClass}
                  value={draft.contribution_month?.slice(0, 7) || ''}
                  onChange={(e) =>
                    set('contribution_month', e.target.value + '-01')
                  }
                />
              </label>
            )}
            <label>
              Método
              <select
                className={fieldClass}
                value={draft.method}
                onChange={(e) =>
                  set('method', e.target.value === 'cash' ? 'cash' : 'transfer')
                }
              >
                <option value="transfer">Transferencia</option>
                <option value="cash">Efectivo</option>
              </select>
            </label>
            {staff && draft.kind === 'income' && (
              <label>
                Titular del aporte
                <select
                  className={fieldClass}
                  value={draft.user_id || ''}
                  onChange={(e) => set('user_id', e.target.value || null)}
                >
                  <option value="">Sin cuenta vinculada / colectivo</option>
                  {people.data?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.email || p.id}
                    </option>
                  ))}
                </select>
                {people.isError && (
                  <span role="alert" className="text-red-600">
                    No se pudo cargar el directorio.{' '}
                    <button type="button" onClick={() => void people.refetch()}>
                      Reintentar
                    </button>
                  </span>
                )}
              </label>
            )}
            {staff && draft.kind === 'expense' && (
              <>
                <label>
                  Categoría
                  <select
                    className={fieldClass}
                    value={draft.category}
                    onChange={(e) => set('category', e.target.value)}
                  >
                    {expenseCategories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Beneficiario
                  <input
                    className={fieldClass}
                    maxLength={160}
                    value={draft.beneficiary || ''}
                    onChange={(e) => set('beneficiary', e.target.value || null)}
                  />
                </label>
              </>
            )}
            <label className="sm:col-span-2">
              Descripción
              <input
                required
                maxLength={1000}
                className={fieldClass}
                value={draft.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </label>
            <label>
              Referencia bancaria
              <input
                maxLength={120}
                className={fieldClass}
                value={draft.reference || ''}
                onChange={(e) => set('reference', e.target.value || null)}
              />
            </label>
            <label>
              Comprobante privado (máx. 5 MB)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="block w-full text-sm"
                onChange={(e) => setProof(e.target.files?.[0] || null)}
              />
              {draft.proof_path && (
                <span className="text-xs text-emerald-700">
                  Comprobante adjunto
                </span>
              )}
            </label>
            {staff && (
              <label>
                Estado
                <select
                  className={fieldClass}
                  value={draft.status}
                  onChange={(e) =>
                    set(
                      'status',
                      e.target.value === 'confirmed'
                        ? 'confirmed'
                        : e.target.value === 'void'
                          ? 'void'
                          : 'pending',
                    )
                  }
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="void">Anulado</option>
                </select>
              </label>
            )}
            {initial && (
              <label className="sm:col-span-2">
                Motivo del cambio
                <input
                  required
                  minLength={5}
                  maxLength={500}
                  className={fieldClass}
                  value={draft.correction_reason || ''}
                  onChange={(e) => set('correction_reason', e.target.value)}
                />
              </label>
            )}
            <div className="sm:col-span-2">
              {error && (
                <p role="alert" className="mb-3 text-sm text-red-600">
                  {error}
                </p>
              )}
              <button className={primaryButton} type="submit">
                {busy ? 'Guardando…' : 'Guardar registro'}
              </button>
            </div>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
