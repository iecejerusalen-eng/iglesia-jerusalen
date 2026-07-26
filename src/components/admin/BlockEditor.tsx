import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import RichTextEditor from './RichTextEditor';
import MediaUploader from '../common/MediaUploader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Type, Image as ImageIcon, Code, Heading, HelpCircle,
  CheckSquare, CheckCircle2, ArrowUp, ArrowDown, Trash2, Plus, X,
  ListChecks, Dices, BookOpen, Sliders, StickyNote, Timer, Grid3x3, Sparkles
} from 'lucide-react';

export type BlockType = 
  | 'text' 
  | 'image' 
  | 'html' 
  | 'section' 
  | 'question' 
  | 'multiple_choice' 
  | 'true_false' 
  | 'poll' 
  | 'spinner'
  | 'fill_blank'
  | 'dice'
  | 'word_search'
  | 'reflection_slider'
  | 'reflection_note'
  | 'timer_challenge';

export interface LessonBlock {
  id: string;
  type: BlockType;
  text?: string;
  image_url?: string;
  html?: string;
  title?: string;
  question_text?: string;
  options?: string[];
  correct_option_idx?: number;
  correct_boolean?: boolean;
  allow_other?: boolean;
  spinner_items?: string[];
  fill_blank_words?: string[];
  dice_options?: string[];
  word_search_words?: string[];
  slider_labels?: { min: string; max: string };
  timer_seconds?: number;
}

