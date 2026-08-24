import React, { useCallback, useEffect, useState } from 'react';
import { WorkflowBuilder } from '../../features/workflows/components/WorkflowBuilder';
import type { Workflow } from '../../features/workflows/types';
import { supabase } from '../../config/supabase';
import { Sparkles, Plus, Zap, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkflowsManager() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const loadWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (err) {
      console.error('Error cargando workflows:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await loadWorkflows();
    };
    void load();
  }, [loadWorkflows]);

  const handleSaveWorkflow = async (workflowData: Partial<Workflow>) => {
    try {
      const { error } = await supabase.from('workflows').insert([workflowData]);
      if (error) throw error;
      toast.success('Regla de automatización guardada');
      setIsCreating(false);
      loadWorkflows();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el workflow en la base de datos');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Workflow ${!currentStatus ? 'activado' : 'desactivado'}`);
      loadWorkflows();
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar estado');
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm('¿Eliminar esta automatización?')) return;
    try {
      const { error } = await supabase.from('workflows').delete().eq('id', id);
      if (error) throw error;
      toast.success('Workflow eliminado');
      loadWorkflows();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar workflow');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Automatizaciones & Workflows
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Reglas automáticas para enviar mensajes, cambiar etapas y dar seguimiento
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          {isCreating ? 'Ver Lista' : 'Nueva Regla'}
        </button>
      </div>

      {isCreating ? (
        <WorkflowBuilder onSave={handleSaveWorkflow} />
      ) : (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Reglas Activas ({workflows.length})
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-semibold text-sm">No hay automatizaciones creadas aún.</p>
              <p className="text-xs mt-1">Haz clic en "Nueva Regla" para configurar la primera.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workflows.map((wf) => (
                <div
                  key={wf.id}
                  className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">
                        {wf.name}
                      </h3>
                      <button
                        onClick={() => handleToggleActive(wf.id, wf.is_active)}
                        className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                          wf.is_active
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
                        }`}
                      >
                        {wf.is_active ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Inactivo
                          </>
                        )}
                      </button>
                    </div>
                    {wf.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {wf.description}
                      </p>
                    )}
                    <div className="mt-3 text-xs bg-gray-50 dark:bg-slate-900 p-2.5 rounded-lg border border-gray-100 dark:border-white/5">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        Disparador:
                      </span>{' '}
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                        {wf.trigger_type}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-white/10">
                    <span className="text-xs text-gray-400">
                      Ejecutado {wf.execution_count || 0} veces
                    </span>
                    <button
                      onClick={() => handleDeleteWorkflow(wf.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 transition-colors"
                      title="Eliminar workflow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
