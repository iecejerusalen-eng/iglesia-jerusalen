import { useEffect, useRef, useState } from 'react';
import { BookOpen, Clock3, Copy, ExternalLink, Loader2, Search, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  BibleLookupError,
  type BibleHistoryItem,
  type BiblePassageResult,
  buildBibleChapterUrl,
  loadBibleHistory,
  lookupBiblePassage,
  saveBibleHistory,
} from './content/bibleLookup';

function lookupErrorMessage(error: unknown): string {
  if (error instanceof BibleLookupError) return error.message;
  return 'No pudimos completar la búsqueda. Inténtalo nuevamente.';
}

export function BibleScratchpadTool() {
  const [initialHistory] = useState(loadBibleHistory);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BiblePassageResult | null>(null);
  const [history, setHistory] = useState<BibleHistoryItem[]>(initialHistory.items);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(initialHistory.error
    ? 'El historial guardado no está disponible en este dispositivo.'
    : null);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    if (initialHistory.error) console.error('No se pudo leer el historial bíblico.', initialHistory.error);
    return () => activeRequest.current?.abort();
  }, [initialHistory.error]);

  const runSearch = async (searchQuery: string) => {
    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) return;

    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setErrorMessage(null);

    try {
      const passage = await lookupBiblePassage(normalizedQuery, controller.signal);
      if (controller.signal.aborted) return;
      setResult(passage);
      if (passage.storageWarning) setStorageWarning(passage.storageWarning);
      setQuery(normalizedQuery);
      const item = { query: normalizedQuery, reference: passage.reference, searchedAt: new Date().toISOString() };
      try {
        saveBibleHistory(item);
        setHistory((current) => [item, ...current.filter((entry) => entry.query.toLocaleLowerCase('es') !== normalizedQuery.toLocaleLowerCase('es'))].slice(0, 8));
      } catch (storageError: unknown) {
        console.error('No se pudo guardar el historial bíblico.', storageError);
        setStorageWarning('El pasaje se encontró, pero no se pudo guardar en el historial.');
      }
    } catch (error: unknown) {
      if (error instanceof BibleLookupError && error.code === 'aborted') return;
      console.error('La búsqueda bíblica no se pudo completar.', error);
      const message = lookupErrorMessage(error);
      setResult(null);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    void runSearch(query);
  };

  const copyToClipboard = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(`“${result.text}” — ${result.reference} (${result.translationName})`);
      toast.success('Pasaje copiado al portapapeles');
    } catch (error: unknown) {
      console.error('No se pudo copiar el pasaje al portapapeles.', error);
      toast.error('No se pudo copiar. Revisa el permiso del portapapeles.');
    }
  };

  return (
    <div className="px-4 pb-5 pt-2">
      <div className="mb-4 flex items-center justify-center gap-2 text-white/60">
        <BookOpen size={17} aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-[0.18em]">Biblia rápida</span>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <label htmlFor="toolbox-bible-query" className="sr-only">Referencia bíblica</label>
        <input
          id="toolbox-bible-query"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ej: Juan 3:16"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white shadow-inner outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 placeholder:text-white/35"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          aria-label={loading ? 'Buscando pasaje' : 'Buscar pasaje'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/15 text-amber-300 transition hover:bg-amber-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:pointer-events-none disabled:opacity-40"
        >
          {loading ? <Loader2 size={19} className="animate-spin" aria-hidden="true" /> : <Search size={19} aria-hidden="true" />}
        </button>
      </form>

      {errorMessage && (
        <div role="alert" className="mb-4 flex gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-xs leading-relaxed text-rose-100">
          <WifiOff size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {result && (
        <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 text-left shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]">
          <p className="mb-4 max-h-40 overflow-y-auto pr-2 text-sm italic leading-relaxed text-white/80 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            “{result.text}”
          </p>
          <div className="border-t border-white/10 pt-3">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <strong className="text-xs text-amber-300">{result.reference}</strong>
              <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[11px] text-white/60" title={`ID: ${result.translationId}`}>
                {result.translationName}
              </span>
              {result.fromCache && <span className="text-[11px] text-emerald-300">Disponible sin conexión</span>}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void copyToClipboard()}
                className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-white/70 transition hover:bg-white/[0.09] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <Copy size={15} aria-hidden="true" /> Copiar
              </button>
              <a
                href={buildBibleChapterUrl(result)}
                className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 text-center text-xs font-semibold text-amber-200 transition hover:bg-amber-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <ExternalLink size={15} aria-hidden="true" /> Ver capítulo
              </a>
            </div>
          </div>
        </article>
      )}

      {!result && !loading && !errorMessage && (
        <p className="py-5 text-center text-xs font-medium leading-relaxed text-white/45">
          Escribe una referencia bíblica para buscarla al instante.
        </p>
      )}

      {history.length > 0 && (
        <section className="mt-4 border-t border-white/10 pt-3" aria-labelledby="bible-history-title">
          <h3 id="bible-history-title" className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-white/55">
            <Clock3 size={14} aria-hidden="true" /> Búsquedas recientes
          </h3>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 4).map((item) => (
              <button
                key={`${item.query}-${item.searchedAt}`}
                type="button"
                onClick={() => void runSearch(item.query)}
                title={item.reference}
                className="max-w-full truncate rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-white/60 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                {item.query}
              </button>
            ))}
          </div>
        </section>
      )}

      {storageWarning && <p role="status" className="mt-3 text-xs leading-relaxed text-amber-200/80">{storageWarning}</p>}
      <div className="sr-only" role="status" aria-live="polite">{loading ? 'Buscando pasaje bíblico' : result ? `${result.reference} encontrado` : ''}</div>
    </div>
  );
}
