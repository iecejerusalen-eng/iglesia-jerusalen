import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, BookOpenText, Clock3, ExternalLink, LibraryBig, Map, MapPin, Search, ScrollText, Sparkles, UsersRound } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import './BibleBookCatalog.css';
import { BibleVerseLink } from '../../../components/ui/BibleVerseLink';
import { BorderBeam } from '../../../components/ui/magicui/border-beam';
import {
  bibleBookCatalog,
  bibleBookCount,
  bibleBookGroups,
  bibleChapterCount,
  genesisBookIntroduction,
  genesisChapterOne,
  pentateuchOverview,
  type BibleBookGroup,
} from '../../../data/bibleBookStudyCatalog';
import { bibleStudyAtlasMapEntries, bibleStudyEventEntries, bibleStudyMapLocationEntries, bibleStudyPatriarchLocationEntries, bibleStudyPeopleEntries, bibleStudyPlaceEntries } from '../../../data/bibleStudyEncyclopedia';
import { bibleOverviewTimeline, exodusTimeline, jesusTimeline, patriarchsTimeline } from '../../../data/bibleStudyTimeline';
import { parseBibleReferences } from '../../../utils/bibleParser';

const BibleReader = lazy(() => import('../../../pages/public/Bible').then((module) => ({ default: module.EmbeddedBibleReader })));

type CatalogView =
  | { kind: 'catalog' }
  | { kind: 'group'; groupId: string }
  | { kind: 'book'; bookId: string }
  | { kind: 'chapter'; bookId: string; chapter: number };

type ChapterTool = 'bible' | 'study' | 'atlas' | 'encyclopedia' | 'chronology';

const chapterTools: Array<{ id: ChapterTool; label: string; icon: typeof BookOpen }> = [
  { id: 'bible', label: 'Biblia · lectura', icon: BookOpen },
  { id: 'study', label: 'Estudio', icon: Sparkles },
  { id: 'atlas', label: 'Atlas', icon: Map },
  { id: 'encyclopedia', label: 'Enciclopedia', icon: BookOpenText },
  { id: 'chronology', label: 'Cronología', icon: Clock3 },
];

function includesChapter(references: string[], bookId: string, chapter: number) {
  return references.some((reference) => parseBibleReferences(reference).some((parsed) => parsed.bookId === bookId && Number(parsed.chapter) === chapter));
}

const groupPalette: Record<BibleBookGroup['color'], { ink: string; inkDark: string; soft: string; softDark: string; border: string; borderDark: string; dot: string }> = {
  amber: { ink: '#854d0e', inkDark: '#fde68a', soft: '#fffbeb', softDark: 'rgba(253,230,138,.06)', border: 'rgba(161,98,7,.22)', borderDark: 'rgba(253,230,138,.16)', dot: '#d97706' },
  emerald: { ink: '#065f46', inkDark: '#a7f3d0', soft: '#ecfdf5', softDark: 'rgba(167,243,208,.06)', border: 'rgba(4,120,87,.22)', borderDark: 'rgba(167,243,208,.16)', dot: '#059669' },
  rose: { ink: '#881337', inkDark: '#ffe4e6', soft: '#fff1f2', softDark: 'rgba(255,228,230,.06)', border: 'rgba(190,18,60,.22)', borderDark: 'rgba(255,228,230,.16)', dot: '#e11d48' },
  teal: { ink: '#115e59', inkDark: '#99f6e4', soft: '#f0fdfa', softDark: 'rgba(153,246,228,.06)', border: 'rgba(13,148,136,.22)', borderDark: 'rgba(153,246,228,.16)', dot: '#0d9488' },
  violet: { ink: '#5b21b6', inkDark: '#ddd6fe', soft: '#f5f3ff', softDark: 'rgba(221,214,254,.06)', border: 'rgba(109,40,217,.22)', borderDark: 'rgba(221,214,254,.16)', dot: '#7c3aed' },
  sky: { ink: '#075985', inkDark: '#bae6fd', soft: '#f0f9ff', softDark: 'rgba(186,230,253,.06)', border: 'rgba(2,132,199,.22)', borderDark: 'rgba(186,230,253,.16)', dot: '#0284c7' },
  indigo: { ink: '#3730a3', inkDark: '#c7d2fe', soft: '#eef2ff', softDark: 'rgba(199,210,254,.06)', border: 'rgba(79,70,229,.22)', borderDark: 'rgba(199,210,254,.16)', dot: '#4f46e5' },
  red: { ink: '#991b1b', inkDark: '#fecaca', soft: '#fef2f2', softDark: 'rgba(254,202,202,.06)', border: 'rgba(220,38,38,.22)', borderDark: 'rgba(254,202,202,.16)', dot: '#dc2626' },
  blue: { ink: '#1e40af', inkDark: '#bfdbfe', soft: '#eff6ff', softDark: 'rgba(191,219,254,.06)', border: 'rgba(37,99,235,.22)', borderDark: 'rgba(191,219,254,.16)', dot: '#2563eb' },
  orange: { ink: '#9a3412', inkDark: '#fed7aa', soft: '#fff7ed', softDark: 'rgba(254,215,170,.06)', border: 'rgba(234,88,12,.22)', borderDark: 'rgba(254,215,170,.16)', dot: '#ea580c' },
  cyan: { ink: '#155e75', inkDark: '#a5f3fc', soft: '#ecfeff', softDark: 'rgba(165,243,252,.06)', border: 'rgba(8,145,178,.22)', borderDark: 'rgba(165,243,252,.16)', dot: '#0891b2' },
  fuchsia: { ink: '#86198f', inkDark: '#f5d0fe', soft: '#fdf4ff', softDark: 'rgba(245,208,254,.06)', border: 'rgba(192,38,211,.22)', borderDark: 'rgba(245,208,254,.16)', dot: '#c026d3' },
};

function groupStyle(group: BibleBookGroup): CSSProperties {
  const colors = groupPalette[group.color];
  return {
    '--group-ink': colors.ink,
    '--group-ink-dark': colors.inkDark,
    '--group-soft': colors.soft,
    '--group-soft-dark': colors.softDark,
    '--group-border': colors.border,
    '--group-border-dark': colors.borderDark,
    '--group-dot': colors.dot,
  } as CSSProperties;
}

function References({ references }: { references: string[] }) {
  return <div className="flex flex-wrap gap-x-3 gap-y-2">{references.map((reference) => <BibleVerseLink key={reference} reference={reference} className="text-sm font-bold text-blue-800 underline decoration-amber-500/50 underline-offset-4 hover:text-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-200 dark:hover:text-amber-100" />)}</div>;
}

function GroupIdentity({ group, compact = false }: { group: BibleBookGroup; compact?: boolean }) {
  return <div>
    <p className="bible-group-label flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em]"><span aria-hidden="true" className="bible-group-dot size-2 rounded-full" />{group.eyebrow}</p>
    <h3 className={`${compact ? 'mt-1 text-lg' : 'mt-2 text-2xl sm:text-3xl'} font-serif leading-tight text-[#15213a] dark:text-[#f7f3e8]`}>{group.title}</h3>
    {!compact && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{group.description}</p>}
  </div>;
}

