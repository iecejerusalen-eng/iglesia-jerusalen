import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarPlus, CheckCircle2, Clock3, Copy, Pencil, Play, RefreshCw, RotateCcw, Trash2, Trophy } from 'lucide-react';
import type { LiveQuizReplayConfiguration, LiveQuizRoomSummary, LiveQuizScoreMode } from './types';
import { LiveQuizSettingSwitch } from './LiveQuizSettingSwitch';

type RoomFilter = 'all' | 'active' | 'finished' | 'expired';

interface LiveQuizRoomManagementProps {
  rooms: LiveQuizRoomSummary[];
  activeRoomCount: number;
  activeRoomLimit: number;
  busy: boolean;
  onRefresh: () => void;
  onOpenRoom: (room: LiveQuizRoomSummary) => void;
  onEditRoom: (room: LiveQuizRoomSummary) => void;
  onCopyPin: (pin: string) => void;
  onExtendRoom: (roomId: string, days: number) => Promise<void>;
  onReplayRoom: (roomId: string, configuration: LiveQuizReplayConfiguration) => Promise<void>;
  onDeleteRoom: (room: LiveQuizRoomSummary) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function isExpired(room: LiveQuizRoomSummary): boolean {
  return room.status === 'expired';
}

function isFinished(room: LiveQuizRoomSummary): boolean {
  return room.status === 'finished' || (room.phase === 'finished' && !isExpired(room));
}

function isActive(room: LiveQuizRoomSummary): boolean {
  return !isExpired(room) && !isFinished(room) && (room.status === 'waiting' || room.status === 'in_progress');
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'fecha no disponible';
  return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function LiveQuizRoomManagement({
  rooms,
  activeRoomCount,
  activeRoomLimit,
  busy,
  onRefresh,
  onOpenRoom,
  onEditRoom,
  onCopyPin,
  onExtendRoom,
  onReplayRoom,
  onDeleteRoom,
}: LiveQuizRoomManagementProps) {
  const [filter, setFilter] = useState<RoomFilter>('all');
  const [roomToReplay, setRoomToReplay] = useState<LiveQuizRoomSummary | null>(null);
  const counts = useMemo(() => ({
    all: rooms.length,
    active: rooms.filter(isActive).length,
    finished: rooms.filter(isFinished).length,
    expired: rooms.filter(isExpired).length,
  }), [rooms]);
  const visibleRooms = useMemo(() => rooms.filter((room) => {
    if (filter === 'active') return isActive(room);
    if (filter === 'finished') return isFinished(room);
    if (filter === 'expired') return isExpired(room);
    return true;
  }), [filter, rooms]);

  return <section id="my-rooms" className="mt-8 scroll-mt-24 rounded-[1.75rem] border border-slate-200 bg-white/80 p-5 shadow-lg dark:border-white/10 dark:bg-slate-900/70 sm:p-7" aria-labelledby="my-rooms-heading">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-700 dark:text-amber-300">Panel de anfitrión</p>
        <h2 id="my-rooms-heading" className="mt-1 font-serif text-2xl font-bold sm:text-3xl">Mis salas <span className="font-sans text-sm font-bold text-slate-500 dark:text-slate-400">{activeRoomCount}/{activeRoomLimit} activas</span></h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Desde aquí puedes configurar, reactivar, editar preguntas y presentación, extender PIN, consultar resultados o eliminar una sala. Cada repetición conserva su propio PIN y sus resultados.</p>
      </div>
      <button type="button" onClick={onRefresh} disabled={busy} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 px-3 text-xs font-bold transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/40 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5 lg:self-auto">
        <RefreshCw size={14} className={busy ? 'animate-spin motion-reduce:animate-none' : ''} /> Actualizar salas
      </button>
    </div>

    <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filtrar salas">
      {([
        ['all', 'Todas'],
        ['active', 'Activas'],
        ['finished', 'Terminadas'],
        ['expired', 'Vencidas'],
      ] as const).map(([value, label]) => (
        <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-9 rounded-full border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/40 ${filter === value ? 'border-blue-950 bg-blue-950 text-white dark:border-amber-300 dark:bg-amber-300 dark:text-blue-950' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5'}`}>
          {label}<span className="ml-1.5 opacity-75">{counts[value]}</span>
        </button>
      ))}
    </div>

    {visibleRooms.length === 0 ? (
      <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center dark:border-white/15">
        <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-900 dark:bg-white/5 dark:text-amber-200"><Trophy size={20} /></div>
        <p className="mt-3 text-sm font-bold">{rooms.length === 0 ? 'Todavía no tienes salas guardadas' : 'No hay salas en este filtro'}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{rooms.length === 0 ? 'Al crear una sala, aparecerá aquí junto con sus opciones de edición y administración.' : 'Elige otra categoría para consultar tus salas.'}</p>
      </div>
    ) : (
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleRooms.map((room) => <RoomCard
          key={room.id}
          room={room}
          busy={busy}
          activeRoomCount={activeRoomCount}
          activeRoomLimit={activeRoomLimit}
          onOpen={() => onOpenRoom(room)}
          onEdit={() => onEditRoom(room)}
          onReplay={() => setRoomToReplay(room)}
          onCopy={() => onCopyPin(room.pin)}
          onExtend={(days) => onExtendRoom(room.id, days)}
          onDelete={() => onDeleteRoom(room)}
        />)}
      </div>
    )}

    <p className="mt-5 flex items-start gap-2 rounded-2xl bg-blue-50/80 p-4 text-xs leading-5 text-blue-950 dark:bg-blue-300/[.07] dark:text-blue-100"><CheckCircle2 size={15} className="mt-0.5 shrink-0" /> Puedes repetir una actividad todas las veces que quieras; cada repetición crea otra sala con PIN, participantes y resultados independientes. Se permiten {activeRoomLimit} salas activas al mismo tiempo y cada PIN puede durar hasta 365 días.</p>
    {roomToReplay && <ReplayRoomDialog room={roomToReplay} busy={busy} onClose={() => setRoomToReplay(null)} onSubmit={onReplayRoom} />}
  </section>;
}

function RoomCard({ room, busy, activeRoomCount, activeRoomLimit, onOpen, onEdit, onReplay, onCopy, onExtend, onDelete }: {
  room: LiveQuizRoomSummary;
  busy: boolean;
  activeRoomCount: number;
  activeRoomLimit: number;
  onOpen: () => void;
  onEdit: () => void;
  onReplay: () => void;
  onCopy: () => void;
  onExtend: (days: number) => Promise<void>;
  onDelete: () => void;
}) {
  const [extensionDays, setExtensionDays] = useState(30);
  const expired = isExpired(room);
  const finished = isFinished(room);
  const active = isActive(room);
  const editable = room.status === 'waiting' && room.phase === 'lobby';
  const maximumExpiry = new Date(new Date(room.created_at).getTime() + 365 * DAY_MS);
  const currentExpiry = new Date(room.expires_at);
  const canExtend = active
    && !Number.isNaN(currentExpiry.getTime())
    && !Number.isNaN(maximumExpiry.getTime())
    && currentExpiry.getTime() < maximumExpiry.getTime();
  const statusLabel = expired ? 'Venció · conservada' : finished ? 'Terminada · guardada' : room.status === 'in_progress' ? 'En juego' : 'En espera';
  const statusClass = expired
    ? 'bg-amber-100 text-amber-900 dark:bg-amber-300/10 dark:text-amber-200'
    : finished
      ? 'bg-blue-100 text-blue-900 dark:bg-blue-300/10 dark:text-blue-200'
      : room.status === 'in_progress'
        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-300/10 dark:text-emerald-200'
        : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200';

  return <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-black">{room.title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{room.player_count} participantes · {room.question_count} preguntas · {room.team_mode ? `${room.team_count || 2} equipos` : 'individual'} · {room.score_mode === 'accuracy' ? 'precisión' : 'ritmo'}</p>
        {room.replay_number > 0 && <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-900 dark:bg-amber-300/10 dark:text-amber-200">Repetición {room.replay_number}</span>}
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statusClass}`}>{statusLabel}</span>
    </div>

    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/[.04]">
      <div><p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">PIN</p><code className="font-mono text-lg font-black tracking-[.15em] text-blue-950 dark:text-amber-200">{room.pin}</code></div>
      <button type="button" onClick={onCopy} aria-label={`Copiar PIN ${room.pin}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/40 dark:border-white/10 dark:bg-slate-900"><Copy size={14} /> Copiar</button>
    </div>

    <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400"><Clock3 size={13} className="mt-0.5 shrink-0" />Creada {formatDate(room.created_at)}<br />Vigencia del PIN hasta {formatDate(room.expires_at)}</p>

    <div className="mt-4 grid gap-2">
      <button type="button" onClick={onOpen} disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-950 px-3 text-xs font-black text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/50 disabled:opacity-50 dark:bg-amber-300 dark:text-blue-950 dark:hover:bg-amber-200">
        {finished ? <Trophy size={15} /> : <Play size={15} fill="currentColor" />}{finished ? 'Ver resultados' : expired ? 'Ver estado de sala' : 'Abrir sala'}
      </button>
      {(finished || expired) && <button type="button" onClick={onReplay} disabled={busy || activeRoomCount >= activeRoomLimit} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-900 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100 dark:hover:bg-emerald-300/15"><RotateCcw size={15} /> Reactivar con ajustes</button>}
      {editable && <button type="button" onClick={onEdit} disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/40 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"><Pencil size={15} /> Editar preguntas y presentación</button>}
      {canExtend ? <div className="grid grid-cols-[1fr_auto] gap-2">
        <label className="sr-only" htmlFor={`extend-days-${room.id}`}>Días para extender la vigencia del PIN de {room.title}</label>
        <select id={`extend-days-${room.id}`} value={extensionDays} onChange={(event) => setExtensionDays(Number(event.target.value))} disabled={busy} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/40 disabled:opacity-50 dark:border-white/10 dark:bg-slate-950">
          <option value={7}>Añadir 7 días</option><option value={30}>Añadir 30 días</option><option value={90}>Añadir 90 días</option><option value={180}>Añadir 180 días</option>
        </select>
        <button type="button" onClick={() => void onExtend(extensionDays)} disabled={busy} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-blue-200 px-3 text-xs font-bold text-blue-900 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/40 disabled:opacity-50 dark:border-blue-300/20 dark:text-blue-100 dark:hover:bg-blue-300/10"><CalendarPlus size={14} /> Extender</button>
      </div> : active && <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-500 dark:bg-white/[.04] dark:text-slate-400">{currentExpiry.getTime() >= maximumExpiry.getTime() ? 'Esta sala ya alcanzó el máximo de vigencia de 365 días.' : 'El PIN solo puede extenderse antes de vencer.'}</p>}
      {finished && <p className="rounded-xl bg-blue-50 px-3 py-2 text-[11px] leading-5 text-blue-900 dark:bg-blue-300/[.07] dark:text-blue-100">La actividad y sus resultados permanecen guardados. Puedes eliminarlos cuando ya no los necesites.</p>}
      {expired && <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-950 dark:bg-amber-300/[.07] dark:text-amber-100">El PIN venció. El registro de la sala permanece disponible para que lo elimines.</p>}
      {(finished || expired) && activeRoomCount >= activeRoomLimit && <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-600 dark:bg-white/[.04] dark:text-slate-300">Libera un cupo de sala activa para poder reactivarla.</p>}
      <button type="button" onClick={onDelete} disabled={busy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 text-xs font-bold text-rose-800 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-400/40 disabled:opacity-50 dark:border-rose-300/20 dark:text-rose-200 dark:hover:bg-rose-300/10"><Trash2 size={14} /> Eliminar sala</button>
    </div>
  </article>;
}

function ReplayRoomDialog({ room, busy, onClose, onSubmit }: {
  room: LiveQuizRoomSummary;
  busy: boolean;
  onClose: () => void;
  onSubmit: (roomId: string, configuration: LiveQuizReplayConfiguration) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [lifetimeDays, setLifetimeDays] = useState(30);
  const [shuffleQuestions, setShuffleQuestions] = useState(room.settings.shuffle_questions);
  const [shuffleAnswers, setShuffleAnswers] = useState(room.settings.shuffle_answers);
  const [teamMode, setTeamMode] = useState(room.team_mode);
  const [teamCount, setTeamCount] = useState(room.team_count || 3);
  const [scoreMode, setScoreMode] = useState<LiveQuizScoreMode>(room.score_mode);
  const [reflectionPrompt, setReflectionPrompt] = useState(room.reflection_prompt ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!Number.isInteger(lifetimeDays) || lifetimeDays < 1 || lifetimeDays > 365) {
      setError('El PIN debe durar entre 1 y 365 días.');
      return;
    }
    if (teamMode && (teamCount < 2 || teamCount > 10)) {
      setError('Elige entre 2 y 10 equipos.');
      return;
    }
    if (reflectionPrompt.trim().length === 1 || reflectionPrompt.trim().length === 2) {
      setError('La pregunta para conversar debe tener al menos 3 caracteres.');
      return;
    }

    setError(null);
    try {
      await onSubmit(room.id, {
        lifetimeDays,
        settings: { shuffle_questions: shuffleQuestions, shuffle_answers: shuffleAnswers },
        teamMode,
        teamCount,
        scoreMode,
        reflectionPrompt: reflectionPrompt.trim() || null,
      });
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos reactivar la sala. Inténtalo otra vez.');
    }
  };

  return <dialog ref={dialogRef} aria-labelledby="live-quiz-replay-heading" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 m-auto max-h-[min(92dvh,860px)] w-[min(94vw,620px)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-0 text-slate-950 shadow-2xl backdrop:bg-slate-950/55 dark:border-white/10 dark:bg-slate-900 dark:text-white">
    <form onSubmit={(event) => void submit(event)} className="p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-900 dark:bg-emerald-300/10 dark:text-emerald-200"><RotateCcw size={19} /></span>
        <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-800 dark:text-emerald-300">Nueva sesión independiente</p><h2 id="live-quiz-replay-heading" className="mt-1 font-serif text-2xl font-bold">Reactivar «{room.title}»</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Se conservan las preguntas y la presentación. El PIN, los participantes y los resultados empezarán de nuevo en una sala aparte.</p></div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">Vigencia del PIN · 1 a 365 días<input autoFocus type="number" min={1} max={365} value={lifetimeDays} onChange={(event) => setLifetimeDays(Number(event.target.value))} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 dark:border-white/10 dark:bg-slate-950" /></label>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">Forma de puntuar<select value={scoreMode} onChange={(event) => setScoreMode(event.target.value === 'accuracy' ? 'accuracy' : 'speed')} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 dark:border-white/10 dark:bg-slate-950"><option value="speed">Ritmo · premia acertar rápido</option><option value="accuracy">Precisión · todos valen igual</option></select></label>
      </div>

      <fieldset className="mt-5 space-y-2">
        <legend className="mb-2 text-xs font-black uppercase tracking-[.12em] text-slate-500 dark:text-slate-400">Mezcla para esta sesión</legend>
        <LiveQuizSettingSwitch id={`replay-${room.id}-shuffle-questions`} title="Mezclar preguntas" description="El orden cambia al iniciar, sin alterar el editor guardado." checked={shuffleQuestions} onChange={setShuffleQuestions} />
        <LiveQuizSettingSwitch id={`replay-${room.id}-shuffle-answers`} title="Mezclar opciones" description="Las opciones cambian de lugar, pero la respuesta correcta se conserva." checked={shuffleAnswers} onChange={setShuffleAnswers} />
      </fieldset>

      <div className="mt-5 space-y-3">
        <LiveQuizSettingSwitch id={`replay-${room.id}-team-mode`} title="Competencia por equipos" description="Asigna a cada participante a un equipo y compara sus promedios." checked={teamMode} onChange={setTeamMode} />
        {teamMode && <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">Cantidad de equipos<select value={teamCount} onChange={(event) => setTeamCount(Number(event.target.value))} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 dark:border-white/10 dark:bg-slate-950">{Array.from({ length: 9 }, (_, index) => index + 2).map((count) => <option key={count} value={count}>{count} equipos equilibrados</option>)}</select></label>}
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200" htmlFor={`replay-${room.id}-reflection`}>Pregunta para conversar al final <span className="font-normal text-slate-500">(opcional)</span><textarea id={`replay-${room.id}-reflection`} value={reflectionPrompt} onChange={(event) => setReflectionPrompt(event.target.value.slice(0, 180))} maxLength={180} rows={2} placeholder="¿Qué enseñanza te llevas del reto?" className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 dark:border-white/10 dark:bg-slate-950" /></label>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold leading-5 text-rose-900 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-100">{error}</p>}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} disabled={busy} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/40 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5">Cancelar</button>
        <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 text-sm font-black text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/40 disabled:cursor-wait disabled:opacity-60 dark:bg-emerald-300 dark:text-emerald-950"><RotateCcw size={15} />{busy ? 'Creando nueva sala…' : 'Crear repetición y nuevo PIN'}</button>
      </div>
    </form>
  </dialog>;
}
