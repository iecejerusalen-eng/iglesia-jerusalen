import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeZoomIn } from '../../components/animations/AnimeWrappers';
import { ChurchRouteMap, JERUSALEN_CHURCH_COORDS } from '../../components/map/ChurchRouteMap';

const CHURCH_ADDRESS = 'Baquerizo Moreno entre Av. Colón y Tulcán, Milagro, Ecuador';
const CHURCH_PHONE = '+593 98 526 3122';
const CHURCH_PHONE_LINK = '+593985263122';
const CHURCH_EMAIL = 'iece_jerusalen@hotmail.com';
const CHURCH_DESTINATION = { ...JERUSALEN_CHURCH_COORDS, address: CHURCH_ADDRESS };

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Escribe tu nombre completo').max(80, 'El nombre es demasiado largo'),
  email: z.string().trim().min(1, 'El correo es requerido').email('Escribe un correo válido').max(160, 'El correo es demasiado largo'),
  subject: z.string().min(1, 'Selecciona un asunto'),
  message: z.string().trim().min(10, 'Cuéntanos un poco más en tu mensaje').max(2000, 'El mensaje no puede superar 2000 caracteres'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const inputClassName = 'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-church-gold-medium focus:bg-white focus:ring-4 focus:ring-church-gold/10 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-950';

const getHttpStatus = (value: unknown): number | null => {
  if (typeof value !== 'object' || value === null || !('context' in value)) return null;
  const context = Reflect.get(value, 'context');
  if (typeof context !== 'object' || context === null || !('status' in context)) return null;
  const status = Reflect.get(context, 'status');
  return typeof status === 'number' ? status : null;
};

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: 'Consulta General', message: '' },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setLoading(true);
    setSubmitError(null);

    try {
      const { data: limitData, error: limitError } = await supabase.functions.invoke('rate-limiter', {
        body: { endpoint: 'contacto' },
      });

      if (limitError) {
        console.error('No se pudo verificar el límite del formulario de contacto:', limitError);
        if (getHttpStatus(limitError) === 429) {
          setSubmitError('Has enviado varios mensajes recientemente. Intenta nuevamente en 15 minutos.');
        } else {
          setSubmitError('No pudimos verificar el envío en este momento. Intenta nuevamente más tarde.');
        }
        return;
      }

      if (!limitData?.success) {
        setSubmitError('Has enviado varios mensajes recientemente. Intenta nuevamente en 15 minutos.');
        return;
      }

      const { error: insertError } = await supabase.from('contact_messages').insert({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        status: 'unread',
      });

      if (insertError) throw insertError;
      setSuccess(true);
      reset();
    } catch (error: unknown) {
      console.error('Error enviando el formulario de contacto:', error);
      setSubmitError('No pudimos enviar tu mensaje. También puedes escribirnos por WhatsApp o correo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50/60 py-6 transition-colors dark:bg-slate-950 md:py-10">
      <div className="mx-auto max-w-7xl space-y-8 px-4 md:space-y-12 md:px-8">
        <section id="contact_hero" className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-white shadow-2xl shadow-slate-950/10 md:px-10 md:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(199,157,63,0.2),transparent_30%),radial-gradient(circle_at_5%_100%,rgba(59,130,246,0.14),transparent_34%)]" />
          <AnimeZoomIn className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-church-gold/25 bg-church-gold/10 px-3 py-1.5 text-xs font-semibold text-church-gold-bright">
                <MessageCircle size={14} aria-hidden="true" /> Estamos para servirte
              </span>
              <h1 className="mt-5 font-serif text-4xl font-bold tracking-tight md:text-5xl">Hablemos</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 md:text-lg">
                Escríbenos si necesitas oración, consejería o información sobre nuestras actividades. Queremos acompañarte.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href={`https://wa.me/${CHURCH_PHONE_LINK.replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/40">
                <MessageCircle size={18} aria-hidden="true" /> WhatsApp
              </a>
              <a href="#contact_form" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20">
                Enviar mensaje <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>
          </AnimeZoomIn>
        </section>

        <section id="contact_info" className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <AnimeFadeUp className="space-y-5 lg:sticky lg:top-28">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-church-gold-dark dark:text-church-gold-light">Contacto directo</span>
              <h2 className="mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-white">Elige el canal más cómodo</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Te responderemos tan pronto como sea posible durante nuestros horarios de atención.</p>
            </div>

            <AnimeStaggerGrid delay={50} staggerDelay={40} className="grid gap-3">
              <a href={`https://www.google.com/maps/search/?api=1&query=${JERUSALEN_CHURCH_COORDS.lat},${JERUSALEN_CHURCH_COORDS.lng}`} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-church-gold/50 hover:shadow-md dark:border-white/10 dark:bg-slate-900">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary dark:bg-blue-950/30 dark:text-blue-300"><MapPin size={19} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900 dark:text-white">Visítanos</strong><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{CHURCH_ADDRESS}</span></span>
                <ExternalLink size={15} className="mt-1 text-slate-300 transition group-hover:text-church-gold-medium" aria-hidden="true" />
              </a>
              <a href={`tel:${CHURCH_PHONE_LINK}`} className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-church-gold/50 hover:shadow-md dark:border-white/10 dark:bg-slate-900">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"><Phone size={19} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900 dark:text-white">Secretaría</strong><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{CHURCH_PHONE} · Hna. Marlene</span></span>
                <ArrowRight size={15} className="mt-1 text-slate-300 transition group-hover:translate-x-1 group-hover:text-church-gold-medium" aria-hidden="true" />
              </a>
              <a href={`mailto:${CHURCH_EMAIL}`} className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-church-gold/50 hover:shadow-md dark:border-white/10 dark:bg-slate-900">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-church-gold-dark dark:bg-amber-950/30 dark:text-church-gold-light"><Mail size={19} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900 dark:text-white">Correo electrónico</strong><span className="mt-1 block break-all text-xs text-slate-500 dark:text-slate-400">{CHURCH_EMAIL}</span></span>
                <ArrowRight size={15} className="mt-1 text-slate-300 transition group-hover:translate-x-1 group-hover:text-church-gold-medium" aria-hidden="true" />
              </a>
            </AnimeStaggerGrid>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
              <Clock3 size={18} className="text-church-gold-dark dark:text-church-gold-light" aria-hidden="true" />
              <div><strong className="block text-xs text-slate-900 dark:text-white">Atención por secretaría</strong><span className="text-xs text-slate-500 dark:text-slate-400">Comunícate para confirmar disponibilidad.</span></div>
            </div>

            <div className="flex flex-wrap gap-2" aria-label="Redes sociales">
              {[
                ['Facebook', 'https://www.facebook.com/jerusalen.cuadrangular'],
                ['Instagram', 'https://www.instagram.com/jerusalen_iece/'],
                ['YouTube', 'https://www.youtube.com/channel/UCgzlmsop3KSLpyzz92WQ2Mw'],
              ].map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-church-gold/50 hover:text-church-gold-dark dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-church-gold-light">{label}<ExternalLink size={11} aria-hidden="true" /></a>
              ))}
            </div>
          </AnimeFadeUp>

          <div id="contact_form" className="scroll-mt-28">
            <AnimeFadeUp className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-slate-900 md:p-8">
              {success ? (
              <div role="status" className="flex min-h-[480px] flex-col items-center justify-center px-4 text-center">
                <span className="flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"><CheckCircle2 size={32} aria-hidden="true" /></span>
                <h2 className="mt-5 font-serif text-2xl font-bold text-slate-900 dark:text-white">Mensaje enviado</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">Gracias por escribirnos. La administración recibió tu mensaje y responderá al correo proporcionado.</p>
                <button type="button" onClick={() => setSuccess(false)} className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-900">Enviar otro mensaje</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="border-b border-slate-100 pb-5 dark:border-white/5">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-church-gold-dark dark:text-church-gold-light">Buzón de contacto</span>
                  <h2 className="mt-2 font-serif text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">Cuéntanos cómo podemos ayudarte</h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Todos los campos son obligatorios.</p>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <label className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Nombre completo
                    <input type="text" autoComplete="name" placeholder="Ej. Ana de Castro" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} {...register('name')} className={inputClassName} />
                    {errors.name && <span id="name-error" className="block text-xs font-medium text-red-600 dark:text-red-400">{errors.name.message}</span>}
                  </label>
                  <label className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Correo electrónico
                    <input type="email" autoComplete="email" placeholder="Ej. ana@correo.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} {...register('email')} className={inputClassName} />
                    {errors.email && <span id="email-error" className="block text-xs font-medium text-red-600 dark:text-red-400">{errors.email.message}</span>}
                  </label>
                </div>

                <label className="mt-5 block space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Asunto
                  <select {...register('subject')} className={inputClassName}>
                    <option value="Consulta General">Consulta general</option>
                    <option value="Petición de Oración">Petición de oración</option>
                    <option value="Consejería Pastoral">Consejería pastoral</option>
                    <option value="Tienda / Pedidos">Tienda o pedidos</option>
                    <option value="Voluntariado / Servicio">Deseo servir</option>
                  </select>
                </label>

                <label className="mt-5 block space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Mensaje
                  <textarea rows={6} placeholder="Escribe aquí tu consulta o petición…" aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'message-error' : undefined} {...register('message')} className={`${inputClassName} resize-y`} />
                  {errors.message && <span id="message-error" className="block text-xs font-medium text-red-600 dark:text-red-400">{errors.message.message}</span>}
                </label>

                {submitError && <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300"><AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{submitError}</span></div>}

                <button type="submit" disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
                  {loading ? 'Enviando…' : <>Enviar mensaje <Send size={17} aria-hidden="true" /></>}
                </button>
              </form>
              )}
            </AnimeFadeUp>
          </div>
        </section>

        <div id="contact_map" className="scroll-mt-28">
          <AnimeFadeUp className="space-y-5 pb-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-church-gold-dark dark:text-church-gold-light">Ubicación</span>
              <h2 className="mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-white">Encuéntranos en Milagro</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Calcula tu ruta o abre las indicaciones directamente en tu aplicación de mapas.</p>
            </div>
            <ChurchRouteMap destination={CHURCH_DESTINATION} height="500px" title="Cómo llegar a Iglesia Jerusalén" />
          </AnimeFadeUp>
        </div>
      </div>
    </div>
  );
};

export default Contact;
