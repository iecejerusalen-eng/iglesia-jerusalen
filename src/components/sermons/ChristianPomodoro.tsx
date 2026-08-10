import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Play, Pause, RefreshCw, Volume2, VolumeX, Moon, Sun, Sparkles, BookOpen, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

/**
 * Web Audio API synthesizer for soft spiritual chime tone on phase completion.
 */
const playChimeTone = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Arpeggiated soft chime: C5 -> E5 -> G5 -> C6
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + idx * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 1.25);
    });
  } catch { /* Audio not allowed before user interaction */ }
};

export type PomodoroMode = 'meditation' | 'study' | 'prayer';

interface ModeConfig {
  id: PomodoroMode;
  title: string;
  subtitle: string;
  durationMinutes: number;
  icon: React.ElementType;
  color: string;
  badgeBg: string;
}

const MODES: ModeConfig[] = [
  {
    id: 'meditation',
    title: 'Meditación',
    subtitle: 'Escucha activa de la palabra',
    durationMinutes: 25,
    icon: Sparkles,
    color: '#f59e0b',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
  },
  {
    id: 'study',
    title: 'Estudio',
    subtitle: 'Toma de apuntes y versículos',
    durationMinutes: 15,
    icon: BookOpen,
    color: '#06b6d4',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800'
  },
  {
    id: 'prayer',
    title: 'Oración',
    subtitle: 'Gratitud y pausa espiritual',
    durationMinutes: 5,
    icon: Heart,
    color: '#ec4899',
    badgeBg: 'bg-pink-100 dark:bg-pink-950/60 text-pink-800 dark:text-pink-300 border-pink-300 dark:border-pink-800'
  }
];

interface Props {
  isFocusModeActive: boolean;
  onToggleFocusMode: () => void;
}

const ChristianPomodoro = ({ isFocusModeActive, onToggleFocusMode }: Props) => {
  const [activeMode, setActiveMode] = useState<PomodoroMode>('meditation');
  const currentConfig = MODES.find((m) => m.id === activeMode) || MODES[0];

  const [timeLeft, setTimeLeft] = useState(currentConfig.durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const soundRef = useRef(soundEnabled);
  useEffect(() => {
    soundRef.current = soundEnabled;
  }, [soundEnabled]);

  const handleSelectMode = (mode: PomodoroMode) => {
    setActiveMode(mode);
    const cfg = MODES.find((m) => m.id === mode);
    if (cfg) {
      setTimeLeft(cfg.durationMinutes * 60);
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setCompletedSessions((c) => c + 1);

          if (soundRef.current) playChimeTone();
          toast.success(`🕊️ ¡Fase de ${currentConfig.title} completada! Gloria a Dios.`);
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, currentConfig.title]);

  const toggleRun = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(currentConfig.durationMinutes * 60);
  }, [currentConfig.durationMinutes]);

  const totalSecs = currentConfig.durationMinutes * 60;
  const progress = totalSecs > 0 ? timeLeft / totalSecs : 0;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const minStr = String(minutes).padStart(2, '0');
  const secStr = String(seconds).padStart(2, '0');

  /* SVG Ring size */
  const ringSize = 210;
  const ringStroke = 7;
  const ringRadius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="glass-card rounded-2xl p-5 md:p-6 space-y-5 text-center border border-white/40 dark:border-white/10 shadow-xl overflow-hidden">
      {/* Header & Focus Dimmer Toggle */}
      <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-white/10 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-500" size={18} />
          <span className="font-bold text-sm text-slate-800 dark:text-gray-100 font-serif">Enfócate — Pomodoro Cristiano</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors cursor-pointer"
            title={soundEnabled ? 'Silenciar campanadas' : 'Activar campanadas'}
          >
            {soundEnabled ? <Volume2 size={16} className="text-amber-600 dark:text-amber-400" /> : <VolumeX size={16} />}
          </button>

          <button
            type="button"
            onClick={onToggleFocusMode}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isFocusModeActive
                ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                : 'bg-white/80 dark:bg-slate-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-700'
            }`}
            title="Oscurece el entorno de la página para concentrarte en la prédica"
          >
            {isFocusModeActive ? <Sun size={13} /> : <Moon size={13} />}
            <span>Modo Enfoque</span>
          </button>
        </div>
      </div>

      {/* Spiritual Mode Selectors */}
      <div className="grid grid-cols-3 gap-2">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => handleSelectMode(mode.id)}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                isActive
                  ? 'bg-white dark:bg-slate-800 border-amber-500 dark:border-amber-400 shadow-md scale-102'
                  : 'bg-white/50 dark:bg-slate-900/50 border-gray-200/60 dark:border-white/5 opacity-70 hover:opacity-100'
              }`}
            >
              <Icon size={16} style={{ color: mode.color }} />
              <span className="font-bold text-xs text-slate-800 dark:text-gray-200">{mode.title}</span>
              <span className="text-[10px] text-gray-400 font-semibold">{mode.durationMinutes}m</span>
            </button>
          );
        })}
      </div>

      {/* SVG Circular Ring & Digits */}
      <div className="relative inline-flex items-center justify-center mx-auto my-1" style={{ width: ringSize, height: ringSize }}>
        <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} className="absolute inset-0 -rotate-90">
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth={ringStroke}
            className="text-gray-200/60 dark:text-slate-800"
          />
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            fill="none"
            stroke={currentConfig.color}
            strokeWidth={ringStroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Center Display */}
        <div className="z-10 space-y-1">
          <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
            {minStr}:{secStr}
          </span>
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 max-w-[140px] mx-auto line-clamp-1">
            {currentConfig.subtitle}
          </p>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex justify-center items-center gap-3">
        <button
          type="button"
          onClick={toggleRun}
          className={`flex items-center gap-2 px-6 py-2.5 font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer text-white ${
            isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
          }`}
        >
          {isRunning ? <Pause size={15} /> : <Play size={15} />}
          <span>{isRunning ? 'Pausar' : 'Iniciar'}</span>
        </button>

        <button
          type="button"
          onClick={resetTimer}
          className="p-2.5 bg-white/70 dark:bg-slate-900/70 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
          title="Reiniciar temporizador"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Sessions Completed Indicator */}
      {completedSessions > 0 && (
        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 py-1 px-3 rounded-full inline-block">
          ✨ {completedSessions} {completedSessions === 1 ? 'sesión de enfoque completada' : 'sesiones de enfoque completadas'}
        </p>
      )}
    </div>
  );
};

export default ChristianPomodoro;
