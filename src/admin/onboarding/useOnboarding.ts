import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../config/supabase';

export interface OnboardingPasoData {
  id: string; rol: string; orden: number; titulo: string; descripcion: string;
  accion_label: string; accion_ruta: string; icono: string; es_obligatorio: boolean; puntos: number;
  completado: boolean; omitido: boolean;
}

interface OnboardingConfig { onboarding_completado: boolean; onboarding_omitido: boolean; porcentaje_completado: number; }

export function useOnboarding() {
  const { user, role } = useAuthStore();
  const location = useLocation();
  const [pasos, setPasos] = useState<OnboardingPasoData[]>([]);
  const [config, setConfig] = useState<OnboardingConfig>({ onboarding_completado: false, onboarding_omitido: false, porcentaje_completado: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cargar = useCallback(async () => {
    if (!user?.id || !role) { setPasos([]); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    const [{ data: stepRows, error: stepsError }, { data: progressRows, error: progressError }, { data: configRow, error: configError }] = await Promise.all([
      supabase.from('onboarding_pasos').select('id, rol, orden, titulo, descripcion, accion_label, accion_ruta, icono, es_obligatorio, puntos').eq('rol', role).order('orden'),
      supabase.from('onboarding_progreso').select('paso_id, completado_at, omitido').eq('usuario_id', user.id),
      supabase.from('onboarding_configuracion').select('onboarding_completado, onboarding_omitido, porcentaje_completado').eq('usuario_id', user.id).maybeSingle(),
    ]);
    const queryError = stepsError || progressError || configError;
    if (queryError) { setError(queryError); setIsLoading(false); return; }
    const progress = new Map((progressRows ?? []).map((row) => [row.paso_id, row]));
    const nextSteps = (stepRows ?? []).map((step) => ({ ...step, completado: Boolean(progress.get(step.id)?.completado_at), omitido: Boolean(progress.get(step.id)?.omitido) })) as OnboardingPasoData[];
    setPasos(nextSteps);
    setConfig(configRow ?? { onboarding_completado: false, onboarding_omitido: false, porcentaje_completado: 0 });
    setIsLoading(false);
  }, [role, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void cargar(); }, 0);
    return () => window.clearTimeout(timer);
  }, [cargar]);

  const porcentaje = useMemo(() => pasos.length ? Math.round((pasos.filter((step) => step.completado).length / pasos.length) * 100) : 0, [pasos]);
  const completados = useMemo(() => pasos.filter((step) => step.completado).length, [pasos]);
  const puntos = useMemo(() => pasos.filter((step) => step.completado).reduce((total, step) => total + step.puntos, 0), [pasos]);
  const marcarCompletado = useCallback(async (pasoId: string) => {
    if (!user?.id) return;
    const now = new Date().toISOString();
    const { error: progressError } = await supabase.from('onboarding_progreso').upsert({ usuario_id: user.id, paso_id: pasoId, completado_at: now, omitido: false }, { onConflict: 'usuario_id,paso_id' });
    if (progressError) { setError(progressError); return; }
    const nextPercentage = pasos.length ? Math.round(((pasos.filter((step) => step.completado || step.id === pasoId).length) / pasos.length) * 100) : 0;
    const { error: configError } = await supabase.from('onboarding_configuracion').upsert({ usuario_id: user.id, onboarding_completado: nextPercentage === 100, onboarding_omitido: false, porcentaje_completado: nextPercentage, ultima_actividad: now }, { onConflict: 'usuario_id' });
    if (configError) { setError(configError); return; }
    setPasos((current) => current.map((step) => step.id === pasoId ? { ...step, completado: true, omitido: false } : step));
    setConfig({ onboarding_completado: nextPercentage === 100, onboarding_omitido: false, porcentaje_completado: nextPercentage });
  }, [pasos, user]);

  const actualizarConfig = useCallback(async (values: Partial<OnboardingConfig>) => {
    if (!user?.id) return;
    const next = { ...config, ...values };
    const { error: configError } = await supabase.from('onboarding_configuracion').upsert({ usuario_id: user.id, ...next, ultima_actividad: new Date().toISOString() }, { onConflict: 'usuario_id' });
    if (configError) { setError(configError); return; }
    setConfig(next);
  }, [config, user]);

  useEffect(() => {
    const current = pasos.find((step) => step.accion_ruta === location.pathname);
    if (!current || current.completado) return;
    const timer = window.setTimeout(() => { void marcarCompletado(current.id); }, 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname, marcarCompletado, pasos]);

  return { pasos, config, porcentaje, completados, puntos, isLoading, error, recargar: cargar, marcarCompletado, actualizarConfig };
}
