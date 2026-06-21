import { useState } from 'react';
import { supabase } from '../../config/supabase';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeHoverCard, AnimeZoomIn, AnimeRubberBandHover } from '../../components/animations/AnimeWrappers';
import MagneticButton from '../../components/animations/MagneticButton';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Consulta General',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Call rate-limiter Edge Function to protect endpoint against spamming
      const { data: limitData, error: limitError } = await supabase.functions.invoke('rate-limiter', {
        body: { endpoint: 'contacto' }
      });

      if (limitError) {
        setError('Límite de solicitudes excedido (5 peticiones cada 15 min). Por favor intenta de nuevo más tarde.');
        setLoading(false);
        return;
      }

      if (!limitData || !limitData.success) {
        setError('Límite de solicitudes excedido (5 peticiones cada 15 min). Por favor intenta de nuevo más tarde.');
        setLoading(false);
        return;
      }

      // Proceed with inserting the contact message
      const { error: insertError } = await supabase
        .from('contact_messages')
        .insert({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          status: 'unread',
        });

      if (insertError) throw insertError;
      setSuccess(true);
    } catch (err: any) {
      console.error('Error enviando mensaje a Supabase:', err);
      if (err.context?.status === 429 || err.message?.includes('429')) {
        setError('Límite de solicitudes excedido (5 peticiones cada 15 min). Por favor intenta de nuevo más tarde.');
      } else {
        setError('Ocurrió un error al enviar tu mensaje. Por favor intenta más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-16">
      
      {/* HEADER HERO */}
      <div id="contact_hero" className="bg-gradient-to-r from-primary to-blue-900 rounded-2xl p-8 md:p-12 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
          <Mail size={200} />
        </div>
        <AnimeZoomIn 
          className="relative z-10 max-w-3xl space-y-4"
        >
          <span className="bg-gold/20 text-gold border border-gold/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            Canales de Atención
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mt-2">Contacto</h1>
          <p className="text-gray-200 text-base md:text-lg leading-relaxed font-light">
            ¿Tienes dudas, peticiones de oración, o deseas saber más de nuestras actividades? Ponte en contacto con nosotros, estamos para servirte.
          </p>
        </AnimeZoomIn>
      </div>

      {/* GRID PRINCIPAL (2 Columnas en Desktop) */}
      <AnimeStaggerGrid 
        id="contact_info"
        className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch"
      >
        
        {/* Columna Izquierda: Información de Contacto */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-primary dark:text-white pb-3 border-b border-gray-100 dark:border-white/10">
              Información de Contacto
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Tarjeta Dirección */}
              <AnimeHoverCard className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-6 flex gap-4 shadow-xs">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/30 text-primary dark:text-blue-300 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-sm">Dirección</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Baquerizo Moreno entre Av. Colón y Tulcán, Milagro 09D1701.
                  </p>
                </div>
              </AnimeHoverCard>

              {/* Tarjeta Secretaría */}
              <AnimeHoverCard className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-6 flex gap-4 shadow-xs">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/30 text-primary dark:text-blue-300 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-sm">Secretaría</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    +593 98 526 3122 (Hna. Marlene)
                  </p>
                </div>
              </AnimeHoverCard>

              {/* Tarjeta Correo */}
              <AnimeHoverCard className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-6 flex gap-4 shadow-xs">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/30 text-primary dark:text-blue-300 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-sm">Correo Electrónico</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    iece_jerusalen@hotmail.com
                  </p>
                </div>
              </AnimeHoverCard>
            </div>
          </div>

          {/* Redes Sociales */}
          <div className="pt-6 border-t border-gray-100 dark:border-white/10 space-y-4">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Nuestras Redes Sociales</span>
            <div className="flex gap-4">
              <AnimeRubberBandHover>
                <a 
                  href="https://www.facebook.com/jerusalen.cuadrangular" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-12 h-12 bg-white dark:bg-slate-900 dark:bg-slate-800 text-gray-650 dark:text-gray-300 hover:text-primary dark:text-white dark:hover:text-blue-400 border border-gray-200 dark:border-white/10 rounded-2xl flex items-center justify-center shadow-xs transition-colors" 
                  title="Facebook"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                  </svg>
                </a>
              </AnimeRubberBandHover>

              <AnimeRubberBandHover>
                <a 
                  href="https://www.instagram.com/jerusalen_iece/" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-12 h-12 bg-white dark:bg-slate-900 dark:bg-slate-800 text-gray-650 dark:text-gray-300 hover:text-accent-red dark:hover:text-red-400 border border-gray-200 dark:border-white/10 rounded-2xl flex items-center justify-center shadow-xs transition-colors" 
                  title="Instagram"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              </AnimeRubberBandHover>

              <AnimeRubberBandHover>
                <a 
                  href="https://www.youtube.com/channel/UCgzlmsop3KSLpyzz92WQ2Mw" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-12 h-12 bg-white dark:bg-slate-900 dark:bg-slate-800 text-gray-650 dark:text-gray-300 hover:text-accent-red dark:hover:text-red-400 border border-gray-200 dark:border-white/10 rounded-2xl flex items-center justify-center shadow-xs transition-colors" 
                  title="YouTube"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.53 3.545 12 3.545 12 3.545s-7.53 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.017 0 12 0 12s0 3.982.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.858.507 9.388.507 9.388.507s7.53 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.982 24 12 24 12s0-3.982-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </AnimeRubberBandHover>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Mapa de Ubicación */}
        <div 
          className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-white/10 p-4 shadow-sm h-full min-h-[400px] flex flex-col"
        >
          <div className="flex-1 rounded-2xl overflow-hidden shadow-xs border border-gray-100 dark:border-white/5 relative h-full">
            <iframe 
              src="https://maps.google.com/maps?q=-2.139188,-79.5949891&t=&z=17&ie=UTF8&iwloc=&output=embed"
              className="absolute inset-0 w-full h-full border-0 dark:invert-[90%] dark:hue-rotate-[180deg] dark:contrast-[85%]"
              allowFullScreen={true}
              loading="lazy"
              // @ts-expect-error credentialless is not yet in React's TS definitions but is supported by the browser
              credentialless="true"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa Iglesia Jerusalén"
            ></iframe>
          </div>
        </div>
      </AnimeStaggerGrid>

      {/* FORMULARIO DE MENSAJE (Centrado abajo para conservar funcionalidad) */}
      <AnimeFadeUp 
        className="max-w-3xl mx-auto pt-6"
      >
        {success ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 p-8 rounded-3xl text-center space-y-4 shadow-sm py-16">
            <div className="w-16 h-16 bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="font-serif font-bold text-2xl text-gray-800 dark:text-white">¡Mensaje Enviado!</h3>
            <p className="text-gray-555 dark:text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
              Gracias por escribirnos. Tu mensaje ha sido enviado a la administración de la iglesia. Te responderemos al correo proporcionado lo antes posible.
            </p>
            <MagneticButton>
              <button
                onClick={() => setSuccess(false)}
                className="mt-4 px-6 py-2.5 bg-primary dark:bg-blue-600 dark:hover:bg-blue-700 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer border border-transparent"
              >
                Enviar otro mensaje
              </button>
            </MagneticButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-white/10 p-6 md:p-10 space-y-6 shadow-xs">
            <div className="space-y-1">
              <h3 className="text-2xl font-serif font-bold text-gray-800 dark:text-white">
                Escríbenos tu Mensaje
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">¿Tienes dudas o necesitas consejería? Déjanos tu mensaje en el buzón.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Tu Nombre</label>
                <input
                  id="name"
                  type="text"
                  required
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-transparent border border-gray-200 dark:border-white/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/30 focus:outline-none dark:text-white"
                  placeholder="Ej. Ana de Castro"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Tu Correo</label>
                <input
                  id="email"
                  type="email"
                  required
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-transparent border border-gray-200 dark:border-white/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/30 focus:outline-none dark:text-white"
                  placeholder="Ej. ana@correo.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-medium">Asunto</label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-transparent border border-gray-200 dark:border-white/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/30 focus:outline-none dark:text-white dark:bg-slate-900"
              >
                <option value="Consulta General">Consulta General</option>
                <option value="Petición de Oración">Petición de Oración</option>
                <option value="Consejería Pastoral">Consejería Pastoral</option>
                <option value="Tienda / Pedidos">Pregunta sobre Tienda / Pedidos</option>
                <option value="Voluntariado / Servicio">Deseo Servir en Ministerios</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 font-medium">Mensaje</label>
              <textarea
                id="message"
                required
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-transparent border border-gray-200 dark:border-white/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/30 focus:outline-none dark:text-white"
                placeholder="Escribe aquí tu petición de oración, consulta o mensaje..."
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 text-accent-red dark:text-red-400 p-3 rounded-xl text-xs flex items-center gap-1.5 border border-red-100 dark:border-red-900/30">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2">
              <MagneticButton className="w-full lg:w-auto">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full lg:w-auto px-8 py-3 bg-primary dark:bg-blue-600 dark:hover:bg-blue-700 hover:bg-blue-900 disabled:bg-gray-200 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer border border-transparent"
                >
                  {loading ? 'Enviando...' : (
                    <>
                      Enviar Mensaje
                      <Send size={16} />
                    </>
                  )}
                </button>
              </MagneticButton>
            </div>
          </form>
        )}
      </AnimeFadeUp>

    </div>
  );
};

export default Contact;
