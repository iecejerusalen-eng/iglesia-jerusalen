import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { useTemplates } from '../hooks/useTemplates';
import { useFonts } from '../hooks/useFonts';
import { generateCertificate } from '../utils/pdfEngine';
import { toast } from 'sonner';


export const SingleGeneratorForm = () => {
  const { data: templates } = useTemplates();
  const { data: fonts } = useFonts();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  const handleInputChange = (fieldKey: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleDownload = async () => {
    if (!selectedTemplate) return;
    setIsGenerating(true);

    try {
      const fontMap = new Map<string, string>();
      fonts?.forEach(f => {
        fontMap.set(f.id, f.font_url);
      });

      const pdfBytes = await generateCertificate(
        selectedTemplate.pdf_url,
        selectedTemplate.field_mappings,
        formData,
        fontMap
      );

      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificado_${formData.full_name || 'Generado'}.pdf`.replace(/\s+/g, '_');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Certificado generado exitosamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al generar el certificado');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Formulario */}
      <div className="flex-1 space-y-6">
        <div className="dark-card p-6">
          <label className="block text-sm font-bold mb-2">1. Selecciona una Plantilla</label>
          <select 
            value={selectedTemplateId}
            onChange={e => setSelectedTemplateId(e.target.value)}
            className="w-full dark-input p-3"
          >
            <option value="">-- Seleccionar --</option>
            {templates?.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
            ))}
          </select>
        </div>

        {selectedTemplate && selectedTemplate.field_mappings.length > 0 && (
          <div className="dark-card p-6 space-y-4">
            <h3 className="font-bold text-lg border-b pb-2 dark:border-white/10">2. Ingresa los Datos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Extraemos las claves únicas que necesita la plantilla */}
              {Array.from(new Set(selectedTemplate.field_mappings.map(f => f.memberField))).map(fieldKey => {
                // Si es un campo especial de fecha o nombre, sugerir placeholder
                let type = 'text';
                if (fieldKey.includes('date')) type = 'date';
                
                return (
                  <div key={fieldKey}>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                      {fieldKey.replace(/_/g, ' ')}
                    </label>
                    <input 
                      type={type}
                      value={formData[fieldKey] || ''}
                      onChange={e => handleInputChange(fieldKey, e.target.value)}
                      className="w-full dark-input p-2"
                      placeholder={`Valor para ${fieldKey}`}
                    />
                  </div>
                );
              })}
            </div>
            
            <div className="pt-6 flex justify-end">
              <button 
                onClick={handleDownload}
                disabled={isGenerating}
                className="px-6 py-3 bg-primary text-white rounded-xl flex items-center gap-2 font-bold shadow-md hover:bg-blue-900 disabled:opacity-50"
              >
                {isGenerating ? 'Generando...' : <><Download size={18} /> Descargar Certificado</>}
              </button>
            </div>
          </div>
        )}

        {selectedTemplate && selectedTemplate.field_mappings.length === 0 && (
          <div className="dark-card p-6 text-center text-amber-600 bg-amber-50 dark:bg-amber-900/20">
            Esta plantilla no tiene campos configurados. Ve a la pestaña "Plantillas" y configúrala.
          </div>
        )}
      </div>

      {/* Preview Info */}
      <div className="w-full lg:w-80 shrink-0">
        <div className="dark-card p-6 bg-gray-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3 text-primary dark:text-blue-400 mb-4">
            <FileText size={24} />
            <h3 className="font-bold">Información</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
            Al hacer clic en descargar, el motor procesará el PDF original de alta calidad, inyectará los textos con las fuentes correspondientes y te entregará el archivo final sin pasar por el servidor.
          </p>
          {selectedTemplate && (
            <div className="text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
              <p><strong>Campos dinámicos:</strong> {selectedTemplate.field_mappings.length}</p>
              <p><strong>Dimensiones:</strong> {selectedTemplate.page_width}x{selectedTemplate.page_height} pt</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
