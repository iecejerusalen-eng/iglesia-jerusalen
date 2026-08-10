import { useEffect } from 'react';
import { Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { useToolboxStore } from '../../../store/useToolboxStore';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function SermonTimerTool() {
  const { 
    timerDuration, 
    timerTimeLeft, 
    timerIsRunning, 
    setTimerDuration, 
    setTimerTimeLeft, 
    setTimerIsRunning 
  } = useToolboxStore();

  useEffect(() => {
    let interval: number | undefined;
    if (timerIsRunning && timerTimeLeft > 0) {
      interval = window.setInterval(() => {
        setTimerTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerTimeLeft === 0) {
      setTimerIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerIsRunning, timerTimeLeft, setTimerTimeLeft, setTimerIsRunning]);

  const handleReset = () => {
    setTimerTimeLeft(timerDuration * 60);
    setTimerIsRunning(false);
  };

  const isWarning = timerTimeLeft <= 300 && timerTimeLeft > 60; // Less than 5 min
  const isDanger = timerTimeLeft <= 60; // Less than 1 min

  let timeColorClass = 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]';
  let bgColorClass = 'border-emerald-500/10 bg-gradient-to-b from-emerald-500/5 to-transparent shadow-[0_0_40px_-10px_rgba(16,185,129,0.3),inset_0_0_20px_rgba(16,185,129,0.1)]';
  if (isWarning) {
    timeColorClass = 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]';
    bgColorClass = 'border-amber-500/10 bg-gradient-to-b from-amber-500/5 to-transparent shadow-[0_0_40px_-10px_rgba(251,191,36,0.3),inset_0_0_20px_rgba(251,191,36,0.1)]';
  } else if (isDanger) {
    timeColorClass = 'text-rose-500 animate-pulse drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]';
    bgColorClass = 'border-rose-500/10 bg-gradient-to-b from-rose-500/5 to-transparent shadow-[0_0_40px_-10px_rgba(244,63,94,0.3),inset_0_0_20px_rgba(244,63,94,0.1)]';
  }

  return (
    <div className="px-4 pb-5 pt-2 text-center">
      <div className="mb-6 flex items-center justify-center gap-2 text-white/40">
        <Timer size={16} />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Reloj de Púlpito</span>
      </div>
      
      <div className="mb-8 flex justify-center">
        <div className={`flex h-48 w-48 items-center justify-center rounded-[2.5rem] border-[6px] ${bgColorClass} transition-all duration-700`}>
          <span className={`text-5xl font-black tabular-nums tracking-tighter ${timeColorClass}`}>
            {formatTime(timerTimeLeft)}
          </span>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/[0.05] bg-white/[0.03] p-2 px-4 shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
        <span className="text-[10px] font-bold tracking-wide text-white/40">DURACIÓN:</span>
        <select 
          value={timerDuration}
          onChange={(e) => setTimerDuration(Number(e.target.value))}
          disabled={timerIsRunning}
          className="bg-transparent text-sm font-bold text-white/90 outline-none transition-opacity disabled:opacity-50"
        >
          <option className="bg-slate-900 text-white" value="5">5 min</option>
          <option className="bg-slate-900 text-white" value="15">15 min</option>
          <option className="bg-slate-900 text-white" value="30">30 min</option>
          <option className="bg-slate-900 text-white" value="45">45 min</option>
          <option className="bg-slate-900 text-white" value="60">60 min</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => setTimerIsRunning(!timerIsRunning)}
          className={`group relative flex-1 overflow-hidden rounded-2xl py-3 text-[11px] font-bold tracking-wide transition-all hover:scale-[1.02] active:scale-95 ${
            timerIsRunning 
              ? 'border border-white/[0.05] bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white' 
              : 'border border-emerald-500/20 bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 text-emerald-400 hover:border-emerald-500/40 hover:from-emerald-500/30 hover:to-emerald-400/30'
          }`}
        >
          {timerIsRunning ? (
            <span className="flex items-center justify-center gap-2"><Pause size={16} /> PAUSAR</span>
          ) : (
            <span className="flex items-center justify-center gap-2"><Play size={16} /> INICIAR</span>
          )}
          {!timerIsRunning && <div className="absolute -left-[100%] top-0 h-full w-[50%] skew-x-12 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent transition-all duration-700 group-hover:left-[200%]" />}
        </button>
        <button 
          onClick={handleReset}
          className="flex items-center justify-center rounded-2xl border border-white/[0.05] bg-white/[0.03] px-5 text-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all hover:bg-rose-500/20 hover:text-rose-400 active:scale-95"
          aria-label="Reiniciar temporizador"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
