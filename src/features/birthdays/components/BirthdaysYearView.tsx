import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDays,
  ChevronRight,
  Gift,
  MessageCircle,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import type { BirthdayInfo } from '../hooks/useBirthdays';
import { MONTH_NAMES } from '../hooks/useBirthdays';
import { AnimeStaggerGrid } from '../../../components/animations/AnimeWrappers';

const MONTH_PREVIEW_LIMIT = 4;

interface BirthdaysYearViewProps {
  birthdays: BirthdayInfo[];
  onCelebrate: (name: string) => void;
  onMessage?: (birthday: BirthdayInfo) => void;
}

function getFullName(item: BirthdayInfo): string {
  return `${item.member.first_name} ${item.member.last_name}`.trim();
}

function BirthdayAvatar({ item, size = 'sm' }: { item: BirthdayInfo; size?: 'sm' | 'lg' }) {
  const fullName = getFullName(item);
  const initials = `${item.member.first_name[0] || ''}${item.member.last_name[0] || ''}`.toUpperCase();
  const sizeClass = size === 'lg' ? 'h-14 w-14 text-sm' : 'h-9 w-9 text-[10px]';

  return (
    <div className={`${sizeClass} shrink-0 overflow-hidden rounded-full bg-slate-100 font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-white/10`}>
      {item.member.photo_url ? (
        <img loading="lazy" src={item.member.photo_url} alt={`Foto de ${fullName}`} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center">{initials}</span>
      )}
    </div>
  );
}

