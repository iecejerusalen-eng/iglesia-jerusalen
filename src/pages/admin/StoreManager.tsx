import { useStoreDialog } from '../../features/store/hooks/useStoreDialog';
import { lazy, Suspense, useState } from 'react';
import { useConfirmStore } from '../../store/useConfirmStore';
import { Link } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { AdminErrorState } from '../../components/admin/AdminState';
import { getProductStock, formatStoreCurrency } from '../../features/store/catalog';
import AdminHeader from '../../components/admin/AdminHeader';
import { Package, FolderOpen, ClipboardList, Users, ShieldAlert, X, AlertCircle, Loader2, TrendingUp, AlertTriangle, Clock, RefreshCw, ExternalLink, Settings, ShoppingBag } from 'lucide-react';


import type { Order, OrderStatus } from '../../types';
import type { DbProduct, StoreCategory, Supplier, Dispute } from '../../features/store/types';

import {
  useProducts,
  useCategories,
  useOrders,
  useSuppliers,
  useDisputes
} from '../../features/store/hooks/useStoreItems';

import { useStoreMutations } from '../../features/store/hooks/useStoreMutations';

import ProductList from '../../features/store/components/ProductList';
const ProductForm = lazy(() => import('../../features/store/components/ProductForm'));
const CategoryManager = lazy(() => import('../../features/store/components/CategoryManager'));
const OrderManager = lazy(() => import('../../features/store/components/OrderManager'));
const SupplierManager = lazy(() => import('../../features/store/components/SupplierManager'));
const DisputeManager = lazy(() => import('../../features/store/components/DisputeManager'));

