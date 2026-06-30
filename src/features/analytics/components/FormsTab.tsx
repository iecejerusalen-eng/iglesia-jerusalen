import { useState } from 'react';
import { Award, Eye, ClipboardList, User, X, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils';
import type { FormResponseData } from '../types';
import { getCleanBlockName } from '../utils';

interface FormsTabProps {
  responses: FormResponseData[];
}

export function FormsTab({ responses }: FormsTabProps) {
  const [selectedResponse, setSelectedResponse] = useState<FormResponseData | null>(null);

  const exportExcel = () => {
    if (responses.length === 0) {
      toast.error('No hay respuestas para exportar.');
      return;
    }
    const data = responses.map(r => ({
      Usuario: r.member_name || 'Anónimo',
      Correo: r.member_email || 'Sin correo',
      Cuestionario: getCleanBlockName(r.block_id),
      Calificacion: r.score !== null ? `${r.score}/${r.max_score}` : 'Form Libre',
      Fecha: new Date(r.created_at).toLocaleDateString('es-ES')
    }));
    exportToExcel(data, `respuestas_formularios_${new Date().toISOString().split('T')[0]}`);
  };

  const exportPDF = () => {
    if (responses.length === 0) {
      toast.error('No hay respuestas para exportar.');
      return;
    }
    const data = responses.map(r => [
      r.member_name || 'Anónimo',
      r.member_email || 'Sin correo',
      getCleanBlockName(r.block_id),
      r.score !== null ? `${r.score}/${r.max_score}` : 'Form Libre',
      new Date(r.created_at).toLocaleDateString('es-ES')
    ]);
    exportToPDF('Respuestas a Cuestionarios', ['Usuario', 'Correo', 'Cuestionario', 'Calificación', 'Fecha'], data, `respuestas_formularios_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 overflow-hidden shadow-xs">
      <div className="p-5 border-b border-gray-150 dark:border-white/10 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-sm">Respuestas a Cuestionarios Enviadas</h3>
          <p className="text-gray-400 text-xs mt-0.5">Listado de participaciones en línea de miembros y visitantes de la iglesia.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportExcel}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download size={14} />
            Excel
          </button>
          <button
            onClick={exportPDF}
            className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileText size={14} />
            PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-950 border-b border-gray-150 dark:border-white/10 text-gray-500 dark:text-gray-450 font-semibold text-xs uppercase tracking-wider">
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Correo</th>
              <th className="px-6 py-4">Cuestionario / Bloque</th>
              <th className="px-6 py-4 text-center">Calificación</th>
              <th className="px-6 py-4">Fecha de Envío</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-650 dark:text-gray-400">
            {responses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400 font-semibold italic">
                  No se han registrado respuestas a cuestionarios en el sistema.
                </td>
              </tr>
            ) : (
              responses.map((resp) => (
                <tr key={resp.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-100">
                    {resp.member_name || 'Anónimo'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-450 font-mono text-xs">
                    {resp.member_email || 'Sin correo'}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-650 dark:text-gray-400">
                    {getCleanBlockName(resp.block_id)}
                    <span className="text-[9px] font-normal text-slate-400 block">Pág: {resp.page_id}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {resp.score !== null ? (
                      <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-0.5">
                        <Award size={12} />
                        {resp.score}/{resp.max_score}
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 dark:text-gray-450 px-2 py-0.5 rounded text-[10px] font-bold">
                        Form Libre
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(resp.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedResponse(resp)}
                      className="text-primary dark:text-church-gold-bright hover:text-blue-900 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-slate-350 transition-colors inline-flex items-center gap-1 text-[11px] font-bold uppercase cursor-pointer"
                    >
                      <Eye size={12} />
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative text-left animate-scale-in border border-slate-200 dark:border-white/10 max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedResponse(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X size={18} />
            </button>
            <div className="border-b border-gray-150 dark:border-white/10 pb-4 pr-6 flex items-center gap-3">
              <ClipboardList className="text-gold" size={24} />
              <div>
                <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-base md:text-lg">
                  Respuestas de Cuestionario
                </h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                  {getCleanBlockName(selectedResponse.block_id)} / Página: {selectedResponse.page_id}
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 custom-scrollbar">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/10 rounded-xl p-3 flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-blue-950/20 text-primary dark:text-church-gold-bright flex items-center justify-center">
                  <User size={16} />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-gray-800 dark:text-gray-100 block">{selectedResponse.member_name || 'Anónimo'}</span>
                  <span className="text-[10px] text-gray-400 block font-mono">{selectedResponse.member_email || 'Sin correo electrónico'}</span>
                </div>
              </div>
              {selectedResponse.score !== null && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex justify-between items-center text-xs">
                  <span className="text-amber-800 font-bold flex items-center gap-1.5">
                    <Award size={16} />
                    Resultado de Evaluación
                  </span>
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold">
                    {selectedResponse.score} / {selectedResponse.max_score} Puntos
                  </span>
                </div>
              )}
              <div className="space-y-4">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 pb-1">Desglose de Respuestas</span>
                {Object.entries(selectedResponse.answers).map(([qId, ans], idx) => {
                  const displayAnswer = Array.isArray(ans) ? ans.join(', ') : String(ans);
                  return (
                    <div key={qId} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-xl p-3.5 space-y-1.5">
                      <span className="font-semibold text-xs text-gray-800 dark:text-gray-100 block">
                        Pregunta {idx + 1}
                      </span>
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-white/10 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-gray-300">
                        {displayAnswer || <span className="italic text-gray-400 font-normal">Sin respuesta</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-gray-150 dark:border-white/10 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedResponse(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
