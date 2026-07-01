import { BookOpen, RefreshCw, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import BibleVerseLink from '../../../components/ui/BibleVerseLink';
import { useDailyVerse } from '../hooks/useDailyVerse';
import { useAuthStore } from '../../../store/useAuthStore';
import { parseBibleReferences } from '../../../utils/bibleParser';

export const DailyVerseSection = () => {
  const { verseData, loading, error, fetchRandomVerse } = useDailyVerse();
  const { firstName } = useAuthStore();

  const handleCopy = () => {
    if (verseData && verseData.text) {
      const textToCopy = `"${verseData.text}" - ${verseData.reference}`;
      navigator.clipboard.writeText(textToCopy);
      toast.success('Versículo copiado al portapapeles');
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-4 md:px-8 mt-12 mb-16 relative">
      {/* Decorative background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[150%] bg-amber-50/50 dark:bg-amber-900/10 blur-3xl -z-10 rounded-[100%]" />
      
      <AnimeFadeUp className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none relative overflow-hidden">
        {/* Subtle decorative quote mark */}
        <div className="absolute -top-6 -left-6 text-9xl text-amber-100 dark:text-amber-950/30 font-serif opacity-50 select-none pointer-events-none">
          "
        </div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen size={14} />
            <span>Versículo del Día</span>
          </div>

          {loading ? (
            <div className="space-y-4 w-full max-w-2xl animate-pulse">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-5/6 mx-auto"></div>
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-4/6 mx-auto"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32 mx-auto mt-6"></div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {error ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  {error}
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-amber-600 dark:text-amber-500 font-medium italic text-lg mb-2">
                    {firstName ? `${firstName}, este versículo es para ti:` : 'Hola, este versículo es para ti:'}
                  </p>
                  <Link 
                    to={
                      verseData?.reference 
                        ? (() => {
                            const parsed = parseBibleReferences(verseData.reference)[0];
                            if (parsed && parsed.bookId) {
                              const versiculoParam = parsed.verses ? `&versiculo=${parsed.verses.replace(/\s+/g, '')}` : '';
                              return `/recursos/biblia?libro=${parsed.bookId}&capitulo=${parsed.chapter}${versiculoParam}`;
                            }
                            return '/recursos/biblia';
                          })()
                        : '/recursos/biblia'
                    }
                    className="block hover:opacity-80 transition-opacity"
                  >
                    <p className="text-xl md:text-2xl lg:text-3xl font-serif text-slate-800 dark:text-white leading-relaxed">
                      "{verseData?.text}"
                    </p>
                  </Link>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                <span className="text-base md:text-lg font-bold text-amber-600 dark:text-amber-500 font-mono bg-amber-50 dark:bg-amber-950/30 px-4 py-1 rounded-lg border border-amber-200/50 dark:border-amber-900/50">
                  <BibleVerseLink reference={verseData?.reference || ''} />
                </span>
                
                <div className="flex gap-2">
                  {!error && (
                    <button 
                      onClick={handleCopy}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors"
                      title="Copiar versículo"
                    >
                      <Copy size={16} />
                    </button>
                  )}
                  <button 
                    onClick={fetchRandomVerse}
                    className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-amber-950/30 rounded-full transition-colors"
                    title="Leer otro versículo"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AnimeFadeUp>
    </section>
  );
};
