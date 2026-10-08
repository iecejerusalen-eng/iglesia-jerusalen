import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../config/supabase';
import { loadPeople, messageOf } from './api';
import { fieldClass, primaryButton } from './styles';
export default function FinanceMessages() {
  const user = useAuthStore((state) => state.user);
  const people = useQuery({
    queryKey: ['finance-people', user?.id],
    queryFn: loadPeople,
    retry: false,
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setResult('');
    setError('');
    try {
      const { error: failure } = await supabase.rpc('finance_notify_member', {
        recipient: fields.get('recipient'),
        body: fields.get('body'),
        request_id: requestId,
      });
      if (failure) throw failure;
      setResult(
        'Aviso guardado en las notificaciones privadas del destinatario.',
      );
      setRequestId(crypto.randomUUID());
    } catch (caught) {
      setError(messageOf(caught));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="max-w-2xl space-y-4">
      <h2 className="font-serif text-xl font-bold">Enviar un aviso privado</h2>
      <p className="text-sm text-slate-500">
        El destinatario lo verá en Mis aportes. Usa un mensaje respetuoso; los
        aportes son voluntarios.
      </p>
      {people.isPending ? (
        <p>Cargando destinatarios…</p>
      ) : people.isError ? (
        <p role="alert">
          No se pudo cargar el directorio.{' '}
          <button className="underline" onClick={() => void people.refetch()}>
            Reintentar
          </button>
        </p>
      ) : (
        <form onSubmit={submit}>
          <fieldset disabled={busy} className="space-y-4">
            <label className="block">
              Destinatario
              <select required name="recipient" className={fieldClass}>
                <option value="">Selecciona una persona</option>
                {people.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.email || p.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              Mensaje
              <textarea
                required
                minLength={10}
                maxLength={500}
                rows={4}
                name="body"
                className={fieldClass}
              />
            </label>
            <button className={primaryButton}>
              {busy ? 'Guardando…' : 'Enviar aviso privado'}
            </button>
          </fieldset>
        </form>
      )}
      {result && (
        <p role="status" className="text-sm text-emerald-700">
          {result}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
