import { FileText, Download } from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────
type ResourceType = 'image' | 'video' | 'raw';

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico', 'tiff'];
const VIDEO_EXTS = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'ogg'];
const DOCUMENT_EXTS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'txt', 'csv', 'raw'];

function detectResourceType(src: string, explicit?: ResourceType): ResourceType {
  if (explicit) return explicit;

  const lower = src.toLowerCase();

  // Data URLs
  if (lower.startsWith('data:image/')) return 'image';
  if (lower.startsWith('data:video/')) return 'video';
  if (lower.startsWith('data:application/')) return 'raw';

  // Cloudinary Specific Check
  if (lower.includes('res.cloudinary.com')) {
    if (lower.includes('/image/upload/')) return 'image';
    if (lower.includes('/video/upload/')) return 'video';
    if (lower.includes('/raw/upload/')) return 'raw';
  }

  // Unsplash & other popular image CDNs
  if (lower.includes('images.unsplash.com') || lower.includes('unsplash.com/photo-')) {
    return 'image';
  }

  // Extract extension from URL path
  const pathWithoutQuery = lower.split('?')[0];
  const fileName = pathWithoutQuery.split('/').pop() || '';
  const ext = fileName.split('.').pop() || '';

  if (IMAGE_EXTS.includes(ext)) return 'image';
  if (VIDEO_EXTS.includes(ext)) return 'video';
  if (DOCUMENT_EXTS.includes(ext)) return 'raw';

  // Fallback: assume image (since most media URLs in cards/layouts are images)
  return 'image';
}

/**
 * If `src` is a Cloudinary URL, inject f_auto,q_auto transformations.
 * Otherwise return the URL unchanged.
 */
function optimiseCloudinaryUrl(src: string, width?: number): string {
  // Only transform URLs that go through Cloudinary's delivery network
  if (!src.includes('res.cloudinary.com')) return src;

  // Build the transformation string
  const transforms = ['f_auto', 'q_auto'];
  if (width) transforms.push(`w_${width}`);
  const transformStr = transforms.join(',');

  // Inject transformations after /upload/ (or /fetch/)
  const uploadPattern = /(\/upload\/)(v\d+\/)?/;
  const fetchPattern = /(\/fetch\/)/;

  if (uploadPattern.test(src)) {
    return src.replace(uploadPattern, `$1${transformStr}/$2`);
  }
  if (fetchPattern.test(src)) {
    return src.replace(fetchPattern, `$1${transformStr}/`);
  }
  return src;
}

// ── Props ───────────────────────────────────────────────────────────────
interface OptimizedMediaProps {
  /** Full URL or Cloudinary public_id */
  src: string;
  /** Override automatic detection */
  resourceType?: ResourceType;
  /** Alt text for images */
  alt?: string;
  /** Tailwind className */
  className?: string;
  /** Optional desired display width (generates w_{n} transformation) */
  width?: number;
  /** Optional desired display height */
  height?: number;
}

// ── Component ───────────────────────────────────────────────────────────
export default function OptimizedMedia({
  src,
  resourceType,
  alt = '',
  className = '',
  width,
  height,
}: OptimizedMediaProps) {
  if (!src) return null;

  const type = detectResourceType(src, resourceType);
  const optimisedSrc = type === 'image' || type === 'video'
    ? optimiseCloudinaryUrl(src, width)
    : src;

  if (type === 'image') {
    return (
      <img
        src={optimisedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={className}
        {...(width ? { width } : {})}
        {...(height ? { height } : {})}
      />
    );
  }

  // ─── Video ────────────────────────────────────────────────────────────
  if (type === 'video') {
    return (
      <video
        src={optimisedSrc}
        controls
        preload="metadata"
        className={`rounded-xl ${className}`}
        {...(width ? { width } : {})}
        {...(height ? { height } : {})}
      >
        Tu navegador no soporta la reproducción de video.
      </video>
    );
  }

  // ─── Raw / Document (PDF, etc.) ───────────────────────────────────────
  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-flex items-center gap-2.5 px-5 py-3
        bg-white border border-slate-200
        hover:border-primary/30 hover:bg-slate-50
        rounded-xl shadow-xs hover:shadow-sm
        text-xs font-bold text-slate-700
        transition-all duration-200
        group
        ${className}
      `}
    >
      <FileText size={16} className="text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
      <span className="truncate max-w-[200px]">
        {alt || src.split('/').pop() || 'Documento'}
      </span>
      <Download size={12} className="text-slate-400 group-hover:text-primary transition-colors ml-auto" />
    </a>
  );
}
