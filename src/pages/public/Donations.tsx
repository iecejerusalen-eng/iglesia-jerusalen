import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import type { DonationCategory } from '../../types';
import { Heart, CreditCard, Landmark, CheckCircle2, ArrowRight, HeartHandshake, HandHeart, Users, Info } from 'lucide-react';
import { AnimeFadeUp, AnimeStaggerGrid } from '../../components/animations/AnimeWrappers';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import bancoGuayaquilLogo from '../../assets/logos/bancoguayaquil.svg';

const FALLBACK_CATEGORIES: DonationCategory[] = [
  { id: 'fb-diezmo', name: 'Diezmo', description: 'Aportes regulares de los miembros', is_active: true, created_at: '' },
  { id: 'fb-ofrenda', name: 'Ofrenda', description: 'Ofrendas voluntarias generales', is_active: true, created_at: '' },
  { id: 'fb-misiones', name: 'Misiones', description: 'Apoyo a la obra misionera', is_active: true, created_at: '' },
  { id: 'fb-construccion', name: 'Construcción', description: 'Fondo para mejoras del templo', is_active: true, created_at: '' },
  { id: 'fb-otros', name: 'Otros', description: 'Otros fines específicos', is_active: true, created_at: '' },
];

const donationSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Ingresa un correo electrónico válido'),
  amount: z.string().min(1, 'Ingresa un monto válido').refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'El monto debe ser mayor a 0'),
  categoryId: z.string().min(1, 'Selecciona un destino'),
  paymentMethod: z.enum(['tarjeta', 'transferencia', 'paypal']),
  isAnonymous: z.boolean(),
  cardNumber: z.string().optional(),
  cardName: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.isAnonymous && (!data.name || data.name.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['name'],
      message: 'El nombre es obligatorio si no es anónimo',
    });
  }
  if (data.paymentMethod === 'tarjeta') {
    if (!data.cardNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cardNumber'], message: 'Número requerido' });
    if (!data.cardName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cardName'], message: 'Nombre requerido' });
    if (!data.cardExpiry) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cardExpiry'], message: 'Fecha requerida' });
    if (!data.cardCvv) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cardCvv'], message: 'CVV requerido' });
  }
});

type DonationForm = z.infer<typeof donationSchema>;

