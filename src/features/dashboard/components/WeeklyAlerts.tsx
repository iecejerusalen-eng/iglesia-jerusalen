import { Gift, Sparkles } from 'lucide-react';
import type { WeeklyAlert } from '../types';

interface WeeklyAlertsProps {
  alerts: WeeklyAlert[];
}

export const WeeklyAlerts = ({ alerts }: WeeklyAlertsProps) => {
  return (
    <section className="space-y-4 rounded-[1.6rem] border border-white/70 bg-white/70 p-5 shadow-[0_24px_70px_-44px_rgba(15,23,42,.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/65">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 pb-3 dark:border-white/10">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
            <Gift size={17} className="text-amber-500" /> Próximos 7 días
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Cumpleaños y aniversarios de fe para acompañar.</p>
        </div>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">{alerts.length}</span>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-3 rounded-xl border flex gap-3 items-start transition-all duration-300 hover:-translate-y-0.5 ${
                alert.type === 'birthday' 
                  ? 'bg-amber-50/40 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/50 hover:bg-amber-50/70 dark:hover:bg-amber-900/40' 
                  : 'bg-green-50/40 dark:bg-green-900/20 border-green-100 dark:border-green-900/50 hover:bg-green-50/70 dark:hover:bg-green-900/40'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {alert.type === 'birthday' ? (
                  <Gift className="text-gold" size={16} />
                ) : (
                  <Sparkles className="text-green-600 animate-pulse" size={16} />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1 text-left">
                <span className="font-bold text-xs text-gray-800 dark:text-gray-100 block leading-tight">{alert.name}</span>
                <span className="text-[10px] font-bold text-gray-400 block">
                  {alert.type === 'birthday' ? `Cumpleaños: ${alert.dateLabel}` : `Conversión: ${alert.dateLabel} (${alert.years})`}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-xs text-gray-400 dark:text-gray-500 font-semibold bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
            No hay celebraciones registradas para los próximos siete días.
          </div>
        )}
      </div>
    </section>
  );
};
