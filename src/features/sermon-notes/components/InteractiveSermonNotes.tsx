import React, { useState } from 'react';
import type { SermonBlankPrompt } from '../types';
import { BookOpen, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface InteractiveSermonNotesProps {
  sermonTitle: string;
  speakerName?: string;
  prompts: SermonBlankPrompt[];
  initialAnswers?: Record<string, string>;
  initialPersonalNotes?: string;
  onSave: (answers: Record<string, string>, personalNotes: string) => Promise<void>;
}

export const InteractiveSermonNotes: React.FC<InteractiveSermonNotesProps> = ({
  sermonTitle,
  speakerName,
  prompts,
  initialAnswers = {},
  initialPersonalNotes = '',
  onSave,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [personalNotes, setPersonalNotes] = useState<string>(initialPersonalNotes);
  const [saving, setSaving] = useState(false);

  const handleAnswerChange = (promptId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [promptId]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(answers, personalNotes);
      toast.success('Notas del sermón guardadas en tu perfil');
    } catch {
      toast.error('Error al guardar las notas');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            Notas Guiadas de Predicación
          </span>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {sermonTitle}
          </h2>
          {speakerName && <p className="text-xs text-slate-400">Expositor: {speakerName}</p>}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar Mis Notas'}
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-blue-500" />
          Completa los puntos clave del mensaje
        </h3>

        {prompts.map((prompt, i) => (
          <div
            key={prompt.id}
            className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-2"
          >
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              {i + 1}. {prompt.question}
            </label>
            <input
              type="text"
              placeholder={prompt.hint || 'Escribe tu respuesta aquí...'}
              value={answers[prompt.id] || ''}
              onChange={(e) => handleAnswerChange(prompt.id, e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-amber-500" />
          Notas Personales / Aplicación Práctica
        </h3>
        <textarea
          value={personalNotes}
          onChange={(e) => setPersonalNotes(e.target.value)}
          placeholder="¿Qué te habló Dios hoy a través de esta palabra? Escribe tu compromiso o reflexión..."
          className="w-full p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm h-32 focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};
