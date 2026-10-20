import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import {
  FolderLock, Upload, Download, Trash2, FileText, Image as ImageIcon,
  RefreshCw, Lock, FileArchive, Cloud
} from 'lucide-react';
import { getAvailableMediaProviders, uploadMediaFile, type MediaProvider } from '../../lib/mediaService';
import { getPreferredMediaProvider, setPreferredMediaProvider } from '../../lib/mediaProviderPreference';
import { usePermissions } from '../../hooks/usePermissions';
import MediaCreditsEditor from '../../features/dashboard/components/MediaCreditsEditor';
import { optimizeLibraryImage } from '../../lib/mediaOptimization';

interface VaultFile {
  name: string;
  id: string;
  metadata: {
    size: number;
    mimetype: string;
    lastModified: string;
  };
  previewUrl?: string;
  provider?: string;
  isCloudinary?: boolean;
  catalogMetadata?: Record<string, unknown>;
}

const MediaVault = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState('');
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'review' | 'complete' | 'private'>('all');
  const [optimize, setOptimize] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [provider, setProvider] = useState<MediaProvider>(() => getPreferredMediaProvider());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = hasPermission('media_vault', 'edit');

  const catalogFiles = files.filter((file) => Boolean(file.catalogMetadata));
  const needsReview = (file: VaultFile) => {
    const metadata = file.catalogMetadata;
    if (!metadata) return false;
    return !metadata.credit || !metadata.source || !metadata.alt || !metadata.rights || metadata.rights === 'unverified';
  };
  const filteredFiles = files.filter((file) => {
    const query = search.trim().toLocaleLowerCase();
    const searchable = [file.name, file.catalogMetadata?.credit, file.catalogMetadata?.source]
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
      .toLocaleLowerCase();
    const matchesSearch = !query || searchable.includes(query);
    const matchesFilter = catalogFilter === 'all'
      || (catalogFilter === 'private' && !file.catalogMetadata)
      || (catalogFilter === 'review' && needsReview(file))
      || (catalogFilter === 'complete' && Boolean(file.catalogMetadata) && !needsReview(file));
    return matchesSearch && matchesFilter;
  });

  const fetchFiles = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // List all files in the bucket root
      const { data, error } = await supabase.storage
        .from('media_vault')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const fileList: VaultFile[] = data
        ? data
            .filter((f) => f.name !== '.emptyFolderPlaceholder')
            .map((f) => ({
              name: f.name,
              id: f.id || '',
              metadata: {
                size: f.metadata?.size || 0,
                mimetype: f.metadata?.mimetype || '',
                lastModified: f.metadata?.lastModified || f.updated_at || '',
              },
            }))
        : [];

      // Fetch from Cloudinary tracked table
      const { data: cloudinaryData, error: cloudinaryError } = await supabase
        .from('media_vault_files')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (cloudinaryError) throw cloudinaryError;
      
      const cloudinaryFileList: VaultFile[] = (cloudinaryData || []).map(f => ({
        name: f.name,
        id: f.id,
        metadata: {
          size: f.size || 0,
          mimetype: f.mimetype || '',
          lastModified: f.created_at
        },
        previewUrl: f.url,
        provider: f.provider || 'legacy',
        isCloudinary: (f.provider || 'legacy') === 'cloudinary'
        ,catalogMetadata: f.metadata ?? {}
      }));

      // Generate signed URLs for previews and downloads
      const filesWithPreviews = await Promise.all(
        fileList.map(async (file) => {
          let previewUrl = '';
          if (file.metadata?.mimetype?.startsWith('image/')) {
            try {
              const { data: signedData, error: signedError } = await supabase.storage
                .from('media_vault')
                .createSignedUrl(file.name, 3600); // 1 hour link
              
              if (!signedError && signedData) {
                previewUrl = signedData.signedUrl;
              }
            } catch (err) {
              console.error('Error creating signed preview URL:', err);
            }
          }
          return { ...file, previewUrl };
        })
      );

      // Merge and sort both lists by date
      const mergedFiles = [...cloudinaryFileList, ...filesWithPreviews].sort((a, b) => {
        return new Date(b.metadata.lastModified).getTime() - new Date(a.metadata.lastModified).getTime();
      });

      setFiles(mergedFiles);
    } catch (err) {
      console.error('Error fetching media vault files:', err);
      setLoadError('No se pudo cargar la biblioteca completa. Reintenta antes de modificar recursos.');
      toast.error('Error al cargar la bóveda de media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchFiles(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const file = fileList[0];
    setUploading(true);

    try {
      const upload = optimize ? await optimizeLibraryImage(file) : file;
      await uploadMediaFile(upload, 'media_vault', 'auto');
      toast.success(`Archivo subido mediante ${getAvailableMediaProviders().find((item) => item.id === provider)?.label || provider}.`);
      fetchFiles();
    } catch (err: unknown) {
      console.error('Error uploading file:', err);
      toast.error(err instanceof Error ? err.message : 'Error al subir el archivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (file: VaultFile) => {
    try {
      if (file.previewUrl && (file.isCloudinary || file.provider === 'supabase' || file.provider === 'r2' || file.provider === 'external')) {
        // Para Cloudinary abrimos la URL en nueva pestaña, con flag de fl_attachment
        const downloadUrl = file.previewUrl.replace('/upload/', '/upload/fl_attachment/');
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', file.name);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Descarga iniciada');
        return;
      }

      const { data, error } = await supabase.storage
        .from('media_vault')
        .createSignedUrl(file.name, 60); // short-lived 60 seconds link

      if (error || !data) throw error || new Error('No se pudo generar enlace de descarga');

      // Open download in a new tab or trigger manual download
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Descarga iniciada');
    } catch (err) {
      console.error('Error downloading asset:', err);
      toast.error('No se pudo descargar el archivo.');
    }
  };

  const handleDelete = async (file: VaultFile) => {
    if (!canEdit) return;
    const confirmed = await confirm({
      title: 'Eliminar recurso',
      message: file.catalogMetadata ? 'Se retirará del catálogo. El archivo original del proveedor se conservará; los enlaces existentes seguirán funcionando.' : 'Se eliminará el archivo del depósito privado. Confirma que conservas su original antes de continuar.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      if (file.catalogMetadata) {
        const { error } = await supabase
          .from('media_vault_files')
          .delete()
          .eq('id', file.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.storage
          .from('media_vault')
          .remove([file.name]);
        if (error) throw error;
      }

      setFiles(prev => prev.filter(f => f.id !== file.id));
      toast.success(file.catalogMetadata ? 'Recurso retirado del catálogo. El original del proveedor se conserva.' : 'Recurso eliminado de la bóveda');
    } catch (err) {
      console.error('Error deleting asset:', err);
      toast.error('No se pudo eliminar el recurso.');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime: string) => {
    if (mime?.startsWith('image/')) return <ImageIcon size={28} className="text-blue-500" />;
    if (mime?.includes('zip') || mime?.includes('tar') || mime?.includes('rar')) return <FileArchive size={28} className="text-amber-500" />;
    return <FileText size={28} className="text-slate-400" />;
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-20 -z-10 h-96 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.11),transparent_38%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.09),transparent_35%)]" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-white/5 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <FolderLock className="text-amber-600" />
            Biblioteca de medios
          </h1>
          <p className="text-gray-500 dark:text-gray-450 text-sm">
            Recursos, procedencia, créditos y derechos de uso.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && <select value={provider} onChange={(event) => { const nextProvider = event.target.value as MediaProvider; setProvider(nextProvider); setPreferredMediaProvider(nextProvider); }} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-white" aria-label="Proveedor de almacenamiento"><option value="cloudinary">Cloudinary</option><option value="supabase">Supabase Storage</option>{getAvailableMediaProviders().some((item) => item.id === 'r2') && <option value="r2">Cloudflare R2</option>}</select>}
          <button
            onClick={fetchFiles}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400 transition-colors cursor-pointer"
            title="Actualizar bóveda"
          >
            <RefreshCw size={18} />
          </button>

          {canEdit && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                className="hidden"
                accept="*/*"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50"
              >
                {uploading ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <Upload size={18} />
                )}
                {uploading ? 'Subiendo...' : 'Subir Recurso'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Security alert */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 flex gap-3 items-center border border-slate-800 shadow-md">
        <Lock className="text-amber-500 shrink-0" size={20} />
        <p className="text-xs leading-relaxed text-slate-300">
          Los archivos del depósito privado usan enlaces temporales. Los recursos publicados en Cloudinary o en la biblioteca pública mantienen enlaces públicos; revisa sus derechos antes de utilizarlos.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3" aria-label="Estado de la biblioteca">
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.03]"><strong className="block text-xl text-slate-900 dark:text-white">{catalogFiles.length}</strong><span className="text-xs text-slate-500">Recursos del catálogo</span></div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-300/20 dark:bg-amber-300/[0.05]"><strong className="block text-xl text-amber-900 dark:text-amber-100">{catalogFiles.filter(needsReview).length}</strong><span className="text-xs text-amber-900/75 dark:text-amber-100/75">Con datos de procedencia pendientes</span></div>
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.03]"><strong className="block text-xl text-slate-900 dark:text-white">{files.filter((file) => !file.catalogMetadata).length}</strong><span className="text-xs text-slate-500">Archivos del depósito privado</span></div>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="min-w-0 flex-1 text-sm font-semibold">Buscar recurso<input type="search" value={search} onChange={e => setSearch(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/15 dark:bg-slate-950" /></label>
        <label className="text-sm font-semibold">Mostrar<select value={catalogFilter} onChange={(event) => setCatalogFilter(event.target.value as typeof catalogFilter)} className="mt-1 min-h-11 w-full min-w-56 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/15 dark:bg-slate-950"><option value="all">Todos los recursos</option><option value="review">Procedencia por revisar</option><option value="complete">Procedencia registrada</option><option value="private">Depósito privado</option></select></label>
        {canEdit && <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={optimize} onChange={e=>setOptimize(e.target.checked)}/>Optimizar JPG/PNG grandes a WebP (1920 px)</label>}
      </div>
      {loadError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{loadError}</p>}

      {loading ? (
        <div className="flex justify-center items-center py-40">
          <RefreshCw className="animate-spin text-amber-600" size={32} />
        </div>
      ) : (
        /* Files Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <>
            {filteredFiles.map((file) => (
              <AnimeFadeUp
                key={file.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                {/* Preview window */}
                <div className="h-36 bg-slate-950 flex items-center justify-center relative group overflow-hidden border-b border-gray-100 dark:border-white/5">
                  {file.previewUrl ? (
                    <img loading="lazy"
                      src={file.previewUrl}
                      alt={file.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      {getFileIcon(file.metadata?.mimetype)}
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {file.name.split('.').pop() || 'Archivo'}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white rounded-full p-1 border border-white/20" title={file.catalogMetadata ? `Recurso público · ${file.provider || 'proveedor registrado'}` : 'Archivo del depósito privado'}>
                    {file.catalogMetadata ? <Cloud size={12} className="text-blue-400" /> : <Lock size={12} className="text-amber-400" />}
                  </div>
                  {file.catalogMetadata && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{needsReview(file) ? 'Procedencia por completar' : 'Procedencia registrada'}{files.some(other => other.id !== file.id && file.catalogMetadata?.sha256 && other.catalogMetadata?.sha256 === file.catalogMetadata.sha256) ? ' · Duplicado exacto' : ''}{file.metadata.mimetype.startsWith('image/') && file.metadata.size > 1024*1024 ? ' · Imagen grande' : ''}</p>}
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate" title={file.name}>
                      {file.name.split('_').slice(1).join('_') || file.name}
                    </h3>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                      <span>{formatSize(file.metadata?.size || 0)}</span>
                      <span>
                        {file.metadata?.lastModified 
                          ? new Date(file.metadata.lastModified).toLocaleDateString('es-ES') 
                          : 'Reciente'}
                      </span>
                    </div>
                  </div>
                  {canEdit && file.catalogMetadata && <MediaCreditsEditor id={file.id} metadata={file.catalogMetadata} onSaved={() => void fetchFiles()} />}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-white/5 mt-2">
                    <button
                      onClick={() => handleDownload(file)}
                      className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                    >
                      <Download size={14} />
                      Descargar Original
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => handleDelete(file)}
                        className="grid min-h-11 min-w-11 place-items-center text-gray-500 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Eliminar recurso"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </AnimeFadeUp>
            ))}
          </>

          {files.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
              <FolderLock className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-serif font-bold text-gray-700 dark:text-gray-300">La bóveda de media está vacía</h3>
              <p className="text-gray-400 text-sm mt-1">Sube archivos vectoriales o de alta resolución para los ministerios.</p>
            </div>
          )}
          {files.length > 0 && filteredFiles.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center text-sm text-slate-600 dark:border-white/15 dark:text-slate-300">No hay recursos que coincidan con esta búsqueda y filtro.</div>}
        </div>
      )}

    </div>
  );
};

export default MediaVault;