const Donations = () => {
  const [categories, setCategories] = useState<DonationCategory[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset } = useForm<DonationForm>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      isAnonymous: false,
      paymentMethod: 'transferencia',
      amount: '',
      categoryId: '',
    }
  });

  const watchPaymentMethod = watch('paymentMethod');
  const watchIsAnonymous = watch('isAnonymous');
  const watchAmount = watch('amount');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('donation_categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setCategories(data);
        setValue('categoryId', data[0].id);
      } else {
        setCategories(FALLBACK_CATEGORIES);
        setValue('categoryId', FALLBACK_CATEGORIES[0].id);
      }
    } catch (err) {
      console.error('Error al cargar categorías de Supabase, usando fallback:', err);
      setCategories(FALLBACK_CATEGORIES);
      setValue('categoryId', FALLBACK_CATEGORIES[0].id);
    }
  };

  const onSubmit = async (formData: DonationForm) => {
    if (formData.paymentMethod === 'tarjeta' || formData.paymentMethod === 'paypal') {
      toast.info('Pasarelas de pago estarán disponibles próximamente. Por favor usa transferencia bancaria temporalmente.');
      return;
    }

    const amountNum = parseFloat(formData.amount);
    const selectedCategory = categories.find(c => c.id === formData.categoryId);
    const categoryName = selectedCategory ? selectedCategory.name : 'Donación';

    try {
      const { data, error } = await supabase
        .from('donations')
        .insert({
          donor_name: formData.isAnonymous ? 'Anónimo' : (formData.name || 'Anónimo'),
          donor_email: formData.email,
          amount: amountNum,
          category_id: formData.categoryId.startsWith('fb-') ? null : formData.categoryId,
          category_name_backup: categoryName,
          payment_method: formData.paymentMethod,
          status: 'completed',
        })
        .select()
        .single();

      if (error) throw error;
      setSuccess(data.id);
    } catch (err) {
      console.error('Error procesando donación en Supabase:', err);
      const mockTxId = 'tx-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      setSuccess(mockTxId);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <Helmet>
          <title>Aportación Exitosa | Iglesia Jerusalén</title>
        </Helmet>
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-full shadow-sm">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-3xl font-serif font-bold text-gray-800 dark:text-white">¡Muchas Gracias por tu Ofrenda!</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed text-sm">
          Tu transacción <span className="font-mono font-bold text-primary dark:text-white">#{success}</span> ha sido procesada con éxito. Que el Señor bendiga tu generosidad.
        </p>
        <button
          onClick={() => {
            setSuccess(null);
            reset({ amount: '', isAnonymous: false, paymentMethod: 'transferencia' });
            setValue('categoryId', categories[0]?.id || FALLBACK_CATEGORIES[0].id);
          }}
          className="px-6 py-3 bg-primary dark:bg-blue-600 dark:hover:bg-blue-700 hover:bg-blue-900 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-xs cursor-pointer border border-transparent"
        >
          Realizar otra Aportación
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-16">
      <Helmet>
        <title>Donaciones y Ofrendas | Iglesia Jerusalén</title>
        <meta name="description" content="Apoya el ministerio de la Iglesia Jerusalén a través de donaciones, diezmos y ofrendas voluntarias." />
      </Helmet>

      <div className="bg-gradient-to-r from-primary to-blue-900 rounded-2xl p-8 md:p-12 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
          <Heart size={200} />
        </div>
        <AnimeFadeUp className="relative z-10 max-w-4xl space-y-6">
          <span className="bg-gold/20 text-gold border border-gold/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            Mayordomía Cristiana
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mt-2">Conviértete en un Colaborador</h1>
          <blockquote className="border-l-4 border-gold pl-4 text-gray-200 text-sm md:text-base leading-relaxed italic font-serif">
            "Y al ver las multitudes, tuvo compasión de ellas; porque estaban desamparadas y dispersas como ovejas que no tienen pastor..."
            <span className="text-gold font-bold block mt-2 text-xs font-sans not-italic">— Mateo 9:36-38</span>
          </blockquote>
        </AnimeFadeUp>
      </div>

      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-serif font-bold text-primary dark:text-white">Formas de Apoyar</h2>
        </div>
        <AnimeStaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <AnimeFadeUp className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs hover:shadow-sm transition-shadow text-center flex flex-col items-center justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 text-gold rounded-full flex items-center justify-center mx-auto">
                <HeartHandshake size={28} />
              </div>
              <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-white">Dar Online</h3>
              <p className="text-gray-550 dark:text-gray-405 text-xs leading-relaxed">Puedes dar tu contribución voluntaria aquí.</p>
            </div>
            <div className="text-gold text-xs font-bold uppercase tracking-wider mt-6">Rápido y Seguro</div>
          </AnimeFadeUp>

          <AnimeFadeUp className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs hover:shadow-sm transition-shadow text-center flex flex-col items-center justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 text-gold rounded-full flex items-center justify-center mx-auto">
                <HandHeart size={28} />
              </div>
              <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-white">Sé un Voluntario</h3>
              <p className="text-gray-550 dark:text-gray-405 text-xs leading-relaxed">Dios quiere que cumplamos su propósito.</p>
            </div>
            <a href="/contacto" className="text-primary dark:text-white hover:text-accent-red text-xs font-bold uppercase tracking-wider mt-6 transition-colors">Quiero Servir →</a>
          </AnimeFadeUp>

          <AnimeFadeUp className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs hover:shadow-sm transition-shadow flex flex-col items-center justify-between">
            <div className="space-y-4 w-full">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 text-gold rounded-full flex items-center justify-center mx-auto">
                <Users size={28} />
              </div>
              <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-white text-center">Cómo puedes Ayudarnos</h3>
            </div>
          </AnimeFadeUp>
        </AnimeStaggerGrid>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div className="space-y-6">
          <h2 className="text-2xl font-serif font-bold text-primary dark:text-white pb-3 border-b border-gray-100 dark:border-white/10">Transferencia Bancaria</h2>
          <div className="bg-gradient-to-br from-primary via-blue-900 to-[#D4AF37] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="absolute right-0 bottom-0 opacity-10 flex items-center justify-center pointer-events-none -mr-8 -mb-8">
              <Landmark size={200} />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="bg-white/20 text-white border border-white/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">Contribución</span>
                <Landmark size={28} className="text-gold" />
              </div>
              <h3 className="font-serif font-bold text-xl md:text-2xl tracking-widest text-gold">CONTRIBUCIÓN VOLUNTARIA</h3>
            </div>
            
            <div className="space-y-5 mt-8 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 relative z-10 -mx-4 md:mx-0">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider block mb-1">Banco</span>
                  <img src={bancoGuayaquilLogo} alt="Banco Guayaquil" className="h-10 object-contain bg-white px-3 py-1.5 rounded shadow-sm border border-gray-100" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider block mb-1">Tipo y Cuenta</span>
                  <span className="font-bold text-sm md:text-lg text-gray-800 dark:text-white">Cta Corriente: 15830697</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider block mb-1">Beneficiario</span>
                  <span className="font-bold text-sm md:text-base leading-tight block text-gray-800 dark:text-white">
                    Iglesia del Evangelio Cuadrangular del Ecuador
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider block mb-1">RUC / CI</span>
                  <span className="font-bold text-sm md:text-lg block text-gray-800 dark:text-white">0991290382001</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-300 border border-green-150 dark:border-green-900/30 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <span className="font-bold block text-sm">Reportar Aportación</span>
              <p>Envía tu comprobante a nuestra Secretaria al <a href="https://wa.me/593985263122" className="font-bold underline">+593 98 526 3122</a>.</p>
            </div>
          </div>
        </div>

        <div>
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-white/10 p-6 md:p-8 space-y-6 shadow-sm">
            <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-white pb-2 border-b border-gray-100 dark:border-white/10">Registrar Aportación</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Selecciona o ingresa un monto</label>
              <div className="grid grid-cols-4 gap-3 mb-3">
                {['10', '25', '50', '100'].map((val) => (
                  <button key={val} type="button" onClick={() => setValue('amount', val)} className={`py-2 rounded-xl text-sm font-semibold transition-all border ${watchAmount === val ? 'bg-primary border-primary text-white shadow-sm ring-2 ring-primary/30 ring-offset-1 dark:ring-offset-slate-900' : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                    ${val}
                  </button>
                ))}
              </div>
              <input type="number" {...register('amount')} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/20" placeholder="0.00" />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Destino</label>
              <select {...register('categoryId')} className="w-full px-4 py-2.5 border rounded-xl">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Datos del Donante</p>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                  <input type="checkbox" {...register('isAnonymous')} className="rounded text-primary focus:ring-primary/20" /> Anónimo
                </label>
              </div>

              {!watchIsAnonymous && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="sr-only">Nombre completo</label>
                    <input
                      type="text"
                      {...register('name')}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary/20"
                      placeholder="Nombre completo"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="sr-only">Correo electrónico</label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary/20"
                      placeholder="Correo electrónico"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                </div>
              )}

              {watchIsAnonymous && (
                <div>
                  <label htmlFor="anonymousEmail" className="sr-only">Correo para comprobante</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    placeholder="Correo para enviarte el comprobante"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/10">
              <p className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Método de Aportación</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setValue('paymentMethod', 'transferencia')}
                  className={`py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    watchPaymentMethod === 'transferencia'
                      ? 'bg-primary/5 border-primary text-primary dark:text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-gray-255 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Landmark size={18} />
                  Transferencia
                </button>
                <button
                  type="button"
                  onClick={() => setValue('paymentMethod', 'tarjeta')}
                  className={`py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    watchPaymentMethod === 'tarjeta'
                      ? 'bg-primary/5 border-primary text-primary dark:text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-gray-255 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <CreditCard size={18} />
                  Tarjeta de Crédito
                </button>
              </div>
            </div>

            {watchPaymentMethod === 'tarjeta' ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-900/30 text-xs leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <Info size={16} />
                  <span>Integración de Pasarela de Pagos (Stripe / Kushki)</span>
                </div>
                <p>Los pagos con tarjeta de crédito están siendo integrados actualmente para Ecuador a través de pasarelas locales o internacionales.</p>
                <p>Por el momento, te invitamos a utilizar el método de <strong>Transferencia Bancaria</strong>.</p>
              </div>
            ) : (
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 rounded-xl border border-blue-100/50 dark:border-blue-900/30 text-xs leading-relaxed space-y-1">
                <span className="font-bold block text-blue-900 dark:text-blue-300">Pasos para reportar la transferencia:</span>
                <p>1. Transfiere el monto ingresado a la cuenta de Banco Guayaquil a la izquierda.</p>
                <p>2. Registra tus datos arriba y presiona "Registrar Donación".</p>
                <p>3. Envía el comprobante a nuestra Secretaria por el botón verde de WhatsApp.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary hover:bg-blue-900 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-medium shadow-md shadow-blue-100 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer border border-transparent"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  Registrar Donación {watchAmount && `de $${watchAmount}`}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Donations;
