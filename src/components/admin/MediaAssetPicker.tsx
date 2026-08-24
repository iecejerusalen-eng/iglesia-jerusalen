import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Clipboard, ImagePlus, Link2, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../config/supabase';
import { getAvailableMediaProviders, getPreferredMediaProvider, uploadMediaAsset, type MediaAsset, type MediaProvider } from '../../lib/mediaService';

interface MediaAssetPickerProps {
  value?: string | null;
  onSelect: (asset: MediaAsset) => void;
  folder: string;
  allowedTypes?: Array<'image' | 'video' | 'raw'>;
  label?: string;
}

interface CatalogAsset extends MediaAsset {
  id: string;
  name: string;
  createdAt: string;
}

const getResourceType = (file: File): MediaAsset['resourceType'] => {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  return 'raw';
};

const isAllowedFile = (file: File, allowedTypes: MediaAsset['resourceType'][]): boolean => allowedTypes.includes(getResourceType(file));

export default function MediaAssetPicker({ value, onSelect, folder, allowedTypes = ['image'], label = 'Elegir recurso' }: MediaAssetPickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<MediaProvider>(() => getPreferredMediaProvider());
  const [assets, setAssets] = useState<CatalogAsset[]>([]);
  const [url, setUrl] = useState('');
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadAssets = useCallback(async () => {
    setLoadingAssets(true);
    const { data, error } = await supabase.from('media_vault_files').select('id, name, url, provider, storage_path, metadata, mimetype, created_at').order('created_at', { ascending: false }).limit(12);
    if (error) {
      toast.error(`No se pudo cargar la biblioteca: ${error.message}`);
      setLoadingAssets(false);
      return;
    }
    const rows = (data ?? []) as Array<{ id: string; name: string; url: string; provider: MediaProvider; storage_path: string | null; metadata: Record<string, unknown> | null; mimetype: string | null; created_at: string }>;
    setAssets(rows.filter((row) => allowedTypes.includes(row.mimetype?.startsWith('video/') ? 'video' : row.mimetype?.startsWith('image/') ? 'image' : 'raw')).map((row) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      provider: row.provider,
      storagePath: row.storage_path,
      publicId: typeof row.metadata?.public_id === 'string' ? row.metadata.public_id : null,
      format: typeof row.metadata?.format === 'string' ? row.metadata.format : row.name.split('.').pop()?.toLowerCase() ?? 'bin',
      resourceType: row.mimetype?.startsWith('video/') ? 'video' : row.mimetype?.startsWith('image/') ? 'image' : 'raw',
      createdAt: row.created_at,
    })));
    setLoadingAssets(false);
  }, [allowedTypes]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => { void loadAssets(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAssets, open]);

  const selectAsset = (asset: MediaAsset) => {
    onSelect(asset);
    setOpen(false);
  };

  const uploadFile = async (file: File) => {
    const resourceType = getResourceType(file);
    if (!isAllowedFile(file, allowedTypes)) {
      toast.error('Este tipo de archivo no está permitido en este campo.');
      return;
    }
    setUploading(true);
    try {
      const asset = await uploadMediaAsset(file, provider, folder, resourceType);
      selectAsset(asset);
      toast.success('Recurso guardado en la biblioteca.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el recurso.');
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    const item = Array.from(event.clipboardData.items).find((clipboardItem) => clipboardItem.type.startsWith('image/'));
    const file = item?.getAsFile();
    if (!file) return;
    event.preventDefault();
    const extension = file.type.split('/')[1] || 'png';
    await uploadFile(new File([file], `portapapeles-${Date.now()}.${extension}`, { type: file.type }));
  };

  return <div className="relative" onPaste={(event) => { void handlePaste(event); }}>
    <button type="button" onClick={() => setOpen((current) => !current)} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-black text-amber-800 transition hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200" aria-expanded={open}>
      <ImagePlus size={15} /> {label} <ChevronDown size={14} className={open ? 'rotate-180 transition' : 'transition'} />
    </button>
    {open && <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-white/10"><div><p className="text-xs font-black">Recursos multimedia</p><p className="mt-0.5 text-[10px] text-slate-500">Sube, pega o reutiliza un recurso.</p></div><button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5" aria-label="Cerrar selector"><X size={15} /></button></div>
      <div tabIndex={0} className="mt-3 rounded-xl border border-dashed border-blue-300 bg-blue-50/60 p-4 text-center outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-400/30 dark:bg-blue-400/10"><Clipboard size={18} className="mx-auto text-blue-600 dark:text-blue-300" /><p className="mt-2 text-xs font-bold text-blue-900 dark:text-blue-100">Pega una imagen aquí</p><p className="mt-1 text-[10px] text-blue-700/70 dark:text-blue-200/70">Ctrl+V o Cmd+V con esta zona enfocada</p></div>
      <div className="mt-3 grid grid-cols-2 gap-2"><select value={provider} onChange={(event) => setProvider(event.target.value as MediaProvider)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold dark:border-white/10 dark:bg-slate-950">{getAvailableMediaProviders().map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-primary px-2 text-[11px] font-bold text-white disabled:opacity-50"><Upload size={13} /> {uploading ? 'Subiendo…' : 'Subir archivo'}</button><input ref={inputRef} type="file" accept={allowedTypes.map((type) => type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : '*/*').join(',')} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(file); event.target.value = ''; }} className="hidden" /></div>
      <div className="mt-3 flex gap-2"><input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Pegar URL externa…" className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] dark:border-white/10 dark:bg-slate-950" /><button type="button" disabled={!url.trim()} onClick={() => { selectAsset({ url: url.trim(), provider: 'cloudinary', storagePath: null, publicId: null, format: 'url', resourceType: 'image' }); setUrl(''); }} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[11px] font-bold disabled:opacity-40 dark:border-white/10"><Link2 size={13} /> Usar</button></div>
      <div className="mt-4"><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Usados recientemente</p>{loadingAssets && <Loader2 size={13} className="animate-spin text-slate-400" />}</div>{assets.length ? <div className="grid grid-cols-4 gap-2">{assets.map((asset) => <button type="button" key={asset.id} onClick={() => selectAsset(asset)} className={`relative aspect-square overflow-hidden rounded-lg border ${value === asset.url ? 'border-primary ring-2 ring-primary/30' : 'border-slate-200 dark:border-white/10'}`} title={asset.name}>{asset.resourceType === 'image' ? <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center bg-slate-100 text-[9px] font-bold text-slate-500 dark:bg-white/5">{asset.resourceType}</span>}{value === asset.url && <span className="absolute right-1 top-1 rounded-full bg-primary p-0.5 text-white"><Check size={10} /></span>}</button>)}</div> : <p className="rounded-lg bg-slate-50 p-3 text-[10px] text-slate-500 dark:bg-white/5">No hay recursos compatibles recientes.</p>}</div>
    </div>}
  </div>;
}
