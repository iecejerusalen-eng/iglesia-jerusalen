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
          <div className="rounded-[2rem] border border-white/70 bg-white/75 p-3 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/75 md:p-4">
            <div className="flex flex-col gap-3 lg:grid lg:grid-cols-12 lg:auto-rows-[11.5rem]">
              <Link
                to={latestSermon ? '/predicas/' + latestSermon.id : '/predicas'}
                className="group min-h-[22rem] lg:col-span-6 lg:row-span-2"
              >
                <AnimeHoverCard className="relative h-full overflow-hidden rounded-[1.5rem] bg-[#081630] p-7 text-white md:p-9">
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
                      <span className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/10 transition group-hover:bg-amber-500">
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
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-white/85">
                        Escuchar ahora <ArrowUpRight size={16} />
                      </span>
                    </div>
                  </div>
                </AnimeHoverCard>
              </Link>

              <Link to="/eventos" className="group min-h-[15rem] lg:col-span-3 lg:row-span-2">
                <AnimeHoverCard className="relative flex h-full flex-col justify-between overflow-hidden rounded-[1.5rem] border border-amber-200/70 bg-amber-50/90 p-6 dark:border-amber-500/15 dark:bg-amber-950/25">
                  <div className="absolute -right-12 -top-10 h-36 w-36 rounded-full bg-amber-300/30 blur-3xl" />
                  <div className="relative flex items-start justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                      <CalendarDays size={20} />
                    </span>
                    <ArrowUpRight size={18} className="text-amber-700 transition group-hover:-translate-y-1 group-hover:translate-x-1 dark:text-amber-300" />
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

              <Link to="/ministerios" className="group min-h-[11.5rem] lg:col-span-3">
                <AnimeHoverCard className="flex h-full items-end justify-between overflow-hidden rounded-[1.5rem] border border-indigo-200/60 bg-indigo-50/90 p-6 dark:border-indigo-400/15 dark:bg-indigo-950/30">
                  <div className="space-y-3">
                    <Users size={23} className="text-indigo-600 dark:text-indigo-300" />
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Comunidad</p>
                      <h3 className="mt-1 font-serif text-xl font-black text-slate-900 dark:text-white">Encuentra tu lugar</h3>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="text-indigo-600 transition group-hover:-translate-y-1 group-hover:translate-x-1 dark:text-indigo-300" />
                </AnimeHoverCard>
              </Link>

              <Link to="/peticiones" className="group min-h-[11.5rem] lg:col-span-3">
                <AnimeHoverCard className="flex h-full items-end justify-between overflow-hidden rounded-[1.5rem] border border-rose-200/60 bg-rose-50/90 p-6 dark:border-rose-400/15 dark:bg-rose-950/25">
                  <div className="space-y-3">
                    <HeartHandshake size={23} className="text-rose-600 dark:text-rose-300" />
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-300">Estamos contigo</p>
                      <h3 className="mt-1 font-serif text-xl font-black text-slate-900 dark:text-white">Podemos orar por ti</h3>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="text-rose-600 transition group-hover:-translate-y-1 group-hover:translate-x-1 dark:text-rose-300" />
                </AnimeHoverCard>
              </Link>
            </div>
          </div>
        </AnimeFadeUp>
      </div>
    </section>
  );
};
