import { ArrowRight, CalendarDays, Megaphone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ChurchAnnouncement } from '../types';

interface ChurchAnnouncementsSectionProps {
  announcements: ChurchAnnouncement[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  limit?: number;
  viewAll?: boolean;
}

const formatDate = (value: string) => new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(new Date(`${value}T12:00:00`));

const formatEventDate = (announcement: ChurchAnnouncement) => {
  const event = announcement.event;
  if (!event) return null;
  const date = event.start_date === event.end_date
    ? formatDate(event.start_date)
    : `${formatDate(event.start_date)} – ${formatDate(event.end_date)}`;
  const time = event.start_time ? ` · ${event.start_time.slice(0, 5)}` : '';
  return `${date}${time}`;
};

export const AnnouncementCard = ({ announcement }: { announcement: ChurchAnnouncement }) => (
  <article id={announcement.id} className="group flex h-full scroll-mt-24 flex-col overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white/85 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.05]">
    <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#081735] via-[#102b61] to-[#1d4ed8]">
      {announcement.image_url ? (
        <img src={announcement.image_url} alt={announcement.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      ) : (
        <div className="grid h-full place-items-center text-white/50"><Megaphone size={48} /></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-amber-200/25 bg-slate-950/60 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-amber-200 backdrop-blur-xl">
        <Megaphone size={13} /> Anuncio importante
      </span>
      {announcement.is_featured && <span className="absolute right-4 top-4 rounded-full bg-amber-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-950">Destacado</span>}
    </div>
    <div className="flex flex-1 flex-col p-5">
      <h3 className="font-serif text-xl font-black text-slate-950 dark:text-white">{announcement.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{announcement.summary || announcement.body}</p>
      {announcement.event && (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/80 p-3 dark:border-blue-400/15 dark:bg-blue-400/[0.08]">
          <div className="flex items-start gap-2 text-xs font-bold text-blue-900 dark:text-blue-100">
            <CalendarDays size={15} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-300" />
            <Link to={`/eventos#${announcement.event.id}`} className="hover:underline">{announcement.event.title} · {formatEventDate(announcement)}</Link>
          </div>
          {announcement.event.location_name && <div className="mt-1 flex items-center gap-2 text-[11px] text-blue-700/75 dark:text-blue-200/70"><MapPin size={13} /> {announcement.event.location_name}</div>}
        </div>
      )}
      <div className="mt-auto pt-5">
        <Link to={`/anuncios#${announcement.id}`} className="inline-flex items-center gap-2 text-xs font-black text-blue-700 transition hover:gap-3 dark:text-amber-300">
          Ver anuncio <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  </article>
);

export const ChurchAnnouncementsSection = ({
  announcements,
  loading = false,
  title = 'Anuncios importantes',
  subtitle = 'Información oficial de la Iglesia Jerusalén y sus próximas actividades.',
  limit = 3,
  viewAll = true,
}: ChurchAnnouncementsSectionProps) => {
  const items = announcements.slice(0, limit);
  if (!loading && items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 md:px-8" aria-labelledby="church-announcements-title">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-amber-600 dark:text-amber-300">Comunicados de la iglesia</p>
          <h2 id="church-announcements-title" className="mt-2 font-serif text-3xl font-black text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        {viewAll && <Link to="/anuncios" className="inline-flex items-center gap-2 text-xs font-black text-blue-700 dark:text-amber-300">Ver todos <ArrowRight size={15} /></Link>}
      </div>
      {loading ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-[28rem] animate-pulse rounded-[1.6rem] bg-slate-200 dark:bg-white/5" />)}</div> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map((announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} />)}</div>}
    </section>
  );
};
