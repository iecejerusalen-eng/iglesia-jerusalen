import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import BlockRenderer from '../../../components/public/BlockRenderer';
import type { PageSection } from '../types';

interface GenericSectionProps {
  sectionData: PageSection;
}

export const GenericSection = ({ sectionData }: GenericSectionProps) => {
  const { title, subtitle, content_blocks } = sectionData;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
      {(title || subtitle) && (
        <AnimeFadeUp className="text-center max-w-2xl mx-auto space-y-3">
          {title && <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">{title}</h2>}
          {subtitle && <p className="text-slate-550 dark:text-slate-400 text-sm md:text-base leading-relaxed">{subtitle}</p>}
        </AnimeFadeUp>
      )}
      <AnimeFadeUp className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
        <BlockRenderer blocks={content_blocks} />
      </AnimeFadeUp>
    </section>
  );
};
