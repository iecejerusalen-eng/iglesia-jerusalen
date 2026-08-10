import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Timer, Play, Pause, RefreshCw, Volume2, VolumeX, Plus, Minus } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { LessonBlock } from '../admin/BlockEditor';

/**
 * Web Audio API synthesizer for clean sound feedback without external MP3s.
 */
const playBeep = (freq = 800, duration = 0.15, type: OscillatorType = 'sine') => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch { /* Audio not allowed before gesture */ }
};

interface Props {
  block: LessonBlock;
  storageKey?: string;
}

const RetroTimer = ({ block }: Props) => {
  const initialSeconds = block.timer_seconds || 60;
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setHasFinished(true);
          if (soundEnabledRef.current) {
            playBeep(880, 0.4, 'triangle');
            setTimeout(() => playBeep(1174.66, 0.6, 'sine'), 150);
          }
          toast.info('⏰ ¡Tiempo agotado! Fin del reto.');
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
          return 0;
        }

        // Ticking audio feedback during last 5 seconds
        if (prev <= 6 && soundEnabledRef.current) {
          playBeep(600, 0.08, 'sine');
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggleTimer = useCallback(() => {
    if (hasFinished) return;
    if (!isRunning && soundEnabled) playBeep(523.25, 0.1, 'sine');
    setIsRunning((prev) => !prev);
  }, [hasFinished, isRunning, soundEnabled]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(totalSeconds);
    setHasFinished(false);
  }, [totalSeconds]);

  const adjustTime = (delta: number) => {
    if (isRunning) return;
    const newTime = Math.max(5, Math.min(3600, timeLeft + delta));
    setTimeLeft(newTime);
    setTotalSeconds(newTime);
    setHasFinished(false);
  };

  const setPreset = (sec: number) => {
    if (isRunning) return;
    setTimeLeft(sec);
    setTotalSeconds(sec);
    setHasFinished(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const minStr = String(minutes).padStart(2, '0');
  const secStr = String(seconds).padStart(2, '0');

  const isUrgent = timeLeft <= 10 && timeLeft > 0;
  const progress = totalSeconds > 0 ? timeLeft / totalSeconds : 0;

  /* SVG ring dimensions - 240px width ensures NO overlap with digit cards */
  const ringSize = 240;
  const ringStroke = 8;
  const ringRadius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6 text-center">
      {/* Question Header & Sound Toggle */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-200/50 dark:border-white/10 pb-3">
        <p className="font-bold text-slate-900 dark:text-gray-100 text-sm md:text-base flex items-center gap-2">
          <Timer className="text-rose-600 dark:text-rose-400 shrink-0" size={20} />
          {block.question_text || 'Reto con Tiempo'}
        </p>

        <button
          type="button"
          onClick={() => setSoundEnabled((prev) => !prev)}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
        >
          {soundEnabled ? <Volume2 size={18} className="text-rose-600 dark:text-rose-400" /> : <VolumeX size={18} />}
        </button>
      </div>

      {/* SVG Ring Container (240px wide to fit 4 digit cards inside without overlapping) */}
      <div className="relative inline-flex items-center justify-center mx-auto" style={{ width: ringSize, height: ringSize }}>
        <svg
          width={ringSize}
          height={ringSize}
          viewBox={`0 0 ${ringSize} ${ringSize}`}
          className="absolute inset-0 -rotate-90 drop-shadow-md"
        >
          {/* Background Track */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth={ringStroke}
            className="text-gray-200/70 dark:text-slate-800"
          />
          {/* Progress Ring */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            fill="none"
            strokeWidth={ringStroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={`transition-all duration-1000 ease-linear ${
              hasFinished
                ? 'stroke-gray-400 dark:stroke-gray-600'
                : isUrgent
                ? 'stroke-red-500 dark:stroke-red-400'
                : 'stroke-rose-500 dark:stroke-rose-400'
            }`}
          />
        </svg>

        {/* Digit Cards (Fits nicely inside the 240px ring without touching the circle border) */}
        <div className="flex items-center justify-center gap-1 z-10">
          <div className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>
            {minStr[0]}
          </div>
          <div className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>
            {minStr[1]}
          </div>
          <span className={`text-xl font-black select-none px-0.5 ${
            isUrgent ? 'text-red-500 dark:text-red-400 animate-pulse' : 'text-slate-400 dark:text-gray-500'
          }`}>
            :
          </span>
          <div className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>
            {secStr[0]}
          </div>
          <div className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>
            {secStr[1]}
          </div>
        </div>
      </div>

      {/* Adjust & Presets */}
      {!isRunning && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => adjustTime(-15)}
            className="px-2.5 py-1 bg-white/70 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer flex items-center gap-1"
          >
            <Minus size={12} /> 15s
          </button>
          <button
            type="button"
            onClick={() => setPreset(30)}
            className="px-2.5 py-1 bg-white/70 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
          >
            30s
          </button>
          <button
            type="button"
            onClick={() => setPreset(60)}
            className="px-2.5 py-1 bg-white/70 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
          >
            1 min
          </button>
          <button
            type="button"
            onClick={() => setPreset(300)}
            className="px-2.5 py-1 bg-white/70 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
          >
            5 min
          </button>
          <button
            type="button"
            onClick={() => adjustTime(15)}
            className="px-2.5 py-1 bg-white/70 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer flex items-center gap-1"
          >
            <Plus size={12} /> 15s
          </button>
        </div>
      )}

      {/* Main Action Buttons */}
      <div className="flex justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={toggleTimer}
          disabled={hasFinished}
          className={`flex items-center gap-2 px-6 py-3 font-bold rounded-2xl text-xs shadow-md transition-all transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white'
          }`}
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
          {isRunning ? 'Pausar' : hasFinished ? 'Finalizado' : 'Iniciar Reto'}
        </button>
        <button
          type="button"
          onClick={resetTimer}
          className="flex items-center gap-1.5 px-4 py-3 bg-white/70 dark:bg-slate-900/70 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 rounded-2xl font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer backdrop-blur-sm"
        >
          <RefreshCw size={14} /> Reiniciar
        </button>
      </div>

      {/* Finished message */}
      {hasFinished && (
        <div className="glass-card rounded-xl p-3 text-xs font-bold text-rose-700 dark:text-rose-300 animate-in fade-in duration-300">
          ⏰ ¡Tiempo completado! Pulsa "Reiniciar" para volver a intentar.
        </div>
      )}
    </div>
  );
};

export default RetroTimer;
