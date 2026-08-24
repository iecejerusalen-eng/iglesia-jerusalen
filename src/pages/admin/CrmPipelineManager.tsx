import React, { useEffect, useState } from 'react';
import { KanbanBoard } from '../../features/crm-pipeline/components/KanbanBoard';
import { crmService } from '../../features/crm-pipeline/services/crmService';
import type { CrmPipeline, CrmContact, CrmStage } from '../../features/crm-pipeline/types';
import { Users, Plus, Filter, Search, Sparkles, X, Phone, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

export default function CrmPipelineManager() {
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<CrmPipeline | null>(null);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(null);

  const [newContactData, setNewContactData] = useState<Partial<CrmContact>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    source: 'web_form',
    stage_id: 'new_guest',
    notes: '',
  });

  const defaultStages: CrmStage[] = [
    { id: 'new_guest', name: 'Visitante Nuevo', color: '#3B82F6' },
    { id: 'contacted', name: 'Contactado', color: '#8B5CF6' },
    { id: 'connected', name: 'En Conexión', color: '#10B981' },
    { id: 'member', name: 'Miembro', color: '#F59E0B' },
    { id: 'servant', name: 'Servidor', color: '#EC4899' },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const pipeList = await crmService.getPipelines();
      if (pipeList.length > 0) {
        setPipelines(pipeList);
        const defaultPipe = pipeList.find((p) => p.is_default) || pipeList[0];
        setActivePipeline(defaultPipe);
        const contactList = await crmService.getContacts(defaultPipe.id);
        setContacts(contactList);
      } else {
        // Fallback default pipeline
        const defaultPipe: CrmPipeline = {
          id: 'default-pipeline',
          name: 'Pipeline Principal de Asimilación',
          description: 'Ruta de seguimiento de visitantes hasta membresía',
          stages: defaultStages,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setPipelines([defaultPipe]);
        setActivePipeline(defaultPipe);
        const contactList = await crmService.getContacts();
        setContacts(contactList);
      }
    } catch (err) {
      console.error('Error cargando CRM pipeline:', err);
      toast.error('Error al cargar datos del CRM');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStageChange = async (contactId: string, newStageId: string) => {
    try {
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, stage_id: newStageId } : c))
      );
      await crmService.updateContactStage(contactId, newStageId);
      toast.success('Etapa actualizada');
    } catch {
      toast.error('Error al actualizar etapa');
      loadData();
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactData.first_name) {
      return toast.error('El nombre es obligatorio');
    }

    try {
      await crmService.createContact({
        ...newContactData,
        pipeline_id: activePipeline?.id !== 'default-pipeline' ? activePipeline?.id : undefined,
      });
      toast.success('Contacto agregado al CRM');
      setIsNewContactModalOpen(false);
      setNewContactData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        source: 'web_form',
        stage_id: 'new_guest',
        notes: '',
      });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el contacto');
    }
  };

  const currentStages = activePipeline?.stages || defaultStages;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Pipeline CRM de Visitantes
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Seguimiento Kanban de visitantes, asimilación e integración de miembros
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewContactModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Agregar Contacto
        </button>
      </div>

      {/* Main Kanban Board Container */}
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <KanbanBoard
            stages={currentStages}
            contacts={contacts}
            onStageChange={handleStageChange}
            onContactClick={(c) => setSelectedContact(c)}
            onAddContact={() => setIsNewContactModalOpen(true)}
          />
        )}
      </div>

      {/* Contact Details Modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" />
                {selectedContact.first_name} {selectedContact.last_name}
              </h3>
              <button
                onClick={() => setSelectedContact(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              {selectedContact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  <span>{selectedContact.email}</span>
                </div>
              )}
              {selectedContact.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <span>{selectedContact.phone}</span>
                </div>
              )}
              {selectedContact.source && (
                <div className="text-xs text-gray-500">
                  Origen: <span className="font-semibold">{selectedContact.source}</span>
                </div>
              )}
              {selectedContact.notes && (
                <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl text-xs italic">
                  "{selectedContact.notes}"
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedContact(null)}
                className="w-full py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Contact Modal */}
      {isNewContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-gray-200 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Nuevo Contacto de Visitante
              </h3>
              <button
                onClick={() => setIsNewContactModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={newContactData.first_name}
                    onChange={(e) =>
                      setNewContactData({ ...newContactData, first_name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={newContactData.last_name || ''}
                    onChange={(e) =>
                      setNewContactData({ ...newContactData, last_name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newContactData.email || ''}
                    onChange={(e) =>
                      setNewContactData({ ...newContactData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={newContactData.phone || ''}
                    onChange={(e) =>
                      setNewContactData({ ...newContactData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Etapa Inicial
                </label>
                <select
                  value={newContactData.stage_id}
                  onChange={(e) =>
                    setNewContactData({ ...newContactData, stage_id: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-sm"
                >
                  {currentStages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Notas de primera visita
                </label>
                <textarea
                  rows={3}
                  value={newContactData.notes || ''}
                  onChange={(e) =>
                    setNewContactData({ ...newContactData, notes: e.target.value })
                  }
                  placeholder="Petición de oración o interés conversado..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewContactModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
