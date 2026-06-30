import { Eye, Clock, CheckCircle2, Truck, AlertCircle, ClipboardList, X, Download } from 'lucide-react';
import type { Order, OrderStatus } from '../../../types';

interface OrderManagerProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onCancelOrder: (order: Order) => void;
  onApproveTransfer: (order: Order) => void;
  onOpenShippingOverride: (order: Order) => void;
  onOpenRefundModal: (order: Order) => void;
  selectedOrder: Order | null;
  setSelectedOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  actionLoading: boolean;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending_payment':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">
          <Clock size={12} />
          Esperando Pago
        </span>
      );
    case 'paid':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30">
          <CheckCircle2 size={12} />
          Pagado
        </span>
      );
    case 'ready_for_pickup':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-church-gold-bright border border-blue-200 dark:border-blue-900/30">
          <Truck size={12} />
          Listo para Retirar
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/10">
          <CheckCircle2 size={12} />
          Entregado
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30">
          <AlertCircle size={12} />
          Cancelado
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-150 text-gray-700 dark:text-gray-300">
          {status}
        </span>
      );
  }
};

const OrderManager = ({
  orders,
  onUpdateOrderStatus,
  onCancelOrder,
  onApproveTransfer,
  onOpenShippingOverride,
  onOpenRefundModal,
  selectedOrder,
  setSelectedOrder,
  actionLoading
}: OrderManagerProps) => {
  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden animate-fade-in text-xs">
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-150 dark:border-white/10">
                  <th className="py-4 px-6">Pedido</th>
                  <th className="py-4 px-6">Comprador</th>
                  <th className="py-4 px-6">Pago</th>
                  <th className="py-4 px-6">Total</th>
                  <th className="py-4 px-6">Reembolsos</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6">Fecha</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-700 dark:text-gray-300 font-medium">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-55/30">
                    <td className="py-4 px-6 font-mono font-bold">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-800 dark:text-white block">{order.customer_name}</span>
                      <span className="text-[10px] text-gray-400 block">{order.customer_email}</span>
                    </td>
                    <td className="py-4 px-6 capitalize">
                      {order.payment_method === 'transfer' ? 'Transferencia' : 'Tarjeta'}
                    </td>
                    <td className="py-4 px-6 font-bold text-primary dark:text-church-gold-bright">
                      ${Number(order.total).toFixed(2)}
                    </td>
                    <td className="py-4 px-6">
                      {order.refund_status && order.refund_status !== 'none' ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${order.refund_status === 'full' ? 'bg-red-100 text-red-750' : 'bg-amber-100 text-amber-700'}`}>
                          Reembolsado ${Number(order.refunded_amount).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-normal italic">Sin reembolsos</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 text-primary hover:text-gold text-xs font-bold transition-all cursor-pointer"
                      >
                        <Eye size={14} />
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20">
            <ClipboardList className="mx-auto text-gray-300 mb-2" size={48} />
            <p className="text-sm text-gray-400">No hay pedidos registrados.</p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-fade-in"
          />
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 max-h-[90vh] flex flex-col animate-scale-in text-xs font-medium text-gray-700 dark:text-gray-300">
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-gray-150 dark:border-white/10 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-serif font-bold text-gray-800 dark:text-white text-lg">
                    Pedido #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </h3>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-mono font-normal block">{selectedOrder.id}</span>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 flex-grow">
                {selectedOrder.refund_status && selectedOrder.refund_status !== 'none' && (
                  <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-200 dark:border-red-900/30 flex items-start gap-3">
                    <AlertCircle className="text-red-700 dark:text-red-400 shrink-0" size={18} />
                    <div>
                      <span className="font-bold text-red-800 dark:text-red-400 text-xs block">Reembolso Registrado ({selectedOrder.refund_status === 'full' ? 'Total' : 'Parcial'})</span>
                      <p className="text-[11px] text-red-700 dark:text-gray-300 mt-1">Reembolsado: <strong>${Number(selectedOrder.refunded_amount).toFixed(2)}</strong></p>
                      {selectedOrder.refund_reason && (
                        <p className="text-[11px] text-red-650 dark:text-gray-400 italic mt-0.5">Motivo: {selectedOrder.refund_reason}</p>
                      )}
                    </div>
                  </div>
                )}

                {(selectedOrder.shipping_override_address || selectedOrder.shipping_status_notes) && (
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-900/30 space-y-1.5">
                    <span className="font-bold text-blue-700 dark:text-church-gold-bright text-xs block uppercase">Sobrescritura de Datos de Entrega</span>
                    {selectedOrder.shipping_recipient_name && (
                      <p className="text-[11px]">Destinatario: <strong>{selectedOrder.shipping_recipient_name}</strong></p>
                    )}
                    {selectedOrder.shipping_phone && (
                      <p className="text-[11px]">Teléfono: <strong>{selectedOrder.shipping_phone}</strong></p>
                    )}
                    {selectedOrder.shipping_override_address && (
                      <p className="text-[11px]">Nueva Dirección: <strong className="text-blue-800 dark:text-gray-200">{selectedOrder.shipping_override_address}</strong></p>
                    )}
                    {selectedOrder.shipping_status_notes && (
                      <p className="text-[11px] italic text-gray-500">Notas de envío: {selectedOrder.shipping_status_notes}</p>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-gray-150 dark:border-white/10">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Estado Actual</span>
                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider text-right">Total Pedido</span>
                    <span className="text-xl font-extrabold text-primary dark:text-church-gold-bright block mt-0.5">${Number(selectedOrder.total).toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/30 dark:bg-slate-800/30 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                    <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-2">Datos del Comprador</h4>
                    <p className="text-xs">Nombre: <span className="font-semibold text-gray-800 dark:text-white">{selectedOrder.customer_name}</span></p>
                    <p className="text-xs mt-1">Email: <span className="font-semibold text-gray-800 dark:text-white">{selectedOrder.customer_email}</span></p>
                  </div>
                  <div className="bg-slate-50/30 dark:bg-slate-800/30 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                    <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-2">Método de Pago</h4>
                    <p className="text-xs">Tipo: <span className="font-semibold text-gray-800 dark:text-white capitalize">{selectedOrder.payment_method === 'transfer' ? 'Transferencia Bancaria' : 'Tarjeta de Crédito'}</span></p>
                    {selectedOrder.payment_method === 'transfer' && (
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-bold">Requiere verificación manual.</p>
                    )}
                  </div>
                </div>

                {selectedOrder.payment_method === 'transfer' && selectedOrder.payment_voucher_url && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-gray-850 dark:text-white flex items-center justify-between">
                      <span>Comprobante de Pago Subido:</span>
                      <a href={selectedOrder.payment_voucher_url} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-church-gold-bright hover:text-gold flex items-center gap-1">
                        <Download size={12} /> Ver Completo
                      </a>
                    </h4>
                    <div className="w-full max-h-56 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 flex justify-center items-center">
                      <img loading="lazy" src={selectedOrder.payment_voucher_url} alt="Comprobante" className="max-h-56 object-contain" />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-gray-850 dark:text-white">Artículos Comprados:</h4>
                  <div className="divide-y divide-gray-100 dark:divide-white/10 border border-gray-150 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                    {selectedOrder.order_items?.map((item: any) => (
                      <div key={item.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img loading="lazy" 
                            src={item.products?.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'} 
                            alt={item.products?.name} 
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div>
                            <span className="font-bold text-gray-800 dark:text-white block">{item.products?.name}</span>
                            {item.product_variants && (
                              <span className="text-[9px] text-gray-400 block mt-0.5">
                                Variante: {item.product_variants.color_name || ''} {item.product_variants.size ? `[Talla ${item.product_variants.size}]` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block font-bold text-gray-850 dark:text-white">{item.quantity} x ${Number(item.price).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-gray-150 dark:border-white/10 flex flex-wrap gap-2 shrink-0">
                {selectedOrder.status === 'pending_payment' && selectedOrder.payment_method === 'transfer' && (
                  <button
                    onClick={() => onApproveTransfer(selectedOrder)}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <CheckCircle2 size={14} />
                    Aprobar Pago
                  </button>
                )}
                {selectedOrder.status === 'paid' && (
                  <button
                    onClick={() => onUpdateOrderStatus(selectedOrder.id, 'ready_for_pickup')}
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Truck size={14} />
                    Listo para Enviar/Retirar
                  </button>
                )}
                {['paid', 'ready_for_pickup'].includes(selectedOrder.status) && (
                  <button
                    onClick={() => onUpdateOrderStatus(selectedOrder.id, 'completed')}
                    disabled={actionLoading}
                    className="bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <CheckCircle2 size={14} />
                    Entregar / Completar
                  </button>
                )}
                
                {selectedOrder.status !== 'cancelled' && (
                  <>
                    <button
                      onClick={() => onOpenShippingOverride(selectedOrder)}
                      className="border border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-[11px] font-bold px-3 py-2 rounded-xl cursor-pointer"
                      title="Editar dirección de entrega o estado del transportista"
                    >
                      Editar Envío
                    </button>
                    {['paid', 'ready_for_pickup', 'completed'].includes(selectedOrder.status) && (
                      <button
                        onClick={() => onOpenRefundModal(selectedOrder)}
                        className="border border-amber-200 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-[11px] font-bold px-3 py-2 rounded-xl cursor-pointer"
                        title="Registrar reembolso total o parcial"
                      >
                        Reembolsar
                      </button>
                    )}
                    {selectedOrder.status !== 'completed' && (
                      <button
                        onClick={() => onCancelOrder(selectedOrder)}
                        disabled={actionLoading}
                        className="border border-red-200 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 text-[11px] font-bold px-3 py-2 rounded-xl cursor-pointer ml-auto"
                        title="Cancelar y devolver stock a inventario"
                      >
                        Cancelar Pedido
                      </button>
                    )}
                  </>
                )}
              </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderManager;
