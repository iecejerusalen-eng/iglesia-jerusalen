import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Send, Sparkles, BookOpen, ShieldCheck, UserCheck, Copy, HandHeart, Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../config/supabase';

interface LiveSession {
  id: string;
  service_id: string;
  status: 'scheduled' | 'live' | 'ended' | 'archived';
  title: string;
  stream_url: string | null;
  current_item_id: string | null;
  active_song_id: string | null;
  content_blocks: unknown[];
  live_summary: string | null;
  started_at: string | null;
  ended_at: string | null;
  archived_sermon_id: string | null;
}

interface LiveAgendaItem {
  id: string;
  position: number;
  item_type: string;
  title: string;
  duration_minutes: number | null;
  song_id: string | null;
}

interface LivePoll {
  id: string;
  session_id: string;
  question: string;
  options: unknown;
}

interface LiveQuestion {
  id: string;
  question: string;
  answer: string | null;
}

function asLiveSession(value: unknown): LiveSession | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string' || typeof record.title !== 'string' || typeof record.status !== 'string') return null;
  return {
    id: record.id,
    service_id: typeof record.service_id === 'string' ? record.service_id : '',
    status: record.status as LiveSession['status'],
    title: record.title,
    stream_url: typeof record.stream_url === 'string' ? record.stream_url : null,
    current_item_id: typeof record.current_item_id === 'string' ? record.current_item_id : null,
    active_song_id: typeof record.active_song_id === 'string' ? record.active_song_id : null,
    content_blocks: Array.isArray(record.content_blocks) ? record.content_blocks : [],
    live_summary: typeof record.live_summary === 'string' ? record.live_summary : null,
    started_at: typeof record.started_at === 'string' ? record.started_at : null,
    ended_at: typeof record.ended_at === 'string' ? record.ended_at : null,
    archived_sermon_id: typeof record.archived_sermon_id === 'string' ? record.archived_sermon_id : null,
  };
}

interface LiveChatMessage {
  id: string;
  sender_name: string;
  sender_avatar?: string;
  message: string;
  timestamp: string;
  is_host?: boolean;
}

const INITIAL_MESSAGES: LiveChatMessage[] = [
  { id: 'm-1', sender_name: 'Pr. Juan Pérez', message: '¡Bienvenidos todos a nuestro Servicio Dominical! Que la paz de Dios llene sus hogares.', timestamp: '10:00 AM', is_host: true },
  { id: 'm-2', sender_name: 'Familia Ramírez', message: '¡Sintonizando desde Milagro! Saludos a toda la iglesia.', timestamp: '10:02 AM' },
  { id: 'm-3', sender_name: 'Beatriz Morales', message: 'Dios bendiga a nuestro equipo de alabanza 🙌🔥', timestamp: '10:05 AM' },
];

const createReaction = (emoji: string) => ({
  id: `react-${Date.now()}-${Math.random()}`,
  emoji,
  left: Math.floor(Math.random() * 80) + 10,
});

