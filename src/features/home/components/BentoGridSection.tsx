import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  HeartHandshake,
  Play,
  Users,
} from 'lucide-react';
import { AnimeFadeUp, AnimeHoverCard } from '../../../components/animations/AnimeWrappers';
import type { Sermon, Event as DbEvent } from '../../../types';
import { getYoutubeId } from '../utils';

interface BentoGridSectionProps {
  latestSermon?: Sermon;
  nextEvent?: DbEvent;
}

const formatEventDate = (dateValue: string) => {
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'short',
  });
};

const getSermonThumbnail = (sermon: Sermon) => {
  if (sermon.thumbnail_url) return sermon.thumbnail_url;
  const videoUrl = sermon.youtube_url || sermon.video_url;
  const youtubeId = videoUrl ? getYoutubeId(videoUrl) : null;
  return youtubeId ? 'https://img.youtube.com/vi/' + youtubeId + '/maxresdefault.jpg' : null;
};

export const BentoGridSection = ({ latestSermon, nextEvent }: BentoGridSectionProps) => {
  const sermonThumbnail = latestSermon ? getSermonThumbnail(latestSermon) : null;

  return (
    <section aria-labelledby="home-highlights-title" className="relative z-10 -mt-12 px-4 md:px-8">
      <div className="mx-auto max-w-7xl">
        <AnimeFadeUp>
          <div className="rounded-[2rem] border border-white/80 bg-white/78 p-2.5 shadow-[0_28px_90px_-36px_rgba(15,23,42,0.42)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/78 md:p-3.5">
            <div className="flex flex-col gap-3 lg:grid lg:grid-cols-12 lg:auto-rows-[11.5rem]">
              <Link
                to={latestSermon ? '/predicas/' + latestSermon.id : '/predicas'}
                aria-label={latestSermon ? `Escuchar prédica: ${latestSermon.title}` : 'Explorar las últimas prédicas'}
                className="group min-h-[22rem] rounded-[1.5rem] outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-300 dark:focus-visible:ring-offset-slate-900 lg:col-span-6 lg:row-span-2"
              >
                <AnimeHoverCard className="relative h-full overflow-hidden rounded-[1.5rem] bg-[#081630] p-7 text-white md:p-9">
                  <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-blue-500/20 blur-3xl transition duration-700 group-hover:bg-amber-400/20" />
                  <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
                  {sermonThumbnail && (
                    <img
                      src={sermonThumbnail}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-40 transition duration-700 group-hover:scale-105 group-hover:opacity-30"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07132f] via-[#07132f]/75 to-[#07132f]/15" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] backdrop-blur-md">
                        <BookOpen size={13} className="text-amber-400" />
                        Mensaje reciente
                      </span>
                      <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/10 transition duration-300 group-hover:scale-105 group-hover:bg-amber-500 group-focus-visible:bg-amber-500">
                        <Play size={17} fill="currentColor" />
                      </span>
                    </div>
                    <div className="max-w-lg space-y-3">
                      <p className="text-xs font-semibold text-amber-300">
                        {latestSermon?.pastor_name || 'Recursos para crecer en la fe'}
                      </p>
                      <h2 id="home-highlights-title" className="font-serif text-3xl font-black leading-tight md:text-4xl">
                        {latestSermon?.title || 'Explora nuestros últimos mensajes'}
                      </h2>
                      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-sm font-bold text-white/90 backdrop-blur-md transition group-hover:border-amber-300/40 group-hover:bg-amber-400 group-hover:text-slate-950">
                        Escuchar ahora <ArrowUpRight size={16} />
                      </span>
                    </div>
                  </div>
                </AnimeHoverCard>
              </Link>

              <Link to="/eventos" aria-label={nextEvent ? `Ver evento: ${nextEvent.title}` : 'Consultar el calendario de eventos'} className="group min-h-[15rem] rounded-[1.5rem] outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-amber-300 dark:focus-visible:ring-offset-slate-900 lg:col-span-3 lg:row-span-2">
                <AnimeHoverCard className="relative flex h-full flex-col justify-between overflow-hidden rounded-[1.5rem] border border-amber-200/70 bg-amber-50/90 p-6 dark:border-amber-500/15 dark:bg-amber-950/25">
                  <div className="absolute -right-12 -top-10 h-36 w-36 rounded-full bg-amber-300/30 blur-3xl" />
                  <div className="relative flex items-start justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20 transition duration-300 group-hover:rotate-3 group-hover:scale-105">
                      <CalendarDays size={20} />
                    </span>
                    <span aria-hidden="true" className="grid size-9 place-items-center rounded-full border border-amber-700/15 text-amber-700 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:bg-amber-500 group-hover:text-white dark:border-amber-300/15 dark:text-amber-300"><ArrowUpRight size={17} /></span>
                  </div>
                  <div className="relative space-y-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                      Próximo encuentro
                    </span>
                    <h3 className="font-serif text-2xl font-black leading-tight text-slate-900 dark:text-white">
                      {nextEvent?.title || 'Consulta nuestro calendario'}
                    </h3>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {nextEvent ? formatEventDate(nextEvent.start_date) : 'Actividades para toda la familia'}
                      {nextEvent?.start_time ? ' · ' + nextEvent.start_time.slice(0, 5) : ''}
                    </p>
                  </div>
                </AnimeHoverCard>
              </Link>

              <Link to="/ministerios" aria-label="Encontrar un ministerio" className="group min-h-[11.5rem] rounded-[1.5rem] outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-indigo-300 dark:focus-visible:ring-offset-slate-900 lg:col-span-3">
                <AnimeHoverCard className="relative flex h-full items-end justify-between overflow-hidden rounded-[1.5rem] border border-indigo-200/60 bg-indigo-50/90 p-6 dark:border-indigo-400/15 dark:bg-indigo-950/30">
                  <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-indigo-300/25 blur-3xl" />
                  <div className="space-y-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-white/75 text-indigo-600 shadow-sm transition duration-300 group-hover:-rotate-3 group-hover:scale-105 dark:bg-white/10 dark:text-indigo-300"><Users size={23} /></span>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Comunidad</p>
                      <h3 className="mt-1 font-serif text-xl font-black text-slate-900 dark:text-white">Encuentra tu lugar</h3>
                    </div>
                  </div>
                  <span aria-hidden="true" className="grid size-9 place-items-center rounded-full border border-indigo-300/30 text-indigo-600 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:bg-indigo-600 group-hover:text-white dark:border-indigo-300/20 dark:text-indigo-300"><ArrowUpRight size={18} /></span>
                </AnimeHoverCard>
              </Link>

              <Link to="/peticiones" aria-label="Enviar una petición de oración" className="group min-h-[11.5rem] rounded-[1.5rem] outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-rose-300 dark:focus-visible:ring-offset-slate-900 lg:col-span-3">
                <AnimeHoverCard className="relative flex h-full items-end justify-between overflow-hidden rounded-[1.5rem] border border-rose-200/60 bg-rose-50/90 p-6 dark:border-rose-400/15 dark:bg-rose-950/25">
                  <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-rose-300/25 blur-3xl" />
                  <div className="space-y-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-white/75 text-rose-600 shadow-sm transition duration-300 group-hover:rotate-3 group-hover:scale-105 dark:bg-white/10 dark:text-rose-300"><HeartHandshake size={23} /></span>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-300">Estamos contigo</p>
                      <h3 className="mt-1 font-serif text-xl font-black text-slate-900 dark:text-white">Podemos orar por ti</h3>
                    </div>
                  </div>
                  <span aria-hidden="true" className="grid size-9 place-items-center rounded-full border border-rose-300/30 text-rose-600 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:bg-rose-600 group-hover:text-white dark:border-rose-300/20 dark:text-rose-300"><ArrowUpRight size={18} /></span>
                </AnimeHoverCard>
              </Link>
            </div>
          </div>
        </AnimeFadeUp>
      </div>
    </section>
  );
};