export default function BibleBookCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<CatalogView>(() => {
    const bookId = searchParams.get('libro');
    const book = bibleBookCatalog.find((item) => item.id === bookId);
    if (!book) return { kind: 'catalog' };
    const chapter = Number(searchParams.get('capitulo'));
    return Number.isInteger(chapter) && chapter >= 1 && chapter <= book.chapters
      ? { kind: 'chapter', bookId: book.id, chapter }
      : { kind: 'book', bookId: book.id };
  });
  const [activeTool, setActiveTool] = useState<ChapterTool>('bible');
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const matchingBooks = useMemo(() => normalizedQuery ? bibleBookCatalog.filter((book) => `${book.name} ${book.group.title} ${book.testament}`.toLocaleLowerCase('es').includes(normalizedQuery)) : bibleBookCatalog, [normalizedQuery]);
  const activeBook = view.kind === 'book' || view.kind === 'chapter' ? bibleBookCatalog.find((book) => book.id === view.bookId) : undefined;
  const activeGroup = view.kind === 'group' ? bibleBookGroups.find((group) => group.id === view.groupId) : activeBook?.group;
  const bookInGroup = (bookId: string) => bibleBookCatalog.find((book) => book.id === bookId)!;
  const goBack = () => {
    const nextParams = new URLSearchParams(searchParams);
    if (view.kind === 'chapter') {
      nextParams.delete('capitulo');
      nextParams.delete('versiculo');
      setSearchParams(nextParams, { replace: true });
      setView({ kind: 'book', bookId: view.bookId });
    } else {
      nextParams.delete('libro');
      nextParams.delete('capitulo');
      nextParams.delete('versiculo');
      setSearchParams(nextParams, { replace: true });
      setView({ kind: 'catalog' });
    }
  };

  const openChapter = (bookId: string, chapter: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('libro', bookId);
    nextParams.set('capitulo', String(chapter));
    nextParams.delete('versiculo');
    setSearchParams(nextParams, { replace: true });
    setActiveTool('bible');
    setView({ kind: 'chapter', bookId, chapter });
  };

  const chapterNumber = view.kind === 'chapter' ? view.chapter : 0;
  const chapterMaps = activeBook && chapterNumber ? bibleStudyAtlasMapEntries.filter((entry) => includesChapter(entry.references, activeBook.id, chapterNumber)) : [];
  const chapterPlaces = activeBook && chapterNumber ? bibleStudyPlaceEntries.filter((entry) => includesChapter(entry.references, activeBook.id, chapterNumber)) : [];
  const chapterPeople = activeBook && chapterNumber ? bibleStudyPeopleEntries.filter((entry) => includesChapter(entry.references, activeBook.id, chapterNumber)) : [];
  const chapterEvents = activeBook && chapterNumber ? bibleStudyEventEntries.filter((entry) => includesChapter(entry.references, activeBook.id, chapterNumber)) : [];
  const chapterTimeline = activeBook && chapterNumber ? [...bibleOverviewTimeline, ...exodusTimeline, ...jesusTimeline, ...patriarchsTimeline].filter((entry) => includesChapter(entry.references, activeBook.id, chapterNumber)) : [];
  const chapterMapPlaces = activeBook && chapterNumber
    ? [...bibleStudyMapLocationEntries, ...bibleStudyPatriarchLocationEntries].filter((entry) => includesChapter(entry.references, activeBook.id, chapterNumber))
    : [];

  return <section aria-labelledby="bible-catalog-title" className="space-y-5">
    <header className="relative isolate overflow-hidden rounded-[1.8rem] border border-amber-900/15 bg-gradient-to-br from-[#fffaf0] via-[#f5edda] to-[#efe2c4] p-5 shadow-[0_26px_70px_-52px_rgba(33,30,20,.55)] dark:border-amber-100/10 dark:from-[#17253c] dark:via-[#111d31] dark:to-[#0c1527] sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 size-72 rounded-full border border-amber-700/10 bg-[radial-gradient(circle,rgba(211,172,91,.2),transparent_68%)] dark:border-amber-100/10 dark:bg-[radial-gradient(circle,rgba(244,221,167,.12),transparent_68%)]" />
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-amber-900 dark:text-amber-200"><LibraryBig size={14} /> Lectura y estudio · catálogo bíblico</p>
          <h2 id="bible-catalog-title" className="mt-3 font-serif text-3xl leading-tight tracking-tight text-[#111a2d] dark:text-[#f7f3e8] sm:text-4xl">La Biblia, libro por libro.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-300">Explora sus secciones, abre cada libro y elige un capítulo. La lectura se conecta con el lector bíblico de siempre; los estudios se irán preparando por etapas.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full border border-amber-900/10 bg-white/70 px-3 py-2 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">{bibleBookCount} libros</span>
          <span className="rounded-full border border-amber-900/10 bg-white/70 px-3 py-2 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">{bibleChapterCount.toLocaleString('es')} capítulos</span>
        </div>
      </div>
      {view.kind !== 'catalog' && <button type="button" onClick={goBack} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-amber-900/15 bg-white/70 px-4 text-xs font-bold text-slate-700 transition hover:border-amber-600/40 hover:text-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:text-amber-100"><ArrowLeft size={15} />{view.kind === 'chapter' ? `Volver a ${activeBook?.name}` : 'Volver al catálogo'}</button>}
    </header>

    {view.kind === 'catalog' && <>
      <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white/85 px-4 shadow-sm focus-within:border-amber-600/50 dark:border-white/10 dark:bg-white/[.04]">
        <Search size={17} className="shrink-0 text-amber-800 dark:text-amber-200" />
        <span className="sr-only">Buscar libro o sección</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busca Génesis, Salmos, cartas…" className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white" />
        {query && <button type="button" onClick={() => setQuery('')} className="rounded-full px-2 py-1 text-xs font-bold text-slate-500 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-slate-300">Limpiar</button>}
      </label>
      {matchingBooks.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[.04] dark:text-slate-300">No encontré libros con ese nombre. Prueba otra búsqueda.</p>}
      <div className="space-y-4">
        {bibleBookGroups.map((group, groupIndex) => {
          const books = group.bookIds.map(bookInGroup).filter((book) => matchingBooks.some((match) => match.id === book.id));
          if (books.length === 0) return null;
          const groupChapters = books.reduce((count, book) => count + book.chapters, 0);
          return <section key={group.id} style={groupStyle(group)} className="bible-group-panel overflow-hidden rounded-[1.5rem] border bg-white/85 shadow-[0_20px_55px_-48px_rgba(20,30,50,.55)] dark:bg-slate-950/55" aria-labelledby={`bible-group-${group.id}`}>
            <div className="bible-group-header flex flex-wrap items-start justify-between gap-4 border-b px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-start gap-3"><span className="bible-group-number mt-1 grid size-9 shrink-0 place-items-center rounded-xl border bg-white text-xs font-black shadow-sm dark:bg-slate-950">{String(groupIndex + 1).padStart(2, '0')}</span><div><p className="bible-group-label text-[10px] font-bold uppercase tracking-[.16em]">{group.eyebrow}</p><h3 id={`bible-group-${group.id}`} className="mt-1 font-serif text-xl text-[#15213a] dark:text-[#f7f3e8] sm:text-2xl">{group.title}</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-300">{group.description}</p></div></div>
              <button type="button" onClick={() => setView({ kind: 'group', groupId: group.id })} className="bible-group-action inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border bg-white/80 px-3.5 text-xs font-bold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-slate-950/60">Conocer la sección <ArrowRight size={14} /></button>
            </div>
            <div className="grid gap-2 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3">
              {books.map((book) => <button key={book.id} type="button" onClick={() => setView({ kind: 'book', bookId: book.id })} className={`group flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 text-left transition hover:-translate-y-0.5 hover:border-amber-600/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[.03] dark:hover:border-amber-200/30`}>
                <span className="flex min-w-0 items-center gap-3"><span className="bible-group-book-icon grid size-9 shrink-0 place-items-center rounded-xl"><BookOpen size={16} /></span><span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-900 dark:text-slate-100">{book.name}</span><span className="mt-0.5 block text-[10px] text-slate-500 dark:text-slate-400">{book.chapters} {book.chapters === 1 ? 'capítulo' : 'capítulos'}</span></span></span><ArrowRight size={15} className="shrink-0 text-amber-700 transition group-hover:translate-x-0.5 dark:text-amber-200" />
              </button>)}
            </div>
            {!normalizedQuery && <p className="px-4 pb-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:px-5">{books.length} libros · {groupChapters} capítulos</p>}
          </section>;
        })}
      </div>
    </>}

    {view.kind === 'group' && activeGroup && <GroupStudy group={activeGroup} onOpenBook={(bookId) => setView({ kind: 'book', bookId })} />}

    {view.kind === 'book' && activeBook && <article className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white/90 shadow-[0_24px_65px_-48px_rgba(21,31,47,.55)] dark:border-white/10 dark:bg-slate-950/70">
      <div style={groupStyle(activeBook.group)} className="bible-group-header border-b p-5 sm:p-7"><GroupIdentity group={activeBook.group} compact /><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h3 className="font-serif text-3xl leading-tight text-[#111a2d] dark:text-[#f7f3e8] sm:text-4xl">{activeBook.name}</h3><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{activeBook.testament} Testamento · {activeBook.chapters} {activeBook.chapters === 1 ? 'capítulo' : 'capítulos'}</p></div><button type="button" onClick={() => openChapter(activeBook.id, 1)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#111d35] px-4 text-xs font-bold text-white shadow-md transition hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-amber-200 dark:text-slate-950 dark:hover:bg-amber-100"><BookOpen size={15} />Abrir capítulo 1<ArrowRight size={14} /></button></div></div>
      <div className="space-y-6 p-4 sm:p-7">
        {activeBook.id === 'genesis' ? <BookIntroduction /> : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/75 p-4 dark:border-white/15 dark:bg-white/[.025]"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">Introducción del libro · estructura preparada</p><h4 className="mt-1 font-serif text-xl">Panorama editorial en preparación</h4><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Este espacio ya está reservado para contexto, estructura, temas, autoría y referencias de {activeBook.name}. Se completará en su fase de estudio; por ahora puedes abrir sus capítulos en el lector bíblico.</p></div>}
        <div><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-amber-900 dark:text-amber-200">Índice del libro</p><h4 className="mt-1 font-serif text-2xl">Elige un capítulo</h4></div><span className="text-xs text-slate-500 dark:text-slate-400">El punto dorado marca un estudio disponible</span></div>
          <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12" aria-label={`Capítulos de ${activeBook.name}`}>
            {Array.from({ length: activeBook.chapters }, (_, index) => index + 1).map((chapter) => { const ready = activeBook.id === 'genesis' && chapter === 1; return <button key={chapter} type="button" onClick={() => openChapter(activeBook.id, chapter)} aria-label={`Abrir ${activeBook.name} capítulo ${chapter}${ready ? ', estudio disponible' : ', estudio en preparación'}`} className={`relative grid aspect-square min-h-11 place-items-center rounded-xl border text-sm font-bold transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${ready ? 'border-amber-500/45 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-950 shadow-sm dark:border-amber-200/30 dark:from-amber-200/15 dark:to-amber-200/5 dark:text-amber-100' : 'border-slate-200 bg-white text-slate-700 hover:border-amber-500/40 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-200'}`}>{chapter}{ready && <span aria-hidden="true" className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-amber-600 dark:bg-amber-200" />}</button>; })}
          </div>
        </div>
      </div>
    </article>}

    {view.kind === 'chapter' && activeBook && <article className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white/90 shadow-[0_24px_65px_-48px_rgba(21,31,47,.55)] dark:border-white/10 dark:bg-slate-950/70">
      <header style={groupStyle(activeBook.group)} className="bible-group-header border-b p-5 sm:p-7"><GroupIdentity group={activeBook.group} compact /><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">{activeBook.name}</p><h3 className="font-serif text-3xl text-[#111a2d] dark:text-[#f7f3e8] sm:text-4xl">Capítulo {view.chapter}</h3></div><span className="rounded-full border border-[var(--group-border)] bg-white/75 px-3 py-1.5 text-xs font-semibold text-[var(--group-ink)] dark:border-[var(--group-border-dark)] dark:bg-slate-950/50 dark:text-[var(--group-ink-dark)]">{activeBook.group.title}</span></div></header>

      <div className="border-b border-slate-200 bg-[#fcfbf8] p-4 dark:border-white/10 dark:bg-slate-900/60 sm:p-6">
        <details className="group rounded-2xl border border-amber-800/15 bg-white/80 dark:border-amber-200/10 dark:bg-slate-950/50">
          <summary className="flex min-h-12 cursor-pointer list-none flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"><span><span className="block text-[10px] font-bold uppercase tracking-[.14em] text-amber-800 dark:text-amber-200">Antes de leer</span><span className="mt-1 block font-semibold text-slate-800 dark:text-slate-100">Contexto del libro y de {activeBook.group.title}</span></span><ArrowRight size={16} className="text-amber-800 transition-transform group-open:rotate-90 dark:text-amber-200" aria-hidden="true" /></summary>
          <div className="grid gap-4 border-t border-slate-200 p-4 dark:border-white/10 md:grid-cols-2 sm:p-5">
            <section><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">Introducción · {activeBook.name}</p>{activeBook.id === 'genesis' ? <><h4 className="mt-1 font-serif text-xl">{genesisBookIntroduction.title}</h4><p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{genesisBookIntroduction.summary}</p><ul className="mt-3 space-y-2">{genesisBookIntroduction.sections.map((item) => <li key={item.title} className="text-xs leading-5 text-slate-600 dark:text-slate-300"><strong className="text-slate-800 dark:text-slate-100">{item.title}.</strong> {item.text}</li>)}</ul><div className="mt-3"><References references={genesisBookIntroduction.references} /></div></> : <><h4 className="mt-1 font-serif text-xl">Prefacio en preparación</h4><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">El estudio de {activeBook.name} todavía no tiene una introducción editorial revisada. Esta ficha se completará por etapas con contexto, estructura, temas y referencias.</p></>}</section>
            <section className="rounded-xl border border-[var(--group-border)] bg-[var(--group-soft)]/70 p-4 dark:border-[var(--group-border-dark)] dark:bg-[var(--group-soft-dark)]"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--group-ink)] dark:text-[var(--group-ink-dark)]">Conocer la sección</p><h4 className="mt-1 font-serif text-xl text-slate-900 dark:text-white">{activeBook.group.title}</h4><p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{activeBook.group.id === 'pentateuch' ? pentateuchOverview.introduction : activeBook.group.description}</p>{activeBook.group.id === 'pentateuch' && <><p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">{pentateuchOverview.authorship}</p><div className="mt-3"><References references={pentateuchOverview.references} /></div></>}</section>
          </div>
        </details>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label={`Herramientas para ${activeBook.name} capítulo ${view.chapter}`}>
          {chapterTools.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" id={`chapter-tool-${id}`} aria-controls="chapter-tool-panel" aria-selected={activeTool === id} onClick={() => setActiveTool(id)} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:text-sm ${activeTool === id ? 'border-[#111d35] bg-[#111d35] text-white shadow-md dark:border-amber-200 dark:bg-amber-200 dark:text-slate-950' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-600/40 hover:text-amber-950 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-300 dark:hover:text-amber-100'}`}><Icon size={16} aria-hidden="true" />{label}</button>)}
        </div>

        <div id="chapter-tool-panel" role="tabpanel" aria-labelledby={`chapter-tool-${activeTool}`} tabIndex={0} className="mt-4 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
          {activeTool === 'bible' && <Suspense fallback={<div className="grid min-h-40 place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-300">Preparando el lector bíblico…</div>}><BibleReader onChapterNavigate={(bookId, chapter) => { setView({ kind: 'chapter', bookId, chapter }); setActiveTool('bible'); }} /></Suspense>}

          {activeTool === 'study' && (activeBook.id === 'genesis' && view.chapter === 1 ? <GenesisOneStudy onOpenAtlas={() => setActiveTool('atlas')} onOpenChronology={() => setActiveTool('chronology')} /> : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/75 p-5 dark:border-white/15 dark:bg-white/[.025]"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">Estudio del capítulo · en preparación</p><h4 className="mt-2 font-serif text-2xl">Una lectura compartida, con contexto por etapas.</h4><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">La guía exegética de {activeBook.name} {view.chapter} —estructura, observaciones, personajes, lugares y preguntas— se incorporará cuando se revise su contenido.</p></div>)}

          {activeTool === 'atlas' && <section aria-labelledby="chapter-atlas-title" className="space-y-4"><header><p className="text-[10px] font-bold uppercase tracking-[.15em] text-amber-800 dark:text-amber-200">Geografía y contexto</p><h4 id="chapter-atlas-title" className="mt-1 font-serif text-2xl">Atlas · {activeBook.name} {view.chapter}</h4><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Mapas y lugares conectados explícitamente con este capítulo.</p></header>
            {activeBook.id === 'genesis' && view.chapter === 1 && <GenesisNarrativeAtlas onReadReference={(reference) => {
              const parsed = parseBibleReferences(reference)[0];
              if (!parsed) return;
              const nextParams = new URLSearchParams(searchParams);
              nextParams.set('libro', parsed.bookId);
              nextParams.set('capitulo', String(parsed.chapter));
              if (parsed.verses) nextParams.set('versiculo', parsed.verses); else nextParams.delete('versiculo');
              setSearchParams(nextParams, { replace: true });
              setView({ kind: 'chapter', bookId: parsed.bookId, chapter: Number(parsed.chapter) });
              setActiveTool('bible');
            }} />}
            {chapterMaps.length > 0 && <div className="grid gap-3 md:grid-cols-2">{chapterMaps.map((mapEntry) => <article key={mapEntry.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[.03]"><a href={mapEntry.imagePath} target="_blank" rel="noreferrer" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500"><img src={mapEntry.imagePath} alt={mapEntry.imageAlt} loading="lazy" decoding="async" className="aspect-[16/9] w-full bg-slate-100 object-contain dark:bg-slate-900" /></a><div className="p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-amber-800 dark:text-amber-200">{mapEntry.period}</p><h5 className="mt-1 font-serif text-xl">{mapEntry.title}</h5><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{mapEntry.summary}</p><div className="mt-3"><References references={mapEntry.references} /></div></div></article>)}</div>}
            {chapterMapPlaces.length > 0 && <div className="grid gap-2 sm:grid-cols-2">{chapterMapPlaces.map((place) => <article key={place.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.03]"><div className="flex items-center gap-2"><MapPin size={15} className="text-amber-800 dark:text-amber-200" /><h5 className="font-semibold">{place.title}</h5></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{place.region}</p><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{place.summary}</p><div className="mt-3"><References references={place.references} /></div></article>)}</div>}
            {chapterPlaces.length > 0 && <div className="grid gap-2 sm:grid-cols-2">{chapterPlaces.map((place) => <article key={place.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.03]"><div className="flex items-center gap-2"><MapPin size={15} className="text-amber-800 dark:text-amber-200" /><h5 className="font-semibold">{place.title}</h5></div><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{place.summary}</p><div className="mt-3"><References references={place.references} /></div></article>)}</div>}
            {chapterMaps.length === 0 && chapterMapPlaces.length === 0 && chapterPlaces.length === 0 && !(activeBook.id === 'genesis' && view.chapter === 1) && <div className="rounded-2xl border border-amber-800/15 bg-amber-50/70 p-5 dark:border-amber-200/10 dark:bg-amber-200/[.04]"><h5 className="font-serif text-xl">Todavía no hay un mapa vinculado a este pasaje.</h5><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Mostramos aquí solo lugares y mapas cuyas referencias incluyen {activeBook.name} {view.chapter}. Así evitamos atribuir al capítulo lugares que no menciona. El índice cartográfico general sigue disponible desde Atlas.</p></div>}
          </section>}

          {activeTool === 'encyclopedia' && <section aria-labelledby="chapter-encyclopedia-title" className="space-y-4"><header><p className="text-[10px] font-bold uppercase tracking-[.15em] text-amber-800 dark:text-amber-200">Personas · lugares · acontecimientos</p><h4 id="chapter-encyclopedia-title" className="mt-1 font-serif text-2xl">Enciclopedia · {activeBook.name} {view.chapter}</h4><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Entradas enlazadas por referencias, no solo por coincidencia de nombres.</p></header>
            {activeBook.id === 'genesis' && view.chapter === 1 && <section className="rounded-2xl border border-amber-800/15 bg-amber-50/60 p-4 dark:border-amber-200/10 dark:bg-amber-200/[.04]"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-amber-800 dark:text-amber-200">Personajes del capítulo</p><div className="mt-2 flex flex-wrap gap-2">{genesisChapterOne.relatedPeople.map((person) => <span key={person} className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/20 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-amber-200/15 dark:bg-slate-950/40 dark:text-slate-200"><UsersRound size={13} className="text-amber-800 dark:text-amber-200" />{person}</span>)}</div></section>}
            <div className="grid gap-3 md:grid-cols-2">{[...chapterPeople.map((entry) => ({ ...entry, kind: 'Persona' })), ...chapterPlaces.map((entry) => ({ ...entry, kind: 'Lugar' })), ...chapterEvents.map((entry) => ({ ...entry, kind: 'Acontecimiento' }))].map((entry) => <article key={`${entry.kind}-${entry.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.03]"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-amber-800 dark:text-amber-200">{entry.kind}{'region' in entry && entry.region ? ` · ${entry.region}` : ''}</p><h5 className="mt-1 font-serif text-xl">{entry.title}</h5><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{entry.summary}</p><div className="mt-3"><References references={entry.references} /></div></article>)}</div>
            {chapterPeople.length === 0 && chapterPlaces.length === 0 && chapterEvents.length === 0 && !(activeBook.id === 'genesis' && view.chapter === 1) && <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/75 p-5 dark:border-white/15 dark:bg-white/[.025]"><h5 className="font-serif text-xl">Entradas en preparación</h5><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Aún no hay personajes, lugares ni acontecimientos del catálogo conectados con {activeBook.name} {view.chapter}. Se irán agregando con referencias verificables.</p></div>}
          </section>}

          {activeTool === 'chronology' && <section aria-labelledby="chapter-chronology-title" className="space-y-4"><header><p className="text-[10px] font-bold uppercase tracking-[.15em] text-amber-800 dark:text-amber-200">Secuencia narrativa</p><h4 id="chapter-chronology-title" className="mt-1 font-serif text-2xl">Cronología · {activeBook.name} {view.chapter}</h4><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Conectamos hitos cuando sus referencias coinciden con el capítulo; las fechas debatidas se señalan como aproximadas.</p></header>
            {activeBook.id === 'genesis' && view.chapter === 1 && <article className="rounded-2xl border border-amber-800/15 bg-amber-50/60 p-4 dark:border-amber-200/10 dark:bg-amber-200/[.04]"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-amber-800 dark:text-amber-200">Orden del relato · no calendario histórico</p><h5 className="mt-1 font-serif text-xl">Seis días de creación</h5><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{genesisChapterOne.structure.map((item) => <div key={item.label} className="rounded-lg border border-amber-900/10 bg-white/75 p-3 dark:border-amber-100/10 dark:bg-slate-950/40"><p className="font-semibold">{item.label} · {item.theme}</p><div className="mt-1"><References references={[item.reference]} /></div></div>)}</div></article>}
            {chapterTimeline.length > 0 && <ol className="space-y-3">{chapterTimeline.map((item, index) => <li key={`${item.id}-${index}`} className="grid grid-cols-[2rem_1fr] gap-3"><span className="relative grid size-8 place-items-center rounded-full border border-amber-500/40 bg-amber-50 text-xs font-black text-amber-950 dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-amber-100">{String(index + 1).padStart(2, '0')}</span><article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.03]"><h5 className="font-serif text-xl">{item.title}</h5><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.summary}</p><div className="mt-3"><References references={item.references} /></div></article></li>)}</ol>}
            {chapterTimeline.length === 0 && !(activeBook.id === 'genesis' && view.chapter === 1) && <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/75 p-5 dark:border-white/15 dark:bg-white/[.025]"><h5 className="font-serif text-xl">Hitos en preparación</h5><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Todavía no se han enlazado hitos cronológicos a {activeBook.name} {view.chapter}. Evitamos asignarle fechas por suposición.</p></div>}
          </section>}
        </div>
      </div>
    </article>}
  </section>;
}

function GenesisNarrativeAtlas({ onReadReference }: { onReadReference: (reference: string) => void }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedScene = genesisChapterOne.structure[selectedIndex];
  const sceneVisuals = [
    { src: '/images/bible-study/genesis-scenes/genesis-day-1-scene-v01.jpg', alt: 'Luz que aparece sobre un horizonte oscuro, ilustración interpretativa del primer día de Génesis 1.' },
    { src: '/images/bible-study/genesis-scenes/genesis-day-2-scene-v01.jpg', alt: 'Cielo abierto sobre las aguas, ilustración interpretativa del segundo día de Génesis 1.' },
    { src: '/images/bible-study/genesis-scenes/genesis-day-3-scene-v01.jpg', alt: 'Tierra seca, vegetación y árboles entre aguas, ilustración interpretativa del tercer día de Génesis 1.' },
    { src: '/images/bible-study/genesis-scenes/genesis-day-4-scene-v01.jpg', alt: 'Sol, luna y estrellas sobre el horizonte, ilustración interpretativa del cuarto día de Génesis 1.' },
    { src: '/images/bible-study/genesis-scenes/genesis-day-5-scene-v01.jpg', alt: 'Aves sobre el mar y vida bajo el agua, ilustración interpretativa del quinto día de Génesis 1.' },
    { src: '/images/bible-study/genesis-scenes/genesis-day-6-scene-v01.jpg', alt: 'Animales terrestres y dos figuras humanas en un paisaje fértil, ilustración interpretativa del sexto día de Génesis 1.' },
  ];
  const sceneZones = [
    { title: 'Cielo', description: 'Luz, lumbreras y aves', days: [0, 3, 4] },
    { title: 'Aguas y mares', description: 'Límites y vida acuática', days: [1, 2, 4] },
    { title: 'Tierra', description: 'Vegetación, animales y humanidad', days: [2, 5] },
  ];

  return <div className="space-y-5">
    <article className="overflow-hidden rounded-[1.5rem] border border-amber-900/15 bg-[#101d35] text-white shadow-[0_24px_60px_-42px_rgba(16,29,53,.75)]">
      <div className="relative">
        <img key={selectedIndex} src={sceneVisuals[selectedIndex].src} alt={sceneVisuals[selectedIndex].alt} width={720} height={720} loading="lazy" decoding="async" sizes="(max-width: 1024px) 100vw, 70vw" className="bible-atlas-scene-image aspect-[16/9] w-full object-cover" style={{ objectPosition: selectedIndex === 5 ? 'center 68%' : 'center' }} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#081326]/90 via-[#081326]/10 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-amber-200">Atlas narrativo · {selectedScene.label} · {selectedScene.reference}</p>
          <h5 className="mt-1 font-serif text-2xl sm:text-3xl">{selectedScene.theme}.</h5>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-white/80 sm:text-sm">Observa esta escena y sigue el pasaje en el lector bíblico. Es una ilustración digital interpretativa: no representa un mapa geográfico ni una reconstrucción histórica.</p>
        </div>
      </div>
      <div className="grid gap-px bg-white/10 sm:grid-cols-3">
        {sceneZones.map((zone) => <button key={zone.title} type="button" onClick={() => setSelectedIndex(zone.days.includes(selectedIndex) ? selectedIndex : zone.days[0])} aria-label={`Explorar ${zone.title} en Génesis 1`} className="group min-h-20 bg-[#101d35] p-4 text-left transition-colors hover:bg-[#182946] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-300">
          <span className="block text-xs font-bold text-amber-200">{zone.title}</span><span className="mt-1 block text-[11px] leading-5 text-slate-300">{zone.description}</span>
        </button>)}
      </div>
    </article>

    <section aria-labelledby="genesis-atlas-scenes" className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[.03] sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-amber-800 dark:text-amber-200">La secuencia del relato</p><h5 id="genesis-atlas-scenes" className="mt-1 font-serif text-xl">Explora cada escena</h5></div><span className="text-[10px] text-slate-500 dark:text-slate-400">Orden narrativo · sin fechas de calendario</span></div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Escenas de Génesis 1">
        {genesisChapterOne.structure.map((scene, index) => <button key={scene.label} type="button" aria-label={`${scene.label}: ${scene.theme}, ${scene.reference}`} aria-pressed={selectedIndex === index} onClick={() => setSelectedIndex(index)} className={`bible-atlas-scene-choice overflow-hidden rounded-xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${selectedIndex === index ? 'border-amber-500 bg-amber-50 shadow-[0_8px_22px_-15px_rgba(157,102,14,.75)] dark:bg-amber-200/10' : 'border-slate-200 bg-white hover:border-amber-500/50 dark:border-white/10 dark:bg-white/[.03]'}`}><img src={sceneVisuals[index].src} alt="" width={720} height={720} loading="lazy" decoding="async" sizes="(max-width: 639px) 30vw, (max-width: 1023px) 16vw, 120px" className="aspect-[4/3] w-full object-cover" style={{ objectPosition: index === 5 ? 'center 68%' : 'center' }} /><span className="block p-2"><span className="block text-[10px] font-bold text-slate-900 dark:text-slate-100">{scene.label}</span><span className="mt-0.5 block text-[9px] leading-4 text-slate-500 dark:text-slate-400">{scene.reference.replace('Génesis ', '')}</span></span></button>)}
      </div>
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-800/15 bg-[#fbf6e9] p-4 dark:border-amber-200/10 dark:bg-amber-200/[.04] sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-amber-900 dark:text-amber-200">{selectedScene.label} · {selectedScene.reference}</p><h6 className="mt-1 font-serif text-lg text-[#15213a] dark:text-[#f7f3e8]">{selectedScene.theme}</h6><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Ámbitos del relato: {sceneZones.filter((zone) => zone.days.includes(selectedIndex)).map((zone) => zone.title).join(' · ')}</p></div>
        <button type="button" onClick={() => onReadReference(selectedScene.reference)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#111d35] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-amber-200 dark:text-slate-950 dark:hover:bg-amber-100"><BookOpen size={15} aria-hidden="true" />Leer esta escena en Biblia<ArrowRight size={14} aria-hidden="true" /></button>
      </div>
      <p className="mt-3 text-[10px] leading-5 text-slate-500 dark:text-slate-400">Las seis imágenes son ilustraciones digitales creadas para acompañar la lectura; no son fotografías ni evidencia histórica o geográfica.</p>
    </section>
  </div>;
}

function GroupStudy({ group, onOpenBook }: { group: BibleBookGroup; onOpenBook: (bookId: string) => void }) {
  const isPentateuch = group.id === 'pentateuch';
  const books = group.bookIds.map((id) => bibleBookCatalog.find((book) => book.id === id)!);
  return <article style={groupStyle(group)} className="bible-group-panel overflow-hidden rounded-[1.6rem] border bg-white/90 shadow-[0_24px_65px_-48px_rgba(21,31,47,.55)] dark:bg-slate-950/70">
    <header className="bible-group-header border-b p-5 sm:p-7"><GroupIdentity group={group} /><p className="mt-4 text-xs font-semibold text-slate-600 dark:text-slate-300">{books.length} {books.length === 1 ? 'libro' : 'libros'} · {books.reduce((count, book) => count + book.chapters, 0)} capítulos</p></header>
    <div className="space-y-6 p-4 sm:p-7">
      {isPentateuch ? <>
        <section><p className="text-[10px] font-bold uppercase tracking-[.15em] text-amber-900 dark:text-amber-200">Una biblioteca de cinco libros</p><p className="mt-2 max-w-4xl text-sm leading-7 text-slate-700 dark:text-slate-200">{pentateuchOverview.introduction}</p></section>
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{pentateuchOverview.books.map((item, index) => { const book = books.find((entry) => entry.id === item.id)!; return <button key={item.id} type="button" onClick={() => onOpenBook(book.id)} className="group flex min-h-24 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-600/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[.03]"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-amber-100 text-xs font-black text-amber-950 dark:bg-amber-200/10 dark:text-amber-100">0{index + 1}</span><span><span className="block font-serif text-xl text-slate-900 dark:text-white">{book.name}</span><span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">{item.focus}</span></span><ArrowRight size={15} className="ml-auto mt-1 shrink-0 text-amber-700 transition group-hover:translate-x-0.5 dark:text-amber-200" /></button>; })}</section>
        <section className="rounded-2xl border border-amber-700/15 bg-[#fbf6e9] p-4 dark:border-amber-200/10 dark:bg-amber-200/[.04] sm:p-5"><h4 className="font-serif text-xl">¿Quién escribió el Pentateuco?</h4><p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-200">{pentateuchOverview.authorship}</p><div className="mt-4"><References references={pentateuchOverview.references} /></div></section>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.03] sm:p-5"><div className="flex items-center gap-2"><ScrollText size={17} className="text-amber-800 dark:text-amber-200" /><h4 className="font-serif text-xl">¿Dónde aparecen los rollos?</h4></div><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{pentateuchOverview.manuscripts}</p><div className="mt-4 space-y-2">{pentateuchOverview.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-blue-800 transition hover:border-amber-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:text-amber-200"><span>{source.title}<span className="mt-0.5 block font-normal text-slate-500 dark:text-slate-400">{source.note}</span></span><ExternalLink size={14} className="shrink-0" /></a>)}</div><p className="mt-3 text-[10px] leading-5 text-slate-500 dark:text-slate-400">Abrimos fuentes de museos y bibliotecas en sus propios sitios; sus fotografías conservan sus condiciones de uso.</p></section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.03] sm:p-5"><div className="flex items-center gap-2"><Sparkles size={17} className="text-amber-800 dark:text-amber-200" /><h4 className="font-serif text-xl">¿Cómo se transmitieron estos textos?</h4></div><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{pentateuchOverview.writing}</p><div className="mt-4 rounded-xl border border-dashed border-amber-700/25 bg-amber-50/70 p-3 text-xs leading-5 text-slate-600 dark:border-amber-200/15 dark:bg-amber-200/[.04] dark:text-slate-300">Distinción importante: las piezas conservadas en museos ayudan a estudiar la transmisión de los textos; no son los rollos originales escritos por los autores bíblicos.</div></section>
        </div>
        <p className="border-t border-slate-200 pt-4 text-[10px] leading-5 text-slate-500 dark:border-white/10 dark:text-slate-400">La presentación combina la tradición de lectura de la iglesia con fuentes históricas consultables. Las cuestiones debatidas se señalan como tales; el material externo se enlaza, no se descarga ni se republica aquí.</p>
      </> : <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/75 p-5 dark:border-white/15 dark:bg-white/[.025]"><p className="bible-group-label text-[10px] font-bold uppercase tracking-[.14em]">Estudio de sección · estructura preparada</p><h4 className="mt-2 font-serif text-2xl">La guía general está en preparación.</h4><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">El grupo ya organiza sus libros y capítulos. Su introducción, contexto histórico, preguntas de lectura y recursos se elaborarán más adelante, con referencias y procedencia visibles.</p></section>}
      <section><h4 className="mb-3 font-serif text-xl">Libros de esta sección</h4><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{books.map((book) => <button key={book.id} type="button" onClick={() => onOpenBook(book.id)} className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left text-sm font-bold transition hover:border-amber-600/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-100"><span>{book.name}<span className="ml-2 text-[10px] font-normal text-slate-500 dark:text-slate-400">{book.chapters} cap.</span></span><ArrowRight size={14} className="shrink-0 text-amber-700 dark:text-amber-200" /></button>)}</div></section>
    </div>
  </article>;
}

function BookIntroduction() {
  return <section className="rounded-2xl border border-amber-700/15 bg-[#fbf6e9] p-4 dark:border-amber-200/10 dark:bg-amber-200/[.04] sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-amber-900 dark:text-amber-200">Prefacio · introducción al libro</p><h4 className="mt-2 font-serif text-2xl">{genesisBookIntroduction.title}</h4><p className="mt-2 max-w-4xl text-sm leading-7 text-slate-700 dark:text-slate-200">{genesisBookIntroduction.summary}</p><div className="mt-5 grid gap-3 md:grid-cols-3">{genesisBookIntroduction.sections.map((section) => <article key={section.title} className="rounded-xl border border-white/80 bg-white/75 p-3 dark:border-white/10 dark:bg-slate-950/35"><h5 className="font-bold text-slate-900 dark:text-slate-100">{section.title}</h5><p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">{section.text}</p></article>)}</div><div className="mt-5"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">Referencias para comenzar</p><References references={genesisBookIntroduction.references} /></div><div className="mt-4 flex flex-wrap gap-2">{genesisBookIntroduction.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-amber-700/20 bg-white/75 px-3 text-xs font-bold text-blue-800 transition hover:border-amber-600/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/15 dark:bg-white/[.04] dark:text-amber-200">{source.title}<ExternalLink size={12} /></a>)}</div></section>;
}

function GenesisOneStudy({ onOpenAtlas, onOpenChronology }: { onOpenAtlas: () => void; onOpenChronology: () => void }) {
  return <div className="space-y-5 p-4 sm:p-7">
    <section className="rounded-2xl border border-amber-700/15 bg-gradient-to-br from-[#fffaf0] to-[#f3ead5] p-4 dark:border-amber-200/10 dark:from-[#15243a] dark:to-[#101a2d] sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-amber-900 dark:text-amber-200">Génesis · capítulo 1 · guía de estudio</p><h4 className="mt-2 font-serif text-2xl sm:text-3xl">{genesisChapterOne.title}</h4><p className="mt-2 max-w-4xl text-sm leading-7 text-slate-700 dark:text-slate-200">{genesisChapterOne.summary}</p><div className="mt-4"><button type="button" onClick={onOpenChronology} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-amber-700/20 bg-white/70 px-4 text-xs font-bold text-amber-950 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/20 dark:bg-white/[.04] dark:text-amber-100"><ScrollText size={15} />Ver cronología de este capítulo</button></div></section>

    <section><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-amber-900 dark:text-amber-200">El capítulo en seis escenas</p><h4 className="mt-1 font-serif text-2xl">Una secuencia para observar</h4></div><p className="text-[10px] text-slate-500 dark:text-slate-400">Secuencia narrativa · no asigna fechas de calendario</p></div><ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{genesisChapterOne.structure.map((step, index) => <li key={step.label} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[.03]"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-[.13em] text-amber-900 dark:text-amber-200">{step.label}</span><span className="grid size-6 place-items-center rounded-full bg-amber-100 text-[10px] font-black text-amber-950 dark:bg-amber-200/10 dark:text-amber-100">{index + 1}</span></div><h5 className="mt-1 font-semibold">{step.theme}</h5><div className="mt-2 text-xs"><References references={[step.reference]} /></div></li>)}</ol><p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">La narración de la semana continúa con el día de reposo en Génesis 2:1-3.</p></section>

    <section aria-labelledby="genesis-next-scenes-title" className="relative isolate overflow-hidden rounded-[1.6rem] border border-amber-700/20 bg-gradient-to-br from-[#fffaf0] via-[#f5edda] to-[#efe2c4] p-4 shadow-[0_24px_60px_-48px_rgba(83,59,18,.55)] dark:border-amber-100/10 dark:from-[#17253c] dark:via-[#111d31] dark:to-[#0c1527] sm:p-6">
      <BorderBeam className="bible-story-border-beam" size={180} duration={22} borderWidth={1} colorFrom="#b87918" colorTo="#f3d58b" />
      <div className="relative z-10">
        <div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-amber-900 dark:text-amber-200">Ventana narrativa · Génesis 2</p><h4 id="genesis-next-scenes-title" className="mt-2 font-serif text-2xl text-[#15213a] dark:text-[#f7f3e8] sm:text-3xl">Del comienzo al jardín.</h4><p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">Estas escenas amplían el relato que sigue: el huerto preparado por Dios y la tarea de Adán de nombrar a los animales. Las presentamos como ilustraciones artísticas, no como reconstrucciones históricas.</p></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <article className="bible-story-card overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_18px_45px_-36px_rgba(18,31,52,.65)] dark:border-white/10 dark:bg-slate-950/55">
            <div className="bible-story-image-wrap"><img src="/images/bible-study/eden-garden-study.webp" alt="Ilustración artística de un jardín abundante con árboles, flores y agua corriente, inspirada en Génesis 2." loading="lazy" decoding="async" sizes="(max-width: 1024px) 100vw, 50vw" className="bible-story-image" /><span className="bible-story-image-label">El huerto · Génesis 2:8-17</span></div>
            <div className="p-4 sm:p-5"><h5 className="font-serif text-xl text-[#15213a] dark:text-[#f7f3e8]">Un hogar para cuidar</h5><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">El jardín aparece como un lugar de vida y responsabilidad. La escena invita a observar el agua, los árboles y la tarea confiada al ser humano.</p><details className="bible-story-details mt-3 rounded-xl border border-amber-700/15 bg-amber-50/70 px-3.5 py-3 dark:border-amber-200/10 dark:bg-amber-200/[.04]"><summary className="cursor-pointer text-xs font-bold text-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-100">Abrir una observación</summary><p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">Génesis 2:15 expresa tanto servicio como cuidado: el ser humano es puesto en el jardín para trabajarlo y guardarlo. Lee el pasaje completo antes de explorar sus interpretaciones.</p></details><div className="mt-4"><BibleVerseLink reference="Génesis 2:8-17" className="inline-flex min-h-10 items-center rounded-full border border-amber-700/20 bg-white/75 px-3 text-xs font-bold text-blue-800 hover:border-amber-600/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/15 dark:bg-white/[.04] dark:text-amber-200" /></div></div>
          </article>
          <article className="bible-story-card overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_18px_45px_-36px_rgba(18,31,52,.65)] dark:border-white/10 dark:bg-slate-950/55">
            <div className="bible-story-image-wrap"><img src="/images/bible-study/adam-naming-animals-study.webp" alt="Ilustración artística de Adán, vestido con sencillez, observando con calma varios animales en el jardín." loading="lazy" decoding="async" sizes="(max-width: 1024px) 100vw, 50vw" className="bible-story-image" /><span className="bible-story-image-label">Adán y los animales · Génesis 2:18-20</span></div>
            <div className="p-4 sm:p-5"><h5 className="font-serif text-xl text-[#15213a] dark:text-[#f7f3e8]">Nombrar, observar, relacionarse</h5><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Adán observa a los seres vivos y les da nombre. La ilustración muestra la variedad de criaturas y la cercanía responsable, sin presentar el nombramiento como una escena de Génesis 1.</p><details className="bible-story-details mt-3 rounded-xl border border-amber-700/15 bg-amber-50/70 px-3.5 py-3 dark:border-amber-200/10 dark:bg-amber-200/[.04]"><summary className="cursor-pointer text-xs font-bold text-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-100">Abrir una pregunta para conversar</summary><p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">¿Qué puede comunicar el acto de nombrar sobre atención, conocimiento y responsabilidad? Distingue lo que el texto afirma de las aplicaciones que hacemos hoy.</p></details><div className="mt-4"><BibleVerseLink reference="Génesis 2:18-20" className="inline-flex min-h-10 items-center rounded-full border border-amber-700/20 bg-white/75 px-3 text-xs font-bold text-blue-800 hover:border-amber-600/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/15 dark:bg-white/[.04] dark:text-amber-200" /></div></div>
          </article>
        </div>
        <p className="mt-4 text-[10px] leading-5 text-slate-500 dark:text-slate-400">La guía detallada de Génesis 2 todavía no está publicada; estas tarjetas son un puente de lectura y no marcan ese capítulo como estudiado.</p>
      </div>
    </section>

    <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.03] sm:p-5"><h4 className="font-serif text-xl">Claves de lectura</h4><ul className="mt-3 space-y-3">{genesisChapterOne.observations.map((observation) => <li key={observation} className="flex gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-600 dark:bg-amber-200" />{observation}</li>)}</ul><div className="mt-5 rounded-xl border border-amber-700/15 bg-amber-50/70 p-3 dark:border-amber-200/10 dark:bg-amber-200/[.04]"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-amber-900 dark:text-amber-100">Ejes del pasaje</p><p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">Dios como Creador · bondad de la creación · vida ordenada · humanidad como imagen de Dios · responsabilidad sobre los seres vivos.</p><div className="mt-3"><References references={genesisChapterOne.relatedReferences} /></div></div></article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.03] sm:p-5"><div className="flex items-center gap-2"><Map size={17} className="text-amber-800 dark:text-amber-200" /><h4 className="font-serif text-xl">Un esquema, no un mapa geográfico</h4></div><p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">Génesis 1 no ubica el relato en ciudades o coordenadas. Este esquema muestra los ámbitos que el texto distingue y llena de vida.</p><div className="mt-4 grid gap-2">{genesisChapterOne.literaryMap.map((area, index) => <div key={area.name} className="flex items-center gap-3 rounded-xl border border-amber-700/10 bg-[#fbf6e9] px-3 py-2.5 dark:border-amber-200/10 dark:bg-amber-200/[.04]"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white text-[10px] font-black text-amber-900 dark:bg-white/10 dark:text-amber-100">{index + 1}</span><span><span className="block text-xs font-bold">{area.name}</span><span className="block text-[10px] text-slate-500 dark:text-slate-400">{area.detail}</span></span></div>)}</div><button type="button" onClick={onOpenAtlas} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-amber-700/20 px-3 text-xs font-bold text-amber-950 transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/20 dark:text-amber-100 dark:hover:bg-white/5">Abrir los mapas bíblicos <ArrowRight size={13} /></button></article>
    </section>

    <section className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
      <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.03] sm:p-5"><h4 className="font-serif text-xl">Personajes en este capítulo</h4><div className="mt-3 flex flex-wrap gap-2">{genesisChapterOne.relatedPeople.map((person) => <span key={person} className="rounded-full border border-amber-700/15 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 dark:border-amber-200/15 dark:bg-amber-200/[.05] dark:text-amber-100">{person}</span>)}</div><p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Adán y Eva aparecen por nombre en el relato posterior de Génesis 2–3, no en Génesis 1.</p></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.03] sm:p-5"><div className="flex items-center gap-2"><Sparkles size={16} className="text-amber-800 dark:text-amber-200" /><h4 className="font-serif text-xl">Mira, compara y conversa</h4></div><div className="mt-3 grid gap-2 sm:grid-cols-3">{genesisChapterOne.videos.map((video) => <a key={video.url} href={video.url} target="_blank" rel="noreferrer" className="flex min-h-20 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs transition hover:border-amber-600/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[.03]"><span><span className="block font-bold text-slate-800 dark:text-slate-100">{video.title}</span><span className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">Proyecto Biblia · {video.duration}</span></span><ExternalLink size={13} className="shrink-0 text-amber-800 dark:text-amber-200" /></a>)}</div><p className="mt-3 text-[10px] leading-5 text-slate-500 dark:text-slate-400">Videos enlazados al sitio oficial de Proyecto Biblia; el contenido y su reproducción pertenecen a su autor. Son recursos complementarios y no sustituyen la lectura del pasaje.</p></article>
    </section>
  </div>;
}
