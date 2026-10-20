import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ExternalLink, LoaderCircle, X } from 'lucide-react';
import { BIBLE_BOOKS } from '../../config/bibleBooks';
import { parseBibleReferences, parseVerseRange } from '../../utils/bibleParser';

interface BibleVersePreviewProps {
  reference: string;
  className?: string;
  appearance?: 'pill' | 'link';
}

interface BibleApiVerse {
  verse: number;
  text?: string;
}

const AUTO_CLOSE_MS = 12_000;

/** Small, dismissible reading preview that links to the same passage in the Bible reader. */
export default function BibleVersePreview({ reference, className = '', appearance = 'pill' }: BibleVersePreviewProps) {
  const parsedReference = useMemo(() => parseBibleReferences(reference).find((item) => item.bookId), [reference]);
  const [isOpen, setIsOpen] = useState(false);
  const [verses, setVerses] = useState<BibleApiVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const bibleUrl = parsedReference
    ? `/recursos/biblia?libro=${encodeURIComponent(parsedReference.bookId)}&capitulo=${encodeURIComponent(parsedReference.chapter)}${parsedReference.verses ? `&versiculo=${encodeURIComponent(parsedReference.verses.replace(/\s+/g, ''))}` : ''}`
    : '/recursos/biblia';

  useEffect(() => {
    if (!isOpen) return undefined;

    const controller = new AbortController();
    const closeTimer = window.setTimeout(() => setIsOpen(false), AUTO_CLOSE_MS);
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setIsOpen(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer, true);
    document.addEventListener('keydown', closeOnEscape, true);

    const loadVerses = async () => {
      if (!parsedReference?.bookId || !parsedReference.chapter) {
        setError('No se pudo interpretar esta referencia. Puedes abrir la Biblia para buscarla.');
        return;
      }

      const bookIndex = BIBLE_BOOKS.findIndex((book) => book.id === parsedReference.bookId);
      if (bookIndex < 0) {
        setError('No encontramos el libro para mostrar el pasaje.');
        return;
      }

      setLoading(true);
      setError(null);
      setVerses([]);
      try {
        const response = await fetch(`https://bolls.life/get-chapter/RV1960/${bookIndex + 1}/${parsedReference.chapter}/`, { signal: controller.signal });
        if (!response.ok) throw new Error(`La fuente bíblica respondió ${response.status}.`);
        const chapter = await response.json() as BibleApiVerse[];
        const selectedVerseNumbers = parseVerseRange(parsedReference.verses);
        const selectedVerses = selectedVerseNumbers.length
          ? chapter.filter((verse) => selectedVerseNumbers.includes(verse.verse))
          : chapter;
        if (selectedVerses.length === 0) throw new Error('La referencia no contiene versículos disponibles.');
        setVerses(selectedVerses);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        console.error('No se pudo cargar la vista previa del pasaje bíblico.', loadError);
        setError('No pudimos cargar el texto ahora. Puedes abrir el pasaje en la Biblia.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadVerses();
    return () => {
      controller.abort();
      window.clearTimeout(closeTimer);
      document.removeEventListener('pointerdown', closeOnOutsidePointer, true);
      document.removeEventListener('keydown', closeOnEscape, true);
    };
  }, [isOpen, parsedReference]);

  if (!parsedReference) return <span className={className}>{reference}</span>;

  return (
    <div ref={containerRef} className="relative inline-flex max-w-full">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Leer ${reference}`}
        onClick={() => setIsOpen((open) => !open)}
        className={`${appearance === 'pill' ? 'inline-flex min-h-10 items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-950 underline decoration-amber-500/50 underline-offset-4 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:bg-amber-300/10 dark:text-amber-200 dark:hover:bg-amber-300/15' : 'inline-flex min-h-10 items-center rounded-sm bg-transparent p-0 text-sm font-semibold text-current underline decoration-amber-500/50 underline-offset-4 transition hover:bg-transparent hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:hover:text-amber-200'} ${className}`}
      >
        {appearance === 'pill' && <BookOpen size={16} aria-hidden="true" />}
        <span>{reference}</span>
      </button>

      {isOpen && <section
        role="dialog"
        aria-label={`Vista previa de ${reference}`}
        className="absolute left-0 top-full z-[70] mt-2 w-[min(24rem,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-amber-200 bg-white text-left shadow-[0_18px_50px_rgba(15,23,42,.28)] dark:border-amber-200/20 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/10">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">Lectura bíblica · RVR1960</p>
            <h3 className="mt-1 truncate text-sm font-extrabold text-slate-950 dark:text-white">{parsedReference.original}</h3>
          </div>
          <button type="button" onClick={() => { setIsOpen(false); triggerRef.current?.focus(); }} aria-label="Cerrar vista previa" className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-slate-300 dark:hover:bg-white/10">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-[38vh] overflow-y-auto px-4 py-3 text-sm leading-6 text-slate-700 dark:text-slate-200" aria-live="polite">
          {loading ? <p role="status" className="flex items-center gap-2 py-2 text-slate-500"><LoaderCircle size={16} className="animate-spin" aria-hidden="true" />Cargando el pasaje…</p>
            : error ? <p role="alert">{error}</p>
              : <ol className="space-y-2">{verses.map((verse) => <li key={verse.verse} className="flex gap-2"><span className="shrink-0 text-xs font-black text-amber-700 dark:text-amber-300">{verse.verse}</span><a href={bibleUrl} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${reference} en una pestaña nueva`} className="rounded-sm underline decoration-amber-500/50 underline-offset-2 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:text-amber-200">{verse.text?.replace(/<[^>]*>?/gm, '')}</a></li>)}</ol>}
        </div>
        <div className="border-t border-slate-100 px-4 py-3 dark:border-white/10">
          <a href={bibleUrl} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${reference} en la Biblia en una pestaña nueva`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-950 px-4 text-sm font-bold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300">
            Abrir en la Biblia <ExternalLink size={15} aria-hidden="true" />
          </a>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Esta vista se cierra automáticamente en unos segundos.</p>
        </div>
      </section>}
    </div>
  );
}
