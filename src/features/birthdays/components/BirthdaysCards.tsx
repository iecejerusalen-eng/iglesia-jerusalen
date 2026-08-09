import { CalendarHeart, Gift, Sparkles } from 'lucide-react';
import { AnimeStaggerGrid } from '../../../components/animations/AnimeWrappers';
import type { BirthdayInfo } from '../hooks/useBirthdays';

interface BirthdaysCardsProps { birthdays: BirthdayInfo[]; onCelebrate: (name: string) => void; }

const statusLabel = (item: BirthdayInfo) => item.isToday ? '¡Es hoy!' : item.daysRemaining === 1 ? 'Mañana' : `En ${item.daysRemaining} días`;

export function BirthdaysCards({ birthdays, onCelebrate }: BirthdaysCardsProps) {
  if (birthdays.length === 0) {
    return (
      <div className="rounded-[2rem] border border-white/70 bg-white/65 px-6 py-16 text-center shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60">
        <CalendarHeart className="mx-auto mb-4 text-church-gold-medium" size={42} />
        <h3 className="font-serif text-xl font-bold text-slate-700 dark:text-white">No hay cumpleaños en esta selección</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Prueba otro periodo o elimina la búsqueda. Solo aparecen miembros con autorización pública activa.</p>
      </div>
    );
  }

  return (
    <AnimeStaggerGrid className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {birthdays.map((item) => {
        const fullName = `${item.member.first_name} ${item.member.last_name}`;
        const initials = `${item.member.first_name[0] ?? ''}${item.member.last_name[0] ?? ''}`.toUpperCase();
        return (
          <article key={item.member.id} className={`group relative overflow-hidden rounded-[1.75rem] border bg-white/75 p-5 shadow-[0_18px_55px_-38px_rgba(15,23,42,0.5)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900/70 ${item.isToday ? 'border-church-gold/60 ring-1 ring-church-gold/20' : 'border-white/80 hover:border-church-gold/35 dark:border-white/10'}`}>
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-primary/10 via-church-gold/10 to-transparent" />
            <div className="relative flex items-start justify-between gap-3">
              <div className={`h-20 w-20 overflow-hidden rounded-2xl border-2 shadow-lg ${item.isToday ? 'border-church-gold-medium' : 'border-white dark:border-slate-700'}`}>
                {item.member.photo_url ? <img loading="lazy" src={item.member.photo_url} alt={`Foto de ${fullName}`} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-primary text-xl font-bold text-white">{initials}</div>}
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${item.isToday ? 'bg-accent-red text-white' : 'bg-primary/8 text-primary dark:bg-white/10 dark:text-slate-200'}`}>
                {item.isToday && <Sparkles size={11} />}{statusLabel(item)}
              </span>
            </div>

            <div className="relative mt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-church-gold-dark dark:text-church-gold-light">{item.formattedDate}</p>
              <h3 className="mt-1 font-serif text-xl font-bold text-slate-900 dark:text-white">{fullName}</h3>
              <p className="mt-1 min-h-5 text-xs text-slate-500 dark:text-slate-400">{item.member.ministry_name || 'Familia Jerusalén'}</p>
            </div>

            {item.member.dedicated_verse && <blockquote className="mt-4 line-clamp-2 border-l-2 border-church-gold/50 pl-3 text-xs italic leading-5 text-slate-500 dark:text-slate-400">“{item.member.dedicated_verse}”</blockquote>}

            <button type="button" onClick={() => onCelebrate(fullName)} className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold transition ${item.isToday ? 'bg-primary text-white shadow-lg shadow-primary/15 hover:bg-primary-dark' : 'bg-slate-100 text-slate-700 hover:bg-church-gold/15 hover:text-church-gold-dark dark:bg-slate-800 dark:text-slate-200'}`}>
              <Gift size={16} /> Celebrar su vida
            </button>
          </article>
        );
      })}
    </AnimeStaggerGrid>
  );
}
