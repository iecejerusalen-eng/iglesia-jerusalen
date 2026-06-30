import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import {
  HelpCircle, CheckCircle2, XCircle, Save, Check, ShieldAlert, BookOpen
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

  // Parse blocks or handle as raw HTML fallback
  useEffect(() => {
    try {
      if (content && content.trim().startsWith('[')) {
        const parsed = JSON.parse(content) as LessonBlock[];
        if (Array.isArray(parsed)) {
          setBlocks(parsed);
          setIsJson(true);
          return;
        }
      }
    } catch (e) {
      // Not JSON
    }
    setIsJson(false);
  }, [content]);

  if (!isJson) {
    // Legacy HTML Fallback
    return (
      <RichTextRenderer 
        className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
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

// Internal component to manage individual block states (like user answers and validation)
const BlockItem = ({ block, lessonId }: { block: LessonBlock; lessonId: string }) => {
  const storageKey = `lesson_interact_${lessonId}_${block.id}`;
  
  // States for interactive blocks
  const [openAnswer, setOpenAnswer] = useState('');
  const [mcSelection, setMcSelection] = useState<number | null>(null);
  const [tfSelection, setTfSelection] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Load answers from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (block.type === 'question' && typeof parsed.answer === 'string') {
          setOpenAnswer(parsed.answer);
        } else if (block.type === 'multiple_choice' && typeof parsed.selection === 'number') {
          setMcSelection(parsed.selection);
          setShowFeedback(true);
        } else if (block.type === 'true_false' && typeof parsed.selection === 'boolean') {
          setTfSelection(parsed.selection);
          setShowFeedback(true);
        }
      } catch (e) {
        // failed to load saved progress
      }
    }
  }, [block, storageKey]);

  // Handle open question saving
  const saveOpenAnswer = () => {
    localStorage.setItem(storageKey, JSON.stringify({ answer: openAnswer }));
    toast.success('Respuesta guardada localmente');
  };

  // Handle multiple choice answering
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

  // Handle True / False answering
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

  return (
    <div className="animate-fadeIn">
      {/* 1. TEXT BLOCK */}
      {block.type === 'text' && (
        <RichTextRenderer 
          className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
          html={DOMPurify.sanitize(block.text || '')}
        />
      )}

      {/* 2. IMAGE BLOCK */}
      {block.type === 'image' && block.image_url && (
        <figure className="space-y-2 text-center max-w-xl mx-auto">
          <img loading="lazy" 
            src={block.image_url} 
            alt={block.text || 'Imagen de lección'} 
            className="rounded-2xl border border-gray-150 shadow-md max-w-full mx-auto block hover:scale-[1.01] transition-transform"
          />
          {block.text && (
            <figcaption className="text-xs text-gray-500 font-medium italic">
              {block.text}
            </figcaption>
          )}
        </figure>
      )}

      {/* 3. HTML CODE EMBED */}
      {block.type === 'html' && block.html && (
        <RichTextRenderer 
          className="w-full overflow-hidden rounded-xl bg-slate-950 p-2 shadow-inner border border-slate-900"
          html={DOMPurify.sanitize(block.html || '')}
        />
      )}

      {/* 4. SECTION TITLE */}
      {block.type === 'section' && block.title && (
        <div className="pt-6 pb-2 border-b border-gray-150">
          <h3 className="text-xl font-serif font-bold text-indigo-900 flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-600" />
            {block.title}
          </h3>
        </div>
      )}

      {/* 5. OPEN QUESTION */}
      {block.type === 'question' && block.question_text && (
        <div className="bg-indigo-50/30 border border-indigo-100 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
          <p className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2" style={{ color: '#0f172a' }}>
            <HelpCircle className="text-indigo-600 shrink-0" size={18} />
            {block.question_text}
          </p>
          
          <div className="space-y-3">
            <textarea
              rows={3}
              value={openAnswer}
              onChange={(e) => setOpenAnswer(e.target.value)}
              placeholder="Escribe tu reflexión o respuesta aquí..."
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 bg-white"
            />
            
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-400 font-semibold italic">
                * Tu respuesta se guarda de forma privada en este dispositivo.
              </span>
              <button
                type="button"
                onClick={saveOpenAnswer}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition-colors"
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
        <div className="bg-purple-50/20 border border-purple-100 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
          <p className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2" style={{ color: '#0f172a' }}>
            <HelpCircle className="text-purple-600 shrink-0" size={18} />
            {block.question_text}
          </p>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(block.options || []).map((option, idx) => {
              const isSelected = mcSelection === idx;
              const isCorrect = idx === block.correct_option_idx;
              
              let btnClass = 'border-gray-200 bg-white hover:bg-purple-50/30 text-gray-700 hover:border-purple-300';
              if (showFeedback && isSelected) {
                btnClass = isCorrect
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : 'border-red-500 bg-red-50 text-red-800';
              } else if (showFeedback && isCorrect) {
                // Highlight correct option if answered incorrectly
                btnClass = 'border-green-500 bg-green-50/40 text-green-800';
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
                    isCorrect ? <CheckCircle2 size={16} className="text-green-600 shrink-0" /> : <XCircle size={16} className="text-red-600 shrink-0" />
                  )}
                  {showFeedback && !isSelected && isCorrect && (
                    <CheckCircle2 size={16} className="text-green-500/80 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback description block */}
          {showFeedback && (
            <div className={`p-3 rounded-xl border text-xs flex gap-2 items-center ${
              mcSelection === block.correct_option_idx
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
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
        <div className="bg-red-50/10 border border-red-100 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
          <p className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2" style={{ color: '#0f172a' }}>
            <HelpCircle className="text-red-500 shrink-0" size={18} />
            {block.question_text}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {[true, false].map((val) => {
              const label = val ? 'Verdadero' : 'Falso';
              const isSelected = tfSelection === val;
              const isCorrect = val === block.correct_boolean;

              let btnClass = 'border-gray-200 bg-white hover:bg-red-50/20 text-gray-700 hover:border-red-300';
              if (showFeedback && isSelected) {
                btnClass = isCorrect
                  ? 'border-green-500 bg-green-50 text-green-800 ring-1 ring-green-400'
                  : 'border-red-500 bg-red-50 text-red-800 ring-1 ring-red-400';
              } else if (showFeedback && isCorrect) {
                btnClass = 'border-green-500 bg-green-50/40 text-green-800';
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
                    isCorrect ? <CheckCircle2 size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback description block */}
          {showFeedback && (
            <div className={`p-3 rounded-xl border text-xs flex gap-2 items-center ${
              tfSelection === block.correct_boolean
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
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
    </div>
  );
};

export default BlockLessonRenderer;
