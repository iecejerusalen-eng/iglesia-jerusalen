import { useState } from 'react';
import { Package, Search, Loader2, CheckCircle2, XCircle, Clock, FileText, TrendingUp, AlertCircle, Truck } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'verifying' | 'unfulfilled' | 'completed';

export default function OrdersManager() {
  const { orders, loading, updatePaymentStatus, updateFulfillmentStatus } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('verifying');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  // KPIs
  const currentMonth = new Date().getMonth();
  const pendingOrdersCount = orders.filter(o => o.ecommerce_payment_status === 'verifying' || o.status === 'pending_payment').length;
  const unfulfilledOrdersCount = orders.filter(o => o.ecommerce_fulfillment_status === 'unfulfilled' || o.ecommerce_fulfillment_status === 'processing').length;
  const monthIncome = orders
    .filter(o => o.ecommerce_payment_status === 'paid' && new Date(o.created_at).getMonth() === currentMonth)
    .reduce((sum, order) => sum + order.total, 0);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (!matchesSearch) return false;

    switch (activeTab) {
      case 'verifying':
        return order.ecommerce_payment_method === 'transfer' && order.ecommerce_payment_status === 'verifying';
      case 'unfulfilled':
        return order.ecommerce_payment_status === 'paid' && (order.ecommerce_fulfillment_status === 'unfulfilled' || order.ecommerce_fulfillment_status === 'processing' || order.ecommerce_fulfillment_status === 'shipped');
      case 'completed':
        return order.ecommerce_fulfillment_status === 'delivered';
      default:
        return true;
    }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Package className="w-8 h-8 mr-3 text-blue-600" />
          Gestión de Órdenes y Logística
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Administra los pagos, transferencias y el fulfillment de las órdenes físicas y digitales.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Órdenes Pendientes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingOrdersCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Por Enviar (Físicas)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{unfulfilledOrdersCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ingresos del Mes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${monthIncome.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('verifying')}
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'verifying' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
        >
          Por Verificar (Transferencias)
        </button>
        <button
          onClick={() => setActiveTab('unfulfilled')}
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'unfulfilled' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
        >
          Pendientes de Envío
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'completed' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
        >
          Completadas
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por ID, nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Orden</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Cliente</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Estado</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Total</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No hay órdenes en esta categoría.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono text-gray-900 dark:text-white">
                          #{order.id.split('-')[0].toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.customer_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.customer_email}
                        </div>
                        {order.shipping_override_address && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <span className="font-semibold">Envío a:</span> {order.shipping_override_address}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border w-fit
                            ${order.ecommerce_payment_status === 'paid' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400' : 
                              order.ecommerce_payment_status === 'verifying' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                              order.ecommerce_payment_status === 'failed' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}>
                            {order.ecommerce_payment_status === 'paid' ? <CheckCircle2 className="w-3 h-3 mr-1" /> :
                             order.ecommerce_payment_status === 'verifying' ? <Clock className="w-3 h-3 mr-1" /> :
                             order.ecommerce_payment_status === 'failed' ? <XCircle className="w-3 h-3 mr-1" /> : <Loader2 className="w-3 h-3 mr-1" />}
                            Pago: {order.ecommerce_payment_status}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border w-fit
                            ${order.ecommerce_fulfillment_status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400' : 
                              order.ecommerce_fulfillment_status === 'shipped' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' : 
                              order.ecommerce_fulfillment_status === 'processing' ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400' :
                              'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}>
                            Envío: {order.ecommerce_fulfillment_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col gap-2 items-end">
                          {activeTab === 'verifying' && order.payment_receipt_url && (
                            <>
                              <button 
                                onClick={() => setSelectedReceipt(order.payment_receipt_url || null)}
                                className="text-xs inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-2"
                              >
                                <FileText className="w-3 h-3 mr-1" /> Ver Comprobante
                              </button>
                              <div className="flex gap-2">
                                <button onClick={() => updatePaymentStatus(order.id, 'paid')} className="text-xs bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded-lg shadow-sm">Aprobar Pago</button>
                                <button onClick={() => updatePaymentStatus(order.id, 'failed')} className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-lg">Rechazar</button>
                              </div>
                            </>
                          )}
                          
                          {activeTab === 'unfulfilled' && (
                            <>
                              {order.ecommerce_fulfillment_status === 'processing' && (
                                <button onClick={() => updateFulfillmentStatus(order.id, 'shipped')} className="text-xs bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-sm">Marcar Enviado</button>
                              )}
                              {order.ecommerce_fulfillment_status === 'shipped' && (
                                <button onClick={() => updateFulfillmentStatus(order.id, 'delivered')} className="text-xs bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded-lg shadow-sm">Marcar Entregado</button>
                              )}
                              {order.ecommerce_fulfillment_status === 'unfulfilled' && (
                                <button onClick={() => updateFulfillmentStatus(order.id, 'processing')} className="text-xs bg-purple-600 text-white hover:bg-purple-700 px-3 py-1.5 rounded-lg shadow-sm">Iniciar Preparación</button>
                              )}
                            </>
                          )}

                          {activeTab === 'completed' && (
                            <span className="text-sm text-gray-500">Orden Finalizada</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedReceipt(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 dark:text-white">Comprobante de Pago</h3>
                <button onClick={() => setSelectedReceipt(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-100px)] flex justify-center">
                {selectedReceipt.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={selectedReceipt} className="w-full h-[600px]" title="Comprobante PDF" />
                ) : (
                  <img src={selectedReceipt} alt="Comprobante" className="max-w-full h-auto rounded-lg" />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
