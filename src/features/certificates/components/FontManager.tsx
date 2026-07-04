import { useState } from 'react';
import { Type, Upload, Trash2 } from 'lucide-react';
import { useFonts } from '../hooks/useFonts';
import { useFontMutations } from '../hooks/useFontMutations';
import { uploadCertificateAsset } from '../utils/cloudinary';
import { toast } from 'sonner';

export const FontManager = () => {
  const { data: fonts, isLoading } = useFonts();
  const { createFont, deleteFont, isCreating, isDeleting } = useFontMutations();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file || !name) {
      toast.error('Nombre y archivo son obligatorios');
      return;
    }

    setIsUploading(true);
    try {
      const { secure_url, public_id } = await uploadCertificateAsset(file, 'fonts', 'raw');
      
      const isOtf = file.name.toLowerCase().endsWith('.otf');
      
      await createFont({
        name,
        family: name, // Simplified for now
        weight: 'regular',
        font_url: secure_url,
        cloudinary_public_id: public_id,
        format: isOtf ? 'otf' : 'ttf',
      });
      
      setFile(null);
      setName('');
      (document.getElementById('font-upload') as HTMLInputElement).value = '';
    } catch (error) {
      console.error(error);
      toast.error('Error al subir la fuente');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="dark-card p-6 border-l-4 border-l-primary dark:border-l-church-gold-bright">
        <h3 className="font-bold text-lg mb-2">Añadir Nueva Fuente</h3>
        <p className="text-sm text-gray-500 mb-4">Sube archivos .ttf o .otf para usar en tus certificados.</p>
        
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-500 mb-1">Nombre (ej: Montserrat Bold)</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full dark-input p-2 text-sm"
              placeholder="Nombre para identificarla"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-500 mb-1">Archivo de Fuente</label>
            <div className="relative">
              <input 
                type="file" 
                id="font-upload"
                accept=".ttf,.otf"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-full dark-input p-2 text-sm flex items-center justify-between pointer-events-none bg-gray-50 dark:bg-slate-800">
                <span className="truncate text-gray-500">{file ? file.name : 'Seleccionar archivo .ttf o .otf'}</span>
                <Upload size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
          <button
            onClick={handleUpload}
            disabled={isUploading || isCreating || !file || !name}
            className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-lg flex items-center justify-center gap-2 font-bold disabled:opacity-50"
          >
            {isUploading || isCreating ? 'Subiendo...' : 'Guardar Fuente'}
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-lg mb-4 dark:text-white">Fuentes Instaladas</h3>
        
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Cargando fuentes...</div>
        ) : fonts?.length === 0 ? (
          <div className="text-center py-12 dark-card">
            <p className="text-gray-500 dark:text-gray-400">No hay fuentes instaladas. La herramienta usará Helvetica por defecto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {fonts?.map((font) => (
              <div key={font.id} className="dark-card p-4 flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg shrink-0">
                    <Type size={20} className="text-gray-500" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-sm truncate" title={font.name}>{font.name}</p>
                    <p className="text-xs text-gray-500 uppercase">{font.format}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar la fuente ${font.name}?`)) deleteFont(font.id);
                  }}
                  disabled={isDeleting}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
