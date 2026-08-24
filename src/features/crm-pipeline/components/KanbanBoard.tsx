import React, { useState } from 'react';
import type { CrmStage, CrmContact } from '../types';
import { User, Phone, Mail, Tag, Plus, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface KanbanBoardProps {
  stages: CrmStage[];
  contacts: CrmContact[];
  onStageChange: (contactId: string, newStageId: string) => Promise<void>;
  onContactClick: (contact: CrmContact) => void;
  onAddContact: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  stages,
  contacts,
  onStageChange,
  onContactClick,
  onAddContact,
}) => {
  const [draggedContactId, setDraggedContactId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, contactId: string) => {
    e.dataTransfer.setData('contactId', contactId);
    setDraggedContactId(contactId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const contactId = e.dataTransfer.getData('contactId') || draggedContactId;
    if (!contactId) return;

    try {
      await onStageChange(contactId, targetStageId);
      toast.success('Etapa actualizada con éxito');
    } catch {
      toast.error('Error al cambiar la etapa');
    } finally {
      setDraggedContactId(null);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center bg-white/80 dark:bg-slate-900/80 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Pipeline de Asimilación de Visitantes
          </h2>
          <p className="text-sm text-slate-500">
            Mueve los contactos a lo largo de su camino espiritual en la iglesia
          </p>
        </div>
        <button
          onClick={onAddContact}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Contacto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageContacts = contacts.filter((c) => c.stage_id === stage.id);
          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className="bg-slate-100/70 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/50 flex flex-col min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                    {stage.name}
                  </h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {stageContacts.length}
                </span>
              </div>

              <div className="flex-1 space-y-3">
                {stageContacts.map((contact) => (
                  <div
                    key={contact.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, contact.id)}
                    onClick={() => onContactClick(contact)}
                    className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing transition-all hover:border-blue-500/50"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-500" />
                        {contact.first_name} {contact.last_name || ''}
                      </h4>
                    </div>

                    <div className="mt-2 text-xs text-slate-500 space-y-1">
                      {contact.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </div>

                    {contact.tags && contact.tags.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {contact.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(contact.created_at).toLocaleDateString()}
                      </span>
                      <span className="capitalize">{contact.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
