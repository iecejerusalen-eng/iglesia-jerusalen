import { motion } from 'framer-motion';
import { Zap, Flame, Trophy } from 'lucide-react';

interface XPBarWidgetProps {
  xp: number;
  level: number;
  streak: number;
}

export function XPBarWidget({ xp, level, streak }: XPBarWidgetProps) {
  // Calculate level thresholds (formula: level = floor(sqrt(xp/100)) + 1)
  // Reversing formula to get XP for current level and next level:
  // xp = (level - 1)^2 * 100
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const nextLevelXp = Math.pow(level, 2) * 100;
  
  const xpInLevel = xp - currentLevelXp;
  const xpNeededForLevel = nextLevelXp - currentLevelXp;
  const progressPercentage = Math.min(100, Math.max(0, (xpInLevel / xpNeededForLevel) * 100));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-150 dark:border-white/10 shadow-sm relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-gold/10 dark:bg-gold/5 rounded-full blur-3xl group-hover:bg-gold/20 transition-all duration-500" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Trophy size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tu Nivel</h3>
            <p className="text-2xl font-black font-serif text-slate-900 dark:text-white leading-none">
              Nivel {level}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-orange-500">
            <Flame size={18} className={streak > 2 ? 'fill-orange-500 animate-pulse' : ''} />
            <span className="font-bold">{streak} días</span>
          </div>
          <span className="text-xs text-gray-400 font-medium">Racha de estudio</span>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-white">
            <Zap size={16} className="text-gold fill-gold" />
            <span>{xp.toLocaleString()} XP</span>
          </div>
          <span className="text-xs font-bold text-gray-400">
            {nextLevelXp.toLocaleString()} XP
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-4 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-amber-400 to-gold rounded-full relative"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </motion.div>
        </div>
        
        <p className="text-xs text-center text-gray-500 mt-3 font-medium">
          Faltan <span className="text-gold font-bold">{(nextLevelXp - xp).toLocaleString()} XP</span> para el Nivel {level + 1}
        </p>
      </div>
    </div>
  );
}
