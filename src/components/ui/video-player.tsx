"use client";

import React, { useRef, useState, useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, Volume1, VolumeX, Maximize, Minimize, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Official YouTube IFrame API Type Declarations
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        config: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (suggestedRate: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

const loadYouTubeIframeApi = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    const existingScript = document.getElementById("youtube-iframe-api");
    if (!existingScript) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      tag.onerror = () => reject(new Error("Failed to load YouTube SDK"));
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const previousOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousOnReady) previousOnReady();
      resolve();
    };

    const checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    // Safety timeout of 5s
    setTimeout(() => {
      if (window.YT && window.YT.Player) {
        resolve();
      } else {
        clearInterval(checkInterval);
        resolve(); // resolve anyway to attempt fallback
      }
    }, 5000);
  });
};

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00";
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
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const updateValue = (clientX: number) => {
      if (rect.width === 0) return;
      const x = clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      onChange(Math.min(Math.max(percentage, 0), 100));
    };

    updateValue(e.clientX);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      updateValue(moveEvent.clientX);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={cn(
        "relative w-full h-2.5 bg-white/20 hover:h-3 transition-all rounded-full cursor-pointer touch-none flex items-center group/slider select-none",
        className
      )}
      onPointerDown={handlePointerDown}
    >
      <div
        className="absolute top-0 left-0 h-full bg-amber-400 rounded-full transition-all duration-75"
        style={{ width: `${clampedValue}%` }}
      />
      <div
        className="absolute w-3.5 h-3.5 bg-amber-300 border-2 border-slate-900 rounded-full shadow-md transition-transform scale-0 group-hover/slider:scale-100 -translate-x-1/2"
        style={{ left: `${clampedValue}%` }}
      />
    </div>
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
  const playerRef = useRef<YTPlayer | null>(null);

  const reactId = useId();
  const uniquePlayerId = `yt-player-${reactId.replace(/:/g, "")}`;

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
  const [useFallbackEmbed, setUseFallbackEmbed] = useState(false);

  const targetYouTubeId = extractYouTubeId(youtubeUrl || "") || extractYouTubeId(src || "");
  const externalYouTubeLink = youtubeUrl || (extractYouTubeId(src || "") ? src : null);

  const togglePlay = () => {
    if (!hasStarted) {
      setHasStarted(true);
      setIsPlaying(true);
      return;
    }

    if (targetYouTubeId && playerRef.current && !useFallbackEmbed) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
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
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (value: number) => {
    const newVolume = value / 100;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    if (targetYouTubeId && playerRef.current && !useFallbackEmbed) {
      playerRef.current.setVolume(value);
      if (newVolume === 0) playerRef.current.mute();
      else playerRef.current.unMute();
    } else if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleTimeUpdate = () => {
    if (!targetYouTubeId && videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration || 0;
      setCurrentTime(current);
      setDuration(total);
      if (total > 0) {
        setProgress((current / total) * 100);
      }
    }
  };

  const handleSeek = (value: number) => {
    const targetPercentage = Math.min(Math.max(value, 0), 100);
    setProgress(targetPercentage);

    if (targetYouTubeId && playerRef.current && duration > 0 && !useFallbackEmbed) {
      const targetTime = (targetPercentage / 100) * duration;
      setCurrentTime(targetTime);
      playerRef.current.seekTo(targetTime, true);
    } else if (videoRef.current && videoRef.current.duration) {
      const targetTime = (targetPercentage / 100) * videoRef.current.duration;
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const toggleMute = () => {
    const nextMuteState = !isMuted;
    setIsMuted(nextMuteState);

    if (targetYouTubeId && playerRef.current && !useFallbackEmbed) {
      if (nextMuteState) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume * 100 || 100);
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
    if (targetYouTubeId && playerRef.current && !useFallbackEmbed) {
      playerRef.current.setPlaybackRate(speed);
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

  // Initialize YouTube Official IFrame API Player
  useEffect(() => {
    if (!targetYouTubeId || !hasStarted) return;

    let isMounted = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    loadYouTubeIframeApi()
      .then(() => {
        if (!isMounted) return;

        if (!window.YT || !window.YT.Player) {
          setUseFallbackEmbed(true);
          return;
        }

        const playerContainer = document.getElementById(uniquePlayerId);
        if (!playerContainer) return;

        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch {
            // ignore
          }
        }

        try {
          playerRef.current = new window.YT.Player(uniquePlayerId, {
            videoId: targetYouTubeId,
            playerVars: {
              autoplay: 1,
              controls: 0,
              modestbranding: 1,
              rel: 0,
              disablekb: 1,
              iv_load_policy: 3,
              playsinline: 1,
              fs: 0,
            },
            events: {
              onReady: (event) => {
                if (!isMounted) return;
                const player = event.target;
                const dur = player.getDuration();
                if (dur && dur > 0) {
                  setDuration(dur);
                }
                player.playVideo();
                setIsPlaying(true);
              },
              onStateChange: (event) => {
                if (!isMounted) return;
                const state = event.data;
                if (state === 1) {
                  setIsPlaying(true);
                } else if (state === 2 || state === 0) {
                  setIsPlaying(false);
                }
              },
              onError: () => {
                if (isMounted) setUseFallbackEmbed(true);
              },
            },
          });
        } catch {
          if (isMounted) setUseFallbackEmbed(true);
        }

        pollInterval = setInterval(() => {
          if (
            playerRef.current &&
            typeof playerRef.current.getCurrentTime === "function"
          ) {
            try {
              const current = playerRef.current.getCurrentTime() || 0;
              const total = playerRef.current.getDuration() || 0;

              if (total > 0) {
                setDuration(total);
                setCurrentTime(current);
                setProgress((current / total) * 100);
              }
            } catch {
              // ignore transient state
            }
          }
        }, 150);
      })
      .catch(() => {
        if (isMounted) setUseFallbackEmbed(true);
      });

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [targetYouTubeId, hasStarted, uniquePlayerId]);

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
        {/* YouTube Embed Container */}
        <div className="relative pt-[56.25%] w-full bg-black">
          {hasStarted ? (
            useFallbackEmbed ? (
              <iframe
                className="absolute inset-0 w-full h-full border-0"
                src={`https://www.youtube.com/embed/${targetYouTubeId}?autoplay=1&controls=1&rel=0`}
                title={title || "YouTube video player"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                <div
                  id={uniquePlayerId}
                  className="absolute inset-0 w-full h-full border-0 pointer-events-none scale-[1.02]"
                />
                <div
                  className="absolute inset-0 z-10 cursor-pointer"
                  onClick={togglePlay}
                />
              </>
            )
          ) : (
            <div
              className="absolute inset-0 w-full h-full cursor-pointer group/cover"
              onClick={() => {
                setHasStarted(true);
                setIsPlaying(true);
              }}
            >
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

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent transition-opacity duration-300 group-hover/cover:from-slate-950/90" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-2xl transition-all duration-300 group-hover/cover:scale-110 group-hover/cover:bg-amber-300">
                  <Play className="h-8 w-8 fill-current text-slate-950 ml-1" />
                </div>
              </div>

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
        {hasStarted && !isPlaying && !useFallbackEmbed && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all z-20 cursor-pointer"
          >
            <Play className="w-8 h-8 fill-current ml-1" />
          </button>
        )}

        {/* Custom Controls Overlay for YouTube */}
        <AnimatePresence>
          {(showControls || !isPlaying) && hasStarted && !useFallbackEmbed && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 p-4 m-3 bg-[#111111c2] backdrop-blur-md rounded-2xl border border-white/10 z-30"
              initial={{ y: 20, opacity: 0, filter: "blur(10px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: 20, opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: "circInOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Timeline Slider with Live Time Labels */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-white/90 text-xs font-mono w-10 text-right">
                  {formatTime(currentTime)}
                </span>
                <CustomSlider
                  value={progress}
                  onChange={handleSeek}
                  className="flex-1"
                />
                <span className="text-white/90 text-xs font-mono w-10 text-left">
                  {formatTime(duration)}
                </span>
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

      {/* Top Header */}
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
              <span className="text-white/90 text-xs font-mono w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <CustomSlider
                value={progress}
                onChange={handleSeek}
                className="flex-1"
              />
              <span className="text-white/90 text-xs font-mono w-10 text-left">
                {formatTime(duration)}
              </span>
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
