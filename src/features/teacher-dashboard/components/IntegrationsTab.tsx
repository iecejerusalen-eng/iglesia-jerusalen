import React, { useState, useEffect } from 'react';
import { Video, Save } from 'lucide-react';

interface IntegrationsTabProps {
  selectedCourseId: string;
}

export function IntegrationsTab({ selectedCourseId }: IntegrationsTabProps) {
  const [zoomLink, setZoomLink] = useState('');
  const [teamsLink, setTeamsLink] = useState('');
  const [classroomSync, setClassroomSync] = useState(false);

  useEffect(() => {
    const zoom = localStorage.getItem(`zoom_${selectedCourseId}`) || '';
    const teams = localStorage.getItem(`teams_${selectedCourseId}`) || '';
    const classroom = localStorage.getItem(`classroom_${selectedCourseId}`) === 'true';
    setZoomLink(zoom);
    setTeamsLink(teams);
    setClassroomSync(classroom);
  }, [selectedCourseId]);

  const handleSaveIntegrations = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(`zoom_${selectedCourseId}`, zoomLink);
    localStorage.setItem(`teams_${selectedCourseId}`, teamsLink);
    localStorage.setItem(`classroom_${selectedCourseId}`, classroomSync ? 'true' : 'false');
    // Using a simple alert or standard toast here (assuming parent component uses sonner)
    // For simplicity, we can just let it be silent or use the global toast
  };

  return (
    <form onSubmit={handleSaveIntegrations} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-6 shadow-sm max-w-xl text-left space-y-5">
      <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
        <Video size={18} className="text-gold" />
        Sincronización e Integración de Clases
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Enlace de Zoom (Clases en vivo)</label>
          <input
            type="url"
            value={zoomLink}
            onChange={e => setZoomLink(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
            placeholder="https://zoom.us/j/..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Enlace de Microsoft Teams</label>
          <input
            type="url"
            value={teamsLink}
            onChange={e => setTeamsLink(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
            placeholder="https://teams.microsoft.com/..."
          />
        </div>

        <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-950/30 p-4 rounded-xl border border-gray-200 dark:border-white/5">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={classroomSync}
              onChange={(e) => setClassroomSync(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-350 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold/30 dark:peer-focus:ring-gold/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
          </label>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block text-xs">Sincronización con Google Classroom</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Importa tareas, notas y alumnos de Classroom automáticamente.</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-155 dark:border-white/5 flex justify-end">
        <button
          type="submit"
          className="bg-gold hover:bg-yellow-600 text-white px-5 py-2 rounded-lg font-bold text-xs shadow transition-all hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5"
        >
          <Save size={14} /> Guardar Configuración
        </button>
      </div>
    </form>
  );
}
