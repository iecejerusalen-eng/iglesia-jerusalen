import { RotateCcw, Users } from 'lucide-react';
import { useToolboxStore } from '../../../store/useToolboxStore';

export function TallyClickerTool() {
  const { tallyCount, setTallyCount } = useToolboxStore();

  const handleIncrement = () => {
    setTallyCount((prev) => prev + 1);
    if (navigator.vibrate) navigator.vibrate(15);
  };
  const handleDecrement = () => setTallyCount((prev) => Math.max(0, prev - 1));
  const handleReset = () => {
    if (window.confirm('¿Seguro que deseas reiniciar el contador?')) {
      setTallyCount(0);
    }
  };

  return (
    <div className="px-4 pb-5 pt-2 text-center">
      <div className="mb-6 flex items-center justify-center gap-2 text-white/40">
        <Users size={16} />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Aforo General</span>
      </div>
      
      <div className="mb-6 flex justify-center">
        <button 
          onClick={handleIncrement}
          className="group relative flex h-48 w-48 items-center justify-center overflow-hidden rounded-[2.5rem] border-[6px] border-emerald-500/10 bg-gradient-to-b from-emerald-500/5 to-transparent shadow-[0_0_40px_-10px_rgba(16,185,129,0.3),inset_0_0_20px_rgba(16,185,129,0.1)] transition-all duration-300 hover:scale-105 hover:border-emerald-500/30 hover:shadow-[0_0_60px_-10px_rgba(16,185,129,0.4)] active:scale-95"
          aria-label="Aumentar conteo"
        >
          <span className="z-10 text-7xl font-black tabular-nums tracking-tighter text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] transition-transform group-active:scale-90">
            {tallyCount}
          </span>
          <div className="absolute -left-[100%] top-0 h-full w-[50%] skew-x-12 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent transition-all duration-700 group-hover:left-[200%]" />
        </button>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={handleDecrement}
          className="flex-1 rounded-2xl border border-white/[0.05] bg-white/[0.03] py-3 text-[11px] font-bold tracking-wide text-white/70 shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all hover:bg-white/[0.08] hover:text-white active:scale-95"
        >
          Descontar (-1)
        </button>
        <button 
          onClick={handleReset}
          className="flex items-center justify-center rounded-2xl border border-white/[0.05] bg-white/[0.03] px-5 text-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all hover:bg-rose-500/20 hover:text-rose-400 active:scale-95"
          aria-label="Reiniciar contador"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
