import { useState } from 'react';
import { proofLink, messageOf } from './api';
import { money, type Fund, type Movement, type FinancePerson } from './model';
import CatalogPagination from '../store/components/CatalogPagination';
const statusText = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  void: 'Anulado',
};
export function ProofButton({ path }: { path: string }) {
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function open() {
    setLoading(true);
    setError('');
    try {
      setLink(await proofLink(path));
    } catch (caught) {
      setError(messageOf(caught));
    } finally {
      setLoading(false);
    }
  }
  return (
    <span>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" className="underline">
          Abrir (válido 60 s)
        </a>
      ) : (
        <button
          disabled={loading}
          onClick={() => void open()}
          className="text-blue-700 underline dark:text-blue-300"
        >
          {loading ? 'Preparando…' : 'Comprobante'}
        </button>
      )}
      {error && (
        <span role="alert" className="block text-red-600">
          {error}
        </span>
      )}
      {link && (
        <button className="ml-2 underline" onClick={() => void open()}>
          Renovar enlace
        </button>
      )}
    </span>
  );
}
export default function MovementTable({
  movements,
  funds,
  people,
  onEdit,
}: {
  movements: Movement[];
  funds: Fund[];
  people?: FinancePerson[];
  onEdit?: (movement: Movement) => void;
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(1);
  const filtered = movements.filter(
    (m) =>
      (!status || m.status === status) &&
      (!kind || m.kind === kind) &&
      `${m.receipt_number} ${m.description} ${m.reference || ''} ${m.beneficiary || ''} ${people?.find((p) => p.id === m.user_id)?.name || ''} ${funds.find((f) => f.id === m.fund_id)?.name || ''}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const active = Math.min(page, pages);
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <label className="min-w-48 flex-1 text-sm">
          Buscar movimiento
          <input
            className="mt-1 w-full rounded-lg border bg-transparent p-2"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Recibo, descripción, referencia…"
          />
        </label>
        <label className="text-sm">
          Estado
          <select
            className="mt-1 block rounded-lg border bg-transparent p-2"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            {Object.entries(statusText).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Tipo
          <select
            className="mt-1 block rounded-lg border bg-transparent p-2"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            <option value="income">Ingreso</option>
            <option value="expense">Egreso</option>
          </select>
        </label>
      </div>
      <p role="status" className="text-sm text-slate-500">
        {filtered.length} movimientos
      </p>
      {!filtered.length ? (
        <p className="rounded-xl border border-dashed p-8 text-center">
          No hay movimientos para estos filtros.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <caption className="sr-only">Movimientos financieros</caption>
            <thead className="border-b text-slate-500">
              <tr>
                {[
                  'Fecha / recibo',
                  'Concepto',
                  'Importe',
                  'Estado',
                  'Acciones',
                ].map((t) => (
                  <th key={t} scope="col" className="p-3">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice((active - 1) * 20, active * 20).map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-slate-100 dark:border-white/10"
                >
                  <td className="p-3 whitespace-nowrap">
                    {m.occurred_on}
                    <span className="block text-xs text-slate-500">
                      {m.receipt_number}
                    </span>
                  </td>
                  <td className="max-w-xs p-3">
                    <p className="break-words font-semibold">{m.description}</p>
                    {m.kind === 'income' && people && (
                      <p className="text-xs">
                        {people.find((p) => p.id === m.user_id)?.name ||
                          (m.user_id
                            ? 'Titular vinculado'
                            : 'Colectivo / sin vincular')}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      {funds.find((f) => f.id === m.fund_id)?.name} ·{' '}
                      {m.category}
                    </p>
                    {m.beneficiary && (
                      <p className="text-xs">{m.beneficiary}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      {m.method === 'cash' ? 'Efectivo' : 'Transferencia'}
                      {m.contribution_month
                        ? ` · Mes ${m.contribution_month.slice(0, 7)}`
                        : ''}
                    </p>
                  </td>
                  <td
                    className={`p-3 whitespace-nowrap font-semibold ${m.kind === 'income' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}
                  >
                    {m.kind === 'income' ? '+' : '−'}
                    {money(Number(m.amount))}
                  </td>
                  <td className="p-3">{statusText[m.status]}</td>
                  <td className="space-y-2 p-3">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(m)}
                        className="block text-blue-700 underline dark:text-blue-300"
                        aria-label={`Modificar ${m.receipt_number}`}
                      >
                        Modificar
                      </button>
                    )}
                    {m.proof_path && <ProofButton path={m.proof_path} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CatalogPagination
        page={active}
        total={filtered.length}
        pageSize={20}
        onPage={setPage}
      />
    </section>
  );
}
