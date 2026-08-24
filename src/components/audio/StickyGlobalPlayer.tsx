import React, { useRef, useEffect } from 'react';
import { useAudioPlayerStore } from '../../store/useAudioPlayerStore';
import { Play, Pause, X, RotateCcw, RotateCw, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const StickyGlobalPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    speed,
    togglePlay,
    seek,
    setSpeed,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    close,
  } = useAudioPlayerStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => console.error('Play error:', err));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  if (!currentTrack) return null;

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-4 pointer-events-none"
      >
        <audio
          ref={audioRef}
          src={currentTrack.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />

        <div className="max-w-4xl mx-auto pointer-events-auto bg-slate-900/95 border border-amber-500/30 rounded-2xl shadow-2xl backdrop-blur-2xl text-white overflow-hidden">
          {/* Top Progress Bar */}
          <div
            className="w-full h-1 bg-white/10 cursor-pointer group relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              if (audioRef.current) {
                audioRef.current.currentTime = pos * duration;
                seek(pos * duration);
              }
            }}
          >
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-150"
            />
          </div>

          <div className="p-3 sm:px-5 flex items-center justify-between gap-4">
            {/* Track Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {currentTrack.cover_image_url ? (
                <img
                  src={currentTrack.cover_image_url}
                  alt={currentTrack.title}
                  className="w-11 h-11 rounded-lg object-cover border border-white/10 shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                  <Music className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{currentTrack.title}</h4>
                {currentTrack.subtitle && (
                  <p className="text-xs text-slate-300 truncate">{currentTrack.subtitle}</p>
                )}
              </div>
            </div>

            {/* Middle Controls */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <button
                onClick={() => {
                  const target = Math.max(0, currentTime - 15);
                  if (audioRef.current) audioRef.current.currentTime = target;
                  seek(target);
                }}
                className="hidden sm:block p-1.5 rounded-full hover:bg-white/10 text-slate-300"
                title="Retroceder 15s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-amber-500/20 active:scale-95 transition"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => {
                  const target = Math.min(duration, currentTime + 15);
                  if (audioRef.current) audioRef.current.currentTime = target;
                  seek(target);
                }}
                className="hidden sm:block p-1.5 rounded-full hover:bg-white/10 text-slate-300"
                title="Adelantar 15s"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <span className="hidden md:inline font-mono text-xs text-amber-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Speed & Close */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
                  const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
                  setSpeed(speeds[nextIdx]);
                }}
                className="px-2 py-0.5 rounded bg-white/10 font-mono text-xs text-amber-300 hover:bg-white/20"
              >
                {speed}x
              </button>

              <button
                onClick={close}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                title="Cerrar reproductor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
export default StickyGlobalPlayer;
