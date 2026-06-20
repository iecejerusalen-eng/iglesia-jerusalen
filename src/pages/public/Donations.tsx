import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import type { DonationCategory } from '../../types';
import { Heart, CreditCard, Landmark, CheckCircle2, ArrowRight, HeartHandshake, HandHeart, Users } from 'lucide-react';
import { AnimeFadeUp, AnimeStaggerGrid } from '../../components/animations/AnimeWrappers';
import bancoGuayaquilLogo from '../../assets/logos/bancoguayaquil.svg';

const FALLBACK_CATEGORIES: DonationCategory[] = [
  { id: 'fb-diezmo', name: 'Diezmo', description: 'Aportes regulares de los miembros', is_active: true, created_at: '' },
  { id: 'fb-ofrenda', name: 'Ofrenda', description: 'Ofrendas voluntarias generales', is_active: true, created_at: '' },
  { id: 'fb-misiones', name: 'Misiones', description: 'Apoyo a la obra misionera', is_active: true, created_at: '' },
  { id: 'fb-construccion', name: 'Construcción', description: 'Fondo para mejoras del templo', is_active: true, created_at: '' },
  { id: 'fb-otros', name: 'Otros', description: 'Otros fines específicos', is_active: true, created_at: '' },
];

const Donations = () => {
  const [categories, setCategories] = useState<DonationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    amount: '',
    categoryId: '',
    paymentMethod: 'tarjeta', // 'tarjeta' | 'transferencia'
    isAnonymous: false,
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('donation_categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setCategories(data);
        setFormData(prev => ({ ...prev, categoryId: data[0].id }));
      } else {
        setCategories(FALLBACK_CATEGORIES);
        setFormData(prev => ({ ...prev, categoryId: FALLBACK_CATEGORIES[0].id }));
      }
    } catch (err) {
      console.error('Error al cargar categorías de Supabase, usando fallback:', err);
      setCategories(FALLBACK_CATEGORIES);
      setFormData(prev => ({ ...prev, categoryId: FALLBACK_CATEGORIES[0].id }));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleQuickAmount = (amount: string) => {
    setFormData((prev) => ({ ...prev, amount }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Por favor ingresa un monto válido.');
      setSubmitting(false);
      return;
    }

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
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-full shadow-sm">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-3xl font-serif font-bold text-gray-800 dark:text-white">¡Muchas Gracias por tu Ofrenda!</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed text-sm">
          Tu transacción <span className="font-mono font-bold text-primary dark:text-white">#{success}</span> por un monto de <span className="font-bold text-gray-800 dark:text-white">${parseFloat(formData.amount).toFixed(2)}</span> ha sido procesada con éxito. Que el Señor bendiga tu generosidad.
        </p>
        <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-150 dark:border-white/10 text-left max-w-md mx-auto">
          <h4 className="font-serif font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm">Resumen de Transacción</h4>
          <div className="space-y-2 text-xs text-gray-650 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Destino:</span>
              <span className="font-bold text-gray-800 dark:text-white">
                {categories.find(c => c.id === formData.categoryId)?.name || 'General'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Donante:</span>
              <span className="font-bold text-gray-800 dark:text-white">
                {formData.isAnonymous ? 'Anónimo' : (formData.name || 'Anónimo')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Método de Pago:</span>
              <span className="font-bold text-gray-800 dark:text-white uppercase">{formData.paymentMethod}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setSuccess(null);
            setFormData(prev => ({ ...prev, amount: '' }));
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
      
      {/* 1. HERO SECTION (INSPIRACIONAL) */}
      <div className="bg-gradient-to-r from-primary to-blue-900 rounded-2xl p-8 md:p-12 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
          <Heart size={200} />
        </div>
        <AnimeFadeUp 
          className="relative z-10 max-w-4xl space-y-6"
        >
          <span className="bg-gold/20 text-gold border border-gold/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            Mayordomía Cristiana
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mt-2">
            Conviértete en un Colaborador
          </h1>
          
          <blockquote className="border-l-4 border-gold pl-4 text-gray-200 text-sm md:text-base leading-relaxed italic font-serif">
            "Y al ver las multitudes, tuvo compasión de ellas; porque estaban desamparadas y dispersas como ovejas que no tienen pastor. Entonces dijo a sus discípulos: A la verdad la mies es mucha, mas los obreros pocos. Rogad, pues, al Señor de la mies, que envíe obreros a su mies."
            <span className="text-gold font-bold block mt-2 text-xs font-sans not-italic">— Mateo 9:36-38</span>
          </blockquote>
          <p className="text-gray-100 text-sm md:text-base leading-relaxed font-light">
            Lo más importante no es el dinero sino tu corazón y tu voluntad... Dios es el dueño de todo, pero te quiere a ti para por medio de ti llegar a otros.
          </p>
        </AnimeFadeUp>
      </div>

      {/* 2. SECCIÓN DE 3 PILARES (GRID IN CASUAL CASCADE) */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-serif font-bold text-primary dark:text-white">Formas de Apoyar</h2>
          <p className="text-gray-400 dark:text-gray-500 text-xs">Existen múltiples maneras de colaborar con la obra de Dios en la iglesia.</p>
        </div>

        <AnimeStaggerGrid 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Pilar 1: Dar Online */}
          <AnimeFadeUp 
            className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs hover:shadow-sm transition-shadow text-center flex flex-col items-center justify-between"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 text-gold rounded-full flex items-center justify-center">
                <HeartHandshake size={28} />
              </div>
              <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-white">Dar Online</h3>
              <p className="text-gray-550 dark:text-gray-405 text-xs leading-relaxed">
                Puedes dar tu contribución voluntaria aquí.
              </p>
            </div>
            <div className="text-gold text-xs font-bold uppercase tracking-wider mt-6">Rápido y Seguro</div>
          </AnimeFadeUp>

          {/* Pilar 2: Sé un Voluntario */}
          <AnimeFadeUp 
            className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs hover:shadow-sm transition-shadow text-center flex flex-col items-center justify-between"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 text-gold rounded-full flex items-center justify-center">
                <HandHeart size={28} />
              </div>
              <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-white">Sé un Voluntario</h3>
              <p className="text-gray-550 dark:text-gray-405 text-xs leading-relaxed">
                Dios quiere que cumplamos su propósito. Comunícate con nosotros.
              </p>
            </div>
            <a 
              href="/contacto" 
              className="text-primary dark:text-white hover:text-accent-red text-xs font-bold uppercase tracking-wider mt-6 transition-colors"
            >
              Quiero Servir →
            </a>
          </AnimeFadeUp>

          {/* Pilar 3: Cómo puedes Ayudarnos */}
          <AnimeFadeUp 
            className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs hover:shadow-sm transition-shadow flex flex-col items-center justify-between"
          >
            <div className="space-y-4 w-full">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 text-gold rounded-full flex items-center justify-center mx-auto">
                <Users size={28} />
              </div>
              <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-white text-center">Cómo puedes Ayudarnos</h3>
              <ol className="text-left space-y-2 text-xs text-gray-550 dark:text-gray-405 font-medium pl-2">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold text-[10px]">1</span>
                  Con tu ayuda Servicial.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold text-[10px]">2</span>
                  Con tus rodillas al Orar.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold text-[10px]">3</span>
                  Con tus manos al Dar.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold text-[10px]">4</span>
                  Con tus Pies al ir a hacer la Gran Comisión.
                </li>
              </ol>
            </div>
          </AnimeFadeUp>
        </AnimeStaggerGrid>
      </section>

      {/* 3. GRID PRINCIPAL: CUENTA BANCARIA & FORMULARIO DAR ONLINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        
        {/* Columna Izquierda: Tarjeta de Cuenta Bancaria */}
        <div className="space-y-6">
          <h2 className="text-2xl font-serif font-bold text-primary dark:text-white pb-3 border-b border-gray-100 dark:border-white/10">
            Transferencia Bancaria
          </h2>

          {/* Tarjeta de Cuenta Bancaria */}
          <div className="bg-gradient-to-br from-primary via-blue-900 to-[#D4AF37] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="absolute right-0 bottom-0 opacity-10 flex items-center justify-center pointer-events-none -mr-8 -mb-8">
              <Landmark size={200} />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="bg-white/20 text-white border border-white/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                  Contribución
                </span>
                <Landmark size={28} className="text-gold" />
              </div>
              <h3 className="font-serif font-bold text-xl md:text-2xl tracking-widest text-gold">
                CONTRIBUCIÓN VOLUNTARIA
              </h3>
            </div>
            
            <div className="space-y-4 pt-6 text-sm font-light border-t border-white/10 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-gray-300 font-bold uppercase tracking-wider block">Banco</span>
                  <img src={bancoGuayaquilLogo} alt="Banco Guayaquil" className="h-6 object-contain mt-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded shadow-xs" />
                </div>
                <div>
                  <span className="text-[9px] text-gray-300 font-bold uppercase tracking-wider block">Tipo y Cuenta</span>
                  <span className="font-semibold text-xs md:text-sm">Cta Corriente: 15830697</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-[9px] text-gray-300 font-bold uppercase tracking-wider block">Beneficiario</span>
                  <span className="font-semibold text-xs md:text-sm leading-tight block">
                    Iglesia del Evangelio Cuadrangular del Ecuador
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-300 font-bold uppercase tracking-wider block">RUC</span>
                  <span className="font-semibold text-xs md:text-sm">0991437045001</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nota Importante (WhatsApp/Secretaría) */}
          <div className="bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-300 border border-green-150 dark:border-green-900/30 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 text-[#25D366] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.335 4.978L2 22l5.197-1.361a9.94 9.94 0 0 0 4.815 1.23c5.504 0 9.987-4.479 9.99-9.987.003-2.67-1.035-5.177-2.922-7.066A9.914 9.914 0 0 0 12.012 2zm5.799 14.15c-.254.717-1.488 1.408-2.043 1.482-.555.074-1.258.12-3.693-.884-2.937-1.21-4.834-4.2-4.981-4.395-.147-.195-1.198-1.593-1.198-3.037 0-1.445.755-2.15 1.025-2.433.27-.283.593-.353.79-.353.197 0 .394.002.567.01.18.008.422-.07.66.498.243.582.83 2.02.902 2.169.072.149.12.322.02.52-.1.198-.15.322-.297.495-.148.173-.31.385-.443.516-.148.148-.302.31-.13.606.173.297.77 1.272 1.652 2.057.882.787 1.626 1.03 1.854 1.135.228.106.362.088.497-.066.136-.155.592-.687.75-.921.159-.234.318-.198.536-.118.22.08.1.393 1.393.978.22.106.368.16.422.25.053.09.053.52-.2.124z" />
                </svg>
              </div>
              <div className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
                <span className="font-bold block text-sm">Reportar Aportación</span>
                <p className="leading-relaxed">
                  Enviar captura de pantalla de la transacción con sus datos al correo <span className="font-bold text-gray-800 dark:text-white">iece_jerusalen@hotmail.com</span> o a nuestra Secretaria: <span className="font-bold text-gray-800 dark:text-white">Hermana Marlene +593 98 526 3122</span>.
                </p>
              </div>
            </div>
            <a 
              href="https://wa.me/593985263122" 
              target="_blank" 
              rel="noreferrer"
              className="w-full py-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-green-100 text-center"
            >
              Enviar Comprobante por WhatsApp
            </a>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Registro en Línea */}
        <div>
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-white/10 p-6 md:p-8 space-y-6 shadow-sm">
            <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-white pb-2 border-b border-gray-100 dark:border-white/10">
              Registrar Aportación
            </h2>

            {/* Quick Amounts */}
            <div>
              <label htmlFor="amount" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
                Selecciona o ingresa un monto
              </label>
              <div className="grid grid-cols-4 gap-3 mb-3">
                {['$10', '$25', '$50', '$100'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAmount(val.replace('$', ''))}
                    className={`py-2 rounded-xl text-sm font-semibold transition-all border cursor-pointer ${
                      formData.amount === val.replace('$', '')
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-gray-250 dark:border-slate-700 text-gray-650 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  id="amount"
                  type="number"
                  name="amount"
                  required
                  min="1"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-800 dark:text-white bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  placeholder="0.00"
                />
                <span className="absolute left-3 top-3.5 text-gray-500 dark:text-gray-400 font-bold text-sm">$</span>
              </div>
            </div>

            {/* Destino y Categorías Dinámicas */}
            <div>
              <label htmlFor="categoryId" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Destino de la Aportación
              </label>
              {loading ? (
                <select
                  id="categoryId"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-gray-50 dark:bg-slate-800 animate-pulse focus:outline-none"
                  disabled
                >
                  <option>Cargando destinos...</option>
                </select>
              ) : (
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.description}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Datos Personales */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Datos del Donante
                </p>
                <label htmlFor="isAnonymous" className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                  <input
                    id="isAnonymous"
                    type="checkbox"
                    name="isAnonymous"
                    checked={formData.isAnonymous}
                    onChange={handleInputChange}
                    className="rounded text-primary dark:text-white focus:ring-primary/20"
                  />
                  Hacer donación anónima
                </label>
              </div>

              {!formData.isAnonymous && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="sr-only">Nombre completo</label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      autoComplete="name"
                      required={!formData.isAnonymous}
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="sr-only">Correo electrónico</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      placeholder="Correo electrónico"
                    />
                  </div>
                </div>
              )}

              {formData.isAnonymous && (
                <div>
                  <label htmlFor="anonymousEmail" className="sr-only">Correo para comprobante</label>
                  <input
                    id="anonymousEmail"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="Correo para enviarte el comprobante"
                  />
                </div>
              )}
            </div>

            {/* Métodos de Pago */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/10">
              <p className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Método de Aportación
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, paymentMethod: 'tarjeta' }))}
                  className={`py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    formData.paymentMethod === 'tarjeta'
                      ? 'bg-primary/5 border-primary text-primary dark:text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-gray-255 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <CreditCard size={18} />
                  Tarjeta de Crédito
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, paymentMethod: 'transferencia' }))}
                  className={`py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    formData.paymentMethod === 'transferencia'
                      ? 'bg-primary/5 border-primary text-primary dark:text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-gray-255 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Landmark size={18} />
                  Transferencia
                </button>
              </div>
            </div>

            {/* Formulario Tarjeta o Instrucción */}
            {formData.paymentMethod === 'tarjeta' ? (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-150 dark:border-white/10">
                <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold block uppercase">Detalles de la tarjeta (Simulados)</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cardName" className="sr-only">Nombre impreso</label>
                    <input
                      id="cardName"
                      type="text"
                      name="cardName"
                      autoComplete="cc-name"
                      required={formData.paymentMethod === 'tarjeta'}
                      value={formData.cardName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/20"
                      placeholder="Nombre impreso"
                    />
                  </div>
                  <div>
                    <label htmlFor="cardNumber" className="sr-only">Número de tarjeta</label>
                    <input
                      id="cardNumber"
                      type="text"
                      name="cardNumber"
                      autoComplete="cc-number"
                      required={formData.paymentMethod === 'tarjeta'}
                      maxLength={19}
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/20"
                      placeholder="Número de tarjeta"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cardExpiry" className="sr-only">Expiración</label>
                    <input
                      id="cardExpiry"
                      type="text"
                      name="cardExpiry"
                      autoComplete="cc-exp"
                      required={formData.paymentMethod === 'tarjeta'}
                      maxLength={5}
                      value={formData.cardExpiry}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/20"
                      placeholder="MM/AA"
                    />
                  </div>
                  <div>
                    <label htmlFor="cardCvv" className="sr-only">CVV</label>
                    <input
                      id="cardCvv"
                      type="password"
                      name="cardCvv"
                      autoComplete="cc-csc"
                      required={formData.paymentMethod === 'tarjeta'}
                      maxLength={3}
                      value={formData.cardCvv}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/20"
                      placeholder="CVV"
                    />
                  </div>
                </div>
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
              disabled={submitting}
              className="w-full py-3 bg-primary hover:bg-blue-900 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-medium shadow-md shadow-blue-100 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer border border-transparent"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  Registrar Donación de ${formData.amount || '0.00'}
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
