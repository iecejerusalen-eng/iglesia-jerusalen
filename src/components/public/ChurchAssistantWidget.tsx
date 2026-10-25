import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { BookOpen, CalendarDays, ChevronDown, Church, Compass, ExternalLink, GraduationCap, Headphones, Heart, MapPin, MessageCircle, Music, Radio, Send, Sparkles, Video, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { fetchProgramCatalog } from '../../features/study-programs/service';
import { searchPublicSongs } from '../../features/songs/services/publicSongSearch';
import { answerFromPublicInfo, CHURCH_LINKS, contextualizeFollowUp, getKnowledgeNeeds, offlineAssistantAnswer } from './churchAssistantKnowledge';
import type { AssistantLink, AssistantSuggestion, PublicEventSummary, PublicMinistrySummary, PublicPodcastSummary, PublicProgramSummary, PublicSermonSummary } from './churchAssistantKnowledge';
import type { Schedule } from '../../types';

type ChatRole = 'user' | 'assistant';
type ChatMessage = { id: number; role: ChatRole; text: string; links?: AssistantLink[]; suggestions?: AssistantSuggestion[] };
type QuickAction = { label: string; icon: typeof CalendarDays; message: string };
type AiAvailability = 'checking' | 'available' | 'unavailable' | 'unknown';

const ACTION_LINK_CLASS = 'inline-flex min-h-9 items-center gap-1.5 rounded-full border border-church-gold/30 bg-white px-3 py-1 text-[11px] font-bold text-church-gold-dark transition hover:border-church-gold/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-slate-900 dark:text-church-gold-light';
const INITIAL_QUICK_ACTION_COUNT = 4;

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Horarios', icon: CalendarDays, message: '¿Cuáles son los horarios de los cultos?' },
  { label: 'Ubicación', icon: MapPin, message: '¿Dónde queda la iglesia?' },
  { label: 'Primera visita', icon: Sparkles, message: 'Voy a visitar la iglesia por primera vez.' },
  { label: 'Nuestra fe', icon: BookOpen, message: '¿Qué es la Iglesia Cuadrangular?' },
  { label: 'Actividades hoy', icon: CalendarDays, message: '¿Qué actividades hay hoy?' },
  { label: 'Pastores', icon: Church, message: '¿Quién es el pastor?' },
  { label: 'Visión y misión', icon: Sparkles, message: '¿Cuál es la visión y misión de la iglesia?' },
  { label: 'Símbolos', icon: Church, message: '¿Cuáles son los símbolos de la Iglesia Cuadrangular?' },
  { label: 'Himno', icon: Music, message: '¿Qué expresa el Himno Cuadrangular?' },
  { label: 'Alabanzas', icon: Music, message: '¿Qué canciones están publicadas?' },
  { label: 'Pedir oración', icon: Heart, message: 'Quiero compartir una petición de oración.' },
  { label: 'Eventos', icon: CalendarDays, message: '¿Cuáles son los próximos eventos?' },
  { label: 'Prédicas', icon: Video, message: '¿Cuáles son las prédicas recientes?' },
  { label: 'Podcast', icon: Headphones, message: '¿Cuáles son los episodios recientes del podcast?' },
  { label: 'Programas', icon: GraduationCap, message: '¿Qué programas y cursos están publicados?' },
  { label: 'Ministerios', icon: Church, message: '¿Qué ministerios tiene la iglesia?' },
  { label: 'Comunidad', icon: Church, message: '¿Cómo puedo participar en la comunidad de la iglesia?' },
  { label: 'Diezmos y donaciones', icon: Heart, message: '¿Cómo puedo hacer una donación?' },
];

const HELLO = '¡Hola! Soy el asistente de la Iglesia Jerusalén. Puedo ayudarte con horarios, ubicación, visitas, eventos, ministerios y canales de contacto.';

function todayInEcuador() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

type PublicRequestCache<T> = { current: Promise<T | null> | null };

function loadCachedPublicData<T>(cache: PublicRequestCache<T>, load: () => Promise<T | null>) {
  if (!cache.current) {
    const request = Promise.resolve()
      .then(load)
      .catch((error: unknown) => {
        console.error('No fue posible consultar información pública para el asistente.', error);
        return null;
      });
    cache.current = request;
    void request.then((result) => {
      if (result === null && cache.current === request) cache.current = null;
    });
  }
  return cache.current ?? Promise.resolve(null);
}

