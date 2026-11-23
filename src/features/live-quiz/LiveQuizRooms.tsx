Warning: truncated output (original token count: 14183)
Total output lines: 583

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft, ArrowRight, BookOpenCheck, Check, Circle, Clock3, Copy, Crown, Diamond, Download,
  Gamepad2, LockKeyhole, MessageSquareText, Play, RefreshCw, ShieldCheck, Sparkles, Square, Target, Timer, Trophy, Triangle, Users, UsersRound, X,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import {
  applyLiveQuizHostAction, createLiveQuizRoom, getLiveQuizState, joinLiveQuizRoom,
  listMyLiveQuizRooms, submitLiveQuizAnswer, submitLiveQuizReflection,
} from './service';
import type { LiveQuizOptionKey, LiveQuizRoomSummary, LiveQuizScoreMode, LiveQuizSession, LiveQuizSnapshot } from './types';

const PAGE_PATH = '/recursos/juegos/partida-en-vivo';
const PLAYER_TOKEN_PREFIX = 'live-quiz-player:';
const ACTIVE_ROOM_LIMIT = 3;
const VISITOR_ROLES = new Set(['visitor', 'visitante', 'guest', 'invitado', 'anonymous', 'anon']);
const ANSWER_TONES = [
  { background: 'bg-rose-600', icon: Triangle, shape: '▲' },
  { background: 'bg-blue-600', icon: Diamond, shape: '◆' },
  { background: 'bg-amber-500', icon: Circle, shape: '●' },
  { background: 'bg-emerald-600', icon: Square, shape: '■' },
];

