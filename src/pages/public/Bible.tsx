import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, BookOpen, ChevronLeft, ChevronRight, Copy, X, 
  RefreshCw, ZoomIn, ZoomOut, CornerDownRight, 
  Info, HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { BIBLE_BOOKS } from '../../config/bibleBooks';
import type { BibleBook } from '../../config/bibleBooks';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';

interface Verse {
  verse: string;
  number: number;
  study: string | null;
  id: number;
}

interface ChapterData {
  testament: string;
  name: string;
  num_chapters: number;
  chapter: number;
  vers: Verse[];
}

interface SearchResult {
  verse: string;
  study: string | null;
  number: number;
  id: number;
  book: string;
  chapter: number;
}

interface SearchMeta {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

interface SearchResponse {
  data: SearchResult[];
  meta: SearchMeta;
}

const BIBLE_VERSIONS = [
  { id: 'rv1960', name: 'Reina Valera 1960 (RVR1960)' },
  { id: 'nvi', name: 'Nueva Versión Internacional (NVI)' },
  { id: 'dhh', name: 'Dios Habla Hoy (DHH)' },
  { id: 'pdt', name: 'Palabra de Dios para Todos (PDT)' },
  { id: 'kjv', name: 'King James Version (KJV)' },
  { id: 'rv1995', name: 'Reina Valera 1995 (RV1995)' },
];

export default function Bible() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Route/Query State
  const version = searchParams.get('version') || 'rv1960';
  const bookId = searchParams.get('libro') || 'genesis';
  const chapterNum = parseInt(searchParams.get('capitulo') || '1', 10);
  const searchQuery = searchParams.get('q') || '';
  const searchPage = parseInt(searchParams.get('page') || '1', 10);

  // UI / Logic States
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(18); // Default 18px

