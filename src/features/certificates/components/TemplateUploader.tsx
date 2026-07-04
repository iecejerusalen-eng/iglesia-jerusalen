import { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { useTemplateMutations } from '../hooks/useTemplateMutations';
import { uploadCertificateAsset } from '../utils/cloudinary';
import { toast } from 'sonner';
import type { CertificateType } from '../types';

export const TemplateUploader = ({ onClose }: { onClose: () => void }) => {
  const { createTemplate, isCreating } = useTemplateMutations();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<CertificateType>('bautismo');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file || !name) {
      toast.error('Nombre y archivo son obligatorios');
      return;
    }

    setIsUploading(true);
    try {
      const { secure_url, public_id } = await uploadCertificateAsset(file, 'templates', 'raw');
      
      await createTemplate({
        name,
        description: '',
        type,
        pdf_url: secure_url,
        cloudinary_public_id: public_id,
        page_width: 612, // Default, will update inside the mapper
        page_height: 792,
        field_mappings: [],
        font_config: {},
        created_by: '00000000-0000-0000-0000-000000000000', // Debe reemplazarse con el user.id real en production
      });
      
      onClose();
    } catch (error) {
      toast.error('Error al subir la plantilla');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b pb-3 dark:border-white/10">
          <h3 className="text-xl font-bold dark:text-white">Subir Plantilla PDF</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white"><X /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Nombre de la Plantilla</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full dark-input p-2" 
              placeholder="Ej: Bautismo 2026"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Tipo</label>
            <select 
              value={type}
              onChange={e => setType(e.target.value as CertificateType)}
              className="w-full dark-input p-2"
            >
              <option value="bautismo">Bautismo</option>
              <option value="dedicacion">Dedicación de Niños</option>
              <option value="matrimonio">Matrimonio</option>
              <option value="membresia">Membresía</option>
              <option value="graduacion_escuela_dominical">Graduación E. Dominical</option>
              <option value="ordenacion">Ordenación</option>
              <option value="reconocimiento_servicio">Reconocimiento Servicio</option>
              <option value="diploma">Diploma General</option>
              <option value="custom">Otro (Personalizado)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Archivo PDF</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-8 text-center">
              <input 
                type="file" 
                accept="application/pdf"
                className="hidden"
                id="pdf-upload"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <FileText size={40} className="text-gray-400" />
                <span className="text-sm font-semibold text-primary dark:text-blue-400">
                  {file ? file.name : 'Haz clic para seleccionar un PDF'}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl dark:hover:bg-slate-800">
            Cancelar
          </button>
          <button 
            onClick={handleUpload}
            disabled={isUploading || isCreating || !file || !name}
            className="px-6 py-2 bg-primary text-white rounded-xl flex items-center gap-2 disabled:opacity-50"
          >
            {(isUploading || isCreating) ? 'Subiendo...' : <><Upload size={16} /> Subir Plantilla</>}
          </button>
        </div>
      </div>
    </div>
  );
};
