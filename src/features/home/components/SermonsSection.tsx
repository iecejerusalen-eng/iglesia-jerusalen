import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Headphones, UserRound } from 'lucide-react';
import { AnimeFadeUp, AnimeStaggerGrid } from '../../../components/animations/AnimeWrappers';
import type { Sermon } from '../../../types';
import type { PageSection } from '../types';
import { getYoutubeId } from '../utils';

interface SermonsSectionProps {
  sectionData: PageSection;
  sermons: Sermon[];
  loading: boolean;
}

export const SermonsSection = ({ sectionData, sermons, loading }: SermonsSectionProps) => {
  const { title, subtitle } = sectionData;
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>(() => {
    if (typeof window === 'undefined') return 'desktop';
    if (window.innerWidth < 640) return 'mobile';
    if (window.innerWidth < 1024) return 'tablet';
    return 'desktop';
  });
  const [failedCovers, setFailedCovers] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const updateViewport = () => {
      const nextViewport = window.innerWidth < 640
        ? 'mobile'
        : window.innerWidth < 1024 ? 'tablet' : 'desktop';
      setViewport((current) => current === nextViewport ? current : nextViewport);
    };

    window.addEventListener('resize', updateViewport, { passive: true });
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const formatDate = (dateStr: string) => {
    const dateOnlyMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = dateOnlyMatch
      ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
      : new Date(dateStr);
    return date.toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCompactDate = (dateStr: string) => {
    const dateOnlyMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = dateOnlyMatch
      ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
      : new Date(dateStr);
    return date.toLocaleDateString('es-EC', { year: '2-digit', month: 'short', day: 'numeric' });
  };

  const sermonMedia = useMemo(() => sermons.map((sermon) => {
    const youtubeId = getYoutubeId(sermon.youtube_url);
    return {
      sermon,
      youtubeId,
      imageUrl: failedCovers.has(sermon.id) ? null : sermon.metadata?.cover_image_url || (youtubeId
        ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
        : null),
    };
  }), [failedCovers, sermons]);

  const baseCount = viewport === 'mobile' ? 4 : viewport === 'tablet' ? 6 : 8;
  const maxCount = viewport === 'mobile' ? 8 : 12;
  const compactCardsInBase = sermonMedia
    .slice(0, baseCount)
    .filter(({ imageUrl }) => !imageUrl).length;
  const visibleCount = Math.min(sermonMedia.length, baseCount + compactCardsInBase, maxCount);
  const visibleSermons = sermonMedia.slice(0, visibleCount);

  return (
    <section id="sermons" className="bg-slate-50 dark:bg-[#0a0f1d] py-16 border-y border-slate-200 dark:border-white/5 scroll-mt-24 transition-colors duration-300 !mt-0 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="space-y-3 text-left">
            <AnimeFadeUp>
              <h2 className="editorial-heading-accent text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">
                {title || 'Últimos Mensajes'}
              </h2>
            </AnimeFadeUp>
            {subtitle && (
              <AnimeFadeUp delay={0.1}>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xl">
                  {subtitle}
                </p>
              </AnimeFadeUp>
            )}
          </div>
          <AnimeFadeUp delay={0.2}>
            <Link
              to="/predicas"
              className="text-church-gold-emphasis hover:brightness-90 dark:hover:brightness-110 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all whitespace-nowrap"
            >
              Ver Todos los Mensajes
              <ArrowRight size={16} />
            </Link>
          </AnimeFadeUp>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <AnimeStaggerGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 items-start gap-3 sm:gap-5 lg:gap-6">
            {visibleSermons.map(({ sermon, imageUrl, youtubeId }, index) => {
              const hasImage = !!imageUrl;
              const sermonDate = sermon.date || sermon.created_at;
              return (
                <Link
                  key={sermon.id}
                  to={`/predicas/${sermon.id}`}
                  aria-label={`Ver prédica: ${sermon.title}`}
                  className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-church-gold-emphasis hover:shadow-xl hover:shadow-slate-900/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/60 dark:border-white/10 dark:bg-slate-900 ${hasImage ? '' : 'min-h-[150px] sm:min-h-[170px]'}`}
                >
                  {hasImage ? (
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                      <img
                        loading={index < 4 ? 'eager' : 'lazy'}
                        fetchPriority={index === 0 ? 'high' : 'auto'}
                        decoding="async"
                        src={imageUrl ?? undefined}
                        alt={`Miniatura de la prédica: ${sermon.title}`}
                        sizes="(max-width: 639px) 46vw, (max-width: 1023px) 30vw, 23vw"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        onError={(event) => {
                          const image = event.currentTarget;
                          if (youtubeId && !image.dataset.fallback) {
                            image.dataset.fallback = 'true';
                            image.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                          } else {
                            setFailedCovers((current) => {
                              if (current.has(sermon.id)) return current;
                              const next = new Set(current);
                              next.add(sermon.id);
                              return next;
                            });
                          }
                        }}
                      />
                      <span aria-hidden="true" className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-slate-950/65 text-white backdrop-blur-sm">
                        <Headphones size={15} />
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 pt-4 text-amber-700 dark:text-amber-300">
                      <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-church-gold-emphasis-soft text-church-gold-emphasis">
                        <Headphones size={17} />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Prédica reciente</span>
                    </div>
                  )}

                  <div className={`flex flex-1 flex-col ${hasImage ? 'p-3 sm:p-4' : 'px-4 pb-4 pt-3'}`}>
                    <h3 className="line-clamp-3 font-serif text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-800 dark:text-white dark:group-hover:text-amber-200 sm:text-base">
                      {sermon.title}
                    </h3>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-slate-100 pt-2.5 text-[10px] font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400 sm:text-xs">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <UserRound size={13} className="shrink-0" />
                        <span className="truncate">{sermon.pastor_name}</span>
                      </span>
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <CalendarDays size={12} />
                        <time dateTime={sermonDate}>
                          <span className="sm:hidden">{formatCompactDate(sermonDate)}</span>
                          <span className="hidden sm:inline">{formatDate(sermonDate)}</span>
                        </time>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </AnimeStaggerGrid>
        )}
      </div>
    </section>
  );
};
