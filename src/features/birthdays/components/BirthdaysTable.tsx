import { Gift, MessageCircle, Sparkles } from 'lucide-react';
import { getBirthdayStatusLabel, type BirthdayInfo } from '../hooks/useBirthdays';
import { BirthdayAvatar } from './BirthdayAvatar';

interface BirthdaysTableProps {
  birthdays: BirthdayInfo[];
  onCelebrate: (name: string) => void;
  onMessage?: (birthday: BirthdayInfo) => void;
}

export function BirthdaysTable({ birthdays, onCelebrate, onMessage }: BirthdaysTableProps) {
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
              <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400">Ministerio</th>
              <th className="py-4 px-6 font-semibold text-slate-600 dark:text-slate-400">Estado</th>
              <th className="py-4 px-6 text-right font-semibold text-slate-600 dark:text-slate-400">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {birthdays.map((item) => {
              return (
                <tr 
                  key={item.member.id} 
                  className={`hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors ${
                    item.isToday ? 'bg-church-gold/5 dark:bg-church-gold/10' : ''
                  }`}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <BirthdayAvatar item={item} />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {item.member.first_name} {item.member.last_name}
                          {item.isToday && <Sparkles size={12} className="text-accent-red" />}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Información pública autorizada</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300">
                    {item.formattedDate}
                  </td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                    {item.member.ministry_name || 'Familia Jerusalén'}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2.5 py-1 font-bold text-xs rounded-full border ${item.isToday ? 'bg-accent-red/10 text-accent-red border-accent-red/20 animate-pulse' : 'bg-slate-100 text-slate-500 border-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}>
                      {getBirthdayStatusLabel(item)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
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
                        {onMessage && <button type="button" onClick={() => onMessage(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300" aria-label={`Enviar felicitación a ${item.member.first_name} ${item.member.last_name}`}><MessageCircle size={14} /></button>}
                      </div>
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
