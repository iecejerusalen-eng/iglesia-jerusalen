import { Sparkles, Gift } from 'lucide-react';
import type { BirthdayInfo } from '../hooks/useBirthdays';

interface BirthdaysTableProps {
  birthdays: BirthdayInfo[];
  onCelebrate: (name: string) => void;
}

export function BirthdaysTable({ birthdays, onCelebrate }: BirthdaysTableProps) {
  if (birthdays.length === 0) {
    return (
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-3xl p-12 text-center shadow-sm">
        <Gift className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
        <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400">No hay cumpleaños en esta vista</h3>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200/80 dark:border-white/10">
            <tr>
              <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400">Nombre</th>
              <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400">Fecha</th>
              <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400">Edad</th>
              <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400">Estado</th>
              <th className="py-4 px-6 text-right font-semibold text-slate-600 dark:text-slate-400">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {birthdays.map((item) => {
              const initials = `${item.member.first_name[0]}${item.member.last_name[0]}`.toUpperCase();
              
              return (
                <tr 
                  key={item.member.id} 
                  className={`hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors ${
                    item.isToday ? 'bg-church-gold/5 dark:bg-church-gold/10' : ''
                  }`}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        item.isToday 
                          ? 'bg-church-gold/20 text-church-gold-dark dark:text-church-gold-bright border border-church-gold/50' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-transparent dark:text-slate-300'
                      } overflow-hidden`}>
                        {item.member.photo_url ? (
                          <img loading="lazy" src={item.member.photo_url} alt={item.member.first_name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {item.member.first_name} {item.member.last_name}
                          {item.isToday && <Sparkles size={12} className="text-accent-red" />}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {item.member.phone || 'Sin teléfono'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300">
                    {item.formattedDate}
                  </td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                    {item.age} años
                  </td>
                  <td className="py-4 px-6">
                    {item.isToday ? (
                      <span className="inline-flex px-2.5 py-1 bg-accent-red/10 text-accent-red font-bold text-xs rounded-full border border-accent-red/20 animate-pulse">
                        ¡Es hoy!
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400 text-xs">
                        {item.daysRemaining === 1 
                          ? 'Mañana' 
                          : item.daysRemaining > 0 
                            ? `Faltan ${item.daysRemaining} días`
                            : 'Ya pasó'}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => onCelebrate(`${item.member.first_name} ${item.member.last_name}`)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                        item.isToday
                          ? 'bg-primary text-white hover:bg-primary-dark shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Gift size={14} />
                      Celebrar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
