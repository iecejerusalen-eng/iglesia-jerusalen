import { useMemo, useState } from 'react';
import { CalendarPlus, CheckCircle2, Clock3, Copy, Pencil, Play, RefreshCw, Trash2, Trophy } from 'lucide-react';
import type { LiveQuizRoomSummary } from './types';

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
  onDeleteRoom,
}: LiveQuizRoomManagementProps) {
  const [filter, setFilter] = useState<RoomFilter>('all');
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
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Desde aquí puedes editar preguntas y presentación, extender el PIN de una sala activa, consultar resultados o eliminar una sala. Las actividades terminadas se conservan hasta que tú las elimines.</p>
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
          onOpen={() => onOpenRoom(room)}
          onEdit={() => onEditRoom(room)}
          onCopy={() => onCopyPin(room.pin)}
          onExtend={(days) => onExtendRoom(room.id, days)}
          onDelete={() => onDeleteRoom(room)}
        />)}
      </div>
    )}

    <p className="mt-5 flex items-start gap-2 rounded-2xl bg-blue-50/80 p-4 text-xs leading-5 text-blue-950 dark:bg-blue-300/[.07] dark:text-blue-100"><CheckCircle2 size={15} className="mt-0.5 shrink-0" /> El límite es de {activeRoomLimit} salas activas a la vez. Una sala terminada conserva el PIN y sus resultados, pero ya no admite nuevas respuestas. La vigencia de un PIN nunca supera 365 días desde la creación.</p>
  </section>;
}

function RoomCard({ room, busy, onOpen, onEdit, onCopy, onExtend, onDelete }: {
  room: LiveQuizRoomSummary;
  busy: boolean;
  onOpen: () => void;
  onEdit: () => void;
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
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{room.player_count} participantes · {room.question_count} preguntas · {room.team_mode ? 'equipos' : 'individual'} · {room.score_mode === 'accuracy' ? 'precisión' : 'ritmo'}</p>
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
      <button type="button" onClick={onDelete} disabled={busy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 text-xs font-bold text-rose-800 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-400/40 disabled:opacity-50 dark:border-rose-300/20 dark:text-rose-200 dark:hover:bg-rose-300/10"><Trash2 size={14} /> Eliminar sala</button>
    </div>
  </article>;
}
