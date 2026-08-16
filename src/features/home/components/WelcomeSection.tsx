import BlockRenderer from '../../../components/public/BlockRenderer';
import ChurchJourneySection from '../../../components/public/ChurchJourneySection';
import MarqueeText from '../../../components/public/MarqueeText';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import type { PageSection } from '../types';
import PremiumDoctrineCards from './PremiumDoctrineCards';

interface WelcomeSectionProps {
  sectionData: PageSection;
}

export const WelcomeSection = ({ sectionData }: WelcomeSectionProps) => {
  const { title, subtitle, content_blocks } = sectionData;
  const hasEditorialContent = Array.isArray(content_blocks) && content_blocks.length > 0;

  return (
    <div id="about" className="pb-0">
      {hasEditorialContent ? (
        <section className="mx-auto max-w-7xl space-y-8 px-4 md:px-8">
          <AnimeFadeUp className="mx-auto max-w-2xl space-y-3 text-center">
            <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">{title || 'Nuestra Doctrina'}</h2>
            {subtitle && <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">{subtitle}</p>}
          </AnimeFadeUp>
          <AnimeFadeUp delay={100} className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60 dark:shadow-none md:p-12">
            <BlockRenderer blocks={content_blocks} />
          </AnimeFadeUp>
        </section>
      ) : (
        <PremiumDoctrineCards />
      )}

      <ChurchJourneySection />

      <div className="mt-16">
        <MarqueeText />
      </div>
    </div>
  );
};