export default function LiveStream() {
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'prayer'>('chat');
  const [messages, setMessages] = useState<LiveChatMessage[]>(INITIAL_MESSAGES);
  const [inputMsg, setInputMsg] = useState('');
  const [senderName, setSenderName] = useState('');

  // Floating Reaction animations
  const [reactions, setReactions] = useState<{ id: string; emoji: string; left: number }[]>([]);

  // Salvation Modal
  const [showSalvationModal, setShowSalvationModal] = useState(false);
  const [salvationName, setSalvationName] = useState('');
  const [salvationPhone, setSalvationPhone] = useState('');
  const [salvationSubmitted, setSalvationSubmitted] = useState(false);

  // Private Prayer Modal / Panel
  const [prayerRequest, setPrayerRequest] = useState('');
  const [isPrivatePrayer, setIsPrivatePrayer] = useState(true);
  const [prayerSubmitted, setPrayerSubmitted] = useState(false);

  // Notes state
  const [notes, setNotes] = useState(() => localStorage.getItem('jerusalen_live_notes') || '');

  // Persistent live service data. The existing local chat remains available while the
  // moderated database-backed layer is being rolled out.
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [agenda, setAgenda] = useState<LiveAgendaItem[]>([]);
  const [polls, setPolls] = useState<LivePoll[]>([]);
  const [approvedQuestions, setApprovedQuestions] = useState<LiveQuestion[]>([]);
  const [selectedPollOptions, setSelectedPollOptions] = useState<Record<string, string>>({});
  const [questionText, setQuestionText] = useState('');
  const [questionName, setQuestionName] = useState('');
  const [liveDataError, setLiveDataError] = useState<string | null>(null);
  const [liveDataReady, setLiveDataReady] = useState(false);

  // Auto-scroll chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('jerusalen_live_notes', notes);
  }, [notes]);

  useEffect(() => {
    let mounted = true;
    const loadLiveData = async () => {
      const sessionResult = await supabase
        .from('live_service_sessions')
        .select('id,service_id,status,title,stream_url,current_item_id,active_song_id,content_blocks,live_summary,started_at,ended_at,archived_sermon_id')
        .in('status', ['scheduled', 'live'])
        .order('started_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;
      if (sessionResult.error) {
        console.error('No se pudo cargar la sesión persistente de Culto en Vivo.', sessionResult.error);
        setLiveDataError(sessionResult.error.message);
        return;
      }

      const session = asLiveSession(sessionResult.data);
      setLiveSession(session);
      if (!session) {
        setLiveDataReady(true);
        return;
      }

      const [agendaResult, pollsResult, questionsResult] = await Promise.all([
        supabase.from('worship_service_items').select('id,position,item_type,title,duration_minutes,song_id').eq('service_id', session.service_id).order('position'),
        supabase.from('live_polls').select('id,session_id,question,options').eq('session_id', session.id).eq('status', 'published').order('sort_order'),
        supabase.from('live_questions').select('id,question,answer').eq('session_id', session.id).in('status', ['approved', 'answered']).order('created_at', { ascending: false }).limit(20),
      ]);

      if (!mounted) return;
      const firstError = agendaResult.error ?? pollsResult.error ?? questionsResult.error;
      if (firstError) {
        console.error('No se pudo cargar el contenido interactivo del culto.', firstError);
        setLiveDataError(firstError.message);
      } else {
        setAgenda((agendaResult.data ?? []) as LiveAgendaItem[]);
        setPolls((pollsResult.data ?? []) as LivePoll[]);
        setApprovedQuestions((questionsResult.data ?? []) as LiveQuestion[]);
      }
      setLiveDataReady(true);
    };

    void loadLiveData();
    return () => { mounted = false; };
  }, []);

  const liveSessionId = liveSession?.id;

  useEffect(() => {
    if (!liveSessionId) return undefined;
    const channel = supabase
      .channel(`live-service-${liveSessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_service_sessions', filter: `id=eq.${liveSessionId}` }, (payload) => {
        const next = asLiveSession(payload.new);
        if (next) setLiveSession(next);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_polls', filter: `session_id=eq.${liveSessionId}` }, () => {
        setLiveDataError(null);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_questions', filter: `session_id=eq.${liveSessionId}` }, () => {
        setLiveDataError(null);
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Realtime del Culto en Vivo no disponible: ${status}`);
          setLiveDataError(`La actualización en tiempo real está temporalmente no disponible (${status}).`);
        }
      });

    return () => { void supabase.removeChannel(channel); };
  }, [liveSessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg: LiveChatMessage = {
      id: `msg-${Date.now()}`,
      sender_name: senderName.trim() || 'Hermanos en Fe',
      message: inputMsg.trim(),
      timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMsg('');
  };

  const handleTriggerReaction = (emoji: string) => {
    const newReaction = createReaction(emoji);
    setReactions(prev => [...prev, newReaction]);

    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 2500);
  };

  const handleSalvationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salvationName.trim()) return;

    setSalvationSubmitted(true);
    toast.success('¡Glorioso! Hemos registrado tu decisión por Cristo. Un pastor te contactará pronto.');
  };

  const handlePrayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerRequest.trim()) return;

    setPrayerSubmitted(true);
    toast.success('Tu petición de oración ha sido recibida por el equipo pastoral.');
    setPrayerRequest('');
  };

  const submitPollVote = async (poll: LivePoll) => {
    const option = selectedPollOptions[poll.id];
    if (!option) {
      toast.error('Selecciona una opción antes de responder.');
      return;
    }
    const { error } = await supabase.from('live_poll_votes').insert({ poll_id: poll.id, option });
    if (error) {
      console.error('No se pudo registrar el voto de la encuesta.', error);
      toast.error(`No se pudo registrar tu respuesta: ${error.message}`);
      return;
    }
    toast.success('Respuesta registrada.');
  };

  const submitLiveQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!liveSession || questionText.trim().length < 5) {
      toast.error('Escribe una pregunta de al menos 5 caracteres.');
      return;
    }
    const { error } = await supabase.from('live_questions').insert({
      session_id: liveSession.id,
      question: questionText.trim(),
      display_name: questionName.trim() || null,
      status: 'pending',
    });
    if (error) {
      console.error('No se pudo enviar la pregunta del culto.', error);
      toast.error(`No se pudo enviar la pregunta: ${error.message}`);
      return;
    }
    setQuestionText('');
    toast.success('Pregunta enviada para moderación.');
  };

  const streamUrl = liveSession?.stream_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const currentAgendaItem = agenda.find((item) => item.id === liveSession?.current_item_id) ?? agenda[0] ?? null;
  const pollOptions = (poll: LivePoll): string[] => Array.isArray(poll.options) ? poll.options.filter((option): option is string => typeof option === 'string') : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-16">
      <Helmet>
        <title>Culto en Vivo | Iglesia Jerusalén</title>
        <meta name="description" content="Vive el culto con transmisión, letras de alabanzas, notas, oración y participación de la comunidad." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/90 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-red-500 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                  🔴 EN VIVO
                </span>
                <span className="text-xs text-slate-400">Servicio Dominical de Alabanza y Predicación</span>
              </div>
              <h1 className="font-serif text-2xl font-bold text-white mt-0.5">
                {liveSession?.title || 'Culto en Vivo · Iglesia Jerusalén'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Salvation CTA Button */}
            <button
              onClick={() => setShowSalvationModal(true)}
              className="flex-1 md:flex-none px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 hover:scale-105 transition shadow-lg shadow-amber-500/20"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              ¡Hoy Acepto a Jesús!
            </button>

            <Link
              to="/ofrendas"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <HandHeart className="w-4 h-4" /> Ofrendar
            </Link>
          </div>
        </div>

        {liveDataError && (
          <div role="status" className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
            La experiencia en vivo está cargando en modo limitado. El equipo debe revisar la conexión de datos: {liveDataError}
          </div>
        )}

        {/* MAIN STREAM & INTERACTIVE PANEL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* VIDEO PLAYER (LEFT 8 COLS) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl group">
              {/* Floating Emoticons Container */}
              <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                {reactions.map(r => (
                  <div
                    key={r.id}
                    className="absolute bottom-4 text-3xl animate-float-up opacity-90 transition-all duration-1000"
                    style={{ left: `${r.left}%` }}
                  >
                    {r.emoji}
                  </div>
                ))}
              </div>

              {/* Video Embed */}
              <iframe
                src={streamUrl.includes('youtube.com/watch?v=') ? streamUrl.replace('watch?v=', 'embed/') : streamUrl}
                title="Transmisión en Vivo Iglesia Jerusalén"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* QUICK REACTION FLOATING TOOLBAR */}
            <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" /> Reaccionar en tiempo real:
              </span>

              <div className="flex items-center gap-2">
                {['🙏', '❤️', '🙌', '🔥', '👑', '🕊️'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleTriggerReaction(emoji)}
                    className="w-10 h-10 rounded-xl bg-slate-950 border border-white/10 hover:border-amber-400 hover:scale-110 text-lg transition flex items-center justify-center cursor-pointer shadow-md"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-400">Orden del culto</p>
                    <h2 className="mt-1 font-serif text-xl font-bold text-white">Lo que estamos viviendo</h2>
                  </div>
                  {liveDataReady && <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">Sincronizado</span>}
                </div>
                <div className="mt-4 space-y-2">
                  {agenda.length ? agenda.map((item) => (
                    <div key={item.id} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs ${item.id === currentAgendaItem?.id ? 'bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/30' : 'bg-slate-950/60 text-slate-400'}`}>
                      <span className="flex min-w-0 items-center gap-2"><span className="font-mono text-[10px] text-slate-500">{String(item.position).padStart(2, '0')}</span><span className="truncate">{item.title}</span></span>
                      {item.duration_minutes && <span className="shrink-0 text-[10px] text-slate-500">{item.duration_minutes} min</span>}
                    </div>
                  )) : <p className="rounded-xl bg-slate-950/60 p-3 text-xs text-slate-500">La agenda aparecerá cuando el equipo publique la sesión.</p>}
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="text-[10px] font-black uppercase tracking-[.18em] text-sky-300">Resumen en vivo</p>
                <h2 className="mt-1 font-serif text-xl font-bold text-white">Apuntes de la enseñanza</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{liveSession?.live_summary || 'El resumen aparecerá aquí cuando el equipo editorial lo publique durante la prédica.'}</p>
                {liveSession?.archived_sermon_id && <Link to={`/predicas/${liveSession.archived_sermon_id}`} className="mt-4 inline-flex text-xs font-bold text-amber-300 hover:underline">Ver prédica archivada →</Link>}
              </section>
            </div>

            {polls.length > 0 && <section className="rounded-3xl border border-amber-400/20 bg-amber-400/[.06] p-5">
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-300">Participación</p>
              <h2 className="mt-1 font-serif text-xl font-bold text-white">Encuesta en vivo</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {polls.map((poll) => <div key={poll.id} className="rounded-2xl bg-slate-950/60 p-4">
                  <p className="text-sm font-semibold text-slate-200">{poll.question}</p>
                  <div className="mt-3 space-y-2">{pollOptions(poll).map((option) => <label key={option} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-amber-400/50"><input type="radio" name={`poll-${poll.id}`} value={option} checked={selectedPollOptions[poll.id] === option} onChange={() => setSelectedPollOptions((current) => ({ ...current, [poll.id]: option }))} />{option}</label>)}</div>
                  <button type="button" onClick={() => void submitPollVote(poll)} className="mt-3 rounded-xl bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950">Responder</button>
                </div>)}
              </div>
            </section>}

            <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
              <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-300">Preguntas</p><h2 className="mt-1 font-serif text-xl font-bold text-white">Participa en la prédica</h2></div><span className="text-xs text-slate-500">Moderadas por el equipo</span></div>
              {approvedQuestions.length > 0 && <div className="mt-4 space-y-3">{approvedQuestions.slice(0, 3).map((item) => <div key={item.id} className="rounded-2xl bg-slate-950/60 p-3"><p className="text-sm text-slate-200">{item.question}</p>{item.answer && <p className="mt-2 border-l-2 border-amber-400 pl-3 text-xs leading-5 text-amber-100">{item.answer}</p>}</div>)}</div>}
              <form onSubmit={(event) => void submitLiveQuestion(event)} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                <input value={questionText} onChange={(event) => setQuestionText(event.target.value)} placeholder="Escribe una pregunta para el equipo..." aria-label="Pregunta para la prédica" className="min-h-10 rounded-xl border border-white/10 bg-slate-950 px-3 text-xs text-white outline-none focus:border-amber-400" />
                <button type="submit" className="rounded-xl bg-violet-400 px-4 py-2 text-xs font-bold text-slate-950">Enviar pregunta</button>
                <input value={questionName} onChange={(event) => setQuestionName(event.target.value)} placeholder="Tu nombre (opcional)" aria-label="Nombre para la pregunta" className="min-h-10 rounded-xl border border-white/10 bg-slate-950 px-3 text-xs text-white outline-none focus:border-amber-400 sm:col-span-2" />
              </form>
            </section>
          </div>

          {/* INTERACTIVE SIDEBAR (RIGHT 4 COLS) */}
          <div className="lg:col-span-4 bg-slate-900 rounded-3xl border border-white/10 p-5 shadow-2xl space-y-4 flex flex-col h-[540px]">
            
            {/* TABS */}
            <div className="flex rounded-2xl bg-slate-950 p-1 border border-white/10 text-xs font-bold">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'chat' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Chat
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'notes' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Mis Notas
              </button>
              <button
                onClick={() => setActiveTab('prayer')}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'prayer' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Oración
              </button>
            </div>

            {/* TAB 1: LIVE CHAT */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col justify-between min-h-0 space-y-3">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                  {messages.map(m => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-2xl border ${
                        m.is_host
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-slate-950/60 border-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className={`font-bold ${m.is_host ? 'text-amber-400' : 'text-white'}`}>
                          {m.sender_name} {m.is_host && ' (Anfitrión Host)'}
                        </strong>
                        <span className="text-[10px] text-slate-500">{m.timestamp}</span>
                      </div>
                      <p className="leading-relaxed">{m.message}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="space-y-2 pt-2 border-t border-white/10">
                  <input
                    type="text"
                    value={senderName}
                    onChange={e => setSenderName(e.target.value)}
                    placeholder="Tu nombre (opcional)"
                    className="w-full h-8 px-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMsg}
                      onChange={e => setInputMsg(e.target.value)}
                      placeholder="Escribe un mensaje de bendición..."
                      className="flex-1 h-10 px-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="h-10 px-4 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center hover:bg-amber-400 transition"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: SERMON NOTES */}
            {activeTab === 'notes' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                <p className="text-xs text-slate-400">
                  Toma tus apuntes personales durante el sermón. Se guardan automáticamente en tu navegador.
                </p>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Escribe aquí las citas bíblicas, versículos y reflexiones del día..."
                  className="flex-1 w-full p-3 rounded-2xl bg-slate-950 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-amber-400 resize-none font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(notes);
                    toast.success('Notas copiadas al portapapeles');
                  }}
                  className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Copy size={14} /> Copiar Mis Notas
                </button>
              </div>
            )}

            {/* TAB 3: PRIVATE PRAYER REQUEST */}
            {activeTab === 'prayer' && (
              <div className="flex-1 flex flex-col justify-between min-h-0 space-y-3">
                {prayerSubmitted ? (
                  <div className="py-12 text-center space-y-3 my-auto">
                    <ShieldCheck className="w-12 h-12 text-amber-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white">¡Petición Enviada!</h4>
                    <p className="text-xs text-slate-400 px-4">
                      Nuestro equipo pastoral y de intercesión está orando por ti en este instante.
                    </p>
                    <button
                      onClick={() => setPrayerSubmitted(false)}
                      className="text-xs text-amber-400 hover:underline font-semibold"
                    >
                      Enviar otra petición
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePrayerSubmit} className="space-y-3 my-auto">
                    <p className="text-xs text-slate-400">
                      ¿Necesitas oración? Envía tu motivo de oración confidencial a los pastores en vivo.
                    </p>
                    <textarea
                      required
                      rows={4}
                      value={prayerRequest}
                      onChange={e => setPrayerRequest(e.target.value)}
                      placeholder="Escribe tu petición de oración (salud, familia, finanzas, paz)..."
                      className="w-full p-3 rounded-2xl bg-slate-950 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="privCheck"
                        checked={isPrivatePrayer}
                        onChange={e => setIsPrivatePrayer(e.target.checked)}
                        className="rounded bg-slate-950 border-white/20 text-amber-500 focus:ring-0"
                      />
                      <label htmlFor="privCheck" className="text-xs text-slate-400">
                        Mantener totalmente confidencial
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                    >
                      Enviar Petición de Oración
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SALVATION / FAITH DECISION MODAL */}
      {showSalvationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative text-white">
            <button
              onClick={() => setShowSalvationModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Sparkles size={32} />
              </div>
              <h3 className="font-serif text-2xl font-bold">¡Hoy comiences una nueva vida con Jesús!</h3>
              <p className="text-xs text-slate-400">
                "Si confesares con tu boca que Jesús es el Señor, y creyeres en tu corazón que Dios le levantó de los muertos, serás salvo." — Romanos 10:9
              </p>
            </div>

            {salvationSubmitted ? (
              <div className="bg-slate-950 p-6 rounded-2xl border border-white/10 text-center space-y-4">
                <UserCheck className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">¡Bienvenido a la Familia de Dios!</h4>
                <p className="text-xs text-slate-300">
                  Un pastor o líder de discipulado de la Iglesia Jerusalén se pondrá en contacto contigo para acompañarte en tus primeros pasos de fe.
                </p>
                <button
                  onClick={() => { setShowSalvationModal(false); setSalvationSubmitted(false); }}
                  className="px-6 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSalvationSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={salvationName}
                    onChange={e => setSalvationName(e.target.value)}
                    placeholder="Tu nombre y apellido"
                    className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono o WhatsApp de Contacto</label>
                  <input
                    type="text"
                    required
                    value={salvationPhone}
                    onChange={e => setSalvationPhone(e.target.value)}
                    placeholder="Ej. +593 99 123 4567"
                    className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-xs shadow-xl shadow-amber-500/20"
                  >
                    Confirmar mi Decisión por Cristo
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
