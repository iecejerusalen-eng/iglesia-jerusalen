import { useState } from 'react';
import { getPrivateReceiptUrl } from '../services/checkoutService';

export default function PrivateReceiptViewer({ orderId, path }: { orderId: string; path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const open = async () => {
    setBusy(true); setError(null);
    try { setUrl(await getPrivateReceiptUrl(orderId)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo abrir el comprobante'); }
    finally { setBusy(false); }
  };
  return <section className="rounded-xl border border-slate-200 p-4 dark:border-white/10" aria-label="Comprobante privado">
    <button type="button" onClick={() => { void open(); }} disabled={busy} className="min-h-11 font-bold text-blue-700 underline dark:text-blue-300">{busy ? 'Abriendo…' : 'Abrir comprobante privado'}</button>
    {error && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p>}
    {url && <><p className="mt-2 text-xs text-slate-500">Acceso temporal de 5 minutos. Puedes generar otro si vence.</p><a href={url} target="_blank" rel="noopener noreferrer" className="my-3 inline-block min-h-11 underline">Ver completo</a>{!path.toLowerCase().endsWith('.pdf') && <img src={url} alt="Comprobante privado del pedido" className="max-h-60 object-contain" />}</>}
  </section>;
}
