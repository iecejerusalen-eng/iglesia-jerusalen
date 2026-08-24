import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Send, Sparkles, BookOpen, ShieldCheck, UserCheck, Copy, HandHeart, Flame
} from 'lucide-react';
import { toast } from 'sonner';

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

  // Auto-scroll chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('jerusalen_live_notes', notes);
  }, [notes]);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-16">
      <Helmet>
        <title>Campus Online - Culto en Vivo | Iglesia Jerusalén</title>
        <meta name="description" content="Transmisión en vivo del servicio dominical, chat interactivo, peticiones de oración y notas del sermón en la Iglesia Jerusalén." />
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
                Campus Online Jerusalén
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
                src="https://www.youtube-nocookie.com/embed/live_stream?channel=UC_IGLESIA_JERUSALEN&autoplay=1"
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
