import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import {
  HelpCircle, CheckCircle2, XCircle, Save, Check, ShieldAlert, BookOpen,
  ListChecks, Dices, RotateCw, Sparkles, Grid3x3, Sliders, StickyNote, Timer,
  Play, Pause, RefreshCw, Award, HeartHandshake
} from 'lucide-react';
import type { LessonBlock } from '../admin/BlockEditor';
import RichTextRenderer from '../common/RichTextRenderer';

interface Props {
  content: string;
  lessonId: string;
}

const BlockLessonRenderer = ({ content, lessonId }: Props) => {
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);
  const [isJson, setIsJson] = useState(false);

  useEffect(() => {
    try {
      if (content && content.trim().startsWith('[')) {
        const parsed = JSON.parse(content) as LessonBlock[];
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line
          setBlocks(parsed);
          setIsJson(true);
          return;
        }
      }
    } catch {
      // Not JSON
    }
    setIsJson(false);
  }, [content]);

  if (!isJson) {
    return (
      <RichTextRenderer 
        className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
        html={DOMPurify.sanitize(content || '<p class="text-gray-400 italic">Sin contenido</p>')}
      />
    );
  }

  return (
    <div className="space-y-8">
      {blocks.map((block) => (
        <BlockItem key={block.id} block={block} lessonId={lessonId} />
      ))}
    </div>
  );
};