type StoreTab = 'products' | 'categories' | 'orders' | 'suppliers' | 'disputes';
export const StoreWorkspace = ({ initialTab = 'products' }: { initialTab?: StoreTab }) => {
  const { hasPermission, isAdmin } = usePermissions();
  const canViewProducts = hasPermission('products');
  const canViewOrders = hasPermission('orders');
  const canEditProducts = hasPermission('products', 'edit');
  const canEditOrders = hasPermission('orders', 'edit');
  const confirm = useConfirmStore((state) => state.confirm);
  const [activeTab, setActiveTab] = useState<StoreTab>(initialTab);

  const productsQuery = useProducts(canViewProducts);
  const categoriesQuery = useCategories(canViewProducts);
  const ordersQuery = useOrders(canViewOrders);
  const suppliersQuery = useSuppliers(isAdmin && activeTab === 'suppliers');
  const disputesQuery = useDisputes(isAdmin && activeTab === 'disputes');
  const products = productsQuery.data || [];
  const storeCategories = categoriesQuery.data || [];
  const orders = ordersQuery.data || [];
  const suppliers = suppliersQuery.data || [];
  const disputes = disputesQuery.data || [];
  const activeQuery = { products: productsQuery, categories: categoriesQuery, orders: ordersQuery, suppliers: suppliersQuery, disputes: disputesQuery }[activeTab];
  const canEditActive = activeTab === 'orders' ? canEditOrders : activeTab === 'products' || activeTab === 'categories' ? canEditProducts : isAdmin;

  // Mutations
  const mutations = useStoreMutations();

  // --- Product State ---
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);

  const handleOpenProductCreate = () => {
    setEditingProduct(null);
    setShowForm(true);
  };
  const handleOpenProductEdit = (product: DbProduct) => {
    setEditingProduct(product);
    setShowForm(true);
  };
  const handleDeleteProduct = async (id: string) => {
    const isConfirmed = await confirm({
      title: '¿Archivar producto?',
      message: 'Se ocultará del catálogo. Los pedidos asociados conservarán su historial.',
    });
    if (isConfirmed) {
      mutations.deleteProduct.mutate(id);
    }
  };

  // --- Category State ---
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<StoreCategory> | null>(null);

  const handleOpenCategoryCreate = (cat?: StoreCategory) => {
    setEditingCategory(cat || { name: '', description: '' });
    setShowCategoryModal(true);
  };
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      mutations.saveCategory.mutate(editingCategory, {
        onSuccess: () => setShowCategoryModal(false)
      });
    }
  };
  const handleDeleteCategory = async (id: string) => {
    const isConfirmed = await confirm({
      title: '¿Eliminar categoría?',
      message: 'Esta acción no se puede deshacer.'
    });
    if (isConfirmed) {
      mutations.deleteCategory.mutate(id);
    }
  };

  // --- Order State ---
  const [orderSnapshot, setSelectedOrder] = useState<Order | null>(null);
  const selectedOrder = orders.find(order => order.id === orderSnapshot?.id) || orderSnapshot;

  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingOverride, setShippingOverride] = useState({ recipient_name: '', phone: '', override_address: '', status_notes: '' });

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundData, setRefundData] = useState({ amount: 0, reason: '' });
  const shippingDialogRef = useStoreDialog(showShippingModal, () => { if (!mutations.saveShippingOverride.isPending) setShowShippingModal(false); });
  const refundDialogRef = useStoreDialog(showRefundModal, () => { if (!mutations.saveRefund.isPending) setShowRefundModal(false); });

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    mutations.updateOrderStatus.mutate({ orderId, status });
  };
  const handleCancelOrder = async (order: Order) => {
    const isConfirmed = await confirm({
      title: '¿Cancelar Pedido?',
      message: 'El pedido quedará cancelado. Esta acción no registra un reembolso bancario.'
    });
    if (isConfirmed) {
      mutations.cancelOrder.mutate(order, { onSuccess: () => setSelectedOrder(null) });
    }
  };
  const handleApproveTransfer = async (order: Order) => {
    const isConfirmed = await confirm({
      title: '¿Aprobar Pago?',
      message: 'Confirma que el depósito o transferencia ha sido recibido en la cuenta bancaria de la iglesia.'
    });
    if (isConfirmed) {
      mutations.updateOrderStatus.mutate({ orderId: order.id, status: 'paid' });
    }
  };

  const handleOpenShippingOverride = (order: Order) => {
    setShippingOverride({
      recipient_name: order.shipping_recipient_name || order.customer_name,
      phone: order.shipping_phone || '',
      override_address: order.shipping_override_address || '',
      status_notes: order.shipping_status_notes || ''
    });
    setShowShippingModal(true);
  };

  const handleSaveShippingOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrder) {
      mutations.saveShippingOverride.mutate({ orderId: selectedOrder.id, data: shippingOverride }, {
        onSuccess: () => {
          setShowShippingModal(false);
          setSelectedOrder(prev => prev ? {
            ...prev,
            shipping_recipient_name: shippingOverride.recipient_name,
            shipping_phone: shippingOverride.phone,
            shipping_override_address: shippingOverride.override_address,
            shipping_status_notes: shippingOverride.status_notes
          } : null);
        }
      });
    }
  };

  const handleOpenRefundModal = (order: Order) => {
    setRefundData({ amount: Number(order.total) || 0, reason: '' });
    setShowRefundModal(true);
  };

  const handleSaveRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrder) {
      mutations.saveRefund.mutate({
        orderId: selectedOrder.id,
        amount: refundData.amount,
        reason: refundData.reason,
        total: Number(selectedOrder.total)
      }, {
        onSuccess: () => {
          setShowRefundModal(false);
          setSelectedOrder(prev => prev ? {
            ...prev,
            refund_status: refundData.amount >= Number(prev.total) ? 'full' : 'partial',
            refunded_amount: refundData.amount,
            refund_reason: refundData.reason
          } : null);
        }
      });
    }
  };

  // --- Supplier State ---
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);

  const handleOpenSupplierCreate = (sup?: Supplier) => {
    setEditingSupplier(sup || {
      name: '', email: '', phone: '', status: 'pending',
      kyc_tax_id_status: 'pending', kyc_bank_status: 'pending', kyc_agreement_status: 'pending', kyc_notes: ''
    });
    setShowSupplierModal(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      mutations.saveSupplier.mutate(editingSupplier, {
        onSuccess: () => setShowSupplierModal(false)
      });
    }
  };

  // --- Dispute State ---
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const handleSaveDisputeResolution = () => {
    if (selectedDispute && resolutionText.trim()) {
      mutations.saveDisputeResolution.mutate({ id: selectedDispute.id, notes: resolutionText }, {
        onSuccess: () => {
          setSelectedDispute(null);
          setResolutionText('');
        }
      });
    }
  };

  const tabs = [
    { id: 'products', label: 'Productos', icon: Package, count: productsQuery.isSuccess ? products.length : null, visible: canViewProducts },
    { id: 'categories', label: 'Categorías', icon: FolderOpen, count: categoriesQuery.isSuccess ? storeCategories.length : null, visible: canViewProducts },
    { id: 'orders', label: 'Pedidos', icon: ClipboardList, count: ordersQuery.isSuccess ? orders.length : null, visible: canViewOrders },
    { id: 'suppliers', label: 'Proveedores', icon: Users, count: suppliersQuery.isSuccess ? suppliers.length : null, visible: isAdmin },
    { id: 'disputes', label: 'Casos', icon: ShieldAlert, count: disputesQuery.isSuccess ? disputes.length : null, visible: isAdmin }
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <AdminHeader title="Tienda y comercio" description="Catálogo, inventario y seguimiento de pedidos en un mismo lugar." />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-16">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link to="/tienda" className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm dark:bg-slate-900 dark:text-white"><ExternalLink size={16} /> Ver tienda</Link>
          {canEditProducts && <Link to="/admin/pos" className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm dark:bg-slate-900 dark:text-white"><ShoppingBag size={16} /> Punto de venta</Link>}
          {hasPermission('store_settings') && <Link to="/admin/pagos-envios" className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm dark:bg-slate-900 dark:text-white"><Settings size={16} /> Pagos y envíos</Link>}
          <button type="button" disabled={activeQuery.isFetching} onClick={() => { void activeQuery.refetch(); }} className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm dark:text-white disabled:opacity-50"><RefreshCw size={16} className={activeQuery.isFetching ? 'animate-spin' : ''} /> Actualizar</button>
        </div>
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {canViewOrders && <div className="rounded-2xl border bg-white p-5 dark:border-white/10 dark:bg-slate-900"><Clock size={19} className="text-amber-600" /><p className="mt-3 text-sm text-slate-500">Pagos por verificar</p><p className="mt-1 text-3xl font-bold dark:text-white">{ordersQuery.isSuccess ? orders.filter(order => order.status === 'pending_payment').length : '—'}</p></div>}
          {canViewProducts && <div className="rounded-2xl border bg-white p-5 dark:border-white/10 dark:bg-slate-900"><AlertTriangle size={19} className="text-red-600" /><p className="mt-3 text-sm text-slate-500">Productos físicos agotados</p><p className="mt-1 text-3xl font-bold dark:text-white">{productsQuery.isSuccess ? products.filter(product => product.type !== 'digital' && getProductStock(product) === 0).length : '—'}</p></div>}
          {canViewOrders && <div className="rounded-2xl border bg-white p-5 dark:border-white/10 dark:bg-slate-900"><TrendingUp size={19} className="text-blue-600" /><p className="mt-3 text-sm text-slate-500">Ventas netas registradas</p><p className="mt-1 text-2xl font-bold dark:text-white">{ordersQuery.isSuccess ? formatStoreCurrency(orders.filter(order => ['paid', 'ready_for_pickup', 'completed'].includes(order.status)).reduce((sum, order) => sum + Math.max(0, Number(order.total) - Number(order.refunded_amount || 0)), 0)) : '—'}</p></div>}
        </div>
          {/* Tabs Navigation */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-white/10 mb-8 pb-4">
            {tabs.filter(tab => tab.visible).map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  aria-pressed={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'
                  }`}>
                    {tab.count ?? '—'}
                  </span>
                </button>
              );
            })}
          </div>

        {activeQuery.isError ? <AdminErrorState description={activeQuery.error?.message} onAction={() => { void activeQuery.refetch(); }} /> : activeQuery.isPending ? <div role="status" className="flex items-center gap-3 py-12 text-slate-500"><Loader2 className="animate-spin" size={22} /> Cargando información de tienda…</div> : <>
        {!canEditActive && <p className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">Acceso de consulta. Las acciones de edición requieren permiso.</p>}
        <Suspense fallback={<div role="status" className="py-8 text-slate-500">Cargando sección…</div>}>
          {activeTab === 'products' && (
            <>
              {!showForm ? (
                <ProductList
                  products={products}
                  canEdit={canEditProducts}
                  deleting={mutations.deleteProduct.isPending}
                  onOpenCreate={handleOpenProductCreate}
                  onEdit={handleOpenProductEdit}
                  onDelete={handleDeleteProduct}
                />
              ) : (
                <ProductForm
                  key={editingProduct?.id || 'new'}
                  product={editingProduct}
                  categories={storeCategories}
                  onCancel={() => setShowForm(false)}
                />
              )}
            </>
          )}

          {activeTab === 'categories' && (
            <CategoryManager
              categories={storeCategories}
              onOpenCreate={handleOpenCategoryCreate}
              showModal={showCategoryModal}
              onCloseModal={() => setShowCategoryModal(false)}
              editingCategory={editingCategory}
              onCategoryChange={setEditingCategory}
              onSave={handleSaveCategory}
              canEdit={canEditProducts}
              saving={mutations.saveCategory.isPending}
              onDelete={handleDeleteCategory}
            />
          )}

          {activeTab === 'orders' && (
            <OrderManager
              canEdit={canEditOrders}
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onCancelOrder={handleCancelOrder}
              onApproveTransfer={handleApproveTransfer}
              onOpenShippingOverride={handleOpenShippingOverride}
              onOpenRefundModal={handleOpenRefundModal}
              selectedOrder={selectedOrder}
              setSelectedOrder={setSelectedOrder}
              actionLoading={mutations.updateOrderStatus.isPending || mutations.cancelOrder.isPending}
            />
          )}

          {activeTab === 'suppliers' && (
            <SupplierManager
              suppliers={suppliers}
              onOpenCreate={handleOpenSupplierCreate}
              showModal={showSupplierModal}
              onCloseModal={() => setShowSupplierModal(false)}
              editingSupplier={editingSupplier}
              onSupplierChange={setEditingSupplier}
              onSave={handleSaveSupplier}
              saving={mutations.saveSupplier.isPending}
            />
          )}

          {activeTab === 'disputes' && (
            <DisputeManager
              disputes={disputes}
              selectedDispute={selectedDispute}
              setSelectedDispute={setSelectedDispute}
              resolutionText={resolutionText}
              setResolutionText={setResolutionText}
              onSaveResolution={handleSaveDisputeResolution}
              savingDispute={mutations.saveDisputeResolution.isPending}
            />
          )}
        </Suspense>
        </>}
      </main>

      {/* Shipping Override Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div ref={shippingDialogRef} role="dialog" aria-modal="true" aria-label="Editar envío" tabIndex={-1} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-150 dark:border-white/10 animate-scale-in text-xs font-medium">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-serif font-bold text-gray-800 dark:text-white text-base">Sobrescribir Datos de Envío</h3>
              <button aria-label="Cerrar edición de envío" onClick={() => setShowShippingModal(false)} className="text-gray-400 p-1"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveShippingOverride} className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-200 dark:border-blue-900/30 text-blue-800 dark:text-blue-300 mb-4 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p>Usa esto para corregir la dirección, registrar la guía de courier, o cambiar el destinatario sin afectar el perfil original del comprador.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre de quien recibe</label>
                <input
                  type="text"
                  value={shippingOverride.recipient_name}
                  onChange={(e) => setShippingOverride({ ...shippingOverride, recipient_name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Teléfono de contacto</label>
                <input
                  type="text"
                  value={shippingOverride.phone}
                  onChange={(e) => setShippingOverride({ ...shippingOverride, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                  placeholder="Ej. +593 99 999 9999"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Dirección de Entrega / Agencia</label>
                <input
                  type="text"
                  value={shippingOverride.override_address}
                  onChange={(e) => setShippingOverride({ ...shippingOverride, override_address: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                  placeholder="Ej. Servientrega Sucursal Norte"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Notas / Guía de Rastreo</label>
                <textarea
                  rows={2}
                  value={shippingOverride.status_notes}
                  onChange={(e) => setShippingOverride({ ...shippingOverride, status_notes: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                  placeholder="Ej. Guía Servientrega #1234567"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowShippingModal(false)}
                  className="px-4 py-2 border border-gray-255 text-gray-700 dark:text-gray-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutations.saveShippingOverride.isPending}
                  className="bg-primary hover:bg-blue-900 text-white px-5 py-2 rounded-xl font-bold shadow-sm"
                >
                  {mutations.saveShippingOverride.isPending ? <Loader2 className="animate-spin" size={14} /> : 'Guardar Envío'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div ref={refundDialogRef} role="dialog" aria-modal="true" aria-label="Registrar reembolso" tabIndex={-1} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-150 dark:border-white/10 animate-scale-in text-xs font-medium">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-serif font-bold text-gray-800 dark:text-white text-base flex items-center gap-2">
                <AlertCircle className="text-amber-500" size={18} />
                Registrar Reembolso
              </h3>
              <button aria-label="Cerrar reembolso" onClick={() => setShowRefundModal(false)} className="text-gray-400 p-1"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveRefund} className="p-6 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 mb-4">
                <p>Estás a punto de registrar un reembolso para el pedido <strong>#{selectedOrder?.id.slice(0, 8).toUpperCase()}</strong>.</p>
                <p className="mt-1 text-[10px]">Total Original Pagado: <strong>${Number(selectedOrder?.total).toFixed(2)}</strong></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Monto a Reembolsar ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={Number(selectedOrder?.total) || 0}
                  required
                  value={refundData.amount}
                  onChange={(e) => setRefundData({ ...refundData, amount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none text-lg font-bold text-primary dark:text-church-gold-bright"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Motivo del Reembolso *</label>
                <textarea
                  rows={3}
                  required
                  value={refundData.reason}
                  onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                  placeholder="Ej. Cliente solicitó devolución, producto dañado..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 border border-gray-255 text-gray-700 dark:text-gray-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutations.saveRefund.isPending || refundData.amount <= 0}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl font-bold shadow-sm"
                >
                  {mutations.saveRefund.isPending ? <Loader2 className="animate-spin" size={14} /> : 'Confirmar Reembolso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default function StoreManager() { return <StoreWorkspace />; }
