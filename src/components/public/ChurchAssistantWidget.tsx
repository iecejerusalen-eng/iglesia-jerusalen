import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarDays, ChevronDown, ExternalLink, Heart, MapPin, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { CHURCH_LOCATION } from '../map/churchLocation';
import type { Schedule } from '../../types';

type ChatRole = 'user' | 'assistant';
type ChatMessage = { id: number; role: ChatRole; text: string; links?: Array<{ label: string; href: string }> };
type QuickAction = { label: string; icon: typeof CalendarDays; message: string };

const ACTION_LINK_CLASS = 'inline-flex min-h-9 items-center gap-1.5 rounded-full border border-church-gold/30 bg-white px-3 py-1 text-[11px] font-bold text-church-gold-dark transition hover:border-church-gold/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-slate-900 dark:text-church-gold-light';

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Horarios', icon: CalendarDays, message: '¿Cuáles son los horarios de los cultos?' },
  { label: 'Ubicación', icon: MapPin, message: '¿Dónde queda la iglesia?' },
  { label: 'Quiero visitar', icon: Sparkles, message: 'Voy a visitar la iglesia por primera vez.' },
  { label: 'Pedir oración', icon: Heart, message: 'Quiero compartir una petición de oración.' },
];

const HELLO = '¡Hola! Soy el asistente de la Iglesia Jerusalén. Puedo ayudarte con horarios, visitas, ubicación y canales de contacto.';
const CONTACT_LINK = { label: 'Contactar a la iglesia', href: '/contacto' };
const VISIT_LINK = { label: 'Planificar mi visita', href: '/visita' };
const PRAYER_LINK = { label: 'Peticiones de oración', href: '/peticiones' };

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function answerFromPublicInfo(message: string, schedules: Schedule[] | undefined) {
  const query = normalize(message);

  if (/\b(horario|horarios|culto|cultos|reunion|reuniones|servicio|servicios)\b/.test(query)) {
    if (!schedules?.length) {
      return { text: 'No puedo consultar los horarios ahora. Puedes verlos en Inicio o en la página para planificar tu visita.', links: [VISIT_LINK] };
    }
    const lines = schedules.map((schedule) => `${schedule.day}: ${schedule.title}, ${schedule.time_range}.`);
    return { text: `Estos son los horarios publicados:\n${lines.join('\n')}`, links: [VISIT_LINK] };
  }

  if (/\b(donde|ubicacion|direccion|llegar|mapa)\b/.test(query)) {
    return {
      text: `Estamos en ${CHURCH_LOCATION.address}. Puedes abrir la ubicación en el mapa.`,
      links: [{ label: 'Abrir mapa', href: CHURCH_LOCATION.googleMapsUrl }],
    };
  }

  if (/\b(primera vez|visitar|visita|llevar|vestir|ropa|registrarme|registrar|ninos|niños)\b/.test(query)) {
    if (/\b(vestir|ropa)\b/.test(query)) {
      return { text: 'No tenemos un código de vestimenta. Puedes venir como eres; al llegar, nuestro equipo te ayudará a ubicarte.', links: [VISIT_LINK] };
    }
    if (/\b(registrarme|registrar)\b/.test(query)) {
      return { text: 'El registro para una visita es opcional y nos ayuda a prepararnos para recibirte.', links: [VISIT_LINK] };
    }
    if (/\b(ninos|niños)\b/.test(query)) {
      return { text: '¡Qué bueno que nos visites! En la página de visita puedes contarnos si vienes con niños para que nuestro equipo se prepare.', links: [VISIT_LINK] };
    }
    return { text: '¡Nos encantará recibirte! Ven como eres. Puedes revisar los horarios, contarnos si necesitas ayuda y encontrar indicaciones para llegar.', links: [VISIT_LINK] };
  }

  if (/\b(oracion|orar|peticion|peticiones|consejeria|ayuda espiritual)\b/.test(query)) {
    return { text: 'Si deseas compartir una petición, puedes hacerlo desde el canal oficial. Para consejería pastoral, comunícate con secretaría.', links: [PRAYER_LINK, CONTACT_LINK] };
  }

  if (/\b(contacto|telefono|celular|llamar|correo|email|secretaria)\b/.test(query)) {
    return { text: 'Puedes llamar a secretaría al +593 98 526 3122 o escribir a iece_jerusalen@hotmail.com. También puedes usar el formulario de contacto.', links: [CONTACT_LINK] };
  }

  if (/\b(evento|eventos|agenda|actividad|actividades)\b/.test(query)) {
    return { text: 'Puedes consultar la agenda y los próximos eventos publicados en el sitio.', links: [{ label: 'Ver eventos', href: '/eventos' }] };
  }

  if (/\b(ministerio|ministros|servir|voluntariado)\b/.test(query)) {
    return { text: 'Puedes conocer los ministerios disponibles y luego contactar a la iglesia para que te orienten.', links: [{ label: 'Ver ministerios', href: '/ministerios' }, CONTACT_LINK] };
  }

  return null;
}

