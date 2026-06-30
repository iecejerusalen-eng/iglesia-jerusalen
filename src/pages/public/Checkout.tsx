import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShoppingBag, CreditCard, UploadCloud, MapPin, Loader2, CheckCircle2, QrCode, Truck } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { StorePaymentMethod, StoreShippingMethod } from '../../types';
import { uploadFileToCloudinary } from '../../lib/cloudinaryService';

const checkoutSchema = z.object({
  paymentMethod: z.string().min(1, 'Selecciona un método de pago'),
  shippingMethod: z.string().optional(),
  shippingName: z.string().min(3, 'Nombre completo requerido').optional().or(z.literal('')),
  shippingPhone: z.string().min(9, 'Teléfono válido requerido').optional().or(z.literal('')),
  shippingAddress: z.string().min(5, 'Dirección requerida').optional().or(z.literal('')),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const navigate = useNavigate();
  const { user, firstName, lastName } = useAuthStore();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  // De Una Modal State
  const [showDeUnaModal, setShowDeUnaModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<CheckoutForm | null>(null);

  // Settings & Fees
  const [paymentMethods, setPaymentMethods] = useState<StorePaymentMethod[]>([]);
  const [shippingMethods, setShippingMethods] = useState<StoreShippingMethod[]>([]);
  const [bankInfo, setBankInfo] = useState({ name: '', account: '', ruc: '' });
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: '',
      shippingMethod: '',
      shippingName: firstName ? `${firstName} ${lastName || ''}` : '',
      shippingPhone: user?.phone || '',
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('church_settings')
        .select('payment_methods, shipping_methods, bank_name, bank_account, ruc')
        .eq('id', 1).single();
      if (data) {
        const pMethods = (data.payment_methods as StorePaymentMethod[])?.filter(m => m.active) || [];
        const sMethods = (data.shipping_methods as StoreShippingMethod[])?.filter(m => m.active) || [];
        setPaymentMethods(pMethods);
        setShippingMethods(sMethods);
        setBankInfo({ name: data.bank_name || '', account: data.bank_account || '', ruc: data.ruc || '' });
        
        if (pMethods.length > 0) setValue('paymentMethod', pMethods[0].id);
        if (sMethods.length > 0) setValue('shippingMethod', sMethods[0].id);
      }
    };
    fetchSettings();
  }, [setValue]);

  const hasPhysicalItems = items.some(item => item.product.ecommerce_product_type === 'physical');

  const paymentMethodId = watch('paymentMethod');
  const shippingMethodId = watch('shippingMethod');

  const selectedPayment = paymentMethods.find(m => m.id === paymentMethodId);
  const selectedShipping = shippingMethods.find(m => m.id === shippingMethodId);

  const subtotal = getTotalPrice();
  
  const shippingCost = hasPhysicalItems && selectedShipping ? selectedShipping.base_cost : 0;
  const paymentFee = selectedPayment ? subtotal * (selectedPayment.fee_percent / 100) : 0;

  const finalTotal = subtotal + paymentFee + shippingCost;

  const mockProcessPayPhone = async () => {
    return new Promise((resolve) => setTimeout(resolve, 2000));
  };

  const processOrder = async (data: CheckoutForm) => {
    if (!user) {
      toast.error('Debes iniciar sesión para completar la compra');
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      toast.error('Tu carrito está vacío');
      return;
    }

    if (hasPhysicalItems && !data.shippingMethod) {
      toast.error('Selecciona un método de envío');
      return;
    }

    setIsSubmitting(true);

    try {
      let receiptUrl = null;
      const isTransfer = data.paymentMethod === 'transfer';

      if (isTransfer) {
        if (!receiptFile) {
          toast.error('Debes subir el comprobante de transferencia');
          setIsSubmitting(false);
          return;
        }
        receiptUrl = await uploadFileToCloudinary(receiptFile, 'ecommerce_receipts', 'image');
      } else if (data.paymentMethod === 'payphone') {
        await mockProcessPayPhone();
      } else if (data.paymentMethod === 'de_una') {
        // Ya fue procesado a través del modal
      }

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          customer_name: `${firstName || ''} ${lastName || ''}`.trim() || 'Cliente',
          customer_email: user.email || '',
          subtotal: subtotal,
          payment_fee: paymentFee,
          total: finalTotal,
          status: 'pending_payment',
          ecommerce_payment_method: data.paymentMethod,
          ecommerce_payment_status: isTransfer ? 'verifying' : 'paid',
          ecommerce_fulfillment_status: hasPhysicalItems ? 'processing' : 'delivered',
          payment_receipt_url: receiptUrl,
          shipping_recipient_name: hasPhysicalItems ? data.shippingName : null,
          shipping_phone: hasPhysicalItems ? data.shippingPhone : null,
          shipping_override_address: hasPhysicalItems ? data.shippingAddress : null,
          shipping_cost: shippingCost,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        variant_id: item.variant?.id || null,
        quantity: item.quantity,
        price: item.variant ? item.product.price + item.variant.price_adjustment : item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      clearCart();
      toast.success('¡Orden creada con éxito!');
      navigate(`/order-success?id=${orderData.id}`);

    } catch (error: any) {
      console.error('Error in checkout:', error);
      toast.error(error.message || 'Error al procesar la orden');
    } finally {
      setIsSubmitting(false);
      setShowDeUnaModal(false);
    }
  };

  const onSubmit = async (data: CheckoutForm) => {
    if (data.paymentMethod === 'de_una') {
      setPendingFormData(data);
      setShowDeUnaModal(true);
      return;
    }
    
    await processOrder(data);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tu carrito está vacío</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Agrega algunos productos para continuar con el pago.</p>
        <button
          onClick={() => navigate('/tienda')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ir a la Tienda
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
        <CreditCard className="w-8 h-8 mr-3 text-blue-600" />
        Finalizar Compra
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Método de Pago */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">1. Método de Pago</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {paymentMethods.map((method) => (
                  <label key={method.id} className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-colors ${paymentMethodId === method.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                    <input type="radio" value={method.id} {...register('paymentMethod')} className="sr-only" />
                    <span className="font-medium text-gray-900 dark:text-white text-center">{method.name}</span>
                    {method.fee_percent > 0 && <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">+{method.fee_percent}% comisión</span>}
                  </label>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {paymentMethodId === 'transfer' && (
                  <motion.div 
                    key="transfer"
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 space-y-4 overflow-hidden"
                  >
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">Datos Bancarios:</p>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        {bankInfo.name || 'Banco no configurado'} - Cta {bankInfo.account || '-'}<br/>
                        RUC: {bankInfo.ruc || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Comprobante de Transferencia
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                            <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500">
                              <span>Sube un archivo</span>
                              <input type="file" className="sr-only" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">{receiptFile ? receiptFile.name : 'PNG, JPG, PDF hasta 5MB'}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {paymentMethodId === 'payphone' && (
                  <motion.div 
                    key="payphone"
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 overflow-hidden"
                  >
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-orange-500" />
                      <p className="text-sm text-orange-700 dark:text-orange-300">Serás redirigido a la pasarela segura de PayPhone. (Modo Simulado Activo)</p>
                    </div>
                  </motion.div>
                )}
                {paymentMethodId === 'de_una' && (
                  <motion.div 
                    key="de_una"
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 overflow-hidden"
                  >
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex items-center gap-3">
                      <QrCode className="w-6 h-6 text-green-500" />
                      <p className="text-sm text-green-700 dark:text-green-300">Generaremos un código QR dinámico para tu pago con De Una. (Modo Simulado Activo)</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Datos de Envío */}
            {hasPhysicalItems && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  2. Método de Entrega
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {shippingMethods.map((method) => (
                    <label key={method.id} className={`cursor-pointer border rounded-lg p-4 flex flex-col items-start gap-1 transition-colors ${shippingMethodId === method.id ? 'border-green-600 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                      <div className="flex items-center gap-2 w-full">
                        <input type="radio" value={method.id} {...register('shippingMethod')} className="sr-only" />
                        <span className="font-medium text-gray-900 dark:text-white flex-1">{method.name}</span>
                        {method.base_cost > 0 ? (
                          <span className="text-sm font-bold text-gray-900 dark:text-white">${method.base_cost.toFixed(2)}</span>
                        ) : (
                          <span className="text-sm font-bold text-green-600">Gratis</span>
                        )}
                      </div>
                      {method.description && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{method.description}</span>
                      )}
                    </label>
                  ))}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <MapPin className="w-5 h-5 mr-2" />
                  Datos de Envío
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de quien recibe</label>
                    <input type="text" {...register('shippingName')} className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    {errors.shippingName && <p className="mt-1 text-sm text-red-600">{errors.shippingName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                    <input type="text" {...register('shippingPhone')} className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    {errors.shippingPhone && <p className="mt-1 text-sm text-red-600">{errors.shippingPhone.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección de Entrega / Notas</label>
                    <textarea {...register('shippingAddress')} rows={3} className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Ej. Av. Principal 123 y Calle Secundaria, Referencia: Casa azul" />
                    {errors.shippingAddress && <p className="mt-1 text-sm text-red-600">{errors.shippingAddress.message}</p>}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Resumen de Orden */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Resumen de Orden</h2>
            
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {items.map(item => (
                <div key={`${item.product.id}-${item.variant?.id || 'base'}`} className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Cant: {item.quantity} {item.variant ? `| Var: ${item.variant.size || ''} ${item.variant.color_name || ''}` : ''}
                      {item.product.ecommerce_product_type === 'digital' && <span className="ml-1 inline-flex items-center text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">Digital</span>}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    ${((item.product.price + (item.variant?.price_adjustment || 0)) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
              </div>
              
              {shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Envío ({selectedShipping?.name})</span>
                  <span className="text-gray-900 dark:text-white">${shippingCost.toFixed(2)}</span>
                </div>
              )}

              {paymentFee > 0 && selectedPayment && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 flex flex-col">
                    <span>Comisión ({selectedPayment.name})</span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      ({selectedPayment.fee_percent}% por uso de plataforma)
                    </span>
                  </span>
                  <span className="text-amber-600 font-medium">+${paymentFee.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100 dark:border-gray-700">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-blue-600">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  {paymentMethodId === 'de_una' ? 'Generar QR de Pago' : 'Confirmar y Pagar'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL MOCK DE UNA */}
      <AnimatePresence>
        {showDeUnaModal && pendingFormData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <QrCode className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pago con De Una</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Escanea este código QR desde tu app De Una para pagar ${finalTotal.toFixed(2)}</p>
                
                {/* Mock QR Placeholder */}
                <div className="mx-auto w-48 h-48 bg-white rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                  <QrCode className="w-24 h-24 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-2 font-mono font-semibold text-center px-2">Escanea para pagar</span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex flex-col gap-3 sm:flex-row justify-end">
                <button
                  onClick={() => setShowDeUnaModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => processOrder(pendingFormData)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center font-medium"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Simular Escaneo y Pagar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
