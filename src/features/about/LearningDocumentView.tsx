import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight, BookOpenText } from 'lucide-react';
import BlockRenderer from '../../components/public/BlockRenderer';
import PrinciplesOfFaith from '../../components/public/PrinciplesOfFaith';
import FoursquareHymn from '../../components/public/about/FoursquareHymn';
import BibleVerseLink from '../../components/ui/BibleVerseLink';
import { learningTopics } from './learningContent';
import type { LearningDocument, PublishedLearningDocument } from './learningDocument';
import LearningProgress from './LearningProgress';
import LearningQuiz from './LearningQuiz';
import LearningMedia from './LearningMedia';

export default function LearningDocumentView({ document, published, preview = false }: { document: LearningDocument; published?: PublishedLearningDocument; preview?: boolean }) {
  const { slug, content } = document;
  const Heading = preview ? 'h2' : 'h1';
  const position = learningTopics.findIndex(item => item.slug === slug);
  const previous = learningTopics[position - 1]; const next = learningTopics[position + 1];
  const words = content.chapters.flatMap(c => c.blocks.map(b => `${b.text ?? ''} ${b.html ?? ''}`)).join(' ').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length;
  return <div className="bg-slate-50 px-4 pb-20 pt-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
    {!preview && <Helmet><title>{`${document.title} | Iglesia Jerusalén`}</title><meta name="description" content={document.summary} /><meta property="og:title" content={`${document.title} | Iglesia Jerusalén`} /><meta property="og:description" content={document.summary} /><meta property="og:url" content={`https://www.iecejerusalen.com/nosotros/${slug}`} /></Helmet>}
    <div className="mx-auto max-w-6xl">{!preview && <Link to="/nosotros" className="inline-flex min-h-11 items-center gap-2 font-semibold text-blue-800 dark:text-amber-300"><ArrowLeft size={17} />Volver a Nosotros</Link>}
      <header className="border-b border-slate-200 py-8 dark:border-white/10 sm:py-12"><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-700 dark:text-amber-300">Conoce nuestra fe · {position + 1} de 6</p><Heading className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-5xl">{document.title}</Heading><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">{document.summary}</p><p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{document.author_label} · {Math.max(3, Math.ceil(words / 160))} min de lectura aproximadamente</p>{published?.reviewed_at && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Revisión: {published.reviewer_label} · {new Date(published.reviewed_at).toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil' })}</p>}</header>
      <div className="grid items-start gap-10 py-10 lg:grid-cols-[230px_1fr] lg:gap-14"><aside className="lg:sticky lg:top-28"><nav aria-label="Índice de lectura"><p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">En esta lectura</p><div className="flex flex-wrap gap-2 lg:flex-col">{content.chapters.map(chapter => <a key={chapter.id} href={`#${chapter.id}`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold leading-5 hover:bg-amber-50 dark:border-white/10 dark:hover:bg-white/5">{chapter.title}</a>)}</div></nav></aside>
        <article className="min-w-0 space-y-12 [&_img]:mx-auto [&_img]:max-h-[28rem] [&_img]:w-auto [&_img]:object-contain [&_.rich-text-content]:leading-8 dark:[&_.rich-text-content]:text-slate-300">
          {content.chapters.map(chapter => slug === 'himno' && chapter.id === 'himno' ? <div key={chapter.id}><BlockRenderer blocks={chapter.blocks} /><FoursquareHymn /></div> : <section key={chapter.id} id={chapter.id} className="scroll-mt-36 space-y-5"><h2 className="font-serif text-2xl font-bold sm:text-3xl">{chapter.title}</h2><BlockRenderer blocks={chapter.blocks} />{chapter.reference && <div className="border-l-2 border-amber-500 pl-4 text-sm font-semibold text-blue-800 dark:text-amber-300"><BibleVerseLink reference={chapter.reference} /></div>}{slug === 'doctrina' && chapter.id === 'principios' && <PrinciplesOfFaith />}</section>)}
          {content.audio && <LearningMedia key={content.audio.url} audio={content.audio} />}
          <section aria-labelledby="reflection-heading" className="space-y-4 rounded-2xl bg-amber-50 p-6 dark:bg-amber-500/10"><h2 id="reflection-heading" className="font-serif text-2xl font-bold">Para reflexionar y conversar</h2><ol className="list-decimal space-y-3 pl-5 leading-7">{content.reflections.map((q, i) => <li key={i}>{q}</li>)}</ol></section>
          <LearningQuiz key={`${slug}-${published?.revision ?? 'preview'}`} questions={content.quiz} />
          {!preview && <LearningProgress topic={slug} />}
          <section aria-labelledby="sources-heading" className="border-t border-slate-200 pt-6 dark:border-white/10"><h2 id="sources-heading" className="flex items-center gap-2 font-semibold"><BookOpenText size={18} />Fuentes para seguir leyendo</h2><ul className="mt-3 space-y-2">{document.sources.map((source, i) => <li key={i}><a href={source.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-800 underline dark:text-amber-300">{source.title}</a></li>)}</ul></section>
        </article>
      </div>
      {!preview && <nav aria-label="Continuar aprendiendo" className="grid gap-4 border-t border-slate-200 pt-8 dark:border-white/10 sm:grid-cols-2"><Link to={previous ? `/nosotros/${previous.slug}` : '/nosotros'} className="flex min-h-16 items-center gap-3 rounded-xl border border-slate-200 p-4 font-semibold dark:border-white/15"><ArrowLeft size={18} /><span><small className="block text-slate-500 dark:text-slate-400">{previous ? 'Lectura anterior' : 'Portada'}</small>{previous?.title ?? 'Nosotros'}</span></Link>{next && <Link to={`/nosotros/${next.slug}`} className="flex min-h-16 items-center justify-between gap-3 rounded-xl bg-amber-300 p-4 font-semibold text-slate-950"><span><small className="block">Siguiente lectura</small>{next.title}</span><ArrowRight size={18} /></Link>}</nav>}
    </div>
  </div>;
}
