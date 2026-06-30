import { Image as ImageIcon, Search, X } from 'lucide-react';
import MediaUploader from '../../../components/common/MediaUploader';

interface HeroCoverEditorProps {
  coverUrl?: string;
  onUpdate: (url: string) => void;
  onSearchMedia: () => void;
}

export const HeroCoverEditor = ({ coverUrl, onUpdate, onSearchMedia }: HeroCoverEditorProps) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 p-5 rounded-2xl space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
        <ImageIcon size={18} className="text-gold" />
        <span>Imagen de Portada de Sección Héroe</span>
      </div>
      <div className="flex flex-col md:flex-row gap-5 items-center">
        <div className="w-full md:w-48 h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 relative group/cover">
          {coverUrl ? (
            <>
              <img loading="lazy" 
                src={coverUrl} 
                alt="Portada Preview" 
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onUpdate('')}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover/cover:opacity-100 transition-opacity cursor-pointer"
                title="Eliminar imagen"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-1 font-semibold">
              <ImageIcon size={24} className="opacity-40" />
              <span>Sin imagen cargada</span>
            </div>
          )}
        </div>
        <div className="flex-grow space-y-3 w-full">
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                URL Directa de la Imagen
              </label>
              <button
                type="button"
                onClick={onSearchMedia}
                className="text-[10px] text-primary hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Search size={12} />
                Buscar en Internet
              </button>
            </div>
            <input
              type="text"
              value={coverUrl || ''}
              onChange={(e) => onUpdate(e.target.value)}
              placeholder="https://images.unsplash.com/... o sube una a la derecha"
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <MediaUploader
              folder="portadas"
              allowedFormats={['jpg', 'jpeg', 'png', 'webp']}
              label="Subir Portada"
              onUploadSuccess={(url: string) => onUpdate(url)}
            />
            <span className="text-[10px] text-slate-400">Recomendado: 1920x1080px (Formatos: JPG, PNG, WEBP)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