export default function ChurchAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 0, role: 'assistant', text: HELLO }]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [scheduleRows, setScheduleRows] = useState<Schedule[]>();
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scheduleRequest = useRef<Promise<Schedule[]> | null>(null);

  useEffect(() => {
    const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    endRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, [messages, isSending]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  async function sendMessage(rawMessage: string) {
    const text = rawMessage.trim().slice(0, 600);
    if (!text || isSending) return;

    const userMessage: ChatMessage = { id: nextId.current++, role: 'user', text };
    const history = messages
      .filter((item) => item.id !== 0)
      .slice(-6)
      .map((item) => ({ role: item.role === 'assistant' ? 'model' : 'user', content: item.text }));
    setDraft('');
    setMessages((current) => [...current, userMessage]);

    let currentSchedules = scheduleRows;
    const normalizedText = normalize(text);
    const asksAboutSchedule = /\b(horario|horarios|culto|cultos|reunion|reuniones|servicio|servicios)\b/.test(normalizedText);
    if (asksAboutSchedule && !currentSchedules) {
      setIsSending(true);
      try {
        scheduleRequest.current ??= Promise.resolve(supabase
          .from('schedules')
          .select('id, day, title, time_range, description, order_index, created_at')
          .order('order_index', { ascending: true })
          .then(({ data, error }) => {
            if (error) throw error;
            return (data ?? []) as Schedule[];
          }));
        currentSchedules = await scheduleRequest.current;
        setScheduleRows(currentSchedules);
      } catch {
        currentSchedules = [];
        setScheduleRows([]);
      }
    }

    const knownAnswer = answerFromPublicInfo(text, currentSchedules);
    if (knownAnswer) {
      setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', text: knownAnswer.text, links: knownAnswer.links }]);
      setIsSending(false);
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('church-assistant', { body: { message: text, history } });
      let responseData = data as { answer?: string; code?: string; error?: string } | null;
      if (error && typeof error === 'object' && 'context' in error && error.context instanceof Response) {
        try {
          responseData = await error.context.clone().json() as { answer?: string; code?: string; error?: string };
        } catch {
          responseData = null;
        }
      }
      const answer = responseData?.answer;
      if (error || typeof answer !== 'string') {
        const message = responseData?.code === 'ai_not_configured'
          ? 'Puedo responder consultas comunes, pero aún no tengo habilitadas las respuestas con IA para esta pregunta. La iglesia puede orientarte por sus canales oficiales.'
          : (typeof responseData?.error === 'string' ? responseData.error : 'No pude responderte ahora. La iglesia puede orientarte por sus canales oficiales.');
        setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', text: message, links: [CONTACT_LINK] }]);
        return;
      }
      setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', text: answer, links: [CONTACT_LINK] }]);
    } catch {
      setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', text: 'No pude conectarme ahora. Puedes escribirnos por los canales oficiales.', links: [CONTACT_LINK] }]);
    } finally {
      setIsSending(false);
    }
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 z-[80] sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          id="church-assistant-panel"
          role="dialog"
          aria-label="Asistente de la Iglesia Jerusalén"
          className="mb-3 flex h-[min(36rem,calc(100dvh-8.25rem))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-white/10 dark:bg-slate-950"
        >
          <header className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/90 px-4 py-3 dark:border-white/10 dark:bg-slate-900/90">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white"><MessageCircle size={19} aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-black text-slate-900 dark:text-white">Asistente Iglesia Jerusalén</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Información para tu visita</p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Cerrar asistente" className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:hover:bg-white/10"><ChevronDown size={20} aria-hidden="true" /></button>
            <button type="button" onClick={() => setMessages([{ id: 0, role: 'assistant', text: HELLO }])} aria-label="Limpiar conversación" className="flex size-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:hover:bg-white/10 dark:hover:text-white"><X size={17} aria-hidden="true" /></button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4" aria-live="polite" aria-relevant="additions text">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-5 ${message.role === 'user' ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-slate-100 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'}`}>
                  <p className="whitespace-pre-line">{message.text}</p>
                  {message.links && <div className="mt-2 flex flex-wrap gap-2">{message.links.map((link) => link.href.startsWith('http') ? <a key={`${message.id}-${link.href}`} href={link.href} target="_blank" rel="noreferrer noopener" className={ACTION_LINK_CLASS}>{link.label}<ExternalLink size={12} aria-hidden="true" /></a> : <Link key={`${message.id}-${link.href}`} to={link.href} className={ACTION_LINK_CLASS}>{link.label}</Link>)}</div>}
                </div>
              </div>
            ))}
            {messages.length === 1 && <div className="flex flex-wrap gap-2">{QUICK_ACTIONS.map(({ label, icon: Icon, message }) => <button key={label} type="button" onClick={() => void sendMessage(message)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-church-gold/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"><Icon size={13} aria-hidden="true" />{label}</button>)}</div>}
            {isSending && <p className="text-xs text-slate-500 dark:text-slate-400" role="status">Estoy preparando una respuesta…</p>}
            <div ref={endRef} />
          </div>

          <p className="border-t border-slate-100 px-4 pt-2 text-[10px] leading-4 text-slate-500 dark:border-white/10 dark:text-slate-400">Las preguntas abiertas se envían a Google Gemini. Supabase registra la IP para limitar el uso; el sitio no guarda el historial. No compartas datos personales o sensibles. Para temas pastorales, escríbenos directamente.</p>
          <form onSubmit={submitMessage} className="flex items-center gap-2 p-3 pt-2">
            <label className="sr-only" htmlFor="church-assistant-message">Escribe tu pregunta</label>
            <input id="church-assistant-message" ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={600} placeholder="Escribe tu pregunta…" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-white/10 dark:bg-slate-900 dark:text-white" />
            <button type="submit" disabled={!draft.trim() || isSending} aria-label="Enviar pregunta" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45"><Send size={17} aria-hidden="true" /></button>
          </form>
        </section>
      )}

      <button type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-controls="church-assistant-panel" aria-label={isOpen ? 'Cerrar chat de la iglesia' : 'Abrir chat de la iglesia'} className="ml-auto flex min-h-14 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-white shadow-xl shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary dark:bg-church-gold-light dark:text-slate-950 dark:hover:bg-amber-200">
        {isOpen ? <X size={19} aria-hidden="true" /> : <MessageCircle size={20} aria-hidden="true" />}
        <span>{isOpen ? 'Cerrar' : '¿Te ayudamos?'}</span>
      </button>
    </div>
  );
}
