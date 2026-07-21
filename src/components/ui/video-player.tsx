"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, Volume1, VolumeX, Maximize, Minimize, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const CustomSlider = ({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) => {
  return (
    <motion.div
      className={cn(
        "relative w-full h-1.5 bg-white/20 hover:h-2 transition-all rounded-full cursor-pointer",
        className
      )}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        onChange(Math.min(Math.max(percentage, 0), 100));
      }}
    >
      <motion.div
        className="absolute top-0 left-0 h-full bg-amber-400 rounded-full"
        style={{ width: `${value}%` }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    </motion.div>
  );
};

export interface VideoPlayerProps {
  src?: string | null;
  youtubeUrl?: string | null;
  poster?: string | null;
  title?: string | null;
  className?: string;
  autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  youtubeUrl,
  poster,
  title,
  className,
  autoPlay = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [hasStarted, setHasStarted] = useState(autoPlay);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if input source or youtubeUrl is a YouTube video
  const targetYouTubeId = extractYouTubeId(youtubeUrl || "") || extractYouTubeId(src || "");
  const externalYouTubeLink = youtubeUrl || (extractYouTubeId(src || "") ? src : null);

  // Helper to send postMessage commands to YouTube iframe
  const sendYouTubeCommand = useCallback((func: string, args: unknown[] | unknown = "") => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*"
      );
    }
  }, []);

  const togglePlay = () => {
    if (!hasStarted) {
      setHasStarted(true);
      setIsPlaying(true);
      return;
    }

    if (targetYouTubeId) {
      if (isPlaying) {
        sendYouTubeCommand("pauseVideo");
        setIsPlaying(false);
      } else {
        sendYouTubeCommand("playVideo");
        setIsPlaying(true);
      }
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleVolumeChange = (value: number) => {
    const newVolume = value / 100;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    if (targetYouTubeId) {
      sendYouTubeCommand("setVolume", [value]);
      if (newVolume === 0) sendYouTubeCommand("mute");
      else sendYouTubeCommand("unMute");
    } else if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleTimeUpdate = () => {
    if (!targetYouTubeId && videoRef.current) {
      const prog = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(isFinite(prog) ? prog : 0);
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (value: number) => {
    if (targetYouTubeId && duration) {
      const time = (value / 100) * duration;
      if (isFinite(time)) {
        sendYouTubeCommand("seekTo", [time, true]);
        setProgress(value);
        setCurrentTime(time);
      }
    } else if (videoRef.current && videoRef.current.duration) {
      const time = (value / 100) * videoRef.current.duration;
      if (isFinite(time)) {
        videoRef.current.currentTime = time;
        setProgress(value);
      }
    }
  };

  const toggleMute = () => {
    const nextMuteState = !isMuted;
    setIsMuted(nextMuteState);

    if (targetYouTubeId) {
      if (nextMuteState) {
        sendYouTubeCommand("mute");
      } else {
        sendYouTubeCommand("unMute");
        sendYouTubeCommand("setVolume", [volume * 100 || 100]);
      }
    } else if (videoRef.current) {
      videoRef.current.muted = nextMuteState;
      if (!nextMuteState && volume === 0) {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  };

  const setSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (targetYouTubeId) {
      sendYouTubeCommand("setPlaybackRate", [speed]);
    } else if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, []);

  // Listen to YouTube postMessage events for time and state updates
  useEffect(() => {
    if (!targetYouTubeId) return;

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === "infoDelivery" && data.info) {
          if (data.info.currentTime !== undefined) {
            setCurrentTime(data.info.currentTime);
            if (duration > 0) {
              setProgress((data.info.currentTime / duration) * 100);
            }
          }
          if (data.info.duration !== undefined && data.info.duration > 0) {
            setDuration(data.info.duration);
          }
          if (data.info.playerState !== undefined) {
            if (data.info.playerState === 1) setIsPlaying(true); // playing
            if (data.info.playerState === 2) setIsPlaying(false); // paused
          }
        }
      } catch {
        // ignore non-json messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [targetYouTubeId, duration]);

  // If it's a YouTube video
  if (targetYouTubeId) {
    const youtubeHref = externalYouTubeLink || `https://www.youtube.com/watch?v=${targetYouTubeId}`;
    const defaultThumbnail = poster || `https://img.youtube.com/vi/${targetYouTubeId}/maxresdefault.jpg`;

    return (
      <motion.div
        ref={containerRef}
        className={cn(
          "relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800/80 group select-none",
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* YouTube Embed / Cover Container */}
        <div className="relative pt-[56.25%] w-full bg-black">
          {hasStarted ? (
            <>
              <iframe
                ref={iframeRef}
                className="absolute inset-0 w-full h-full border-0 pointer-events-none scale-[1.02]"
                src={`https://www.youtube.com/embed/${targetYouTubeId}?autoplay=1&enablejsapi=1&controls=0&modestbranding=1&rel=0&disablekb=1&iv_load_policy=3&playsinline=1`}
                title={title || "Reproductor de Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                onLoad={() => {
                  sendYouTubeCommand("listening");
                }}
              />
              {/* Click layer overlay over iframe when playing or paused to toggle play/pause */}
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={togglePlay}
              />
            </>
          ) : (
            <div
              className="absolute inset-0 w-full h-full cursor-pointer group/cover"
              onClick={() => {
                setHasStarted(true);
                setIsPlaying(true);
              }}
            >
              {/* Custom Thumbnail Image */}
              <img
                src={defaultThumbnail}
                alt={title || "Video thumbnail"}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/cover:scale-105"
                onError={(e) => {
                  if (e.currentTarget.src.includes("maxresdefault")) {
                    e.currentTarget.src = `https://img.youtube.com/vi/${targetYouTubeId}/hqdefault.jpg`;
                  }
                }}
              />

              {/* Dark Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent transition-opacity duration-300 group-hover/cover:from-slate-950/90" />

              {/* Custom Big Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-2xl transition-all duration-300 group-hover/cover:scale-110 group-hover/cover:bg-amber-300">
                  <Play className="h-8 w-8 fill-current text-slate-950 ml-1" />
                </div>
              </div>

              {/* Title overlay at bottom */}
              {title && (
                <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight drop-shadow-md">{title}</h3>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top Floating Bar for YouTube Link */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          <a
            href={youtubeHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
            title="Ver directamente en YouTube"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span>Ver en YouTube</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-90" />
          </a>
        </div>

        {/* Center Big Play Button overlay if paused after having started */}
        {hasStarted && !isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all z-20 cursor-pointer"
          >
            <Play className="w-8 h-8 fill-current ml-1" />
          </button>
        )}

        {/* Custom Controls Overlay for YouTube */}
        <AnimatePresence>
          {(showControls || !isPlaying) && hasStarted && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 p-4 m-3 bg-[#111111c2] backdrop-blur-md rounded-2xl border border-white/10 z-30"
              initial={{ y: 20, opacity: 0, filter: "blur(10px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: 20, opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: "circInOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-white/80 text-xs font-mono">
                  {formatTime(currentTime)}
                </span>
                <CustomSlider
                  value={progress}
                  onChange={handleSeek}
                  className="flex-1"
                />
                <span className="text-white/80 text-xs font-mono">{formatTime(duration)}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      onClick={togglePlay}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 hover:text-white"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>
                  </motion.div>
                  <div className="flex items-center gap-x-1">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        onClick={toggleMute}
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/10 hover:text-white"
                      >
                        {isMuted ? (
                          <VolumeX className="h-5 w-5" />
                        ) : volume > 0.5 ? (
                          <Volume2 className="h-5 w-5" />
                        ) : (
                          <Volume1 className="h-5 w-5" />
                        )}
                      </Button>
                    </motion.div>

                    <div className="w-20 hidden sm:block">
                      <CustomSlider
                        value={volume * 100}
                        onChange={handleVolumeChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  {[0.5, 1, 1.5, 2].map((speed) => (
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      key={speed}
                    >
                      <Button
                        onClick={() => setSpeed(speed)}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "text-xs px-2 h-8 text-white/80 hover:bg-white/10 hover:text-white",
                          playbackSpeed === speed && "bg-white/20 text-white font-bold"
                        )}
                      >
                        {speed}x
                      </Button>
                    </motion.div>
                  ))}

                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      onClick={toggleFullscreen}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 hover:text-white"
                    >
                      {isFullscreen ? (
                        <Minimize className="h-4 w-4" />
                      ) : (
                        <Maximize className="h-4 w-4" />
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // HTML5 Video Player for Direct Video Files (MP4, WebM, etc.)
  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden bg-[#11111198] shadow-2xl backdrop-blur-sm border border-white/10 group select-none",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full aspect-video object-cover cursor-pointer"
        onTimeUpdate={handleTimeUpdate}
        src={src || undefined}
        poster={poster || undefined}
        onClick={togglePlay}
        autoPlay={autoPlay}
      />

      {/* Top Header if Title or External YouTube link exists */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {title ? (
          <span className="text-xs font-bold text-white/90 bg-black/60 px-3 py-1.5 rounded-xl backdrop-blur-md">
            {title}
          </span>
        ) : <div />}

        {externalYouTubeLink && (
          <a
            href={externalYouTubeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg backdrop-blur-md transition-all hover:scale-105"
            title="Abrir en YouTube"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span>Ver en YouTube</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-90" />
          </a>
        )}
      </div>

      {/* Center Big Play Button overlay if paused */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all z-10 cursor-pointer"
        >
          <Play className="w-8 h-8 fill-current ml-1" />
        </button>
      )}

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-4 m-3 bg-[#111111c2] backdrop-blur-md rounded-2xl border border-white/10 z-20"
            initial={{ y: 20, opacity: 0, filter: "blur(10px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: 20, opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: "circInOut" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-white/80 text-xs font-mono">
                {formatTime(currentTime)}
              </span>
              <CustomSlider
                value={progress}
                onChange={handleSeek}
                className="flex-1"
              />
              <span className="text-white/80 text-xs font-mono">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    onClick={togglePlay}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 hover:text-white"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                </motion.div>
                <div className="flex items-center gap-x-1">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      onClick={toggleMute}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 hover:text-white"
                    >
                      {isMuted ? (
                        <VolumeX className="h-5 w-5" />
                      ) : volume > 0.5 ? (
                        <Volume2 className="h-5 w-5" />
                      ) : (
                        <Volume1 className="h-5 w-5" />
                      )}
                    </Button>
                  </motion.div>

                  <div className="w-20 hidden sm:block">
                    <CustomSlider
                      value={volume * 100}
                      onChange={handleVolumeChange}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                {[0.5, 1, 1.5, 2].map((speed) => (
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    key={speed}
                  >
                    <Button
                      onClick={() => setSpeed(speed)}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "text-xs px-2 h-8 text-white/80 hover:bg-white/10 hover:text-white",
                        playbackSpeed === speed && "bg-white/20 text-white font-bold"
                      )}
                    >
                      {speed}x
                    </Button>
                  </motion.div>
                ))}

                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    onClick={toggleFullscreen}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 hover:text-white"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-4 w-4" />
                    ) : (
                      <Maximize className="h-4 w-4" />
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export { VideoPlayer };
export default VideoPlayer;
