import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { Trophy, Medal, Star, Award } from 'lucide-react';

interface LeaderboardEntry {
  id: string; // student profile id
  first_name: string | null;
  last_name: string | null;
  avatar_url: string;
  xp_points: number;
  rank: number;
  badges: unknown[];
}

interface RawLeaderboardData {
  user_id: string;
  xp_points: number;
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string;
  };
}

export function Leaderboard({ courseId }: { courseId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lms_enrollments')
          .select(`
            user_id,
            xp_points,
            profiles:user_id (id, first_name, last_name, avatar_url)
          `)
          .eq('course_id', courseId)
          .eq('role', 'student')
          .order('xp_points', { ascending: false })
          .limit(10);

        if (error) throw error;

        if (data) {
          // Formatear y añadir rank
          const formatted: LeaderboardEntry[] = (data as unknown as RawLeaderboardData[]).map((d, index) => ({
            id: d.profiles.id,
            first_name: d.profiles.first_name,
            last_name: d.profiles.last_name,
            avatar_url: d.profiles.avatar_url,
            xp_points: d.xp_points || 0,
            rank: index + 1,
            badges: [] // Optionally fetch badges if needed
          }));
          setEntries(formatted);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchLeaderboard();
    }
  }, [courseId]);

  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1: return <Trophy className="text-yellow-400" size={24} />;
      case 2: return <Medal className="text-gray-400" size={24} />;
      case 3: return <Medal className="text-amber-600" size={24} />;
      default: return <span className="font-bold text-gray-400 w-6 text-center">{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Trophy size={18} className="text-gold" /> Ranking del Curso
        </h3>
        <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-full font-bold">
          Top 10
        </span>
      </div>
      
      <div className="divide-y divide-gray-100 dark:divide-white/5">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Award size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">No hay puntajes aún. ¡Sé el primero en ganar XP!</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div 
              key={entry.id} 
              className={`p-4 flex items-center justify-between transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50 ${entry.rank <= 3 ? 'bg-amber-50/10 dark:bg-amber-900/5' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                  <img 
                    src={entry.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.id}`} 
                    alt={`${entry.first_name || ''} ${entry.last_name || ''}`} 
                    className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{entry.first_name} {entry.last_name}</h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Star size={10} className="text-gold" /> Nivel {(Math.floor(entry.xp_points / 100) + 1)}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-600">
                  {entry.xp_points}
                </span>
                <span className="text-[10px] text-gray-400 font-bold ml-1">XP</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
