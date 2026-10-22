import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, PackageCheck } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { getProductStock } from '../catalog';
import type { DbProduct } from '../types';
import { getInventory, mutateInventory, readInventoryPending } from '../services/inventoryService';
import type { InventoryAction, InventoryDetail } from '../services/inventoryService';

const panel = 'rounded-3xl border border-white/70 bg-white/70 p-5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60';
const input = 'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-white/20 dark:bg-slate-900 dark:text-white';
const button = 'min-h-11 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50';
const date = (value?: string | null) => value ? new Date(value).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }) : 'Pendiente de conteo físico';

export default function InventoryManager({ products, canEdit }: { products: DbProduct[]; canEdit: boolean }) {
  const [search, setSearch] = useState('');
  const [selected, select] = useState(products[0]?.id || '');
  const [filter, setFilter] = useState('all');
  const userId = useAuthStore(state => state.user?.id || '');
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['store-inventory', userId, selected], queryFn: () => getInventory(selected), enabled: Boolean(selected && userId), retry: false });
  const product = products.find(item => item.id === selected);
  const filtered = products.filter(p => `${p.name} ${p.sku || ''} ${p.category}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())
    && (filter === 'all' || (filter === 'digital' ? p.type === 'digital' : p.type !== 'digital')));
  const refresh = async (result: InventoryDetail) => {
    queryClient.setQueryData(['store-inventory', userId, result.product_id], result);
    await Promise.all([queryClient.invalidateQueries({ queryKey: ['products'] }), queryClient.invalidateQueries({ queryKey: ['public-store-catalog'] })]);
  };
  return <section className="relative isolate space-y-5 text-slate-900 dark:text-white" aria-label="Inventario de tienda">
    <div className="pointer-events-none absolute inset-x-0 -top-20 -z-10 h-96 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.11),transparent_38%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.09),transparent_35%)]" />
    <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Control de existencias</p><h2 className="font-serif text-2xl font-bold">Inventario central</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">El stock registrado no acredita un conteo. Registra lo contado físicamente antes de abrir ventas.</p></div>
    <div className="flex flex-wrap gap-3"><label className="flex min-w-0 flex-1 items-center gap-2"><Search size={18} /><span className="sr-only">Buscar en inventario</span><input className={input} value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre, SKU o categoría" /></label><select className={input + ' sm:w-auto'} aria-label="Tipo de inventario" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todos los tipos</option><option value="physical">Físicos</option><option value="digital">Digitales</option></select></div>
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,2fr)]">
      <div className="space-y-2">{filtered.map(p => <button key={p.id} type="button" aria-pressed={selected === p.id} onClick={() => select(p.id)} className={'min-h-16 w-full break-words rounded-2xl border p-4 text-left focus-visible:outline-2 focus-visible:outline-blue-600 ' + (p.id === selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900')}><span className="block font-bold">{p.name}</span><span className="mt-1 block text-xs text-slate-600 dark:text-slate-300">{p.sku || 'Sin SKU'} · {p.type === 'digital' ? 'Digital · sin stock físico' : `${p.id === query.data?.product_id ? query.data.points.reduce((sum, point) => sum + point.stock, 0) : getProductStock(p)} registradas`}</span></button>)}{!filtered.length && <p className="p-4 text-sm">No hay productos que coincidan.</p>}</div>
      <div className="min-w-0">{query.isPending && selected ? <p role="status" className="flex items-center gap-2 py-10"><Loader2 className="animate-spin" /> Consultando ficha…</p> : query.isError ? <div role="alert" className={panel}><p>{query.error.message}</p><button type="button" className={button + ' mt-3'} onClick={() => { void query.refetch(); }}>Reintentar ficha</button></div> : product && query.data ? <InventoryCard key={`${userId}:${product.id}`} product={product} data={query.data} userId={userId} canEdit={canEdit} onSaved={refresh} /> : <p className="p-5">Selecciona un producto para consultar su ficha.</p>}</div>
    </div>
  </section>;
}

function InventoryCard({ product, data, userId, canEdit, onSaved }: { product: DbProduct; data: InventoryDetail; userId: string; canEdit: boolean; onSaved: (result: InventoryDetail) => Promise<void> }) {
  const [location, setLocation] = useState(data.profile.location || '');
  const [minimum, setMinimum] = useState(data.profile.minimum ?? 5);
  const [notes, setNotes] = useState(data.profile.notes || '');
  const [fields, setFields] = useState(() => Object.entries(data.profile.custom_fields || {}).map(([name, value]) => ({ name, value: typeof value === 'string' ? value : JSON.stringify(value) })));
  const [reason, setReason] = useState('');
  const [point, setPoint] = useState(data.points[0]?.key || '');
  const [quantity, setQuantity] = useState('');
  const [direction, setDirection] = useState('in');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(() => readInventoryPending(userId));
  const draft = data.counts.find(c => c.state === 'draft');
  const [observed, setObserved] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(draft?.observed || {}).map(([k, v]) => [k, String(v)])));
  const confirm = useConfirmStore(state => state.confirm);
  const run = async (action?: InventoryAction, extra: Record<string, unknown> = {}) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await mutateInventory(userId, action, action ? { product_id: product.id, reason, ...extra } : undefined);
      await onSaved(result); setMessage('Operación confirmada y guardada.');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo confirmar la operación'); }
    finally { setPending(readInventoryPending(userId)); setBusy(false); }
  };
  const locked = !canEdit || busy || Boolean(pending);
  const quantities = () => Object.fromEntries(Object.entries(observed).filter(([, v]) => v.trim() !== '').map(([k, v]) => [k, Number(v)]));
  const physical = product.type !== 'digital';
  const stock = data.points.reduce((sum, p) => sum + p.stock, 0);
  const mismatch = physical && data.points.some(p => p.variant_id) && product.stock !== stock;
  return <div className="space-y-5">
    <div className={panel}><h3 className="break-words font-serif text-xl font-bold">{product.name}</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{product.sku || 'Sin SKU'} · {product.category}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{(physical ? [['Registradas', stock], ['Reservadas', data.reserved], ['Disponibles', Math.max(0, stock - data.reserved)]] : [['Tipo', 'Digital'], ['Recurso', product.product_digital_assets?.drive_link ? 'Configurado' : 'Pendiente']]).map(([label, value]) => <p key={label} className="text-sm"><span className="block text-slate-500 dark:text-slate-400">{label}</span><strong className="text-xl">{value}</strong></p>)}</div>
      {physical && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100"><PackageCheck className="mr-2 inline" size={18} />Último conteo: {date(data.profile.last_count_at)}{data.profile.last_count_by && <span className="mt-1 block break-all text-xs">Responsable: {data.profile.last_count_name || data.profile.last_count_by}</span>}</p>}
      {mismatch && <p className="mt-3 text-sm text-red-700 dark:text-red-300">El stock base ({product.stock}) difiere de las variantes ({stock}). Un conteo completo conciliará ambos valores.</p>}
      {physical && stock - data.reserved <= minimum && <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">Disponibilidad igual o inferior al mínimo de reposición ({minimum}).</p>}
    </div>
    {error && <p role="alert" className="break-words rounded-xl bg-red-50 p-4 text-red-800 dark:bg-red-950 dark:text-red-200">{error}</p>}{message && <p role="status" className="rounded-xl bg-green-50 p-4 text-green-800 dark:bg-green-950 dark:text-green-100">{message}</p>}
    {pending && <div className={panel}><p>Hay una operación sin confirmar. Recupera su resultado antes de registrar otra; se conserva la misma referencia.</p><button type="button" disabled={busy || !canEdit} className={button + ' mt-3'} onClick={() => { void run(); }}>Recuperar operación pendiente</button></div>}
    <form className={panel + ' space-y-4'} onSubmit={e => { e.preventDefault(); const names = fields.map(f => f.name.trim()); if (names.some(n => !n) || new Set(names).size !== names.length) { setError('Cada campo adicional necesita un nombre único.'); return; } void run('inventory_profile', { location, minimum, notes, custom_fields: Object.fromEntries(fields.map(f => [f.name.trim(), f.value])) }); }}>
      <h4 className="font-bold">Ficha de gestión</h4><label className="block text-sm">Ubicación o área responsable<input disabled={locked} className={input + ' mt-1'} maxLength={240} value={location} onChange={e => setLocation(e.target.value)} /></label>
      {physical && <label className="block text-sm">Mínimo de reposición<input disabled={locked} className={input + ' mt-1'} type="number" min="0" max="1000000" step="1" required value={minimum} onChange={e => setMinimum(Number(e.target.value))} /></label>}
      <label className="block text-sm">Notas de gestión<textarea disabled={locked} className={input + ' mt-1'} maxLength={4000} value={notes} onChange={e => setNotes(e.target.value)} /></label>
      {fields.map((field, i) => <div key={i} className="grid min-w-0 gap-2 sm:grid-cols-[1fr_1fr_auto]"><input disabled={locked} className={input} aria-label={`Nombre del campo ${i + 1}`} value={field.name} onChange={e => setFields(fields.map((f, index) => index === i ? { ...f, name: e.target.value } : f))} /><input disabled={locked} className={input} aria-label={`Valor del campo ${i + 1}`} value={field.value} onChange={e => setFields(fields.map((f, index) => index === i ? { ...f, value: e.target.value } : f))} /><button disabled={locked} type="button" className="min-h-11 px-2 text-sm underline" onClick={() => setFields(fields.filter((_, index) => index !== i))}>Quitar campo {i + 1}</button></div>)}
      <div className="flex flex-wrap gap-3"><button disabled={locked} type="button" className="min-h-11 text-sm font-bold underline" onClick={() => setFields([...fields, { name: '', value: '' }])}>Añadir campo</button><button disabled={locked} className={button}>Guardar ficha</button></div>
    </form>
    {physical && <div className={panel + ' space-y-4'}><h4 className="font-bold">Conteo y movimientos</h4><label className="block text-sm">Motivo, referencia o detalle del conteo<input disabled={locked} className={input + ' mt-1'} minLength={3} maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label>
      {!draft ? <button disabled={locked || reason.trim().length < 3} className={button} onClick={() => { setObserved({}); void run('inventory_count_start'); }}>Iniciar conteo físico</button> : <div className="space-y-3"><p className="text-sm">Conteo abierto: {date(draft.created_at)}. Guarda un borrador o confirma todas las cantidades. Si cambia el inventario, debes iniciar un conteo nuevo.</p>{draft.snapshot.map(p => <label key={p.key} className="block text-sm">{p.label} · registradas al inicio: {p.stock}<input disabled={locked} aria-label={`Cantidad contada: ${p.label}`} className={input + ' mt-1'} type="number" min="0" max="1000000" step="1" value={observed[p.key] ?? ''} onChange={e => setObserved({ ...observed, [p.key]: e.target.value })} placeholder="Sin contar" /></label>)}
        <div className="flex flex-wrap gap-3"><button disabled={locked || reason.trim().length < 3} className={button} onClick={() => { void run('inventory_count_save', { count_id: draft.id, observed: quantities() }); }}>Guardar borrador</button><button disabled={locked || reason.trim().length < 3} className={button} onClick={async () => { if (await confirm({ title: 'Confirmar conteo físico', message: 'Se aplicarán las cantidades contadas y se registrarán las diferencias. Confirma que provienen de un conteo real.' })) await run('inventory_count_commit', { count_id: draft.id, observed: quantities() }); }}>Confirmar conteo</button><button disabled={locked || reason.trim().length < 3} className="min-h-11 px-3 underline" onClick={() => { void run('inventory_count_cancel', { count_id: draft.id }); }}>Cancelar conteo</button></div>
      </div>}
      <form className="space-y-3 border-t border-slate-200 pt-4 dark:border-white/10" onSubmit={e => { e.preventDefault(); const selected = data.points.find(p => p.key === point); if (!selected) { setError('Selecciona una variante.'); return; } void run('inventory_move', { variant_id: selected.variant_id, quantity: Number(quantity), direction }); }}><h4 className="font-bold">Registrar entrada o salida</h4><label className="block text-sm">Variante<select disabled={locked} className={input + ' mt-1'} value={point} onChange={e => setPoint(e.target.value)}>{data.points.map(p => <option key={p.key} value={p.key}>{p.label} · {p.stock} registradas</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm">Movimiento<select disabled={locked} className={input + ' mt-1'} value={direction} onChange={e => setDirection(e.target.value)}><option value="in">Entrada</option><option value="out">Salida</option></select></label><label className="block text-sm">Unidades<input disabled={locked} className={input + ' mt-1'} type="number" min="1" max="1000000" step="1" required value={quantity} onChange={e => setQuantity(e.target.value)} /></label></div><button disabled={locked || reason.trim().length < 3} className={button}>Registrar movimiento</button></form>
      <div className="space-y-2 text-sm">{data.points.map(p => { const reserved = data.reservations.filter(r => r.variant_id === p.variant_id).reduce((sum, r) => sum + r.quantity, 0); return <p key={p.key} className="break-words">{p.label}: {p.stock} registradas · {reserved} reservadas · {Math.max(0, p.stock - reserved)} disponibles</p>; })}</div>
    </div>}
    <div className={panel}><h4 className="font-bold">Historial de movimientos</h4><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Últimos 100 movimientos. Se conservan los anteriores en el registro.</p>{!data.movements.length && <p className="mt-4 text-sm">No hay movimientos registrados desde la implantación de este control.</p>}<ol className="mt-4 space-y-4">{data.movements.map(m => <li key={m.id} className="break-words border-b border-slate-200 pb-3 text-sm dark:border-white/10"><strong>{m.quantity > 0 ? '+' : ''}{m.quantity} · {m.previous_stock} → {m.new_stock}</strong><p>{m.reason || m.movement_type}</p><p className="text-xs text-slate-500 dark:text-slate-400">{date(m.created_at)}</p><p className="break-all text-xs text-slate-500 dark:text-slate-400">Responsable: {m.created_by_name || m.actor_id || 'Operación de servidor'}{m.reference_order_id ? ` · Pedido: ${m.reference_order_id}` : ''}</p></li>)}</ol></div>
    {data.counts.length > 0 && <div className={panel}><h4 className="font-bold">Historial de conteos</h4><ul className="mt-3 space-y-3 text-sm">{data.counts.map(c => <li key={c.id} className="break-words">{c.state === 'committed' ? 'Confirmado' : c.state === 'cancelled' ? 'Cancelado' : 'Borrador'} · {date(c.committed_at || c.created_at)}<p>{c.reason}</p><p className="break-all text-xs text-slate-500 dark:text-slate-400">Responsable: {c.committed_by_name || c.created_by_name || c.committed_by || c.created_by}</p></li>)}</ul></div>}
  </div>;
}
