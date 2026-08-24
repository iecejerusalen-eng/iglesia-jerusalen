import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX,
  List, Sparkles, Clock, Music, ChevronDown, ChevronUp
} from 'lucide-react';
import type { AudioChapter } from '../../features/podcast/types';

interface WaveformPlayerProps {
  audioUrl: string;
  title: string;
  subtitle?: string;
  coverUrl?: string;
  chapters?: AudioChapter[];
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  className?: string;
}

export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  audioUrl,
  title,
  subtitle,
  coverUrl,
  chapters = [],
  onTimeUpdate,
  onEnded,
  className = '',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showChapters, setShowChapters] = useState(false);
  const [isHoveredWave, setIsHoveredWave] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [liveWaveform, setLiveWaveform] = useState<number[] | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const fallbackWaveform = useMemo(() => {
    // Generate deterministic pseudo-random heights based on index
    const bars: number[] = [];
    for (let i = 0; i < 60; i++) {
      const height = Math.sin(i * 0.35) * 0.35 + Math.cos(i * 0.15) * 0.35 + 0.3;
      bars.push(Math.min(0.95, Math.max(0.15, height)));
    }
    return bars;
  }, []);
  const waveformBars = liveWaveform || fallbackWaveform;

  const stopWaveformReader = () => {
    if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  };

  const readLiveWaveform = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    const bars = Array.from({ length: 60 }, (_, index) => {
      const start = Math.floor(index * data.length / 60);
      const end = Math.max(start + 1, Math.floor((index + 1) * data.length / 60));
      let energy = 0;
      for (let i = start; i < end; i += 1) energy += Math.abs(data[i] - 128);
      return Math.max(0.12, Math.min(1, energy / ((end - start) * 46)));
    });
    setLiveWaveform(bars);
    animationFrameRef.current = window.requestAnimationFrame(readLiveWaveform);
  };

  const startWaveformReader = () => {
    const audio = audioRef.current;
    if (!audio || typeof window === 'undefined' || !('AudioContext' in window)) return;
    try {
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;
      const context = audioContextRef.current || new AudioContextCtor();
      audioContextRef.current = context;
      if (!sourceRef.current) {
        sourceRef.current = context.createMediaElementSource(audio);
        analyserRef.current = context.createAnalyser();
        analyserRef.current.fftSize = 256;
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(context.destination);
      }
      void context.resume();
      stopWaveformReader();
      readLiveWaveform();
    } catch (error) {
      console.warn('No fue posible activar el waveform dinámico; se conserva la vista de respaldo.', error);
    }
  };

  useEffect(() => () => {
    stopWaveformReader();
    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    void audioContextRef.current?.close();
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().then(startWaveformReader).catch(err => console.error("Audio playback error:", err));
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const curr = audioRef.current.currentTime;
    setCurrentTime(curr);
    if (onTimeUpdate) onTimeUpdate(curr);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const handleSeek = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(seconds, duration));
    setCurrentTime(audioRef.current.currentTime);
  };

  const skipTime = (seconds: number) => {
    handleSeek(currentTime + seconds);
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextIdx]);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Find active chapter based on current time
  const currentChapter = useMemo(() => {
    if (!chapters || chapters.length === 0) return null;
    const sorted = [...chapters].sort((a, b) => a.seconds - b.seconds);
    let active = sorted[0];
    for (const ch of sorted) {
      if (currentTime >= ch.seconds) {
        active = ch;
      } else {
        break;
      }
    }
    return active;
  }, [chapters, currentTime]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/20 p-5 shadow-2xl backdrop-blur-xl text-white ${className}`}>
      <audio
        ref={audioRef}
        src={audioUrl}
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          stopWaveformReader();
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onPause={stopWaveformReader}
      />

      <div className="flex flex-col md:flex-row items-center gap-5">
        {/* Cover / Icon */}
        <div className="relative group shrink-0">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={title}
              className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover shadow-lg border border-white/10 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg border border-white/10">
              <Music className="w-10 h-10 text-white/80" />
            </div>
          )}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
              <span className="flex gap-1 items-end h-5">
                <span className="w-1 bg-amber-400 animate-bounce h-full rounded-full" />
                <span className="w-1 bg-amber-400 animate-bounce delay-150 h-3/4 rounded-full" />
                <span className="w-1 bg-amber-400 animate-bounce delay-300 h-1/2 rounded-full" />
              </span>
            </div>
          )}
        </div>

        {/* Info & Waveform Area */}
        <div className="flex-1 w-full space-y-3">
          {/* Header & Title */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3 h-3 text-amber-400" /> Podcast & Sermon Audio
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight mt-1 line-clamp-1">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-300 line-clamp-1 font-medium">{subtitle}</p>
              )}
            </div>

            {/* Current Chapter Badge */}
            {currentChapter && (
              <button
                onClick={() => setShowChapters(!showChapters)}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-amber-300 border border-amber-400/20 transition"
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="max-w-[130px] truncate font-medium">{currentChapter.title}</span>
                {showChapters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Interactive Waveform Bar */}
          <div
            className="relative h-12 flex items-center gap-0.5 cursor-pointer group py-2"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              setHoverPosition(pos);
              setIsHoveredWave(true);
            }}
            onMouseLeave={() => setIsHoveredWave(false)}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              handleSeek(pos * duration);
            }}
          >
            {waveformBars.map((height, i) => {
              const barPercent = (i / waveformBars.length) * 100;
              const isPlayed = barPercent <= progressPercent;
              const isHovered = isHoveredWave && (i / waveformBars.length) <= hoverPosition;

              return (
                <div
                  key={i}
                  className="flex-1 h-full flex items-center justify-center"
                >
                  <div
                    style={{ height: `${height * 100}%` }}
                    className={`w-full rounded-full transition-all duration-150 ${
                      isPlayed
                        ? 'bg-gradient-to-t from-amber-400 to-amber-300 shadow-sm shadow-amber-500/50'
                        : isHovered
                        ? 'bg-indigo-300/70'
                        : 'bg-white/20'
                    }`}
                  />
                </div>
              );
            })}

            {/* Hover timestamp tooltip */}
            {isHoveredWave && duration > 0 && (
              <div
                style={{ left: `${hoverPosition * 100}%` }}
                className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 bg-slate-800 text-[10px] font-mono text-amber-300 rounded shadow-md border border-amber-500/30 pointer-events-none z-10"
              >
                {formatTime(hoverPosition * duration)}
              </div>
            )}
          </div>

          {/* Time & Controls Row */}
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-mono text-amber-400 font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Main Player Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => skipTime(-15)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
                title="Retroceder 15 segundos"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handlePlayPause}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-transform"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => skipTime(15)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
                title="Adelantar 15 segundos"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Speed & Chapters & Volume */}
            <div className="flex items-center gap-2">
              {/* Playback speed */}
              <button
                onClick={cycleSpeed}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 font-mono font-bold text-[11px] text-amber-300 transition"
                title="Cambiar velocidad"
              >
                {playbackRate}x
              </button>

              {/* Chapters Toggle */}
              {chapters.length > 0 && (
                <button
                  onClick={() => setShowChapters(!showChapters)}
                  className={`p-1.5 rounded transition ${
                    showChapters ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/10 text-slate-300'
                  }`}
                  title="Ver Capítulos"
                >
                  <List className="w-4 h-4" />
                </button>
              )}

              {/* Volume Button */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition"
                title={isMuted ? 'Activar Sonido' : 'Silenciar'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Dropdown Drawer */}
      {showChapters && chapters.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10 animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Capítulos & Marcadores
            </h4>
            <span className="text-[11px] text-slate-400">{chapters.length} secciones</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {chapters.map((ch, idx) => {
              const isActive = currentChapter?.id === ch.id;
              return (
                <button
                  key={ch.id || idx}
                  onClick={() => {
                    handleSeek(ch.seconds);
                    if (!isPlaying) handlePlayPause();
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg text-left text-xs transition ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                      : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-transparent'
                  }`}
                >
                  <span className="truncate pr-2">{ch.title}</span>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">
                    {formatTime(ch.seconds)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
export default WaveformPlayer;
