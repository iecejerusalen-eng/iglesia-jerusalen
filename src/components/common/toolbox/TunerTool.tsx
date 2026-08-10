import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

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

export function TunerTool() {
  const [tunerActive, setTunerActive] = useState(false);
  const [tunerError, setTunerError] = useState<string | null>(null);
  const [pitch, setPitch] = useState<ReturnType<typeof frequencyToNote> | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tunerFrameRef = useRef<number | null>(null);

  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const Context = window.AudioContext || (window as WebkitAudioWindow).webkitAudioContext;
      if (!Context) throw new Error('Web Audio API no está disponible en este navegador.');
      audioContextRef.current = new Context();
    }
    if (audioContextRef.current.state === 'suspended') void audioContextRef.current.resume();
    return audioContextRef.current;
  }, []);

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

  const cents = pitch?.cents ?? 0;
  const isTuning = tunerActive && pitch !== null;
  const note = pitch ? `${pitch.name}${pitch.octave}` : '—';

  return (
    <div className="px-4 pb-5 pt-2">
      <div className="mb-6 flex items-center justify-center gap-2 text-white/40">
        <Mic size={16} />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Afinador</span>
      </div>

      <div className="mb-8 flex flex-col items-center justify-center">
        <div className={`mb-4 flex h-32 w-32 items-center justify-center rounded-[2.5rem] border-[6px] transition-all duration-300 ${
          isTuning 
            ? Math.abs(cents) < 5 
              ? 'border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-transparent shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]' 
              : 'border-sky-500/20 bg-gradient-to-b from-sky-500/10 to-transparent shadow-[0_0_40px_-10px_rgba(14,165,233,0.3)]'
            : 'border-white/[0.05] bg-white/[0.02]'
        }`}>
          <span className={`text-6xl font-black tracking-tighter ${
            isTuning 
              ? Math.abs(cents) < 5 
                ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]' 
                : 'text-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]' 
              : 'text-white/20'
          }`}>
            {note}
          </span>
        </div>
        
        <div className="w-full max-w-[200px]">
          <div className="relative mb-2 h-2 w-full rounded-full bg-white/10">
            <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-white/30" />
            <div 
              className={`absolute top-0 h-full w-2 -translate-x-1/2 rounded-full transition-all duration-100 ${
                Math.abs(cents) < 5 ? 'bg-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-sky-400'
              }`}
              style={{ left: `${50 + (cents / 50) * 50}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-white/40">
            <span>b</span>
            <span className={Math.abs(cents) < 5 ? 'text-emerald-400' : ''}>{isTuning ? `${cents > 0 ? '+' : ''}${cents}` : '0'}</span>
            <span>#</span>
          </div>
        </div>
      </div>

      <button 
        onClick={() => tunerActive ? stopTuner() : void startTuner()}
        className={`group relative w-full overflow-hidden rounded-2xl py-3 text-[11px] font-bold tracking-wide transition-all hover:scale-[1.02] active:scale-95 ${
          tunerActive 
            ? 'border border-white/[0.05] bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white' 
            : 'border border-sky-500/20 bg-gradient-to-r from-sky-500/20 to-sky-400/20 text-sky-400 shadow-[0_4px_12px_rgba(14,165,233,0.15)] hover:border-sky-500/40 hover:from-sky-500/30 hover:to-sky-400/30'
        }`}
      >
        {tunerActive ? 'DETENER AFINADOR' : 'INICIAR AFINADOR'}
        {!tunerActive && <div className="absolute -left-[100%] top-0 h-full w-[50%] skew-x-12 bg-gradient-to-r from-transparent via-sky-400/10 to-transparent transition-all duration-700 group-hover:left-[200%]" />}
      </button>
      {tunerError && <p className="mt-2 text-center text-xs text-rose-300">{tunerError}</p>}
      <button onClick={() => setPitch(null)} className="mt-4 flex w-full justify-center items-center gap-1 text-[10px] font-bold text-slate-500"><RotateCcw size={11} /> Reiniciar lectura</button>
    </div>
  );
}
