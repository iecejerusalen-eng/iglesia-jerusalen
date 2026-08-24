import React, { useState } from 'react';
import type { Workflow, WorkflowAction } from '../types';
import { Zap, Plus, Trash2, Save, Mail, MessageSquare, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowBuilderProps {
  onSave: (workflow: Partial<Workflow>) => Promise<void>;
  initialData?: Workflow;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ onSave, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [triggerType, setTriggerType] = useState<Workflow['trigger_type']>(
    initialData?.trigger_type || 'new_contact'
  );
  const [actions, setActions] = useState<WorkflowAction[]>(initialData?.actions || []);

  const handleAddAction = (type: WorkflowAction['type']) => {
    setActions((prev) => [
      ...prev,
      { type, params: type === 'send_email' ? { subject: '', template: '' } : { message: '' } },
    ]);
  };

  const handleRemoveAction = (index: number) => {
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Por favor escribe un nombre para el workflow');
      return;
    }
    try {
      await onSave({
        name,
        description,
        trigger_type: triggerType,
        trigger_config: {},
        conditions: [],
        actions,
        is_active: true,
      });
      toast.success('Workflow guardado correctamente');
    } catch {
      toast.error('Error al guardar el workflow');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Creador de Automatizaciones
          </h3>
          <p className="text-xs text-slate-500">
            Define la regla de seguimiento automático cuando ocurre un evento
          </p>
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          Guardar Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Nombre del Workflow
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Bienvenida a visitante nuevo (SMS + Email)"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Gatillo (Trigger)
          </label>
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value as Workflow['trigger_type'])}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
          >
            <option value="new_contact">Cuando se registra un nuevo visitante</option>
            <option value="stage_change">Cuando un contacto cambia de etapa</option>
            <option value="event_checkin">Cuando realiza Check-in en un culto</option>
            <option value="birthday">En la fecha de su cumpleaños</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Descripción
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Explicación opcional del propósito del workflow..."
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm h-20"
        />
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Acciones a Ejecutar
        </h4>

        {actions.length === 0 ? (
          <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-sm">
            No hay acciones configuradas aún. Elige una acción abajo.
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold">
                  {idx + 1}
                </span>
                <div className="flex-1 text-sm font-medium capitalize flex items-center gap-2">
                  {action.type === 'send_email' && <Mail className="w-4 h-4 text-blue-500" />}
                  {action.type === 'send_sms' && <MessageSquare className="w-4 h-4 text-emerald-500" />}
                  {action.type === 'change_stage' && <ArrowRight className="w-4 h-4 text-purple-500" />}
                  <span>{action.type.replace('_', ' ')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAction(idx)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleAddAction('send_email')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 rounded-lg text-xs font-medium border border-blue-200 dark:border-blue-800"
          >
            <Plus className="w-3.5 h-3.5" /> Enviar Email
          </button>
          <button
            type="button"
            onClick={() => handleAddAction('send_sms')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 rounded-lg text-xs font-medium border border-emerald-200 dark:border-emerald-800"
          >
            <Plus className="w-3.5 h-3.5" /> Enviar SMS
          </button>
          <button
            type="button"
            onClick={() => handleAddAction('change_stage')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300 rounded-lg text-xs font-medium border border-purple-200 dark:border-purple-800"
          >
            <Plus className="w-3.5 h-3.5" /> Cambiar Etapa
          </button>
        </div>
      </div>
    </form>
  );
};
