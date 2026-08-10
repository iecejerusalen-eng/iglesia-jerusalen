import { useState, type KeyboardEvent } from 'react';
import { RotateCcw, Undo2, Users } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../ui/alert-dialog';
import { useToolboxStore } from '../../../store/useToolboxStore';

function formatLastChange(timestamp: number | null): string {
  if (timestamp === null) return 'Sin cambios en esta sesión';
  return `Último cambio: ${new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp))}`;
}

export function TallyClickerTool() {
  const [vibrationError, setVibrationError] = useState<string | null>(null);
  const store = useToolboxStore(useShallow((state) => ({
    tallyCount: state.tallyCount,
    tallyPreviousCount: state.tallyPreviousCount,
    tallyCapacity: state.tallyCapacity,
    tallyLastChangedAt: state.tallyLastChangedAt,
    persistenceError: state.persistenceError,
    setTallyCount: state.setTallyCount,
    undoTally: state.undoTally,
    resetTally: state.resetTally,
    setTallyCapacity: state.setTallyCapacity,
  })));

  const occupancy = Math.round((store.tallyCount / store.tallyCapacity) * 100);
  const isAtCapacity = store.tallyCount >= store.tallyCapacity;

  const handleIncrement = () => {
    store.setTallyCount((previous) => previous + 1);
    if (typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(15);
      } catch (error) {
        console.error('No se pudo activar la respuesta háptica del aforo.', error);
        setVibrationError('El conteo se guardó, pero no se pudo activar la vibración.');
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      handleIncrement();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      store.setTallyCount((previous) => previous - 1);
    }
  };

  return (
    <div className="px-4 pb-5 pt-2 text-center">
      <div className="mb-4 flex items-center justify-center gap-2 text-white/60">
        <Users size={17} aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-[0.18em]">Aforo general</span>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Aforo actual: {store.tallyCount} personas. Ocupación: {occupancy}%.
      </p>

      <div className="mb-4 flex justify-center">
        <button
          type="button"
          onClick={handleIncrement}
          onKeyDown={handleKeyDown}
          className={`group relative flex h-44 w-44 flex-col items-center justify-center overflow-hidden rounded-[2.25rem] border-[6px] bg-gradient-to-b transition duration-300 hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
            isAtCapacity
              ? 'border-amber-500/20 from-amber-500/10 to-transparent focus-visible:ring-amber-400'
              : 'border-emerald-500/10 from-emerald-500/5 to-transparent focus-visible:ring-emerald-400'
          }`}
          aria-label={`Aumentar aforo. Conteo actual: ${store.tallyCount}. Usa flecha arriba para sumar y flecha abajo para descontar.`}
        >
          <span className={`z-10 text-7xl font-black tabular-nums tracking-tighter ${isAtCapacity ? 'text-amber-300' : 'text-emerald-400'} drop-shadow-[0_0_15px_rgba(52,211,153,0.45)] transition-transform group-active:scale-90`}>
            {store.tallyCount}
          </span>
          <span className="z-10 mt-1 text-xs font-semibold text-white/55">Pulsa para sumar</span>
        </button>
      </div>

      <div className="mb-4 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-3 text-left">
        <label htmlFor="toolbox-tally-capacity" className="mb-2 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-white/70">Capacidad máxima</span>
          <input
            id="toolbox-tally-capacity"
            type="number"
            min={1}
            max={999999}
            value={store.tallyCapacity}
            onChange={(event) => store.setTallyCapacity(Number(event.target.value))}
            className="h-10 w-24 rounded-xl border border-white/10 bg-black/20 px-2 text-center text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          />
        </label>
        <div className="mb-1.5 flex items-center justify-between text-xs text-white/60">
          <span>Ocupación</span>
          <span className={isAtCapacity ? 'font-bold text-amber-300' : ''}>{occupancy}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Porcentaje de ocupación" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, occupancy)}>
          <div className={`h-full rounded-full transition-[width] duration-300 ${isAtCapacity ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(100, occupancy)}%` }} />
        </div>
        {isAtCapacity && (
          <p className="mt-2 text-xs font-medium text-amber-200" role="status">
            {store.tallyCount === store.tallyCapacity ? 'Se alcanzó la capacidad definida.' : `La capacidad se superó por ${store.tallyCount - store.tallyCapacity}.`}
          </p>
        )}
        <p className="mt-2 text-xs text-white/45">{formatLastChange(store.tallyLastChangedAt)}</p>
      </div>

      {(vibrationError || store.persistenceError) && (
        <div className="mb-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-left text-xs text-amber-100" role="alert">
          <p>{vibrationError ?? store.persistenceError}</p>
          {vibrationError && <button type="button" onClick={() => setVibrationError(null)} className="mt-2 font-bold underline underline-offset-2">Descartar aviso</button>}
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto_auto] gap-2">
        <button
          type="button"
          onClick={() => store.setTallyCount((previous) => previous - 1)}
          disabled={store.tallyCount === 0}
          className="min-h-12 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-3 text-xs font-bold text-white/75 transition hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Descontar una persona"
        >
          Descontar −1
        </button>
        <button
          type="button"
          onClick={store.undoTally}
          disabled={store.tallyPreviousCount === null}
          className="flex min-h-12 min-w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04] text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Deshacer último cambio del aforo"
        >
          <Undo2 size={17} aria-hidden="true" />
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={store.tallyCount === 0}
              className="flex min-h-12 min-w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04] text-white/60 transition hover:bg-rose-500/20 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Reiniciar contador de aforo"
            >
              <RotateCcw size={17} aria-hidden="true" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent position="center">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Reiniciar el aforo?</AlertDialogTitle>
              <AlertDialogDescription>
                El conteo actual de {store.tallyCount} personas volverá a cero. Podrás deshacer esta acción después.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={store.resetTally} className="bg-rose-600 hover:bg-rose-700">
                Reiniciar conteo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
