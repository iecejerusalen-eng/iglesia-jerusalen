import { Clock } from 'lucide-react';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeHoverCard } from '../../../components/animations/AnimeWrappers';
import type { Schedule } from '../../../types';
import type { PageSection } from '../types';

interface SchedulesSectionProps {
  sectionData: PageSection;
  schedules: Schedule[];
  loading: boolean;
}

export const SchedulesSection = ({ sectionData, schedules, loading }: SchedulesSectionProps) => {
  const { title, subtitle } = sectionData;
  const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const schedulesByDay: Record<string, Schedule[]> = {};

  schedules.forEach((sch) => {
    const day = sch.day || 'Otros';
    if (!schedulesByDay[day]) {
      schedulesByDay[day] = [];
    }
    schedulesByDay[day].push(sch);
  });

  const sortedDays = DAYS_ORDER.filter(
    (day) => schedulesByDay[day] && schedulesByDay[day].length > 0
  );

  return (
    <section id="schedules" className="bg-slate-50 dark:bg-slate-950 py-16 border-y border-slate-200 dark:border-white/10 scroll-mt-24 relative overflow-hidden transition-colors duration-300 !mt-0">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-church-gold-light/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-16 relative z-10">
        <AnimeFadeUp className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs font-bold text-church-gold-dark dark:text-church-gold-bright uppercase tracking-widest bg-amber-100/50 dark:bg-amber-950/20 px-4 py-1.5 rounded-full">
            Reuniones y Servicios
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white">
            {title || 'Horarios de Reunión'}
          </h2>
          {subtitle && (
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
              {subtitle}
            </p>
          )}
        </AnimeFadeUp>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-church-gold-medium"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            <AnimeStaggerGrid className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedDays
                .filter((day) => day !== 'Domingo')
                .map((day) => {
                  const daySchedules = schedulesByDay[day];
                  return (
                    <div key={day}>
                      <AnimeHoverCard
                        className="h-full bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none hover:shadow-xl dark:hover:shadow-church-gold-light/5 hover:border-church-gold-light/30 transition-all flex flex-col justify-between relative overflow-hidden pl-8 animate-all"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gold-gradient" />
                        
                        <div>
                          <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3 mb-4">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">
                              {day}
                            </span>
                            <span className="text-xs font-bold text-church-gold-dark dark:text-church-gold-bright flex items-center gap-1.5">
                              <Clock size={13} className="text-church-gold-medium" />
                              {daySchedules[0]?.time_range}
                            </span>
                          </div>

                          <div className="space-y-2 text-left">
                            <h4 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100">
                              {daySchedules[0]?.title}
                            </h4>
                            <p className="text-slate-550 dark:text-slate-400 text-xs leading-relaxed">
                              {daySchedules[0]?.description}
                            </p>
                          </div>
                        </div>
                      </AnimeHoverCard>
                    </div>
                  );
                })}
            </AnimeStaggerGrid>

            {schedulesByDay['Domingo'] && (
              <div className="lg:col-span-1">
                <AnimeFadeUp className="h-full">
                  <AnimeHoverCard
                    className="h-full bg-gold-gradient text-slate-950 p-8 rounded-3xl border border-church-gold-bright/35 shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_25px_50px_rgba(157,102,14,0.4)] transition-all duration-500"
                  >
                    {/* Modern background design with glowing blobs and micro-patterns */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl select-none">
                      {/* Glowing abstract blobs */}
                      <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/25 blur-3xl rounded-full animate-pulse" style={{ animationDuration: '6s' }} />
                      <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-black/10 blur-3xl rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
                      
                      {/* Premium fine dot grid pattern */}
                      <div 
                        className="absolute inset-0 opacity-10 mix-blend-overlay"
                        style={{
                          backgroundImage: 'radial-gradient(circle, black 1px, transparent 1px)',
                          backgroundSize: '16px 16px'
                        }}
                      />
                    </div>

                    <div className="space-y-6 relative z-10">
                      <div className="border-b border-black/15 pb-4 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white bg-slate-950 px-3.5 py-1.5 rounded-lg shadow-sm">
                          Domingo
                        </span>
                        <span className="text-xs font-bold text-slate-900/80 font-serif italic">
                          Día del Señor
                        </span>
                      </div>

                      <div className="space-y-4">
                        {schedulesByDay['Domingo'].map((sch) => (
                          <div 
                            key={sch.id} 
                            className="bg-white/25 hover:bg-white/40 border border-white/20 p-4 rounded-2xl shadow-xxs hover:shadow-xs transition-all duration-300 hover:-translate-y-0.5 text-left group/item"
                          >
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center gap-2 flex-wrap">
                                <h5 className="font-serif font-black text-sm md:text-base text-slate-950">
                                  {sch.title}
                                </h5>
                                <span className="text-[9px] font-extrabold text-slate-950 bg-white/40 px-2 py-0.5 rounded-md border border-slate-950/10">
                                  {sch.time_range}
                                </span>
                              </div>
                              <p className="text-slate-900/90 text-xs font-semibold leading-relaxed">
                                {sch.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-black/15 pt-6 mt-8 space-y-4 relative z-10">
                      <div className="flex items-start gap-3 bg-white/20 border border-white/35 p-4 rounded-2xl shadow-xxs hover:bg-white/30 transition-all duration-300">
                        <div className="text-slate-950 mt-0.5 shrink-0 bg-white/30 p-2 rounded-xl border border-white/40 shadow-xxs flex items-center justify-center">
                          {/* Cup and bread SVG (Santa Cena) */}
                          <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M17 2H7c0 4 3 6 5 6s5-2 5-6Z" />
                            <path d="M12 8v10M9 22h6" />
                            <circle cx="17" cy="12" r="2" className="fill-current/10" />
                          </svg>
                        </div>
                        <div className="space-y-0.5 text-left">
                          <span className="text-xs font-extrabold text-slate-950 uppercase tracking-wider block">
                            Santa Cena
                          </span>
                          <p className="text-slate-900/90 text-[11px] leading-relaxed font-semibold">
                            El <span className="font-bold text-slate-950">primer domingo</span> de cada mes celebramos en todas las plenarias.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-white/20 border border-white/35 p-4 rounded-2xl shadow-xxs hover:bg-white/30 transition-all duration-300">
                        <div className="text-slate-950 mt-0.5 shrink-0 bg-white/30 p-2 rounded-xl border border-white/40 shadow-xxs flex items-center justify-center">
                          {/* Globe SVG (Misiones) */}
                          <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
                          </svg>
                        </div>
                        <div className="space-y-0.5 text-left">
                          <span className="text-xs font-extrabold text-slate-950 uppercase tracking-wider block">
                            Culto Misionero
                          </span>
                          <p className="text-slate-900/90 text-[11px] leading-relaxed font-semibold">
                            El <span className="font-bold text-slate-950">tercer domingo</span> de cada mes está dedicado a misiones globales.
                          </p>
                        </div>
                      </div>
                    </div>
                  </AnimeHoverCard>
                </AnimeFadeUp>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