export function LiveQuizRooms() {
  const { user, role, roles, permissions, isLoading: authLoading } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pin, setPin] = useState(searchParams.get('pin')?.replace(/\D/g, '').slice(0, 8) ?? '');
  const [nickname, setNickname] = useState('');
  const [session, setSession] = useState<LiveQuizSession | null>(null);
  const [snapshot, setSnapshot] = useState<LiveQuizSnapshot | null>(null);
  const [rooms, setRooms] = useState<LiveQuizRoomSummary[]>([]);
  const [title, setTitle] = useState('Reto bíblico en vivo');
  const [questionCount, setQuestionCount] = useState(10);
  const [questionSeconds, setQuestionSeconds] = useState(20);
  const [lifetimeDays, setLifetimeDays] = useState(7);
  const [teamMode, setTeamMode] = useState(false);
  const [teamCount, setTeamCount] = useState(3);
  const [scoreMode, setScoreMode] = useState<LiveQuizScoreMode>('speed');
  const [reflectionPrompt, setReflectionPrompt] = useState('');
  const [reflectionResponse, setReflectionResponse] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<LiveQuizOptionKey | null>(null);
  const [clock, setClock] = useState(0);

  const roleNames = useMemo(() => [...new Set([role, ...(roles ?? [])]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase()))], [role, roles]);
  const canHost = Boolean(user && (
    roleNames.some((item) => !VISITOR_ROLES.has(item))
    || permissions?.games?.edit === true
  ));

  const syncState = useCallback(async () => {
    if (!session) return;
    try {
      const nextSnapshot = await getLiveQuizState(session.pin, session.playerToken);
      setSnapshot(nextSnapshot);
      setErrorMessage(null);
      setSelectedAnswer(null);
    } catch (error) {
      setErrorMessage(messageFromError(error));
    }
  }, [session]);

  const refreshMyRooms = useCallback(async () => {
    if (!canHost) return;
    try {
      setRooms(await listMyLiveQuizRooms());
    } catch (error) {
      setErrorMessage(messageFromError(error));
    }
  }, [canHost]);

  useEffect(() => {
    if (!canHost) return;
    const timer = window.setTimeout(() => void refreshMyRooms(), 0);
    return () => window.clearTimeout(timer);
  }, [canHost, refreshMyRooms]);

  const activePin = session?.pin ?? null;
  const activePlayerToken = session?.playerToken ?? null;
  useEffect(() => {
    if (!activePin) return;
    let mounted = true;
    let inFlight = false;
    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const nextSnapshot = await getLiveQuizState(activePin, activePlayerToken);
        if (!mounted) return;
        setSnapshot(nextSnapshot);
        setSession((current) => current ? { ...current, roomId: nextSnapshot.room.id } : current);
        setErrorMessage(null);
        setSelectedAnswer(null);
      } catch (error) {
        if (mounted) setErrorMessage(messageFromError(error));
      } finally {
        inFlight = false;
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), 3500);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [activePin, activePlayerToken]);

  useEffect(() => {
    if (snapshot?.room.phase !== 'question') return;
    const timer = window.setInterval(() => setClock(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [snapshot?.room.phase, snapshot?.room.question_started_at]);

  const changePin = (value: string) => {
    const next = value.replace(/\D/g, '').slice(0, 8);
    setPin(next);
    setSearchParams(next ? { pin: next } : {});
  };

  const startRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setErrorMessage(null);
    try {
      const created = await createLiveQuizRoom({
        title,
        questionCount,
        questionSeconds,
        lifetimeDays,
        teamMode,
        teamCount,
        scoreMode,
        reflectionPrompt: reflectionPrompt.trim() || null,
      });
      setPin(created.pin);
      setSearchParams({ pin: created.pin });
      setSession({ pin: created.pin, roomId: created.id, playerToken: null });
      setSnapshot(null);
      setNotice(`Sala creada${teamMode ? ` · ${teamCount} equipos equilibrados` : ''}. Comparte el PIN para que se unan.`);
      await refreshMyRooms();
    } catch (error) {
      setErrorMessage(messageFromError(error));
    } finally {
      setBusy(false);
    }
  };

  const enterRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pin.length !== 8) {
      setErrorMessage('Escribe los 8 números del PIN.');
      return;
    }
    const savedToken = readPlayerToken(pin);
    if (!savedToken && nickname.trim().length < 2) {
      setErrorMessage('Escribe un apodo de al menos 2 caracteres.');
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    try {
      if (savedToken) {
        try {
          const currentSnapshot = await getLiveQuizState(pin, savedToken);
          setSession({ pin, roomId: currentSnapshot.room.id, playerToken: savedToken });
          setSnapshot(currentSnapshot);
          setNotice('Volviste a tu sala.');
          return;
        } catch {
          forgetPlayerToken(pin);
        }
      }
      const joined = await joinLiveQuizRoom(pin, nickname);
      rememberPlayerToken(pin, joined.token);
      setSession({ pin, roomId: joined.id, playerToken: joined.token });
      setNotice(joined.teamName ? `Te asignamos a ${joined.teamName}.` : null);
    } catch (error) {
      setErrorMessage(messageFromError(error));
    } finally {
      setBusy(false);
    }
  };

  const resumeRoom = (room: LiveQuizRoomSummary) => {
    setPin(room.pin);
    setSearchParams({ pin: room.pin });
    setSession({ pin: room.pin, roomId: room.id, playerToken: null });
    setSnapshot(null);
    setErrorMessage(null);
    setNotice(null);
  };

  const hostAction = async (action: 'start' | 'reveal' | 'next' | 'finish') => {
    if (!snapshot) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      await applyLiveQuizHostAction(snapshot.room.id, action);
      await syncState();
      if (action === 'finish' || action === 'next') await refreshMyRooms();
    } catch (error) {
      setErrorMessage(messageFromError(error));
    } finally {
      setBusy(false);
    }
  };

  const chooseAnswer = async (answer: LiveQuizOptionKey) => {
    if (!session?.playerToken || !snapshot?.question || snapshot.answered_current || busy) return;
    setSelectedAnswer(answer);
    setBusy(true);
    setErrorMessage(null);
    try {
      await submitLiveQuizAnswer(session.pin, session.playerToken, snapshot.question.index, answer);
      await syncState();
    } catch (error) {
      setErrorMessage(messageFromError(error));
      setSelectedAnswer(null);
    } finally {
      setBusy(false);
    }
  };

  const submitReflection = async () => {
    if (!session?.playerToken || !reflectionResponse.trim() || busy) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      await submitLiveQuizReflection(session.pin, session.playerToken, reflectionResponse.trim());
      await syncState();
      setNotice('Tu reflexión quedó compartida con quien organiza.');
    } catch (error) {
      setErrorMessage(messageFromError(error));
    } finally {
      setBusy(false);
    }
  };

  const leaveRoom = () => {
    setSession(null);
    setSnapshot(null);
    setPin('');
    setSearchParams({});
    setSelectedAnswer(null);
    setErrorMessage(null);
    setNotice(null);
  };

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copiado.`);
    } catch {
      setNotice(`No pudimos copiarlo. Puedes seleccionar y copiar: ${value}`);
    }
  };

  const joinUrl = snapshot ? `${window.location.origin}${PAGE_PATH}?pin=${snapshot.room.pin}` : '';

  return <>
    <Helmet>
      <title>Reto bíblico en vivo | Iglesia Jerusalén</title>
      <meta name="description" content="Crea o únete a una partida bíblica en vivo con PIN, preguntas y clasificación." />
    </Helmet>
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 px-4 pb-20 pt-24 text-slate-950 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/30 dark:text-white sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-32 size-80 rounded-full bg-blue-500/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-[30rem] size-80 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        {session && snapshot ? (
          <GameRoom
            snapshot={snapshot}
            joinUrl={joinUrl}
            errorMessage={errorMessage}
            notice={notice}
            busy={busy}
            clock={clock}
            selectedAnswer={selectedAnswer}
            reflectionResponse={reflectionResponse}
            onReflectionResponseChange={setReflectionResponse}
            onLeave={leaveRoom}
            onCloseNotice={() => setNotice(null)}
            onCopy={copyValue}
            onAction={hostAction}
            onAnswer={chooseAnswer}
            onSubmitReflection={submitReflection}
            onDownloadReport={() => downloadLiveQuizReport(snapshot)}
          />
        ) : session ? (
          <section className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white/90 p-8 text-center shadow-xl dark:border-white/10 dark:bg-slate-900/80">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-950 text-amber-300 dark:bg-amber-300 dark:text-blue-950"><RefreshCw className="animate-spin motion-reduce:animate-none" size={22} /></div>
            <h1 className="mt-5 font-serif text-3xl font-bold">Conectando con la sala</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Estamos cargando el PIN {session.pin}.</p>
            {errorMessage && <ErrorNotice message={errorMessage} />}
            <button type="button" onClick={leaveRoom} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold dark:border-white/15"><ArrowLeft size={16} /> Volver</button>
          </section>
        ) : (
          <>
            <header className="mx-auto max-w-3xl text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-950 text-amber-300 shadow-lg dark:bg-amber-300 dark:text-blue-950"><Gamepad2 size={27} /></div>
              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">Jueguen y aprendan juntos</p>
              <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight sm:text-6xl">Reto bíblico en vivo</h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">Responde desde tu celular, acumula puntos y descubre qué grupo conoce mejor las Escrituras.</p>
            </header>

            {notice && <Notice message={notice} onClose={() => setNotice(null)} />}
            {errorMessage && <ErrorNotice message={errorMessage} />}

            <div className="mt-9 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
              <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/75 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-900 dark:bg-white/10 dark:text-amber-300"><Play size={19} fill="currentColor" /></div>
                  <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-700 dark:text-amber-300">Ya tienes un código</p><h2 className="mt-1 font-serif text-2xl font-bold">Únete a una sala</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Ingresa el PIN que comparte quien organiza.</p></div>
                </div>
                <form onSubmit={enterRoom} className="mt-6 space-y-4">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300" htmlFor="live-quiz-pin">PIN de la sala</label>
                  <input id="live-quiz-pin" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" maxLength={8} value={pin} onChange={(event) => changePin(event.target.value)} placeholder="0000 0000" required className="min-h-[4.25rem] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center font-mono text-3xl font-black tracking-[.2em] text-blue-950 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 dark:border-white/10 dark:bg-slate-950 dark:text-white" />
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300" htmlFor="live-quiz-nickname">Tu apodo</label>
                  <input id="live-quiz-nickname" autoComplete="nickname" maxLength={24} value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="Ej. Débora (si es tu primera vez)" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 dark:border-white/10 dark:bg-slate-950" />
                  <button type="submit" disabled={busy || pin.length !== 8} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-black text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/60 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-300 dark:text-blue-950 dark:hover:bg-amber-200"><ArrowRight size={17} /> {busy ? 'Buscando sala…' : 'Entrar a jugar'}</button>
                </form>
                <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400"><ShieldCheck size={15} className="shrink-0" /> No necesitas una cuenta para participar.</p>
              </section>

              <section className="rounded-[2rem] border border-blue-950/10 bg-blue-950 p-6 text-white shadow-[0_24px_80px_-44px_rgba(15,23,42,.7)] sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-amber-300"><Crown size={20} /></div>
                  <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-300">Organiza una partida</p><h2 className="mt-1 font-serif text-2xl font-bold">Crea una sala con PIN</h2><p className="mt-1 text-sm leading-6 text-blue-100/80">Elige preguntas y duración; comparte el código con tu grupo.</p></div>
                </div>
                {authLoading ? <p className="mt-6 text-sm text-blue-100/80">Comprobando tu cuenta…</p> : !user ? (
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-sm leading-6 text-blue-50">Inicia sesión con una cuenta de la iglesia para organizar una sala.</p><Link to={`/login?redirectTo=${encodeURIComponent(PAGE_PATH)}`} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-300 px-4 text-sm font-black text-blue-950"><LockKeyhole size={15} /> Iniciar sesión</Link></div>
                ) : !canHost ? (
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-sm leading-6 text-blue-50">La creación de salas está habilitada para los roles de la iglesia por encima de visitante. Puedes unirte con un PIN.</p><p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-amber-200"><ShieldCheck size={15} /> Tu rol actual no puede crear salas.</p></div>
                ) : (
                  <form onSubmit={startRoom} className="mt-6 space-y-4">
                    <label className="block text-xs font-bold text-blue-100" htmlFor="live-quiz-title">Nombre de la sala</label>
                    <input id="live-quiz-title" maxLength={80} minLength={3} value={title} onChange={(event) => setTitle(event.target.value)} required className="min-h-12 w-full rounded-xl border border-white/15 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-blue-100/50 focus:border-amber-300 focus:ring-4 focus:ring-amber-300/15" />
                    <div className="grid grid-cols-2 gap-3">
                      <SelectField label="Preguntas" value={questionCount} onChange={(value) => setQuestionCount(Number(value))} options={[[5, '5 preguntas'], [10, '10 preguntas'], [15, '15 preguntas']]} />
                      <SelectField label="Tiempo por pregunta" value={questionSeconds} onChange={(value) => setQuestionSeconds(Number(value))} options={[[10, '10 segundos'], [20, '20 segundos'], [30, '30 segundos'], [45, '45 segundos'], [60, '60 segundos']]} />
                    </div>
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                      <input type="checkbox" checked={teamMode} onChange={(event) => setTeamMode(event.target.checked)} className="mt-0.5 size-4 accent-amber-300" />
                      <span><strong className="block text-white">Competencia por equipos</strong><span className="mt-1 block text-xs leading-5 text-blue-100/75">Cada persona entra desde su celular; el puntaje del equipo es el promedio de sus integrantes.</span></span>
                    </label>
                    {teamMode && <SelectField label="Equipos equilibrados" value={teamCount} onChange={(value) => setTeamCount(Number(value))} options={[[2, '2 equipos'], [3, '3 equipos'], [4, '4 equipos'], [5, '5 equipos'], [6, '6 equipos'], [7, '7 equipos'], [8, '8 equipos'], [9, '9 equipos'], [10, '10 equipos']]} />}
                    <label className="block text-xs font-bold text-blue-100" htmlFor="live-quiz-score-mode">Forma de puntuar<select id="live-quiz-score-mode" value={scoreMode} onChange={(event) => setScoreMode(event.target.value === 'accuracy' ? 'accuracy' : 'speed')} className="mt-1.5 min-h-11 w-full rounded-xl border border-white/15 bg-blue-900 px-3 text-sm text-white outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-300/15"><option value="speed" className="bg-blue-950">Ritmo · premia acertar rápido</option><option value="accuracy" className="bg-blue-950">Precisión · todos valen igual</option></select></label>
                    <p className="-mt-2 text-[11px] leading-5 text-blue-100/70">Precisión ayuda a que el tiempo no dé ventaja. En Ritmo, las respuestas correctas suman hasta 1.000 puntos según rapidez.</p>
                    <div><label className="block text-xs font-bold text-blue-100" htmlFor="live-quiz-reflection">Pregunta para conversar al final <span className="font-normal text-blue-100/70">(opcional)</span><textarea id="live-quiz-reflection" value={reflectionPrompt} onChange={(event) => setReflectionPrompt(event.target.value.slice(0, 180))} maxLength={180} rows={2} placeholder="¿Qué enseñanza te llevas del reto?" className="mt-1.5 w-full resize-y rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/50 focus:border-amber-300 focus:ring-4 focus:ring-amber-300/15" /></label><p className="mt-1 text-[11px] leading-5 text-blue-100/70">Las respuestas solo las verá quien organiza; evita pedir datos personales.</p></div>
                    <SelectField label="Vigencia máxima del PIN" value={lifetimeDays} onChange={(value) => setLifetimeDays(Number(value))} options={[[1, '1 día'], [7, '7 días'], [30, '30 días'], [90, '90 días'], [180, '180 días'], [365, '365 días · máximo']]} />
                    <button type="submit" disabled={busy || rooms.length >= ACTIVE_ROOM_LIMIT || title.trim().length < 3} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 text-sm font-black text-blue-950 transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50">{busy ? <RefreshCw className="animate-spin motion-reduce:animate-none" size={16} /> : <Sparkles size={16} />} {busy ? 'Creando sala…' : 'Crear sala y obtener PIN'}</button>
                    <p className="flex items-center justify-between gap-2 text-xs text-blue-100/80"><span className="inline-flex items-center gap-1.5"><Timer size={14} /> Las salas expiran en 1 a 365 días.</span><span>{rooms.length}/{ACTIVE_ROOM_LIMIT} activas</span></p>
                  </form>
                )}
              </section>
            </div>

            {canHost && <section className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white/75 p-5 shadow-lg dark:border-white/10 dark:bg-slate-900/60 sm:p-7" aria-labelledby="active-rooms-heading">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-700 dark:text-amber-300">Tus partidas</p><h2 id="active-rooms-heading" className="mt-1 font-serif text-2xl font-bold">Salas activas <span className="font-sans text-sm font-bold text-slate-500">{rooms.length}/{ACTIVE_ROOM_LIMIT}</span></h2></div><button type="button" onClick={() => void refreshMyRooms()} className="inline-flex min-h-10 items-center gap-2 self-start rounded-xl border border-slate-200 px-3 text-xs font-bold dark:border-white/10"><RefreshCw size={14} /> Actualizar</button></div>
              {rooms.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">No tienes salas activas. Las salas cerradas o expiradas liberan un cupo.</p> : <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{rooms.map((room) => <article key={room.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate tex…2183 tokens truncated…div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${Math.max(0, (remainingSeconds / room.question_seconds) * 100)}%` }} /></div>}
                <QuestionPanel
                  question={question}
                  isHost={isHost}
                  canAnswer={!isHost && room.phase === 'question' && !playerIsReady && !busy}
                  answered={playerIsReady}
                  selectedAnswer={selectedAnswer}
                  myAnswer={snapshot.my_answer}
                  onAnswer={onAnswer}
                />
                {isHost && <div className="mt-6 flex flex-wrap gap-3">{room.phase === 'question' && <button type="button" disabled={busy} onClick={() => void onAction('reveal')} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-black text-white disabled:opacity-50 dark:bg-amber-300 dark:text-blue-950"><Check size={16} /> Mostrar respuesta</button>}{room.phase === 'reveal' && <button type="button" disabled={busy} onClick={() => void onAction('next')} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-black text-white disabled:opacity-50 dark:bg-amber-300 dark:text-blue-950">{canContinue ? 'Siguiente pregunta' : 'Ver resultados'} <ArrowRight size={16} /></button>}{room.phase !== 'reveal' && <button type="button" disabled={busy} onClick={() => void onAction('finish')} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 disabled:opacity-50 dark:border-white/10 dark:text-slate-300"><X size={15} /> Finalizar</button>}</div>}
              </div>
            )}
          </div>

          <aside className="border-t border-slate-200 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-slate-950/40 xl:border-l xl:border-t-0 sm:p-7" aria-label="Participantes y puntajes">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-amber-700 dark:text-amber-300">{room.team_mode ? 'Competencia' : 'Clasificación'}</p><h2 className="mt-1 flex items-center gap-2 font-serif text-xl font-bold"><Trophy size={19} className="text-amber-500" /> {room.team_mode ? 'Equipos' : 'En esta sala'}</h2></div><span className="rounded-full bg-blue-950 px-2.5 py-1 text-xs font-black text-white dark:bg-amber-300 dark:text-blue-950">{room.team_mode ? snapshot.teams.length : players.length}</span></div>
            {room.team_mode && <ol className="mt-5 space-y-2">{snapshot.teams.map((team, index) => <li key={team.name} className="rounded-2xl border border-amber-200 bg-white px-3 py-3 dark:border-amber-300/20 dark:bg-white/[.03]"><div className="flex items-center justify-between gap-2"><span className="min-w-0 truncate text-sm font-black">{index === 0 ? <Crown size={13} className="mr-1 inline text-amber-500" /> : `${index + 1}. `}{team.name}</span><span className="shrink-0 text-xs font-black tabular-nums text-blue-950 dark:text-amber-200">{Math.round(team.score).toLocaleString('es-EC')} pts</span></div><p className="mt-1 text-[10px] text-slate-500">{team.player_count} integrantes · promedio</p></li>)}</ol>}
            {!room.team_mode && players.length === 0 ? <p className="mt-6 text-sm leading-6 text-slate-500 dark:text-slate-400">Los jugadores aparecerán cuando ingresen con el PIN.</p> : <ol className="mt-5 space-y-2">{players.slice(0, room.team_mode ? 6 : 12).map((player, index) => <li key={player.id} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-3 dark:border-white/10 dark:bg-white/[.03]"><span className={`grid size-8 shrink-0 place-items-center rounded-xl text-xs font-black ${index === 0 ? 'bg-amber-100 text-amber-900 dark:bg-amber-300/15 dark:text-amber-200' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'}`}>{index === 0 ? <Crown size={15} /> : index + 1}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{player.nickname}</span>{room.team_mode && <span className="block truncate text-[10px] text-slate-500">{player.team_name ?? 'Esperando asignación'}</span>}</span><span className="shrink-0 text-xs font-black tabular-nums text-blue-950 dark:text-amber-200">{player.score.toLocaleString('es-EC')}</span></li>)}</ol>}
            {players.length > 12 && <p className="mt-3 text-center text-xs text-slate-500">y {players.length - 12} más</p>}
            {!isHost && room.status === 'in_progress' && <p className="mt-5 rounded-xl bg-white px-3 py-3 text-xs leading-5 text-slate-600 dark:bg-white/5 dark:text-slate-300" aria-live="polite">{playerIsReady ? 'Respuesta guardada. Mira la pantalla para conocer el resultado.' : 'Elige una opción antes de que termine el tiempo.'}</p>}
          </aside>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-3 text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-400 sm:px-8"><span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> PIN válido hasta {formatDate(room.expires_at)}</span><span>{isHost ? 'Solo quien creó la sala puede avanzar las preguntas.' : 'La partida se actualiza automáticamente.'}</span></div>
      </>
    )}
  </section>;
}

