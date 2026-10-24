import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { BookOpen, CalendarDays, ChevronDown, Church, Compass, ExternalLink, GraduationCap, Headphones, Heart, MapPin, MessageCircle, Music, Radio, Send, ShoppingBag, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { answerFromPublicInfo, CHURCH_LINKS, contextualizeFollowUp, getKnowledgeNeeds, offlineAssistantAnswer } from './churchAssistantKnowledge';
import type { AssistantLink, PublicEventSummary, PublicMinistrySummary, PublicPodcastEpisodeSummary, PublicProgramSummary, PublicSpaceSummary } from './churchAssistantKnowledge';
import type { Schedule } from '../../types';

type ChatRole = 'user' | 'assistant';
type ChatMessage = { id: number; role: ChatRole; text: string; links?: AssistantLink[] };
type QuickAction = { label: string; icon: typeof CalendarDays; message: string };
type AiAvailability = 'checking' | 'available' | 'unavailable' | 'unknown';

const ACTION_LINK_CLASS = 'inline-flex min-h-9 items-center gap-1.5 rounded-full border border-church-gold/30 bg-white px-3 py-1 text-[11px] font-bold text-church-gold-dark transition hover:border-church-gold/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-slate-900 dark:text-church-gold-light';

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Horarios', icon: CalendarDays, message: '¿Cuáles son los horarios de los cultos?' },
  { label: 'Actividades hoy', icon: CalendarDays, message: '¿Qué actividades hay hoy?' },
  { label: 'Ubicación', icon: MapPin, message: '¿Dónde queda la iglesia?' },
  { label: 'Primera visita', icon: Sparkles, message: 'Voy a visitar la iglesia por primera vez.' },
  { label: 'Pedir oración', icon: Heart, message: 'Quiero compartir una petición de oración.' },
  { label: 'Eventos', icon: CalendarDays, message: '¿Cuáles son los próximos eventos?' },
  { label: 'Ministerios', icon: Church, message: '¿Qué ministerios tiene la iglesia?' },
  { label: 'Nuestra fe', icon: BookOpen, message: '¿Qué cree la Iglesia Cuadrangular?' },
  { label: 'Reservar espacio', icon: CalendarDays, message: '¿Qué espacios hay para reservar?' },
  { label: 'Tienda', icon: ShoppingBag, message: '¿Qué puedo encontrar en la tienda?' },
];
const INITIAL_QUICK_ACTION_COUNT = 4;

const HELLO = '¡Hola! Puedo orientarte con horarios, eventos, visitas, recursos, reservas y más. ¿Qué necesitas?';

