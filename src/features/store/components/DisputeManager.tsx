import { X, Loader2 } from 'lucide-react';
import type { Dispute } from '../types';

interface DisputeManagerProps {
  disputes: Dispute[];
  selectedDispute: Dispute | null;
  setSelectedDispute: React.Dispatch<React.SetStateAction<Dispute | null>>;
  resolutionText: string;
  setResolutionText: React.Dispatch<React.SetStateAction<string>>;
  onSaveResolution: () => void;
  savingDispute: boolean;
}

const DisputeManager = ({
  disputes,
  selectedDispute,
  setSelectedDispute,
  resolutionText,
  setResolutionText,
  onSaveResolution,
  savingDispute
}: DisputeManagerProps) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden animate-fade-in text-xs">
      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-gray-150 dark:border-white/10 text-gray-500">
        Panel de control de disputas, contracargos bancarios o reportes de fraude.
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-150 dark:border-white/10">
              <th className="py-4 px-6">Reclamante</th>
              <th className="py-4 px-6">Pedido Afectado</th>
              <th className="py-4 px-6">Tipo Caso</th>
              <th className="py-4 px-6">Detalle</th>
              <th className="py-4 px-6">Estado</th>
              <th className="py-4 px-6">Fecha Reporte</th>
              <th className="py-4 px-6 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium text-gray-700 dark:text-gray-300">
            {disputes.length > 0 ? (
              disputes.map(disp => (
                <tr key={disp.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6">
                    <span className="font-bold block">{disp.profiles ? `${disp.profiles.first_name} ${disp.profiles.last_name}` : 'Anónimo'}</span>
                    <span className="text-[10px] text-gray-400 block">{disp.profiles?.email}</span>
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-primary dark:text-church-gold-bright">
                    {disp.orders ? `#${disp.orders.id.slice(0, 8).toUpperCase()}` : 'No enlazado'}
                  </td>
                  <td className="py-4 px-6">
                    <span className="capitalize px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-100">
                      {disp.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-6 max-w-xs truncate" title={disp.description}>
                    {disp.description}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                      disp.status === 'resolved' 
                        ? 'bg-green-100 text-green-700' 
                        : disp.status === 'open' 
                          ? 'bg-red-100 text-red-750' 
                          : 'bg-amber-100 text-amber-700'
                    }`}>
                      {disp.status === 'resolved' ? 'Resuelto' : disp.status === 'open' ? 'Abierto' : 'Bajo Investigación'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-400 font-semibold">
                    {disp.created_at ? new Date(disp.created_at).toLocaleDateString('es-ES') : ''}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {disp.status !== 'resolved' && (
                      <button
                        onClick={() => setSelectedDispute(disp)}
                        className="text-primary hover:text-gold font-bold text-xs cursor-pointer inline-flex items-center gap-0.5"
                      >
                        Resolver
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400 italic">No hay reportes de disputas o fraudes registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-150 dark:border-white/10 animate-scale-in text-xs font-medium">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-serif font-bold text-gray-800 dark:text-white text-base">Resolver Controversia</h3>
              <button onClick={() => setSelectedDispute(null)} className="text-gray-400 p-1"><X size={18} /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-gray-150 dark:border-white/5 space-y-1.5">
                <p>Caso reportado por: <strong>{selectedDispute.profiles ? `${selectedDispute.profiles.first_name} ${selectedDispute.profiles.last_name}` : 'Anónimo'}</strong></p>
                <p>Pedido afectado: <strong>{selectedDispute.orders ? `#${selectedDispute.orders.id.slice(0,8).toUpperCase()}` : 'No enlazado'}</strong></p>
                <p>Reclamo: <span className="italic text-gray-500">"{selectedDispute.description}"</span></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Notas de la Resolución del Caso *</label>
                <textarea
                  rows={4}
                  required
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-955 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
                  placeholder="Detalla qué acciones se tomaron (reembolso directo, envío duplicado, fraude descartado)..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="px-4 py-2 border border-gray-255 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={onSaveResolution}
                  disabled={savingDispute || !resolutionText.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-bold"
                >
                  {savingDispute ? <Loader2 className="animate-spin" size={14} /> : 'Marcar como Resuelto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeManager;
