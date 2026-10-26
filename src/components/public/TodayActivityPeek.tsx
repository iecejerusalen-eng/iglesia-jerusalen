import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronRight, Clock3, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import type { Event as DbEvent } from '../../types';
import { formatEventTime, getLocalDateKey } from '../../features/events/utils/eventPresentation';

type TodayEvent = Pick<DbEvent, 'id' | 'title' | 'emoji' | 'start_date' | 'end_date' | 'start_time' | 'end_time'>;

async function getTodayEvents(): Promise<TodayEvent[]> {
  const today = getLocalDateKey(new Date());

  const { data, error } = await supabase
    .from('events')
    .select('id, title, emoji, start_date, end_date, start_time, end_time')
    .eq('is_public', true)
    .lte('start_date', today)
    .gte('end_date', today)
    .order('start_time', { ascending: true, nullsFirst: false })
    .limit(6);

  if (error) throw error;
  return (data || []) as TodayEvent[];
}

function formatTodayLabel(): string {
  return new Intl.DateTimeFormat('es-EC', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
}

export default function TodayActivityPeek() {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { data: events = [], isLoading, isError } = useQuery({
    queryKey: ['publicTodayActivity', getLocalDateKey(new Date())],
    queryFn: getTodayEvents,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setIsOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnOutsidePress);
    };
  }, [isOpen]);

  const label = useMemo(() => formatTodayLabel(), []);

  if (isLoading || isError || events.length === 0) return null;

  return (
    <aside ref={rootRef} className="fixed left-0 top-1/2 z-[70] max-w-[calc(100vw-0.25rem)] -translate-y-1/2" aria-label="Actividad de hoy">
      <div className="relative flex items-center">
        <button
          type="button"
          ref={triggerRef}
          aria-label={isOpen ? 'Cerrar actividad de hoy' : 'Ver actividad de hoy'}
          aria-expanded={isOpen}
          aria-controls="today-activity-panel"
          onClick={() => setIsOpen((open) => !open)}
          className="group flex items-center gap-2 rounded-r-2xl border border-l-0 border-church-gold-light/35 bg-slate-950/95 px-3 py-3 text-white shadow-[8px_12px_30px_-12px_rgba(2,6,23,.65)] backdrop-blur-xl transition-[transform,background-color] duration-200 hover:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-church-gold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950"
        >
          {isOpen ? <X size={16} aria-hidden="true" /> : <CalendarDays size={17} className="text-church-gold-bright" aria-hidden="true" />}
          {!isOpen && <span className="text-[10px] font-black uppercase tracking-[0.17em] [writing-mode:vertical-rl]">Hoy</span>}
        </button>

        <section
          id="today-activity-panel"
          aria-hidden={!isOpen}
          className={`max-h-[70dvh] origin-left overflow-y-auto rounded-r-[1.25rem] border border-l-0 border-slate-200/80 bg-white/95 shadow-[12px_18px_40px_-18px_rgba(15,23,42,.55)] backdrop-blur-xl transition-[opacity,transform,visibility] duration-200 dark:border-white/10 dark:bg-slate-900/95 motion-reduce:transition-none ${isOpen ? 'visible translate-x-0 opacity-100' : 'invisible -translate-x-3 opacity-0'}`}
        >
          <div className="w-[min(21rem,calc(100vw-3rem))] p-4">
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-white/10">
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-church-gold-dark dark:text-church-gold-bright">
                  <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" /> En agenda
                </p>
                <h2 className="mt-1 font-serif text-xl font-black capitalize leading-tight text-slate-950 dark:text-white">{label}</h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500 dark:bg-white/10 dark:text-slate-300">{events.length}</span>
                <button type="button" onClick={() => { setIsOpen(false); triggerRef.current?.focus(); }} aria-label="Cerrar actividad de hoy" className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
                  <X size={17} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="max-h-[min(22rem,60vh)] space-y-2 overflow-y-auto pr-1">
              {events.map((event) => (
                <Link
                  key={event.id}
                  to={`/eventos?event=${event.id}`}
                  onClick={() => setIsOpen(false)}
                  tabIndex={isOpen ? 0 : -1}
                  className="group block rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 transition-colors hover:border-church-gold-light/60 hover:bg-amber-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-church-gold-light dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-amber-400/10"
                >
                  <div className="flex gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-lg shadow-sm dark:bg-church-gold-dark" aria-hidden="true">{event.emoji || '•'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="line-clamp-2 text-sm font-extrabold leading-snug text-slate-900 dark:text-white">{event.title}</span>
                        <ChevronRight size={15} className="mt-0.5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                      <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1"><Clock3 size={12} /> {formatEventTime(event.start_time, event.end_time)}</span>
                      </span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <Link to="/eventos" onClick={() => setIsOpen(false)} tabIndex={isOpen ? 0 : -1} className="mt-3 flex items-center justify-between rounded-lg px-1 text-xs font-black text-primary transition-colors hover:text-church-gold-dark dark:text-blue-300 dark:hover:text-church-gold-bright">
              Ver calendario completo <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </aside>
  );
}
