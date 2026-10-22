import { useState } from 'react';
import { Link } from 'react-router-dom';
import { makeTrackingCode } from '../services/customerService';

export default function TrackingKey({ orderId, secret }: { orderId: string; secret: string }) {
  const [visible, setVisible] = useState(false);
  const code = makeTrackingCode(orderId, secret);
  const save = () => {
    const blob = new Blob([`Tienda Jerusalén — clave privada de seguimiento\n\n${code}\n\nUsa esta clave en https://www.iecejerusalen.com/mis-compras\nQuien la tenga puede consultar el pedido y adjuntar su comprobante. Guárdala en privado; no la publiques ni la envíes en un enlace. Acceso invitado: hasta 30 días desde la reserva.\n`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `pedido-jerusalen-${orderId.slice(0, 8)}.txt`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="mt-5 space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100" aria-label="Clave privada de seguimiento">
    <h3 className="font-bold">Guarda el acceso a tu pedido</h3><p>Con esta clave puedes seguirlo desde otro dispositivo en <Link className="underline" to="/mis-compras">Mis compras</Link>. Quien la tenga puede consultar tu pedido y adjuntar comprobantes. Consérvala en privado. Vence a los 30 días de la reserva; no amplía las 24 horas para presentar el comprobante.</p>
    <div className="flex flex-wrap gap-3"><button type="button" onClick={save} className="min-h-11 rounded-lg bg-primary px-4 font-bold text-white">Guardar clave en archivo</button><button type="button" onClick={() => setVisible(!visible)} className="min-h-11 underline">{visible ? 'Ocultar clave' : 'Mostrar clave para copiar'}</button></div>
    {visible && <label className="block">Clave privada<textarea readOnly className="mt-2 min-h-24 w-full break-all rounded-lg border bg-white p-3 font-mono text-xs text-slate-900 dark:bg-slate-900 dark:text-white" value={code} onFocus={e => e.target.select()} /></label>}
  </section>;
}
