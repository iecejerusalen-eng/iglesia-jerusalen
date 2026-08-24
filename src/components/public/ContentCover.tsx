import { Image as ImageIcon, Play } from 'lucide-react';

export type CoverMediaType = 'image' | 'video';

interface ContentCoverProps {
  title: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  mediaType?: CoverMediaType | null;
  className?: string;
  imageClassName?: string;
}

const getYouTubeId = (value: string): string | null => {
  try {
    const url = new URL(value);
    if (url.hostname === 'youtu.be') return url.pathname.slice(1) || null;
    if (url.hostname.endsWith('youtube.com')) {
      if (url.pathname === '/watch') return url.searchParams.get('v');
      const embedMatch = url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/);
      return embedMatch?.[1] ?? null;
    }
  } catch {
    return null;
  }
  return null;
};

export const getCoverMediaType = (
  mediaType: CoverMediaType | null | undefined,
  imageUrl: string | null | undefined,
  videoUrl: string | null | undefined,
): CoverMediaType => {
  if (mediaType === 'image' || mediaType === 'video') return mediaType;
  return imageUrl ? 'image' : videoUrl ? 'video' : 'image';
};

export default function ContentCover({
  title,
  imageUrl,
  videoUrl,
  mediaType,
  className = '',
  imageClassName = '',
}: ContentCoverProps) {
  const resolvedType = getCoverMediaType(mediaType, imageUrl, videoUrl);
  const youtubeId = videoUrl ? getYouTubeId(videoUrl) : null;
  const posterUrl = imageUrl || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null);

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
        <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/75 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-md">
          <Play size={13} fill="currentColor" aria-hidden="true" /> Vídeo
        </span>
      )}
    </div>
  );
}
