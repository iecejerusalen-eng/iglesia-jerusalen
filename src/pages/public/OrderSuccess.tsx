import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Download, Package, ArrowRight } from 'lucide-react';
import { supabase } from '../../config/supabase';
import type { Order, OrderItem } from '../../types';
import { toast } from 'sonner';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    const fetchOrder = async () => {
      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;
        setOrder(orderData);

        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            products (*),
            product_variants (*)
          `)
          .eq('order_id', orderId);

        if (itemsError) throw itemsError;
        setOrderItems(itemsData || []);

      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('No se pudo cargar la información de la orden');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Subscribe to changes to update payment/fulfillment status in real-time
    const subscription = supabase
      .channel(`public:orders:id=eq.${orderId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload: any) => {
        setOrder(payload.new as Order);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [orderId, navigate]);

  const handleSimulateWebhook = async () => {
    if (!order) return;
    
    // Simulate webhook from PayPhone or Stripe approving the transaction
    const { error } = await supabase
      .from('orders')
      .update({
        ecommerce_payment_status: 'paid',
        status: 'paid'
      })
      .eq('id', order.id);
      
    if (error) {
      toast.error('Error al simular webhook');
    } else {
      toast.success('Webhook simulado: Pago aprobado');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex justify-center items-start">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen pt-24 text-center">
        <h1 className="text-2xl font-bold">Orden no encontrada</h1>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 underline">Volver al inicio</button>
      </div>
    );
  }

  const hasPhysical = orderItems.some(item => item.products?.ecommerce_product_type === 'physical');
  const isPaid = order.ecommerce_payment_status === 'paid' || order.status === 'paid';

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden text-center">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-12 px-4">
          <div className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">¡Gracias por tu compra!</h1>
          <p className="text-blue-100">Orden #{order.id.split('-')[0].toUpperCase()}</p>
        </div>

        <div className="p-8">
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <div className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              isPaid
                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
            }`}>
              Estado del Pago: {
                order.ecommerce_payment_status === 'paid' ? 'Aprobado' :
                order.ecommerce_payment_status === 'verifying' ? 'Verificando Transferencia' :
                order.ecommerce_payment_status === 'failed' ? 'Fallido' : 'Pendiente'
              }
            </div>
            
            {hasPhysical && (
              <div className="px-4 py-2 rounded-lg text-sm font-medium border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                Logística: {
                  order.ecommerce_fulfillment_status === 'unfulfilled' ? 'Por procesar' :
                  order.ecommerce_fulfillment_status === 'processing' ? 'Preparando' :
                  order.ecommerce_fulfillment_status === 'shipped' ? 'Enviado' : 'Entregado'
                }
              </div>
            )}
          </div>

          <div className="text-left bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detalle de Productos</h3>
            <ul className="space-y-4">
              {orderItems.map((item) => (
                <li key={item.id} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 pb-4 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.products?.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Cant: {item.quantity} {item.product_variants ? `| ${item.product_variants.size || ''} ${item.product_variants.color_name || ''}` : ''}
                    </p>
                    
                    {/* Digital Product Delivery */}
                    {item.products?.ecommerce_product_type === 'digital' && (
                      <div className="mt-2">
                        {isPaid ? (
                          <a 
                            href={item.products.digital_file_url || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Descargar Archivo Digital
                          </a>
                        ) : (
                          <span className="inline-flex items-center text-sm text-gray-500">
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Descarga disponible tras confirmación de pago
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">${item.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/mis-compras')}
              className="px-6 py-3 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium flex items-center justify-center"
            >
              <Package className="w-5 h-5 mr-2" />
              Ver mis compras
            </button>
            <button
              onClick={() => navigate('/tienda')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            >
              Seguir Comprando
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>

          {/* MOCK WEBHOOK BUTTON - Remove in production */}
          {!isPaid && (
            <div className="mt-12 p-4 border border-dashed border-red-300 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <p className="text-xs text-red-600 mb-2 font-bold uppercase">Herramienta de Desarrollo (Mock)</p>
              <button
                onClick={handleSimulateWebhook}
                className="text-sm px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Simular Webhook de Pago Aprobado
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
