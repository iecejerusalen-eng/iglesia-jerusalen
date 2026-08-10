import { useEffect } from 'react';
import { Bell, BellOff, Minus, Pause, Play, Plus, RotateCcw, Timer, Vibrate } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useToolboxStore, type TimerStatus } from '../../../store/useToolboxStore';

function formatTime(seconds: number): string {
  const absolute = Math.abs(seconds);
  const hours = Math.floor(absolute / 3600);
  const minutes = Math.floor((absolute % 3600) / 60);
  const remainingSeconds = absolute % 60;
  const value = hours > 0
    ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  return seconds < 0 ? `+${value}` : value;
}

function statusLabel(status: TimerStatus): string {
  switch (status) {
    case 'running': return 'En curso';
    case 'paused': return 'Pausado';
    case 'finished': return 'Tiempo terminado';
    case 'overtime': return 'Tiempo extra';
    default: return 'Listo para iniciar';
  }
}

export function SermonTimerTool() {
  const syncTimer = useToolboxStore((state) => state.syncTimer);
  const store = useToolboxStore(useShallow((state) => ({
    timerDuration: state.timerDuration,
    timerTimeLeft: state.timerTimeLeft,
    timerIsRunning: state.timerIsRunning,
    timerStatus: state.timerStatus,
    timerAllowOvertime: state.timerAllowOvertime,
    timerSoundEnabled: state.timerSoundEnabled,
    timerVibrationEnabled: state.timerVibrationEnabled,
    timerAlertError: state.timerAlertError,
    persistenceError: state.persistenceError,
    setTimerDuration: state.setTimerDuration,
    startTimer: state.startTimer,
    pauseTimer: state.pauseTimer,
    resetTimer: state.resetTimer,
    adjustTimer: state.adjustTimer,
    setTimerAllowOvertime: state.setTimerAllowOvertime,
    setTimerSoundEnabled: state.setTimerSoundEnabled,
    setTimerVibrationEnabled: state.setTimerVibrationEnabled,
    clearTimerAlertError: state.clearTimerAlertError,
  })));

  useEffect(() => {
    syncTimer();
    const syncWhenVisible = () => syncTimer();
    document.addEventListener('visibilitychange', syncWhenVisible);
    window.addEventListener('focus', syncWhenVisible);
    return () => {
      document.removeEventListener('visibilitychange', syncWhenVisible);
      window.removeEventListener('focus', syncWhenVisible);
    };
  }, [syncTimer]);

  const totalSeconds = store.timerDuration * 60;
  const elapsedSeconds = Math.max(0, totalSeconds - Math.max(0, store.timerTimeLeft));
  const progress = Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100));
  const isWarning = store.timerTimeLeft <= 300 && store.timerTimeLeft > 60;
  const isDanger = store.timerTimeLeft <= 60;
  const isOvertime = store.timerStatus === 'overtime';

  let timeColorClass = 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]';
  let bgColorClass = 'border-emerald-500/10 bg-gradient-to-b from-emerald-500/5 to-transparent';
  if (isWarning) {
    timeColorClass = 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]';
    bgColorClass = 'border-amber-500/10 bg-gradient-to-b from-amber-500/5 to-transparent';
  } else if (isDanger) {
    timeColorClass = 'text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]';
    bgColorClass = 'border-rose-500/10 bg-gradient-to-b from-rose-500/5 to-transparent';
  }

  return (
    <div className="px-4 pb-5 pt-2 text-center">
      <div className="mb-4 flex items-center justify-center gap-2 text-white/60">
        <Timer size={17} aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-[0.18em]">Reloj de púlpito</span>
      </div>

      <p className="sr-only" aria-live="assertive" aria-atomic="true">
        {statusLabel(store.timerStatus)}. {formatTime(store.timerTimeLeft)}.
      </p>

      <div className="mb-4 flex justify-center">
        <div
          className={`flex h-44 w-44 flex-col items-center justify-center rounded-[2.25rem] border-[6px] ${bgColorClass} shadow-[0_0_40px_-10px_rgba(16,185,129,0.25)] transition-colors duration-500`}
          role="timer"
          aria-label={`${statusLabel(store.timerStatus)}, ${formatTime(store.timerTimeLeft)}`}
        >
          <span className={`text-5xl font-black tabular-nums tracking-tighter ${timeColorClass} ${isDanger && store.timerIsRunning ? 'animate-pulse motion-reduce:animate-none' : ''}`}>
            {formatTime(store.timerTimeLeft)}
          </span>
          <span className={`mt-2 text-xs font-semibold uppercase tracking-wide ${isOvertime ? 'text-rose-300' : 'text-white/55'}`}>
            {statusLabel(store.timerStatus)}
          </span>
        </div>
      </div>

      <div className="mb-4" aria-label={`Progreso: ${progress}%`}>
        <div className="mb-1.5 flex justify-between text-xs text-white/55">
          <span>{isOvertime ? 'Tiempo previsto agotado' : `${progress}% transcurrido`}</span>
          <span>{Math.floor(elapsedSeconds / 60)} min</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className={`h-full rounded-full transition-[width] duration-300 ${isDanger ? 'bg-rose-400' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mb-3 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-3">
        <label className="mb-2 flex items-center justify-between gap-3 text-left" htmlFor="toolbox-timer-duration">
          <span className="text-xs font-semibold text-white/65">Duración (minutos)</span>
          <input
            id="toolbox-timer-duration"
            type="number"
            min={1}
            max={240}
            step={1}
            value={store.timerDuration}
            onChange={(event) => store.setTimerDuration(Number(event.target.value))}
            disabled={store.timerIsRunning}
            className="h-10 w-20 rounded-xl border border-white/10 bg-black/20 px-2 text-center text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>

        <div className="grid grid-cols-4 gap-1.5" aria-label="Ajustar tiempo restante">
          {[-300, -60, 60, 300].map((seconds) => (
            <button
              key={seconds}
              type="button"
              onClick={() => store.adjustTimer(seconds)}
              className="min-h-10 rounded-xl border border-white/[0.07] bg-white/[0.04] text-xs font-bold text-white/75 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-40"
              disabled={!store.timerAllowOvertime && store.timerTimeLeft === 0 && seconds < 0}
              aria-label={`${seconds > 0 ? 'Añadir' : 'Quitar'} ${Math.abs(seconds) / 60} minutos`}
            >
              {seconds > 0 ? <Plus className="mr-0.5 inline" size={13} aria-hidden="true" /> : <Minus className="mr-0.5 inline" size={13} aria-hidden="true" />}
              {Math.abs(seconds) / 60}m
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 space-y-2 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 text-left text-xs text-white/70">
        <label className="flex min-h-8 cursor-pointer items-center justify-between gap-3">
          <span>Continuar contando tiempo extra</span>
          <input type="checkbox" checked={store.timerAllowOvertime} onChange={(event) => store.setTimerAllowOvertime(event.target.checked)} className="h-4 w-4 accent-emerald-500" />
        </label>
        <label className="flex min-h-8 cursor-pointer items-center justify-between gap-3">
          <span className="flex items-center gap-2">{store.timerSoundEnabled ? <Bell size={15} aria-hidden="true" /> : <BellOff size={15} aria-hidden="true" />} Aviso sonoro</span>
          <input type="checkbox" checked={store.timerSoundEnabled} onChange={(event) => store.setTimerSoundEnabled(event.target.checked)} className="h-4 w-4 accent-emerald-500" />
        </label>
        <label className="flex min-h-8 cursor-pointer items-center justify-between gap-3">
          <span className="flex items-center gap-2"><Vibrate size={15} aria-hidden="true" /> Vibración compatible</span>
          <input type="checkbox" checked={store.timerVibrationEnabled} onChange={(event) => store.setTimerVibrationEnabled(event.target.checked)} className="h-4 w-4 accent-emerald-500" />
        </label>
      </div>

      {(store.timerAlertError || store.persistenceError) && (
        <div className="mb-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-left text-xs text-amber-100" role="alert">
          <p>{store.timerAlertError ?? store.persistenceError}</p>
          {store.timerAlertError && (
            <button type="button" onClick={store.clearTimerAlertError} className="mt-2 font-bold underline underline-offset-2">Descartar aviso</button>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={store.timerIsRunning ? store.pauseTimer : store.startTimer}
          aria-pressed={store.timerIsRunning}
          className={`group relative min-h-12 flex-1 overflow-hidden rounded-2xl px-3 text-xs font-bold tracking-wide transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
            store.timerIsRunning
              ? 'border border-white/[0.08] bg-white/[0.05] text-white/80 hover:bg-white/[0.1]'
              : 'border border-emerald-500/20 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
          }`}
        >
          {store.timerIsRunning ? (
            <span className="flex items-center justify-center gap-2"><Pause size={17} aria-hidden="true" /> Pausar</span>
          ) : (
            <span className="flex items-center justify-center gap-2"><Play size={17} aria-hidden="true" /> {store.timerStatus === 'paused' ? 'Continuar' : 'Iniciar'}</span>
          )}
        </button>
        <button
          type="button"
          onClick={store.resetTimer}
          className="flex min-h-12 min-w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white/60 transition hover:bg-rose-500/20 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          aria-label="Reiniciar temporizador"
        >
          <RotateCcw size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
