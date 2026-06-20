import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { AnimeFadeUp, AnimeZoomIn, AnimePulseHover } from '../../components/animations/AnimeWrappers';
import { toast } from 'sonner';
import {
  GraduationCap, Award, Lock, RefreshCw, Gamepad2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import type { Badge } from '../../types';

const SundaySchool = () => {
  const { user } = useAuthStore();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0); // to reload iframe

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('created_at', { ascending: true });

      if (badgesError) throw badgesError;
      setBadges(badgesData || []);

      // Fetch unlocked badges for user
      if (user) {
        const { data: unlockedData, error: unlockedError } = await supabase
          .from('user_badges')
          .select('badge_id')
          .eq('user_id', user.id);

        if (unlockedError) throw unlockedError;
        setUnlockedBadgeIds(unlockedData ? unlockedData.map((ub: any) => ub.badge_id) : []);
      } else {
        setUnlockedBadgeIds([]);
      }
    } catch (err) {
      console.error('Error fetching Sunday School data:', err);
      toast.error('Error al cargar insignias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Listen for WebGL build message
  useEffect(() => {
    const handleGameMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'GAME_COMPLETE') {
        const badgeName = event.data.badgeName || 'Campeón Dominical';
        
        if (!user) {
          toast.warning('¡Lección completada! Inicia sesión para guardar tu progreso e insignia.', {
            duration: 5000,
          });
          return;
        }

        try {
          // Find the badge ID dynamically by name
          const { data: badgeData, error: badgeFindError } = await supabase
            .from('badges')
            .select('id')
            .eq('name', badgeName)
            .single();

          if (badgeFindError || !badgeData) {
            console.error('Badge not found in DB:', badgeName);
            return;
          }

          // Check if already unlocked
          if (unlockedBadgeIds.includes(badgeData.id)) {
            toast.info('Ya tienes esta insignia desbloqueada.');
            return;
          }

          // Call Edge Function to safely award badge
          const { data, error: functionError } = await supabase.functions.invoke('gamify', {
            body: {
              action: 'complete_sunday_school',
              badgeName: badgeName,
            },
          });

          if (functionError) throw functionError;

          if (data?.newlyUnlocked) {
            toast.success(`🎉 ¡Felicidades! Has desbloqueado la insignia: ${badgeName}`, {
              duration: 6000,
            });
          } else {
            toast.info('Ya tienes esta insignia desbloqueada.');
          }
          
          // Refresh unlocked list
          fetchData();
        } catch (err) {
          console.error('Error unlocking badge:', err);
          toast.error('No se pudo guardar tu insignia.');
        }
      }
    };

    window.addEventListener('message', handleGameMessage);
    return () => window.removeEventListener('message', handleGameMessage);
  }, [user, unlockedBadgeIds]);

  const reloadGame = () => {
    setKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/20 to-white dark:from-slate-950 dark:to-slate-950 py-12 px-4">
      <AnimeFadeUp delay={100} duration={800} className="max-w-6xl mx-auto space-y-10">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-yellow-900 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
            <GraduationCap size={220} />
          </div>
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              Discipulado Interactivo
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mt-2">Escuela Dominical Virtual</h1>
            <p className="text-amber-100 text-base md:text-lg leading-relaxed font-light">
              ¡Aprende la palabra de Dios jugando! Resuelve trivias, completa desafíos y haz un seguimiento de tus logros. Desbloquea insignias que reflejan tu crecimiento espiritual.
            </p>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* WebGL Game Simulator Panel */}
          <div className="lg:col-span-2 space-y-4">
            <AnimeZoomIn delay={200} duration={600}>
              <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2 text-amber-400">
                  <Gamepad2 size={20} />
                  <span className="font-semibold text-sm tracking-wider uppercase">Simulador WebGL</span>
                </div>
                <button
                  onClick={reloadGame}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors"
                >
                  <RefreshCw size={12} />
                  Reiniciar
                </button>
              </div>

              {/* Game Viewport Container */}
              <div className="relative aspect-video w-full bg-slate-950">
                <iframe
                  key={key}
                  src="/webgl-mock/index.html"
                  className="w-full h-full border-none"
                  title="WebGL Biblical Game"
                />
              </div>
            </div>
            </AnimeZoomIn>
            
            <p className="text-xs text-gray-400 text-center italic">
              * Completa el minijuego de trivia arriba para reclamar la insignia de Escuela Dominical automáticamente.
            </p>
          </div>

          {/* Badges sidebar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-4">
              <Award className="text-amber-600 dark:text-amber-500" size={24} />
              <h2 className="text-xl font-serif font-bold text-gray-800 dark:text-white">Tus Logros e Insignias</h2>
            </div>

            {!user && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 flex gap-3 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="shrink-0" size={20} />
                <div className="text-xs space-y-1">
                  <span className="font-bold">Modo Invitado</span>
                  <p>Inicia sesión con tu cuenta para desbloquear insignias y guardar tu progreso de Escuela Dominical.</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-10">
                <RefreshCw className="animate-spin text-amber-600" size={24} />
              </div>
            ) : (
              <div className="space-y-4">
                {badges.map((badge) => {
                  const isUnlocked = unlockedBadgeIds.includes(badge.id);
                  return (
                    <AnimePulseHover key={badge.id}>
                      <div
                        className={`flex gap-4 p-4 rounded-xl border transition-all ${
                          isUnlocked
                            ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40 shadow-xs'
                            : 'bg-gray-50 border-gray-150 dark:bg-slate-800/50 dark:border-white/10 opacity-70'
                        }`}
                      >
                      <div className="relative shrink-0">
                        <img
                          src={badge.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c'}
                          alt={badge.name}
                          className={`w-14 h-14 rounded-xl object-cover border-2 shadow-xs ${
                            isUnlocked ? 'border-amber-400 grayscale-0' : 'border-gray-300 dark:border-slate-700 grayscale'
                          }`}
                        />
                        <div className="absolute -bottom-1 -right-1">
                          {isUnlocked ? (
                            <div className="bg-green-600 text-white rounded-full p-0.5 border border-white dark:border-slate-900">
                              <ShieldCheck size={14} />
                            </div>
                          ) : (
                            <div className="bg-gray-400 text-white rounded-full p-0.5 border border-white dark:border-slate-900">
                              <Lock size={14} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-1.5">
                          {badge.name}
                          {isUnlocked && (
                            <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold px-1.5 py-0.5 rounded-full uppercase">
                              Ganado
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">{badge.description}</p>
                      </div>
                    </div>
                    </AnimePulseHover>
                  );
                })}

                {badges.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">No hay insignias creadas todavía.</p>
                )}
              </div>
            )}
          </div>

        </div>

      </AnimeFadeUp>
    </div>
  );
};

export default SundaySchool;
