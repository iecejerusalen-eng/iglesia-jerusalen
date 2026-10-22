import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { listPurchases, getCheckout, submitPrivateReceipt } from '../../features/store/services/checkoutService';
import type { SecureOrder } from '../../features/store/services/checkoutService';
import { claimTrackedOrder, forgetTrackingCode, getDigitalLibrary, openDigitalResource, parseTrackingCode, readTrackingCode, restoreTrackedOrder } from '../../features/store/services/customerService';
import type { LibraryItem } from '../../features/store/services/customerService';
import { formatStoreCurrency } from '../../features/store/catalog';

const panel = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6';
const button = 'min-h-11 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50';
const input = 'min-h-11 w-full rounded-xl border border-slate-300 bg-transparent p-3 text-sm dark:border-slate-600 focus-visible:outline-2 focus-visible:outline-blue-500';
const reason = (e: unknown) => e instanceof Error ? e.message : 'No se pudo completar la consulta';
const orderLabel = (order: SecureOrder) => order.status === 'cancelled' ? 'Cancelado o vencido'
  : order.refunded_amount && order.refunded_amount > 0 ? 'Reembolso registrado; consulta su conciliación'
    : order.ecommerce_payment_status === 'verifying' ? 'Comprobante recibido · pago en revisión'
      : order.status === 'completed' ? 'Entrega completada' : order.status === 'ready_for_pickup' ? 'Listo para retiro coordinado'
        : order.ecommerce_payment_status === 'paid' ? 'Pago confirmado' : 'Pendiente de comprobante y pago';

