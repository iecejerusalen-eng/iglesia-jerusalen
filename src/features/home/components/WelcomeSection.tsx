import BlockRenderer from '../../../components/public/BlockRenderer';
import ChurchJourneySection from '../../../components/public/ChurchJourneySection';
import MarqueeText from '../../../components/public/MarqueeText';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeHoverCard } from '../../../components/animations/AnimeWrappers';
import BibleVerseLink from '../../../components/ui/BibleVerseLink';
import type { PageSection } from '../types';

interface WelcomeSectionProps {
  sectionData: PageSection;
}

export const WelcomeSection = ({ sectionData }: WelcomeSectionProps) => {
  const { title, subtitle, content_blocks } = sectionData;

  return (
    <div id="about" className="pb-0">
      {content_blocks && content_blocks.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
          <AnimeFadeUp className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">{title || 'Nuestra Doctrina'}</h2>
            {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed">{subtitle}</p>}
          </AnimeFadeUp>
          <AnimeFadeUp delay={0.1} className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
            <BlockRenderer blocks={content_blocks} />
          </AnimeFadeUp>
        </section>
      ) : (
        <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
          <AnimeFadeUp className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest bg-amber-100 dark:bg-amber-950/45 px-4 py-1.5 rounded-full">
              Verdades Centrales
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">Nuestra Doctrina</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
              Como Iglesia del Evangelio Cuadrangular, fundamentamos nuestra fe en cuatro grandes verdades bíblicas.
            </p>
          </AnimeFadeUp>

          <AnimeStaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pilar 1: Salvador */}
            <div>
              <AnimeHoverCard className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none hover:border-red-500/30 dark:hover:shadow-red-500/5 flex flex-col justify-between h-full group">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center font-bold text-xl group-hover:rotate-12 transition-transform duration-300">
                    ✝
                  </div>
                  <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-white text-left">Jesucristo Salvador</h3>
                  <p className="text-slate-550 dark:text-slate-350 text-xs leading-relaxed text-left">
                    El único camino al Padre, quien dio su vida en la cruz para perdonar nuestros pecados y otorgar salvación a todo el que cree.
                  </p>
                </div>
                <span className="text-[10px] font-extrabold text-red-500 dark:text-red-400 uppercase tracking-wider mt-6 block text-left font-mono">
                  <BibleVerseLink reference="Juan 3:16" />
                </span>
              </AnimeHoverCard>
            </div>

            {/* Pilar 2: Bautizador */}
            <div>
              <AnimeHoverCard className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none hover:border-amber-500/30 dark:hover:shadow-amber-500/5 flex flex-col justify-between h-full group">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400 rounded-2xl flex items-center justify-center font-bold text-xl group-hover:rotate-12 transition-transform duration-300">
                    🕊
                  </div>
                  <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-white text-left">Jesucristo Bautizador</h3>
                  <p className="text-slate-550 dark:text-slate-350 text-xs leading-relaxed text-left">
                    El dador del Espíritu Santo, capacitándonos con poder y dones para testificar y vivir una vida de santidad activa y con propósito.
                  </p>
                </div>
                <span className="text-[10px] font-extrabold text-amber-500 dark:text-amber-400 uppercase tracking-wider mt-6 block text-left font-mono">
                  <BibleVerseLink reference="Hechos 1:8" />
                </span>
              </AnimeHoverCard>
            </div>

            {/* Pilar 3: Sanador */}
            <div>
              <AnimeHoverCard className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none hover:border-blue-500/30 dark:hover:shadow-blue-500/5 flex flex-col justify-between h-full group">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400 rounded-2xl flex items-center justify-center font-bold text-xl group-hover:rotate-12 transition-transform duration-300">
                    🍷
                  </div>
                  <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-white text-left">Jesucristo Sanador</h3>
                  <p className="text-slate-550 dark:text-slate-350 text-xs leading-relaxed text-left">
                    El gran médico de almas y cuerpos, quien llevó todas nuestras dolencias y continúa sanando por medio de la fe el día de hoy.
                  </p>
                </div>
                <span className="text-[10px] font-extrabold text-blue-500 dark:text-blue-400 uppercase tracking-wider mt-6 block text-left font-mono">
                  <BibleVerseLink reference="Santiago 5:14-15" />
                </span>
              </AnimeHoverCard>
            </div>

            {/* Pilar 4: Rey */}
            <div>
              <AnimeHoverCard className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none hover:border-purple-500/30 dark:hover:shadow-purple-500/5 flex flex-col justify-between h-full group">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/30 text-purple-500 dark:text-purple-400 rounded-2xl flex items-center justify-center font-bold text-xl group-hover:rotate-12 transition-transform duration-300">
                    👑
                  </div>
                  <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-white text-left">El Rey que Viene</h3>
                  <p className="text-slate-550 dark:text-slate-350 text-xs leading-relaxed text-left">
                    El novio celestial que regresará con poder y gran gloria por su iglesia para reinar eternamente en victoria definitiva.
                  </p>
                </div>
                <span className="text-[10px] font-extrabold text-purple-500 dark:text-purple-400 uppercase tracking-wider mt-6 block text-left font-mono">
                  <BibleVerseLink reference="1 Ts. 4:16" />
                </span>
              </AnimeHoverCard>
            </div>
          </AnimeStaggerGrid>
        </section>
      )}
      
      <ChurchJourneySection />
      
      <div className="mt-16">
        <MarqueeText />
      </div>
    </div>
  );
};