interface Props {
  content: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

const BlockEditor = ({ content, onChange, disabled = false }: Props) => {
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  // Parse initial content safely
  useEffect(() => {
    try {
      if (content && content.trim().startsWith('[')) {
        const parsed = JSON.parse(content) as LessonBlock[];
        // Validate array structure
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line
          setBlocks(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse content as JSON blocks, falling back to legacy HTML block.', e);
    }
    
    // Fallback: create a single text block with the legacy content
    setBlocks([{ id: 'block-legacy-1', type: 'text', text: content || '' }]);
  }, [content]);

  // Update parent when blocks change
  const updateParent = (updatedBlocks: LessonBlock[]) => {
    setBlocks(updatedBlocks);
    onChange(JSON.stringify(updatedBlocks));
  };

  const addBlock = (type: BlockType) => {
    const newBlock: LessonBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      text: type === 'text' || type === 'fill_blank'
        ? (type === 'fill_blank' ? 'Porque de tal manera [amo] Dios al mundo que ha dado a su [Hijo] unigénito.' : '')
        : undefined,
      image_url: type === 'image' ? '' : undefined,
      html: type === 'html' ? '' : undefined,
      title: type === 'section' ? '' : undefined,
      question_text: ['question', 'multiple_choice', 'true_false', 'poll', 'spinner', 'dice', 'word_search', 'reflection_slider', 'reflection_note', 'timer_challenge'].includes(type)
        ? (type === 'dice' ? 'Lanza el dado y responde la consigna de tu cara:'
          : type === 'word_search' ? 'Encuentra las 5 palabras clave de la prédica:'
          : type === 'reflection_slider' ? '¿Cómo evalúas tu tiempo de oración esta semana?'
          : type === 'reflection_note' ? 'Escribe una reflexión o compromiso personal de esta prédica:'
          : type === 'timer_challenge' ? '¡Tienes 60 segundos para dialogar este punto en tu grupo!'
          : '')
        : undefined,
      options: type === 'multiple_choice' || type === 'poll' ? ['Opción A', 'Opción B'] : undefined,
      correct_option_idx: type === 'multiple_choice' ? 0 : undefined,
      correct_boolean: type === 'true_false' ? true : undefined,
      allow_other: type === 'poll' ? false : undefined,
      spinner_items: type === 'spinner' ? ['Opción 1', 'Opción 2', 'Opción 3'] : undefined,
      fill_blank_words: type === 'fill_blank' ? ['amo', 'Hijo'] : undefined,
      dice_options: type === 'dice' ? [
        '1. ¿Con quién compartirás este mensaje?',
        '2. ¿Qué hábito debes cambiar esta semana?',
        '3. Escribe un motivo de gratitud a Dios.',
        '4. ¿Qué promesa bíblica te dio más paz?',
        '5. ¿Por quién vas a orar hoy?',
        '6. Memoriza la palabra clave del sermón.'
      ] : undefined,
      word_search_words: type === 'word_search' ? ['GRACIA', 'PERDON', 'FE', 'AMOR', 'ESPERANZA'] : undefined,
      slider_labels: type === 'reflection_slider' ? { min: 'Necesito mejorar', max: 'Muy constante' } : undefined,
      timer_seconds: type === 'timer_challenge' ? 60 : undefined,
    };
    updateParent([...blocks, newBlock]);
  };

  const deleteBlock = (id: string) => {
    const filtered = blocks.filter(b => b.id !== id);
    updateParent(filtered);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

    // Swap
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    updateParent(newBlocks);
  };

  const updateBlockValue = (id: string, fields: Partial<LessonBlock>) => {
    const updated = blocks.map(b => {
      if (b.id === id) {
        return { ...b, ...fields };
      }
      return b;
    });
    updateParent(updated);
  };

  const addOption = (blockId: string, options: string[]) => {
    updateBlockValue(blockId, { options: [...options, `Nueva Opción`] });
  };

  const removeOption = (blockId: string, options: string[], indexToRemove: number) => {
    if (options.length <= 2) return; // keep at least 2 options
    const filtered = options.filter((_, idx) => idx !== indexToRemove);
    updateBlockValue(blockId, { options: filtered, correct_option_idx: 0 });
  };

  const updateOptionText = (blockId: string, options: string[], idx: number, text: string) => {
    const newOptions = [...options];
    newOptions[idx] = text;
    updateBlockValue(blockId, { options: newOptions });
  };

  return (
    <div className="space-y-6 border border-gray-200 dark:border-white/10 rounded-2xl p-4 md:p-6 bg-slate-50/50 dark:bg-slate-900/50">
      
      {/* Editor Header Toolbar */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-gray-200">Editor de Contenidos</span>
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {blocks.length} {blocks.length === 1 ? 'Bloque' : 'Bloques'}
          </span>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-white/5">
          <button
            type="button"
            onClick={() => setPreviewMode(false)}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
              !previewMode
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-2xs'
                : 'text-gray-400 hover:text-slate-650'
            }`}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
              previewMode
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-2xs'
                : 'text-gray-400 hover:text-slate-650'
            }`}
          >
            Previsualizar
          </button>
        </div>
      </div>

      {previewMode ? (
        <div className="space-y-6 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-inner min-h-[250px]">
          {blocks.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-10">No hay bloques de contenido para previsualizar.</p>
          ) : (
            blocks.map((block) => (
              <div key={block.id} className="animate-fade-in">
                {block.type === 'text' && (
                  <div 
                    className="prose dark:prose-invert max-w-none text-slate-850 dark:text-gray-300 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.text || '') }}
                  />
                )}
                
                {block.type === 'image' && block.image_url && (
                  <div className="my-6 text-center">
                    <div className="inline-block border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm bg-slate-50 dark:bg-slate-900 max-w-full">
                      <img loading="lazy" src={block.image_url} alt={block.text || 'Imagen'} className="max-h-[400px] w-auto max-w-full object-contain" />
                    </div>
                    {block.text && (
                      <p className="text-xs text-gray-400 italic mt-2">{block.text}</p>
                    )}
                  </div>
                )}
                
                {block.type === 'html' && block.html && (
                  <div 
                    className="my-4 overflow-x-auto" 
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.html) }}
                  />
                )}
                
                {block.type === 'section' && block.title && (
                  <h3 className="text-lg font-bold text-primary dark:text-blue-400 mt-6 mb-3 pb-2 border-b border-gray-200 dark:border-white/5 font-serif">
                    {block.title}
                  </h3>
                )}
                
                {block.type === 'question' && block.question_text && (
                  <div className="my-4 p-5 bg-blue-55/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                    <p className="font-bold text-xs text-blue-900 dark:text-blue-300 mb-3">{block.question_text}</p>
                    <textarea 
                      disabled
                      placeholder="Espacio para respuesta escrita del estudiante..." 
                      className="w-full p-3 border border-gray-200 dark:border-white/5 rounded-xl text-xs bg-white dark:bg-slate-900 resize-none outline-none"
                      rows={2}
                    />
                  </div>
                )}
                
                {block.type === 'multiple_choice' && block.question_text && (
                  <div className="my-4 p-5 bg-purple-55/30 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-2xl space-y-3">
                    <p className="font-bold text-xs text-purple-900 dark:text-purple-300">{block.question_text}</p>
                    <div className="space-y-2">
                      {(block.options || []).map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/5 rounded-xl">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${block.correct_option_idx === idx ? 'border-purple-500 bg-purple-500/10' : 'border-gray-300'}`}>
                            {block.correct_option_idx === idx && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                          </div>
                          <span className="text-xs text-slate-700 dark:text-gray-300">{opt}</span>
                          {block.correct_option_idx === idx && (
                            <span className="ml-auto text-[9px] font-bold bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-900/30">Correcta</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {block.type === 'true_false' && block.question_text && (
                  <div className="my-4 p-5 bg-red-55/30 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl space-y-3">
                    <p className="font-bold text-xs text-red-900 dark:text-red-300">{block.question_text}</p>
                    <div className="flex gap-3">
                      <div className={`flex-1 p-3 text-center rounded-xl border text-xs font-bold ${block.correct_boolean === true ? 'bg-green-500/10 border-green-500 text-green-600' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-white/5 text-gray-500'}`}>
                        Verdadero {block.correct_boolean === true && '✓'}
                      </div>
                      <div className={`flex-1 p-3 text-center rounded-xl border text-xs font-bold ${block.correct_boolean === false ? 'bg-green-500/10 border-green-500 text-green-600' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-white/5 text-gray-500'}`}>
                        Falso {block.correct_boolean === false && '✓'}
                      </div>
                    </div>
                  </div>
                )}
                
                {block.type === 'poll' && block.question_text && (
                  <div className="my-4 p-5 bg-pink-55/30 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30 rounded-2xl space-y-3">
                    <p className="font-bold text-xs text-pink-900 dark:text-pink-300">{block.question_text}</p>
                    <div className="space-y-2">
                      {(block.options || []).map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/5 rounded-xl">
                          <div className="w-4 h-4 rounded-sm border border-gray-300"></div>
                          <span className="text-xs text-slate-700 dark:text-gray-300">{opt}</span>
                        </div>
                      ))}
                      {block.allow_other && (
                        <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/5 rounded-xl">
                          <div className="w-4 h-4 rounded-sm border border-gray-300"></div>
                          <span className="text-xs text-slate-700 dark:text-gray-300 italic">Otro (Especificar)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {block.type === 'spinner' && block.question_text && (
                  <div className="my-4 p-5 bg-orange-55/30 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-2xl text-center space-y-3">
                    <p className="font-bold text-xs text-orange-900 dark:text-orange-300">{block.question_text}</p>
                    <div className="w-24 h-24 mx-auto rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-orange-400 via-orange-200 to-orange-500 shadow-md flex items-center justify-center border-4 border-white dark:border-slate-800 relative">
                       <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-red-600 z-10"></div>
                       <Dices className="text-white drop-shadow-sm" size={24} />
                    </div>
                    <p className="text-xs text-gray-500">Ruleta con {(block.spinner_items || []).length} opciones</p>
                  </div>
                )}

                {block.type === 'fill_blank' && (
                  <div className="my-4 p-5 bg-teal-50/40 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">Memorización / Completar Versículo</span>
                    <p className="text-xs font-serif leading-relaxed text-teal-950 dark:text-teal-200">{block.text}</p>
                  </div>
                )}

                {block.type === 'dice' && (
                  <div className="my-4 p-5 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-center space-y-2">
                    <p className="font-bold text-xs text-amber-900 dark:text-amber-300">{block.question_text}</p>
                    <div className="w-12 h-12 mx-auto bg-amber-500 text-white rounded-xl shadow-md flex items-center justify-center font-bold text-lg">
                      <Sparkles size={20} />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Dado con {(block.dice_options || []).length} preguntas de reflexión</p>
                  </div>
                )}

                {block.type === 'word_search' && (
                  <div className="my-4 p-5 bg-cyan-50/40 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/30 rounded-2xl text-center space-y-2">
                    <p className="font-bold text-xs text-cyan-900 dark:text-cyan-300">{block.question_text}</p>
                    <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                      {(block.word_search_words || []).map((w, idx) => (
                        <span key={idx} className="bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200 text-[10px] font-bold px-2 py-0.5 rounded-full">{w}</span>
                      ))}
                    </div>
                  </div>
                )}

                {block.type === 'reflection_slider' && (
                  <div className="my-4 p-5 bg-sky-50/40 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 rounded-2xl space-y-3">
                    <p className="font-bold text-xs text-sky-900 dark:text-sky-300">{block.question_text}</p>
                    <input type="range" disabled min="1" max="10" defaultValue="5" className="w-full accent-sky-500" />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                      <span>{block.slider_labels?.min || 'Bajo'}</span>
                      <span>{block.slider_labels?.max || 'Alto'}</span>
                    </div>
                  </div>
                )}

                {block.type === 'reflection_note' && (
                  <div className="my-4 p-5 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl space-y-2">
                    <p className="font-bold text-xs text-emerald-900 dark:text-emerald-300">{block.question_text}</p>
                    <div className="p-3 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-gray-400 italic">
                      Nota personal del estudiante (guardado automático)...
                    </div>
                  </div>
                )}

                {block.type === 'timer_challenge' && (
                  <div className="my-4 p-5 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-center space-y-2">
                    <p className="font-bold text-xs text-rose-900 dark:text-rose-300">{block.question_text}</p>
                    <div className="inline-flex items-center gap-2 bg-rose-500 text-white font-mono font-bold text-base px-4 py-1.5 rounded-full shadow-xs">
                      <Timer size={16} /> {block.timer_seconds || 60} seg
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          {/* Blocks List */}
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {blocks.map((block, index) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-xs hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors relative space-y-4"
                >
                  {/* Block Header Toolbar */}
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {block.type === 'text' && <><Type size={14} className="text-blue-500" /> Bloque de Texto</>}
                      {block.type === 'image' && <><ImageIcon size={14} className="text-emerald-500" /> Imagen</>}
                      {block.type === 'html' && <><Code size={14} className="text-violet-500" /> Código HTML</>}
                      {block.type === 'section' && <><Heading size={14} className="text-amber-500" /> Título de Sección</>}
                      {block.type === 'question' && <><HelpCircle size={14} className="text-indigo-500" /> Pregunta Abierta</>}
                      {block.type === 'multiple_choice' && <><CheckSquare size={14} className="text-purple-500" /> Opción Múltiple</>}
                      {block.type === 'true_false' && <><CheckCircle2 size={14} className="text-red-500" /> Verdadero / Falso</>}
                      {block.type === 'poll' && <><ListChecks size={14} className="text-pink-500" /> Encuesta Múltiple</>}
                      {block.type === 'spinner' && <><Dices size={14} className="text-orange-500" /> Ruleta Aleatoria</>}
                      {block.type === 'fill_blank' && <><BookOpen size={14} className="text-teal-500" /> Completar Versículo</>}
                      {block.type === 'dice' && <><Sparkles size={14} className="text-amber-500" /> Dado de Reflexión</>}
                      {block.type === 'word_search' && <><Grid3x3 size={14} className="text-cyan-500" /> Sopa de Letras</>}
                      {block.type === 'reflection_slider' && <><Sliders size={14} className="text-sky-500" /> Escala de Evaluación</>}
                      {block.type === 'reflection_note' && <><StickyNote size={14} className="text-emerald-500" /> Nota Personal</>}
                      {block.type === 'timer_challenge' && <><Timer size={14} className="text-rose-500" /> Temporizador Reto</>}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveBlock(index, 'up')}
                        disabled={index === 0 || disabled}
                        className="p-1 rounded text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                        title="Subir"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, 'down')}
                        disabled={index === blocks.length - 1 || disabled}
                        className="p-1 rounded text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                        title="Bajar"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteBlock(block.id)}
                        disabled={disabled}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                        title="Eliminar bloque"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Block Content Inputs */}
                  <div className="space-y-3">
                    {/* 1. TEXT BLOCK */}
                    {block.type === 'text' && (
                      <RichTextEditor
                        content={block.text || ''}
                        onChange={(html) => updateBlockValue(block.id, { text: html })}
                        disabled={disabled}
                      />
                    )}

                    {/* 2. IMAGE BLOCK */}
                    {block.type === 'image' && (
                      <div className="space-y-3">
                        {block.image_url ? (
                          <div className="relative inline-block w-full max-w-sm rounded-lg overflow-hidden border border-gray-200">
                            <img loading="lazy" src={block.image_url} alt="" className="w-full h-40 object-cover" />
                            <button
                              type="button"
                              onClick={() => updateBlockValue(block.id, { image_url: '' })}
                              className="absolute top-2 right-2 bg-red-650 text-white p-1 rounded-full cursor-pointer hover:bg-red-750"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <MediaUploader
                              folder="lecciones"
                              onUploadSuccess={(url) => updateBlockValue(block.id, { image_url: url })}
                            />
                            <span className="text-xs text-gray-400">o</span>
                            <input
                              type="text"
                              value={block.image_url || ''}
                              onChange={(e) => updateBlockValue(block.id, { image_url: e.target.value })}
                              placeholder="Pega la URL de la imagen aquí..."
                              className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 outline-none"
                            />
                          </div>
                        )}
                        <input
                          type="text"
                          value={block.text || ''}
                          onChange={(e) => updateBlockValue(block.id, { text: e.target.value })}
                          placeholder="Pie de foto / Descripción de la imagen..."
                          className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 outline-none"
                        />
                      </div>
                    )}

                    {/* 3. HTML CODE EMBED */}
                    {block.type === 'html' && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Código HTML/Iframe</label>
                        <textarea
                          rows={4}
                          value={block.html || ''}
                          onChange={(e) => updateBlockValue(block.id, { html: e.target.value })}
                          placeholder="Ej: <iframe src='https://example.com/build'></iframe>"
                          className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-400 outline-none"
                        />
                      </div>
                    )}

                    {/* 4. SECTION TITLE */}
                    {block.type === 'section' && (
                      <input
                        type="text"
                        value={block.title || ''}
                        onChange={(e) => updateBlockValue(block.id, { title: e.target.value })}
                        placeholder="Título de la Sección (Ej: Introducción, Cuestionario)"
                        className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 dark:text-gray-100 focus:border-indigo-400 outline-none"
                      />
                    )}

                    {/* 5. OPEN QUESTION */}
                    {block.type === 'question' && (
                      <input
                        type="text"
                        value={block.question_text || ''}
                        onChange={(e) => updateBlockValue(block.id, { question_text: e.target.value })}
                        placeholder="Escribe la pregunta abierta aquí (ej: ¿Qué nos enseña esta parábola?)"
                        className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-400 outline-none font-medium text-gray-800 dark:text-gray-100"
                      />
                    )}

                    {/* 6. MULTIPLE CHOICE */}
                    {block.type === 'multiple_choice' && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={block.question_text || ''}
                          onChange={(e) => updateBlockValue(block.id, { question_text: e.target.value })}
                          placeholder="Escribe la pregunta de opción múltiple..."
                          className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-400 outline-none font-medium text-gray-800 dark:text-gray-100"
                        />

                        {/* Options list */}
                        <div className="space-y-2 pl-4 border-l-2 border-indigo-150">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Opciones de Respuesta</span>
                          {(block.options || []).map((option, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={block.correct_option_idx === idx}
                                onChange={() => updateBlockValue(block.id, { correct_option_idx: idx })}
                                name={`correct-choice-${block.id}`}
                                className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                title="Marcar como correcta"
                              />
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOptionText(block.id, block.options || [], idx, e.target.value)}
                                placeholder={`Opción ${idx + 1}`}
                                className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-400 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(block.id, block.options || [], idx)}
                                disabled={(block.options || []).length <= 2}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded disabled:opacity-30 cursor-pointer"
                                title="Eliminar opción"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addOption(block.id, block.options || [])}
                            className="flex items-center gap-1 text-xs text-indigo-600 font-bold hover:text-indigo-800 cursor-pointer pt-1"
                          >
                            <Plus size={12} /> Agregar opción
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 7. TRUE / FALSO */}
                    {block.type === 'true_false' && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={block.question_text || ''}
                          onChange={(e) => updateBlockValue(block.id, { question_text: e.target.value })}
                          placeholder="Pregunta de Verdadero o Falso (ej: ¿Fueron 12 los apóstoles elegidos por Jesús?)"
                          className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-400 outline-none font-medium text-gray-800 dark:text-gray-100"
                        />

                        <div className="flex items-center gap-4 pl-4">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Respuesta Correcta:</span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                              <input
                                type="radio"
                                checked={block.correct_boolean === true}
                                onChange={() => updateBlockValue(block.id, { correct_boolean: true })}
                                className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                              />
                              Verdadero
                            </label>
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                              <input
                                type="radio"
                                checked={block.correct_boolean === false}
                                onChange={() => updateBlockValue(block.id, { correct_boolean: false })}
                                className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                              />
                              Falso
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 8. POLL / ENCUESTA */}
                    {block.type === 'poll' && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={block.question_text || ''}
                          onChange={(e) => updateBlockValue(block.id, { question_text: e.target.value })}
                          placeholder="Escribe la pregunta o instrucción (Ej: ¿Qué ministerios te interesan?)..."
                          className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-400 outline-none font-medium text-gray-800 dark:text-gray-100"
                        />

                        <div className="space-y-2 pl-4 border-l-2 border-pink-150">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Opciones a elegir</span>
                          {(block.options || []).map((option, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-sm border border-gray-300 bg-gray-50 dark:bg-gray-800 shrink-0" />
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOptionText(block.id, block.options || [], idx, e.target.value)}
                                placeholder={`Opción ${idx + 1}`}
                                className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-400 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(block.id, block.options || [], idx)}
                                disabled={(block.options || []).length <= 1}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded disabled:opacity-30 cursor-pointer"
                                title="Eliminar opción"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addOption(block.id, block.options || [])}
                            className="flex items-center gap-1 text-xs text-pink-600 font-bold hover:text-pink-800 cursor-pointer pt-1"
                          >
                            <Plus size={12} /> Agregar opción
                          </button>

                          <label className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={block.allow_other || false}
                              onChange={(e) => updateBlockValue(block.id, { allow_other: e.target.checked })}
                              className="text-pink-600 focus:ring-pink-500 rounded border-gray-300"
                            />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              Permitir la opción "Otro (Especificar)" con campo de texto
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* 9. SPINNER / RULETA */}
                    {block.type === 'spinner' && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={block.question_text || ''}
                          onChange={(e) => updateBlockValue(block.id, { question_text: e.target.value })}
                          placeholder="Título de la ruleta (Ej: ¿Quién será el próximo voluntario?)..."
                          className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-400 outline-none font-medium text-gray-800 dark:text-gray-100"
                        />

                        <div className="space-y-2 pl-4 border-l-2 border-orange-150">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Opciones de la Ruleta</span>
                          {(block.spinner_items || []).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-300 px-1.5 py-0.5 rounded-sm w-5 text-center shrink-0">{idx + 1}</span>
                              <input
                                type="text"
                                value={item}
                                onChange={(e) => {
                                  const newItems = [...(block.spinner_items || [])];
                                  newItems[idx] = e.target.value;
                                  updateBlockValue(block.id, { spinner_items: newItems });
                                }}
                                placeholder={`Segmento ${idx + 1}`}
                                className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-400 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const items = block.spinner_items || [];
                                  if (items.length <= 2) return;
                                  const filtered = items.filter((_, i) => i !== idx);
                                  updateBlockValue(block.id, { spinner_items: filtered });
                                }}
                                disabled={(block.spinner_items || []).length <= 2}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded disabled:opacity-30 cursor-pointer"
                                title="Eliminar segmento"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}

                        </div>
                      </div>
                    )}

                    {/* 10. FILL IN BLANK */}
                    {block.type === 'fill_blank' && (
                      <div className="space-y-3">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Texto o Versículo (Encierra entre [corchetes] las palabras que el usuario deberá adivinar):
                        </label>
                        <textarea
                          rows={3}
                          value={block.text || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const matches = Array.from(val.matchAll(/\[(.*?)\]/g)).map(m => m[1]);
                            updateBlockValue(block.id, { text: val, fill_blank_words: matches });
                          }}
                          placeholder="Ej: Porque de tal manera [amo] Dios al mundo que ha dado a su [Hijo] unigénito."
                          className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-teal-400 outline-none"
                        />
                        {block.fill_blank_words && block.fill_blank_words.length > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-teal-600">Palabras a ocultar:</span>
                            <div className="flex flex-wrap gap-1">
                              {block.fill_blank_words.map((w, idx) => (
                                <span key={idx} className="bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 px-2 py-0.5 rounded-full font-semibold">{w}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 11. DICE / DADO DE REFLEXION */}
                    {block.type === 'dice' && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={block.question_text || ''}
                          onChange={(e) => updateBlockValue(block.id, { question_text: e.target.value })}
                          placeholder="Título del dado (Ej: Lanza el dado y reflexiona sobre el punto)..."
                          className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-amber-400 outline-none font-medium"
                        />
                        <div className="space-y-2 pl-4 border-l-2 border-amber-300">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Las 6 Caras del Dado</span>
                          {Array.from({ length: 6 }).map((_, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-300 px-1.5 py-0.5 rounded-sm w-5 text-center shrink-0">{idx + 1}</span>
                              <input
                                type="text"
                                value={(block.dice_options || [])[idx] || ''}
                                onChange={(e) => {
                                  const current = [...(block.dice_options || Array(6).fill(''))];
                                  current[idx] = e.target.value;
                                  updateBlockValue(block.id, { dice_options: current });
                                }}
                                placeholder={`Cara ${idx + 1}...`}
                                className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-xs focus:border-amber-400 outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 12. WORD SEARCH / SOPA DE LETRAS */}
                    {block.type === 'word_search' && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={block.question_text || ''}
                          onChange={(e) => updateBlockValue(block.id, { question_text: e.target.value })}
                          placeholder="Instrucción de la sopa de letras..."
                          className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-cyan-400 outline-none font-medium"
                        />
                        <div className="space-y-2 pl-4 border-l-2 border-cyan-300">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Palabras a Buscar (Separadas por comas)</span>
                          <input
                            type="text"
                            value={(block.word_search_words || []).join(', ')}
                            onChange={(e) => {
                              const words = e.target.value.split(',').map(w => w.trim().toUpperCase()).filter(Boolean);
                              updateBlockValue(block.id, { word_search_words: words });
                            }}
                            placeholder="EJ: GRACIA, PERDON, FE, AMOR, ESPERANZA"
                            className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-xs focus:border-cyan-400 outline-none uppercase"
                          />
                        </div>
                      </div>
                    )}

                    {/* 13. REFLECTION SLIDER */}
                    {block.type === 'reflection_slider' && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={block.question_text || ''}
                          onChange={(e) => updateBlockValue(block.id, { question_text: e.target.value })}
                          placeholder="Pregunta de autoevaluación (Ej: ¿Cómo evalúas tu tiempo de oración?)..."
                          className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-sky-400 outline-none font-medium"
                        />
                        <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-sky-300">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Etiqueta Mínima</span>
                            <input
                              type="text"
                              value={block.slider_labels?.min || ''}
                              onChange={(e) => updateBlockValue(block.id, { slider_labels: { min: e.target.value, max: block.slider_labels?.max || 'Alto' } })}
                              placeholder="Ej: Necesito mejorar"
                              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-xs outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Etiqueta Máxima</span>
                            <input
                              type="text"
                              value={block.slider_labels?.max || ''}
                              onChange={(e) => updateBlockValue(block.id, { slider_labels: { min: block.slider_labels?.min || 'Bajo', max: e.target.value } })}
                              placeholder="Ej: Muy constante"
                              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-xs outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 14. REFLECTION NOTE */}
                    {block.type === 'reflection_note' && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={block.question_text || ''}
                          onChange={(e) => updateBlockValue(block.id, { question_text: e.target.value })}
                          placeholder="Instrucción de la nota (Ej: Escribe un compromiso personal con Dios)..."
                          className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-400 outline-none font-medium"
                        />
                      </div>
                    )}

                    {/* 15. TIMER CHALLENGE */}
                    {block.type === 'timer_challenge' && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={block.question_text || ''}
                          onChange={(e) => updateBlockValue(block.id, { question_text: e.target.value })}
                          placeholder="Consigna del temporizador (Ej: ¡60 segundos para orar por tu compañero!)..."
                          className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:border-rose-400 outline-none font-medium"
                        />
                        <div className="flex items-center gap-3 pl-4 border-l-2 border-rose-300">
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Duración en segundos:</span>
                          <input
                            type="number"
                            min="10"
                            max="300"
                            value={block.timer_seconds || 60}
                            onChange={(e) => updateBlockValue(block.id, { timer_seconds: parseInt(e.target.value) || 60 })}
                            className="w-24 bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-xs outline-none font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add Block Toolbar */}
          {!disabled && (
            <div className="border border-dashed border-gray-300 dark:border-white/10 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-xs space-y-3">
              <span className="text-xs font-bold text-gray-450 uppercase tracking-wider block text-center">
                Añadir Bloque de Contenido
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                <button
                  type="button"
                  onClick={() => addBlock('text')}
                  className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:text-indigo-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <Type size={16} className="mb-1 text-blue-500" />
                  Texto
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('image')}
                  className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:text-indigo-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <ImageIcon size={16} className="mb-1 text-emerald-500" />
                  Imagen
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('html')}
                  className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:text-indigo-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <Code size={16} className="mb-1 text-violet-500" />
                  Código HTML
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('section')}
                  className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:text-indigo-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <Heading size={16} className="mb-1 text-amber-500" />
                  Sección
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('question')}
                  className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:text-indigo-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <HelpCircle size={16} className="mb-1 text-indigo-500" />
                  Pregunta
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('multiple_choice')}
                  className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:text-indigo-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <CheckSquare size={16} className="mb-1 text-purple-500" />
                  Opción Múlt.
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('true_false')}
                  className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:text-indigo-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <CheckCircle2 size={16} className="mb-1 text-red-500" />
                  V / F
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('poll')}
                  className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:text-indigo-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <ListChecks size={16} className="mb-1 text-pink-500" />
                  Encuesta
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('spinner')}
                  className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:text-indigo-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <Dices size={16} className="mb-1 text-orange-500" />
                  Ruleta
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('fill_blank')}
                  className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:border-teal-300 dark:hover:border-teal-500/40 hover:text-teal-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <BookOpen size={16} className="mb-1 text-teal-500" />
                  Completar
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('dice')}
                  className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-300 dark:hover:border-amber-500/40 hover:text-amber-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <Sparkles size={16} className="mb-1 text-amber-500" />
                  Dado 3D
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('word_search')}
                  className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 hover:border-cyan-300 dark:hover:border-cyan-500/40 hover:text-cyan-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <Grid3x3 size={16} className="mb-1 text-cyan-500" />
                  Sopa Letras
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('reflection_slider')}
                  className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:border-sky-300 dark:hover:border-sky-500/40 hover:text-sky-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <Sliders size={16} className="mb-1 text-sky-500" />
                  Evaluación
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('reflection_note')}
                  className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:text-emerald-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <StickyNote size={16} className="mb-1 text-emerald-500" />
                  Nota Rhema
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('timer_challenge')}
                  className="flex flex-col items-center justify-center p-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300 dark:hover:border-rose-500/40 hover:text-rose-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <Timer size={16} className="mb-1 text-rose-500" />
                  Timer Reto
                </button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default BlockEditor;
