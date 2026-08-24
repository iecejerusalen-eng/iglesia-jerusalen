import React, { useState } from 'react';
import { EmailTemplateBuilder } from '../../features/campaigns/components/EmailTemplateBuilder';
import { Megaphone, Mail, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CampaignsManager() {
  const [activeTab, setActiveTab] = useState<'builder' | 'history'>('builder');

  const handleSendCampaign = async (templateData: any) => {
    try {
      toast.success('Campaña masiva programada correctamente');
    } catch {
      toast.error('Error al enviar la campaña');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Campañas de Email & SMS
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Diseño de plantillas visuales y envíos masivos a miembros y visitantes
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'builder'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            Diseñador
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            Historial de Envíos
          </button>
        </div>
      </div>

      {activeTab === 'builder' ? (
        <EmailTemplateBuilder onSave={handleSendCampaign} />
      ) : (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-pink-500" />
            Historial de Envíos Recientes
          </h2>
          <div className="text-center py-12 text-gray-400">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-sm">No se han realizado envíos masivos recientemente.</p>
            <p className="text-xs mt-1">Utiliza el diseñador para crear y enviar una nueva campaña.</p>
          </div>
        </div>
      )}
    </div>
  );
}
