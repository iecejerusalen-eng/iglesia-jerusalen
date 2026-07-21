import * as React from "react";
import { cn } from "@/lib/utils";
import { Play, X } from "lucide-react";
import VideoPlayer from "@/components/ui/video-player";

export interface VideoThumbnailPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  thumbnailUrl?: string;
  videoUrl: string;
  title: string;
  description?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1";
  mode?: "modal" | "inline";
}

const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const VideoThumbnailPlayer = React.forwardRef<HTMLDivElement, VideoThumbnailPlayerProps>(
  (
    {
      className,
      thumbnailUrl,
      videoUrl,
      title,
      description,
      aspectRatio = "16/9",
      mode = "modal",
      ...props
    },
    ref
  ) => {
    const [isPlaying, setIsPlaying] = React.useState(false);

    // Auto-generate thumbnail if missing and video is YouTube
    const ytId = extractYouTubeId(videoUrl);
    const finalThumbnail =
      thumbnailUrl ||
      (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : "https://images.unsplash.com/photo-1593642532454-e138e28a63f4?q=80&w=2069&auto=format&fit=crop");

    // Handle 'Escape' key press for closing modal
    React.useEffect(() => {
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setIsPlaying(false);
        }
      };
      window.addEventListener("keydown", handleEsc);
      return () => {
        window.removeEventListener("keydown", handleEsc);
      };
    }, []);

    // Prevent body scroll when modal is open
    React.useEffect(() => {
      if (mode === "modal" && isPlaying) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "auto";
      }
      return () => {
        document.body.style.overflow = "auto";
      };
    }, [isPlaying, mode]);

    if (mode === "inline" && isPlaying) {
      return (
        <div ref={ref} className={cn("w-full overflow-hidden rounded-xl", className)} {...props}>
          <VideoPlayer
            src={videoUrl}
            youtubeUrl={videoUrl}
            title={title}
            autoPlay={true}
          />
        </div>
      );
    }

    return (
      <>
        <div
          ref={ref}
          className={cn(
            "group relative cursor-pointer overflow-hidden rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl border border-white/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className
          )}
          style={{ aspectRatio }}
          onClick={() => setIsPlaying(true)}
          onKeyDown={(e) => e.key === "Enter" && setIsPlaying(true)}
          tabIndex={0}
          aria-label={`Play video: ${title}`}
          {...props}
        >
          {/* Thumbnail Image */}
          <img
            src={finalThumbnail}
            alt={`Thumbnail for ${title}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              if (ytId && e.currentTarget.src.includes('maxresdefault')) {
                e.currentTarget.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
              }
            }}
          />
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent transition-opacity duration-300 group-hover:from-slate-950/90" />

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-slate-950 shadow-2xl border border-white/30">
              <Play className="h-8 w-8 fill-current text-white group-hover:text-slate-950 ml-1 transition-colors" />
            </div>
          </div>

          {/* Title and Description */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight drop-shadow-md">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-white/80 line-clamp-2 drop-shadow">{description}</p>
            )}
          </div>
        </div>

        {/* Video Modal */}
        {mode === "modal" && isPlaying && (
          <div
            className="fixed inset-0 z-50 flex animate-in fade-in-0 items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
            aria-modal="true"
            role="dialog"
            onClick={() => setIsPlaying(false)}
          >
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(false);
              }}
              className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 cursor-pointer"
              aria-label="Close video player"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Video Container in Modal */}
            <div 
              className="w-full max-w-4xl p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <VideoPlayer
                src={videoUrl}
                youtubeUrl={videoUrl}
                title={title}
                autoPlay={true}
              />
            </div>
          </div>
        )}
      </>
    );
  }
);

VideoThumbnailPlayer.displayName = "VideoThumbnailPlayer";

export { VideoThumbnailPlayer, VideoThumbnailPlayer as VideoPlayer };
export default VideoThumbnailPlayer;
