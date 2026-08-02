import { motion } from 'framer-motion';
import { Award, BookOpen, ClipboardList, Flame, GraduationCap, UserCheck, Zap } from 'lucide-react';

interface ProgressHeroProps {
  userFullName: string;
  avatarUrl: string;
  activeCourses: number;
  pendingTasksCount: number;
  totalXp: number;
  streak: number;
  attendance: number;
  overallProgress: number;
  onOpenIDCard?: () => void;
}

export function ProgressHero({
  userFullName,
  avatarUrl,
  activeCourses,
  pendingTasksCount,
  totalXp,
  streak,
  attendance,
  overallProgress,
  onOpenIDCard,
}: ProgressHeroProps) {
  const safeProgress = Math.min(100, Math.max(0, overallProgress));
  const metrics = [
    { label: 'Cursos', value: activeCourses.toString(), icon: BookOpen, color: 'text-indigo-200' },
    { label: 'Pendientes', value: pendingTasksCount.toString(), icon: ClipboardList, color: 'text-rose-300' },
    { label: 'XP total', value: totalXp.toLocaleString(), icon: Zap, color: 'text-yellow-300' },
    { label: 'Asistencia', value: `${attendance}%`, icon: UserCheck, color: 'text-cyan-300' },
    { label: 'Racha', value: `${streak} días`, icon: Flame, color: 'text-orange-300' },
  ];

  return (
    <section className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-[#101d40] via-[#162754] to-[#253d78] p-5 text-white shadow-xl shadow-indigo-950/15 sm:p-7 lg:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-gold/15 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-32 left-10 size-72 rounded-full bg-indigo-400/15 blur-[90px]" />

      <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:gap-10">
        <div className="order-2 w-full flex-1 space-y-6 lg:order-1">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="size-16 rounded-2xl bg-gradient-to-br from-gold to-yellow-600 p-0.5 shadow-lg sm:size-20">
                <img src={avatarUrl} alt={`Perfil de ${userFullName}`} className="h-full w-full rounded-[.9rem] border-2 border-[#14244d] object-cover" />
              </div>
              <span className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-white/10 bg-slate-950/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-md backdrop-blur">
                <Award size={10} className="text-gold" /> Estudiante
              </span>
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-200">Tu espacio de aprendizaje</p>
              <h1 className="mt-1 flex items-center gap-2 font-serif text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                <span className="truncate">Hola, {userFullName}</span>
                <motion.span animate={{ rotate: [0, 12, -8, 0] }} transition={{ repeat: Infinity, duration: 2, repeatDelay: 4 }} className="shrink-0">
                  <GraduationCap className="text-gold" size={27} />
                </motion.span>
              </h1>
              <p className="mt-1 text-sm text-slate-300 sm:text-base">Retoma tu formación y completa tu próxima meta.</p>
              {onOpenIDCard && (
                <button type="button" onClick={onOpenIDCard} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/15">
                  <Award size={15} className="text-gold" /> Ver carnet estudiantil
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-5 sm:grid-cols-5 sm:gap-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/7 p-3 sm:p-4">
                <div className={`mb-2 flex items-center gap-2 ${metric.color}`}>
                  <metric.icon size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-wider sm:text-[10px]">{metric.label}</span>
                </div>
                <p className="font-serif text-xl font-bold text-white sm:text-2xl">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 flex shrink-0 flex-col items-center self-center lg:order-2">
          <div className="relative size-32 sm:size-40">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={439.82}
                strokeDashoffset={439.82 - (439.82 * safeProgress) / 100}
                className="text-gold transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-3xl font-black text-white sm:text-4xl">{Math.round(safeProgress)}%</span>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:text-[10px]">Progreso general</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
