import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import {
  HelpCircle, CheckCircle2, XCircle, Save, Check, ShieldAlert, BookOpen,
  ListChecks, Sliders, StickyNote,
  HeartHandshake, Mic2, Sparkles
} from 'lucide-react';
import type { LessonBlock } from '../admin/BlockEditor';
import RichTextRenderer from '../common/RichTextRenderer';
import SpinnerWheel from '../activities/SpinnerWheel';
import FillBlank from '../activities/FillBlank';
import Dice3D from '../activities/Dice3D';
import WordSearchGrid from '../activities/WordSearchGrid';
import RetroTimer from '../activities/RetroTimer';
import WaveformPlayer from '../audio/WaveformPlayer';

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



  const updateSlider = (val: number) => {
    setSliderVal(val);
    localStorage.setItem(storageKey, JSON.stringify({ val }));
  };

  const saveReflectionNote = (text: string) => {
    setNoteText(text);
    localStorage.setItem(storageKey, JSON.stringify({ text }));
  };



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
        <SpinnerWheel block={block} storageKey={storageKey} />
      )}

      {/* 10. FILL IN BLANK */}
      {block.type === 'fill_blank' && block.text && (
        <FillBlank block={block} storageKey={storageKey} />
      )}

      {/* 11. DICE / DADO DE REFLEXION */}
      {block.type === 'dice' && block.question_text && (
        <Dice3D block={block} storageKey={storageKey} />
      )}

      {/* 12. WORD SEARCH / SOPA DE LETRAS */}
      {block.type === 'word_search' && block.question_text && (
        <WordSearchGrid block={block} storageKey={storageKey} />
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
        <RetroTimer block={block} storageKey={storageKey} />
      )}

      {/* 16. AUDIO PLAYER WITH WAVEFORM */}
      {block.type === 'audio_player' && (block.audio_url || block.audio_title) && (
        <div className="my-6">
          <WaveformPlayer
            audioUrl={block.audio_url || ''}
            title={block.audio_title || 'Audio de Prédica'}
            subtitle="Mensaje y Enseñanza Pastoral"
            coverUrl={block.audio_cover}
            chapters={(block.audio_chapters || []).map((ch, idx) => ({ id: `ch-${idx}`, title: ch.title, seconds: ch.seconds }))}
          />
        </div>
      )}

      {/* 17. PODCAST EPISODE BLOCK */}
      {block.type === 'podcast_episode' && (
        <div className="my-6 p-6 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900 border border-purple-500/30 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-xl bg-purple-600/30 border border-purple-400/30 flex items-center justify-center shrink-0">
            <Mic2 className="w-10 h-10 text-purple-300" />
          </div>
          <div className="flex-1 space-y-2 text-left">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Episodio de Podcast
            </span>
            <h4 className="text-lg font-bold text-white tracking-tight">{block.audio_title || 'Episodio Especial'}</h4>
            {block.text && <p className="text-xs text-slate-300 line-clamp-2">{block.text}</p>}
          </div>
          {block.audio_url && (
            <div className="w-full md:w-auto">
              <WaveformPlayer
                audioUrl={block.audio_url}
                title={block.audio_title || 'Episodio'}
                className="!p-3 border-none bg-black/40"
              />
            </div>
          )}
        </div>
      )}

      {/* 18. SERMON SUMMARY (AI INTELIGENTE) */}
      {block.type === 'sermon_summary' && block.ai_summary && (
        <div className="my-6 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-indigo-950/40 border border-amber-500/30 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white tracking-tight">Resumen Inteligente de la Prédica</h4>
                <p className="text-xs text-amber-300/80">Síntesis pastoral y puntos clave</p>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          {block.ai_summary.executive_summary && (
            <p className="text-sm text-slate-200 leading-relaxed font-sans border-l-2 border-amber-400/60 pl-4 py-0.5">
              {block.ai_summary.executive_summary}
            </p>
          )}

          {/* Central Verse Callout */}
          {block.ai_summary.central_verse && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/20 text-center font-serif text-amber-200 text-sm italic">
              "{block.ai_summary.central_verse}"
            </div>
          )}

          {/* Key Points */}
          {block.ai_summary.key_points && block.ai_summary.key_points.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Puntos Principales</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {block.ai_summary.key_points.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BlockLessonRenderer;
