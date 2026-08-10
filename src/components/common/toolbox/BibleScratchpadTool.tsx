import { useState } from 'react';
import { BookOpen, Copy, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

export function BibleScratchpadTool() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ reference: string; text: string } | null>(null);
  
  // This is a simplified fetcher for the MVP using bible-api.com
  // Example query: "John 3:16" or "Juan 3:16"
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setResult(null);
    try {
      // Usando bible-api.com con la traducción Valera (RV1909) por defecto
      const url = `https://bible-api.com/${encodeURIComponent(query)}?translation=valera`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error('No se encontró el versículo');
      }
      
      const data = await res.json();
      setResult({
        reference: data.reference,
        text: data.text.trim(),
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
