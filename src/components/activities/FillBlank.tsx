import { useState, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { BookOpen, Check, CheckCircle2, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LessonBlock } from '../admin/BlockEditor';

/**
 * Robust accent-insensitive normalizer.
 * Strips diacritics, invisible chars, and extra whitespace.
 */
const normalize = (str: string): string =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u200B-\u200F\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

interface Props {
  block: LessonBlock;
  storageKey: string;
}

const FillBlank = ({ block, storageKey }: Props) => {
  const targets = useMemo(() => block.fill_blank_words || [], [block.fill_blank_words]);
  const textParts = (block.text || '').split(/\[(.*?)\]/g);

  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) return parsed.answers;
      }
    } catch { /* ignore */ }
    return {};
  });

  const [perWordStatus, setPerWordStatus] = useState<Record<number, boolean | null>>({});
  const [allCorrect, setAllCorrect] = useState<boolean | null>(null);
  const [hintsUsed, setHintsUsed] = useState<Set<number>>(new Set());
  const [shakeIdx, setShakeIdx] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateAnswer = (idx: number, value: string) => {
    const updated = { ...answers, [idx]: value };
    setAnswers(updated);
    setPerWordStatus((prev) => ({ ...prev, [idx]: null }));
    setAllCorrect(null);
  };

  const checkAnswers = useCallback(() => {
    if (targets.length === 0) return;

    const newStatus: Record<number, boolean | null> = {};
    let allOk = true;

    targets.forEach((word, idx) => {
      const userAnswer = normalize(answers[idx] || '');
      const expected = normalize(word);
      const isCorrect = userAnswer === expected;
      newStatus[idx] = isCorrect;
      if (!isCorrect) allOk = false;
    });

    setPerWordStatus(newStatus);
    setAllCorrect(allOk);
    localStorage.setItem(storageKey, JSON.stringify({ answers, correct: allOk }));

    if (allOk) {
      toast.success('¡Excelente! Has completado el versículo correctamente.');
    } else {
      toast.error('Algunas palabras no coinciden. ¡Revisa e inténtalo de nuevo!');
      const firstWrongIdx = Object.entries(newStatus).find(([, v]) => v === false)?.[0];
      if (firstWrongIdx !== undefined) {
        setShakeIdx(Number(firstWrongIdx));
        setTimeout(() => setShakeIdx(null), 500);
      }
    }
  }, [answers, targets, storageKey]);

  const revealHint = () => {
    /* Find first blank that is not yet correct and hasn't been hinted */
    const unsolvedIdx = targets.findIndex((_, idx) => {
      const userAnswer = normalize(answers[idx] || '');
      const expected = normalize(targets[idx]);
      return userAnswer !== expected && !hintsUsed.has(idx);
    });

    if (unsolvedIdx === -1) {
      toast.info('No hay más pistas disponibles.');
      return;
    }

    const firstLetter = targets[unsolvedIdx][0];
    setAnswers((prev) => ({ ...prev, [unsolvedIdx]: firstLetter }));
    setHintsUsed((prev) => new Set(prev).add(unsolvedIdx));
    toast.info(`Pista: la palabra empieza con "${firstLetter.toUpperCase()}"`);
    inputRefs.current[unsolvedIdx]?.focus();
  };

  let blankIdx = 0;

  return (
    <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4">
      <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-sm">
        <BookOpen size={18} className="text-teal-600 dark:text-teal-400" />
        <span>Memorización de Versículo</span>
      </div>

      {/* Verse with inline blanks */}
      <div className="p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-teal-100 dark:border-teal-800/40 text-slate-800 dark:text-gray-200 text-sm sm:text-base font-serif leading-relaxed">
        <div className="flex flex-wrap items-center gap-1.5 leading-loose">
          {textParts.map((part, idx) => {
            if (idx % 2 === 1) {
              const currentIdx = blankIdx++;
              const status = perWordStatus[currentIdx];
              const isShaking = shakeIdx === currentIdx;
              const expectedLength = part.length;

              return (
                <motion.span
                  key={`blank-${idx}`}
                  animate={isShaking ? { x: [-4, 4, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="inline-flex items-center gap-1"
                >
                  <input
                    ref={(el) => { inputRefs.current[currentIdx] = el; }}
                    type="text"
                    value={answers[currentIdx] || ''}
                    onChange={(e) => updateAnswer(currentIdx, e.target.value)}
                    placeholder="···"
                    style={{ width: Math.max(80, expectedLength * 12 + 24) }}
                    className={`text-center px-2 py-1 border-b-2 font-sans font-bold text-sm focus:outline-none transition-all bg-transparent rounded-t-md ${
                      status === true
                        ? 'border-green-500 dark:border-green-400 text-green-700 dark:text-green-300 bg-green-50/50 dark:bg-green-950/20'
                        : status === false
                        ? 'border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 bg-red-50/30 dark:bg-red-950/20'
                        : 'border-teal-400 dark:border-teal-600 focus:border-teal-600 dark:focus:border-teal-400 text-gray-800 dark:text-gray-200'
                    }`}
                  />
                  <AnimatePresence>
                    {status === true && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <CheckCircle2 size={14} className="text-green-500 dark:text-green-400" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.span>
              );
            }
            return <span key={`text-${idx}`}>{part}</span>;
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={checkAnswers}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Check size={14} /> Verificar
          </button>
          <button
            type="button"
            onClick={revealHint}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-700/50 text-teal-700 dark:text-teal-300 rounded-xl font-bold text-xs hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-all cursor-pointer"
          >
            <Lightbulb size={14} /> Pista
          </button>
        </div>
        {allCorrect === true && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1"
          >
            <CheckCircle2 size={14} /> ¡Versículo memorizado!
          </motion.span>
        )}
      </div>
    </div>
  );
};

export default FillBlank;
