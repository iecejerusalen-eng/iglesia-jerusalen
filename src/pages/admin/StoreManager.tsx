import { useState } from 'react';
import { useConfirmStore } from '../../store/useConfirmStore';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import AdminHeader from '../../components/admin/AdminHeader';
import { Package, FolderOpen, ClipboardList, Users, ShieldAlert, X, AlertCircle, Loader2 } from 'lucide-react';

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
import ProductForm from '../../features/store/components/ProductForm';
import CategoryManager from '../../features/store/components/CategoryManager';
import OrderManager from '../../features/store/components/OrderManager';
import SupplierManager from '../../features/store/components/SupplierManager';
import DisputeManager from '../../features/store/components/DisputeManager';

const StoreManager = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders' | 'suppliers' | 'disputes'>('products');

  // Queries
  const { data: products = [] } = useProducts();
  const { data: storeCategories = [] } = useCategories();
  const { data: orders = [] } = useOrders();
  const { data: suppliers = [] } = useSuppliers();
  const { data: disputes = [] } = useDisputes();

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
      title: '¿Eliminar producto?',
      message: 'Esta acción no se puede deshacer.',
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingOverride, setShippingOverride] = useState({ recipient_name: '', phone: '', override_address: '', status_notes: '' });
  
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundData, setRefundData] = useState({ amount: 0, reason: '' });

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    mutations.updateOrderStatus.mutate({ orderId, status });
  };
  const handleCancelOrder = async (order: Order) => {
    const isConfirmed = await confirm({
      title: '¿Cancelar Pedido?',
      message: 'El pedido será cancelado y el stock devuelto al inventario.'
    });
    if (isConfirmed) {
      mutations.cancelOrder.mutate(order);
      setSelectedOrder(null);
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
    if (selectedDispute && resolutionText) {
      mutations.saveDisputeResolution.mutate({ id: selectedDispute.id, notes: resolutionText }, {
        onSuccess: () => {
          setSelectedDispute(null);
          setResolutionText('');
        }
      });
    }
  };

  const tabs = [
    { id: 'products', label: 'Productos', icon: Package, count: products.length },
    { id: 'categories', label: 'Categorías', icon: FolderOpen, count: storeCategories.length },
    { id: 'orders', label: 'Pedidos', icon: ClipboardList, count: orders.length },
    { id: 'suppliers', label: 'Proveedores KYC', icon: Users, count: suppliers.length },
    { id: 'disputes', label: 'Resolución de Casos', icon: ShieldAlert, count: disputes.length }
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <AdminHeader title="Gestión de Librería / Store" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        <AnimeFadeUp>
          {/* Tabs Navigation */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-white/10 mb-8 pb-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
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
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {activeTab === 'products' && (
            <>
              {!showForm ? (
                <ProductList
                  products={products}
                  onOpenCreate={handleOpenProductCreate}
                  onEdit={handleOpenProductEdit}
                  onDelete={handleDeleteProduct}
                />
              ) : (
                <ProductForm
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
              saving={mutations.saveCategory.isPending}
              onDelete={handleDeleteCategory}
            />
          )}

          {activeTab === 'orders' && (
            <OrderManager
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
        </AnimeFadeUp>
      </main>

      {/* Shipping Override Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-150 dark:border-white/10 animate-scale-in text-xs font-medium">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-serif font-bold text-gray-800 dark:text-white text-base">Sobrescribir Datos de Envío</h3>
              <button onClick={() => setShowShippingModal(false)} className="text-gray-400 p-1"><X size={18} /></button>
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-150 dark:border-white/10 animate-scale-in text-xs font-medium">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-serif font-bold text-gray-800 dark:text-white text-base flex items-center gap-2">
                <AlertCircle className="text-amber-500" size={18} />
                Registrar Reembolso
              </h3>
              <button onClick={() => setShowRefundModal(false)} className="text-gray-400 p-1"><X size={18} /></button>
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

export default StoreManager;
