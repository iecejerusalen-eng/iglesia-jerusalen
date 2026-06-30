import { useState } from 'react';
import { Loader2, FileCode, Check, Copy, Palette, ExternalLink, FolderHeart, Trash2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import type { LogoData } from '../types';
import { useDeleteLogo } from '../hooks/useLogosMutations';
import { toast } from 'sonner';
import { useConfirmStore } from '../../../store/useConfirmStore';

interface LogoGridProps {
  logos: LogoData[];
  isLoading: boolean;
  onEditSvg: (logo: LogoData) => void;
}

export default function LogoGrid({ logos, isLoading, onEditSvg }: LogoGridProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const deleteLogo = useDeleteLogo();
  const confirm = useConfirmStore((state) => state.confirm);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getPublicUrl = (logoPath: string) => {
    return supabase.storage.from('logos').getPublicUrl(logoPath).data.publicUrl;
  };

  const copyToClipboard = (logoPath: string, logoId: string) => {
    const { data } = supabase.storage.from('logos').getPublicUrl(logoPath);
    if (data?.publicUrl) {
      navigator.clipboard.writeText(data.publicUrl);
      setCopiedId(logoId);
      toast.success('URL del logo copiada al portapapeles.');
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.error('No se pudo generar la URL pública del logo.');
    }
  };

  const handleDelete = async (logo: LogoData) => {
    const confirmed = await confirm({
      title: 'Eliminar logo',
      message: '¿Estás seguro de que deseas eliminar este logo?\n\nSe borrará del almacenamiento permanentemente.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    setDeletingId(logo.id);
    deleteLogo.mutate(logo, {
      onSettled: () => setDeletingId(null)
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (logos.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
        <ImageIcon className="mx-auto text-gray-300 mb-4" size={48} />
        <h3 className="text-lg font-serif font-bold text-gray-700 dark:text-gray-300">No se encontraron logos</h3>
        <p className="text-gray-400 text-sm mt-1">Sube el primer logo o ajusta los filtros de búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {logos.map((logo) => {
        const publicUrl = getPublicUrl(logo.storage_path);
        const isRenderable = ['png', 'svg', 'webp', 'jpg', 'jpeg'].includes(logo.format.toLowerCase());
        
        const colorModeLabels = {
          color: 'Color',
          blanco_y_negro: 'B&N',
          blanco_solido: 'Blanco Sólido',
          negro_solido: 'Negro Sólido'
        };

        const variantLabels = {
          cuadrado: 'Cuadrado',
          circular: 'Circular',
          vertical: 'Vertical',
          horizontal: 'Horizontal'
        };

        return (
          <div 
            key={logo.id} 
            className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
          >
            {/* Visual Container */}
            <div className="h-44 bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-6 border-b border-gray-100 dark:border-white/5 relative overflow-hidden">
              {isRenderable ? (
                <img 
                  src={publicUrl} 
                  alt={`Logo ${logo.variant}`}
                  className="max-w-full max-h-full object-contain drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <FileCode size={48} className="text-gold mb-2" />
                  <span className="font-mono text-sm uppercase font-bold">{logo.format}</span>
                  <span className="text-[10px] text-gray-400 mt-1">Archivo de Diseño Vectorial</span>
                </div>
              )}

              {/* Floating Actions on Hover */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => copyToClipboard(logo.storage_path, logo.id)}
                  className="bg-white dark:bg-slate-900 hover:bg-gray-100 text-gray-800 dark:text-gray-100 p-2 rounded-xl shadow-sm transition-transform hover:scale-105 flex items-center gap-1 text-xs font-semibold cursor-pointer"
                  title="Copiar Enlace público"
                >
                  {copiedId === logo.id ? (
                    <Check size={16} className="text-green-600" />
                  ) : (
                    <Copy size={16} />
                  )}
                  <span>Copiar URL</span>
                </button>
                
                {logo.format.toLowerCase() === 'svg' && (
                  <button
                    onClick={() => onEditSvg(logo)}
                    className="bg-white dark:bg-slate-900 hover:bg-gray-100 text-gray-800 dark:text-gray-100 p-2 rounded-xl shadow-sm transition-transform hover:scale-105 flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    title="Editar colores del SVG"
                  >
                    <Palette size={16} className="text-primary" />
                    <span>Editar</span>
                  </button>
                )}

                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white dark:bg-slate-900 hover:bg-gray-100 text-gray-800 dark:text-gray-100 p-2 rounded-xl shadow-sm transition-transform hover:scale-105 flex items-center gap-1 text-xs font-semibold"
                >
                  <ExternalLink size={16} />
                  <span>Ver</span>
                </a>
              </div>
            </div>

            {/* Metadata Details */}
            <div className="p-4 flex-grow flex flex-col justify-between space-y-2">
              <div>
                {/* Title / Ministry Owner */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FolderHeart size={14} className="text-gold flex-shrink-0" />
                  <span className="font-serif font-bold text-gray-800 dark:text-gray-100 text-sm truncate">
                    {logo.ministries?.name || 'Iglesia General'}
                  </span>
                </div>

                {/* Badges Grid */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-100">
                    {variantLabels[logo.variant]}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-100">
                    {colorModeLabels[logo.color_mode]}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-gray-100 text-gray-600 dark:text-gray-400">
                    {logo.format}
                  </span>
                </div>
              </div>

              {/* Card Footer Delete Button */}
              <div className="pt-2 border-t border-gray-50 flex justify-end">
                <button
                  onClick={() => handleDelete(logo)}
                  disabled={deletingId === logo.id}
                  className="text-gray-400 hover:text-accent-red p-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
                  title="Eliminar Logo"
                >
                  {deletingId === logo.id ? (
                    <Loader2 className="animate-spin text-red-500" size={14} />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
