import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import {
  FolderLock, Upload, Download, Trash2, FileText, Image as ImageIcon,
  RefreshCw, Lock, FileArchive
} from 'lucide-react';

interface VaultFile {
  name: string;
  id: string;
  metadata: {
    size: number;
    mimetype: string;
    lastModified: string;
  };
  previewUrl?: string;
}

const MediaVault = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  const { role } = useAuthStore();
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = ['admin', 'multimedia'].includes(role || '');

  const fetchFiles = async () => {
    setLoading(true);
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

      setFiles(filesWithPreviews);
    } catch (err) {
      console.error('Error fetching media vault files:', err);
      toast.error('Error al cargar la bóveda de media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const file = fileList[0];
    setUploading(true);

    try {
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { error } = await supabase.storage
        .from('media_vault')
        .upload(fileName, file);

      if (error) throw error;

      toast.success('Archivo subido correctamente a la bóveda privada');
      fetchFiles();
    } catch (err: any) {
      console.error('Error uploading file:', err);
      toast.error(err.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('media_vault')
        .createSignedUrl(fileName, 60); // short-lived 60 seconds link

      if (error || !data) throw error || new Error('No se pudo generar enlace de descarga');

      // Open download in a new tab or trigger manual download
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Descarga iniciada');
    } catch (err) {
      console.error('Error downloading asset:', err);
      toast.error('No se pudo descargar el archivo.');
    }
  };

  const handleDelete = async (fileName: string) => {
    const confirmed = await confirm({
      title: 'Eliminar recurso',
      message: '¿Estás seguro de eliminar este recurso permanentemente de la bóveda multimedia?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.storage
        .from('media_vault')
        .remove([fileName]);

      if (error) throw error;

      setFiles(prev => prev.filter(f => f.name !== fileName));
      toast.success('Recurso eliminado de la bóveda');
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
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold text-gray-800 flex items-center gap-2">
            <FolderLock className="text-amber-600" />
            Bóveda de Media Privada
          </h1>
          <p className="text-gray-500 text-sm">
            Recursos gráficos de alta resolución (SVG, PNG, JPG, AI) protegidos con firmas digitales temporales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFiles}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
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
          <strong>Acceso Altamente Protegido:</strong> Las imágenes mostradas abajo son previsualizaciones generadas con enlaces firmados que expiran automáticamente en 1 hora. La bóveda está encriptada y bloqueada para cualquier acceso externo sin credenciales administrativas.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-40">
          <RefreshCw className="animate-spin text-amber-600" size={32} />
        </div>
      ) : (
        /* Files Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {files.map((file) => (
              <motion.div
                key={file.name}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col h-[280px]"
              >
                {/* Preview window */}
                <div className="h-36 bg-slate-950 flex items-center justify-center relative group overflow-hidden border-b border-gray-100">
                  {file.previewUrl ? (
                    <img
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
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white rounded-full p-1 border border-white/20">
                    <Lock size={12} className="text-amber-400" />
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-800 text-sm truncate" title={file.name}>
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

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                    <button
                      onClick={() => handleDownload(file.name)}
                      className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                    >
                      <Download size={14} />
                      Descargar Original
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => handleDelete(file.name)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Eliminar recurso"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {files.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white border border-dashed border-gray-200 rounded-2xl">
              <FolderLock className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-serif font-bold text-gray-700">La bóveda de media está vacía</h3>
              <p className="text-gray-400 text-sm mt-1">Sube archivos vectoriales o de alta resolución para los ministerios.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default MediaVault;
