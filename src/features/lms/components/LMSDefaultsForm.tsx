import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function LMSDefaultsForm() {
  const [defaultFormat, setDefaultFormat] = useState('weekly');
  const [defaultScale, setDefaultScale] = useState('10/10');
  const [passingGrade, setPassingGrade] = useState('7');

  useEffect(() => {
    const savedFormat = localStorage.getItem('lms_default_format') || 'weekly';
    const savedScale = localStorage.getItem('lms_default_scale') || '10/10';
    const savedPassing = localStorage.getItem('lms_default_passing') || '7';
    setDefaultFormat(savedFormat);
    setDefaultScale(savedScale);
    setPassingGrade(savedPassing);
  }, []);

  const handleSaveDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('lms_default_format', defaultFormat);
    localStorage.setItem('lms_default_scale', defaultScale);
    localStorage.setItem('lms_default_passing', passingGrade);
    toast.success('Configuración predeterminada del entorno guardada');
  };

  return (
    <form onSubmit={handleSaveDefaults} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm max-w-xl text-left space-y-5">
      <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
        <AlertCircle size={18} className="text-gold" />
        Formatos por Defecto del Entorno
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Formato de Aula Predeterminado</label>
          <select
            value={defaultFormat}
            onChange={e => setDefaultFormat(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
          >
            <option value="weekly">Semanal (Planificación cronológica)</option>
            <option value="topics">Por Temas (PACIE modular por bloques)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Sistema de Evaluación Global</label>
          <select
            value={defaultScale}
            onChange={e => setDefaultScale(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
          >
            <option value="10/10">Escala de 0 a 10 puntos</option>
            <option value="letters">Criterio cualitativo por Letras (A-F)</option>
            <option value="pass_fail">Binario Aprobado/Reprobado</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Nota Mínima de Aprobación</label>
          <input
            type="text"
            value={passingGrade}
            onChange={e => setPassingGrade(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:border-gold text-xs"
            placeholder="Ej. 7 o A"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-150 dark:border-white/5 flex justify-end">
        <button
          type="submit"
          className="bg-gold hover:bg-yellow-600 text-white px-5 py-2 rounded-lg font-bold text-xs shadow transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          Guardar Valores
        </button>
      </div>
    </form>
  );
}
