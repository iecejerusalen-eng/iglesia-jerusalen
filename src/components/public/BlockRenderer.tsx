import React, { useState } from 'react';
import OptimizedMedia from '../common/OptimizedMedia';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import type { ContentBlock } from '../admin/BlockBuilder';
import type { LessonBlock } from '../admin/BlockEditor';
import BlockLessonRenderer from './BlockLessonRenderer';
import { 
  Check, Award, Send, RefreshCw, ClipboardList, HelpCircle
} from 'lucide-react';

interface BlockRendererProps {
  blocks: (ContentBlock | LessonBlock)[] | null | undefined;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ blocks }) => {
  const { user, firstName, lastName } = useAuthStore();
  const [formData, setFormData] = useState<{ [blockId: string]: { [qId: string]: any } }>({});
  const [guestInfo, setGuestInfo] = useState<{ name: string; email: string }>({ name: '', email: '' });
  const [submitting, setSubmitting] = useState<{ [blockId: string]: boolean }>({});
  const [results, setResults] = useState<{ [blockId: string]: { submitted: boolean; score?: number; maxScore?: number; gradedQuestions?: { [qId: string]: boolean } } }>({});

  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return null;

  const handleInputChange = (blockId: string, qId: string, val: any) => {
    setFormData(prev => ({
      ...prev,
      [blockId]: {
        ...prev[blockId],
        [qId]: val
      }
    }));
  };

  const handleCheckboxChange = (blockId: string, qId: string, option: string, isChecked: boolean) => {
    const currentAnswers = formData[blockId]?.[qId] || [];
    let newAnswers = [];
    if (isChecked) {
      newAnswers = [...currentAnswers, option];
    } else {
      newAnswers = currentAnswers.filter((item: string) => item !== option);
    }
    handleInputChange(blockId, qId, newAnswers);
  };

  const handleSubmitForm = async (block: ContentBlock) => {
    const blockId = block.id;
    const questions = block.formQuestions || [];
    const isTrivia = block.formType === 'trivia';
    
    // Check if at least some answers are filled
    const blockAnswers = formData[blockId] || {};
    const answeredCount = Object.keys(blockAnswers).filter(k => {
      const ans = blockAnswers[k];
      return ans !== undefined && ans !== '' && (Array.isArray(ans) ? ans.length > 0 : true);
    }).length;

    if (answeredCount === 0) {
      alert('Por favor, responde al menos una pregunta antes de enviar.');
      return;
    }

    setSubmitting(prev => ({ ...prev, [blockId]: true }));

    // Evaluate answers if it is a trivia
    let score = 0;
    let maxScore = 0;
    const gradedQuestions: { [qId: string]: boolean } = {};

    if (isTrivia) {
      questions.forEach(q => {
        const pts = q.points || 5;
        maxScore += pts;

        const userAns = blockAnswers[q.id];
        const correctAns = q.correctAnswer;

        let isCorrect = false;
        if (q.type === 'text') {
          // Case insensitive comparison for text
          isCorrect = userAns && correctAns && userAns.trim().toLowerCase() === correctAns.trim().toLowerCase();
        } else if (q.type === 'radio') {
          isCorrect = userAns && correctAns && userAns === correctAns;
        } else if (q.type === 'checkbox') {
          // Check if arrays match
          const userArr = Array.isArray(userAns) ? [...userAns].sort() : [];
          // Assuming correctAns is stored as array or comma-separated string
          const correctArr = Array.isArray(correctAns) 
            ? [...correctAns].sort() 
            : (correctAns ? correctAns.split(',').map(s => s.trim()).sort() : []);
          
          isCorrect = userArr.length === correctArr.length && userArr.every((v, i) => v === correctArr[i]);
        }

        gradedQuestions[q.id] = !!isCorrect;
        if (isCorrect) {
          score += pts;
        }
      });
    }

    // Persist to Supabase
    try {
      const pageId = blockId.split('_')[0] || 'unknown';
      const mName = user ? `${firstName || ''} ${lastName || ''}`.trim() : guestInfo.name || 'Invitado';
      const mEmail = user ? user.email : guestInfo.email || 'anonimo@iglesia.com';

      const { error } = await supabase
        .from('form_responses')
        .insert({
          block_id: blockId,
          page_id: pageId,
          user_id: user?.id || null,
          member_name: mName,
          member_email: mEmail,
          answers: blockAnswers,
          score: isTrivia ? score : null,
          max_score: isTrivia ? maxScore : null,
        });

      if (error) throw error;

      // Update state
      setResults(prev => ({
        ...prev,
        [blockId]: {
          submitted: true,
          score,
          maxScore,
          gradedQuestions
        }
      }));

    } catch (err: any) {
      console.error('Error submitting questionnaire answers:', err);
      alert('Error al enviar las respuestas: ' + err.message);
    } finally {
      setSubmitting(prev => ({ ...prev, [blockId]: false }));
    }
  };

  return (
    <div className="space-y-8">
      {blocks.map((block) => {
        const key = block.id;

        switch (block.type) {
          case 'text': {
            const rawText = (block as any).text || (block as any).textContent || '';
            return (
              <div 
                key={key} 
                className="prose max-w-none text-gray-650 leading-relaxed text-sm md:text-base space-y-4"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawText) }}
              />
            );
          }

          case 'html': {
            const rawHtml = (block as any).html || (block as any).htmlContent || '';
            return (
              <div 
                key={key}
                className="w-full overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawHtml) }}
              />
            );
          }

          case 'image': {
            const imageUrl = (block as any).image_url || (block as any).imageUrl || '';
            const caption = (block as any).text || (block as any).imageCaption || '';
            const align = (block as any).imageAlign || 'center';
            const imageText = (block as any).imageText || '';
            const isCenter = align === 'center';
            const isRight = align === 'right';

            if (isCenter) {
              return (
                <div key={key} className="space-y-2 text-center my-6">
                  <div className="rounded-2xl overflow-hidden border border-gray-150 shadow-sm max-h-[500px] bg-slate-50">
                    <OptimizedMedia 
                      src={imageUrl} 
                      alt={caption} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {caption && (
                    <p className="text-xs text-gray-400 italic font-medium">{caption}</p>
                  )}
                </div>
              );
            }

            return (
              <div 
                key={key} 
                className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center my-8 ${
                  isRight ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Image element */}
                <div className={`rounded-2xl overflow-hidden border border-gray-150 shadow-sm h-72 bg-slate-50 ${
                  isRight ? 'md:order-last' : 'md:order-first'
                }`}>
                  <OptimizedMedia 
                    src={imageUrl} 
                    alt="Imagen de sección" 
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Accompanied text element */}
                <div 
                  className="prose max-w-none text-gray-650 leading-relaxed text-sm md:text-base"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(imageText) }}
                />
              </div>
            );
          }

          case 'columns': {
            const cols = block.columns || ['', ''];
            const colCount = cols.length;
            
            let gridClasses = 'grid-cols-1 md:grid-cols-2';
            if (colCount === 3) gridClasses = 'grid-cols-1 md:grid-cols-3';
            if (colCount >= 4) gridClasses = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

            return (
              <div key={key} className={`grid ${gridClasses} gap-6 my-6`}>
                {cols.map((colText, idx) => (
                  <div 
                    key={idx} 
                    className="bg-slate-50/50 p-6 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-xs transition-shadow prose max-w-none text-gray-650 leading-relaxed text-xs md:text-sm"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(colText) }}
                  />
                ))}
              </div>
            );
          }

          case 'cta_button': {
            const align = block.ctaAlign || 'center';
            let alignClass = 'justify-center';
            if (align === 'left') alignClass = 'justify-start';
            if (align === 'right') alignClass = 'justify-end';

            const isExternal = block.ctaUrl?.startsWith('http') || block.ctaUrl?.startsWith('https') || block.ctaUrl?.startsWith('//') || block.ctaUrl?.startsWith('wa.me');

            const btnContent = (
              <span className="px-6 py-2.5 bg-primary hover:bg-blue-900 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-xs inline-flex items-center gap-1.5 cursor-pointer">
                {block.ctaText || 'Saber Más'}
              </span>
            );

            return (
              <div key={key} className={`flex w-full ${alignClass} my-4`}>
                {isExternal ? (
                  <a 
                    href={block.ctaUrl || ''} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {btnContent}
                  </a>
                ) : (
                  <Link to={block.ctaUrl || '#'}>
                    {btnContent}
                  </Link>
                )}
              </div>
            );
          }

          case 'form': {
            const blockId = block.id;
            const questions = block.formQuestions || [];
            const result = results[blockId];
            const isSubmitted = result?.submitted;
            const isTrivia = block.formType === 'trivia';

            return (
              <div 
                key={key} 
                className="bg-white border border-gray-150 rounded-2xl p-6 md:p-8 shadow-xs my-6 space-y-6"
              >
                {/* Header */}
                <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="text-gold" size={20} />
                    <h3 className="font-serif font-bold text-gray-800 text-base md:text-lg">
                      {block.formTitle || 'Cuestionario de Aprendizaje'}
                    </h3>
                  </div>
                  {isTrivia && isSubmitted && (
                    <span className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Award size={14} />
                      Calificación: {result.score} / {result.maxScore} pts
                    </span>
                  )}
                </div>

                {/* Submision Success Banner */}
                {isSubmitted ? (
                  <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
                    isTrivia ? 'bg-amber-50/50 border-amber-100 text-amber-900' : 'bg-green-50/50 border-green-150 text-green-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      {isTrivia ? <Award size={18} className="text-gold" /> : <Check size={18} className="text-green-600" />}
                      <span className="font-bold text-sm">
                        {isTrivia ? '¡Cuestionario de Trivia Finalizado!' : '¡Tus respuestas han sido enviadas correctamente!'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      {isTrivia 
                        ? `Has completado el cuestionario respondiendo de forma interactiva. Revisa abajo el desglose de tus respuestas y las soluciones correctas.`
                        : `Agradecemos tu tiempo de responder. Las respuestas han sido registradas para el equipo pastoral y de enseñanza.`}
                    </p>
                  </div>
                ) : null}

                {/* Questions render */}
                <div className="space-y-6">
                  {questions.map((q, qIdx) => {
                    const userVal = formData[blockId]?.[q.id];
                    const isCorrect = result?.gradedQuestions?.[q.id];
                    
                    let highlightClass = 'border-gray-200';
                    if (isSubmitted && isTrivia) {
                      highlightClass = isCorrect ? 'border-green-300 bg-green-50/10' : 'border-red-300 bg-red-50/10';
                    }

                    return (
                      <div 
                        key={q.id} 
                        className={`p-4 border rounded-xl space-y-3 transition-colors ${highlightClass}`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <span className="font-semibold text-xs md:text-sm text-gray-850">
                            {qIdx + 1}. {q.questionText}
                          </span>

                          {isSubmitted && isTrivia && (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                              isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {isCorrect ? `Correcto (+${q.points} pts)` : `Incorrecto (0 pts)`}
                            </span>
                          )}
                        </div>

                        {/* Answers Field Selection */}
                        <div className="pt-1">
                          {/* TEXT QUESTION */}
                          {q.type === 'text' && (
                            <textarea
                              disabled={isSubmitted}
                              value={userVal || ''}
                              onChange={(e) => handleInputChange(blockId, q.id, e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:bg-gray-50 disabled:text-gray-500"
                              placeholder="Escribe tu respuesta aquí..."
                            />
                          )}

                          {/* RADIO QUESTION */}
                          {q.type === 'radio' && (
                            <div className="grid grid-cols-1 gap-2.5">
                              {(q.options || []).map((opt, oIdx) => {
                                const isChecked = userVal === opt;
                                return (
                                  <label 
                                    key={oIdx} 
                                    className={`flex items-center gap-2 text-xs md:text-sm font-medium ${
                                      isSubmitted ? 'text-gray-500 cursor-default' : 'text-gray-700 cursor-pointer hover:text-black'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      disabled={isSubmitted}
                                      name={`q-${blockId}-${q.id}`}
                                      checked={isChecked}
                                      onChange={() => handleInputChange(blockId, q.id, opt)}
                                      className="w-4 h-4 text-primary focus:ring-primary"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {/* CHECKBOX QUESTION */}
                          {q.type === 'checkbox' && (
                            <div className="grid grid-cols-1 gap-2.5">
                              {(q.options || []).map((opt, oIdx) => {
                                const isChecked = Array.isArray(userVal) && userVal.includes(opt);
                                return (
                                  <label 
                                    key={oIdx} 
                                    className={`flex items-center gap-2 text-xs md:text-sm font-medium ${
                                      isSubmitted ? 'text-gray-500 cursor-default' : 'text-gray-700 cursor-pointer hover:text-black'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      disabled={isSubmitted}
                                      checked={isChecked}
                                      onChange={(e) => handleCheckboxChange(blockId, q.id, opt, e.target.checked)}
                                      className="w-4 h-4 text-primary focus:ring-primary rounded"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Show Correct Solution if wrong */}
                        {isSubmitted && isTrivia && !isCorrect && q.correctAnswer && (
                          <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 mt-2 flex items-start gap-1.5 text-[11px] text-amber-800">
                            <HelpCircle size={14} className="shrink-0 mt-0.5" />
                            <span>
                              <strong className="font-bold">Solución correcta:</strong> {q.correctAnswer}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Guest Profile and Submit Container */}
                {!isSubmitted && (
                  <div className="border-t border-gray-100 pt-6 space-y-4">
                    {/* Guest Name & Email input if user is not authenticated */}
                    {!user && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Tu Nombre (Opcional)
                          </label>
                          <input
                            type="text"
                            value={guestInfo.name}
                            onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/10"
                            placeholder="Ej. Juan Pérez"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Tu Correo Electrónico (Opcional)
                          </label>
                          <input
                            type="email"
                            value={guestInfo.email}
                            onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/10"
                            placeholder="correo@ejemplo.com"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={submitting[blockId]}
                        onClick={() => handleSubmitForm(block)}
                        className="bg-primary hover:bg-blue-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {submitting[blockId] ? (
                          <>
                            <RefreshCw className="animate-spin" size={14} />
                            <span>Enviando respuestas...</span>
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            <span>Enviar Respuestas</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          case 'section':
          case 'question':
          case 'multiple_choice':
          case 'true_false':
            return (
              <div key={key} className="my-6">
                <BlockLessonRenderer content={JSON.stringify([block])} lessonId={`min-${key}`} />
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};

export default BlockRenderer;