function BirthdayQuickPreview({
  item,
  onCelebrate,
  onMessage,
}: {
  item: BirthdayInfo;
  onCelebrate: (name: string) => void;
  onMessage?: (birthday: BirthdayInfo) => void;
}) {
  const fullName = getFullName(item);

  return (
    <div className="pointer-events-none absolute left-11 right-0 top-[calc(100%+0.5rem)] z-30 hidden rounded-2xl border border-white/80 bg-white/95 p-4 text-left shadow-2xl backdrop-blur-2xl group-hover:pointer-events-auto group-hover:block group-focus-within:pointer-events-auto group-focus-within:block dark:border-white/10 dark:bg-slate-950/95">
      <div className="flex items-start gap-3">
        <BirthdayAvatar item={item} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-5 text-slate-900 dark:text-white">{fullName}</p>
          <p className="mt-0.5 text-xs text-church-gold-dark dark:text-church-gold-light">{item.formattedDate}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.member.ministry_name || 'Familia Jerusalén'}</p>
        </div>
      </div>
      {item.member.dedicated_verse && (
        <p className="mt-3 line-clamp-2 border-l-2 border-church-gold/40 pl-3 text-xs italic leading-5 text-slate-500 dark:text-slate-400">
          “{item.member.dedicated_verse}”
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => onCelebrate(fullName)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-white transition hover:bg-primary-dark">
          <Sparkles size={13} /> Celebrar
        </button>
        {onMessage && (
          <button type="button" onClick={() => onMessage(item)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300">
            <MessageCircle size={13} /> Mensaje
          </button>
        )}
      </div>
    </div>
  );
}

function BirthdayRow({
  item,
  onCelebrate,
  onMessage,
  showHoverPreview = false,
}: {
  item: BirthdayInfo;
  onCelebrate: (name: string) => void;
  onMessage?: (birthday: BirthdayInfo) => void;
  showHoverPreview?: boolean;
}) {
  const fullName = getFullName(item);

  return (
    <div className={`group relative flex min-w-0 items-center gap-3 rounded-2xl border p-2.5 transition ${item.isToday ? 'border-church-gold/35 bg-church-gold/10' : 'border-transparent hover:border-slate-200 hover:bg-white/70 dark:hover:border-white/10 dark:hover:bg-white/5'}`}>
      <div className="flex w-7 shrink-0 flex-col items-center">
        <span className={`text-xs font-black ${item.isToday ? 'text-accent-red' : 'text-slate-400'}`}>{item.day}</span>
      </div>
      <BirthdayAvatar item={item} />
      <button type="button" onClick={() => onCelebrate(fullName)} className="min-w-0 flex-1 text-left focus:outline-none" aria-label={`Celebrar a ${fullName}`}>
        <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{fullName}</span>
        <span className="mt-0.5 block truncate text-[11px] text-slate-400">{item.member.ministry_name || 'Familia Jerusalén'}</span>
      </button>
      {item.isToday && <span className="hidden rounded-full bg-church-gold/15 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-church-gold-dark dark:text-church-gold-light sm:inline">Hoy</span>}
      {showHoverPreview && <BirthdayQuickPreview item={item} onCelebrate={onCelebrate} onMessage={onMessage} />}
    </div>
  );
}

function MonthDialog({
  month,
  birthdays,
  onClose,
  onCelebrate,
  onMessage,
}: {
  month: number;
  birthdays: BirthdayInfo[];
  onClose: () => void;
  onCelebrate: (name: string) => void;
  onMessage?: (birthday: BirthdayInfo) => void;
}) {
  const [query, setQuery] = useState('');
  const filteredBirthdays = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    if (!normalized) return birthdays;
    return birthdays.filter((item) => `${getFullName(item)} ${item.member.ministry_name || ''}`.toLocaleLowerCase('es').includes(normalized));
  }, [birthdays, query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="birthday-month-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-[#f8fafc] shadow-2xl dark:bg-slate-950 sm:rounded-[2rem]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 p-5 dark:border-white/10 sm:p-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-church-gold-dark dark:text-church-gold-light"><CalendarDays size={13} /> Calendario anual</span>
            <h2 id="birthday-month-title" className="mt-1 font-serif text-2xl font-bold text-primary dark:text-white">Cumpleaños de {MONTH_NAMES[month - 1]}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{birthdays.length} persona{birthdays.length === 1 ? '' : 's'} registrada{birthdays.length === 1 ? '' : 's'}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-300" aria-label="Cerrar"><X size={19} /></button>
        </div>
        {birthdays.length > 6 && (
          <div className="border-b border-slate-200/80 px-5 py-4 dark:border-white/10 sm:px-6">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <span className="sr-only">Buscar en {MONTH_NAMES[month - 1]}</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o ministerio…" className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-church-gold/60 focus:ring-4 focus:ring-church-gold/10 dark:border-white/10 dark:bg-white/5 dark:text-white" />
            </label>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredBirthdays.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {filteredBirthdays.map((item) => <BirthdayRow key={item.member.id} item={item} onCelebrate={onCelebrate} onMessage={onMessage} />)}
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-slate-400">No encontramos coincidencias en este mes.</div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function BirthdaysYearView({ birthdays, onCelebrate, onMessage }: BirthdaysYearViewProps) {
  const [openMonth, setOpenMonth] = useState<number | null>(null);
  const currentMonth = new Date().getMonth() + 1;
  const birthdaysByMonth = useMemo(() => Array.from({ length: 12 }, (_, index) => birthdays
    .filter((birthday) => birthday.month === index + 1)
    .sort((a, b) => a.day - b.day || getFullName(a).localeCompare(getFullName(b), 'es'))), [birthdays]);

  if (birthdays.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/50 p-12 text-center shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/50">
        <Gift className="mx-auto mb-4 text-slate-300 dark:text-slate-600" size={48} />
        <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400">No hay cumpleaños registrados</h3>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/55 px-4 py-3 text-xs text-slate-500 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
        <span className="inline-flex items-center gap-2"><Users size={15} className="text-church-gold-dark dark:text-church-gold-light" /> Resumen anual: cada tarjeta muestra hasta {MONTH_PREVIEW_LIMIT} personas.</span>
        <span>Selecciona “Ver todos” para consultar meses con más registros.</span>
      </div>
      <AnimeStaggerGrid className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {birthdaysByMonth.map((monthBirthdays, index) => {
          const monthNum = index + 1;
          const isCurrentMonth = monthNum === currentMonth;
          const hiddenCount = Math.max(0, monthBirthdays.length - MONTH_PREVIEW_LIMIT);

          return (
            <section key={monthNum} className={`relative flex min-h-[18rem] flex-col rounded-[1.75rem] border bg-white/75 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl transition hover:z-20 hover:-translate-y-0.5 hover:shadow-xl focus-within:z-20 dark:bg-slate-900/75 ${isCurrentMonth ? 'border-church-gold/55 ring-1 ring-church-gold/20' : 'border-slate-200/80 dark:border-white/10'}`}>
              <div className={`flex items-center justify-between rounded-t-[1.75rem] border-b px-5 py-4 ${isCurrentMonth ? 'border-church-gold/20 bg-gradient-to-r from-church-gold/15 to-transparent' : 'border-slate-100 bg-slate-50/70 dark:border-white/5 dark:bg-slate-950/40'}`}>
                <div>
                  <h3 className={`font-serif text-xl font-bold ${isCurrentMonth ? 'text-church-gold-dark dark:text-church-gold-light' : 'text-slate-800 dark:text-slate-100'}`}>{MONTH_NAMES[index]}</h3>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{monthBirthdays.length} cumpleaño{monthBirthdays.length === 1 ? '' : 's'}</p>
                </div>
                <div className={`rounded-xl p-2 ${isCurrentMonth ? 'bg-church-gold/15 text-church-gold-dark dark:text-church-gold-light' : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}><CalendarDays size={17} /></div>
              </div>
              <div className="flex flex-1 flex-col p-3">
                {monthBirthdays.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-8 text-slate-400">
                    <Gift size={22} className="mb-2 opacity-45" />
                    <span className="text-sm italic">Ningún cumpleaños</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {monthBirthdays.slice(0, MONTH_PREVIEW_LIMIT).map((item) => <BirthdayRow key={item.member.id} item={item} onCelebrate={onCelebrate} onMessage={onMessage} showHoverPreview />)}
                  </div>
                )}
                {monthBirthdays.length > 0 && (
                  <button type="button" onClick={() => setOpenMonth(monthNum)} className="mt-auto flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/5 dark:text-blue-300 dark:hover:bg-white/5">
                    <span>{hiddenCount > 0 ? `Ver todos · ${hiddenCount} más` : 'Ver detalles del mes'}</span><ChevronRight size={15} />
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </AnimeStaggerGrid>
      {openMonth !== null && (
        <MonthDialog month={openMonth} birthdays={birthdaysByMonth[openMonth - 1]} onClose={() => setOpenMonth(null)} onCelebrate={onCelebrate} onMessage={onMessage} />
      )}
    </>
  );
}