export default function MyPurchases() {
  const { user, isLoading } = useAuthStore();
  const cache = useQueryClient();
  const orders = useQuery({ queryKey: ['customer-orders', user?.id], queryFn: listPurchases, enabled: Boolean(user) && !isLoading, retry: false });
  const library = useQuery({ queryKey: ['customer-library', user?.id], queryFn: getDigitalLibrary, enabled: Boolean(user) && !isLoading, retry: false });
  const [selected, setSelected] = useState<SecureOrder | null>(null);
  const refresh = async () => { await Promise.all([cache.invalidateQueries({ queryKey: ['customer-orders'] }), cache.invalidateQueries({ queryKey: ['customer-library'] })]); };
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 text-slate-900 dark:text-white sm:px-8">
    <Helmet><title>Mis compras y seguimiento | Tienda Jerusalén</title><meta name="description" content="Consulta tus pedidos, presenta un comprobante y accede a los recursos digitales adquiridos." /><meta name="referrer" content="no-referrer" /><meta name="robots" content="noindex,nofollow" /></Helmet>
    <header><p className="text-xs font-bold uppercase tracking-widest text-church-gold-emphasis">Tienda Jerusalén</p><h1 className="mt-2 font-serif text-3xl font-bold">Mis compras</h1><p className="mt-2 text-slate-600 dark:text-slate-300">Seguimiento de pedidos y biblioteca de recursos digitales.</p><Link className="mt-3 inline-flex min-h-11 items-center underline" to="/tienda">Volver a la tienda</Link></header>
    <TrackingOrders key={user?.id || 'guest'} canClaim={Boolean(user)} onClaimed={refresh} />
    {isLoading ? <p role="status">Consultando tu sesión…</p> : !user ? <section className={panel}><h2 className="font-serif text-xl font-bold">Tus pedidos vinculados y recursos digitales</h2><p className="my-3">Inicia sesión para consultar tu historial y biblioteca. Para seguir una compra como invitado, utiliza tu clave privada arriba.</p><Link to="/login?redirectTo=%2Fmis-compras" className={button + ' inline-block'}>Iniciar sesión</Link></section> : <>
      <section className={panel}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-xl font-bold">Pedidos de tu cuenta</h2><button className={button} disabled={orders.isFetching || library.isFetching} onClick={() => { void refresh(); }}>Actualizar compras</button></div>
        {orders.isPending ? <p role="status" className="mt-4">Consultando pedidos…</p> : orders.isError ? <p role="alert" className="mt-4 text-red-700 dark:text-red-300">{orders.error.message}</p> : !orders.data.length ? <p className="mt-4">Todavía no hay pedidos vinculados a esta cuenta.</p> : <ul className="mt-5 space-y-3">{orders.data.map(order => <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-white/10"><div><p className="font-bold">Pedido #{order.id.slice(0, 8).toUpperCase()} · {formatStoreCurrency(order.total)}</p><p className="text-sm">{orderLabel(order)}</p><p className="text-xs text-slate-500 dark:text-slate-400">{new Date(order.created_at).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}</p></div><button className={button} onClick={() => setSelected(order)}>Consultar pedido {order.id.slice(0, 8)}</button></li>)}</ul>}
      </section>
      {selected && selected.user_id === user.id && <OrderPanel key={selected.id} initial={selected} secret="" />}
      <section className={panel}><h2 className="font-serif text-xl font-bold">Biblioteca digital</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">El acceso se comprueba al abrir cada recurso. Un comprobante presentado todavía requiere confirmación de pago.</p>{library.isPending ? <p role="status" className="mt-4">Consultando biblioteca…</p> : library.isError ? <p role="alert" className="mt-4 text-red-700 dark:text-red-300">{library.error.message}</p> : !library.data.length ? <p className="mt-4">Aún no hay recursos digitales en tu historial.</p> : <div className="mt-5 space-y-4">{library.data.map(item => <DigitalResource key={`${user.id}:${item.item_id}`} item={item} />)}</div>}</section>
    </>}
  </main>;
}

function TrackingOrders({ canClaim, onClaimed }: { canClaim: boolean; onClaimed: () => Promise<void> }) {
  const [code, setCode] = useState(readTrackingCode);
  const [order, setOrder] = useState<SecureOrder | null>(null);
  const [activeCode, setActiveCode] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (claim = false) => {
    setBusy(true); setError('');
    try {
      const result = claim ? await claimTrackedOrder(activeCode) : await restoreTrackedOrder(code);
      setOrder(result); setActiveCode(claim ? '' : code.trim());
      if (claim) { setCode(''); await onClaimed(); }
    } catch (e) { setError(reason(e)); } finally { setBusy(false); }
  };
  return <section className={panel + ' space-y-4'} aria-label="Seguimiento de invitado"><h2 className="font-serif text-xl font-bold">Seguir un pedido con clave privada</h2><p className="text-sm">Pega la clave que guardaste al reservar. No se envía por correo automáticamente y el número de pedido solo no permite consultar datos. La clave vence a los 30 días desde la reserva.</p>
    <form onSubmit={e => { e.preventDefault(); void submit(); }} className="space-y-3"><label className="block text-sm font-bold">Clave privada de seguimiento<input type="password" autoComplete="off" spellCheck={false} className={input + ' mt-2 font-mono'} maxLength={110} value={code} onChange={e => setCode(e.target.value)} required /></label><div className="flex flex-wrap gap-3"><button className={button} disabled={busy}>{busy ? 'Consultando…' : 'Consultar con clave'}</button><button type="button" className="min-h-11 underline" onClick={() => { forgetTrackingCode(); setCode(''); setActiveCode(''); setOrder(null); setError(''); }}>Quitar clave de esta pestaña</button></div></form>
    {error && <p role="alert" className="break-words text-red-700 dark:text-red-300">{error}</p>}
    {order && <><OrderPanel key={order.id + activeCode} initial={order} secret={activeCode ? parseTrackingCode(activeCode).secret : ''} />{!order.user_id && canClaim && <div><p className="mb-3 text-sm">Puedes vincularlo si el correo verificado de tu cuenta coincide con el usado al comprar. La clave invitada dejará de funcionar.</p><button type="button" className={button} disabled={busy} onClick={() => { void submit(true); }}>Vincular este pedido a mi cuenta</button></div>}</>}
    <p className="text-sm text-slate-600 dark:text-slate-300">Si perdiste tu clave o ya venció, contacta con la iglesia para revisar el pedido antes de volver a pagar.</p>
    {!canClaim && <Link className="inline-block min-h-11 underline" to="/login?redirectTo=%2Fmis-compras">Iniciar sesión para vincular un pedido</Link>}
  </section>;
}

function OrderPanel({ initial, secret }: { initial: SecureOrder; secret: string }) {
  const [order, setOrder] = useState(initial); const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const expired = order.status === 'cancelled' || Boolean(order.ecommerce_payment_status === 'pending' && order.reservation_expires_at && Date.parse(order.reservation_expires_at) <= now);
  const canSubmit = !expired && order.status === 'pending_payment' && ['pending', 'verifying', 'failed'].includes(order.ecommerce_payment_status || 'pending');
  const act = async (upload = false) => { setBusy(true); setError(''); try { setOrder(upload && file ? await submitPrivateReceipt(order.id, file, secret) : await getCheckout(order.id, secret)); setFile(null); } catch (e) { setError(reason(e)); } finally { setBusy(false); } };
  return <section className="space-y-3 rounded-xl border border-slate-300 p-4 dark:border-slate-600" aria-label="Detalle de pedido"><h3 className="font-bold">Pedido #{order.id.slice(0, 8).toUpperCase()}</h3><p className="break-all font-mono text-xs">{order.id}</p><p>{orderLabel(order)}</p><p className="text-xl font-bold">{formatStoreCurrency(order.total)}</p><ul className="space-y-2 text-sm">{order.order_items?.map(item => <li key={item.id}>{item.products?.name || 'Producto adquirido'} · {item.quantity} × {formatStoreCurrency(item.price)}</li>)}</ul>
    {order.reservation_expires_at && canSubmit && order.ecommerce_payment_status === 'pending' && <p className="text-sm">Presenta el comprobante antes del {new Date(order.reservation_expires_at).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}. Al vencer, contacta con la iglesia si ya transferiste; no repitas el pago.</p>}
    {!expired && canSubmit && order.bank && <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><h4 className="font-bold">Transferencia del pedido reservado</h4><p>{order.bank.bank_name}</p><p className="break-all font-mono">{order.bank.bank_account}</p><p className="text-sm">Usa el total confirmado; adjuntar el comprobante no confirma el cobro.</p></div>}
    <button className={button} disabled={busy} onClick={() => { void act(); }}>Actualizar estado del pedido</button>
    {error && <p role="alert" className="text-red-700 dark:text-red-300">{error}</p>}
    {canSubmit && <form onSubmit={e => { e.preventDefault(); void act(true); }} className="space-y-3"><label className="block text-sm">Comprobante privado, hasta 5 MB<input className="mt-2 block w-full min-w-0 text-sm" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy} onChange={e => setFile(e.target.files?.[0] || null)} /></label><button className={button} disabled={busy || !file}>{order.ecommerce_payment_status === 'verifying' ? 'Reemplazar comprobante' : 'Enviar comprobante'}</button></form>}
  </section>;
}

function DigitalResource({ item }: { item: LibraryItem }) {
  const [access, setAccess] = useState<Awaited<ReturnType<typeof openDigitalResource>> | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const states = { available: 'Disponible para consultar', pending_payment: 'Pendiente de confirmación de pago', preparing: 'Entrega en preparación; contacta con la iglesia', cancelled: 'Pedido cancelado', reconciliation: 'Acceso en conciliación por reembolso' };
  return <article className="space-y-3 border-b border-slate-200 pb-4 dark:border-white/10"><h3 className="font-bold">{item.name}</h3><p className="text-sm">{states[item.state]}</p><p className="text-xs text-slate-500 dark:text-slate-400">Pedido #{item.order_id.slice(0, 8).toUpperCase()}</p>
    {item.state === 'available' && <button className={button} disabled={busy} onClick={async () => { setBusy(true); setError(''); setAccess(null); try { setAccess(await openDigitalResource(item.item_id)); } catch (e) { setError(reason(e)); } finally { setBusy(false); } }}>{busy ? 'Comprobando acceso…' : 'Preparar acceso al recurso'}</button>}
    {error && <p role="alert" className="text-red-700 dark:text-red-300">{error}</p>}{access && item.state === 'available' && <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800"><p>Este recurso se abre en Google Drive o Documentos de Google. Su enlace externo no caduca automáticamente; no lo compartas. Se comprobará tu compra cada vez que prepares el acceso desde esta biblioteca.</p>{access.instructions && <p className="whitespace-pre-wrap">{access.instructions}</p>}<a href={access.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="inline-flex min-h-11 items-center font-bold underline">Abrir recurso en Google</a></div>}
  </article>;
}
