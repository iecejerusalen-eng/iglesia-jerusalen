import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Timer, Play, Pause, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { LessonBlock } from '../admin/BlockEditor';

/**
 * Retro flip-clock timer with SVG progress ring,
 * urgency effects, and celebration on completion.
 */

interface Props {
  block: LessonBlock;
  storageKey: string;
}

const RetroTimer = ({ block }: Props) => {
  const totalSeconds = block.timer_seconds || 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setHasFinished(true);
          toast.info('⏰ ¡Tiempo agotado! Fin del reto.');
          confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggleTimer = useCallback(() => {
    if (hasFinished) return;
    setIsRunning((prev) => !prev);
  }, [hasFinished]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(totalSeconds);
    setHasFinished(false);
  }, [totalSeconds]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const minStr = String(minutes);
  const secStr = String(seconds).padStart(2, '0');
  const isUrgent = timeLeft <= 10 && timeLeft > 0;
  const progress = timeLeft / totalSeconds;

  /* SVG ring dimensions */
  const ringSize = 180;
  const ringStroke = 6;
  const ringRadius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="glass-card rounded-2xl p-5 md:p-8 space-y-5 text-center">
      <p className="font-bold text-slate-900 dark:text-gray-100 text-sm md:text-base flex items-center justify-center gap-2">
        <Timer className="text-rose-600 dark:text-rose-400" size={20} />
        {block.question_text}
      </p>

      {/* Ring + digits */}
      <div className="relative inline-flex items-center justify-center mx-auto" style={{ width: ringSize, height: ringSize }}>
        {/* SVG progress ring */}
        <svg
          width={ringSize}
          height={ringSize}
          viewBox={`0 0 ${ringSize} ${ringSize}`}
          className="absolute inset-0 -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth={ringStroke}
            className="text-gray-200 dark:text-gray-800"
          />
          {/* Progress ring */}
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

        {/* Digit cards */}
        <div className="flex items-center gap-1.5 z-10">
          <div className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>
            {minStr}
          </div>
          <span className={`text-2xl font-black select-none ${
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

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={toggleTimer}
          disabled={hasFinished}
          className={`flex items-center gap-1.5 px-5 py-2.5 font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white'
          }`}
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
          {isRunning ? 'Pausar' : hasFinished ? 'Finalizado' : 'Iniciar'}
        </button>
        <button
          type="button"
          onClick={resetTimer}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white/60 dark:bg-slate-900/60 border border-rose-200 dark:border-rose-700/50 text-rose-700 dark:text-rose-300 rounded-xl font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer backdrop-blur-sm"
        >
          <RefreshCw size={14} /> Reiniciar
        </button>
      </div>

      {/* Finished message */}
      {hasFinished && (
        <div className="glass-card rounded-xl p-3 text-xs font-bold text-rose-700 dark:text-rose-300 animate-in fade-in duration-300">
          ⏰ ¡Tiempo completado! Pulsa "Reiniciar" para volver a empezar.
        </div>
      )}
    </div>
  );
};

export default RetroTimer;
