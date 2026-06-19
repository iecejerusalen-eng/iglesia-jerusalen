import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../config/supabase';
import { motion } from 'framer-motion';
import { Download, AlertCircle, ShoppingBag, Calendar, CreditCard, ChevronRight, CheckCircle2, Clock, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Order, ProductDigitalAsset } from '../../types';

export default function MyPurchases() {
  const { user, isLoading: authLoading } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [digitalAssets, setDigitalAssets] = useState<Record<string, ProductDigitalAsset>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Obtener órdenes del usuario con productos y variantes
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          customer_name,
          customer_email,
          total,
          status,
          payment_method,
          payment_voucher_url,
          created_at,
          order_items (
            id,
            quantity,
            price,
            product_id,
            variant_id,
            products (
              id,
              name,
              image_url,
              cover_image_url,
              type
            ),
            product_variants (
              id,
              color_name,
              size
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const typedOrders = (ordersData || []) as unknown as Order[];
      setOrders(typedOrders);

      // Identificar los IDs de productos digitales que se han pagado
      const paidProductIds: string[] = [];
      typedOrders.forEach(order => {
        const isPaid = ['paid', 'ready_for_pickup', 'completed'].includes(order.status);
        if (isPaid && order.order_items) {
          order.order_items.forEach(item => {
            if (item.products?.type === 'digital') {
              paidProductIds.push(item.product_id);
            }
          });
        }
      });

      // Si hay productos digitales pagados, buscar sus assets (links de descarga seguros por RLS)
      if (paidProductIds.length > 0) {
        const { data: assetsData, error: assetsError } = await supabase
          .from('product_digital_assets')
          .select('*')
          .in('product_id', paidProductIds);

        if (!assetsError && assetsData) {
          const assetsMap: Record<string, ProductDigitalAsset> = {};
          (assetsData as ProductDigitalAsset[]).forEach((asset) => {
            assetsMap[asset.product_id] = asset;
          });
          setDigitalAssets(assetsMap);
        }
      }
    } catch (err) {
      console.error('Error fetching purchases:', err);
      const errMsg = err instanceof Error ? err.message : 'Error al cargar el historial de compras';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        setLoading(false);
        return;
      }
      fetchOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, [user, fetchOrders]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando tus compras...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-gray-100"
        >
          <div className="w-16 h-16 bg-amber-50 text-gold rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={30} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-primary dark:text-white mb-2">Acceso Requerido</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Debes iniciar sesión con tu cuenta para poder visualizar tu historial de compras y descargas.</p>
          <Link 
            to="/login?redirect=/mis-compras" 
            className="inline-block w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all"
          >
            Iniciar Sesión
          </Link>
        </motion.div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-250">
            <Clock size={12} />
            Esperando Pago
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-250">
            <CheckCircle2 size={12} />
            Pagado
          </span>
        );
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-250">
            <Truck size={12} />
            Listo para Retirar
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <CheckCircle2 size={12} />
            Entregado
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle size={12} />
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-150 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary dark:text-white">Mis Compras</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Historial de pedidos y acceso a descargas seguras.</p>
          </div>
          <Link 
            to="/tienda" 
            className="inline-flex items-center gap-1.5 text-primary dark:text-white hover:text-gold transition-colors font-semibold text-sm"
          >
            Volver a la Tienda
            <ChevronRight size={16} />
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-6 flex items-center gap-2">
            <AlertCircle size={18} />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-150 p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">Sin compras registradas</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Aún no has realizado ninguna compra en nuestra tienda virtual.</p>
            <Link 
              to="/tienda" 
              className="inline-block bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-6 rounded-xl shadow-md transition-all text-sm"
            >
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-150 overflow-hidden"
              >
                {/* Cabecera del pedido */}
                <div className="bg-slate-50 px-6 py-4 border-b border-gray-150 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div>
                      <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Código de Pedido</span>
                      <span className="font-mono text-sm font-bold text-gray-700">#{order.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Fecha de Compra</span>
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Método de Pago</span>
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <CreditCard size={14} className="text-gray-400" />
                        {order.payment_method === 'transfer' ? 'Transferencia' : 'Tarjeta de Crédito'}
                      </span>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Contenido del pedido */}
                <div className="p-6 divide-y divide-gray-100">
                  {order.order_items?.map((item) => {
                    const product = item.products;
                    const variant = item.product_variants;
                    const isDigital = product?.type === 'digital';
                    const isPaid = ['paid', 'ready_for_pickup', 'completed'].includes(order.status);
                    const digitalAsset = isDigital && isPaid ? digitalAssets[item.product_id] : null;

                    return (
                      <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img 
                            src={product?.cover_image_url || product?.image_url || '/placeholder-product.png'} 
                            alt={product?.name || 'Producto'} 
                            className="w-16 h-16 rounded-xl object-cover border border-gray-100 shadow-2xs"
                          />
                          <div>
                            <h4 className="font-bold text-gray-800 text-base">{product?.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {isDigital ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  Recurso Digital
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                                  Físico
                                </span>
                              )}
                              {variant && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  Variante: {variant.color_name ? `${variant.color_name} ` : ''}{variant.size ? `[Talla ${variant.size}]` : ''}
                                </span>
                              )}
                              <span className="text-xs text-gray-400 font-medium">
                                Cantidad: {item.quantity} x ${Number(item.price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className="font-bold text-gray-800">${(Number(item.price) * item.quantity).toFixed(2)}</span>
                          
                          {/* Botón de descarga para recursos digitales */}
                          {isDigital && (
                            <div className="mt-2 w-full md:w-auto">
                              {isPaid ? (
                                digitalAsset ? (
                                  <div className="flex flex-col items-end gap-1.5">
                                    <a 
                                      href={digitalAsset.drive_link} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="inline-flex items-center gap-1.5 bg-gold hover:bg-gold-dark text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
                                    >
                                      <Download size={14} />
                                      Descargar Recurso
                                    </a>
                                    {digitalAsset.instructions && (
                                      <p className="text-[11px] text-gray-400 max-w-[200px] text-right italic">
                                        Instrucciones: {digitalAsset.instructions}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                    <AlertCircle size={14} />
                                    Generando enlace de descarga...
                                  </span>
                                )
                              ) : order.status === 'pending_payment' ? (
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                  <Clock size={14} />
                                  Se habilitará al verificar el pago
                                </span>
                              ) : (
                                <span className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                  <AlertCircle size={14} />
                                  Pago fallido o cancelado
                                </span>
                              )}
                            </div>
                          )}

                          {/* Notificación de retiro en punto de información */}
                          {!isDigital && order.status === 'ready_for_pickup' && (
                            <div className="bg-primary/5 text-primary dark:text-white border border-primary/20 px-3 py-2 rounded-lg text-xs max-w-[250px] text-right font-medium mt-1">
                              📍 Retíralo en el punto de información de la Iglesia Jerusalén.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pie del pedido */}
                <div className="bg-slate-50/50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {order.status === 'pending_payment' && order.payment_method === 'transfer' && (
                      <span className="text-xs text-amber-700 font-semibold bg-amber-50 border border-amber-200/50 px-2 py-1 rounded-md">
                        Comprobante enviado para revisión
                      </span>
                    )}
                  </span>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Total del Pedido</span>
                    <span className="text-xl font-extrabold text-primary dark:text-white">${Number(order.total).toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
