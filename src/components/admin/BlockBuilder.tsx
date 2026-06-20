import React, { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import { 
  Trash2, ArrowUp, ArrowDown, Type, Code, 
  Image as ImageIcon, Columns, ExternalLink, X,
  AlignLeft, AlignCenter, AlignRight, ClipboardList, Plus, HelpCircle,
  Heading, CheckSquare, CheckCircle2, Search
} from 'lucide-react';
import MediaUploader from '../common/MediaUploader';
import MediaSearchModal from './MediaSearchModal';
import { useConfirmStore } from '../../store/useConfirmStore';

export interface ContentBlock {
  id: string;
  type: 'text' | 'html' | 'image' | 'columns' | 'cta_button' | 'form' | 'section' | 'question' | 'multiple_choice' | 'true_false';
  textContent?: string;
  htmlContent?: string;
  imageUrl?: string;
  imageAlign?: 'left' | 'right' | 'center';
  imageCaption?: string;
  imageText?: string;
  columns?: string[];
  ctaText?: string;
  ctaUrl?: string;
  ctaAlign?: 'left' | 'center' | 'right';
  // Form/Trivia block fields
  formTitle?: string;
  formType?: 'regular' | 'trivia';
  formQuestions?: Array<{
    id: string;
    type: 'text' | 'radio' | 'checkbox';
    questionText: string;
    options?: string[];
    correctAnswer?: string;
    points?: number;
  }>;
  // Lesson block fields (from BlockEditor.tsx/LessonBlock)
  text?: string;
  image_url?: string;
  html?: string;
  title?: string;
  question_text?: string;
  options?: string[];
  correct_option_idx?: number;
  correct_boolean?: boolean;
}

interface BlockBuilderProps {
  blocks: ContentBlock[];
  onChange: (updatedBlocks: ContentBlock[]) => void;
  disabled?: boolean;
}

const BlockBuilder: React.FC<BlockBuilderProps> = ({ blocks, onChange, disabled = false }) => {
  const confirm = useConfirmStore((state) => state.confirm);
  const [newOptionText, setNewOptionText] = useState<{ [qId: string]: string }>({});
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [activeBlockIdForMedia, setActiveBlockIdForMedia] = useState<string | null>(null);

  const addBlock = (type: ContentBlock['type']) => {
    if (disabled) return;
    const newBlock: ContentBlock = {
      id: `${type}-${Date.now()}`,
      type,
      ...(type === 'text' && { textContent: '', text: '' }),
      ...(type === 'html' && { htmlContent: '', html: '' }),
      ...(type === 'image' && { imageUrl: '', image_url: '', imageAlign: 'center', imageCaption: '', imageText: '', text: '' }),
      ...(type === 'columns' && { columns: ['', ''] }),
      ...(type === 'cta_button' && { ctaText: 'Saber Más', ctaUrl: '', ctaAlign: 'center' }),
      ...(type === 'form' && {
        formTitle: 'Cuestionario de Aprendizaje',
        formType: 'regular',
        formQuestions: [
          {
            id: `q-${Date.now()}-1`,
            type: 'text',
            questionText: '¿Qué fue lo que más te impactó de esta enseñanza?',
            points: 5
          }
        ]
      }),
      ...(type === 'section' && { title: '' }),
      ...(type === 'question' && { question_text: '' }),
      ...(type === 'multiple_choice' && { question_text: '', options: ['Opción A', 'Opción B'], correct_option_idx: 0 }),
      ...(type === 'true_false' && { question_text: '', correct_boolean: true }),
    };
    onChange([...blocks, newBlock]);
  };

  const deleteBlock = async (id: string) => {
    if (disabled) return;
    const confirmed = await confirm({
      title: 'Eliminar bloque',
      message: '¿Estás seguro de que deseas eliminar este bloque de contenido?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    onChange(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (disabled) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    
    onChange(updated);
  };

  const updateBlockProperty = (id: string, key: keyof ContentBlock, value: any) => {
    if (disabled) return;
    const updated = blocks.map((block) => {
      if (block.id === id) {
        const updatedBlock = { ...block, [key]: value };
        // Sync equivalent fields for retro-compatibility and rendering reliability
        if (key === 'textContent') updatedBlock.text = value;
        if (key === 'text') updatedBlock.textContent = value;
        if (key === 'htmlContent') updatedBlock.html = value;
        if (key === 'html') updatedBlock.htmlContent = value;
        if (key === 'imageUrl') updatedBlock.image_url = value;
        if (key === 'image_url') updatedBlock.imageUrl = value;
        if (key === 'imageCaption') updatedBlock.text = value;
        return updatedBlock;
      }
      return block;
    });
    onChange(updated);
  };

  // Helper functions for Lesson Blocks (Multiple choice options)
  const addBlockOption = (blockId: string, options: string[]) => {
    updateBlockProperty(blockId, 'options', [...options, 'Nueva Opción']);
  };

  const removeBlockOption = (blockId: string, options: string[], indexToRemove: number) => {
    if (options.length <= 2) return;
    const filtered = options.filter((_, idx) => idx !== indexToRemove);
    const block = blocks.find(b => b.id === blockId);
    let correctIdx = block?.correct_option_idx ?? 0;
    if (correctIdx >= filtered.length) {
      correctIdx = 0;
    }
    updateBlockProperty(blockId, 'options', filtered);
    updateBlockProperty(blockId, 'correct_option_idx', correctIdx);
  };

  const updateBlockOptionText = (blockId: string, options: string[], idx: number, text: string) => {
    const newOptions = [...options];
    newOptions[idx] = text;
    updateBlockProperty(blockId, 'options', newOptions);
  };

  // Helper functions for Form Questions
  const updateQuestion = (blockId: string, qId: string, updatedFields: any) => {
    if (disabled) return;
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const questions = (block.formQuestions || []).map(q => 
      q.id === qId ? { ...q, ...updatedFields } : q
    );
    updateBlockProperty(blockId, 'formQuestions', questions);
  };

  const addQuestion = (blockId: string) => {
    if (disabled) return;
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const questions = [...(block.formQuestions || [])];
    questions.push({
      id: `q-${Date.now()}-${questions.length + 1}`,
      type: 'text',
      questionText: 'Nueva Pregunta',
      points: 5,
      options: []
    });
    updateBlockProperty(blockId, 'formQuestions', questions);
  };

  const deleteQuestion = async (blockId: string, qId: string) => {
    if (disabled) return;
    const confirmed = await confirm({
      title: 'Eliminar pregunta',
      message: '¿Estás seguro de que deseas eliminar esta pregunta?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const questions = (block.formQuestions || []).filter(q => q.id !== qId);
    updateBlockProperty(blockId, 'formQuestions', questions);
  };

  const addQuestionOption = (blockId: string, qId: string) => {
    if (disabled) return;
    const text = newOptionText[qId]?.trim() || '';
    if (!text) return;

    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const question = (block.formQuestions || []).find(q => q.id === qId);
    if (!question) return;

    const options = [...(question.options || [])];
    if (options.includes(text)) {
      alert('Esta opción ya existe.');
      return;
    }

    options.push(text);
    updateQuestion(blockId, qId, { options });
    setNewOptionText(prev => ({ ...prev, [qId]: '' }));
  };

  const removeQuestionOption = (blockId: string, qId: string, optionIndex: number) => {
    if (disabled) return;
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const question = (block.formQuestions || []).find(q => q.id === qId);
    if (!question) return;

    const options = (question.options || []).filter((_, idx) => idx !== optionIndex);
    updateQuestion(blockId, qId, { options });
  };

  return (
    <div className="space-y-6">
      {!disabled && (
        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 dark:text-gray-450 uppercase tracking-wider block w-full mb-1">
            Añadir Bloque de Contenido
          </span>
          <button
            type="button"
            onClick={() => addBlock('text')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-primary hover:text-primary text-slate-700 dark:text-gray-300 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Type size={14} className="text-slate-500" />
            Texto / Párrafo
          </button>
          <button
            type="button"
            onClick={() => addBlock('html')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-primary hover:text-primary text-slate-700 dark:text-gray-300 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Code size={14} className="text-slate-500" />
            Bloque HTML / Código
          </button>
          <button
            type="button"
            onClick={() => addBlock('image')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-primary hover:text-primary text-slate-700 dark:text-gray-300 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <ImageIcon size={14} className="text-slate-500" />
            Imagen
          </button>
          <button
            type="button"
            onClick={() => addBlock('columns')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-primary hover:text-primary text-slate-700 dark:text-gray-300 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Columns size={14} className="text-slate-500" />
            Columnas de Texto
          </button>
          <button
            type="button"
            onClick={() => addBlock('cta_button')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-primary hover:text-primary text-slate-700 dark:text-gray-300 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <ExternalLink size={14} className="text-slate-500" />
            Botón / Enlace
          </button>
          <button
            type="button"
            onClick={() => addBlock('form')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-primary hover:text-primary text-slate-700 dark:text-gray-300 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <ClipboardList size={14} className="text-slate-500" />
            Cuestionario / Trivia
          </button>
          <button
            type="button"
            onClick={() => addBlock('section')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-primary hover:text-primary text-slate-700 dark:text-gray-300 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Heading size={14} className="text-slate-500" />
            Sección (Título)
          </button>
          <button
            type="button"
            onClick={() => addBlock('question')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-primary hover:text-primary text-slate-700 dark:text-gray-300 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <HelpCircle size={14} className="text-slate-500" />
            Pregunta Abierta
          </button>
          <button
            type="button"
            onClick={() => addBlock('multiple_choice')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-primary hover:text-primary text-slate-700 dark:text-gray-300 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <CheckSquare size={14} className="text-slate-500" />
            Opción Múltiple
          </button>
          <button
            type="button"
            onClick={() => addBlock('true_false')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-primary hover:text-primary text-slate-700 dark:text-gray-300 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <CheckCircle2 size={14} className="text-slate-500" />
            V / F
          </button>
        </div>
      )}

      <div className="space-y-4">
        {blocks.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 dark:text-gray-450 text-xs font-semibold">
            No has agregado ningún bloque de contenido. Elige una opción arriba para comenzar.
          </div>
        ) : (
          blocks.map((block, index) => {
            return (
              <div 
                key={block.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xs relative group/block animate-scale-in"
              >
                {/* Block Header Toolbar */}
                <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-white/10 px-4 py-2 flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px]">
                      {block.type === 'text' && 'Texto / Párrafo'}
                      {block.type === 'html' && 'HTML / Código'}
                      {block.type === 'image' && `Imagen (${block.imageAlign === 'center' ? 'Centrada' : block.imageAlign === 'left' ? 'Imagen Izquierda' : 'Imagen Derecha'})`}
                      {block.type === 'columns' && 'Columnas'}
                      {block.type === 'cta_button' && 'Botón'}
                      {block.type === 'form' && `Cuestionario / ${block.formType === 'trivia' ? 'Trivia con Puntos' : 'Formulario Libre'}`}
                      {block.type === 'section' && 'Título de Sección'}
                      {block.type === 'question' && 'Pregunta Abierta'}
                      {block.type === 'multiple_choice' && 'Opción Múltiple'}
                      {block.type === 'true_false' && 'Verdadero / Falso'}
                    </span>
                  </div>

                  {!disabled && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveBlock(index, 'up')}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-gray-250 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Mover Arriba"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={index === blocks.length - 1}
                        onClick={() => moveBlock(index, 'down')}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-gray-250 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Mover Abajo"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
                      <button
                        type="button"
                        onClick={() => deleteBlock(block.id)}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors cursor-pointer"
                        title="Eliminar Bloque"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Block Inputs Content */}
                <div className="p-4 space-y-4">
                  {/* TEXT BLOCK */}
                  {block.type === 'text' && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Contenido del Párrafo (Editor de Texto Rico)
                      </label>
                      <RichTextEditor
                        content={block.textContent || ''}
                        onChange={(html) => updateBlockProperty(block.id, 'textContent', html)}
                        disabled={disabled}
                      />
                    </div>
                  )}

                  {/* HTML BLOCK */}
                  {block.type === 'html' && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Código HTML Personalizado
                      </label>
                      <textarea
                        value={block.htmlContent || ''}
                        onChange={(e) => updateBlockProperty(block.id, 'htmlContent', e.target.value)}
                        disabled={disabled}
                        rows={5}
                        className="w-full px-4 py-2 border border-slate-250 dark:border-white/10 rounded-xl font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none bg-slate-900 text-slate-100 placeholder-slate-600 disabled:opacity-80"
                        placeholder="<div>\n  <h3>Título</h3>\n  <p>Contenido...</p>\n</div>"
                      />
                    </div>
                  )}

                  {/* IMAGE BLOCK */}
                  {block.type === 'image' && (
                    <div className="space-y-4">
                      {/* Image Source & Options Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            URL de la Imagen
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={block.imageUrl || ''}
                              onChange={(e) => updateBlockProperty(block.id, 'imageUrl', e.target.value)}
                              disabled={disabled}
                              className="flex-grow px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                              placeholder="https://ejemplo.com/imagen.jpg"
                            />
                            {!disabled && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveBlockIdForMedia(block.id);
                                    setIsMediaModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 border border-slate-200 dark:border-white/10 hover:border-primary hover:text-primary rounded-xl text-xs font-semibold shadow-2xs bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-250 transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                                >
                                  <Search size={13} />
                                  Buscar
                                </button>
                                <MediaUploader
                                  folder="paginas"
                                  allowedFormats={['jpg', 'jpeg', 'png', 'webp']}
                                  onUploadSuccess={(url) => {
                                    updateBlockProperty(block.id, 'imageUrl', url);
                                  }}
                                  label="Subir"
                                  className="!py-1.5"
                                />
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Alineación & Layout
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => updateBlockProperty(block.id, 'imageAlign', 'left')}
                              className={`flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                                block.imageAlign === 'left'
                                  ? 'bg-blue-50 dark:bg-blue-950/30 border-primary text-primary dark:text-blue-400'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              <AlignLeft size={14} />
                              Izq
                            </button>
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => updateBlockProperty(block.id, 'imageAlign', 'center')}
                              className={`flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                                block.imageAlign === 'center'
                                  ? 'bg-blue-50 dark:bg-blue-950/30 border-primary text-primary dark:text-blue-400'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              <AlignCenter size={14} />
                              Centro
                            </button>
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => updateBlockProperty(block.id, 'imageAlign', 'right')}
                              className={`flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                                block.imageAlign === 'right'
                                  ? 'bg-blue-50 dark:bg-blue-950/30 border-primary text-primary dark:text-blue-400'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              <AlignRight size={14} />
                              Der
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Image Preview and context inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                        {block.imageUrl ? (
                          <div className="relative w-full h-32 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                            <img src={block.imageUrl} alt="Block Preview" className="w-full h-full object-cover" />
                            {!disabled && (
                              <button
                                type="button"
                                onClick={() => updateBlockProperty(block.id, 'imageUrl', '')}
                                className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-sm transition-all"
                              >
                                <X size={10} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-32 border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl flex items-center justify-center text-slate-350 text-[10px] font-bold uppercase">
                            Sin Imagen
                          </div>
                        )}

                        <div className="md:col-span-2 space-y-3">
                          {block.imageAlign === 'center' ? (
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Pie de Imagen (Caption)
                              </label>
                              <input
                                type="text"
                                value={block.imageCaption || ''}
                                onChange={(e) => updateBlockProperty(block.id, 'imageCaption', e.target.value)}
                                disabled={disabled}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-slate-50"
                                placeholder="Ej: Vista del altar de nuestra iglesia..."
                              />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Texto Acompañante ({block.imageAlign === 'left' ? 'a la Derecha' : 'a la Izquierda'})
                              </label>
                              <textarea
                                value={block.imageText || ''}
                                onChange={(e) => updateBlockProperty(block.id, 'imageText', e.target.value)}
                                disabled={disabled}
                                rows={4}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-slate-50"
                                placeholder="Escribe el texto que acompañará a la imagen..."
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COLUMNS BLOCK */}
                  {block.type === 'columns' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Contenido de Columnas
                        </label>
                        {!disabled && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={(block.columns || []).length <= 2}
                              onClick={() => {
                                const cols = [...(block.columns || ['', ''])];
                                cols.pop();
                                updateBlockProperty(block.id, 'columns', cols);
                              }}
                              className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              Eliminar Columna
                            </button>
                            <button
                              type="button"
                              disabled={(block.columns || []).length >= 4}
                              onClick={() => {
                                const cols = [...(block.columns || ['', ''])];
                                cols.push('');
                                updateBlockProperty(block.id, 'columns', cols);
                              }}
                              className="text-[10px] font-bold bg-primary/10 hover:bg-primary/20 text-primary px-2 py-0.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              Añadir Columna
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(block.columns || ['', '']).map((colText, cIdx) => (
                          <div key={cIdx} className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 block">Columna {cIdx + 1}</span>
                            <textarea
                              value={colText}
                              onChange={(e) => {
                                const cols = [...(block.columns || ['', ''])];
                                cols[cIdx] = e.target.value;
                                updateBlockProperty(block.id, 'columns', cols);
                              }}
                              disabled={disabled}
                              rows={4}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-450"
                              placeholder={`Escribe el texto de la columna ${cIdx + 1}...`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA BUTTON BLOCK */}
                  {block.type === 'cta_button' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Texto del Botón
                        </label>
                        <input
                          type="text"
                          value={block.ctaText || ''}
                          onChange={(e) => updateBlockProperty(block.id, 'ctaText', e.target.value)}
                          disabled={disabled}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-450"
                          placeholder="Ej: Contáctanos"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Enlace URL / Ruta
                        </label>
                        <input
                          type="text"
                          value={block.ctaUrl || ''}
                          onChange={(e) => updateBlockProperty(block.id, 'ctaUrl', e.target.value)}
                          disabled={disabled}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono disabled:bg-slate-50 disabled:text-slate-450"
                          placeholder="Ej: /contacto o https://wa.me/..."
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Alineación
                        </label>
                        <select
                          value={block.ctaAlign || 'center'}
                          onChange={(e) => updateBlockProperty(block.id, 'ctaAlign', e.target.value)}
                          disabled={disabled}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none font-semibold disabled:bg-slate-50 disabled:text-slate-450"
                        >
                          <option value="left">Alineado a la Izquierda</option>
                          <option value="center">Centrado</option>
                          <option value="right">Alineado a la Derecha</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* FORM / QUIZ BLOCK */}
                  {block.type === 'form' && (
                    <div className="space-y-6 border-t border-slate-100 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Título del Cuestionario
                          </label>
                          <input
                            type="text"
                            value={block.formTitle || ''}
                            onChange={(e) => updateBlockProperty(block.id, 'formTitle', e.target.value)}
                            disabled={disabled}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-slate-50"
                            placeholder="Ej: Cuestionario de Aprendizaje"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Tipo de Cuestionario
                          </label>
                          <select
                            value={block.formType || 'regular'}
                            onChange={(e) => updateBlockProperty(block.id, 'formType', e.target.value)}
                            disabled={disabled}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none font-semibold disabled:bg-slate-50"
                          >
                            <option value="regular">Formulario Libre (Registro, Comentarios)</option>
                            <option value="trivia">Trivia / Cuestionario Evaluativo (Con Respuestas Correctas)</option>
                          </select>
                        </div>
                      </div>

                      {/* Questions List */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preguntas</span>
                          {!disabled && (
                            <button
                              type="button"
                              onClick={() => addQuestion(block.id)}
                              className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              <Plus size={12} />
                              Añadir Pregunta
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          {(!block.formQuestions || block.formQuestions.length === 0) ? (
                            <p className="text-[10px] text-slate-450 italic text-center py-4">No hay preguntas añadidas.</p>
                          ) : (
                            block.formQuestions.map((q, qIdx) => (
                              <div key={q.id || qIdx} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-white/10 rounded-xl p-4 space-y-3 relative group/question">
                                {!disabled && (
                                  <button
                                    type="button"
                                    onClick={() => deleteQuestion(block.id, q.id)}
                                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    title="Eliminar Pregunta"
                                  >
                                    <X size={14} />
                                  </button>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="md:col-span-2 space-y-1">
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase">
                                      Pregunta #{qIdx + 1}
                                    </label>
                                    <input
                                      type="text"
                                      value={q.questionText || ''}
                                      onChange={(e) => updateQuestion(block.id, q.id, { questionText: e.target.value })}
                                      disabled={disabled}
                                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none font-semibold disabled:bg-slate-50 disabled:text-slate-450"
                                      placeholder="Escribe la pregunta..."
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase">
                                      Tipo de Respuesta
                                    </label>
                                    <select
                                      value={q.type}
                                      onChange={(e) => updateQuestion(block.id, q.id, { type: e.target.value, options: e.target.value === 'text' ? [] : ['Opción A'] })}
                                      disabled={disabled}
                                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-slate-50"
                                    >
                                      <option value="text">Texto Libre</option>
                                      <option value="radio">Opción Múltiple (Única Selección)</option>
                                      <option value="checkbox">Casillas (Selección Múltiple)</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Options list for choice questions */}
                                {(q.type === 'radio' || q.type === 'checkbox') && (
                                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/10 rounded-xl p-3 space-y-2.5">
                                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Opciones</span>
                                    
                                    <div className="space-y-1.5">
                                      {(q.options || []).map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-white/10 px-3 py-1.5 rounded-lg text-xs">
                                          <span className="font-medium text-slate-750 dark:text-gray-300">{opt}</span>
                                          {!disabled && (
                                            <button
                                              type="button"
                                              onClick={() => removeQuestionOption(block.id, q.id, oIdx)}
                                              className="text-slate-400 hover:text-red-500 p-0.5"
                                              title="Eliminar opción"
                                            >
                                              <X size={12} />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>

                                    {/* Add new option */}
                                    {!disabled && (
                                      <div className="flex gap-2 pt-1.5 border-t border-slate-100 dark:border-white/10">
                                        <input
                                          type="text"
                                          value={newOptionText[q.id] || ''}
                                          onChange={(e) => setNewOptionText(prev => ({ ...prev, [q.id]: e.target.value }))}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              addQuestionOption(block.id, q.id);
                                            }
                                          }}
                                          className="flex-grow px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                                          placeholder="Añadir opción..."
                                        />
                                        <button
                                          type="button"
                                          onClick={() => addQuestionOption(block.id, q.id)}
                                          className="px-3 py-1 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                        >
                                          +
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Trivia parameters */}
                                {block.formType === 'trivia' && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3">
                                    <div className="space-y-1">
                                      <label className="block text-[9px] font-bold text-amber-800 dark:text-amber-400 uppercase flex items-center gap-1">
                                        <HelpCircle size={10} />
                                        Respuesta Correcta
                                      </label>
                                      {q.type === 'text' ? (
                                        <input
                                          type="text"
                                          value={q.correctAnswer || ''}
                                          onChange={(e) => updateQuestion(block.id, q.id, { correctAnswer: e.target.value })}
                                          disabled={disabled}
                                          className="w-full px-3 py-1 bg-white dark:bg-slate-800 border border-amber-200 dark:border-white/10 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none disabled:bg-slate-50"
                                          placeholder="Respuesta clave/exacta..."
                                        />
                                      ) : (
                                        <select
                                          value={q.correctAnswer || ''}
                                          onChange={(e) => updateQuestion(block.id, q.id, { correctAnswer: e.target.value })}
                                          disabled={disabled}
                                          className="w-full px-3 py-1 bg-white dark:bg-slate-800 border border-amber-200 dark:border-white/10 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none disabled:bg-slate-50"
                                        >
                                          <option value="">Selecciona la opción correcta...</option>
                                          {(q.options || []).map((opt, oIdx) => (
                                            <option key={oIdx} value={opt}>{opt}</option>
                                          ))}
                                        </select>
                                      )}
                                    </div>

                                    <div className="space-y-1">
                                      <label className="block text-[9px] font-bold text-amber-800 dark:text-amber-400 uppercase">
                                        Puntos asignados
                                      </label>
                                      <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={q.points || 5}
                                        onChange={(e) => updateQuestion(block.id, q.id, { points: parseInt(e.target.value) || 5 })}
                                        disabled={disabled}
                                        className="w-full px-3 py-1 bg-white dark:bg-slate-800 border border-amber-200 dark:border-white/10 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none disabled:bg-slate-50"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION TITLE */}
                  {block.type === 'section' && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-gray-450 uppercase tracking-wider">
                        Título de la Sección
                      </label>
                      <input
                        type="text"
                        value={block.title || ''}
                        onChange={(e) => updateBlockProperty(block.id, 'title', e.target.value)}
                        disabled={disabled}
                        placeholder="Título de la Sección (Ej: Introducción, Cuestionario)"
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-slate-50"
                      />
                    </div>
                  )}

                  {/* OPEN QUESTION */}
                  {block.type === 'question' && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-gray-450 uppercase tracking-wider">
                        Pregunta Abierta
                      </label>
                      <input
                        type="text"
                        value={block.question_text || ''}
                        onChange={(e) => updateBlockProperty(block.id, 'question_text', e.target.value)}
                        disabled={disabled}
                        placeholder="Escribe la pregunta abierta aquí (ej: ¿Qué nos enseña esta parábola?)"
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none font-medium disabled:bg-slate-50"
                      />
                    </div>
                  )}

                  {/* MULTIPLE CHOICE */}
                  {block.type === 'multiple_choice' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-gray-450 uppercase tracking-wider">
                          Pregunta de Opción Múltiple
                        </label>
                        <input
                          type="text"
                          value={block.question_text || ''}
                          onChange={(e) => updateBlockProperty(block.id, 'question_text', e.target.value)}
                          disabled={disabled}
                          placeholder="Escribe la pregunta de opción múltiple..."
                          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none font-medium disabled:bg-slate-50"
                        />
                      </div>

                      {/* Options list */}
                      <div className="space-y-2 pl-4 border-l-2 border-slate-150 dark:border-white/10">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-gray-450 uppercase tracking-wider block mb-1">
                          Opciones de Respuesta
                        </span>
                        {(block.options || []).map((option, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              checked={block.correct_option_idx === idx}
                              onChange={() => updateBlockProperty(block.id, 'correct_option_idx', idx)}
                              disabled={disabled}
                              name={`correct-choice-${block.id}`}
                              className="text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                              title="Marcar como correcta"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateBlockOptionText(block.id, block.options || [], idx, e.target.value)}
                              disabled={disabled}
                              placeholder={`Opción ${idx + 1}`}
                              className="flex-grow px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-slate-50"
                            />
                            {!disabled && (
                              <button
                                type="button"
                                onClick={() => removeBlockOption(block.id, block.options || [], idx)}
                                disabled={(block.options || []).length <= 2}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded disabled:opacity-30 cursor-pointer"
                                title="Eliminar opción"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        ))}

                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => addBlockOption(block.id, block.options || [])}
                            className="flex items-center gap-1 text-xs text-primary font-bold hover:text-blue-800 cursor-pointer pt-1"
                          >
                            <Plus size={12} /> Agregar opción
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TRUE / FALSE */}
                  {block.type === 'true_false' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-gray-450 uppercase tracking-wider">
                          Afirmación de Verdadero o Falso
                        </label>
                        <input
                          type="text"
                          value={block.question_text || ''}
                          onChange={(e) => updateBlockProperty(block.id, 'question_text', e.target.value)}
                          disabled={disabled}
                          placeholder="Escribe la afirmación aquí..."
                          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none font-medium disabled:bg-slate-50"
                        />
                      </div>

                      <div className="flex items-center gap-4 pl-4">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-gray-450 uppercase tracking-wider">
                          Respuesta Correcta:
                        </span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                            <input
                              type="radio"
                              checked={block.correct_boolean === true}
                              onChange={() => updateBlockProperty(block.id, 'correct_boolean', true)}
                              disabled={disabled}
                              className="text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                            />
                            Verdadero
                          </label>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                            <input
                              type="radio"
                              checked={block.correct_boolean === false}
                              onChange={() => updateBlockProperty(block.id, 'correct_boolean', false)}
                              disabled={disabled}
                              className="text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                            />
                            Falso
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <MediaSearchModal
        isOpen={isMediaModalOpen}
        onClose={() => {
          setIsMediaModalOpen(false);
          setActiveBlockIdForMedia(null);
        }}
        onSelect={(url) => {
          if (activeBlockIdForMedia) {
            updateBlockProperty(activeBlockIdForMedia, 'imageUrl', url);
          }
        }}
        allowedTypes={['image']}
        title="Buscar Imagen de Stock"
      />
    </div>
  );
};

export default BlockBuilder;
