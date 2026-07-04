import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useTemplates } from '../hooks/useTemplates';
import { useTemplateMutations } from '../hooks/useTemplateMutations';
import { TemplateUploader } from './TemplateUploader';
import { CoordinateMapper } from './CoordinateMapper';
import type { CertificateTemplate } from '../types';

export const TemplateList = () => {
  const { data: templates, isLoading } = useTemplates();
  const { deleteTemplate, isDeleting } = useTemplateMutations();
  const [showUploader, setShowUploader] = useState(false);
  const [mapperTemplate, setMapperTemplate] = useState<CertificateTemplate | null>(null);

  if (mapperTemplate) {
    return (
      <CoordinateMapper 
        template={mapperTemplate} 
        onBack={() => setMapperTemplate(null)} 
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold dark:text-white">Plantillas Disponibles</h2>
        <button
          onClick={() => setShowUploader(true)}
          className="bg-primary hover:bg-blue-900 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} />
          Nueva Plantilla
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Cargando plantillas...</div>
      ) : templates?.length === 0 ? (
        <div className="text-center py-12 dark-card">
          <p className="text-gray-500 dark:text-gray-400">No hay plantillas registradas. Sube un PDF para comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((template) => (
            <div key={template.id} className="dark-card p-4 flex flex-col gap-2">
              <h3 className="font-bold text-lg truncate" title={template.name}>{template.name}</h3>
              <p className="text-sm text-gray-500 uppercase">{template.type.replace(/_/g, ' ')}</p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setMapperTemplate(template)}
                  className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer"
                  title="Configurar Campos"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Eliminar esta plantilla?')) deleteTemplate(template.id);
                  }}
                  disabled={isDeleting}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploader && (
        <TemplateUploader onClose={() => setShowUploader(false)} />
      )}
    </div>
  );
};
