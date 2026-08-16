import { CalendarHeart, CakeSlice, Gift, ShieldCheck, Sparkles } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import type { BirthdayInfo } from '../hooks/useBirthdays';

interface BirthdaysHeroProps {
  todayCount: number;
  weekCount: number;
  monthCount: number;
  totalCount: number;
  nextBirthday?: BirthdayInfo;
}

const Metric = ({ value, label }: { value: number; label: string }) => (
  <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-xl">
    <strong className="block text-2xl font-bold text-white">{value}</strong>
    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">{label}</span>
  </div>
);

export function BirthdaysHero({ todayCount, weekCount, monthCount, totalCount, nextBirthday }: BirthdaysHeroProps) {
  const nextBirthdayName = nextBirthday ? `${nextBirthday.member.first_name} ${nextBirthday.member.last_name}` : null;

  return (
    <AnimeFadeUp delay={0.05} duration={500} distance={18}>
      <section className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-primary px-6 py-8 shadow-[0_30px_80px_-35px_rgba(15,23,42,0.8)] md:px-10 md:py-12">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-church-gold/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative grid items-end gap-8 lg:grid-cols-[1.35fr_0.9fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-church-gold/30 bg-church-gold/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-church-gold-light">
              <Sparkles size={14} /> Comunidad que celebra
            </div>
            <h1 className="max-w-3xl font-serif text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl">
              Cada vida es un regalo que celebramos juntos.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              Acompañamos con alegría a nuestra familia de la Iglesia Jerusalén. Los datos provienen del CRM y solo aparecen cuando cada miembro ha autorizado su publicación.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-medium text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2"><ShieldCheck size={15} className="text-church-gold-light" /> Privacidad por consentimiento</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2"><CalendarHeart size={15} className="text-church-gold-light" /> Información sincronizada</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-2 -top-7 hidden rotate-6 rounded-2xl border border-church-gold/30 bg-church-gold/15 p-3 text-church-gold-light shadow-xl backdrop-blur-xl sm:block">
              <Gift size={28} />
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/15 bg-white/[0.08] p-3 backdrop-blur-2xl">
              <Metric value={todayCount} label="Hoy" />
              <Metric value={weekCount} label="Próximos 7 días" />
              <Metric value={monthCount} label="Este mes" />
              <Metric value={totalCount} label="Calendario público" />
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
              <CakeSlice size={14} className="text-church-gold-light" /> Actualizado desde el CRM de la iglesia
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-center backdrop-blur-xl">
              <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Próximo cumpleaños</span>
              <span className="mt-1 block truncate text-sm font-bold text-white">
                {nextBirthday ? `${nextBirthdayName} · ${nextBirthday.formattedDate}` : 'Aún no hay registros públicos'}
              </span>
            </div>
          </div>
        </div>
      </section>
    </AnimeFadeUp>
  );
}