const BlockItem = ({ block, lessonId }: { block: LessonBlock; lessonId: string }) => {
  const storageKey = `lesson_interact_${lessonId}_${block.id}`;
  
  const [openAnswer, setOpenAnswer] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (block.type === 'question' && typeof parsed.answer === 'string') return parsed.answer;
      }
    } catch { /* ignore */ }
    return '';
  });
  
  const [mcSelection, setMcSelection] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (block.type === 'multiple_choice' && typeof parsed.selection === 'number') return parsed.selection;
      }
    } catch { /* ignore */ }
    return null;
  });
  
  const [tfSelection, setTfSelection] = useState<boolean | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (block.type === 'true_false' && typeof parsed.selection === 'boolean') return parsed.selection;
      }
    } catch { /* ignore */ }
    return null;
  });
  
  const [showFeedback, setShowFeedback] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (block.type === 'multiple_choice' && typeof parsed.selection === 'number') return true;
        if (block.type === 'true_false' && typeof parsed.selection === 'boolean') return true;
      }
    } catch { /* ignore */ }
    return false;
  });

  const [pollSelection, setPollSelection] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (block.type === 'poll' && Array.isArray(parsed.selection)) return parsed.selection;
      }
    } catch { /* ignore */ }
    return [];
  });
  
  const [pollOtherValue, setPollOtherValue] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (block.type === 'poll' && parsed.other) return parsed.other;
      }
    } catch { /* ignore */ }
    return '';
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [spinnerResult, setSpinnerResult] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (block.type === 'spinner' && typeof parsed.result === 'string') return parsed.result;
      }
    } catch { /* ignore */ }
    return null;
  });
  const [spinnerRotation, setSpinnerRotation] = useState(0);

  const [blankAnswers, setBlankAnswers] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (block.type === 'fill_blank' && parsed.answers) return parsed.answers;
      }
    } catch { /* ignore */ }
    return {};
  });
  const [blankStatus, setBlankStatus] = useState<boolean | null>(null);

  const [isRollingDice, setIsRollingDice] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (block.type === 'dice' && typeof parsed.result === 'number') return parsed.result;
      }
    } catch { /* ignore */ }
    return null;
  });

  const [foundWords, setFoundWords] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (block.type === 'word_search' && Array.isArray(parsed.found)) return parsed.found;
      }
    } catch { /* ignore */ }
    return [];
  });

  const [sliderVal, setSliderVal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (block.type === 'reflection_slider' && typeof parsed.val === 'number') return parsed.val;
      }
    } catch { /* ignore */ }
    return 5;
  });

  const [noteText, setNoteText] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (block.type === 'reflection_note' && typeof parsed.text === 'string') return parsed.text;
      }
    } catch { /* ignore */ }
    return '';
  });

  const [timeLeft, setTimeLeft] = useState<number>(block.timer_seconds || 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const saveOpenAnswer = () => {
    localStorage.setItem(storageKey, JSON.stringify({ answer: openAnswer }));
    toast.success('Respuesta guardada localmente');
  };

  const selectMultipleChoice = (idx: number) => {
    setMcSelection(idx);
    setShowFeedback(true);
    localStorage.setItem(storageKey, JSON.stringify({ selection: idx }));
    
    if (idx === block.correct_option_idx) {
      toast.success('¡Correcto! Excelente respuesta.');
    } else {
      toast.error('Respuesta incorrecta. Inténtalo de nuevo.');
    }
  };

  const selectTrueFalse = (val: boolean) => {
    setTfSelection(val);
    setShowFeedback(true);
    localStorage.setItem(storageKey, JSON.stringify({ selection: val }));

    if (val === block.correct_boolean) {
      toast.success('¡Correcto! Has respondido bien.');
    } else {
      toast.error('Incorrecto. Inténtalo de nuevo.');
    }
  };

  const togglePollOption = (idx: number) => {
    const newSelection = pollSelection.includes(idx)
      ? pollSelection.filter(i => i !== idx)
      : [...pollSelection, idx];
    setPollSelection(newSelection);
    localStorage.setItem(storageKey, JSON.stringify({ selection: newSelection, other: pollOtherValue }));
  };

  const savePollOther = (val: string) => {
    setPollOtherValue(val);
    localStorage.setItem(storageKey, JSON.stringify({ selection: pollSelection, other: val }));
  };

  const spinWheel = () => {
    if (isSpinning || !block.spinner_items || block.spinner_items.length === 0) return;
    setIsSpinning(true);
    setSpinnerResult(null);

    const totalItems = block.spinner_items.length;
    const sliceAngle = 360 / totalItems;
    const winnerIdx = Math.floor(Math.random() * totalItems);
    const rotations = 5 * 360; 
    const targetAngle = rotations + (360 - (winnerIdx * sliceAngle)) - (sliceAngle / 2);
    const newTotalRotation = spinnerRotation + targetAngle + (360 - (spinnerRotation % 360));
    
    setSpinnerRotation(newTotalRotation);

    setTimeout(() => {
      const winner = block.spinner_items![winnerIdx];
      setSpinnerResult(winner);
      setIsSpinning(false);
      localStorage.setItem(storageKey, JSON.stringify({ result: winner }));
      toast.success(`¡La ruleta se detuvo en: ${winner}!`);
    }, 3000);
  };

  const checkFillBlank = () => {
    const targets = block.fill_blank_words || [];
    if (targets.length === 0) return;
    
    const isAllCorrect = targets.every((word, idx) => {
      return (blankAnswers[idx] || '').trim().toLowerCase() === word.trim().toLowerCase();
    });

    setBlankStatus(isAllCorrect);
    localStorage.setItem(storageKey, JSON.stringify({ answers: blankAnswers, correct: isAllCorrect }));
    if (isAllCorrect) {
      toast.success('¡Excelente! Has completado el versículo correctamente.');
    } else {
      toast.error('Algunas palabras no coinciden. ¡Revisa e inténtalo de nuevo!');
    }
  };

  const rollDice = () => {
    if (isRollingDice) return;
    setIsRollingDice(true);
    setDiceResult(null);

    setTimeout(() => {
      const rolled = Math.floor(Math.random() * 6) + 1;
      setDiceResult(rolled);
      setIsRollingDice(false);
      localStorage.setItem(storageKey, JSON.stringify({ result: rolled }));
      toast.success(`¡Lanzaste un ${rolled}! Lee tu pregunta de reflexión.`);
    }, 1200);
  };

  const toggleWordFound = (word: string) => {
    const updated = foundWords.includes(word)
      ? foundWords.filter(w => w !== word)
      : [...foundWords, word];
    setFoundWords(updated);
    localStorage.setItem(storageKey, JSON.stringify({ found: updated }));
    
    if (!foundWords.includes(word) && updated.length === (block.word_search_words || []).length) {
      toast.success('🎉 ¡Felicitaciones! Has encontrado todas las palabras.');
    }
  };

  const updateSlider = (val: number) => {
    setSliderVal(val);
    localStorage.setItem(storageKey, JSON.stringify({ val }));
  };

  const saveReflectionNote = (text: string) => {
    setNoteText(text);
    localStorage.setItem(storageKey, JSON.stringify({ text }));
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            toast.info('⏰ ¡Tiempo agotado! Fin del reto.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);

  return (
    <div className="animate-fadeIn">
      {/* 1. TEXT BLOCK */}
      {block.type === 'text' && (
        <RichTextRenderer 
          className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
          html={DOMPurify.sanitize(block.text || '')}
        />
      )}

      {/* 2. IMAGE BLOCK */}
      {block.type === 'image' && block.image_url && (
        <figure className="space-y-2 text-center max-w-xl mx-auto">
          <img loading="lazy" 
            src={block.image_url} 
            alt={block.text || 'Imagen de lección'} 
            className="rounded-2xl border border-gray-150 dark:border-white/10 shadow-md max-w-full mx-auto block hover:scale-[1.01] transition-transform"
          />
          {block.text && (
            <figcaption className="text-xs text-gray-500 dark:text-gray-400 font-medium italic">
              {block.text}
            </figcaption>
          )}
        </figure>
      )}

      {/* 3. HTML CODE EMBED */}
      {block.type === 'html' && block.html && (
        <RichTextRenderer 
          className="w-full overflow-hidden rounded-xl bg-slate-950 dark:bg-slate-900 p-2 shadow-inner border border-slate-900 dark:border-white/10"
          html={DOMPurify.sanitize(block.html || '')}
        />
      )}

      {/* 4. SECTION TITLE */}
      {block.type === 'section' && block.title && (
        <div className="pt-6 pb-2 border-b border-gray-150 dark:border-white/10">
          <h3 className="text-xl font-serif font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-600 dark:text-indigo-400" />
            {block.title}
          </h3>
        </div>
      )}

      {/* 5. OPEN QUESTION */}
      {block.type === 'question' && block.question_text && (
        <div className="bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/40 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
          <p className="font-bold text-slate-900 dark:text-gray-100 text-sm md:text-base flex items-center gap-2">
            <HelpCircle className="text-indigo-600 dark:text-indigo-400 shrink-0" size={18} />
            {block.question_text}
          </p>
          
          <div className="space-y-3">
            <textarea
              rows={3}
              value={openAnswer}
              onChange={(e) => setOpenAnswer(e.target.value)}
              placeholder="Escribe tu reflexión o respuesta aquí..."
              className="w-full border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-500 dark:focus:border-indigo-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold italic">
                * Tu respuesta se guarda de forma privada en este dispositivo.
              </span>
              <button
                type="button"
                onClick={saveOpenAnswer}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-750 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition-colors"
              >
                <Save size={12} />
                Guardar Respuesta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MULTIPLE CHOICE */}
      {block.type === 'multiple_choice' && block.question_text && (
        <div className="bg-purple-50/20 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800/40 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
          <p className="font-bold text-slate-900 dark:text-gray-100 text-sm md:text-base flex items-center gap-2">
            <HelpCircle className="text-purple-600 dark:text-purple-400 shrink-0" size={18} />
            {block.question_text}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(block.options || []).map((option, idx) => {
              const isSelected = mcSelection === idx;
              const isCorrect = idx === block.correct_option_idx;
              
              let btnClass = 'border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:bg-purple-50/30 dark:hover:bg-purple-950/30 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-600';
              if (showFeedback && isSelected) {
                btnClass = isCorrect
                  ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300'
                  : 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300';
              } else if (showFeedback && isCorrect) {
                btnClass = 'border-green-500 dark:border-green-600 bg-green-50/40 dark:bg-green-950/20 text-green-800 dark:text-green-300';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectMultipleChoice(idx)}
                  className={`border rounded-xl p-3.5 text-xs font-semibold text-left transition-all cursor-pointer flex items-center justify-between ${btnClass}`}
                >
                  <span>{option}</span>
                  {showFeedback && isSelected && (
                    isCorrect ? <CheckCircle2 size={16} className="text-green-600 dark:text-green-400 shrink-0" /> : <XCircle size={16} className="text-red-600 dark:text-red-400 shrink-0" />
                  )}
                  {showFeedback && !isSelected && isCorrect && (
                    <CheckCircle2 size={16} className="text-green-500/80 dark:text-green-400/80 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <div className={`p-3 rounded-xl border text-xs flex gap-2 items-center ${
              mcSelection === block.correct_option_idx
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300'
            }`}>
              {mcSelection === block.correct_option_idx ? (
                <>
                  <Check size={14} className="shrink-0" />
                  <span><strong>¡Correcto!</strong> Has seleccionado la respuesta correcta.</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={14} className="shrink-0" />
                  <span><strong>Incorrecto.</strong> Vuelve a leer el texto bíblico y prueba otra opción.</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 7. TRUE / FALSE CARD */}
      {block.type === 'true_false' && block.question_text && (
        <div className="bg-red-50/10 dark:bg-red-950/20 border border-red-100 dark:border-red-800/40 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
          <p className="font-bold text-slate-900 dark:text-gray-100 text-sm md:text-base flex items-center gap-2">
            <HelpCircle className="text-red-500 dark:text-red-400 shrink-0" size={18} />
            {block.question_text}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {[true, false].map((val) => {
              const label = val ? 'Verdadero' : 'Falso';
              const isSelected = tfSelection === val;
              const isCorrect = val === block.correct_boolean;

              let btnClass = 'border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:bg-red-50/20 dark:hover:bg-red-950/20 text-gray-700 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-600';
              if (showFeedback && isSelected) {
                btnClass = isCorrect
                  ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 ring-1 ring-green-400 dark:ring-green-700'
                  : 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 ring-1 ring-red-400 dark:ring-red-700';
              } else if (showFeedback && isCorrect) {
                btnClass = 'border-green-500 dark:border-green-600 bg-green-50/40 dark:bg-green-950/20 text-green-800 dark:text-green-300';
              }

              return (
                <button
                  key={val ? 't' : 'f'}
                  type="button"
                  onClick={() => selectTrueFalse(val)}
                  className={`flex-1 border rounded-xl py-3 px-4 text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${btnClass}`}
                >
                  {label}
                  {showFeedback && isSelected && (
                    isCorrect ? <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" /> : <XCircle size={14} className="text-red-600 dark:text-red-400" />
                  )}
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <div className={`p-3 rounded-xl border text-xs flex gap-2 items-center ${
              tfSelection === block.correct_boolean
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300'
            }`}>
              {tfSelection === block.correct_boolean ? (
                <>
                  <Check size={14} className="shrink-0" />
                  <span><strong>¡Excelente!</strong> Tu afirmación es correcta.</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={14} className="shrink-0" />
                  <span><strong>No es correcto.</strong> Revisa el relato bíblico para comprender el contexto.</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 8. POLL / ENCUESTA */}
      {block.type === 'poll' && block.question_text && (
        <div className="bg-pink-50/20 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-800/40 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
          <p className="font-bold text-slate-900 dark:text-gray-100 text-sm md:text-base flex items-center gap-2">
            <ListChecks className="text-pink-500 dark:text-pink-400 shrink-0" size={18} />
            {block.question_text}
          </p>

          <div className="space-y-3">
            {(block.options || []).map((option, idx) => {
              const isSelected = pollSelection.includes(idx);
              return (
                <label
                  key={idx}
                  className={`flex items-start gap-3 p-3.5 border rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'border-pink-500 dark:border-pink-600 bg-pink-50/50 dark:bg-pink-950/30 text-pink-900 dark:text-pink-200 ring-1 ring-pink-300 dark:ring-pink-700'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:bg-pink-50/20 dark:hover:bg-pink-950/20 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePollOption(idx)}
                    className="mt-0.5 shrink-0 w-4 h-4 text-pink-600 focus:ring-pink-500 border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <span className="flex-1 leading-relaxed">{option}</span>
                </label>
              );
            })}
            
            {block.allow_other && (
              <label className={`flex items-start gap-3 p-3.5 border rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  pollSelection.includes(-1)
                    ? 'border-pink-500 dark:border-pink-600 bg-pink-50/50 dark:bg-pink-950/30 text-pink-900 dark:text-pink-200 ring-1 ring-pink-300 dark:ring-pink-700'
                    : 'border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:bg-pink-50/20 dark:hover:bg-pink-950/20 text-gray-700 dark:text-gray-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={pollSelection.includes(-1)}
                    onChange={() => togglePollOption(-1)}
                    className="mt-0.5 shrink-0 w-4 h-4 text-pink-600 focus:ring-pink-500 border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <div className="flex-1 space-y-2">
                    <span className="leading-relaxed">Otro (Especificar)</span>
                    {pollSelection.includes(-1) && (
                      <textarea
                        rows={2}
                        value={pollOtherValue}
                        onChange={(e) => savePollOther(e.target.value)}
                        placeholder="Escribe tu respuesta aquí..."
                        className="w-full mt-2 border border-pink-200 dark:border-pink-700/50 rounded-lg p-2 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
              </label>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium flex gap-1 items-center">
               Puedes elegir múltiples opciones
            </span>
          </div>
        </div>
      )}

      {/* 9. SPINNER / RULETA */}
      {block.type === 'spinner' && block.question_text && (
        <div className="bg-orange-50/10 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-800/40 rounded-2xl p-5 md:p-8 space-y-6 shadow-sm overflow-hidden text-center">
          <p className="font-bold text-slate-900 dark:text-gray-100 text-sm md:text-base flex items-center justify-center gap-2">
            <Dices className="text-orange-500 dark:text-orange-400 shrink-0" size={20} />
            {block.question_text}
          </p>
          
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 mx-auto">
            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1 sm:-translate-y-2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[16px] sm:border-l-[12px] sm:border-r-[12px] sm:border-t-[20px] border-l-transparent border-r-transparent border-t-red-600 z-10 filter drop-shadow-md" />
            
            <div 
              className="w-full h-full rounded-full border-4 border-white dark:border-slate-700 shadow-xl overflow-hidden bg-[conic-gradient(var(--tw-gradient-stops))] from-orange-300 via-orange-100 to-orange-400 dark:from-orange-700 dark:via-orange-500 dark:to-orange-800 relative"
              style={{
                transform: `rotate(${spinnerRotation}deg)`,
                transition: isSpinning ? 'transform 3s cubic-bezier(0.2, 0.8, 0.1, 1)' : 'none'
              }}
            >
              {(block.spinner_items || []).map((_, idx) => {
                const total = (block.spinner_items || []).length;
                const angle = 360 / total;
                const rotation = idx * angle;
                return (
                  <div 
                    key={idx}
                    className="absolute inset-0 origin-center"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1/2 bg-white/40 dark:bg-white/20 origin-bottom" />
                  </div>
                );
              })}
            </div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg border-2 border-orange-200 dark:border-orange-700 z-10 flex items-center justify-center">
              <div className="w-4 h-4 bg-orange-400 dark:bg-orange-500 rounded-full" />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {!spinnerResult ? (
              <button
                type="button"
                onClick={spinWheel}
                disabled={isSpinning || !(block.spinner_items && block.spinner_items.length > 0)}
                className="mx-auto flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
              >
                <RotateCw size={18} className={isSpinning ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                {isSpinning ? 'Girando...' : '¡Girar la Ruleta!'}
              </button>
            ) : (
              <div className="animate-in fade-in zoom-in duration-300 p-4 bg-orange-100/50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-700/50 rounded-xl max-w-sm mx-auto">
                 <p className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider mb-1">Resultado</p>
                 <p className="text-xl font-bold text-orange-950 dark:text-orange-200">{spinnerResult}</p>
                 <button 
                   onClick={() => { setSpinnerResult(null); }} 
                   className="mt-3 text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 underline underline-offset-2 cursor-pointer"
                 >
                   Girar de nuevo
                 </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 10. FILL IN BLANK */}
      {block.type === 'fill_blank' && block.text && (
        <div className="bg-teal-50/20 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-800/40 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-sm">
            <BookOpen size={18} className="text-teal-600 dark:text-teal-400" />
            <span>Memorización de Versículo</span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-teal-100 dark:border-teal-800/40 text-slate-800 dark:text-gray-200 text-sm sm:text-base font-serif leading-relaxed space-y-2">
            {(() => {
              const textParts = (block.text || '').split(/\[(.*?)\]/g);
              let blankIdx = 0;
              return (
                <div className="flex flex-wrap items-center gap-1.5 leading-loose">
                  {textParts.map((part, idx) => {
                    if (idx % 2 === 1) {
                      const currentBlankIdx = blankIdx++;
                      return (
                        <input
                          key={idx}
                          type="text"
                          value={blankAnswers[currentBlankIdx] || ''}
                          onChange={(e) => {
                            setBlankAnswers({ ...blankAnswers, [currentBlankIdx]: e.target.value });
                            setBlankStatus(null);
                          }}
                          placeholder="..."
                          className={`w-28 text-center px-2 py-0.5 border-b-2 font-sans font-bold text-sm focus:outline-none transition-all bg-transparent ${
                            blankStatus === true
                              ? 'border-green-500 dark:border-green-500 text-green-800 dark:text-green-300'
                              : blankStatus === false
                              ? 'border-red-400 dark:border-red-500 text-red-800 dark:text-red-300'
                              : 'border-teal-400 dark:border-teal-600 focus:border-teal-600 dark:focus:border-teal-400 text-gray-800 dark:text-gray-200'
                          }`}
                        />
                      );
                    }
                    return <span key={idx}>{part}</span>;
                  })}
                </div>
              );
            })()}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={checkFillBlank}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Check size={14} /> Verificar Versículo
            </button>
            {blankStatus === true && (
              <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 size={14} /> ¡Versículo memorizado!
              </span>
            )}
          </div>
        </div>
      )}

      {/* 11. DICE / DADO DE REFLEXION */}
      {block.type === 'dice' && block.question_text && (
        <div className="bg-amber-50/20 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40 rounded-2xl p-5 md:p-8 space-y-6 shadow-sm text-center">
          <p className="font-bold text-slate-900 dark:text-gray-100 text-sm md:text-base flex items-center justify-center gap-2">
            <Sparkles className="text-amber-500 dark:text-amber-400" size={20} />
            {block.question_text}
          </p>

          <div className="py-4">
            <button
              type="button"
              onClick={rollDice}
              disabled={isRollingDice}
              className={`w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 dark:from-amber-500 dark:via-amber-600 dark:to-amber-700 text-white rounded-2xl shadow-xl flex items-center justify-center font-bold text-3xl border-4 border-white dark:border-slate-700 transition-all cursor-pointer select-none ${
                isRollingDice ? 'animate-bounce scale-110' : 'hover:scale-105 active:scale-95'
              }`}
            >
              {isRollingDice ? (
                <RotateCw size={36} className="animate-spin text-white/90" />
              ) : diceResult ? (
                <span>{diceResult}</span>
              ) : (
                <Sparkles size={32} />
              )}
            </button>
          </div>

          {diceResult && (
            <div className="animate-in fade-in zoom-in duration-300 p-5 bg-amber-100/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/50 rounded-2xl max-w-md mx-auto space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-800/40 px-2 py-0.5 rounded-full">
                Cara #{diceResult}
              </span>
              <p className="text-sm md:text-base font-bold text-amber-950 dark:text-amber-200">
                {(block.dice_options || [])[diceResult - 1] || `Pregunta ${diceResult}`}
              </p>
              <button
                onClick={rollDice}
                className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 underline cursor-pointer"
              >
                Volver a lanzar
              </button>
            </div>
          )}
        </div>
      )}

      {/* 12. WORD SEARCH / SOPA DE LETRAS */}
      {block.type === 'word_search' && block.question_text && (
        <div className="bg-cyan-50/20 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-800/40 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
          <p className="font-bold text-slate-900 dark:text-gray-100 text-sm md:text-base flex items-center gap-2">
            <Grid3x3 className="text-cyan-600 dark:text-cyan-400" size={20} />
            {block.question_text}
          </p>

          <div className="space-y-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block">Palabras a encontrar:</span>
            <div className="flex flex-wrap gap-2">
              {(block.word_search_words || []).map((word, idx) => {
                const isFound = foundWords.includes(word);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleWordFound(word)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      isFound
                        ? 'bg-cyan-600 dark:bg-cyan-700 text-white line-through shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-700/50 text-cyan-900 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/30'
                    }`}
                  >
                    {isFound && <Check size={12} />}
                    {word}
                  </button>
                );
              })}
            </div>
          </div>

          {foundWords.length === (block.word_search_words || []).length && (block.word_search_words || []).length > 0 && (
            <div className="p-3 bg-cyan-100/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-700/50 rounded-xl text-center text-xs font-bold text-cyan-900 dark:text-cyan-300 flex items-center justify-center gap-2 animate-in fade-in">
              <Award size={16} /> ¡Has encontrado todas las palabras clave!
            </div>
          )}
        </div>
      )}

      {/* 13. REFLECTION SLIDER */}
      {block.type === 'reflection_slider' && block.question_text && (
        <div className="bg-sky-50/20 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-800/40 rounded-2xl p-5 md:p-6 space-y-5 shadow-sm">
          <p className="font-bold text-slate-900 dark:text-gray-100 text-sm md:text-base flex items-center gap-2">
            <Sliders className="text-sky-600 dark:text-sky-400" size={20} />
            {block.question_text}
          </p>

          <div className="space-y-4 max-w-md mx-auto text-center">
            <div className="text-4xl">
              {sliderVal <= 3 ? '🌱' : sliderVal <= 6 ? '🌿' : sliderVal <= 8 ? '🌳' : '🔥'}
            </div>
            <div className="font-bold text-lg text-sky-900 dark:text-sky-200">
              Nivel {sliderVal} / 10
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={sliderVal}
              onChange={(e) => updateSlider(parseInt(e.target.value))}
              className="w-full h-2 bg-sky-100 dark:bg-sky-900/50 rounded-lg appearance-none cursor-pointer accent-sky-600 dark:accent-sky-500"
            />

            <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span>{block.slider_labels?.min || 'Bajo'}</span>
              <span>{block.slider_labels?.max || 'Alto'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 14. REFLECTION NOTE */}
      {block.type === 'reflection_note' && block.question_text && (
        <div className="bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl p-5 md:p-6 space-y-3 shadow-sm">
          <p className="font-bold text-slate-900 dark:text-gray-100 text-sm md:text-base flex items-center gap-2">
            <StickyNote className="text-emerald-600 dark:text-emerald-400" size={20} />
            {block.question_text}
          </p>

          <textarea
            rows={3}
            value={noteText}
            onChange={(e) => saveReflectionNote(e.target.value)}
            placeholder="Escribe aquí tu nota de reflexión o compromiso personal..."
            className="w-full p-3.5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-700/50 rounded-xl text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-800 text-gray-800 dark:text-gray-200 shadow-2xs placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />

          <div className="flex justify-between items-center pt-1">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
              <HeartHandshake size={12} /> Se guarda automáticamente en tu dispositivo
            </span>
            {noteText && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <Check size={12} /> Guardado
              </span>
            )}
          </div>
        </div>
      )}

      {/* 15. TIMER CHALLENGE */}
      {block.type === 'timer_challenge' && block.question_text && (
        <div className="bg-rose-50/20 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800/40 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm text-center">
          <p className="font-bold text-slate-900 dark:text-gray-100 text-sm md:text-base flex items-center justify-center gap-2">
            <Timer className="text-rose-600 dark:text-rose-400" size={20} />
            {block.question_text}
          </p>

          <div className="py-2">
            <div className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-mono font-bold text-2xl shadow-md ${
              timeLeft === 0
                ? 'bg-gray-500 dark:bg-gray-600 text-white'
                : timeLeft <= 10
                ? 'bg-red-600 dark:bg-red-700 text-white animate-pulse'
                : 'bg-rose-600 dark:bg-rose-700 text-white'
            }`}>
              <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
              {isTimerRunning ? 'Pausar' : 'Iniciar'}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimeLeft(block.timer_seconds || 60);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-700/50 text-rose-800 dark:text-rose-300 rounded-xl font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
            >
              <RefreshCw size={14} /> Reiniciar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockLessonRenderer;
