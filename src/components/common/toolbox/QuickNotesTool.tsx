import { useState, useEffect } from 'react';
import { Copy, Trash2, PenTool, Check } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'jerusalen-toolbox-notes';

export function QuickNotesTool() {
  const [notes, setNotes] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setNotes(saved);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotes(value);
    localStorage.setItem(STORAGE_KEY, value);
  };

  const copyToClipboard = () => {
    if (!notes.trim()) return;
    navigator.clipboard.writeText(notes);
    setIsCopied(true);
    toast.success('Notas copiadas al portapapeles');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const clearNotes = () => {
    if (!notes.trim()) return;
    if (window.confirm('¿Estás seguro de borrar estas notas?')) {
      setNotes('');
      localStorage.removeItem(STORAGE_KEY);
      toast.success('Notas borradas');
    }
  };

  return (
    <div className="flex h-[320px] flex-col px-4 pb-5 pt-2">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/40">
          <PenTool size={16} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Notas Rápidas</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={copyToClipboard}
            disabled={!notes.trim()}
            className="flex h-7 items-center justify-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 text-[10px] font-bold text-white/50 transition-all hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-40"
            title="Copiar al portapapeles"
          >
            {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
          <button 
            onClick={clearNotes}
            disabled={!notes.trim()}
            className="flex h-7 items-center justify-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.03] px-2.5 text-[10px] font-bold text-white/50 transition-all hover:bg-rose-500/20 hover:text-rose-400 disabled:pointer-events-none disabled:opacity-40"
            title="Borrar notas"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)] transition-all focus-within:border-purple-500/30 focus-within:bg-white/[0.04] focus-within:ring-4 focus-within:ring-purple-500/10">
        <textarea
          value={notes}
          onChange={handleChange}
          placeholder="Escribe tus notas aquí..."
          className="h-full w-full resize-none bg-transparent p-4 text-sm leading-relaxed text-white/90 outline-none placeholder:text-white/20 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
