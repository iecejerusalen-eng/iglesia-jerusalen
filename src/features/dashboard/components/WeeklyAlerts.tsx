import { Gift, Sparkles } from 'lucide-react';
import type { WeeklyAlert } from '../types';

interface WeeklyAlertsProps {
  alerts: WeeklyAlert[];
}

export const WeeklyAlerts = ({ alerts }: WeeklyAlertsProps) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-5 shadow-2xs space-y-4">
      <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-sm border-b border-gray-100 dark:border-white/10 pb-2 flex items-center gap-1.5">
        <Gift size={16} className="text-gold animate-bounce" />
        Alertas de la Semana
      </h3>

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
              <div className="space-y-1 text-left">
                <span className="font-bold text-xs text-gray-800 dark:text-gray-100 block leading-tight">{alert.name}</span>
                <span className="text-[10px] font-bold text-gray-400 block">
                  {alert.type === 'birthday' ? `Cumpleaños: ${alert.dateLabel}` : `Conversión: ${alert.dateLabel} (${alert.years})`}
                </span>
                <p className="text-[9px] text-gray-500 dark:text-gray-400 italic font-semibold pt-1 border-t border-gray-100/50 mt-1">
                  {alert.verse}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-xs text-gray-400 dark:text-gray-500 font-semibold bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
            Sin cumpleaños o aniversarios esta semana.
          </div>
        )}
      </div>
    </div>
  );
};
