import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';

import { toast } from 'sonner';
import {
  BookOpen, Users, Award, CheckCircle, RefreshCw, ChevronRight
} from 'lucide-react';
import type { ReadingPlan as Plan } from '../../types';

const CONGREGATIONAL_GOAL = 5000; // church goal

const ReadingPlan = () => {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [checkedChapters, setCheckedChapters] = useState<number[]>([]);
  const [congregationalProgress, setCongregationalProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPlansAndProgress = async () => {
    setLoading(true);
    try {
      // Fetch reading plans
      const { data: plansData, error: plansError } = await supabase
        .from('reading_plans')
        .select('*')
        .order('created_at', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);
      
      const activePlan = plansData && plansData.length > 0 ? plansData[0] : null;
      setSelectedPlan(activePlan);

      // Fetch congregational progress (sum of all users' completed_chapters)
      const { data: progressList, error: progressError } = await supabase
        .from('user_reading_progress')
        .select('completed_chapters');
      
      if (!progressError && progressList) {
        const totalRead = progressList.reduce((acc: number, curr: any) => acc + curr.completed_chapters, 0);
        setCongregationalProgress(totalRead);
      }

      // Fetch personal progress
      if (user && activePlan) {
        const { data: personalData, error: personalError } = await supabase
          .from('user_reading_progress')
          .select('completed_chapters')
          .eq('user_id', user.id)
          .eq('plan_id', activePlan.id)
          .maybeSingle();

        if (!personalError && personalData) {
          // Recover detailed checkboxes from localStorage
          const localChecked = localStorage.getItem(`reading_plan_checked_${activePlan.id}_${user.id}`);
          if (localChecked) {
            try {
              const parsed = JSON.parse(localChecked) as number[];
              // Sync count with DB, if length mismatch, generate standard checkoff
              if (parsed.length === personalData.completed_chapters) {
                setCheckedChapters(parsed);
              } else {
                // Fallback to sequential checked items if local storage is missing or out of sync
                const fallback = Array.from({ length: personalData.completed_chapters }, (_, i) => i + 1);
                setCheckedChapters(fallback);
              }
            } catch {
              const fallback = Array.from({ length: personalData.completed_chapters }, (_, i) => i + 1);
              setCheckedChapters(fallback);
            }
          } else {
            const fallback = Array.from({ length: personalData.completed_chapters }, (_, i) => i + 1);
            setCheckedChapters(fallback);
          }
        } else {
          setCheckedChapters([]);
        }
      } else {
        setCheckedChapters([]);
      }
    } catch (err) {
      console.error('Error fetching reading plan data:', err);
      toast.error('Error al cargar plan de lectura');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansAndProgress();
  }, [user]);

  const toggleChapter = async (chapNum: number) => {
    if (!user) {
      toast.warning('Inicia sesión para registrar tu progreso de lectura en la plataforma.');
      return;
    }
    if (!selectedPlan) return;

    setSaving(true);
    let updatedChecked = [...checkedChapters];
    if (updatedChecked.includes(chapNum)) {
      updatedChecked = updatedChecked.filter(n => n !== chapNum);
    } else {
      updatedChecked.push(chapNum);
    }
    updatedChecked.sort((a, b) => a - b);

    // Save to local storage for checkbox persistence
    localStorage.setItem(`reading_plan_checked_${selectedPlan.id}_${user.id}`, JSON.stringify(updatedChecked));
    setCheckedChapters(updatedChecked);

    try {
      // Upsert user progress in Supabase
      const completedCount = updatedChecked.length;
      const { error: upsertError } = await supabase
        .from('user_reading_progress')
        .upsert({
          user_id: user.id,
          plan_id: selectedPlan.id,
          completed_chapters: completedCount,
          last_read_at: new Date().toISOString()
        }, { onConflict: 'user_id,plan_id' });

      if (upsertError) throw upsertError;

      // Update congregational progress dynamically
      const { data: progressList } = await supabase
        .from('user_reading_progress')
        .select('completed_chapters');
      if (progressList) {
        const totalRead = progressList.reduce((acc: number, curr: any) => acc + curr.completed_chapters, 0);
        setCongregationalProgress(totalRead);
      }

      // Check and Unlock Badges
      await checkAndUnlockBadges();

    } catch (err) {
      console.error('Error saving reading progress:', err);
      toast.error('No se pudo guardar tu progreso de lectura.');
    } finally {
      setSaving(false);
    }
  };

  const checkAndUnlockBadges = async () => {
    if (!user || !selectedPlan) return;

    try {
      // Call Edge Function to check reading milestones and award badges securely
      const { data, error: functionError } = await supabase.functions.invoke('gamify', {
        body: {
          action: 'check_reading_milestones',
          planId: selectedPlan.id,
        },
      });

      if (functionError) throw functionError;

      if (data?.newlyUnlocked && data.newlyUnlocked.length > 0) {
        data.newlyUnlocked.forEach((badgeName: string) => {
          toast.success(`🎉 ¡Logro Desbloqueado! Insignia obtenida: ${badgeName}`, {
            duration: 6000
          });
        });
      }
    } catch (err) {
      console.error('Error checking badges for reading milestones:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40 bg-gray-50/50 dark:bg-slate-950">
        <RefreshCw className="animate-spin text-amber-800 dark:text-amber-500" size={32} />
      </div>
    );
  }

  const personalPercentage = selectedPlan
    ? Math.round((checkedChapters.length / selectedPlan.total_chapters) * 100)
    : 0;

  const congregationalPercentage = Math.min(
    Math.round((congregationalProgress / CONGREGATIONAL_GOAL) * 100),
    100
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/20 to-white dark:from-slate-950 dark:to-slate-950 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-800 to-amber-950 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
            <BookOpen size={220} />
          </div>
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              Discipulado Congregacional
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mt-2">Plan de Lectura Bíblica</h1>
            <p className="text-amber-100 text-base md:text-lg leading-relaxed font-light">
              Comprométete a leer las Escrituras de manera diaria y sistemática. Registra los capítulos completados y contribuye a la meta comunitaria de nuestra congregación.
            </p>
          </div>
        </div>

        {/* Congregational Progress Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-6 md:p-8 shadow-sm space-y-4 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 p-2.5 rounded-xl">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-gray-800 dark:text-white">Lectura Congregacional (Meta Colectiva)</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Uniendo esfuerzos para escudriñar la Palabra de Dios</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-amber-700 dark:text-amber-500">{congregationalProgress.toLocaleString()}</span>
              <span className="text-xs text-gray-400"> / {CONGREGATIONAL_GOAL.toLocaleString()} capítulos leídos</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${congregationalPercentage}%` }}
                className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full transition-all duration-1000 ease-out"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 font-medium">
              <span>0%</span>
              <span className="dark:text-gray-300">Progreso de la Iglesia: {congregationalPercentage}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {selectedPlan && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Sidebar for plan selector & stats */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-6 shadow-sm space-y-4">
                <h3 className="font-serif font-bold text-gray-850 dark:text-white">Planes Activos</h3>
                <div className="space-y-2">
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlan(p)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-sm font-medium transition-all ${
                        selectedPlan.id === p.id
                          ? 'border-amber-500 bg-amber-50/40 text-amber-900 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-600 shadow-xs'
                          : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <span className="truncate pr-2">{p.title}</span>
                      <ChevronRight size={14} className="shrink-0 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal progress summary */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-6 shadow-sm space-y-5">
                <h3 className="font-serif font-bold text-gray-850 dark:text-white">Tu Progreso</h3>

                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-3xl font-serif font-bold text-gray-800 dark:text-white">{checkedChapters.length}</span>
                    <span className="text-gray-400 text-xs block">de {selectedPlan.total_chapters} capítulos leídos</span>
                  </div>
                  <span className="text-lg font-bold text-amber-700 dark:text-amber-500">{personalPercentage}%</span>
                </div>

                <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${personalPercentage}%` }}
                    className="h-full bg-amber-600 rounded-full transition-all duration-700 ease-out"
                  />
                </div>

                {/* Milestone cards */}
                <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/10">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Insignias del Plan</span>
                  
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-150 dark:border-white/10 text-xs">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">1er Capítulo</span>
                    <Award size={14} className={checkedChapters.length >= 1 ? 'text-amber-500' : 'text-gray-300'} />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-150 dark:border-white/10 text-xs">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Mitad del Plan (50%)</span>
                    <Award size={14} className={checkedChapters.length >= Math.ceil(selectedPlan.total_chapters * 0.5) ? 'text-amber-500' : 'text-gray-300'} />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-150 dark:border-white/10 text-xs">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Plan Completo (100%)</span>
                    <Award size={14} className={checkedChapters.length >= selectedPlan.total_chapters ? 'text-amber-500' : 'text-gray-300'} />
                  </div>
                </div>
              </div>
            </div>

            {/* Checkbox grid */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-gray-800 dark:text-white">{selectedPlan.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{selectedPlan.description}</p>
              </div>

              {/* Grid wrapper */}
              <div className="border-t border-gray-100 dark:border-white/10 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Marcador de Capítulos</span>
                  {saving && <span className="text-xs text-amber-600 dark:text-amber-400 font-medium animate-pulse">Guardando...</span>}
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {Array.from({ length: selectedPlan.total_chapters }, (_, i) => i + 1).map((num) => {
                    const isRead = checkedChapters.includes(num);
                    return (
                      <button
                        key={num}
                        onClick={() => toggleChapter(num)}
                        disabled={saving}
                        className={`aspect-square flex flex-col items-center justify-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isRead
                            ? 'bg-amber-600 border-amber-600 text-white shadow-xs hover:bg-amber-700'
                            : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-900 hover:border-amber-400 dark:hover:border-amber-650 hover:bg-amber-50/30 dark:hover:bg-amber-950/20'
                        }`}
                        title={`Capítulo ${num}`}
                      >
                        {isRead ? <CheckCircle size={12} className="mb-0.5" /> : null}
                        <span>{num}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default ReadingPlan;