function todayInEcuador() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export default function ChurchAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 0, role: 'assistant', text: HELLO }]);
  const [showAllQuickActions, setShowAllQuickActions] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [scheduleRows, setScheduleRows] = useState<Schedule[] | null>();
  const [eventRows, setEventRows] = useState<PublicEventSummary[] | null>();
  const [ministryRows, setMinistryRows] = useState<PublicMinistrySummary[] | null>();
  const [spaceRows, setSpaceRows] = useState<PublicSpaceSummary[] | null>();
  const [programRows, setProgramRows] = useState<PublicProgramSummary[] | null>();
  const [podcastEpisodeRows, setPodcastEpisodeRows] = useState<PublicPodcastEpisodeSummary[] | null>();
  const [aiAvailability, setAiAvailability] = useState<AiAvailability>('checking');
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const messageViewportRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scheduleRequest = useRef<Promise<Schedule[] | null> | null>(null);
  const eventRequest = useRef<Promise<PublicEventSummary[] | null> | null>(null);
  const ministryRequest = useRef<Promise<PublicMinistrySummary[] | null> | null>(null);
  const spaceRequest = useRef<Promise<PublicSpaceSummary[] | null> | null>(null);
  const programRequest = useRef<Promise<PublicProgramSummary[] | null> | null>(null);
  const podcastEpisodeRequest = useRef<Promise<PublicPodcastEpisodeSummary[] | null> | null>(null);
  const aiAvailabilityRequest = useRef<Promise<boolean | null> | null>(null);

  function loadSchedules() {
    scheduleRequest.current ??= (async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('id, day, title, time_range, description, order_index, created_at')
        .order('order_index', { ascending: true });
      return error ? null : (data ?? []) as Schedule[];
    })();
    return scheduleRequest.current;
  }

  function loadEvents() {
    eventRequest.current ??= (async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, start_date, end_date, start_time, end_time, location_name, emoji')
        .eq('is_public', true)
        .gte('end_date', todayInEcuador())
        .order('start_date', { ascending: true })
        .limit(30);
      return error ? null : (data ?? []) as PublicEventSummary[];
    })();
    return eventRequest.current;
  }

  function loadMinistries() {
    ministryRequest.current ??= (async () => {
      const { data, error } = await supabase
        .from('ministries')
        .select('id, name, slug, category, description, schedule')
        .order('name', { ascending: true })
        .limit(30);
      return error ? null : (data ?? []) as PublicMinistrySummary[];
    })();
    return ministryRequest.current;
  }

  function loadSpaces() {
    spaceRequest.current ??= (async () => {
      const { data, error } = await supabase
        .from('spaces')
        .select('id, name, description, capacity, features, is_active')
        .eq('is_active', true)
        .order('name');
      return error ? null : (data ?? []) as PublicSpaceSummary[];
    })();
    return spaceRequest.current;
  }

  function loadPrograms() {
    programRequest.current ??= (async () => {
      const { data, error } = await supabase
        .from('study_programs')
        .select('id, slug, title, summary, category, audience, duration_label, access_type')
        .eq('status', 'published')
        .order('is_featured', { ascending: false })
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(30);
      if (error) return null;
      return (data ?? []).map((row) => ({ ...row, source: 'study_programs' as const })) as PublicProgramSummary[];
    })();
    return programRequest.current;
  }

  function loadPodcastEpisodes() {
    podcastEpisodeRequest.current ??= (async () => {
      const { data, error } = await supabase
        .from('podcast_episodes')
        .select('id, title, description, show_notes, audio_duration_seconds, episode_number, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(10);
      return error ? null : (data ?? []) as PublicPodcastEpisodeSummary[];
    })();
    return podcastEpisodeRequest.current;
  }

  const checkAiAvailability = useCallback(async () => {
    aiAvailabilityRequest.current ??= (async () => {
      const { data, error } = await supabase.functions.invoke('church-assistant', { method: 'GET' });
      if (error || !data || typeof data !== 'object' || !('ai_configured' in data)) return null;
      const configured = Reflect.get(data, 'ai_configured');
      return typeof configured === 'boolean' ? configured : null;
    })();
    return await aiAvailabilityRequest.current;
  }, []);

  useEffect(() => {
    const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    if (messages.length === 1 && !isSending) {
      if (previousMessageCount.current > 1) messageViewportRef.current?.scrollTo({ top: 0, behavior });
    } else {
      endRef.current?.scrollIntoView({ behavior, block: 'end' });
    }
    previousMessageCount.current = messages.length;
  }, [messages, isSending]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    let active = true;
    void checkAiAvailability().then((configured) => {
      if (!active) return;
      setAiAvailability(configured === true ? 'available' : configured === false ? 'unavailable' : 'unknown');
      if (configured === null) aiAvailabilityRequest.current = null;
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      active = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, checkAiAvailability]);

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

    setIsSending(true);
    try {
      const knowledgeQuestion = contextualizeFollowUp(text, messages);
      const needs = getKnowledgeNeeds(knowledgeQuestion);
      const [loadedSchedules, loadedEvents, loadedMinistries, loadedSpaces, loadedPrograms, loadedPodcastEpisodes] = await Promise.all([
        needs.includes('schedules') && scheduleRows === undefined ? loadSchedules() : Promise.resolve(scheduleRows),
        needs.includes('events') && eventRows === undefined ? loadEvents() : Promise.resolve(eventRows),
        needs.includes('ministries') && ministryRows === undefined ? loadMinistries() : Promise.resolve(ministryRows),
        needs.includes('spaces') && spaceRows === undefined ? loadSpaces() : Promise.resolve(spaceRows),
        needs.includes('programs') && programRows === undefined ? loadPrograms() : Promise.resolve(programRows),
        needs.includes('podcastEpisodes') && podcastEpisodeRows === undefined ? loadPodcastEpisodes() : Promise.resolve(podcastEpisodeRows),
      ]);
      if (needs.includes('schedules') && scheduleRows === undefined) setScheduleRows(loadedSchedules ?? null);
      if (needs.includes('events') && eventRows === undefined) setEventRows(loadedEvents ?? null);
      if (needs.includes('ministries') && ministryRows === undefined) setMinistryRows(loadedMinistries ?? null);
      if (needs.includes('spaces') && spaceRows === undefined) setSpaceRows(loadedSpaces ?? null);
      if (needs.includes('programs') && programRows === undefined) setProgramRows(loadedPrograms ?? null);
      if (needs.includes('podcastEpisodes') && podcastEpisodeRows === undefined) setPodcastEpisodeRows(loadedPodcastEpisodes ?? null);

      const knownAnswer = answerFromPublicInfo(knowledgeQuestion, {
        schedules: loadedSchedules,
        events: loadedEvents,
        ministries: loadedMinistries,
        spaces: loadedSpaces,
        programs: loadedPrograms,
        podcastEpisodes: loadedPodcastEpisodes,
      });
      if (knownAnswer) {
        setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', text: knownAnswer.text, links: knownAnswer.links }]);
        return;
      }

      const configured = aiAvailability === 'available'
        ? true
        : aiAvailability === 'unavailable'
          ? false
          : await checkAiAvailability();
      setAiAvailability(configured === true ? 'available' : configured === false ? 'unavailable' : 'unknown');
      if (!configured) {
        const fallback = offlineAssistantAnswer(text);
        setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', text: fallback.text, links: fallback.links }]);
        return;
      }

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
        if (responseData?.code === 'ai_not_configured') setAiAvailability('unavailable');
        const fallback = offlineAssistantAnswer(text);
        const message = responseData?.code === 'ai_not_configured'
          ? 'Las respuestas con IA no están activas en este momento. Te dejo opciones de información y contacto.'
          : (typeof responseData?.error === 'string' ? responseData.error : fallback.text);
        setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', text: message, links: fallback.links }]);
        return;
      }
      setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', text: answer, links: [CHURCH_LINKS.contact] }]);
    } catch {
      const fallback = offlineAssistantAnswer(text);
      setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', text: 'No pude consultar esa respuesta ahora. Puedes abrir estas páginas oficiales o escribirnos.', links: fallback.links }]);
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
              <h2 className="truncate text-[13px] font-black text-slate-900 dark:text-white sm:text-sm"><span className="sm:hidden">Asistente</span><span className="hidden sm:inline">Asistente Iglesia Jerusalén</span></h2>
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400" aria-live="polite">
                <span className={`size-1.5 rounded-full ${aiAvailability === 'available' ? 'bg-emerald-500' : aiAvailability === 'checking' ? 'animate-pulse bg-amber-500' : 'bg-blue-500'}`} aria-hidden="true" />
                {aiAvailability === 'available' ? 'IA configurada' : aiAvailability === 'checking' ? 'Verificando IA…' : 'Información guiada'}
              </p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Cerrar asistente" className="flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:hover:bg-white/10"><ChevronDown size={20} aria-hidden="true" /></button>
            <button type="button" onClick={() => { setMessages([{ id: 0, role: 'assistant', text: HELLO }]); setShowAllQuickActions(false); }} aria-label="Limpiar conversación" className="flex size-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:hover:bg-white/10 dark:hover:text-white"><X size={17} aria-hidden="true" /></button>
          </header>

          <div ref={messageViewportRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4" aria-live="polite" aria-relevant="additions text">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-5 ${message.role === 'user' ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-slate-100 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'}`}>
                  <p className="whitespace-pre-line">{message.text}</p>
                  {message.links && <div className="mt-2 flex flex-wrap gap-2">{message.links.map((link) => link.href.startsWith('http') ? <a key={`${message.id}-${link.href}`} href={link.href} target="_blank" rel="noreferrer noopener" className={ACTION_LINK_CLASS}>{link.label}<ExternalLink size={12} aria-hidden="true" /></a> : link.href.startsWith('tel:') || link.href.startsWith('mailto:') ? <a key={`${message.id}-${link.href}`} href={link.href} className={ACTION_LINK_CLASS}>{link.label}</a> : <Link key={`${message.id}-${link.href}`} to={link.href} className={ACTION_LINK_CLASS}>{link.label}</Link>)}</div>}
                </div>
              </div>
            ))}
            {messages.length === 1 && <>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[.035]">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[.15em] text-slate-400">Preguntas frecuentes</p>
                  <button type="button" aria-expanded={showAllQuickActions} aria-controls="church-assistant-quick-actions" onClick={() => setShowAllQuickActions((expanded) => !expanded)} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-[10px] font-bold text-primary transition hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-church-gold-light dark:hover:bg-white/5">
                    {showAllQuickActions ? 'Mostrar menos' : `Ver ${QUICK_ACTIONS.length - INITIAL_QUICK_ACTION_COUNT} más`}
                    <ChevronDown size={13} className={showAllQuickActions ? 'rotate-180 transition-transform' : 'transition-transform'} aria-hidden="true" />
                  </button>
                </div>
                <div id="church-assistant-quick-actions" className="grid grid-cols-2 gap-2">{(showAllQuickActions ? QUICK_ACTIONS : QUICK_ACTIONS.slice(0, INITIAL_QUICK_ACTION_COUNT)).map(({ label, icon: Icon, message }) => <button key={label} type="button" onClick={() => void sendMessage(message)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-left text-[11px] font-semibold text-slate-600 transition hover:border-church-gold/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"><Icon size={14} aria-hidden="true" />{label}</button>)}</div>
              </div>
              <nav className="grid grid-cols-2 gap-2 pb-1" aria-label="Accesos rápidos">
                <Link to="/en-vivo" className={ACTION_LINK_CLASS}><Radio size={13} aria-hidden="true" />En vivo</Link>
                <Link to="/recursos/biblia" className={ACTION_LINK_CLASS}><BookOpen size={13} aria-hidden="true" />Biblia</Link>
                <Link to="/visita" className={ACTION_LINK_CLASS}><Compass size={13} aria-hidden="true" />Planifica visita</Link>
                <Link to={CHURCH_LINKS.podcast.href} className={ACTION_LINK_CLASS}><Headphones size={13} aria-hidden="true" />Podcast</Link>
                <Link to={CHURCH_LINKS.songs.href} className={ACTION_LINK_CLASS}><Music size={13} aria-hidden="true" />Alabanzas</Link>
                <Link to={CHURCH_LINKS.programs.href} className={ACTION_LINK_CLASS}><GraduationCap size={13} aria-hidden="true" />Programas</Link>
                <Link to={CHURCH_LINKS.bookings.href} className={ACTION_LINK_CLASS}><CalendarDays size={13} aria-hidden="true" />Reservas</Link>
                <Link to={CHURCH_LINKS.store.href} className={ACTION_LINK_CLASS}><ShoppingBag size={13} aria-hidden="true" />Tienda</Link>
              </nav>
            </>}
            {isSending && <p className="text-xs text-slate-500 dark:text-slate-400" role="status">Estoy consultando información pública…</p>}
            <div ref={endRef} />
          </div>

          <p className="border-t border-slate-100 px-4 pt-2 text-[10px] leading-4 text-slate-500 dark:border-white/10 dark:text-slate-400">
            {aiAvailability === 'available'
              ? 'Las preguntas abiertas se procesan con Google Gemini; Supabase usa tu IP para limitar el uso. El sitio no guarda este chat.'
              : 'Respondo con información pública del sitio. El sitio no guarda este chat. No compartas datos sensibles ni peticiones privadas.'}
            {' '}Para acompañamiento pastoral, escríbenos directamente.
          </p>
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
