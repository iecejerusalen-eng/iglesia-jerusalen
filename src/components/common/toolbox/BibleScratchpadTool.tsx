import { useState } from 'react';
import { BookOpen, Copy, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { parseBibleReferences, parseVerseRange } from '../../../utils/bibleParser';
import { BIBLE_BOOKS } from '../../../config/bibleBooks';

// Mapa de traducción de libros a inglés para fallback en bible-api.com
const BIBLE_ENGLISH_NAMES: Record<string, string> = {
  'genesis': 'Genesis',
  'exodo': 'Exodus',
  'levitico': 'Leviticus',
  'numeros': 'Numbers',
  'deuteronomio': 'Deuteronomy',
  'josue': 'Joshua',
  'jueces': 'Judges',
  'rut': 'Ruth',
  '1-samuel': '1 Samuel',
  '2-samuel': '2 Samuel',
  '1-reyes': '1 Kings',
  '2-reyes': '2 Kings',
  '1-cronicas': '1 Chronicles',
  '2-cronicas': '2 Chronicles',
  'esdras': 'Ezra',
  'nehemias': 'Nehemiah',
  'ester': 'Esther',
  'job': 'Job',
  'salmos': 'Psalms',
  'proverbios': 'Proverbs',
  'eclesiastes': 'Ecclesiastes',
  'cantares': 'Song of Solomon',
  'isaias': 'Isaiah',
  'jeremias': 'Jeremiah',
  'lamentaciones': 'Lamentations',
  'ezequiel': 'Ezekiel',
  'daniel': 'Daniel',
  'oseas': 'Hosea',
  'joel': 'Joel',
  'amos': 'Amos',
  'abdias': 'Obadiah',
  'jonas': 'Jonah',
  'miqueas': 'Micah',
  'nahum': 'Nahum',
  'habacuc': 'Habakkuk',
  'sofonias': 'Zephaniah',
  'hageo': 'Haggai',
  'zacarias': 'Zechariah',
  'malaquias': 'Malachi',
  'mateo': 'Matthew',
  'marcos': 'Mark',
  'lucas': 'Luke',
  'juan': 'John',
  'hechos': 'Acts',
  'romanos': 'Romans',
  '1-corintios': '1 Corinthians',
  '2-corintios': '2 Corinthians',
  'galatas': 'Galatians',
  'efesios': 'Ephesians',
  'filipenses': 'Philippians',
  'colosenses': 'Colossians',
  '1-tesalonicenses': '1 Thessalonians',
  '2-tesalonicenses': '2 Thessalonians',
  '1-timoteo': '1 Timothy',
  '2-timoteo': '2 Timothy',
  'tito': 'Titus',
  'filemon': 'Philemon',
  'hebreos': 'Hebrews',
  'santiago': 'James',
  '1-pedro': '1 Peter',
  '2-pedro': '2 Peter',
  '1-juan': '1 John',
  '2-juan': '2 John',
  '3-juan': '3 John',
  'judas': 'Jude',
  'apocalipsis': 'Revelation'
};

interface BollsVerse {
  pk?: number;
  verse: number;
  text: string;
}

export function BibleScratchpadTool() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ reference: string; text: string } | null>(null);
  
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setResult(null);

    try {
      const parsed = parseBibleReferences(query);
      
      if (!parsed.length || !parsed[0].bookId) {
        throw new Error('Formato no reconocido');
      }

      const p = parsed[0];
      const bookIndex = BIBLE_BOOKS.findIndex(b => b.id === p.bookId);
      if (bookIndex === -1) {
        throw new Error('Libro no encontrado');
      }

      const bookObj = BIBLE_BOOKS[bookIndex];
      const bollsBookId = bookIndex + 1;
      const chapterNum = p.chapter || '1';

      // 1. Intentar consulta principal mediante bolls.life API (Reina Valera RVR1960 con soporte CORS)
      try {
        const bollsUrl = `https://bolls.life/get-chapter/RVR1960/${bollsBookId}/${chapterNum}/`;
        const res = await fetch(bollsUrl);
        
        if (res.ok) {
          const rawVerses: BollsVerse[] = await res.json();
          let filteredVerses: BollsVerse[] = rawVerses;
          let displayRef = `${bookObj.name} ${chapterNum}`;

          if (p.verses) {
            const requestedVerses = parseVerseRange(p.verses);
            if (requestedVerses.length > 0) {
              filteredVerses = rawVerses.filter(v => requestedVerses.includes(v.verse));
              displayRef += `:${p.verses.replace(/\s+/g, '')}`;
            }
          } else {
            // Si solo se busca el capítulo (ej. "Juan 3"), mostrar los primeros 3 versículos por defecto
            filteredVerses = rawVerses.slice(0, 3);
            displayRef += ` (v. 1-${filteredVerses.length})`;
          }

          if (filteredVerses.length > 0) {
            const cleanText = filteredVerses
              .map(v => `${v.verse > 1 ? `${v.verse}. ` : ''}${v.text.replace(/<[^>]*>?/gm, '').trim()}`)
              .join(' ');

            setResult({
              reference: `${displayRef} (RVR1960)`,
              text: cleanText
            });
            return;
          }
        }
      } catch (bollsErr) {
        console.warn('Fallback a bible-api.com debido a fallo en bolls.life', bollsErr);
      }

      // 2. Fallback secundario a bible-api.com traduciendo el libro a inglés para evitar 404/CORS
      const englishBook = BIBLE_ENGLISH_NAMES[p.bookId] || p.bookId;
      const fallbackQuery = `${englishBook} ${chapterNum}${p.verses ? ':' + p.verses.replace(/\s+/g, '') : ''}`;
      const fallbackUrl = `https://bible-api.com/${encodeURIComponent(fallbackQuery)}?translation=valera`;
      
      const fallbackRes = await fetch(fallbackUrl);
      if (!fallbackRes.ok) {
        throw new Error('No se encontró el versículo');
      }

      const fallbackData = await fallbackRes.json();
      const cleanRef = `${bookObj.name} ${chapterNum}${p.verses ? ':' + p.verses.replace(/\s+/g, '') : ''}`;
      setResult({
        reference: `${cleanRef} (RV1909)`,
        text: fallbackData.text.trim()
      });

    } catch {
      toast.error('No pudimos encontrar ese pasaje. Intenta con un formato como "Juan 3:16".');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const textToCopy = `"${result.text}" — ${result.reference}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success('Versículo copiado al portapapeles');
  };

  return (
    <div className="px-4 pb-5 pt-2">
      <div className="mb-6 flex items-center justify-center gap-2 text-white/40">
        <BookOpen size={16} />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Bíblia Rápida</span>
      </div>

      <form onSubmit={handleSearch} className="mb-5 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: Juan 3:16"
          className="flex-1 rounded-2xl border border-white/[0.05] bg-white/[0.03] px-4 py-3 text-sm text-white shadow-inner outline-none transition-all focus:border-amber-500/30 focus:bg-white/[0.06] focus:ring-4 focus:ring-amber-500/10 placeholder:text-white/20"
        />
        <button
          type="submit"
          disabled={loading || !query}
          className="group relative flex items-center justify-center overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/20 to-amber-400/20 px-4 text-amber-400 shadow-[0_4px_12px_rgba(251,191,36,0.15)] transition-all hover:scale-[1.02] hover:border-amber-500/40 hover:from-amber-500/30 hover:to-amber-400/30 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} className="transition-transform group-hover:scale-110" />}
          <div className="absolute -left-[100%] top-0 h-full w-[50%] skew-x-12 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent transition-all duration-700 group-hover:left-[200%]" />
        </button>
      </form>

      {result && (
        <div className="rounded-[1.5rem] border border-white/[0.05] bg-white/[0.02] p-4 text-left shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]">
          <p className="mb-4 max-h-36 overflow-y-auto pr-2 text-sm italic leading-relaxed text-white/70 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            "{result.text}"
          </p>
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
            <span className="text-[10px] font-bold tracking-wide text-amber-400">{result.reference}</span>
            <button 
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-bold text-white/50 transition-all hover:bg-white/[0.08] hover:text-white"
            >
              <Copy size={12} /> COPIAR
            </button>
          </div>
        </div>
      )}
      
      {!result && !loading && (
        <div className="py-8 text-center text-xs font-medium text-white/30">
          Escribe una referencia bíblica <br /> para buscarla al instante.
        </div>
      )}
    </div>
  );
}
