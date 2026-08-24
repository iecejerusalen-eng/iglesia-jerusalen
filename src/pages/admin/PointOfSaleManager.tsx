import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag, Search, Plus, Minus, Trash2, CreditCard, DollarSign,
  Send, User, Printer, CheckCircle2, AlertCircle, RefreshCw, X, FileText, Lock, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import AdminHeader from '../../components/admin/AdminHeader';
import { supabase } from '../../config/supabase';
import type { Product } from '../../types';
import { posService, type PosSession, type PosCartItem } from '../../features/store/services/posService';
import soloLogoColorido from '../../assets/Jerusalén/solo logo colorido.svg';

const formatCurrency = (val: number) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(val);

export default function PointOfSaleManager() {
  const [session, setSession] = useState<PosSession | null>(null);
  const [openingBalance, setOpeningBalance] = useState<number>(50);
  const [cashierName, setCashierName] = useState<string>('Cajero Principal');

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');

  // Cart
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [customerName, setCustomerName] = useState('Cliente General');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  
  // Modals
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<{ receiptNumber: string; total: number; amountPaid: number; changeDue: number; date: string } | null>(null);

  // Load Session and Products
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoadingProducts(true);
      const activeSess = await posService.getActiveSession(cashierName);
      if (isMounted) setSession(activeSess);

      try {
        const { data } = await supabase
          .from('products')
          .select('*')
          .is('deleted_at', null)
          .order('name');
        
        if (isMounted && data && data.length > 0) {
          setProducts(data as Product[]);
        } else if (isMounted) {
          setProducts([
            { id: 'p-1', name: 'Biblia de Estudio Jerusalén', price: 35.00, stock: 15, category: 'Libros', type: 'physical' } as Product,
            { id: 'p-2', name: 'Camiseta Oficial Jerusalén (Talla M)', price: 20.00, stock: 30, category: 'Ropa', type: 'physical' } as Product,
            { id: 'p-3', name: 'Taza Cerámica "Jesucristo es el Mismo"', price: 12.00, stock: 25, category: 'Recursos', type: 'physical' } as Product,
          ]);
        }
      } catch {
        if (isMounted) {
          setProducts([
            { id: 'p-1', name: 'Biblia de Estudio Jerusalén', price: 35.00, stock: 15, category: 'Libros', type: 'physical' } as Product,
            { id: 'p-2', name: 'Camiseta Oficial Jerusalén (Talla M)', price: 20.00, stock: 30, category: 'Ropa', type: 'physical' } as Product,
          ]);
        }
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    };

    void load();
    return () => { isMounted = false; };
  }, [cashierName]);

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add('Todos');
    products.forEach(p => { if (p.category) set.add(p.category); });
    return Array.from(set);
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = category === 'Todos' || p.category === category;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, category, search]);

  // Cart Calculations
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0), [cart]);
  const taxTotal = useMemo(() => subtotal * 0.15, [subtotal]); // 15% IVA Ecuador
  const grandTotal = useMemo(() => subtotal + taxTotal, [subtotal, taxTotal]);
  
  const parsedPaid = parseFloat(amountPaid) || 0;
  const changeDue = Math.max(0, parsedPaid - grandTotal);

  // Cart handlers
  const handleAddToCart = (product: Product) => {
    if (product.stock !== undefined && product.stock <= 0) {
      toast.error(`Agotado: ${product.name} no tiene stock disponible.`);
      return;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        const newQty = next[existingIndex].quantity + 1;
        if (product.stock !== undefined && newQty > product.stock) {
          toast.warning(`Solo quedan ${product.stock} unidades de este producto.`);
          return prev;
        }
        next[existingIndex].quantity = newQty;
        return next;
      }
      return [...prev, { product, quantity: 1, unit_price: product.price, discount: 0 }];
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (item.product.stock !== undefined && newQty > item.product.stock) {
            toast.warning(`Supera el stock disponible (${item.product.stock}).`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as PosCartItem[];
    });
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSess = await posService.openSession(cashierName, openingBalance);
    setSession(newSess);
    toast.success(`Turno de caja iniciado con $${openingBalance.toFixed(2)} USD.`);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('El carrito de venta está vacío.');
      return;
    }

    if (paymentMethod === 'cash' && parsedPaid < grandTotal) {
      toast.error(`Monto ingresado ($${parsedPaid.toFixed(2)}) es menor al total ($${grandTotal.toFixed(2)}).`);
      return;
    }

    setIsProcessing(true);
    try {
      const result = await posService.processPosSale({
        sessionId: session?.id,
        cashierName,
        customerName,
        customerPhone,
        paymentMethod,
        items: cart,
        subtotal,
        taxTotal,
        discountTotal: 0,
        total: grandTotal,
        amountPaid: paymentMethod === 'cash' ? parsedPaid : grandTotal,
        changeDue: paymentMethod === 'cash' ? changeDue : 0,
      });

      setReceiptData({
        receiptNumber: result.receiptNumber,
        total: grandTotal,
        amountPaid: paymentMethod === 'cash' ? parsedPaid : grandTotal,
        changeDue: paymentMethod === 'cash' ? changeDue : 0,
        date: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      });

      // Clear cart
      setCart([]);
      setAmountPaid('');
      toast.success(`Venta completada con éxito. Comprobante: ${result.receiptNumber}`);
    } catch {
      toast.error('Ocurrió un error al registrar la venta.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Punto de Venta Presencial (POS - Templo & Librería)"
        description="Terminal táctil para cobro en caja, control de turnos, emisión de recibos y descuento de inventario en tiempo real"
      />

      {/* SHIFT BANNER */}
      {!session ? (
        <div className="mx-auto max-w-xl rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 to-slate-950 p-8 text-center shadow-2xl space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Lock size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-bold text-white">Apertura de Caja Registradora</h2>
            <p className="text-xs text-slate-400">
              Para iniciar las ventas del día en el templo o librería, ingresa el monto inicial de la caja chica.
            </p>
          </div>
          <form onSubmit={handleOpenShift} className="space-y-4 pt-2">
            <div>
              <label className="block text-left text-xs font-semibold text-slate-300 mb-1">Cajero / Servidor Responsable</label>
              <input
                type="text"
                required
                value={cashierName}
                onChange={e => setCashierName(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-left text-xs font-semibold text-slate-300 mb-1">Monto Inicial de Caja (USD)</label>
              <input
                type="number"
                step="0.01"
                required
                value={openingBalance}
                onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)}
                className="w-full h-11 px-4 rounded-xl bg-slate-900 border border-white/10 text-sm font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition hover:scale-102"
            >
              Iniciar Turno de Caja
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* CATALOG SECTION (LEFT 7 COLS) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Search & Category Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/80 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o SKU..."
                  className="w-full h-10 pl-9 pr-4 text-xs font-semibold rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      category === cat
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            {loadingProducts ? (
              <div className="py-20 text-center text-slate-400">
                <RefreshCw className="animate-spin mx-auto mb-2 text-amber-400" size={28} />
                <span className="text-xs">Cargando inventario para caja...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center bg-slate-900/60 rounded-2xl border border-white/10 p-6 text-slate-400 text-xs">
                No hay productos disponibles en esta categoría.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredProducts.map(prod => {
                  const isOutOfStock = prod.stock !== undefined && prod.stock <= 0;
                  return (
                    <button
                      key={prod.id}
                      onClick={() => handleAddToCart(prod)}
                      disabled={isOutOfStock}
                      className={`group flex flex-col justify-between p-4 rounded-2xl border text-left transition relative overflow-hidden ${
                        isOutOfStock
                          ? 'opacity-40 border-white/5 bg-slate-950 cursor-not-allowed'
                          : 'bg-slate-900/90 border-white/10 hover:border-amber-400/50 hover:bg-slate-850 cursor-pointer shadow-sm'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                          {prod.category || 'Producto'}
                        </span>
                        <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                          {prod.name}
                        </h4>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-2">
                        <strong className="text-sm font-extrabold text-white">
                          {formatCurrency(prod.price)}
                        </strong>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isOutOfStock ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {isOutOfStock ? 'Agotado' : `${prod.stock ?? '∞'} unid`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* CART & POS CHECKOUT (RIGHT 5 COLS) */}
          <div className="lg:col-span-5 space-y-4 bg-slate-900 rounded-3xl border border-white/10 p-5 shadow-2xl sticky top-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-white">
                <ShoppingBag className="text-amber-400" size={20} />
                <h3 className="font-serif text-base font-bold">Carrito de Venta POS</h3>
              </div>
              <button
                onClick={() => setCart([])}
                className="text-xs text-slate-400 hover:text-red-400 font-semibold"
              >
                Vaciar
              </button>
            </div>

            {/* Customer info */}
            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-slate-300">Cliente / Miembro (CRM)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Nombre Cliente"
                  className="h-9 px-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="Teléfono (Opcional)"
                  className="h-9 px-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <p className="py-10 text-center text-xs text-slate-500 italic">
                  Selecciona productos del catálogo para agregarlos a la orden.
                </p>
              ) : (
                cart.map(item => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold truncate">{item.product.name}</p>
                      <span className="text-[11px] text-amber-400 font-mono">
                        {formatCurrency(item.unit_price)} c/u
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleUpdateQty(item.product.id, -1)}
                        className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(item.product.id, 1)}
                        className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals Summary */}
            <div className="space-y-1.5 border-t border-white/10 pt-3 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA (15%)</span>
                <span>{formatCurrency(taxTotal)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-amber-400 pt-1 border-t border-white/10">
                <span>Total a Cobrar</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-slate-300">Método de Pago</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition ${
                    paymentMethod === 'cash' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-300 border-white/10'
                  }`}
                >
                  <DollarSign size={14} /> Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition ${
                    paymentMethod === 'card' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-300 border-white/10'
                  }`}
                >
                  <CreditCard size={14} /> Tarjeta
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition ${
                    paymentMethod === 'transfer' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-300 border-white/10'
                  }`}
                >
                  <Send size={14} /> Transf.
                </button>
              </div>

              {/* Cash Paid input */}
              {paymentMethod === 'cash' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Efectivo Recibido</label>
                    <input
                      type="number"
                      step="0.01"
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-10 px-3 bg-slate-950 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Vuelto / Cambio</label>
                    <div className="h-10 px-3 bg-slate-950/80 border border-white/10 rounded-xl flex items-center text-sm font-black text-emerald-400">
                      {formatCurrency(changeDue)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Execute Sale Button */}
            <button
              disabled={isProcessing || cart.length === 0}
              onClick={handleCheckout}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 transition hover:scale-102 disabled:opacity-50"
            >
              {isProcessing ? 'Procesando venta…' : `Cobrar ${formatCurrency(grandTotal)}`}
            </button>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-sm p-6 text-center space-y-5 shadow-2xl text-white">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 size={28} />
            </div>
            
            <div>
              <h3 className="font-serif text-xl font-bold">¡Venta Exitosa!</h3>
              <p className="text-xs text-slate-400">Comprobante de Caja POS</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 space-y-2 text-xs font-mono text-left">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span>Nº Comprobante</span>
                <strong className="text-amber-400">{receiptData.receiptNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Cobrado:</span>
                <strong>{formatCurrency(receiptData.total)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Monto Recibido:</span>
                <span>{formatCurrency(receiptData.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Vuelto:</span>
                <span>{formatCurrency(receiptData.changeDue)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer size={15} /> Imprimir
              </button>
              <button
                onClick={() => setReceiptData(null)}
                className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Siguiente Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