export default function ChurchAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 0, role: 'assistant', text: HELLO }]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showAllQuickActions, setShowAllQuickActions] = useState(false);
  const [scheduleRows, setScheduleRows] = useState<Schedule[] | null>();
  const [eventRows, setEventRows] = useState<PublicEventSummary[] | null>();
  const [sermonRows, setSermonRows] = useState<PublicSermonSummary[] | null>();
  const [podcastRows, setPodcastRows] = useState<PublicPodcastSummary[] | null>();
  const [programRows, setProgramRows] = useState<PublicProgramSummary[] | null>();
  const [ministryRows, setMinistryRows] = useState<PublicMinistrySummary[] | null>();
  const [aiAvailability, setAiAvailability] = useState<AiAvailability>('checking');
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const messageViewportRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const scheduleRequest = useRef<Promise<Schedule[] | null> | null>(null);
  const eventRequest = useRef<Promise<PublicEventSummary[] | null> | null>(null);
  const sermonRequest = useRef<Promise<PublicSermonSummary[] | null> | null>(null);
  const podcastRequest = useRef<Promise<PublicPodcastSummary[] | null> | null>(null);
  const programRequest = useRef<Promise<PublicProgramSummary[] | null> | null>(null);
  const ministryRequest = useRef<Promise<PublicMinistrySummary[] | null> | null>(null);
  const aiAvailabilityRequest = useRef<Promise<boolean | null> | null>(null);

  function loadSchedules() {
    return loadCachedPublicData(scheduleRequest, async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('id, day, title, time_range, description, order_index, created_at')
        .order('order_index', { ascending: true });
      if (error) {
        console.error('No fue posible consultar los horarios públicos para el asistente.', error);
        return null;
      }
      return (data ?? []) as Schedule[];
    });
  }

  function loadEvents() {
    return loadCachedPublicData(eventRequest, async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, start_date, end_date, start_time, end_time, emoji, spaces(name, address, map_url)')
        .eq('is_public', true)
        .or(`end_date.gte.${todayInEcuador()},start_date.gte.${todayInEcuador()}`)
        .order('start_date', { ascending: true })
        .limit(30);
      if (error) {
        console.error('No fue posible consultar los eventos públicos para el asistente.', error);
        return null;
      }
      return (data ?? []) as PublicEventSummary[];
    });
  }

  function loadSermons() {
    return loadCachedPublicData(sermonRequest, async () => {
      const { data, error } = await supabase
        .from('sermons')
        .select('id, title, pastor_name, date, description')
        .order('date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) {
        console.error('No fue posible consultar las prédicas públicas para el asistente.', error);
        return null;
      }
      return (data ?? []) as PublicSermonSummary[];
    });
  }

  function loadPodcasts() {
    return loadCachedPublicData(podcastRequest, async () => {
      const { data, error } = await supabase
        .from('podcast_episodes')
        .select('id, title, description, show_notes, episode_number, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(12);
      if (error) {
        console.error('No fue posible consultar los episodios públicos para el asistente.', error);
        return null;
      }
      return (data ?? []) as PublicPodcastSummary[];
    });
  }

  function loadPrograms() {
    return loadCachedPublicData(programRequest, async () => {
      try {
        const result = await fetchProgramCatalog();
        return result.programs.map((program) => ({
          id: program.id,
          slug: program.slug,
          title: program.title,
          summary: program.summary || program.description,
          category: program.category,
          audience: program.audience,
          tags: program.tags,
          modality: program.modality,
          source: program.source ?? 'study_programs',
        }));
      } catch (error) {
        console.error('No fue posible consultar programas públicos para el asistente.', error);
        return null;
      }
    });
  }

  function loadMinistries() {
    return loadCachedPublicData(ministryRequest, async () => {
      const { data, error } = await supabase
        .from('ministries')
        .select('id, name, slug, category, description, schedule')
        .order('name', { ascending: true })
        .limit(30);
      if (error) {
        console.error('No fue posible consultar los ministerios públicos para el asistente.', error);
        return null;
      }
      return (data ?? []) as PublicMinistrySummary[];
    });
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
    if (!isOpen) {
      if (wasOpen.current) {
        wasOpen.current = false;
        openButtonRef.current?.focus();
      }
      return;
    }
    wasOpen.current = true;
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
    const conversation = messages.slice(-8).map(({ role, text: content }) => ({ role, text: content }));
    const knowledgeQuestion = contextualizeFollowUp(text, conversation);
    setDraft('');
    setMessages((current) => [...current, userMessage]);

    setIsSending(true);
    try {
      const needs = getKnowledgeNeeds(knowledgeQuestion);
      const [loadedSchedules, loadedEvents, loadedSermons, loadedPodcasts, loadedPrograms, loadedSongs, loadedMinistries] = await Promise.all([
        needs.includes('schedules') && scheduleRows === undefined ? loadSchedules() : Promise.resolve(scheduleRows),
        needs.includes('events') && eventRows === undefined ? loadEvents() : Promise.resolve(eventRows),
        needs.includes('sermons') && sermonRows === undefined ? loadSermons() : Promise.resolve(sermonRows),
        needs.includes('podcasts') && podcastRows === undefined ? loadPodcasts() : Promise.resolve(podcastRows),
        needs.includes('programs') && programRows === undefined ? loadPrograms() : Promise.resolve(programRows),
        needs.includes('songs') ? searchPublicSongs(knowledgeQuestion).catch((error) => { console.error('No fue posible consultar el cancionero público.', error); return null; }) : Promise.resolve(undefined),
        needs.includes('ministries') && ministryRows === undefined ? loadMinistries() : Promise.resolve(ministryRows),
      ]);
      if (needs.includes('schedules') && scheduleRows === undefined && loadedSchedules !== null) setScheduleRows(loadedSchedules);
      if (needs.includes('events') && eventRows === undefined && loadedEvents !== null) setEventRows(loadedEvents);
      if (needs.includes('sermons') && sermonRows === undefined && loadedSermons !== null) setSermonRows(loadedSermons);
      if (needs.includes('podcasts') && podcastRows === undefined && loadedPodcasts !== null) setPodcastRows(loadedPodcasts);
      if (needs.includes('programs') && programRows === undefined && loadedPrograms !== null) setProgramRows(loadedPrograms);
      if (needs.includes('ministries') && ministryRows === undefined && loadedMinistries !== null) setMinistryRows(loadedMinistries);

      const knownAnswer = answerFromPublicInfo(knowledgeQuestion, {
        schedules: loadedSchedules,
        events: loadedEvents,
        sermons: loadedSermons,
        podcasts: loadedPodcasts,
        programs: loadedPrograms,
        songs: loadedSongs,
        ministries: loadedMinistries,
      }, conversation);
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
        setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', text: fallback.text, links: fallback.links, suggestions: fallback.suggestions }]);
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
        setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', text: message, links: fallback.links, suggestions: fallback.suggestions }]);
        return;
      }
      setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', text: answer, links: [CHURCH_LINKS.contact] }]);
    } catch {
      const fallback = offlineAssistantAnswer(text);
      setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', text: 'No pude consultar esa respuesta ahora. Puedes abrir estas páginas oficiales o escribirnos.', links: fallback.links, suggestions: fallback.suggestions }]);
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
                  {message.suggestions?.length ? <div role="group" aria-label="Preguntas sugeridas" className="mt-2 flex flex-wrap gap-2">{message.suggestions.map((suggestion) => <button key={`${message.id}-${suggestion.message}`} type="button" disabled={isSending} onClick={() => void sendMessage(suggestion.message)} className={`${ACTION_LINK_CLASS} cursor-pointer disabled:cursor-wait disabled:opacity-50`}>{suggestion.label}</button>)}</div> : null}
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
                <div id="church-assistant-quick-actions" className="grid grid-cols-2 gap-2">{(showAllQuickActions ? QUICK_ACTIONS : QUICK_ACTIONS.slice(0, INITIAL_QUICK_ACTION_COUNT)).map(({ label, icon: Icon, message }) => <button key={label} type="button" onClick={() => void sendMessage(message)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-left text-[11px] font-semibold text-slate-600 transition hover:border-church-gold/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"><Icon size={14} aria-hidden="true" />{label}</button>)}</div>
              </div>
              <nav className="grid grid-cols-2 gap-2 pb-1" aria-label="Accesos rápidos">
                <Link to="/en-vivo" className={ACTION_LINK_CLASS}><Radio size={13} aria-hidden="true" />En vivo</Link>
                <Link to="/recursos/biblia" className={ACTION_LINK_CLASS}><BookOpen size={13} aria-hidden="true" />Biblia</Link>
                <Link to="/visita" className={ACTION_LINK_CLASS}><Compass size={13} aria-hidden="true" />Planifica visita</Link>
                <Link to={CHURCH_LINKS.podcast.href} className={ACTION_LINK_CLASS}><Headphones size={13} aria-hidden="true" />Podcast</Link>
                <Link to={CHURCH_LINKS.songs.href} className={ACTION_LINK_CLASS}><Music size={13} aria-hidden="true" />Alabanzas</Link>
                <Link to={CHURCH_LINKS.programs.href} className={ACTION_LINK_CLASS}><GraduationCap size={13} aria-hidden="true" />Programas</Link>
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
            {' '}<Link to="/privacidad" className="font-semibold underline decoration-slate-300 underline-offset-2 transition hover:text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:decoration-white/30">Política de privacidad</Link>
          </p>
          <form onSubmit={submitMessage} className="flex items-center gap-2 p-3 pt-2">
            <label className="sr-only" htmlFor="church-assistant-message">Escribe tu pregunta</label>
            <input id="church-assistant-message" ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={600} placeholder="Escribe tu pregunta…" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-white/10 dark:bg-slate-900 dark:text-white" />
            <button type="submit" disabled={!draft.trim() || isSending} aria-label="Enviar pregunta" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45"><Send size={17} aria-hidden="true" /></button>
          </form>
        </section>
      )}

      <button ref={openButtonRef} type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-controls="church-assistant-panel" aria-label={isOpen ? 'Cerrar chat de la iglesia' : 'Abrir chat de la iglesia'} className="ml-auto flex min-h-14 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-white shadow-xl shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary dark:bg-church-gold-light dark:text-slate-950 dark:hover:bg-amber-200">
        {isOpen ? <X size={19} aria-hidden="true" /> : <MessageCircle size={20} aria-hidden="true" />}
        <span>{isOpen ? 'Cerrar' : '¿Te ayudamos?'}</span>
      </button>
    </div>
  );
}