  // Search Results
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchMeta, setSearchMeta] = useState<SearchMeta | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Verses Selection Mode
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [activeSearchInput, setActiveSearchInput] = useState(searchQuery);

  // Modal selector State
  const [isIndexOpen, setIsIndexOpen] = useState(false);
  const [indexSearch, setIndexSearch] = useState('');
  const [selectedBookForChapters, setSelectedBookForChapters] = useState<BibleBook | null>(null);
  const [indexTab, setIndexTab] = useState<'Antiguo' | 'Nuevo'>('Antiguo');

  // Highlighted Verse (from search redirect or query param)
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const highlightedVerseRef = useRef<HTMLDivElement>(null);

  // Sync 'versiculo' query param with highlightedVerse state
  const searchParamsVerse = searchParams.get('versiculo');
  useEffect(() => {
    if (searchParamsVerse) {
      const vNum = parseInt(searchParamsVerse, 10);
      if (!isNaN(vNum)) {
        setHighlightedVerse(vNum);
      }
    } else {
      setHighlightedVerse(null);
    }
  }, [searchParamsVerse]);

  // Scroll dismiss scroll listener
  useEffect(() => {
    if (highlightedVerse === null) return;
    
    const initialScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = Math.abs(currentScrollY - initialScrollY);
      if (diff > 80) {
        setHighlightedVerse(null);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('versiculo');
        setSearchParams(newParams, { replace: true });
      }
    };

    const timer = setTimeout(() => {
      window.addEventListener('scroll', handleScroll);
    }, 800);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [highlightedVerse, searchParams, setSearchParams]);

  // Simple client caching of chapter requests
  const chapterCache = useRef<Record<string, ChapterData>>({});

  // Active Bible Book Meta
  const currentBook = useMemo(() => {
    return BIBLE_BOOKS.find(b => b.id === bookId) || BIBLE_BOOKS[0];
  }, [bookId]);

  // Normalize book names from API
  const findBookByIdOrName = (nameOrId: string): BibleBook | undefined => {
    const normalized = nameOrId.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-');
    
    return BIBLE_BOOKS.find(b => 
      b.id === normalized || 
      b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalized ||
      b.abbrev.toLowerCase() === normalized
    );
  };

  // Clear search metadata helper (declared as hoisted function to avoid temporal dead zone)
  function setIndexMetaNull() {
    setSearchResults([]);
    setSearchMeta(null);
  }

  // Fetch Chapter Text
  useEffect(() => {
    if (searchQuery) return; // Don't fetch chapters if search query is active
    
    const cacheKey = `${version}-${bookId}-${chapterNum}`;
    if (chapterCache.current[cacheKey]) {
      setChapterData(chapterCache.current[cacheKey]);
      setError(null);
      return;
    }

    const fetchChapter = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `https://bible-api.deno.dev/api/read/${version}/${bookId}/${chapterNum}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('No se pudo cargar el capítulo. Por favor, intenta de nuevo.');
        const data: ChapterData = await res.json();
        
        // Cache the result
        chapterCache.current[cacheKey] = data;
        setChapterData(data);
      } catch (err) {
        console.error(err);
        const errorMsg = err instanceof Error ? err.message : 'Error de conexión con la API de la Biblia.';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [version, bookId, chapterNum, searchQuery]);

  // Fetch Search Results
  useEffect(() => {
    if (!searchQuery) {
      // Avoid calling setState synchronously to prevent cascading renders
      const timer = setTimeout(() => {
        setIndexMetaNull();
      }, 0);
      return () => clearTimeout(timer);
    }

    const fetchSearch = async () => {
      setSearchLoading(true);
      try {
        const url = `https://bible-api.deno.dev/api/read/${version}/search?q=${encodeURIComponent(searchQuery)}&take=20&page=${searchPage}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al buscar pasajes bíblicos.');
        const data: SearchResponse = await res.json();
        setSearchResults(data.data || []);
        setSearchMeta(data.meta || null);
      } catch (err) {
        console.error(err);
        toast.error('Ocurrió un error al buscar en la Biblia.');
      } finally {
        setSearchLoading(false);
      }
    };

    const timer = setTimeout(fetchSearch, 300);
    return () => clearTimeout(timer);
  }, [version, searchQuery, searchPage]);

  // Scroll to Highlighted Verse
  useEffect(() => {
    if (chapterData && highlightedVerse && !loading) {
      const timer = setTimeout(() => {
        if (highlightedVerseRef.current) {
          highlightedVerseRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight flash effect is handled by Tailwind animation classes
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [chapterData, highlightedVerse, loading]);

  // Route updates helper
  const updateRoute = (params: Record<string, string | number | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, val]) => {
      if (val === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(val));
      }
    });
    setSearchParams(newParams);
  };

  // Selection/Copy Mechanics
  const toggleVerseSelection = (verseNum: number) => {
    if (selectedVerses.includes(verseNum)) {
      setSelectedVerses(selectedVerses.filter(v => v !== verseNum));
    } else {
      setSelectedVerses([...selectedVerses, verseNum].sort((a, b) => a - b));
    }
  };

  // Format and build passage reference
  const getReferenceString = (verses: number[]) => {
    if (verses.length === 0) return '';
    const sorted = [...verses].sort((a, b) => a - b);
    const groups: string[] = [];
    let start = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i <= sorted.length; i++) {
      const curr = sorted[i];
      if (curr === prev + 1) {
        prev = curr;
      } else {
        if (start === prev) {
          groups.push(`${start}`);
        } else {
          groups.push(`${start}-${prev}`);
        }
        start = curr;
        prev = curr;
      }
    }

    const versionMeta = BIBLE_VERSIONS.find(v => v.id === version);
    const verName = versionMeta ? versionMeta.name.split(' ')[0] : version.toUpperCase();
    return `${currentBook.name} ${chapterNum}:${groups.join(', ')} (${verName})`;
  };

  // Copy Action
  const handleCopySelection = (onlyText: boolean) => {
    if (!chapterData || selectedVerses.length === 0) return;

    const selectedVersesData = chapterData.vers.filter(v => selectedVerses.includes(v.number));
    
    // Concatenate text
    let text = selectedVersesData.map(v => `[${v.number}] ${v.verse}`).join(' ');

    if (!onlyText) {
      const ref = getReferenceString(selectedVerses);
      text = `"${text}" - ${ref}`;
    }

    navigator.clipboard.writeText(text);
    toast.success(onlyText ? 'Texto copiado al portapapeles 📋' : 'Pasaje copiado con cita bíblica 📖');
    setSelectedVerses([]); // Clear selection after copy
  };

  // Quick Copy single verse
  const handleCopySingle = (
    verse: { verse: string; number: number }, 
    withRef: boolean, 
    customBook?: string, 
    customChapter?: number
  ) => {
    let text = verse.verse;
    if (withRef) {
      const versionMeta = BIBLE_VERSIONS.find(v => v.id === version);
      const verName = versionMeta ? versionMeta.name.split(' ')[0] : version.toUpperCase();
      const bName = customBook || currentBook.name;
      const cNum = customChapter || chapterNum;
      text = `"${text}" (${bName} ${cNum}:${verse.number} ${verName})`;
    }
    navigator.clipboard.writeText(text);
    toast.success('Versículo copiado al portapapeles');
  };

  // Chapter navigation (Prev/Next)
  const navigateChapter = (dir: 'prev' | 'next') => {
    setSelectedVerses([]);
    setHighlightedVerse(null);

    const bookIdx = BIBLE_BOOKS.findIndex(b => b.id === bookId);
    if (bookIdx === -1) return;

    if (dir === 'next') {
      if (chapterNum < currentBook.chapters) {
        updateRoute({ capitulo: chapterNum + 1 });
      } else if (bookIdx < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[bookIdx + 1];
        updateRoute({ libro: nextBook.id, capitulo: 1 });
      } else {
        toast.info('Estás en el último capítulo de la Biblia.');
      }
    } else {
      if (chapterNum > 1) {
        updateRoute({ capitulo: chapterNum - 1 });
      } else if (bookIdx > 0) {
        const prevBook = BIBLE_BOOKS[bookIdx - 1];
        updateRoute({ libro: prevBook.id, capitulo: prevBook.chapters });
      } else {
        toast.info('Estás en el primer capítulo de la Biblia.');
      }
    }
  };

  // Search logic handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSearchInput.trim() === '') {
      updateRoute({ q: null, page: null });
    } else {
      updateRoute({ q: activeSearchInput.trim(), page: 1 });
    }
  };

  const clearSearch = () => {
    setActiveSearchInput('');
    updateRoute({ q: null, page: null });
  };

  // Jump from search result to reading passage
  const jumpToPassage = (res: SearchResult) => {
    const book = findBookByIdOrName(res.book);
    if (!book) {
      toast.error('No se pudo encontrar el libro especificado.');
      return;
    }
    
    setHighlightedVerse(res.number);
    setSelectedVerses([]);
    
    // Clear search and load passage
    updateRoute({
      libro: book.id,
      capitulo: res.chapter,
      q: null,
      page: null
    });
    setActiveSearchInput('');
  };

  // Index Picker Helpers
  const filteredBooks = useMemo(() => {
    const searchLower = indexSearch.toLowerCase();
    return BIBLE_BOOKS.filter(b => 
      b.name.toLowerCase().includes(searchLower) || 
      b.abbrev.toLowerCase().includes(searchLower)
    );
  }, [indexSearch]);

  const otBooks = useMemo(() => filteredBooks.filter(b => b.testament === 'Antiguo'), [filteredBooks]);
  const ntBooks = useMemo(() => filteredBooks.filter(b => b.testament === 'Nuevo'), [filteredBooks]);

  const selectBookForIndex = (book: BibleBook) => {
    if (book.chapters === 1) {
      // Direct load if book has only 1 chapter (e.g. Abdías, Filemón, Judas, etc.)
      updateRoute({ libro: book.id, capitulo: 1 });
      setIsIndexOpen(false);
      setIndexSearch('');
      setSelectedBookForChapters(null);
    } else {
      setSelectedBookForChapters(book);
    }
  };

  const selectChapterFromIndex = (chap: number) => {
    if (selectedBookForChapters) {
      updateRoute({ libro: selectedBookForChapters.id, capitulo: chap });
      setIsIndexOpen(false);
      setIndexSearch('');
      setSelectedBookForChapters(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 transition-colors duration-200">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-850 via-amber-900 to-slate-900 text-white py-14 px-4 border-b border-gold/15 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <AnimeFadeUp delay={0} duration={600}>
            <div className="inline-flex p-3 bg-gold/10 text-gold rounded-3xl border border-gold/20 mb-2 shadow-inner">
              <BookOpen size={30} className="animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">La Santa Biblia</h1>
            <p className="text-amber-100/90 text-sm md:text-base max-w-xl mx-auto font-light">
              Explora, busca pasajes doctrinales y medita en la Palabra de Dios de forma rápida y sencilla.
            </p>
          </AnimeFadeUp>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        
        {/* Main Controls Panel */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 p-4 rounded-3xl shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Version Select */}
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider pl-1">Versión</span>
              <select
                value={version}
                onChange={(e) => updateRoute({ version: e.target.value })}
                className="text-xs bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-white/5 rounded-2xl px-4 py-2.5 outline-none dark:text-white font-semibold cursor-pointer min-w-[200px]"
              >
                {BIBLE_VERSIONS.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* Index Trigger (Book & Chapter) */}
            {!searchQuery && (
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider pl-1">Pasaje</span>
                <button
                  onClick={() => {
                    setIsIndexOpen(true);
                    setSelectedBookForChapters(null);
                    setIndexTab(currentBook.testament);
                  }}
                  className="flex items-center justify-between gap-3 text-xs bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-2xl px-4 py-2.5 outline-none text-primary dark:text-gold font-bold cursor-pointer transition w-full sm:min-w-[180px]"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen size={14} className="text-amber-600 dark:text-gold" />
                    {currentBook.name} {chapterNum}
                  </span>
                  <ChevronRight size={14} className="text-gray-400 rotate-90" />
                </button>
              </div>
            )}
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={activeSearchInput}
                onChange={(e) => setActiveSearchInput(e.target.value)}
                placeholder="Buscar palabras o versículos en la Biblia..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-white/5 rounded-2xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none dark:text-white font-medium"
              />
              {activeSearchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: SEARCH RESULTS VIEW */}
        {/* ======================================================== */}
        {searchQuery ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 p-4 rounded-2xl">
              <div>
                <h2 className="text-sm font-serif font-bold text-gray-800 dark:text-white">
                  Resultados de búsqueda para: <span className="text-amber-700 dark:text-gold">"{searchQuery}"</span>
                </h2>
                <p className="text-xxs text-gray-400 mt-0.5">
                  {searchMeta ? `${searchMeta.total} concordancias encontradas` : 'Buscando...'}
                </p>
              </div>
              <button
                onClick={clearSearch}
                className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition cursor-pointer"
              >
                <X size={12} />
                <span>Cerrar búsqueda</span>
              </button>
            </div>

            {searchLoading ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-3xl p-20 flex flex-col justify-center items-center gap-3 animate-pulse">
                <RefreshCw className="animate-spin text-amber-700 dark:text-gold" size={28} />
                <span className="text-xs text-gray-400 font-semibold">Buscando concordancias bíblicas...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-3xl p-16 text-center space-y-4">
                <HelpCircle className="mx-auto text-gray-300 dark:text-slate-800 animate-pulse" size={48} />
                <h4 className="font-bold text-xs text-gray-800 dark:text-white uppercase tracking-wider">
                  Sin resultados
                </h4>
                <p className="text-xxs text-gray-400 leading-relaxed max-w-[320px] mx-auto">
                  No pudimos encontrar la palabra o frase en esta versión. Intenta buscar términos más cortos o cambia de versión.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search Cards list */}
                <div className="grid grid-cols-1 gap-4">
                  {searchResults.map((res, index) => (
                    <div
                      key={`${res.book}-${res.chapter}-${res.number}-${index}`}
                      className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-gold/50 transition-all duration-200"
                    >
                      <div className="space-y-1.5 flex-1 pr-4">
                        <span className="text-xxs font-bold text-amber-700 dark:text-gold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-lg border border-amber-250/20">
                          {res.book} {res.chapter}:{res.number}
                        </span>
                        {res.study && (
                          <p className="text-[10px] italic font-semibold text-slate-400 dark:text-slate-500 mt-1">
                            ({res.study})
                          </p>
                        )}
                        <p className="text-xs md:text-sm text-gray-700 dark:text-gray-350 leading-relaxed font-serif italic pt-1">
                          "{res.verse}"
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => handleCopySingle(res, true, res.book, res.chapter)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-gray-250/20 text-gray-500 dark:text-gray-400 cursor-pointer"
                          title="Copiar versículo con referencia"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => jumpToPassage(res)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-gold border border-amber-200/20 dark:border-gold/30 rounded-xl text-xxs font-bold uppercase transition cursor-pointer"
                        >
                          <span>Ir al pasaje</span>
                          <CornerDownRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {searchMeta && searchMeta.pageCount > 1 && (
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 px-5 py-3 rounded-2xl shadow-2xs">
                    <button
                      disabled={searchPage <= 1}
                      onClick={() => updateRoute({ page: searchPage - 1 })}
                      className="flex items-center gap-1 text-xxs font-bold text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:pointer-events-none hover:text-primary transition cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                      <span>Anterior</span>
                    </button>
                    <span className="text-[10px] font-semibold text-gray-400">
                      Página {searchMeta.page} de {searchMeta.pageCount}
                    </span>
                    <button
                      disabled={searchPage >= searchMeta.pageCount}
                      onClick={() => updateRoute({ page: searchPage + 1 })}
                      className="flex items-center gap-1 text-xxs font-bold text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:pointer-events-none hover:text-primary transition cursor-pointer"
                    >
                      <span>Siguiente</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // ========================================================
          // VIEW 2: CHAPTER READING VIEW
          // ========================================================
          <div className="space-y-6">
            {/* Header controls for chapter navigation */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 px-4 py-3 rounded-3xl shadow-2xs">
              <button
                onClick={() => navigateChapter('prev')}
                className="p-2 border border-gray-200 dark:border-white/5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 rounded-full text-slate-600 dark:text-gold transition cursor-pointer"
                title="Capítulo Anterior"
              >
                <ChevronLeft size={18} />
              </button>

              <h2 className="text-base md:text-lg font-serif font-bold text-gray-800 dark:text-white text-center">
                {currentBook.name} {chapterNum}
              </h2>

              <div className="flex items-center gap-2">
                {/* Font adjustments */}
                <div className="hidden sm:flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/5 mr-2">
                  <button
                    onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white cursor-pointer"
                    title="Reducir fuente"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span className="text-[10px] font-bold px-1 text-slate-600 dark:text-gray-300">
                    A
                  </span>
                  <button
                    onClick={() => setFontSize(Math.min(26, fontSize + 2))}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white cursor-pointer"
                    title="Aumentar fuente"
                  >
                    <ZoomIn size={13} />
                  </button>
                </div>

                <button
                  onClick={() => navigateChapter('next')}
                  className="p-2 border border-gray-200 dark:border-white/5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 rounded-full text-slate-600 dark:text-gold transition cursor-pointer"
                  title="Siguiente Capítulo"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Reading Content */}
            {loading ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-3xl p-28 flex flex-col justify-center items-center gap-3 animate-pulse">
                <RefreshCw className="animate-spin text-amber-700 dark:text-gold" size={32} />
                <span className="text-xs text-gray-400 font-semibold">Cargando capítulo de las Escrituras...</span>
              </div>
            ) : error ? (
              <div className="bg-white dark:bg-slate-900 border border-red-200/50 dark:border-red-950/20 rounded-3xl p-16 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 text-red-600 flex items-center justify-center">
                  <X size={24} />
                </div>
                <h4 className="font-bold text-xs text-gray-800 dark:text-white uppercase tracking-wider">
                  Error de carga
                </h4>
                <p className="text-xxs text-gray-400 leading-relaxed max-w-[280px] mx-auto">
                  {error}
                </p>
                <button
                  onClick={() => updateRoute({})}
                  className="flex items-center gap-1 mx-auto px-4 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-gold border border-amber-200/20 dark:border-gold/30 rounded-xl text-xxs font-bold uppercase transition cursor-pointer"
                >
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Reintentar</span>
                </button>
              </div>
            ) : chapterData ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-3xl p-6 md:p-10 shadow-2xs space-y-6 relative">
                
                {/* Guide banner for copying instruction */}
                <div className="text-[10px] text-gray-400 flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-4">
                  <Info size={13} className="text-amber-600 dark:text-gold" />
                  <span>Consejo: Haz clic en los versículos para seleccionarlos y copiarlos juntos.</span>
                </div>

                <div 
                  className="space-y-4 font-serif leading-relaxed dark:text-gray-100 selection:bg-gold/20 select-none md:select-text"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {chapterData.vers.map((v) => {
                    const isSelected = selectedVerses.includes(v.number);
                    const isHighlighted = highlightedVerse === v.number;
                    const isDimmed = highlightedVerse !== null && !isHighlighted;
                    
                    return (
                      <div 
                        key={v.id} 
                        ref={isHighlighted ? highlightedVerseRef : undefined}
                        className={`group relative py-2 rounded-2xl px-3.5 transition-all duration-500 ${
                          isSelected 
                            ? 'bg-amber-500/10 border-l-4 border-amber-600 dark:border-gold pl-4' 
                            : isHighlighted 
                            ? 'bg-gradient-to-r from-amber-500/20 to-gold/10 border-l-4 border-amber-500 dark:border-gold pl-4 shadow-xs ring-1 ring-gold/15'
                            : isDimmed 
                            ? 'opacity-35 dark:opacity-25 transition-opacity'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-850/50'
                        }`}
                      >
                        {/* Heading study subtitle */}
                        {v.study && (
                          <h3 className="text-xs md:text-sm font-bold text-gray-500 dark:text-slate-400 font-sans tracking-wide uppercase italic pt-4 pb-2">
                            {v.study}
                          </h3>
                        )}

                        <div className="flex items-start gap-1">
                          {/* clickable verse number/trigger selection */}
                          <span 
                            onClick={() => toggleVerseSelection(v.number)}
                            className={`text-xs md:text-sm font-bold select-none cursor-pointer pr-1 shrink-0 ${
                              isSelected ? 'text-amber-800 dark:text-gold' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {v.number}
                          </span>

                          {/* Verse Text */}
                          <p 
                            onClick={() => toggleVerseSelection(v.number)}
                            className="flex-1 cursor-pointer py-0.5"
                          >
                            {v.verse}
                          </p>

                          {/* Individual quick copy actions overlay (on hover for desktops) */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute right-2 top-1.5 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 border border-gray-150 dark:border-white/10 rounded-xl px-1.5 py-1 shadow-md scale-90">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopySingle(v, false);
                              }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-gray-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                              title="Copiar texto del versículo"
                            >
                              <Copy size={11} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopySingle(v, true);
                              }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-gray-450 hover:text-amber-800 dark:hover:text-gold transition cursor-pointer flex items-center gap-0.5"
                              title="Copiar con cita bíblica"
                            >
                              <Copy size={11} />
                              <span className="text-[8px] font-bold">CITA</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Next / Prev buttons at the very bottom of the text */}
                <div className="flex justify-between items-center border-t border-gray-100 dark:border-white/5 pt-6 mt-8">
                  <button
                    onClick={() => navigateChapter('prev')}
                    className="flex items-center gap-1 px-4 py-2 border border-gray-250/20 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 rounded-xl text-xxs font-bold uppercase transition cursor-pointer text-gray-500 dark:text-gray-300"
                  >
                    <ChevronLeft size={14} />
                    <span>Anterior</span>
                  </button>
                  <span className="text-[10px] font-bold text-gray-400">
                    {currentBook.name} {chapterNum}
                  </span>
                  <button
                    onClick={() => navigateChapter('next')}
                    className="flex items-center gap-1 px-4 py-2 border border-gray-250/20 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 rounded-xl text-xxs font-bold uppercase transition cursor-pointer text-gray-500 dark:text-gray-300"
                  >
                    <span>Siguiente</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* FLOATING ACTION BAR FOR MULTI-VERSE COPY */}
      {/* ======================================================== */}
      {selectedVerses.length > 0 && (
        <div className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-slate-900/95 border border-amber-600/30 dark:border-gold/30 rounded-2xl shadow-xl px-5 py-3.5 flex items-center justify-between gap-4 max-w-lg w-[90%] backdrop-blur-md">
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-800 dark:text-white">
              {selectedVerses.length} {selectedVerses.length === 1 ? 'versículo seleccionado' : 'versículos seleccionados'}
            </p>
            <p className="text-[9px] text-amber-700 dark:text-gold font-semibold max-w-[200px] truncate">
              {getReferenceString(selectedVerses)}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleCopySelection(true)}
              className="flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-gray-200 dark:border-white/5 rounded-xl text-[9px] font-bold uppercase transition cursor-pointer text-slate-650 dark:text-gray-300"
            >
              <Copy size={11} />
              <span>Solo texto</span>
            </button>
            <button
              onClick={() => handleCopySelection(false)}
              className="flex items-center gap-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white dark:bg-gold dark:hover:bg-yellow-600 dark:text-slate-900 rounded-xl text-[9px] font-bold uppercase transition cursor-pointer"
            >
              <Copy size={11} />
              <span>Con cita</span>
            </button>
            <button
              onClick={() => setSelectedVerses([])}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-gray-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
              title="Cancelar selección"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* INDEX SELECTOR MODAL (BOOK & CHAPTER PICKER) */}
      {/* ======================================================== */}
      {isIndexOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsIndexOpen(false)}></div>
          
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-150 dark:border-white/10 overflow-hidden z-10 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-150 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="text-amber-700 dark:text-gold" size={20} />
                <h3 className="text-base font-serif font-bold text-gray-800 dark:text-white">
                  {selectedBookForChapters ? `Selecciona Capítulo: ${selectedBookForChapters.name}` : 'Índice de la Biblia'}
                </h3>
              </div>
              <button
                onClick={() => setIsIndexOpen(false)}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            {selectedBookForChapters ? (
              // SUB-VIEW: CHAPTERS PICKER FOR SELECTED BOOK
              <div className="p-6 overflow-y-auto space-y-5">
                <button
                  onClick={() => setSelectedBookForChapters(null)}
                  className="flex items-center gap-1.5 text-xxs font-bold text-amber-700 dark:text-gold uppercase tracking-wider hover:underline"
                >
                  <ChevronLeft size={14} />
                  <span>Volver a la lista de libros</span>
                </button>

                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2.5">
                  {Array.from({ length: selectedBookForChapters.chapters }, (_, i) => i + 1).map((chap) => {
                    const isCurrent = selectedBookForChapters.id === bookId && chap === chapterNum;
                    return (
                      <button
                        key={chap}
                        onClick={() => selectChapterFromIndex(chap)}
                        className={`aspect-square flex items-center justify-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-amber-600 border-amber-600 text-white shadow-md'
                            : 'border-gray-200 dark:border-white/10 text-gray-650 dark:text-gray-300 bg-white dark:bg-slate-950 hover:border-amber-400 dark:hover:border-gold'
                        }`}
                      >
                        {chap}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              // MAIN VIEW: BOOK LIST WITH FILTER AND TESTAMENT TABS
              <div className="flex-1 flex flex-col min-h-0">
                {/* Search & Tabs bar */}
                <div className="p-4 border-b border-gray-100 dark:border-white/5 space-y-3 shrink-0">
                  {/* Local index search input */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={indexSearch}
                      onChange={(e) => setIndexSearch(e.target.value)}
                      placeholder="Filtrar libro (p. ej. Mateo, Juan, 1 Samuel)..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-250/20 rounded-xl text-xxs outline-none dark:text-white font-medium"
                    />
                  </div>

                  {/* Testament Tabs */}
                  <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/5 w-fit">
                    <button
                      onClick={() => setIndexTab('Antiguo')}
                      className={`px-4 py-1.5 rounded-lg text-xxs font-bold transition-all cursor-pointer ${
                        indexTab === 'Antiguo'
                          ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-gold shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
                      }`}
                    >
                      Antiguo Testamento
                    </button>
                    <button
                      onClick={() => setIndexTab('Nuevo')}
                      className={`px-4 py-1.5 rounded-lg text-xxs font-bold transition-all cursor-pointer ${
                        indexTab === 'Nuevo'
                          ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-gold shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
                      }`}
                    >
                      Nuevo Testamento
                    </button>
                  </div>
                </div>

                {/* Books Grid */}
                <div className="p-5 overflow-y-auto flex-1 min-h-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(indexTab === 'Antiguo' ? otBooks : ntBooks).map((book) => {
                      const isCurrent = book.id === bookId;
                      return (
                        <button
                          key={book.id}
                          onClick={() => selectBookForIndex(book)}
                          className={`flex flex-col items-start justify-center p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            isCurrent
                              ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-gold dark:bg-amber-950/20'
                              : 'border-gray-200 dark:border-white/10 hover:border-amber-300 dark:hover:border-gold hover:bg-slate-50 dark:hover:bg-slate-850/50'
                          }`}
                        >
                          <span className="text-xs font-serif font-bold text-gray-800 dark:text-white">{book.name}</span>
                          <span className="text-[9px] text-gray-400 font-semibold uppercase mt-0.5">{book.abbrev} • {book.chapters} cap.</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Empty state inside modal */}
                  {(indexTab === 'Antiguo' ? otBooks : ntBooks).length === 0 && (
                    <p className="text-center text-xxs text-gray-450 dark:text-gray-500 py-10 font-semibold">
                      Ningún libro coincide con la búsqueda.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
