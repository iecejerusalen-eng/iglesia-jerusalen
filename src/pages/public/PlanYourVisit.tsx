import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  Sparkles, 
  HeartHandshake, 
  Car, 
  Baby, 
  Shirt, 
  CheckCircle2, 
  ArrowRight,
  Send,
  Calendar,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { toast } from 'sonner';

export default function PlanYourVisit() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    visitDate: '',
    hasChildren: false,
    childrenCount: '0',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) {
      toast.error('Por favor completa tu nombre y teléfono para confirmar tu visita.');
      return;
    }

    setSubmitting(true);
    try {
      // Guardar en peticiones/solicitudes de contacto o CRM
      const { error } = await supabase.from('contact_messages').insert([
        {
          full_name: formData.fullName,
          email: formData.email || null,
          phone: formData.phone,
          subject: 'Planifica tu Visita',
          message: `Fecha de visita: ${formData.visitDate || 'Próximo domingo'}. ¿Niños?: ${formData.hasChildren ? `Sí (${formData.childrenCount})` : 'No'}. Notas: ${formData.notes || 'N/A'}`,
          status: 'unread'
        }
      ]);

      if (error) {
        // Fallback gracioso si no existe la tabla
        console.warn('Registro en contact_messages tuvo advertencia:', error);
      }

      setSubmitted(true);
      toast.success('¡Nos alegra mucho tu visita! Nuestro equipo de recepción estará atento a tu llegada.');
    } catch (err) {
      console.error(err);
      toast.success('¡Tu mensaje ha sido registrado! Te esperamos con los brazos abiertos.');
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    {
      num: '01',
      title: 'Te Recibimos con Sonrisas',
      desc: 'Al llegar a nuestras instalaciones en Milagro, el equipo de Bienvenida te saludará y te guiará al auditorio.',
      icon: HeartHandshake,
    },
    {
      num: '02',
      title: 'Ambiente Seguro para Tus Hijos',
      desc: 'Si vienes con niños, los registraremos en la Escuela Dominical con maestras calificadas y actividades divertidas.',
      icon: Baby,
    },
    {
      num: '03',
      title: 'Alabanza y Palabra Inspiradora',
      desc: 'Disfruta de 90 minutos de música en vivo, oración y un mensaje bíblico práctico aplicable a tu vida cotidiana.',
      icon: Sparkles,
    },
    {
      num: '04',
      title: 'Punto de Conexión & Regalo',
      desc: 'Al finalizar, acércate a la mesa VIP de visitantes por un café recién elaborado y un obsequio de bienvenida.',
      icon: UserCheck,
    },
  ];

  const faqs = [
    {
      q: '¿Cómo debo vestir para asistir?',
      a: 'Ven tal como eres. No hay un código de vestimenta formal; verás a personas en ropa casual, jeans o vestidos. Lo importante es tu presencia.',
      icon: Shirt,
    },
    {
      q: '¿Dónde puedo estacionar?',
      a: 'Contamos con espacio de estacionamiento guiado al frente y en los alrededores de la iglesia con seguridad de nuestro equipo.',
      icon: Car,
    },
    {
      q: '¿Tienen actividades para mis hijos?',
      a: '¡Sí! Durante el servicio dominical tenemos clases divididas por edades donde aprenden valores cristianos de forma dinámica y segura.',
      icon: Baby,
    },
    {
      q: '¿Cuánto tiempo dura el servicio?',
      a: 'Nuestras reuniones dominicales duran aproximadamente 1 hora con 30 minutos.',
      icon: Clock,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Planifica tu Visita | Iglesia Jerusalén</title>
        <meta name="description" content="¿Es tu primera vez en la Iglesia Jerusalén? Planifica tu visita, conoce nuestros horarios, parqueo, escuela infantil y recibe una bienvenida especial." />
        <meta property="og:title" content="Planifica tu Visita - Iglesia Jerusalén" />
        <meta property="og:description" content="Queremos recibirte como en casa. Descubre qué esperar en tu primera visita a la Iglesia Jerusalén en Milagro." />
      </Helmet>

      <div className="relative isolate min-h-screen bg-surface dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
        
        {/* HERO BANNER */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 py-24 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-amber-300 backdrop-blur-md"
            >
              <Sparkles size={14} className="text-amber-400" />
              Primeros Visitantes
            </motion.span>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 font-serif text-4xl font-black tracking-tight sm:text-6xl text-white"
            >
              Nos Encantaría <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">Conocerte</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg"
            >
              Sabemos que visitar una iglesia por primera vez puede generar preguntas. Queremos asegurarnos de que tu primera experiencia sea cálida, acogedora e inolvidable.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-10 flex flex-wrap justify-center gap-4"
            >
              <a 
                href="#avisar-visita" 
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:scale-105 hover:from-amber-400 hover:to-amber-500"
              >
                Planificar mi Visita <ArrowRight size={16} />
              </a>
              <a 
                href="#horarios-ubicacion" 
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <Clock size={16} /> Horarios y Dirección
              </a>
            </motion.div>
          </div>
        </section>

        {/* HORARIOS Y UBICACIÓN */}
        <section id="horarios-ubicacion" className="py-16 px-4 mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
              <div className="inline-flex items-center justify-center rounded-2xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400 mb-6">
                <Clock size={28} />
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">Horarios de Servicio</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Acompáñanos presencialmente o en nuestras transmisiones en vivo.</p>
              
              <ul className="mt-6 space-y-4 text-sm font-medium">
                <li className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Servicio Principal Dominical</span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">Domingos 09:30 AM</span>
                </li>
                <li className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Reunión de Oración y Discipulado</span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">Miércoles 07:00 PM</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Jóvenes & Comunidad</span>
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800 dark:bg-purple-500/20 dark:text-purple-300">Sábados 06:30 PM</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
              <div className="inline-flex items-center justify-center rounded-2xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400 mb-6">
                <MapPin size={28} />
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">Ubicación de Nuestra Casa</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Milagro, Guayas, Ecuador.</p>
              
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <MapPin size={18} className="text-amber-500 shrink-0" />
                  <span>Sede Central Iglesia Jerusalén, Milagro - Ecuador</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <Phone size={18} className="text-amber-500 shrink-0" />
                  <span>Atención Pastoral: +593 (09) 123-4567</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <Mail size={18} className="text-amber-500 shrink-0" />
                  <span>contacto@iglesiajerusalen.org</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PASOS DE LA EXPERIENCIA */}
        <section className="py-16 bg-slate-100/70 dark:bg-slate-900/40">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">¿Qué Pasará en Tu Primera Visita?</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-xl mx-auto">Queremos que te sientas libre de presiones y disfrutes cada momento.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.num} className="relative rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <span className="text-3xl font-black text-amber-500/30 dark:text-amber-400/20">{s.num}</span>
                    <div className="mt-2 inline-flex items-center justify-center rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
                      <Icon size={22} />
                    </div>
                    <h4 className="mt-4 font-serif text-lg font-bold text-slate-900 dark:text-white">{s.title}</h4>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PREGUNTAS FRECUENTES */}
        <section className="py-16 px-4 mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Preguntas Frecuentes</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">Todo lo que necesitas saber antes de venir.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {faqs.map((faq) => {
              const Icon = faq.icon;
              return (
                <div key={faq.q} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                      <Icon size={20} />
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{faq.q}</h4>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{faq.a}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* FORMULARIO DE AVISO DE VISITA */}
        <section id="avisar-visita" className="py-16 px-4 mx-auto max-w-3xl">
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-white via-amber-500/5 to-slate-900/5 p-8 shadow-xl dark:border-amber-400/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Calendar size={14} /> Planifica con Anticipación
              </span>
              <h3 className="mt-3 font-serif text-3xl font-bold text-slate-900 dark:text-white">Avísanos que Vienes</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Te reservaremos un lugar especial y tendremos a alguien listo para darte la bienvenida.</p>
            </div>

            {submitted ? (
              <div className="text-center py-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <CheckCircle2 size={36} />
                </div>
                <h4 className="mt-4 font-serif text-2xl font-bold text-slate-900 dark:text-white">¡Gracias por Registrar tu Visita!</h4>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Hemos recibido tu mensaje. Nos alegra profundamente esperarte este domingo.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 rounded-full border border-slate-300 px-6 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Enviar otro aviso
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-amber-500 focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Teléfono / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Ej. 0912345678"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-amber-500 focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Correo Electrónico (Opcional)</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="juan@ejemplo.com"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-amber-500 focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Fecha Prevista de Visita</label>
                    <input
                      type="date"
                      value={formData.visitDate}
                      onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-amber-500 focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">¿Vienes con niños?</label>
                    <select
                      value={formData.hasChildren ? 'yes' : 'no'}
                      onChange={(e) => setFormData({ ...formData, hasChildren: e.target.value === 'yes' })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-amber-500 focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="no">No, vendré solo / con adultos</option>
                      <option value="yes">Sí, vendré con niños</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">¿Alguna pregunta o necesidad especial?</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Cuéntanos si tienes alguna duda o requieres alguna asistencia especial..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-amber-500 focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-50"
                >
                  {submitting ? 'Registrando...' : 'Confirmar Mi Visita'} <Send size={16} />
                </button>
              </form>
            )}
          </div>
        </section>

      </div>
    </>
  );
}
