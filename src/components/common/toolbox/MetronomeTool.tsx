import { useCallback, useEffect, useRef, useState } from 'react';
import { Gauge, Pause, Play, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { useToolboxStore } from '../../../store/useToolboxStore';
import { updateTapTempo } from './audio/audioMath';

interface WebkitAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

const BPM_MIN = 30;
const BPM_MAX = 300;

export function MetronomeTool() {
  const bpm = useToolboxStore((state) => state.bpm);
  const beatsPerMeasure = useToolboxStore((state) => state.beatsPerMeasure);
  const subdivision = useToolboxStore((state) => state.subdivision);
  const volume = useToolboxStore((state) => state.volume);
  const isPlaying = useToolboxStore((state) => state.isPlaying);
  const setPlaying = useToolboxStore((state) => state.setPlaying);
  const setBpm = useToolboxStore((state) => state.setBpm);
  const setBeatsPerMeasure = useToolboxStore((state) => state.setBeatsPerMeasure);
  const setSubdivision = useToolboxStore((state) => state.setSubdivision);
  const setVolume = useToolboxStore((state) => state.setVolume);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [currentBeat, setCurrentBeat] = useState<number | null>(null);
  const [countInMeasures, setCountInMeasures] = useState<0 | 1 | 2>(0);
  const [accentEnabled, setAccentEnabled] = useState(true);
  const [status, setStatus] = useState<'ready' | 'starting' | 'playing' | 'error'>('ready');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const visualTimersRef = useRef<number[]>([]);
  const nextTickRef = useRef(0);
  const tickIndexRef = useRef(0);
  const countInTicksRef = useRef(0);

  const getAudioContext = useCallback(async (): Promise<AudioContext> => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      const Context = window.AudioContext || (window as WebkitAudioWindow).webkitAudioContext;
      if (!Context) throw new Error('Web Audio API no está disponible en este navegador.');
      audioContextRef.current = new Context();
    }
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
    if (audioContextRef.current.state !== 'running') throw new Error('El navegador no pudo activar la salida de audio.');
    return audioContextRef.current;
  }, []);

  const playClick = useCallback((context: AudioContext, time: number, accent: boolean, isSubdivision: boolean) => {
    if (volume <= 0) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = isSubdivision ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(isSubdivision ? 900 : accent ? 1560 : 1120, time);
    const level = volume * (isSubdivision ? 0.16 : accent ? 0.75 : 0.48);
    gain.gain.setValueAtTime(Math.max(0.001, level), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isSubdivision ? 0.025 : 0.045));
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.06);
  }, [volume]);

  useEffect(() => {
    let cancelled = false;
    const clearScheduledWork = () => {
      if (schedulerRef.current !== null) window.clearTimeout(schedulerRef.current);
      schedulerRef.current = null;
      visualTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      visualTimersRef.current = [];
    };

    if (!isPlaying) {
      clearScheduledWork();
      return clearScheduledWork;
    }

    void getAudioContext().then((context) => {
      if (cancelled) return;
      setStatus('playing');
      nextTickRef.current = context.currentTime + 0.06;
      tickIndexRef.current = 0;
      countInTicksRef.current = countInMeasures * beatsPerMeasure * subdivision;
      const secondsPerTick = 60 / bpm / subdivision;

      const scheduler = () => {
        if (cancelled || context.state === 'closed') return;
        while (nextTickRef.current < context.currentTime + 0.12) {
          const tick = tickIndexRef.current;
          const subdivisionIndex = tick % subdivision;
          const beat = Math.floor(tick / subdivision) % beatsPerMeasure;
          const inCountIn = tick < countInTicksRef.current;
          const accent = subdivisionIndex === 0 && beat === 0 && accentEnabled;
          playClick(context, nextTickRef.current, accent, subdivisionIndex !== 0);
          if (subdivisionIndex === 0) {
            const delay = Math.max(0, (nextTickRef.current - context.currentTime) * 1000);
            const visualTimer = window.setTimeout(() => {
              setCurrentBeat(inCountIn ? -(beat + 1) : beat + 1);
            }, delay);
            visualTimersRef.current.push(visualTimer);
          }
          tickIndexRef.current += 1;
          nextTickRef.current += secondsPerTick;
        }
        schedulerRef.current = window.setTimeout(scheduler, 25);
      };
      scheduler();
    }).catch((error: unknown) => {
      if (cancelled) return;
      console.error('No se pudo iniciar el metrónomo.', error);
      const message = error instanceof Error ? error.message : 'No fue posible iniciar el metrónomo.';
      setErrorMessage(message);
      setStatus('error');
      toast.error(message);
      setPlaying(false);
    });

    return () => {
      cancelled = true;
      clearScheduledWork();
    };
  }, [accentEnabled, beatsPerMeasure, bpm, countInMeasures, getAudioContext, isPlaying, playClick, setPlaying, subdivision]);

  useEffect(() => () => {
    setPlaying(false);
    const context = audioContextRef.current;
    if (context && context.state !== 'closed') {
      void context.close().catch((error: unknown) => console.error('No se pudo cerrar el contexto del metrónomo.', error));
    }
  }, [setPlaying]);

  const togglePlayback = async () => {
    if (isPlaying) {
      setCurrentBeat(null);
      setStatus('ready');
      setPlaying(false);
      return;
    }
    setStatus('starting');
    setErrorMessage(null);
    try {
      await getAudioContext();
      setPlaying(true);
    } catch (error) {
      console.error('No se pudo preparar el audio del metrónomo.', error);
      const message = error instanceof Error ? error.message : 'No fue posible preparar el audio.';
      setErrorMessage(message);
      setStatus('error');
      toast.error(message);
    }
  };

  const tapTempo = () => {
    const result = updateTapTempo(tapTimes, performance.now());
    setTapTimes(result.taps);
    if (result.bpm !== null) setBpm(result.bpm);
  };

  const updateBpm = (value: number) => setBpm(Math.max(BPM_MIN, Math.min(BPM_MAX, value)));
  const visibleBeat = isPlaying ? currentBeat : null;
  const displayBeat = visibleBeat === null ? '—' : Math.abs(visibleBeat);
  const isCountingIn = visibleBeat !== null && visibleBeat < 0;

  return (
    <div className="px-4 pb-5 pt-2">
      <div className="mb-4 flex items-center justify-center gap-2 text-white/60">
        <Gauge size={17} aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-[0.18em]">Metrónomo</span>
      </div>

      <div className="mb-5 flex flex-col items-center">
        <div className={`mb-3 flex h-28 w-28 flex-col items-center justify-center rounded-full border-[5px] transition-colors ${isPlaying ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : 'border-white/10 bg-white/[0.03] text-white/50'}`} aria-live="polite">
          <span className="text-4xl font-black tabular-nums">{bpm}</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider">BPM</span>
        </div>
        <div className="mb-3 flex items-center gap-2" aria-label={isCountingIn ? `Cuenta de entrada, tiempo ${displayBeat}` : `Tiempo ${displayBeat} de ${beatsPerMeasure}`}>
          {Array.from({ length: beatsPerMeasure }, (_, index) => (
            <span key={index} className={`h-2.5 w-2.5 rounded-full transition-all ${Math.abs(visibleBeat ?? 0) === index + 1 ? 'scale-125 bg-amber-300' : 'bg-white/15'}`} />
          ))}
          <span className="ml-1 min-w-14 text-xs font-semibold text-white/60">{isCountingIn ? 'Entrada' : `${displayBeat}/${beatsPerMeasure}`}</span>
        </div>

        <div className="grid w-full grid-cols-[44px_44px_1fr_44px_44px] gap-1.5">
          {[-5, -1].map((step) => <button key={step} type="button" aria-label={`Reducir ${Math.abs(step)} BPM`} onClick={() => updateBpm(bpm + step)} className="h-11 rounded-xl bg-white/[0.06] text-sm font-bold text-white/70 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300">{step}</button>)}
          <input aria-label="Tempo en pulsaciones por minuto" type="number" inputMode="numeric" min={BPM_MIN} max={BPM_MAX} value={bpm} onChange={(event) => updateBpm(Number(event.target.value) || BPM_MIN)} className="h-11 min-w-0 rounded-xl border border-white/10 bg-white/[0.04] px-2 text-center text-base font-bold tabular-nums text-white outline-none focus:border-amber-300" />
          {[1, 5].map((step) => <button key={step} type="button" aria-label={`Aumentar ${step} BPM`} onClick={() => updateBpm(bpm + step)} className="h-11 rounded-xl bg-white/[0.06] text-sm font-bold text-white/70 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300">+{step}</button>)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={() => void togglePlayback()} aria-pressed={isPlaying} disabled={status === 'starting'} className={`col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold transition-colors disabled:cursor-wait disabled:opacity-60 ${isPlaying ? 'border-white/10 bg-white/[0.04] text-white/80' : 'border-amber-400/25 bg-amber-400/15 text-amber-300'}`}>
          {isPlaying ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
          {status === 'starting' ? 'INICIANDO…' : isPlaying ? 'PAUSAR' : 'INICIAR'}
        </button>
        <button type="button" onClick={tapTempo} aria-label="Marcar tempo pulsando repetidamente" className="min-h-11 rounded-2xl border border-white/10 bg-white/[0.04] text-xs font-black text-white/70 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300">TAP</button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-white/60">
        <label className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">Compás
          <select aria-label="Compás" value={beatsPerMeasure} onChange={(event) => setBeatsPerMeasure(Number(event.target.value))} className="mt-1 h-8 w-full bg-transparent text-white outline-none">
            {[2, 3, 4, 5, 6, 7].map((beats) => <option key={beats} className="bg-slate-900" value={beats}>{beats}/4</option>)}
          </select>
        </label>
        <label className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">División
          <select aria-label="Subdivisión del pulso" value={subdivision} onChange={(event) => setSubdivision(Number(event.target.value) as 1 | 2 | 4)} className="mt-1 h-8 w-full bg-transparent text-white outline-none">
            <option className="bg-slate-900" value="1">Negras</option><option className="bg-slate-900" value="2">Corcheas</option><option className="bg-slate-900" value="4">Semicorcheas</option>
          </select>
        </label>
        <label className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">Cuenta de entrada
          <select aria-label="Compases de cuenta de entrada" value={countInMeasures} onChange={(event) => setCountInMeasures(Number(event.target.value) as 0 | 1 | 2)} className="mt-1 h-8 w-full bg-transparent text-white outline-none">
            <option className="bg-slate-900" value="0">Sin entrada</option><option className="bg-slate-900" value="1">1 compás</option><option className="bg-slate-900" value="2">2 compases</option>
          </select>
        </label>
        <label className="flex min-h-14 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
          <input type="checkbox" checked={accentEnabled} onChange={(event) => setAccentEnabled(event.target.checked)} className="h-4 w-4 accent-amber-400" /> Acentuar inicio
        </label>
      </div>
      <label className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 text-xs font-semibold text-white/60">
        <Volume2 size={15} aria-hidden="true" /> Volumen
        <input aria-label="Volumen del metrónomo" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="h-8 flex-1 accent-amber-400" />
        <span className="w-9 text-right tabular-nums">{Math.round(volume * 100)}%</span>
      </label>
      <p className={`mt-2 min-h-5 text-center text-xs ${errorMessage ? 'text-rose-300' : 'text-white/45'}`} role={errorMessage ? 'alert' : 'status'}>{errorMessage ?? (status === 'playing' ? 'Audio activo' : 'Listo para iniciar')}</p>
    </div>
  );
}
