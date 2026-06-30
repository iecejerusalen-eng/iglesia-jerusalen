import { Check, Ban } from 'lucide-react';
import { useEnrollmentRequests } from '../hooks/useEnrollmentRequests';

export function EnrollmentRequestsList() {
  const { requests, processRequest } = useEnrollmentRequests();

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-white/10">
              <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Alumno</th>
              <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Curso Solicitado</th>
              <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Notas de Solicitud</th>
              <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300">Fecha</th>
              <th className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300 text-right">Aprobación</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No hay solicitudes de matrícula pendientes.</td>
              </tr>
            ) : (
              requests.map(req => (
                <tr key={req.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-sm text-slate-850 dark:text-white">
                      {req.profiles ? `${req.profiles.first_name} ${req.profiles.last_name}` : 'Estudiante'}
                    </p>
                    <p className="text-[10px] text-gray-400">{req.profiles?.email}</p>
                  </td>
                  <td className="p-4 font-semibold text-xs text-gray-700 dark:text-gray-300">
                    {req.lms_courses?.title}
                  </td>
                  <td className="p-4 text-xs italic text-gray-500 dark:text-gray-400">
                    "{req.notes || 'Ninguna'}"
                  </td>
                  <td className="p-4 text-[10px] text-gray-450">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => processRequest.mutate({ request: req, approve: true })} 
                        className="p-1.5 bg-green-500/10 hover:bg-green-500 text-green-600 hover:text-white rounded-lg transition-all cursor-pointer"
                        title="Aprobar Inscripción"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={() => processRequest.mutate({ request: req, approve: false })} 
                        className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                        title="Rechazar Inscripción"
                      >
                        <Ban size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
