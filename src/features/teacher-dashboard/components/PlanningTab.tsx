import { BookOpen, Award } from 'lucide-react';

interface PlanningTabProps {
  materials: any[];
  activities: any[];
}

export function PlanningTab({ materials, activities }: PlanningTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen size={18} className="text-gold" />
          Biblioteca de Recursos / Documentos
        </h3>
        
        <div className="space-y-3">
          {materials.length === 0 ? (
            <p className="text-xs text-gray-500 py-6">No hay documentos o recursos cargados en el temario.</p>
          ) : (
            materials.map(mat => (
              <div key={mat.id} className="p-3 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-white/5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-850 dark:text-white">{mat.title}</p>
                  <p className="text-[9px] text-gray-400">Puntaje: {mat.weighting}%</p>
                </div>
                <span className="text-[10px] text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-full font-bold">Recurso</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Award size={18} className="text-gold" />
          Evaluaciones y Cuestionarios Programados
        </h3>

        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-xs text-gray-500 py-6">No hay exámenes o cuestionarios calendarizados.</p>
          ) : (
            activities.map(act => (
              <div key={act.id} className="p-3 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-white/5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-850 dark:text-white">{act.title}</p>
                  <p className="text-[9px] text-gray-400">Tipo: <span className="capitalize">{act.type === 'assignment' ? 'Tarea' : 'Cuestionario'}</span></p>
                </div>
                <span className="text-[10px] text-gold bg-gold/15 px-2.5 py-1 rounded-full font-bold">Evaluación</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
