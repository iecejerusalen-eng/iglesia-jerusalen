import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../config/supabase';
import { messageOf } from './api';
import {
  expenseCategories,
  money,
  summarize,
  type Budget,
  type Fund,
  type Movement,
  type RecurringExpense,
} from './model';
import { fieldClass, primaryButton } from './styles';

export default function FinancePlanning({
  tab,
  month,
  funds,
  budgets,
  recurring,
  movements,
  canEdit,
  onSaved,
}: {
  tab: 'budgets' | 'recurring' | 'funds';
  month: string;
  funds: Fund[];
  budgets: Budget[];
  recurring: RecurringExpense[];
  movements: Movement[];
  canEdit: boolean;
  onSaved: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [editingRecurring, setEditingRecurring] =
    useState<RecurringExpense | null>(null);
  async function write(
    action: () => PromiseLike<{ error: { message: string } | null }>,
  ) {
    if (!canEdit || busy) return;
    setBusy(true);
    try {
      const result = await action();
      if (result.error) throw result.error;
      await onSaved();
      toast.success('Cambio guardado');
    } catch (error) {
      toast.error(messageOf(error));
    } finally {
      setBusy(false);
    }
  }
  const fundSelect = (
    <label>
      Fondo
      <select
        name="fund"
        defaultValue={
          tab === 'recurring' ? editingRecurring?.fund_id : undefined
        }
        className={fieldClass}
      >
        {funds
          .filter((f) => f.active)
          .map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
      </select>
    </label>
  );
  const categorySelect = (
    <label>
      Categoría
      <select
        name="category"
        defaultValue={
          tab === 'recurring' ? editingRecurring?.category : undefined
        }
        className={fieldClass}
      >
        {expenseCategories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
    </label>
  );
  if (tab === 'budgets')
    return (
      <section className="space-y-5">
        <h2 className="font-serif text-xl font-bold">
          Planificado frente a ejecutado
        </h2>
        {canEdit && (
          <form
            className="grid gap-3 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              const v = new FormData(e.currentTarget);
              void write(() =>
                supabase
                  .from('finance_budgets')
                  .upsert(
                    {
                      fund_id: v.get('fund'),
                      month,
                      category: v.get('category'),
                      amount: Number(v.get('amount')),
                    },
                    { onConflict: 'fund_id,month,category' },
                  )
                  .select('id')
                  .single(),
              );
            }}
          >
            {fundSelect}
            {categorySelect}
            <label>
              Presupuesto (USD)
              <input
                name="amount"
                type="number"
                min="0"
                max="100000000"
                step="0.01"
                required
                className={fieldClass}
              />
            </label>
            <button disabled={busy} className={primaryButton}>
              Guardar presupuesto
            </button>
          </form>
        )}
        {!budgets.length && (
          <p className="text-slate-500">
            Todavía no hay presupuesto para este mes.
          </p>
        )}
        {budgets.map((b) => {
          const spent = summarize(
            movements.filter(
              (m) => m.fund_id === b.fund_id && m.category === b.category,
            ),
          ).expenses;
          const remaining = Number(b.amount) - spent;
          return (
            <article key={b.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <h3 className="font-semibold">
                  {b.category} · {funds.find((f) => f.id === b.fund_id)?.name}
                </h3>
                <span
                  className={
                    remaining < 0 ? 'text-red-600' : 'text-emerald-700'
                  }
                >
                  {remaining < 0 ? 'Exceso' : 'Disponible'}:{' '}
                  {money(Math.abs(remaining))}
                </span>
              </div>
              <p className="mt-2 text-sm">
                Planificado {money(Number(b.amount))} · Ejecutado {money(spent)}
              </p>
              <progress
                className="mt-3 w-full"
                max={Math.max(Number(b.amount), spent, 1)}
                value={spent}
                aria-label={`Ejecución del presupuesto de ${b.category}`}
              />
            </article>
          );
        })}
        <p className="text-sm text-slate-500">
          Los gastos sin presupuesto también aparecen en movimientos; el
          presupuesto no autoriza un pago automáticamente.
        </p>
      </section>
    );
  if (tab === 'recurring')
    return (
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold">
          Compromisos recurrentes
        </h2>
        <p className="text-sm text-slate-500">
          Al abrir finanzas, los vencimientos del mes se registran una sola vez
          como pendientes. Confirma cada pago realizado.
        </p>
        {canEdit && (
          <form
            key={editingRecurring?.id || 'new-recurring'}
            aria-label="Editar compromiso recurrente"
            className="grid gap-3 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              const v = new FormData(e.currentTarget);
              const values = {
                fund_id: v.get('fund'),
                category: v.get('category'),
                description: v.get('description'),
                beneficiary: v.get('beneficiary') || null,
                amount: Number(v.get('amount')),
                day: Number(v.get('day')),
                method: v.get('method'),
                starts_on: v.get('start'),
                ends_on: v.get('end') || null,
                active: editingRecurring?.active ?? true,
              };
              void write(() =>
                editingRecurring
                  ? supabase
                      .from('finance_recurring')
                      .update(values)
                      .eq('id', editingRecurring.id)
                      .select('id')
                      .single()
                  : supabase
                      .from('finance_recurring')
                      .insert(values)
                      .select('id')
                      .single(),
              );
            }}
          >
            {fundSelect}
            {categorySelect}
            <label>
              Descripción
              <input
                required
                name="description"
                defaultValue={editingRecurring?.description}
                maxLength={1000}
                className={fieldClass}
              />
            </label>
            <label>
              Beneficiario
              <input
                name="beneficiary"
                defaultValue={editingRecurring?.beneficiary || ''}
                maxLength={160}
                className={fieldClass}
              />
            </label>
            <label>
              Importe (USD)
              <input
                name="amount"
                defaultValue={editingRecurring?.amount}
                required
                type="number"
                min="0.01"
                max="100000000"
                step="0.01"
                className={fieldClass}
              />
            </label>
            <label>
              Día de vencimiento (1–28)
              <input
                name="day"
                defaultValue={editingRecurring?.day}
                required
                type="number"
                min="1"
                max="28"
                className={fieldClass}
              />
            </label>
            <label>
              Desde
              <input
                name="start"
                required
                type="date"
                defaultValue={editingRecurring?.starts_on || month}
                className={fieldClass}
              />
            </label>
            <label>
              Hasta (opcional)
              <input
                name="end"
                defaultValue={editingRecurring?.ends_on || ''}
                type="date"
                className={fieldClass}
              />
            </label>
            <label>
              Método
              <select
                name="method"
                defaultValue={editingRecurring?.method || 'transfer'}
                className={fieldClass}
              >
                <option value="transfer">Transferencia</option>
                <option value="cash">Efectivo</option>
              </select>
            </label>
            <button disabled={busy} className={primaryButton}>
              {editingRecurring ? 'Guardar cambios' : 'Crear compromiso'}
            </button>
            {editingRecurring && (
              <button type="button" onClick={() => setEditingRecurring(null)}>
                Cancelar edición
              </button>
            )}
          </form>
        )}
        {!recurring.length && <p>No hay compromisos recurrentes.</p>}
        {recurring.map((r) => (
          <article
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
          >
            <div>
              <h3 className="font-semibold">{r.description}</h3>
              <p className="text-sm text-slate-500">
                {r.category} · {money(Number(r.amount))} · día {r.day} ·{' '}
                {r.active ? 'Activo' : 'Pausado'}
              </p>
            </div>
            {canEdit && (
              <button
                disabled={busy}
                className="text-sm underline"
                onClick={() => setEditingRecurring(r)}
              >
                Modificar
              </button>
            )}
            {canEdit && (
              <button
                disabled={busy}
                className="text-sm underline"
                onClick={() =>
                  void write(() =>
                    supabase
                      .from('finance_recurring')
                      .update({ active: !r.active })
                      .eq('id', r.id)
                      .select('id')
                      .single(),
                  )
                }
              >
                {r.active ? 'Pausar' : 'Activar'}
              </button>
            )}
          </article>
        ))}
      </section>
    );
  return (
    <section className="space-y-4">
      <h2 className="font-serif text-xl font-bold">
        Fondos y ofrendas especiales
      </h2>
      {canEdit && (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const v = new FormData(e.currentTarget);
            void write(() =>
              supabase
                .from('finance_funds')
                .insert({
                  name: v.get('name'),
                  kind: v.get('kind'),
                  restricted: v.get('restricted') === 'on',
                })
                .select('id')
                .single(),
            );
          }}
        >
          <label>
            Nombre
            <input
              name="name"
              minLength={2}
              maxLength={100}
              required
              className={fieldClass}
            />
          </label>
          <label>
            Tipo
            <select name="kind" className={fieldClass}>
              <option value="offering">Ofrenda</option>
              <option value="tithe">Diezmo</option>
            </select>
          </label>
          <label className="text-sm">
            <input name="restricted" type="checkbox" /> Destinado a un propósito
          </label>
          <button disabled={busy} className={primaryButton}>
            Crear fondo
          </button>
        </form>
      )}
      {funds.map((f) => (
        <div key={f.id} className="flex justify-between gap-3 border-b py-3">
          <p>
            {f.name} · {f.kind === 'tithe' ? 'Diezmo' : 'Ofrenda'}
            {f.restricted ? ' · Destinado' : ''}
          </p>
          {canEdit && (
            <button
              disabled={busy}
              className="underline"
              onClick={() =>
                void write(() =>
                  supabase
                    .from('finance_funds')
                    .update({ active: !f.active })
                    .eq('id', f.id)
                    .select('id')
                    .single(),
                )
              }
            >
              {f.active ? 'Archivar' : 'Activar'}
            </button>
          )}
        </div>
      ))}
    </section>
  );
}
