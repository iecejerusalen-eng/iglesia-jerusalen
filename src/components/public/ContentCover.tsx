import { useState } from 'react';
import { Image as ImageIcon, Play } from 'lucide-react';
import { getCoverMediaType, type CoverMediaType } from './coverMedia';
import VideoPlayer from '../ui/video-player';

interface ContentCoverProps {
  title: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  mediaType?: CoverMediaType | null;
  className?: string;
  imageClassName?: string;
  interactive?: boolean;
}

const getYouTubeId = (value: string): string | null => {
  const compactMatch = value.match(/^https?:\/\/(?:www\.)?youtu\.be\/([^/?#]+)/i);
  if (compactMatch?.[1]) return compactMatch[1];
  const pathMatch = value.match(/^https?:\/\/(?:www\.)?youtube\.com\/(?:embed|shorts)\/([^/?#]+)/i);
  if (pathMatch?.[1]) return pathMatch[1];
  const queryMatch = value.match(/[?&]v=([^&#]+)/i);
  return queryMatch?.[1] ?? null;
};

export default function ContentCover({
  title,
  imageUrl,
  videoUrl,
  mediaType,
  className = '',
  imageClassName = '',
  interactive = false,
}: ContentCoverProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const resolvedType = getCoverMediaType(mediaType, imageUrl, videoUrl);
  const youtubeId = videoUrl ? getYouTubeId(videoUrl) : null;
  const posterUrl = imageUrl || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null);

  if (interactive && resolvedType === 'video' && videoUrl && isPlaying) {
    return (
      <div className={`relative aspect-video overflow-hidden bg-slate-950 ${className}`}>
        <VideoPlayer
          src={youtubeId ? undefined : videoUrl}
          youtubeUrl={youtubeId ? videoUrl : undefined}
          poster={posterUrl}
          title={title}
          autoPlay
          className="h-full max-w-none rounded-none border-0 shadow-none"
        />
      </div>
    );
  }

  return (
    <div className={`relative aspect-video overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 ${className}`}>
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={title}
          className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${imageClassName}`}
          loading="lazy"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-white/40">
          <ImageIcon size={42} aria-hidden="true" />
        </div>
      )}
      {resolvedType === 'video' && videoUrl && (
        <>
          {interactive ? (
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-slate-950/10 transition hover:bg-slate-950/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80"
              aria-label={`Reproducir vídeo: ${title}`}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-2xl transition-transform hover:scale-110">
                <Play size={28} fill="currentColor" aria-hidden="true" />
              </span>
            </button>
          ) : null}
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/75 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-md">
            <Play size={13} fill="currentColor" aria-hidden="true" /> Vídeo
          </span>
        </>
      )}
    </div>
  );
}
