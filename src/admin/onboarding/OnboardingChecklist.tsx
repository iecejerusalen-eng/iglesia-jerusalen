import { ChevronDown, ChevronUp, Sparkles, Trophy, X, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingPaso } from './OnboardingPaso';
import { OnboardingProgreso } from './OnboardingProgreso';
import type { OnboardingPasoData } from './useOnboarding';

const STORAGE_KEY_DISMISSED = 'admin_onboarding_checklist_dismissed';

interface OnboardingChecklistProps {
  pasos: OnboardingPasoData[];
  porcentaje: number;
  completados: number;
  puntos: number;
  onReopen: () => void;
  onDismiss?: () => void;
}

export function OnboardingChecklist({
  pasos,
  porcentaje,
  completados,
  puntos,
  onReopen,
  onDismiss,
}: OnboardingChecklistProps) {
  const [expanded, setExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    // Si el usuario ya lo descartó explícitamente
    if (localStorage.getItem(STORAGE_KEY_DISMISSED) === 'true') {
      return true;
    }
    // Si ya está al 100% y ya fue celebrado en sesiones anteriores, no estorbar por defecto
    if (porcentaje === 100 && localStorage.getItem('admin_onboarding_celebrated') === 'true') {
      return true;
    }
    return false;
  });

  const navigate = useNavigate();
  const isCompleted = porcentaje === 100;

  useEffect(() => {
    // Si ya fue descartado, mantenerse oculto
    if (localStorage.getItem(STORAGE_KEY_DISMISSED) === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY_DISMISSED, 'true');
    onDismiss?.();
  };

  if (!pasos.length || isDismissed) return null;

  return (
    <aside
      className="fixed bottom-4 right-4 z-40 w-[min(23rem,calc(100vw-2rem))] animate-in fade-in slide-in-from-bottom-3 duration-300"
      aria-label="Checklist de onboarding"
    >
      <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 transition-all">
        {/* Cabecera del widget */}
        <div className="flex items-center gap-2 p-3.5 sm:p-4">
          {/* Botón principal para expandir/colapsar */}
          <button
            type="button"
            className="flex flex-1 items-center gap-3 text-left focus:outline-none min-w-0"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
          >
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-2xl text-white transition-transform ${
                isCompleted
                  ? 'bg-emerald-500 shadow-md shadow-emerald-500/25'
                  : 'bg-primary shadow-md shadow-primary/25'
              }`}
            >
              {isCompleted ? <CheckCircle2 size={20} /> : <Sparkles size={19} />}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                {isCompleted ? '¡Onboarding completado!' : `${completados}/${pasos.length} pasos completados`}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {porcentaje}% · {puntos} pts
              </p>
            </div>

            <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 shrink-0">
              {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </div>
          </button>

          {/* Botón de cerrar (X) independiente */}
          <button
            type="button"
            onClick={handleDismiss}
            className="grid size-8 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Cerrar y ocultar checklist"
            aria-label="Cerrar checklist"
          >
            <X size={17} />
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="px-4 pb-3">
          <OnboardingProgreso porcentaje={porcentaje} />
        </div>

        {/* Lista expandible */}
        {expanded && (
          <div className="border-t border-slate-100 px-3 pb-3 pt-2 dark:border-white/10">
            <ul className="space-y-1 max-h-[45vh] overflow-y-auto pr-1">
              {pasos.map((paso) => (
                <OnboardingPaso
                  key={paso.id}
                  paso={paso}
                  onAction={(item) => navigate(item.accion_ruta)}
                />
              ))}
            </ul>

            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/10 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={onReopen}
                className="w-full rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 text-center transition-colors cursor-pointer"
              >
                Ver introducción de nuevo
              </button>

              {isCompleted ? (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 px-3 py-2.5 text-xs font-black text-emerald-700 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 dark:text-emerald-300 transition-colors cursor-pointer"
                >
                  <Trophy size={15} /> ¡Excelente! Ocultar checklist
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full rounded-xl px-3 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-center transition-colors cursor-pointer"
                >
                  Ocultar checklist
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
