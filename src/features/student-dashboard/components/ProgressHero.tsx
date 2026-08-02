import { motion } from 'framer-motion';
import { GraduationCap, Award, BookOpen, Flame } from 'lucide-react';

interface ProgressHeroProps {
  userFullName: string;
  avatarUrl: string;
  activeCourses: number;
  pendingTasksCount: number;
  totalXp: number;
  streak: number;
  attendance: number;
  overallProgress: number; // 0-100
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
  onOpenIDCard
}: ProgressHeroProps) {
  return (
    <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-8 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl mb-8 border border-gray-100 dark:border-white/5 transition-colors">
      
      {/* Glow Effects (Sutil en light, brillante en dark) */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 dark:bg-gold/10 blur-[80px] rounded-full pointer-events-none transition-colors"></div>
      <div className="absolute bottom-0 left-10 w-48 h-48 bg-indigo-500/5 dark:bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none transition-colors"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Left Column: Welcome & Stats */}
        <div className="flex-1 w-full text-center md:text-left space-y-8 order-2 md:order-1">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 bg-gradient-to-br from-gold to-yellow-600 shadow-lg">
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
                />
              </div>
              {/* Rank Badge */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-md border border-gray-100 dark:border-white/10 flex items-center gap-1 whitespace-nowrap">
                <Award size={12} className="text-gold" />
                Estudiante
              </div>
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-serif flex items-center justify-center md:justify-start gap-3 text-slate-900 dark:text-white">
                ¡Hola, {userFullName}!
                <motion.div 
                  animate={{ rotate: [0, 15, -10, 0] }} 
                  transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                >
                  <GraduationCap className="text-gold drop-shadow-sm" size={32} />
                </motion.div>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Sigue aprendiendo y creciendo espiritualmente.</p>
              
              {onOpenIDCard && (
                <button 
                  onClick={onOpenIDCard}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-slate-700 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl transition-all font-bold text-sm"
                >
                  <Award size={16} className="text-gold" /> Ver Mi Carnet Estudiantil
                </button>
              )}
            </div>
          </div>

          {/* KPI Mini-cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-indigo-500/30 transition-colors">
              <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 mb-2">
                <BookOpen size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Activos</span>
              </div>
              <p className="text-2xl font-bold font-serif text-slate-800 dark:text-white">{activeCourses}</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-rose-500/30 transition-colors">
              <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400 mb-2">
                <BookOpen size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Pendientes</span>
              </div>
              <p className="text-2xl font-bold font-serif text-slate-800 dark:text-white">{pendingTasksCount}</p>
            </div>

            <div className="bg-gold/5 dark:bg-gold/10 rounded-2xl p-4 border border-gold/20 hover:border-gold/40 transition-colors relative overflow-hidden group">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
                <StarIcon />
                <span className="text-[10px] font-bold uppercase tracking-wider">XP Total</span>
              </div>
              <p className="text-2xl font-bold font-serif text-slate-800 dark:text-white">{totalXp.toLocaleString()}</p>
            </div>

            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center gap-2 text-cyan-500 dark:text-cyan-400 mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span className="text-[10px] font-bold uppercase tracking-wider">Asistencia</span>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold font-serif text-slate-800 dark:text-white">{attendance}</p>
                <span className="text-xs text-slate-400">%</span>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-500/10 rounded-2xl p-4 border border-orange-200 dark:border-orange-500/20 hover:border-orange-500/40 transition-colors">
              <div className="flex items-center gap-2 text-orange-500 dark:text-orange-400 mb-2">
                <Flame size={14} className="animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Racha</span>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold font-serif text-slate-800 dark:text-white">{streak}</p>
                <span className="text-xs text-slate-400">días</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Progress Ring */}
        <div className="relative group shrink-0 order-1 md:order-2 flex flex-col items-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="72"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-100 dark:text-white/5 transition-colors"
              />
              <circle
                cx="80"
                cy="80"
                r="72"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={452.4}
                strokeDashoffset={452.4 - (452.4 * overallProgress) / 100}
                className="text-gold drop-shadow-[0_0_8px_rgba(250,204,21,0.4)] transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black font-serif text-slate-800 dark:text-white">
                {Math.round(overallProgress)}%
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Completado
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
