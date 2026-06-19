import { useState, useEffect } from 'react';
import {
  Search,
  X,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  Loader2,
  Check,
  ExternalLink,
  AlertCircle,
  Tag,
  BookOpen,
  Cloud,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../config/supabase';

const YoutubeIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

interface MediaSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, options?: { videoUrl?: string; thumbnailUrl?: string }) => void;
  allowedTypes?: Array<'image' | 'video'>;
  title?: string;
}

// Preset High Quality Unsplash Images for Church Inventory and pages
const CURATED_PRESETS = [
  {
    category: 'Sonido y Multimedia',
    items: [
      { name: 'Consola de Sonido', url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=600&auto=format&fit=crop' },
      { name: 'Micrófono Vocal', url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop' },
      { name: 'Cámara Fotográfica', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600&auto=format&fit=crop' },
      { name: 'Cámara de Video', url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600&auto=format&fit=crop' },
      { name: 'Proyector / Pantalla', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop' },
      { name: 'Auriculares de Monitoreo', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop' },
    ]
  },
  {
    category: 'Música e Instrumentos',
    items: [
      { name: 'Teclado / Piano', url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&auto=format&fit=crop' },
      { name: 'Guitarra Eléctrica', url: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=600&auto=format&fit=crop' },
      { name: 'Guitarra Acústica', url: 'https://images.unsplash.com/photo-1524230572899-a752b3835840?q=80&w=600&auto=format&fit=crop' },
      { name: 'Batería Acústica', url: 'https://images.unsplash.com/photo-1543443258-92b04ad5ecf1?q=80&w=600&auto=format&fit=crop' },
      { name: 'Bajo Eléctrico', url: 'https://images.unsplash.com/photo-1564186763535-ebb21ec5277f?q=80&w=600&auto=format&fit=crop' },
      { name: 'Atril de Partituras', url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=600&auto=format&fit=crop' },
    ]
  },
  {
    category: 'Comunidad e Iglesia',
    items: [
      { name: 'Santa Biblia', url: 'https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?q=80&w=600&auto=format&fit=crop' },
      { name: 'Pulpito / Altar', url: 'https://images.unsplash.com/photo-1438263308947-648e87f76f5a?q=80&w=600&auto=format&fit=crop' },
      { name: 'Grupo de Estudio', url: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=600&auto=format&fit=crop' },
      { name: 'Oración / Adoración', url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600&auto=format&fit=crop' },
      { name: 'Cruz de Madera', url: 'https://images.unsplash.com/photo-1545987796-200677ee1011?q=80&w=600&auto=format&fit=crop' },
      { name: 'Reunión de Jóvenes', url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600&auto=format&fit=crop' },
    ]
  },
  {
    category: 'Mobiliario, Cocina y Otros',
    items: [
      { name: 'Sillas de Auditorio', url: 'https://images.unsplash.com/photo-1581428982868-e410dd047a90?q=80&w=600&auto=format&fit=crop' },
      { name: 'Mesa de Reuniones', url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=600&auto=format&fit=crop' },
      { name: 'Utensilios de Cocina', url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=600&auto=format&fit=crop' },
      { name: 'Cafetera Eléctrica', url: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=600&auto=format&fit=crop' },
      { name: 'Herramientas de Trabajo', url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=600&auto=format&fit=crop' },
      { name: 'Campamento / Cadetes', url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=600&auto=format&fit=crop' },
    ]
  }
];

const QUICK_TAGS = ['Biblia', 'Cámara', 'Música', 'Sonido', 'Cocina', 'Café', 'Iglesia', 'Estudio', 'Niños'];

// Helper to extract YouTube video ID
const getYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Helper to extract Vimeo video ID
const getVimeoId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
};

export default function MediaSearchModal({
  isOpen,
  onClose,
  onSelect,
  allowedTypes = ['image', 'video'],
  title = 'Asistente de Búsqueda Multimedia'
}: MediaSearchModalProps) {
  const [activeTab, setActiveTab] = useState<'link' | 'stock' | 'presets' | 'vault'>('link');

  // Link pasting states
  const [pastedUrl, setPastedUrl] = useState('');
  const [urlType, setUrlType] = useState<'image' | 'youtube' | 'vimeo' | 'unknown'>('unknown');
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [vimeoVideoId, setVimeoVideoId] = useState<string | null>(null);
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [vimeoThumbnailUrl, setVimeoThumbnailUrl] = useState<string | null>(null);
  const [loadingVimeo, setLoadingVimeo] = useState(false);

  // Stock Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedStockImage, setSelectedStockImage] = useState<any | null>(null);

  // Church Vault & Cloudinary Media states
  const [churchMedia, setChurchMedia] = useState<any[]>([]);
  const [loadingChurchMedia, setLoadingChurchMedia] = useState(false);

  const fetchChurchMedia = async () => {
    setLoadingChurchMedia(true);
    try {
      const mediaList: Array<{ name: string; url: string; category: string }> = [];

      // 1. Fetch Ministries image URLs
      const { data: minData } = await supabase.from('ministries').select('name, image_url');
      if (minData) {
        minData.forEach(item => {
          if (item.image_url) {
            mediaList.push({ name: item.name, url: item.image_url, category: 'Ministerios y Departamentos' });
          }
        });
      }

      // 2. Fetch Programs cover images
      const { data: progData } = await supabase.from('programs').select('title, cover_image');
      if (progData) {
        progData.forEach(item => {
          if (item.cover_image) {
            mediaList.push({ name: item.title, url: item.cover_image, category: 'Estudios y Programas' });
          }
        });
      }

      // 3. Fetch Inventory items photo URLs
      const { data: invData } = await supabase.from('inventory_items').select('name, photo_url');
      if (invData) {
        invData.forEach(item => {
          if (item.photo_url) {
            mediaList.push({ name: item.name, url: item.photo_url, category: 'Inventario' });
          }
        });
      }

      // 4. Fetch Page Contents cover images and blocks
      const { data: pageData } = await supabase.from('page_contents').select('name, cover_image_url, content_blocks');
      if (pageData) {
        pageData.forEach(item => {
          if (item.cover_image_url) {
            mediaList.push({ name: `${item.name} (Portada)`, url: item.cover_image_url, category: 'Páginas y Portadas' });
          }
          if (item.content_blocks && Array.isArray(item.content_blocks)) {
            item.content_blocks.forEach((block: any) => {
              if (block.type === 'image' && block.image_url) {
                mediaList.push({ name: block.text || 'Imagen de bloque', url: block.image_url, category: 'Páginas y Galerías' });
              } else if (block.url) { // gallery slide
                mediaList.push({ name: block.caption || 'Diapositiva', url: block.url, category: 'Páginas y Galerías' });
              }
            });
          }
        });
      }

      // 5. Fetch Supabase storage vault files (generate public / signed url)
      try {
        const { data: vaultData } = await supabase.storage.from('media_vault').list('', { limit: 100 });
        if (vaultData) {
          const filesFiltered = vaultData.filter(f => f.name !== '.emptyFolderPlaceholder');
          for (const file of filesFiltered) {
            if (file.metadata?.mimetype?.startsWith('image/')) {
              const { data: signedData } = await supabase.storage
                .from('media_vault')
                .createSignedUrl(file.name, 3600);
              if (signedData) {
                mediaList.push({
                  name: file.name.split('_').slice(1).join('_') || file.name,
                  url: signedData.signedUrl,
                  category: 'Bóveda Privada (Vault)'
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('Error reading media_vault storage:', err);
      }

      // Deduplicate by URL
      const uniqueMedia: typeof mediaList = [];
      const seenUrls = new Set<string>();
      mediaList.forEach(m => {
        if (!seenUrls.has(m.url)) {
          seenUrls.add(m.url);
          uniqueMedia.push(m);
        }
      });

      setChurchMedia(uniqueMedia);
    } catch (err) {
      console.error('Error fetching church media:', err);
    } finally {
      setLoadingChurchMedia(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'vault') {
      fetchChurchMedia();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state on close
      setPastedUrl('');
      setUrlType('unknown');
      setYoutubeVideoId(null);
      setVimeoVideoId(null);
      setImagePreviewError(false);
      setVimeoThumbnailUrl(null);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedStockImage(null);
      setSearchError(null);
    }
  }, [isOpen]);

  // Handle link paste analysis
  useEffect(() => {
    const trimmed = pastedUrl.trim();
    if (!trimmed) {
      setUrlType('unknown');
      setYoutubeVideoId(null);
      setVimeoVideoId(null);
      setImagePreviewError(false);
      setVimeoThumbnailUrl(null);
      return;
    }

    const yId = getYoutubeId(trimmed);
    const vId = getVimeoId(trimmed);

    if (yId && allowedTypes.includes('video')) {
      setUrlType('youtube');
      setYoutubeVideoId(yId);
      setVimeoVideoId(null);
      setImagePreviewError(false);
    } else if (vId && allowedTypes.includes('video')) {
      setUrlType('vimeo');
      setVimeoVideoId(vId);
      setYoutubeVideoId(null);
      setImagePreviewError(false);
      fetchVimeoThumbnail(vId);
    } else {
      // Assume image
      setUrlType('image');
      setYoutubeVideoId(null);
      setVimeoVideoId(null);
      setImagePreviewError(false);
    }
  }, [pastedUrl, allowedTypes]);

  const fetchVimeoThumbnail = async (id: string) => {
    setLoadingVimeo(true);
    setVimeoThumbnailUrl(null);
    try {
      const res = await fetch(`https://vimeo.com/api/v2/video/${id}.json`);
      const data = await res.json();
      if (data && data[0]) {
        setVimeoThumbnailUrl(data[0].thumbnail_large || data[0].thumbnail_medium || null);
      }
    } catch (e) {
      console.warn('Failed to fetch Vimeo thumbnail:', e);
    } finally {
      setLoadingVimeo(false);
    }
  };

  // Run stock search on Openverse or fallbacks (AllOrigins proxy, Wikimedia Commons, Local Presets)
  const handleSearch = async (queryToUse?: string) => {
    const query = (queryToUse || searchQuery).trim();
    if (!query) return;

    setSearching(true);
    setSearchError(null);
    setSelectedStockImage(null);
    setSearchResults([]);

    const targetUrl = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=24`;

    // Strategy 1: Direct Openverse API Fetch
    try {
      const res = await fetch(`${targetUrl}&format=json`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setSearchResults(data.results);
          setSearching(false);
          return;
        }
      }
    } catch (e: any) {
      console.warn('Strategy 1 (Openverse Direct) failed, trying proxy...', e.message);
    }

    // Strategy 2: Openverse via AllOrigins JSON Proxy
    try {
      const proxiedUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl + '&format=json')}`;
      const res = await fetch(proxiedUrl);
      if (res.ok) {
        const wrapper = await res.json();
        if (wrapper && wrapper.contents) {
          const data = JSON.parse(wrapper.contents);
          if (data.results && data.results.length > 0) {
            setSearchResults(data.results);
            setSearching(false);
            return;
          }
        }
      }
    } catch (e: any) {
      console.warn('Strategy 2 (Openverse via AllOrigins) failed, trying Wikimedia Commons...', e.message);
    }

    // Strategy 3: Wikimedia Commons direct search (natively CORS-enabled, no key needed)
    try {
      const wikimediaUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url|user|extmetadata|thumburl&iiurlwidth=300&format=json&origin=*`;
      const res = await fetch(wikimediaUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.query && data.query.pages) {
          const pages = data.query.pages;
          const mappedResults = Object.keys(pages).map((key) => {
            const page = pages[key];
            const info = page.imageinfo?.[0] || {};
            const metadata = info.extmetadata || {};
            
            // Clean up creator name (strip any HTML tags like links)
            let creator = info.user || metadata.Artist?.value || 'Wikimedia Commons';
            if (typeof creator === 'string' && creator.includes('<')) {
              creator = creator.replace(/<[^>]*>/g, '').trim();
            }

            const title = metadata.ObjectName?.value || page.title.replace(/^File:/, '').replace(/\.[^/.]+$/, "");
            const license = metadata.LicenseShortName?.value || 'CC';

            return {
              id: `wiki-${page.pageid}`,
              title: title,
              url: info.url || '',
              thumbnail: info.thumburl || info.url || '',
              creator: creator,
              license: license,
              detail_url: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`
            };
          }).filter(item => item.url); // filter out items with no valid image url

          if (mappedResults.length > 0) {
            setSearchResults(mappedResults);
            setSearching(false);
            return;
          }
        }
      }
    } catch (e: any) {
      console.warn('Strategy 3 (Wikimedia Commons) failed, trying local presets...', e.message);
    }

    // Strategy 4: Fallback to preset curated list search as a last resort
    try {
      const lowerQuery = query.toLowerCase();
      const localResults: any[] = [];
      CURATED_PRESETS.forEach(group => {
        group.items.forEach(item => {
          if (item.name.toLowerCase().includes(lowerQuery) || group.category.toLowerCase().includes(lowerQuery)) {
            localResults.push({
              id: `preset-${item.name}-${localResults.length}`,
              title: item.name,
              url: item.url,
              thumbnail: item.url,
              creator: 'Unsplash Curated',
              license: 'Libre de regalías (Royalty Free)',
              detail_url: item.url
            });
          }
        });
      });
      if (localResults.length > 0) {
        setSearchResults(localResults);
        setSearching(false);
        return;
      }
    } catch (e: any) {
      console.warn('Strategy 4 (Local Presets) failed:', e.message);
    }

    // If all strategies failed
    setSearchError('No se encontraron imágenes. Pruebe buscando en español/inglés o use un término diferente.');
    setSearching(false);
  };

  const selectPastedLink = () => {
    const url = pastedUrl.trim();
    if (!url) return;

    if (urlType === 'youtube' && youtubeVideoId) {
      const thumbUrl = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
      onSelect(thumbUrl, { videoUrl: url, thumbnailUrl: thumbUrl });
    } else if (urlType === 'vimeo' && vimeoVideoId) {
      const thumbUrl = vimeoThumbnailUrl || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600&auto=format&fit=crop';
      onSelect(thumbUrl, { videoUrl: url, thumbnailUrl: thumbUrl });
    } else {
      onSelect(url, { thumbnailUrl: url });
    }
    onClose();
  };

  const selectStockImage = (img: any) => {
    onSelect(img.url, { thumbnailUrl: img.thumbnail || img.url });
    onClose();
  };

  const selectPreset = (presetUrl: string) => {
    onSelect(presetUrl, { thumbnailUrl: presetUrl });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/55 backdrop-blur-xs" onClick={onClose} />

      {/* Dialog body */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl border border-gray-150 overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn bg-radial">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-gray-100 bg-primary text-white">
          <div className="flex items-center gap-2">
            <ImageIcon size={18} className="text-gold" />
            <h2 className="text-base font-serif font-bold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-gray-100 bg-gray-50 px-6 gap-3 flex-wrap">
          <button
            onClick={() => setActiveTab('link')}
            className={`py-3 px-1 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'link'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <LinkIcon size={13} />
            Pegar Enlace
          </button>

          {allowedTypes.includes('image') && (
            <>
              <button
                onClick={() => setActiveTab('stock')}
                className={`py-3 px-1 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'stock'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Search size={13} />
                Buscador Gratis (Stock)
              </button>

              <button
                onClick={() => setActiveTab('presets')}
                className={`py-3 px-1 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'presets'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <BookOpen size={13} />
                Biblioteca de la Iglesia
              </button>

              <button
                onClick={() => setActiveTab('vault')}
                className={`py-3 px-1 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'vault'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Cloud size={13} className="text-emerald-600" />
                Biblioteca Cloudinary
              </button>
            </>
          )}
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-[350px]">
          {/* TAB 1: Paste Link */}
          {activeTab === 'link' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Enlace de imagen o video
                </label>
                <input
                  type="url"
                  value={pastedUrl}
                  onChange={(e) => setPastedUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg o https://www.youtube.com/watch?v=..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  autoFocus
                />
                <p className="text-[10px] text-gray-450 leading-relaxed font-medium">
                  {allowedTypes.includes('video')
                    ? 'Soporta enlaces directos de imágenes y direcciones URL de videos de YouTube o Vimeo.'
                    : 'Ingrese la dirección de internet de la imagen a insertar.'}
                </p>
              </div>

              {/* Analyzer preview */}
              {pastedUrl.trim() && (
                <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4.5 space-y-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    Previsualización del Recurso
                  </span>

                  {urlType === 'youtube' && youtubeVideoId && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-red-600">
                        <YoutubeIcon size={16} />
                        <span>Video de YouTube Detectado</span>
                      </div>
                      <div className="aspect-video max-w-md bg-black rounded-xl overflow-hidden shadow-sm border border-gray-200">
                        <iframe
                          src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                          title="YouTube Player"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-xs leading-normal font-medium flex gap-2">
                        <Check size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <span>Se extraerá la carátula de video en alta definición y se enlazará la reproducción directamente.</span>
                      </div>
                    </div>
                  )}

                  {urlType === 'vimeo' && vimeoVideoId && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                        <Video size={16} />
                        <span>Video de Vimeo Detectado</span>
                      </div>
                      <div className="aspect-video max-w-md bg-black rounded-xl overflow-hidden shadow-sm border border-gray-200">
                        <iframe
                          src={`https://player.vimeo.com/video/${vimeoVideoId}`}
                          title="Vimeo Player"
                          className="w-full h-full border-0"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      {loadingVimeo ? (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Loader2 className="animate-spin" size={14} />
                          <span>Obteniendo miniatura...</span>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-xs leading-normal font-medium flex gap-2">
                          <Check size={16} className="text-amber-600 shrink-0 mt-0.5" />
                          <span>Módulo de video Vimeo configurado y miniatura de soporte recuperada con éxito.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {urlType === 'image' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                        <ImageIcon size={16} />
                        <span>Imagen Web / Externa</span>
                      </div>
                      {!imagePreviewError ? (
                        <div className="max-w-xs h-36 rounded-xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center p-1 relative">
                          <img
                            src={pastedUrl}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain"
                            onError={() => setImagePreviewError(true)}
                          />
                        </div>
                      ) : (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs leading-normal flex items-start gap-2 font-medium">
                          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                          <span>
                            No se pudo precargar la imagen. Algunos sitios no permiten la previsualización directa, pero el enlace se guardará de todas formas si la dirección es correcta.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={selectPastedLink}
                      className="px-5 py-2 bg-primary hover:bg-blue-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
                    >
                      Insertar y Confirmar Enlace
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Stock Search */}
          {activeTab === 'stock' && (
            <div className="space-y-5 flex flex-col h-full">
              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar imágenes de stock gratis (ej. biblia, consola, camara)..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none bg-gray-50/50"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button
                  onClick={() => handleSearch()}
                  disabled={searching || !searchQuery.trim()}
                  className="px-5 py-2 bg-primary hover:bg-blue-900 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {searching ? <Loader2 className="animate-spin" size={14} /> : null}
                  Buscar
                </button>
              </div>

              {/* Quick tags */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Rápido:</span>
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      handleSearch(tag);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-semibold text-gray-600 transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Search results */}
              {searching ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Loader2 className="animate-spin text-primary mb-2" size={32} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Buscando imágenes gratuitas de Creative Commons...</span>
                </div>
              ) : searchError ? (
                <div className="text-center py-12 text-gray-400 italic text-xs font-medium">
                  {searchError}
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {searchResults.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => selectStockImage(img)}
                        className={`group relative aspect-square bg-gray-50 border-2 rounded-2xl overflow-hidden cursor-pointer transition-all ${
                          selectedStockImage?.id === img.id
                            ? 'border-primary ring-2 ring-primary/20 scale-[0.98]'
                            : 'border-gray-150 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={img.thumbnail || img.url}
                          alt={img.title || 'Stock image'}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <span className="text-[9px] text-white font-medium truncate w-full">
                            {img.creator || 'Licencia Libre'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Selected image card preview */}
                  {selectedStockImage && (
                    <div className="bg-blue-50/50 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-xl border border-gray-200 overflow-hidden bg-white shrink-0">
                          <img
                            src={selectedStockImage.thumbnail || selectedStockImage.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-800 text-xs truncate">
                            {selectedStockImage.title || 'Imagen de stock'}
                          </h4>
                          <p className="text-[10px] text-gray-400 truncate font-medium mt-0.5">
                            Autor: {selectedStockImage.creator || 'Desconocido'} • Licencia: {selectedStockImage.license?.toUpperCase() || 'CC'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <a
                          href={selectedStockImage.detail_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-white border border-gray-250 rounded-xl text-[10px] font-bold text-gray-650 flex items-center gap-1 transition-colors hover:bg-gray-55"
                        >
                          <ExternalLink size={10} />
                          Origen
                        </a>
                        <button
                          onClick={() => selectStockImage(selectedStockImage)}
                          className="px-4 py-1.5 bg-primary hover:bg-blue-900 text-white rounded-xl text-[10px] font-bold transition-colors shadow-sm"
                        >
                          Insertar Imagen Seleccionada
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-gray-400 text-xs">
                  <ImageIcon size={32} className="mx-auto mb-2 opacity-35" />
                  <p className="font-medium">¿Qué deseas insertar hoy?</p>
                  <p className="text-[10px] text-gray-450 mt-0.5">Introduce un término de búsqueda para consultar millones de recursos gratuitos.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Church presets */}
          {activeTab === 'presets' && (
            <div className="space-y-6">
              {CURATED_PRESETS.map((group) => (
                <div key={group.category} className="space-y-2.5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                    <Tag size={12} className="text-gold" />
                    {group.category}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {group.items.map((item) => (
                      <div
                        key={item.name}
                        onClick={() => selectPreset(item.url)}
                        className="group relative aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-gray-150 cursor-pointer shadow-xxs hover:shadow hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-2 pt-6">
                          <span className="text-[9px] text-white font-bold leading-none block truncate">
                            {item.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: Cloudinary / Church uploaded files */}
          {activeTab === 'vault' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4.5">
                <div>
                  <h4 className="font-serif font-bold text-gray-800 text-sm flex items-center gap-1.5">
                    <Cloud size={16} className="text-emerald-600" />
                    Archivos Digitales de la Iglesia (Cloudinary)
                  </h4>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                    Aquí se muestran de forma organizada todas las imágenes y recursos multimedia que has subido o están en uso en la web.
                  </p>
                </div>
                <button
                  onClick={fetchChurchMedia}
                  disabled={loadingChurchMedia}
                  className="p-1.5 bg-white border border-gray-200 hover:bg-gray-50 disabled:bg-gray-100 text-gray-650 hover:text-emerald-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                >
                  <RefreshCw size={12} className={loadingChurchMedia ? 'animate-spin' : ''} />
                  Actualizar
                </button>
              </div>

              {loadingChurchMedia ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Loader2 className="animate-spin text-emerald-600 mb-2" size={32} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Cargando biblioteca de archivos...</span>
                </div>
              ) : churchMedia.length > 0 ? (
                <div className="space-y-6">
                  {Object.keys(
                    churchMedia.reduce((acc: any, item) => {
                      if (!acc[item.category]) {
                        acc[item.category] = [];
                      }
                      acc[item.category].push(item);
                      return acc;
                    }, {})
                  ).map((categoryName) => {
                    const items = churchMedia.filter(m => m.category === categoryName);
                    return (
                      <div key={categoryName} className="space-y-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                          <Tag size={12} className="text-emerald-600" />
                          {categoryName}
                          <span className="text-[10px] text-gray-400 lowercase font-medium">({items.length} imágenes)</span>
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {items.map((item, idx) => (
                            <div
                              key={`${item.url}-${idx}`}
                              onClick={() => {
                                onSelect(item.url, { thumbnailUrl: item.url });
                                onClose();
                              }}
                              className="group relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-150 cursor-pointer shadow-xxs hover:shadow-md hover:border-emerald-500 hover:-translate-y-0.5 transition-all duration-200"
                              title={item.name}
                            >
                              <img
                                src={item.url}
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                loading="lazy"
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-2 pt-6">
                                <span className="text-[9px] text-white font-bold leading-tight block truncate">
                                  {item.name}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-gray-400 text-xs">
                  <Cloud size={36} className="mx-auto mb-2 opacity-35 text-emerald-500" />
                  <p className="font-semibold">La biblioteca digital está vacía</p>
                  <p className="text-[10px] text-gray-450 mt-0.5">Sube imágenes en los ministerios o inventario para comenzar a guardarlas aquí.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-[9px] text-gray-450 font-semibold flex justify-between items-center select-none">
          <span>Licencia: Imágenes provistas bajo licencias Creative Commons / Libre de regalías (Royalty Free).</span>
          <span className="text-emerald-600">Totalmente Gratis y sin claves API</span>
        </div>
      </div>
    </div>
  );
}
