import { useEffect, useRef, useCallback, useState } from 'react';
import { Upload, Cloud } from 'lucide-react';
import { toast } from 'sonner';
import { catalogUploadedMediaAsset, getAvailableMediaProviders, uploadMediaAsset, type MediaProvider } from '../../lib/mediaService';

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
  /** Proveedor inicial; el usuario puede cambiarlo antes de subir. */
  provider?: MediaProvider;
}

interface CloudinaryUploadInfo {
  secure_url: string;
  public_id: string;
  resource_type: 'image' | 'video' | 'raw';
  format: string;
}

interface CloudinaryUploadResult {
  event: string;
  info?: CloudinaryUploadInfo;
}

interface CloudinaryUploadWidget {
  open: () => void;
  destroy: () => void;
}

interface CloudinaryApi {
  createUploadWidget: (
    options: Record<string, unknown>,
    callback: (error: unknown, result: CloudinaryUploadResult) => void
  ) => CloudinaryUploadWidget;
}

declare global {
  interface Window {
    cloudinary?: CloudinaryApi;
  }
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
  provider: initialProvider = 'cloudinary',
}: MediaUploaderProps) {
  const widgetRef = useRef<CloudinaryUploadWidget | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<MediaProvider>(initialProvider);
  const [uploading, setUploading] = useState(false);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const openWidget = useCallback(async () => {
    await ensureWidgetScript();

    // Lazily create the widget once
    if (!widgetRef.current) {
      const cld = window.cloudinary;
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
        (error: unknown, result: CloudinaryUploadResult) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            return;
          }
          if (result.event === 'success' && result.info) {
            const info = result.info;
            const resourceType = info.resource_type as 'image' | 'video' | 'raw';
            const asset = { url: info.secure_url, provider: 'cloudinary' as const, storagePath: null, publicId: info.public_id, format: info.format, resourceType };
            void catalogUploadedMediaAsset(asset, `${info.public_id}.${info.format}`, `${resourceType}/${info.format}`, 0, folder).catch((catalogError: unknown) => {
              console.error('Cloudinary cargó el recurso, pero falló el catálogo:', catalogError);
              toast.warning('Recurso subido; no pudo registrarse en la biblioteca central.');
            });
            onUploadSuccess(info.secure_url, info.public_id, resourceType, info.format);
          }
        }
      );
    }

    widgetRef.current.open();
  }, [cloudName, uploadPreset, folder, multiple, allowedFormats, onUploadSuccess]);

  const uploadSelectedFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const resourceType: 'image' | 'video' | 'raw' = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'raw';
      const asset = await uploadMediaAsset(file, selectedProvider, folder, resourceType);
      onUploadSuccess(asset.url, asset.publicId || '', asset.resourceType, asset.format);
      toast.success(`Recurso guardado en ${getAvailableMediaProviders().find((item) => item.id === selectedProvider)?.label || selectedProvider}.`);
    } catch (error) {
      console.error('Error al subir recurso multimedia:', error);
      toast.error(error instanceof Error ? error.message : 'No se pudo subir el recurso multimedia.');
    } finally { setUploading(false); }
  }, [folder, onUploadSuccess, selectedProvider]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void uploadSelectedFile(file);
    event.target.value = '';
  }, [uploadSelectedFile]);

  const handleClipboardPaste = useCallback(async (event: React.ClipboardEvent<HTMLButtonElement>) => {
    const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith('image/'));
    const file = imageItem?.getAsFile();
    if (!file) return;

    event.preventDefault();
    try {
      const extension = file.type.split('/')[1] || 'png';
      const pastedFile = new File([file], `imagen-portapapeles-${Date.now()}.${extension}`, { type: file.type });
      await uploadSelectedFile(pastedFile);
    } catch (error) {
      console.error('Error al subir imagen desde el portapapeles:', error);
      toast.error(error instanceof Error ? error.message : 'No se pudo subir la imagen pegada.');
    }
  }, [uploadSelectedFile]);

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
      onClick={() => { if (selectedProvider === 'cloudinary') void openWidget(); else fileInputRef.current?.click(); }}
      onPaste={(event) => { void handleClipboardPaste(event); }}
      title="También puedes enfocar este botón y presionar Ctrl+V para pegar una imagen"
      disabled={uploading}
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
      <select value={selectedProvider} onChange={(event) => setSelectedProvider(event.target.value as MediaProvider)} onClick={(event) => event.stopPropagation()} className="rounded-md bg-white/15 px-1 py-0.5 text-[10px] font-bold text-white outline-none" aria-label="Proveedor de almacenamiento">
        {getAvailableMediaProviders().map((item) => <option key={item.id} value={item.id} className="text-slate-900">{item.label}</option>)}
      </select>
      <input ref={fileInputRef} type="file" accept={allowedFormats?.map((format) => `.${format}`).join(',') || undefined} multiple={multiple} onChange={handleFileChange} className="hidden" />
      <Cloud size={14} className="opacity-80" />
      <Upload size={14} />
      <span>{label}</span>
    </button>
  );
}
