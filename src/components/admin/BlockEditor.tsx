import { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import MediaUploader from '../common/MediaUploader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Type, Image as ImageIcon, Code, Heading, HelpCircle,
  CheckSquare, CheckCircle2, ArrowUp, ArrowDown, Trash2, Plus, X
} from 'lucide-react';

export type BlockType = 'text' | 'image' | 'html' | 'section' | 'question' | 'multiple_choice' | 'true_false';

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
}

interface Props {
  content: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

const BlockEditor = ({ content, onChange, disabled = false }: Props) => {
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);

  // Parse initial content safely
  useEffect(() => {
    try {
      if (content && content.trim().startsWith('[')) {
        const parsed = JSON.parse(content) as LessonBlock[];
        // Validate array structure
        if (Array.isArray(parsed)) {
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
      text: type === 'text' ? '' : undefined,
      image_url: type === 'image' ? '' : undefined,
      html: type === 'html' ? '' : undefined,
      title: type === 'section' ? '' : undefined,
      question_text: ['question', 'multiple_choice', 'true_false'].includes(type) ? '' : undefined,
      options: type === 'multiple_choice' ? ['Opción A', 'Opción B'] : undefined,
      correct_option_idx: type === 'multiple_choice' ? 0 : undefined,
      correct_boolean: type === 'true_false' ? true : undefined,
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
                        <img src={block.image_url} alt="" className="w-full h-40 object-cover" />
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

                {/* 7. TRUE / FALSE */}
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
          </div>
        </div>
      )}

    </div>
  );
};

export default BlockEditor;