function QuestionPanel({ question, isHost, canAnswer, answered, selectedAnswer, myAnswer, onAnswer }: {
  question: LiveQuizSnapshot['question'];
  isHost: boolean;
  canAnswer: boolean;
  answered: boolean;
  selectedAnswer: LiveQuizOptionKey | null;
  myAnswer: LiveQuizOptionKey | null;
  onAnswer: (answer: LiveQuizOptionKey) => Promise<void>;
}) {
  if (!question) return <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/15">La pregunta aparecerá al iniciar la partida.</div>;
  const isRevealed = question.correct_option !== null;
  return <div>
    <h2 className="text-balance font-serif text-2xl font-bold leading-snug sm:text-3xl">{question.text}</h2>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {question.options.map((option, index) => {
        const tone = ANSWER_TONES[index] ?? ANSWER_TONES[0];
        const correct = isRevealed && question.correct_option === option.key;
        const selected = selectedAnswer === option.key || (!isHost && isRevealed && myAnswer === option.key);
        return <button key={option.key} type="button" disabled={!canAnswer} onClick={() => void onAnswer(option.key)} aria-pressed={selected} className={`flex min-h-[5.5rem] items-center gap-3 rounded-2xl p-4 text-left text-sm font-bold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/70 disabled:cursor-default disabled:opacity-95 motion-reduce:transition-none ${tone.background} ${selected ? 'ring-4 ring-amber-300 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''} ${isRevealed && correct ? 'ring-4 ring-emerald-300 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''} ${isRevealed && !correct ? 'opacity-60' : ''}`}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-black/15" aria-hidden="true">{tone.shape}</span><span className="flex-1 leading-5">{option.text}</span>{selected && <Check size={18} />}{isRevealed && correct && <Check size={18} />}</button>;
      })}
    </div>
    {isRevealed && question.explanation && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10"><p className="text-[10px] font-black uppercase tracking-[.15em] text-emerald-800 dark:text-emerald-200">Respuesta y contexto bíblico</p><p className="mt-1 text-sm leading-6 text-emerald-950 dark:text-emerald-50">{question.explanation}</p></div>}
    {!isHost && answered && !isRevealed && <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-900 dark:text-blue-200" aria-live="polite"><Check size={16} /> Respuesta guardada. Espera el resultado.</p>}
    {!isHost && answered && isRevealed && <p className="mt-4 inline-flex items-center gap-2 text-sm font-black text-blue-900 dark:text-blue-200" aria-live="polite">{myAnswer === question.correct_option ? <><Check size={16} /> ¡Respuesta correcta!</> : <><X size={16} /> Revisa cuál opción elegiste y qué enseña el pasaje.</>}</p>}
    {!isHost && !canAnswer && !answered && !isRevealed && <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Espera la siguiente pregunta.</p>}
  </div>;
}

function FinalResults({ snapshot, isHost, busy, reflectionResponse, onReflectionResponseChange, onSubmitReflection, onDownloadReport, onLeave }: {
  snapshot: LiveQuizSnapshot;
  isHost: boolean;
  busy: boolean;
  reflectionResponse: string;
  onReflectionResponseChange: (value: string) => void;
  onSubmitReflection: () => Promise<void>;
  onDownloadReport: () => void;
  onLeave: () => void;
}) {
  const scoreLabel = snapshot.room.score_mode === 'accuracy' ? 'puntos por precisión' : 'puntos';
  const winners = snapshot.players.slice(0, 3);
  const winningTeams = snapshot.teams.slice(0, 3);
  return <div className="p-6 sm:p-10">
    <div className="mx-auto max-w-3xl text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-300/10 dark:text-amber-200"><Trophy size={25} /></div><p className="mt-5 text-[10px] font-black uppercase tracking-[.2em] text-amber-700 dark:text-amber-300">Reto terminado</p><h1 className="mt-2 font-serif text-4xl font-bold sm:text-5xl">¡Buen trabajo!</h1><p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{snapshot.room.title} · {snapshot.room.question_count} preguntas · {snapshot.player_count} participantes</p><p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400"><Target size={14} /> Puntaje por {snapshot.room.score_mode === 'accuracy' ? 'precisión' : 'rapidez'}</p></div>
    {snapshot.room.team_mode && winningTeams.length > 0 ? <section className="mx-auto mt-8 max-w-3xl" aria-label="Resultados de equipos"><div className="mb-3 text-center"><p className="text-[10px] font-black uppercase tracking-[.16em] text-amber-700 dark:text-amber-300">Competencia por equipos</p><h2 className="mt-1 font-serif text-2xl font-bold">Promedio del equipo</h2></div><div className="grid gap-3 sm:grid-cols-3">{winningTeams.map((team, index) => <article key={team.name} className={`rounded-3xl border p-5 text-center ${index === 0 ? 'border-amber-300 bg-amber-50 dark:border-amber-300/30 dark:bg-amber-300/10 sm:-translate-y-2' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/[.03]'}`}><div className="mx-auto grid size-10 place-items-center rounded-2xl bg-blue-950 text-amber-300"><UsersRound size={18} /></div><p className="mt-3 text-[10px] font-black uppercase tracking-[.15em] text-slate-500">{['1.er lugar', '2.º lugar', '3.er lugar'][index]}</p><h3 className="mt-1 truncate text-lg font-black">{team.name}</h3><p className="mt-1 text-sm font-bold text-blue-900 dark:text-amber-200">{Math.round(team.score).toLocaleString('es-EC')} promedio</p><p className="mt-1 text-xs text-slate-500">{team.player_count} integrantes</p></article>)}</div></section> : winners.length > 0 && <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">{winners.map((player, index) => <div key={player.id} className={`rounded-3xl border p-5 text-center ${index === 0 ? 'border-amber-300 bg-amber-50 dark:border-amber-300/30 dark:bg-amber-300/10 sm:-translate-y-2' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/[.03]'}`}><div className="mx-auto grid size-10 place-items-center rounded-2xl bg-blue-950 text-amber-300"><Crown size={17} /></div><p className="mt-3 text-[10px] font-black uppercase tracking-[.15em] text-slate-500">{['1.er lugar', '2.º lugar', '3.er lugar'][index]}</p><h2 className="mt-1 truncate text-lg font-black">{player.nickname}</h2><p className="mt-1 text-sm font-bold text-blue-900 dark:text-amber-200">{player.score.toLocaleString('es-EC')} {scoreLabel}</p></div>)}</div>}
    {snapshot.room.team_mode && <TeamLeaderboard teams={snapshot.teams} title="Tabla completa de equipos" />}
    <div className="mx-auto mt-7 max-w-2xl rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[.03]"><h2 className="flex items-center gap-2 font-serif text-xl font-bold"><Users size={18} /> Clasificación individual</h2><ol className="mt-3 space-y-2">{snapshot.players.map((player, index) => <li key={player.id} className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 text-sm dark:bg-slate-950/60"><span className="min-w-0 truncate"><strong className="mr-3 text-slate-400">{index + 1}</strong>{player.nickname}{player.team_name && <span className="ml-2 text-xs text-slate-500">· {player.team_name}</span>}</span><strong className="shrink-0 tabular-nums">{player.score.toLocaleString('es-EC')} pts</strong></li>)}</ol></div>
    {isHost && snapshot.question_report && <section className="mx-auto mt-6 max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[.03]" aria-labelledby="live-quiz-report-heading"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-amber-700 dark:text-amber-300">Resumen de aprendizaje</p><h2 id="live-quiz-report-heading" className="mt-1 font-serif text-xl font-bold">Rendimiento por pregunta</h2></div><button type="button" onClick={onDownloadReport} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold dark:border-white/10"><Download size={15} /> Descargar informe CSV</button></div><ol className="mt-4 space-y-3">{snapshot.question_report.map((item) => { const percent = item.answers ? Math.round(item.correct_answers / item.answers * 100) : 0; return <li key={item.index} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/50"><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold"><span className="mr-2 text-amber-700 dark:text-amber-300">{item.index}.</span>{item.question}</p><strong className="shrink-0 text-sm tabular-nums">{percent}%</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" role="progressbar" aria-label={`Aciertos en pregunta ${item.index}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><div className="h-full rounded-full bg-emerald-500 motion-reduce:transition-none" style={{ width: `${percent}%` }} /></div><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.correct_answers} de {item.answers} respuestas correctas · {item.average_response_ms ? `${(item.average_response_ms / 1000).toFixed(1)} s de media` : 'sin respuestas'}</p></li>; })}</ol></section>}
    {snapshot.room.reflection_prompt && <section className="mx-auto mt-6 max-w-3xl rounded-3xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-300/20 dark:bg-amber-300/[.06]"><div className="flex items-start gap-3"><MessageSquareText size={18} className="mt-1 shrink-0 text-amber-700 dark:text-amber-300" /><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.16em] text-amber-800 dark:text-amber-200">Conversación bíblica</p><h2 className="mt-1 font-serif text-xl font-bold">{snapshot.room.reflection_prompt}</h2>{isHost ? <div className="mt-4 space-y-3">{snapshot.reflections.length ? snapshot.reflections.map((reflection, index) => <article key={`${reflection.nickname}-${index}`} className="rounded-2xl bg-white p-4 dark:bg-slate-950/50"><p className="text-xs font-black text-slate-500">{reflection.nickname}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{reflection.response}</p></article>) : <p className="text-sm text-slate-600 dark:text-slate-300">Todavía no hay reflexiones compartidas.</p>}</div> : snapshot.my_reflection ? <p className="mt-3 rounded-xl bg-white px-4 py-3 text-sm text-slate-700 dark:bg-slate-950/50 dark:text-slate-200">Ya compartiste tu respuesta. La persona que organizó puede leerla.</p> : <div className="mt-4"><label className="block text-xs font-bold text-slate-700 dark:text-slate-200" htmlFor="live-quiz-reflection-response">Tu respuesta <span className="font-normal text-slate-500">· hasta 250 caracteres</span><textarea id="live-quiz-reflection-response" maxLength={250} rows={3} value={reflectionResponse} onChange={(event) => onReflectionResponseChange(event.target.value)} placeholder="Comparte una idea que te llevas de las Escrituras…" className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 dark:border-white/10 dark:bg-slate-950" /></label><p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Solo quien organiza verá tu respuesta. Evita incluir datos personales o confidencias.</p><button type="button" onClick={() => void onSubmitReflection()} disabled={busy || reflectionResponse.trim().length < 3} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-950 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-300 dark:text-blue-950"><MessageSquareText size={15} /> {busy ? 'Compartiendo…' : 'Compartir reflexión'}</button></div>}</div></div></section>}
    <div className="mt-7 flex flex-wrap justify-center gap-3">{isHost && <p className="basis-full text-center text-xs text-slate-500">La sala terminó y ya liberó tu cupo para crear otra.</p>}<button type="button" onClick={onLeave} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-bold text-white dark:bg-amber-300 dark:text-blue-950"><ArrowLeft size={15} /> Volver a salas</button></div>
  </div>;
}

function TeamLeaderboard({ teams, title }: { teams: LiveQuizSnapshot['teams']; title: string }) {
  return <section className="mx-auto mt-5 max-w-2xl rounded-3xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-300/20 dark:bg-amber-300/[.06]" aria-label={title}><h2 className="flex items-center gap-2 font-serif text-lg font-bold"><UsersRound size={18} className="text-amber-700 dark:text-amber-300" />{title}</h2>{teams.length ? <ol className="mt-3 space-y-2">{teams.map((team, index) => <li key={team.name} className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm dark:bg-slate-950/50"><span className="min-w-0 truncate"><strong className="mr-3 text-slate-400">{index + 1}</strong>{team.name}<span className="ml-2 text-xs text-slate-500">· {team.player_count} integrantes</span></span><strong className="shrink-0 tabular-nums">{Math.round(team.score).toLocaleString('es-EC')} pts promedio</strong></li>)}</ol> : <p className="mt-3 text-sm text-slate-500">Los equipos aparecerán cuando se unan participantes.</p>}</section>;
}

function downloadLiveQuizReport(snapshot: LiveQuizSnapshot): void {
  const rows: string[][] = [['seccion', 'puesto', 'equipo', 'participante', 'puntaje', 'pregunta', 'opcion_correcta', 'respuestas', 'aciertos', 'tiempo_medio_segundos', 'respuesta_reflexion']];
  snapshot.players.forEach((player, index) => rows.push(['participantes', String(index + 1), player.team_name ?? '', player.nickname, String(player.score), '', '', '', '', '', '']));
  snapshot.teams.forEach((team, index) => rows.push(['equipos', String(index + 1), team.name, '', String(Math.round(team.score)), '', '', '', '', '', '']));
  (snapshot.question_report ?? []).forEach((item) => rows.push(['preguntas', String(item.index), '', '', '', item.question, item.correct_option, String(item.answers), String(item.correct_answers), String(item.average_response_ms / 1000), '']));
  snapshot.reflections.forEach((reflection) => rows.push(['reflexiones', '', '', reflection.nickname, '', snapshot.room.reflection_prompt ?? '', '', '', '', '', reflection.response]));
  const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${escapeCsvCell(cell)}"`).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${slugify(snapshot.room.title)}-${snapshot.room.pin}-informe.csv`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function escapeCsvCell(value: string): string {
  const safeValue = /^[\t\r\n ]*[=+\-@]/.test(value) ? `'${value}` : value;
  return safeValue.replaceAll('"', '""');
}

function slugify(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'reto-biblico';
}

function SelectField({ label, value, onChange, options }: { label: string; value: number; onChange: (value: string) => void; options: Array<[number, string]> }) {
  return <label className="block min-w-0 text-xs font-bold text-blue-100">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-white/15 bg-blue-900 px-3 text-sm text-white outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-300/15">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue} className="bg-blue-950">{optionLabel}</option>)}</select></label>;
}

function ErrorNotice({ message }: { message: string }) {
  return <p role="alert" className="mx-auto mt-5 max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-900 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">{message}</p>;
}

function Notice({ message, onClose }: { message: string; onClose: () => void }) {
  return <div role="status" className="mx-auto mt-5 flex max-w-3xl items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-50"><span>{message}</span><button type="button" onClick={onClose} aria-label="Cerrar aviso" className="rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><X size={15} /></button></div>;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'fecha no disponible';
  return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Guayaquil' }).format(date);
}

function readPlayerToken(pin: string): string | null {
  try {
    return window.localStorage.getItem(`${PLAYER_TOKEN_PREFIX}${pin}`);
  } catch {
    return null;
  }
}

function rememberPlayerToken(pin: string, token: string): void {
  try {
    window.localStorage.setItem(`${PLAYER_TOKEN_PREFIX}${pin}`, token);
  } catch {
    // The active room still works for this tab even when browser storage is unavailable.
  }
}

function forgetPlayerToken(pin: string): void {
  try {
    window.localStorage.removeItem(`${PLAYER_TOKEN_PREFIX}${pin}`);
  } catch {
    // Ignore storage restrictions and continue with a fresh join attempt.
  }
}

function messageFromError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (!message) return 'No pudimos completar la acción. Revisa tu conexión e inténtalo otra vez.';
  if (message.toLowerCase().includes('permission') || message.includes('42501')) return 'Tu cuenta no tiene permiso para realizar esta acción.';
  if (message.includes('live_quiz_') || message.includes('Could not find the function')) return 'La sala aún no está disponible en la base de datos. Hay que aplicar la migración de salas en Supabase.';
  return message;
}

