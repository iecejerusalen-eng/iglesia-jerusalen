import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Activity, Gauge, GripHorizontal, Mic, Minimize2, Music2, Pause, Play, RotateCcw, Volume2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useMusicToolsStore } from '../../store/useMusicToolsStore';

interface WebkitAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

function frequencyToNote(frequency: number): { name: string; octave: number; cents: number; target: number } {
  const midi = 69 + 12 * Math.log2(frequency / 440);
  const rounded = Math.round(midi);
  return {
    name: NOTE_NAMES[((rounded % 12) + 12) % 12],
    octave: Math.floor(rounded / 12) - 1,
    cents: Math.round((midi - rounded) * 100),
    target: 440 * 2 ** ((rounded - 69) / 12),
  };
}

function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  let rms = 0;
  for (const sample of buffer) rms += sample * sample;
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.012) return null;

  const minLag = Math.floor(sampleRate / 1200);
  const maxLag = Math.min(Math.floor(sampleRate / 55), buffer.length - 1);
  let bestLag = -1;
  let bestCorrelation = 0;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    for (let index = 0; index < buffer.length - lag; index += 1) {
      correlation += buffer[index] * buffer[index + lag];
    }
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }
  return bestLag > 0 ? sampleRate / bestLag : null;
}

export default function GlobalMusicTools() {
  const store = useMusicToolsStore();
  const { bpm, beatsPerMeasure, subdivision, volume, isPlaying, setPlaying } = store;
  const [currentBeat, setCurrentBeat] = useState(0);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [tunerActive, setTunerActive] = useState(false);
  const [tunerError, setTunerError] = useState<string | null>(null);
  const [pitch, setPitch] = useState<ReturnType<typeof frequencyToNote> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextTickRef = useRef(0);
  const beatRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tunerFrameRef = useRef<number | null>(null);
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);

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
      queueMicrotask(() => setCurrentBeat(0));
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
          const delay = Math.max(0, (nextTickRef.current - context.currentTime) * 1000);
          window.setTimeout(() => setCurrentBeat(mainBeat + 1), delay);
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

  const stopTuner = useCallback(() => {
    if (tunerFrameRef.current !== null) cancelAnimationFrame(tunerFrameRef.current);
    tunerFrameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    analyserRef.current = null;
    setTunerActive(false);
    setPitch(null);
  }, []);

  useEffect(() => () => {
    stopTuner();
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch((error: unknown) => console.error('No se pudo cerrar el contexto de audio.', error));
    }
  }, [stopTuner]);

  const startTuner = async () => {
    setTunerError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('El navegador no ofrece acceso al micrófono.');
      const context = ensureAudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const analyser = context.createAnalyser();
      analyser.fftSize = 4096;
      context.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;
      streamRef.current = stream;
      setTunerActive(true);
      const buffer = new Float32Array(analyser.fftSize);
      const analyze = () => {
        analyser.getFloatTimeDomainData(buffer);
        const frequency = detectPitch(buffer, context.sampleRate);
        setPitch(frequency ? frequencyToNote(frequency) : null);
        tunerFrameRef.current = requestAnimationFrame(analyze);
      };
      analyze();
    } catch (error) {
      console.error('No se pudo activar el afinador.', error);
      const message = error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Permite el micrófono para usar el afinador.'
        : 'No fue posible iniciar el afinador en este dispositivo.';
      setTunerError(message);
      toast.error(message);
      stopTuner();
    }
  };

  const tapTempo = () => {
    const now = performance.now();
    const recent = [...tapTimes.filter((time) => now - time < 2500), now].slice(-6);
    setTapTimes(recent);
    if (recent.length >= 2) {
      const gaps = recent.slice(1).map((time, index) => time - recent[index]);
      store.setBpm(60000 / (gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length));
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const panel = event.currentTarget.closest('[data-music-tools-panel]')?.getBoundingClientRect();
    if (!panel) return;
    dragRef.current = { offsetX: event.clientX - panel.left, offsetY: event.clientY - panel.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    const width = store.isMinimized ? 190 : 330;
    const x = Math.max(8, Math.min(window.innerWidth - width - 8, event.clientX - dragRef.current.offsetX));
    const y = Math.max(8, Math.min(window.innerHeight - 90, event.clientY - dragRef.current.offsetY));
    store.setPosition({ x, y });
  };

  if (!store.isOpen) {
    return (
      <button onClick={() => store.open()} className="fixed bottom-5 right-5 z-[85] flex items-center gap-2 rounded-2xl border border-white/60 bg-slate-950/85 px-4 py-3 text-xs font-black text-white shadow-2xl backdrop-blur-2xl transition hover:-translate-y-0.5" aria-label="Abrir herramientas musicales">
        <Music2 size={17} className="text-amber-400" /> Herramientas
      </button>
    );
  }

  const panelStyle = store.position ? { left: store.position.x, top: store.position.y } : undefined;
  const cents = pitch?.cents ?? 0;

  return (
    <aside data-music-tools-panel style={panelStyle} className={`fixed z-[90] overflow-hidden rounded-[1.65rem] border border-white/55 bg-slate-950/88 text-white shadow-[0_30px_90px_-24px_rgba(2,6,23,.75)] backdrop-blur-3xl ${store.position ? '' : 'bottom-5 right-5'} ${store.isMinimized ? 'w-[190px]' : 'w-[min(330px,calc(100vw-16px))]'}`} aria-label="Herramientas musicales globales">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <button onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={() => { dragRef.current = null; }} className="cursor-grab touch-none rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Mover herramientas"><GripHorizontal size={17} /></button>
        <span className="flex-1 text-[10px] font-black uppercase tracking-[.18em] text-slate-300">Centro musical</span>
        <button onClick={store.toggleMinimized} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Minimizar"><Minimize2 size={14} /></button>
        <button onClick={() => { stopTuner(); store.close(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Cerrar herramientas"><X size={15} /></button>
      </div>

      {store.isMinimized ? (
        <button onClick={store.toggleMinimized} className="flex w-full items-center justify-between px-4 py-3 text-left">
          <span className="text-xs font-bold">{store.activePanel === 'metronome' ? `${store.bpm} BPM` : 'Afinador'}</span>
          <Activity size={15} className={store.isPlaying || tunerActive ? 'animate-pulse text-amber-400' : 'text-slate-500'} />
        </button>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1 p-2">
            <button onClick={() => store.setActivePanel('metronome')} className={`rounded-xl px-3 py-2 text-xs font-bold ${store.activePanel === 'metronome' ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-slate-300'}`}><Gauge size={14} className="mr-1 inline" /> Metrónomo</button>
            <button onClick={() => store.setActivePanel('tuner')} className={`rounded-xl px-3 py-2 text-xs font-bold ${store.activePanel === 'tuner' ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-slate-300'}`}><Mic size={14} className="mr-1 inline" /> Afinador</button>
          </div>

          {store.activePanel === 'metronome' ? (
            <div className="px-4 pb-4 pt-2">
              {store.sourceSongTitle && <p className="mb-2 truncate text-[10px] font-semibold text-amber-300">Tempo de {store.sourceSongTitle}</p>}
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => store.setBpm(store.bpm - 1)} className="h-10 w-10 rounded-xl bg-white/5 text-xl">−</button>
                <label className="text-center"><span className="block text-5xl font-black tabular-nums">{store.bpm}</span><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">BPM</span></label>
                <button onClick={() => store.setBpm(store.bpm + 1)} className="h-10 w-10 rounded-xl bg-white/5 text-xl">+</button>
              </div>
              <input type="range" min="30" max="240" value={store.bpm} onChange={(event) => store.setBpm(Number(event.target.value))} className="mt-4 w-full accent-amber-400" aria-label="Tempo" />
              <div className="my-4 flex justify-center gap-1.5">{Array.from({ length: store.beatsPerMeasure }, (_, index) => <span key={index} className={`h-2.5 rounded-full transition-all ${currentBeat === index + 1 ? index === 0 ? 'w-7 bg-amber-400' : 'w-5 bg-emerald-400' : 'w-2.5 bg-white/15'}`} />)}</div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => store.setPlaying(!store.isPlaying)} className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-sm font-black text-slate-950">{store.isPlaying ? <Pause size={17} /> : <Play size={17} />} {store.isPlaying ? 'Pausar' : 'Iniciar'}</button>
                <button onClick={tapTempo} className="rounded-xl border border-white/10 bg-white/5 text-xs font-black">TAP</button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-bold">
                <label className="rounded-xl bg-white/5 p-2">Compás<select value={store.beatsPerMeasure} onChange={(event) => store.setBeatsPerMeasure(Number(event.target.value))} className="mt-1 w-full bg-transparent text-white"><option className="text-slate-900" value="3">3</option><option className="text-slate-900" value="4">4</option><option className="text-slate-900" value="6">6</option></select></label>
                <label className="rounded-xl bg-white/5 p-2">División<select value={store.subdivision} onChange={(event) => store.setSubdivision(Number(event.target.value) as 1 | 2 | 4)} className="mt-1 w-full bg-transparent text-white"><option className="text-slate-900" value="1">♩</option><option className="text-slate-900" value="2">♫</option><option className="text-slate-900" value="4">♬</option></select></label>
                <label className="rounded-xl bg-white/5 p-2"><Volume2 size={12} /> Vol.<input type="range" min="0" max="1" step="0.05" value={store.volume} onChange={(event) => store.setVolume(Number(event.target.value))} className="mt-2 w-full accent-amber-400" /></label>
              </div>
            </div>
          ) : (
            <div className="px-4 pb-5 pt-2 text-center">
              <div className="relative mx-auto mb-3 grid h-40 w-40 place-items-center rounded-full border border-white/10 bg-white/[.04]">
                <div className="absolute left-1/2 top-1/2 h-px w-[72%] -translate-x-1/2 bg-gradient-to-r from-rose-500 via-emerald-400 to-rose-500" />
                <div className="absolute bottom-4 left-1/2 h-16 w-1 origin-bottom rounded-full bg-amber-400 transition-transform" style={{ transform: `translateX(-50%) rotate(${Math.max(-45, Math.min(45, cents * 0.9))}deg)` }} />
                <div className="relative z-10 rounded-2xl bg-slate-950/85 px-4 py-2"><strong className="block text-4xl">{pitch ? `${pitch.name}${pitch.octave}` : '—'}</strong><span className={`text-[10px] font-black ${Math.abs(cents) <= 5 ? 'text-emerald-400' : cents < 0 ? 'text-sky-400' : 'text-rose-400'}`}>{pitch ? `${cents > 0 ? '+' : ''}${cents} cents` : 'Toca una nota'}</span></div>
              </div>
              {pitch && <p className="mb-3 text-[10px] text-slate-400">{pitch.target.toFixed(1)} Hz · referencia A4 = 440 Hz</p>}
              {tunerError && <p className="mb-3 text-xs text-rose-300">{tunerError}</p>}
              <button onClick={() => tunerActive ? stopTuner() : void startTuner()} className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${tunerActive ? 'bg-rose-500 text-white' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950'}`}>{tunerActive ? <><Pause size={17} /> Detener micrófono</> : <><Mic size={17} /> Activar afinador</>}</button>
              <button onClick={() => setPitch(null)} className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-slate-500"><RotateCcw size={11} /> Reiniciar lectura</button>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
