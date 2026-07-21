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
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 relative overflow-hidden shadow-2xl mb-8 border border-white/10">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
      
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-48 h-48 bg-indigo-500/20 blur-[80px] rounded-full mix-blend-screen pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Avatar & Progress Ring */}
        <div className="relative group shrink-0">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-white/10"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={364.4}
              strokeDashoffset={364.4 - (364.4 * overallProgress) / 100}
              className="text-gold drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className="w-full h-full rounded-full object-cover border-4 border-slate-900 shadow-inner"
            />
          </div>
          {/* Rank Badge */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold to-yellow-600 text-slate-900 font-bold text-xs px-3 py-1 rounded-full shadow-lg border border-yellow-200/50 flex items-center gap-1">
            <Award size={12} />
            Estudiante
          </div>
        </div>

        {/* Welcome & Stats */}
        <div className="flex-1 w-full text-center md:text-left space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-serif flex items-center justify-center md:justify-start gap-3">
              ¡Hola, {userFullName}!
              <motion.div 
                animate={{ rotate: [0, 15, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
              >
                <GraduationCap className="text-gold drop-shadow-md" size={32} />
              </motion.div>
            </h1>
            <p className="text-indigo-200 mt-2 text-lg opacity-90">Sigue aprendiendo y creciendo espiritualmente.</p>
            
            {onOpenIDCard && (
              <button 
                onClick={onOpenIDCard}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 hover:border-gold/50 rounded-xl transition-all shadow-sm shadow-gold/10 font-bold text-sm uppercase tracking-wider"
              >
                <Award size={16} /> Ver Mi Carnet Estudiantil
              </button>
            )}
          </div>

          {/* KPI Mini-cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 text-indigo-300 mb-1">
                <BookOpen size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Activos</span>
              </div>
              <p className="text-2xl font-bold font-serif">{activeCourses}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 text-rose-400 mb-1">
                <BookOpen size={14} />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Pendientes</span>
              </div>
              <p className="text-2xl font-bold font-serif text-white">{pendingTasksCount}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-colors relative overflow-hidden group">
              <div className="absolute inset-0 bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center gap-2 text-yellow-400 mb-1">
                <StarIcon />
                <span className="text-xs font-bold uppercase tracking-wider text-gold">XP Total</span>
              </div>
              <p className="text-2xl font-bold font-serif text-white">{totalXp.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 text-cyan-400 mb-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Asistencia</span>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold font-serif text-white">{attendance}</p>
                <span className="text-xs text-cyan-200">%</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-md rounded-xl p-3 border border-orange-500/30 hover:border-orange-500/50 transition-colors shadow-[0_0_15px_rgba(249,115,22,0.15)] relative">
              <div className="flex items-center gap-2 text-orange-400 mb-1">
                <Flame size={14} className="animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Racha</span>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold font-serif text-orange-50">{streak}</p>
                <span className="text-xs text-orange-200">días</span>
              </div>
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
