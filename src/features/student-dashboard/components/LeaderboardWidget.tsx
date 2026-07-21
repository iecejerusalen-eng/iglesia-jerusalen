import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star } from 'lucide-react';
import { supabase } from '../../../config/supabase';

interface LeaderboardEntry {
  student_id: string;
  xp_total: number;
  level: number;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

export function LeaderboardWidget() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const { data, error } = await supabase
          .from('lms_student_stats')
          .select(`
            student_id,
            xp_total,
            level,
            profiles (
              first_name,
              last_name,
              avatar_url
            )
          `)
          .order('xp_total', { ascending: false })
          .limit(5);

        if (error) throw error;
        
        // Ensure proper typing for joined profiles
        const formattedData = (data || []).map(entry => ({
          ...entry,
          profiles: Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles
        })) as unknown as LeaderboardEntry[];

        setLeaders(formattedData);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-150 dark:border-white/10 shadow-sm h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-150 dark:border-white/10 shadow-sm relative overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="font-bold font-serif text-lg flex items-center gap-2">
          <Trophy size={20} className="text-gold" />
          Top Estudiantes
        </h3>
        <span className="text-xs font-medium bg-gold/10 text-gold px-2 py-1 rounded-full">
          Global
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar relative z-10">
        {leaders.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Aún no hay estudiantes en el ranking.</p>
        ) : (
          leaders.map((student, index) => (
            <motion.div 
              key={student.student_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${
                index === 0 ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20' : 
                index === 1 ? 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700' :
                index === 2 ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/30' :
                'hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="font-bold text-lg w-6 text-center text-gray-400">
                {index === 0 ? <Medal size={24} className="text-amber-500 drop-shadow-md mx-auto" /> : 
                 index === 1 ? <Medal size={22} className="text-slate-400 mx-auto" /> :
                 index === 2 ? <Medal size={20} className="text-orange-400 mx-auto" /> : 
                 index + 1}
              </div>
              
              <div className="relative">
                <img 
                  src={student.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.student_id}`}
                  alt={student.profiles?.first_name}
                  className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 object-cover bg-gray-100"
                />
                {index === 0 && (
                  <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white rounded-full p-0.5 shadow-sm">
                    <Star size={10} className="fill-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                  {student.profiles?.first_name} {student.profiles?.last_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                  Nivel {student.level}
                </p>
              </div>
              
              <div className="text-right font-black font-serif text-gold">
                {student.xp_total.toLocaleString()} XP
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
