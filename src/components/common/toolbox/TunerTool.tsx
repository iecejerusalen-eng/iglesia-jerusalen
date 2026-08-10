import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useToolboxStore } from '../../../store/useToolboxStore';
import { detectPitchYin, frequencyToNote, median, type PitchReading } from './audio/audioMath';

interface WebkitAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

type TunerStatus = 'idle' | 'requesting' | 'weak' | 'detected' | 'in-tune' | 'error';

function microphoneErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') return 'Permite el acceso al micrófono para usar el afinador.';
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') return 'No se encontró ningún micrófono disponible.';
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') return 'El micrófono está ocupado por otra aplicación.';
  }
  return error instanceof Error && error.message ? error.message : 'No fue posible iniciar el afinador en este dispositivo.';
}

export function TunerTool() {
  const [status, setStatus] = useState<TunerStatus>('idle');
  const [message, setMessage] = useState('El micrófono solo se usa mientras el afinador está activo.');
  const [pitch, setPitch] = useState<PitchReading | null>(null);
  const [concertA, setConcertA] = useState(440);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analysisTimerRef = useRef<number | null>(null);
  const frequenciesRef = useRef<number[]>([]);
  const missedReadingsRef = useRef(0);
  const sessionRef = useRef(0);
  const concertARef = useRef(concertA);

  useEffect(() => {
    concertARef.current = concertA;
  }, [concertA]);

  const stopTuner = useCallback((nextMessage = 'Afinador detenido. El micrófono está apagado.') => {
    sessionRef.current += 1;
    if (analysisTimerRef.current !== null) window.clearTimeout(analysisTimerRef.current);
    analysisTimerRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    analyserRef.current = null;
    frequenciesRef.current = [];
    missedReadingsRef.current = 0;
    setPitch(null);
    setStatus('idle');
    setMessage(nextMessage);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && streamRef.current) {
        stopTuner('Afinador pausado al ocultar la pestaña para proteger tu privacidad.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [stopTuner]);

  useEffect(() => useToolboxStore.subscribe((toolbox) => {
    if (streamRef.current && (!toolbox.isOpen || toolbox.isMinimized || toolbox.activePanel !== 'tuner')) {
      stopTuner('Afinador detenido al salir de la herramienta. El micrófono está apagado.');
    }
  }), [stopTuner]);

  useEffect(() => () => {
    stopTuner();
    const context = audioContextRef.current;
    if (context && context.state !== 'closed') {
      void context.close().catch((error: unknown) => console.error('No se pudo cerrar el contexto del afinador.', error));
    }
  }, [stopTuner]);

  const startTuner = async () => {
    stopTuner('Solicitando acceso al micrófono…');
    const session = sessionRef.current;
    setStatus('requesting');
    setMessage('Solicitando acceso al micrófono…');
    try {
      if (!window.isSecureContext) throw new Error('El afinador requiere una conexión segura (HTTPS).');
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Este navegador no ofrece acceso al micrófono.');
      const Context = window.AudioContext || (window as WebkitAudioWindow).webkitAudioContext;
      if (!Context) throw new Error('Web Audio API no está disponible en este navegador.');
      const context = !audioContextRef.current || audioContextRef.current.state === 'closed' ? new Context() : audioContextRef.current;
      audioContextRef.current = context;
      if (context.state === 'suspended') await context.resume();
      if (context.state !== 'running') throw new Error('El navegador no pudo activar el procesamiento de audio.');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false });
      if (session !== sessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const analyser = context.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;
      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);
      streamRef.current = stream;
      analyserRef.current = analyser;
      sourceRef.current = source;
      setStatus('weak');
      setMessage('Micrófono activo. Toca una nota sostenida cerca del dispositivo.');

      const buffer = new Float32Array(analyser.fftSize);
      const analyze = () => {
        if (session !== sessionRef.current || !stream.active) {
          if (session === sessionRef.current) stopTuner('El micrófono dejó de estar disponible.');
          return;
        }
        analyser.getFloatTimeDomainData(buffer);
        const detected = detectPitchYin(buffer, context.sampleRate);
        if (detected === null) {
          missedReadingsRef.current += 1;
          if (missedReadingsRef.current >= 4) {
            frequenciesRef.current = [];
            setPitch(null);
            setStatus('weak');
            setMessage('Señal débil: acerca el instrumento y toca una nota sostenida.');
          }
        } else {
          missedReadingsRef.current = 0;
          frequenciesRef.current = [...frequenciesRef.current, detected].slice(-5);
          const smoothed = median(frequenciesRef.current);
          const reading = smoothed === null ? null : frequencyToNote(smoothed, concertARef.current);
          setPitch(reading);
          if (reading) {
            const tuned = Math.abs(reading.cents) <= 5;
            setStatus(tuned ? 'in-tune' : 'detected');
            setMessage(tuned ? 'Afinado' : reading.cents < 0 ? 'La nota está baja; sube la afinación.' : 'La nota está alta; baja la afinación.');
          }
        }
        analysisTimerRef.current = window.setTimeout(analyze, 40);
      };
      analyze();
    } catch (error) {
      if (session !== sessionRef.current) return;
      console.error('No se pudo activar el afinador.', error);
      const errorMessage = microphoneErrorMessage(error);
      stopTuner(errorMessage);
      setStatus('error');
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  const resetReading = () => {
    frequenciesRef.current = [];
    missedReadingsRef.current = 0;
    setPitch(null);
    if (streamRef.current) {
      setStatus('weak');
      setMessage('Lectura reiniciada. Toca una nota sostenida.');
    }
  };

  const isActive = status === 'weak' || status === 'detected' || status === 'in-tune';
  const cents = pitch?.cents ?? 0;
  const markerPosition = Math.max(0, Math.min(100, 50 + cents));
  const note = pitch ? `${pitch.name}${pitch.octave}` : '—';
  const toneClass = status === 'in-tune' ? 'text-emerald-300' : pitch ? 'text-sky-300' : 'text-white/30';

  return (
    <div className="px-4 pb-5 pt-2">
      <div className="mb-4 flex items-center justify-center gap-2 text-white/60">
        {isActive ? <Mic size={17} aria-hidden="true" /> : <MicOff size={17} aria-hidden="true" />}
        <span className="text-xs font-bold uppercase tracking-[0.18em]">Afinador cromático</span>
        {isActive && <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" aria-label="Micrófono activo" />}
      </div>

      <div className="mb-5 flex flex-col items-center">
        <div className={`mb-3 flex h-28 w-32 flex-col items-center justify-center rounded-[2rem] border-[5px] transition-colors ${status === 'in-tune' ? 'border-emerald-400/30 bg-emerald-400/10' : pitch ? 'border-sky-400/30 bg-sky-400/10' : 'border-white/10 bg-white/[0.03]'}`} aria-live="polite">
          <span className={`text-5xl font-black tracking-tight ${toneClass}`}>{note}</span>
          <span className="text-[11px] font-semibold text-white/55">{pitch ? `${pitch.frequency.toFixed(1)} Hz` : 'Esperando nota'}</span>
        </div>

        <div className="w-full max-w-[240px]" role="meter" aria-label="Desviación de afinación" aria-valuemin={-50} aria-valuemax={50} aria-valuenow={cents}>
          <div className="relative mb-2 h-3 rounded-full bg-gradient-to-r from-sky-500/30 via-emerald-400/30 to-sky-500/30">
            <div className="absolute left-1/2 top-[-3px] h-[18px] w-px bg-white/60" />
            <div className={`absolute top-1/2 h-5 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left] duration-100 ${status === 'in-tune' ? 'bg-emerald-300' : 'bg-sky-300'}`} style={{ left: `${markerPosition}%` }} />
          </div>
          <div className="flex justify-between text-xs font-semibold text-white/55"><span>−50¢</span><span className={toneClass}>{pitch ? `${cents > 0 ? '+' : ''}${cents}¢` : '0¢'}</span><span>+50¢</span></div>
          <p className="mt-2 text-center text-xs text-white/55">Objetivo: {pitch ? `${pitch.target.toFixed(1)} Hz` : '—'}</p>
        </div>
      </div>

      <label className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/65">
        Calibración A4
        <span className="flex items-center gap-2">
          <input aria-label="Frecuencia de calibración A4" type="range" min="430" max="450" step="1" value={concertA} onChange={(event) => setConcertA(Number(event.target.value))} className="w-24 accent-sky-400" />
          <output className="w-12 text-right tabular-nums text-white">{concertA} Hz</output>
        </span>
      </label>

      <button type="button" onClick={() => isActive ? stopTuner() : void startTuner()} disabled={status === 'requesting'} aria-pressed={isActive} className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border py-3 text-xs font-bold transition-colors disabled:cursor-wait disabled:opacity-60 ${isActive ? 'border-rose-400/20 bg-rose-400/10 text-rose-200' : 'border-sky-400/25 bg-sky-400/15 text-sky-300'}`}>
        {isActive ? <MicOff size={17} aria-hidden="true" /> : <Mic size={17} aria-hidden="true" />}
        {status === 'requesting' ? 'SOLICITANDO PERMISO…' : isActive ? 'DETENER Y APAGAR MICRÓFONO' : 'INICIAR AFINADOR'}
      </button>
      <p className={`mt-2 min-h-9 text-center text-xs leading-5 ${status === 'error' ? 'text-rose-300' : status === 'in-tune' ? 'text-emerald-300' : 'text-white/55'}`} role={status === 'error' ? 'alert' : 'status'} aria-live="polite">{message}</p>
      <button type="button" onClick={resetReading} disabled={!isActive} className="mt-1 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-white/55 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"><RotateCcw size={14} aria-hidden="true" /> Reiniciar lectura</button>
    </div>
  );
}
