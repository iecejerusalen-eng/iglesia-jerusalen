import { useCallback, useEffect, useRef, useState } from 'react';
import { Gauge, Pause, Play, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { useToolboxStore } from '../../../store/useToolboxStore';

interface WebkitAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export function MetronomeTool() {
  const store = useToolboxStore();
  const { bpm, beatsPerMeasure, subdivision, volume, isPlaying, setPlaying } = store;
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextTickRef = useRef(0);
  const beatRef = useRef(0);

  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const Context = window.AudioContext || (window as WebkitAudioWindow).webkitAudioContext;
      if (!Context) throw new Error('Web Audio API no está disponible en este navegador.');
      audioContextRef.current = new Context();
    }
    if (audioContextRef.current.state === 'suspended') void audioContextRef.current.resume();
    return audioContextRef.current;
  }, []);

  const playClick = useCallback((time: number, accent: boolean, subdivision: boolean) => {
    const context = audioContextRef.current;
    if (!context || volume <= 0) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = subdivision ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(subdivision ? 950 : accent ? 1560 : 1120, time);
    gain.gain.setValueAtTime(Math.max(0.001, volume * (subdivision ? 0.18 : accent ? 0.72 : 0.45)), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (subdivision ? 0.025 : 0.045));
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.06);
  }, [volume]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      return;
    }

    let context: AudioContext;
    try {
      context = ensureAudioContext();
    } catch (error) {
      console.error('No se pudo iniciar el metrónomo global.', error);
      toast.error('Este navegador no permite iniciar el metrónomo.');
      setPlaying(false);
      return;
    }
    nextTickRef.current = context.currentTime + 0.06;
    beatRef.current = 0;
    const interval = 60 / bpm / subdivision;

    const scheduler = () => {
      while (nextTickRef.current < context.currentTime + 0.12) {
        const subdivisionIndex = beatRef.current % subdivision;
        const mainBeat = Math.floor(beatRef.current / subdivision) % beatsPerMeasure;
        playClick(nextTickRef.current, mainBeat === 0 && subdivisionIndex === 0, subdivisionIndex !== 0);
        if (subdivisionIndex === 0) {
          // Delay handling if needed
        }
        beatRef.current += 1;
        nextTickRef.current += interval;
      }
      timerRef.current = window.setTimeout(scheduler, 25);
    };
    scheduler();
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [beatsPerMeasure, bpm, ensureAudioContext, isPlaying, playClick, setPlaying, subdivision]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch((error: unknown) => console.error('No se pudo cerrar el contexto de audio.', error));
      }
    };
  }, []);

  const tapTempo = () => {
    const now = performance.now();
    const recent = [...tapTimes.filter((time) => now - time < 2500), now].slice(-6);
    setTapTimes(recent);
    if (recent.length >= 2) {
      const gaps = recent.slice(1).map((time, index) => time - recent[index]);
      store.setBpm(Math.round(60000 / (gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length)));
    }
  };

  return (
    <div className="px-4 pb-5 pt-2">
      <div className="mb-6 flex items-center justify-center gap-2 text-white/40">
        <Gauge size={16} />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Metrónomo</span>
      </div>

      <div className="mb-8 flex flex-col items-center justify-center">
        <div className={`mb-4 flex h-32 w-32 items-center justify-center rounded-full border-[6px] transition-all duration-300 ${
          isPlaying 
            ? 'border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-transparent shadow-[0_0_40px_-10px_rgba(251,191,36,0.3)]' 
            : 'border-white/[0.05] bg-white/[0.02]'
        }`}>
          <span className={`text-5xl font-black tabular-nums tracking-tighter ${isPlaying ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'text-white/40'}`}>
            {bpm}
          </span>
        </div>
        
        <div className="flex w-full max-w-[200px] items-center gap-4">
          <button 
            onClick={() => store.setBpm(Math.max(40, bpm - 5))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            -
          </button>
          <input 
            type="range" 
            min="40" 
            max="220" 
            value={bpm}
            onChange={(e) => store.setBpm(Number(e.target.value))}
            className="h-2 flex-1 appearance-none rounded-full bg-white/10 outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400"
          />
          <button 
            onClick={() => store.setBpm(Math.min(220, bpm + 5))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            +
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button 
          onClick={() => store.setPlaying(!store.isPlaying)} 
          className={`col-span-2 group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-3 text-[11px] font-bold tracking-wide transition-all hover:scale-[1.02] active:scale-95 ${
            isPlaying 
              ? 'border border-white/[0.05] bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white' 
              : 'border border-amber-500/20 bg-gradient-to-r from-amber-500/20 to-amber-400/20 text-amber-400 shadow-[0_4px_12px_rgba(251,191,36,0.15)] hover:border-amber-500/40 hover:from-amber-500/30 hover:to-amber-400/30'
          }`}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />} 
          {isPlaying ? 'PAUSAR' : 'INICIAR'}
          {!isPlaying && <div className="absolute -left-[100%] top-0 h-full w-[50%] skew-x-12 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent transition-all duration-700 group-hover:left-[200%]" />}
        </button>
        <button 
          onClick={tapTempo} 
          className="rounded-2xl border border-white/[0.05] bg-white/[0.03] text-[10px] font-black text-white/40 transition-all hover:bg-white/[0.08] hover:text-white active:scale-95"
        >
          TAP
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-bold">
        <label className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-2 text-white/40">
          Compás
          <select value={store.beatsPerMeasure} onChange={(event) => store.setBeatsPerMeasure(Number(event.target.value))} className="mt-1 w-full bg-transparent text-white outline-none">
            <option className="bg-slate-900 text-white" value="3">3</option>
            <option className="bg-slate-900 text-white" value="4">4</option>
            <option className="bg-slate-900 text-white" value="6">6</option>
          </select>
        </label>
        <label className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-2 text-white/40">
          División
          <select value={store.subdivision} onChange={(event) => store.setSubdivision(Number(event.target.value) as 1 | 2 | 4)} className="mt-1 w-full bg-transparent text-white outline-none">
            <option className="bg-slate-900 text-white" value="1">♩</option>
            <option className="bg-slate-900 text-white" value="2">♫</option>
            <option className="bg-slate-900 text-white" value="4">♬</option>
          </select>
        </label>
        <label className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-2 flex flex-col justify-between text-white/40">
          <div className="flex items-center gap-1"><Volume2 size={12} /> Vol.</div>
          <input type="range" min="0" max="1" step="0.05" value={store.volume} onChange={(event) => store.setVolume(Number(event.target.value))} className="w-full accent-amber-400" />
        </label>
      </div>
    </div>
  );
}
