import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ShoppingBag, Trash2, Building2, Upload } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getLineSubtotal, getLineTax } from '../../features/store/pricing';
import { formatStoreCurrency, isDigitalProduct } from '../../features/store/catalog';
import { forgetCompletedCheckout, getCheckout, getCheckoutOptions, readPendingCheckout, reserveCheckout, retryPendingCheckout, submitPrivateReceipt } from '../../features/store/services/checkoutService';
import type { SecureOrder } from '../../features/store/services/checkoutService';
import TrackingKey from '../../features/store/components/TrackingKey';

const panel = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6';
const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 disabled:opacity-50';
const input = 'mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-transparent px-3 dark:border-slate-700 focus-visible:outline-2 focus-visible:outline-blue-500';
const message = (error: unknown) => error instanceof Error ? error.message : 'No se pudo completar la operación';

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const { user, isLoading: authLoading } = useAuthStore();
  const options = useQuery({ queryKey: ['store-checkout-options'], queryFn: getCheckoutOptions, staleTime: 30000, retry: false });
  const [order, setOrder] = useState<SecureOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [uncertain, setUncertain] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [contact, setContact] = useState({ name: '', email: '', phone: '' });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const physical = items.some(item => !isDigitalProduct(item.product));
  const digital = items.some(item => isDigitalProduct(item.product));
  const subtotal = items.reduce((sum, item) => sum + Math.round(getLineSubtotal(item.product, item.quantity, item.variant) * 100) / 100, 0);
  const tax = items.reduce((sum, item) => sum + Math.round(getLineTax(item.product, item.quantity, item.variant) * 100) / 100, 0);
  const fee = Math.round(Math.round(subtotal * 100) * Math.round((options.data?.transfer_fee_percent || 0) * 100) / 10000) / 100;
  const expectedTotal = Math.round((subtotal + tax + fee) * 100) / 100;

  useEffect(() => {
    if (authLoading) return;
    let mounted = true;
    async function restore() {
      try {
        const previous = readPendingCheckout();
        if (previous?.orderId) {
          const restored = await getCheckout(previous.orderId, previous.secret);
          if (mounted) setOrder(restored);
        } else if (previous && mounted) setUncertain(true);
      } catch (caught) { if (mounted) setError(message(caught)); }
      finally { if (mounted) setRestoring(false); }
    }
    void restore();
    return () => { mounted = false; };
  }, [authLoading, user?.id]);

  const reserve = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const created = await reserveCheckout({ ...contact, delivery: physical ? 'pickup' : '', expected_total: expectedTotal,
        items: items.map(item => ({ product_id: item.product.id, variant_id: item.variant?.id || null, quantity: item.quantity })) }, user?.id || 'guest');
      setOrder(created); setUncertain(false);
    } catch (caught) {
      setError(message(caught));
      try { setUncertain(Boolean(readPendingCheckout())); }
      catch (readError) { setError(message(readError)); }
    } finally { setBusy(false); }
  };
  const retry = async () => {
    setBusy(true); setError(null);
    try { setOrder(await retryPendingCheckout()); setUncertain(false); }
    catch (caught) { setError(message(caught)); setUncertain(Boolean(readPendingCheckout())); }
    finally { setBusy(false); }
  };
  const receipt = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!order || !file || busy) return;
    setBusy(true); setError(null);
    try {
      setOrder(await submitPrivateReceipt(order.id, file, readPendingCheckout()?.secret));
      clearCart(); setFile(null);
    } catch (caught) { setError(message(caught)); }
    finally { setBusy(false); }
  };
  const refresh = async () => {
    if (!order) return;
    setBusy(true); setError(null);
    try { setOrder(await getCheckout(order.id, readPendingCheckout()?.secret)); }
    catch (caught) { setError(message(caught)); }
    finally { setBusy(false); }
  };
  const submitted = order?.ecommerce_payment_status === 'verifying';
  const pendingAccess = readPendingCheckout();
  const paid = order?.ecommerce_payment_status === 'paid';
  const expired = order?.status === 'cancelled' || Boolean(order?.reservation_expires_at && !submitted && !paid && new Date(order.reservation_expires_at).getTime() <= now);

  return <div className="mx-auto max-w-6xl px-4 py-8 text-slate-900 dark:text-white sm:px-8">
    <Helmet><title>Carrito y compra | Tienda Jerusalén</title><meta name="description" content="Revisa tu compra, reserva y comprobante privado en Tienda Jerusalén." /></Helmet>
    <p className="text-xs font-bold uppercase tracking-widest text-church-gold-emphasis">Tienda Jerusalén</p>
    <h1 className="mt-3 font-serif text-3xl font-bold">{order ? 'Tu pedido' : 'Revisión del carrito'}</h1>
    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">1. Revisa tu compra · 2. Reserva · 3. Transfiere y adjunta el comprobante</p>
    {error && <p role="alert" className="my-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}
    {options.isError && <p role="alert" className="my-5 text-sm text-red-700 dark:text-red-300">{options.error.message} <button type="button" onClick={() => { void options.refetch(); }} className="min-h-11 underline">Reintentar configuración</button></p>}
    {options.isSuccess && !options.data.enabled && <p className="my-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">La tienda está en preparación. Puedes revisar el catálogo; contacta con la iglesia antes de transferir.</p>}
    {restoring || authLoading ? <p role="status" className="flex gap-3 py-10"><Loader2 className="animate-spin" /> Consultando tu pedido…</p> : order && (!order.user_id || order.user_id === user?.id) ?
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className={panel} aria-label="Estado del pedido">
          <h2 className="font-serif text-xl font-bold">Pedido #{order.id.slice(0, 8).toUpperCase()}</h2>
          <p className="mt-2 break-all font-mono text-xs text-slate-500">Referencia completa: {order.id}</p>
          <p className="mt-4 text-2xl font-bold">{formatStoreCurrency(order.total)}</p>
          <ul className="mt-4 space-y-2 text-sm">{order.order_items?.map(item => <li key={item.id}>{item.products?.name || 'Producto'} · {item.quantity} × {formatStoreCurrency(item.price)}</li>)}</ul>
          <p className="mt-4 text-sm">{expired ? 'Reserva vencida o cancelada. Contacta con la iglesia si ya transferiste; no repitas el pago.' : paid ? 'Pago confirmado. Consulta la entrega de tus productos.' : submitted ? 'Comprobante recibido. El pago está en revisión; no vuelvas a transferir.' : 'Tu reserva está registrada. Usa el total confirmado para transferir.'}</p>
          {order.reservation_expires_at && !submitted && !paid && !expired && <p className="mt-3 text-sm">Adjunta tu comprobante antes del {new Date(order.reservation_expires_at).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })} (hora de Ecuador).</p>}
          <button type="button" onClick={() => { void refresh(); }} disabled={busy} className={button + ' mt-5'}>Actualizar estado</button>
          {order.user_id ? <Link to="/mis-compras" className="mt-4 block min-h-11 underline">Seguimiento y biblioteca en Mis compras</Link> : pendingAccess?.orderId === order.id && <TrackingKey orderId={order.id} secret={pendingAccess.secret} />}
          {(paid || expired) && <button type="button" onClick={() => { forgetCompletedCheckout(); setOrder(null); }} className="mt-4 block min-h-11 text-sm underline">Volver al carrito</button>}
        </section>
        {!expired && !submitted && !paid && <section className={panel} aria-label="Transferencia y comprobante">
          <h2 className="flex items-center gap-2 font-serif text-xl font-bold"><Building2 /> Transferencia bancaria</h2>
          {order.bank ? <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p>{order.bank.bank_name}</p><p className="mt-2 break-all font-mono">{order.bank.bank_account}</p>{order.bank.ruc && <p className="mt-2 text-sm">RUC: {order.bank.ruc}</p>}</div> : <p className="mt-4">Los datos de transferencia no están disponibles. Actualiza el pedido o contacta con la iglesia antes de pagar.</p>}
          <form onSubmit={receipt} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold" htmlFor="receipt">Comprobante privado (JPG, PNG, WebP o PDF; hasta 5 MB)</label>
            <input id="receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={event => setFile(event.target.files?.[0] || null)} disabled={busy} className="block w-full text-sm" />
            <button className={button} disabled={!file || busy || !order.bank}>{busy ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />} Enviar comprobante</button>
            <p className="text-xs text-slate-500">Adjuntar un comprobante no confirma el cobro. Revisaremos el ingreso antes de entregar.</p>
          </form>
        </section>}
      </div> : uncertain ? <section className={panel + ' mt-6'}>
        <h2 className="font-bold">Hay una solicitud pendiente de respuesta</h2><p className="mt-3 text-sm">Consultaremos el mismo registro para evitar duplicar tu pedido. No repitas una transferencia.</p>
        <button type="button" onClick={() => { void retry(); }} disabled={busy} className={button + ' mt-4'}>Recuperar mi pedido</button>
      </section> : items.length === 0 ? <section className={panel + ' mt-6 text-center'}><ShoppingBag className="mx-auto" /><p className="mt-4">Tu carrito está vacío.</p><Link to="/tienda" className={button + ' mt-5'}>Explorar tienda</Link></section> :
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className={panel} aria-label="Productos del carrito">
          <h2 className="font-serif text-xl font-bold">Productos</h2>
          <ul className="divide-y divide-slate-200 dark:divide-white/10">{items.map(item => <li key={item.product.id + '-' + (item.variant?.id || '')} className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div className="min-w-0 flex-1"><h3 className="font-bold">{item.product.name}</h3><p className="mt-1 text-sm text-slate-500">{item.variant?.color_name} {item.variant?.size} {isDigitalProduct(item.product) && 'Acceso digital'}</p><p className="mt-2 font-bold">{formatStoreCurrency(getLineSubtotal(item.product, item.quantity, item.variant))}</p></div>
            {!isDigitalProduct(item.product) && <div className="flex items-center gap-3"><button type="button" aria-label={'Disminuir ' + item.product.name} onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity - 1)} className="min-h-11 min-w-11 rounded-lg border">−</button><span>{item.quantity}</span><button type="button" aria-label={'Aumentar ' + item.product.name} onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity + 1)} className="min-h-11 min-w-11 rounded-lg border">+</button></div>}
            <button type="button" aria-label={'Quitar ' + item.product.name} onClick={() => removeItem(item.product.id, item.variant?.id)} className="min-h-11 p-3 text-red-600"><Trash2 size={18} /></button>
          </li>)}</ul>
        </section>
        <form onSubmit={reserve} className={panel + ' space-y-4'}>
          <h2 className="font-serif text-xl font-bold">Contacto y resumen</h2>
          <label className="block text-sm" htmlFor="customer-name">Nombre completo<input id="customer-name" autoComplete="name" required minLength={2} maxLength={160} value={contact.name} onChange={event => setContact({ ...contact, name: event.target.value })} className={input} /></label>
          <label className="block text-sm" htmlFor="customer-email">Correo<input id="customer-email" type="email" autoComplete="email" required maxLength={254} value={contact.email} onChange={event => setContact({ ...contact, email: event.target.value })} className={input} /></label>
          {physical && <label className="block text-sm" htmlFor="customer-phone">Teléfono para coordinar retiro<input id="customer-phone" type="tel" autoComplete="tel" required value={contact.phone} onChange={event => setContact({ ...contact, phone: event.target.value })} className={input} /></label>}
          <dl className="space-y-3 border-t pt-4 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{formatStoreCurrency(subtotal)}</dd></div><div className="flex justify-between"><dt>IVA según productos</dt><dd>{formatStoreCurrency(tax)}</dd></div>{fee > 0 && <div className="flex justify-between"><dt>Recargo del medio de pago</dt><dd>{formatStoreCurrency(fee)}</dd></div>}<div className="flex justify-between"><dt>{physical ? 'Retiro coordinado en iglesia' : 'Entrega digital'}</dt><dd>Sin envío</dd></div><div className="flex justify-between text-lg font-bold"><dt>Total estimado</dt><dd>{formatStoreCurrency(expectedTotal)}</dd></div></dl>
          {digital && !user ? <p className="text-sm">Tu carrito incluye un digital. <Link to="/login?redirectTo=%2Fcart" className="font-bold underline">Inicia sesión</Link> para vincularlo a tu biblioteca.</p> : <button className={button + ' w-full'} disabled={busy || !options.data?.enabled}>{busy && <Loader2 className="animate-spin" size={18} />} Reservar y ver datos de pago</button>}
          <p className="text-xs leading-relaxed text-slate-500">El servidor confirma disponibilidad y total antes de mostrar la transferencia. Dispones de 24 horas para adjuntar el comprobante. No transfieras antes de tener tu referencia.</p>
        </form>
      </div>}
  </div>;
}
