import { useEffect, useRef, useCallback } from 'react';
import { Upload, Cloud } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────
interface MediaUploaderProps {
  /** Callback fired after a successful upload */
  onUploadSuccess: (
    url: string,
    publicId: string,
    resourceType: 'image' | 'video' | 'raw',
    format: string
  ) => void;
  /** Cloudinary folder to organise uploads (e.g. 'productos', 'sermones') */
  folder?: string;
  /** Restrict accepted file formats (e.g. ['jpg','png','mp4','pdf']) */
  allowedFormats?: string[];
  /** Custom button label */
  label?: string;
  /** Extra Tailwind classes for the trigger button */
  className?: string;
  /** Allow multiple files to be uploaded in one session */
  multiple?: boolean;
}

// ── Cloudinary Upload Widget script loader ─────────────────────────────
const WIDGET_SCRIPT_URL = 'https://upload-widget.cloudinary.com/global/all.js';
let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: (() => void)[] = [];

function ensureWidgetScript(): Promise<void> {
  return new Promise((resolve) => {
    if (scriptLoaded) return resolve();
    loadCallbacks.push(resolve);
    if (scriptLoading) return; // another caller is already loading
    scriptLoading = true;

    const script = document.createElement('script');
    script.src = WIDGET_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };
    document.head.appendChild(script);
  });
}

// ── Component ──────────────────────────────────────────────────────────
export default function MediaUploader({
  onUploadSuccess,
  folder = 'general',
  allowedFormats,
  label = 'Subir Archivo',
  className = '',
  multiple = false,
}: MediaUploaderProps) {
  const widgetRef = useRef<any>(null);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const openWidget = useCallback(async () => {
    await ensureWidgetScript();

    // Lazily create the widget once
    if (!widgetRef.current) {
      const cld = (window as any).cloudinary;
      if (!cld) {
        console.error('Cloudinary global not found after script load');
        return;
      }

      widgetRef.current = cld.createUploadWidget(
        {
          cloudName,
          uploadPreset,
          folder: `iglesia-jerusalen/${folder}`,
          multiple,
          resourceType: 'auto',
          ...(allowedFormats && allowedFormats.length > 0
            ? { clientAllowedFormats: allowedFormats }
            : {}),
          sources: [
            'local',
            'url',
            'camera',
            'google_drive',
            'dropbox',
            'instagram',
          ],
          showAdvancedOptions: false,
          cropping: false,
          showSkipCropButton: true,
          theme: 'minimal',
          styles: {
            palette: {
              window: '#FFFFFF',
              windowBorder: '#CBD5E1',
              tabIcon: '#1E3A5F',
              menuIcons: '#1E3A5F',
              textDark: '#0F172A',
              textLight: '#F8FAFC',
              link: '#1E3A5F',
              action: '#D4A843',
              inactiveTabIcon: '#94A3B8',
              error: '#EF4444',
              inProgress: '#D4A843',
              complete: '#10B981',
              sourceBg: '#F1F5F9',
            },
            fonts: {
              default: null,
              "'Inter', sans-serif": {
                url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
                active: true,
              },
            },
          },
        },
        (error: any, result: any) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            return;
          }
          if (result.event === 'success') {
            const info = result.info;
            onUploadSuccess(
              info.secure_url,
              info.public_id,
              info.resource_type as 'image' | 'video' | 'raw',
              info.format
            );
          }
        }
      );
    }

    widgetRef.current.open();
  }, [cloudName, uploadPreset, folder, multiple, allowedFormats, onUploadSuccess]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
        widgetRef.current = null;
      }
    };
  }, []);

  return (
    <button
      type="button"
      onClick={openWidget}
      className={`
        inline-flex items-center gap-2 px-4 py-2.5
        bg-gradient-to-br from-emerald-600 to-emerald-700
        hover:from-emerald-500 hover:to-emerald-600
        text-white text-xs font-bold uppercase tracking-wide
        rounded-xl shadow-md hover:shadow-lg
        transition-all duration-200
        cursor-pointer
        ${className}
      `}
    >
      <Cloud size={14} className="opacity-80" />
      <Upload size={14} />
      <span>{label}</span>
    </button>
  );
}
