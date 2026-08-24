import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Sparkles, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import soloLogoColorido from '../../../assets/Jerusalén/solo logo colorido.svg';

interface VerseImageShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  verseText: string;
  citation: string;
  translationName: string;
}

const BACKGROUND_PRESETS = [
  { id: 'gold', name: 'Oro & Noche', bg: 'from-amber-950 via-slate-900 to-blue-950', text: 'text-amber-200', accent: 'text-amber-400' },
  { id: 'royal', name: 'Azul Real', bg: 'from-blue-950 via-slate-900 to-indigo-950', text: 'text-blue-100', accent: 'text-blue-300' },
  { id: 'emerald', name: 'Esperanza', bg: 'from-emerald-950 via-slate-900 to-teal-950', text: 'text-emerald-100', accent: 'text-emerald-300' },
  { id: 'sunset', name: 'Atardecer', bg: 'from-rose-950 via-purple-950 to-slate-950', text: 'text-rose-100', accent: 'text-rose-300' },
  { id: 'clean', name: 'Lienzo Marfil', bg: 'from-amber-50 via-amber-100/50 to-orange-50', text: 'text-slate-900', accent: 'text-amber-800' },
];

export default function VerseImageShareModal({
  isOpen,
  onClose,
  verseText,
  citation,
  translationName,
}: VerseImageShareModalProps) {
  const [selectedBg, setSelectedBg] = useState(BACKGROUND_PRESETS[0]);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const fullShareText = `"${verseText}"\n— ${citation} (${translationName})\nIglesia Jerusalén`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(fullShareText);
      setCopied(true);
      toast.success('Versículo y cita copiados al portapapeles.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar el texto.');
    }
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: citation,
          text: fullShareText,
          url: window.location.href,
        });
      } catch {
        // Shared cancelled by user
      }
    } else {
      await handleCopyText();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900 text-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles size={18} />
              <span className="font-serif text-lg font-bold">Compartir Versículo</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Visual Card Preview */}
            <div
              ref={cardRef}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${selectedBg.bg} p-8 text-center shadow-xl border border-white/15`}
            >
              {/* Background Glow */}
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              
              <div className="relative z-10 space-y-6">
                <span className={`inline-block font-serif text-3xl opacity-30 ${selectedBg.text}`}>“</span>
                
                <p className={`font-serif text-lg md:text-xl font-medium leading-relaxed italic ${selectedBg.text}`}>
                  {verseText}
                </p>

                <div className="pt-4 border-t border-white/15 space-y-1">
                  <strong className={`block font-serif text-base font-bold ${selectedBg.accent}`}>
                    {citation}
                  </strong>
                  <span className="block text-[11px] font-semibold tracking-wider opacity-75 uppercase">
                    {translationName} · Iglesia Jerusalén
                  </span>
                </div>
              </div>
            </div>

            {/* Style Preset Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Estilo Visual
              </label>
              <div className="grid grid-cols-5 gap-2">
                {BACKGROUND_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedBg(preset)}
                    className={`h-12 rounded-xl bg-gradient-to-br ${preset.bg} border text-[10px] font-bold transition flex items-center justify-center text-white ${
                      selectedBg.id === preset.id
                        ? 'ring-2 ring-amber-400 border-amber-400 scale-105 shadow-md'
                        : 'border-white/20 hover:scale-102 opacity-80'
                    }`}
                  >
                    {preset.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleCopyText}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white transition hover:bg-white/10"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                {copied ? 'Copiado' : 'Copiar Texto'}
              </button>

              <button
                onClick={handleShareNative}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-500"
              >
                <Share2 size={16} /> Compartir
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
