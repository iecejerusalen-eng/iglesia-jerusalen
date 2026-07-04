import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { useTemplateMutations } from '../hooks/useTemplateMutations';
import type { CertificateTemplate, FieldMapping } from '../types';
import { FieldConfigPanel } from './FieldConfigPanel';

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const CoordinateMapper = ({ 
  template, 
  onBack 
}: { 
  template: CertificateTemplate;
  onBack: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { updateTemplate, isUpdating } = useTemplateMutations();
  const [fields, setFields] = useState<FieldMapping[]>(template.field_mappings || []);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [pdfScale, setPdfScale] = useState(1);
  const [pageDims, setPageDims] = useState({ width: template.page_width, height: template.page_height });

  useEffect(() => {
    let renderTask: any = null;
    const renderPDF = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(template.pdf_url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        
        // Ajustar escala según el contenedor, por simplicidad usamos 1.5 aquí
        const scale = 1.2;
        setPdfScale(scale);
        const viewport = page.getViewport({ scale });
        
        setPageDims({ width: viewport.width / scale, height: viewport.height / scale });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (error) {
        console.error('Error renderizando PDF:', error);
      }
    };
    renderPDF();
    
    return () => {
      if (renderTask) renderTask.cancel();
    };
  }, [template.pdf_url]);

  const handleAddField = () => {
    const newField: FieldMapping = {
      id: `field_${Date.now()}`,
      label: 'Nuevo Campo',
      key: `custom_${Date.now()}`,
      memberField: 'full_name',
      x: pageDims.width / 2,
      y: pageDims.height / 2,
      fontSize: 24,
      fontId: null,
      color: '#000000',
      alignment: 'center',
      maxWidth: 400,
      transform: 'none'
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const handleUpdateField = (updatedField: FieldMapping) => {
    setFields(fields.map(f => f.id === updatedField.id ? updatedField : f));
  };

  const handleDeleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const handleSave = async () => {
    await updateTemplate({
      id: template.id,
      field_mappings: fields,
      page_width: pageDims.width,
      page_height: pageDims.height
    });
  };

  // Convertir coordenadas del PDF a coordenadas del DOM (Canvas escalado)
  const toDomCoords = (pdfX: number, pdfY: number) => ({
    x: pdfX * pdfScale,
    y: (pageDims.height - pdfY) * pdfScale
  });

  // Convertir coordenadas del DOM a coordenadas del PDF
  const toPdfCoords = (domX: number, domY: number) => ({
    x: domX / pdfScale,
    y: pageDims.height - (domY / pdfScale)
  });

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] -mx-6 -my-6 bg-gray-100 dark:bg-slate-950">
      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-white/10 p-4 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-bold text-lg">{template.name}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleAddField}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
          >
            <Plus size={16} /> Añadir Campo
          </button>
          <button 
            onClick={handleSave}
            disabled={isUpdating}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-900 font-bold shadow-md"
          >
            <Save size={16} /> {isUpdating ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-gray-200 dark:bg-slate-800 p-8 flex justify-center relative custom-scrollbar">
          <div className="relative shadow-2xl" style={{ width: pageDims.width * pdfScale, height: pageDims.height * pdfScale }}>
            <canvas ref={canvasRef} className="absolute inset-0 z-0 bg-white" />
            
            {/* Field Markers */}
            {fields.map(field => {
              const domPos = toDomCoords(field.x, field.y);
              const isSelected = selectedFieldId === field.id;
              
              return (
                <div
                  key={field.id}
                  onClick={() => setSelectedFieldId(field.id)}
                  className={`absolute z-10 cursor-move border-2 px-2 py-1 select-none whitespace-nowrap transform -translate-y-full ${
                    isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-dashed border-gray-500 bg-black/5 hover:border-blue-300'
                  }`}
                  style={{
                    left: field.alignment === 'center' ? domPos.x : field.alignment === 'right' ? domPos.x : domPos.x,
                    top: domPos.y,
                    transform: field.alignment === 'center' ? 'translate(-50%, -100%)' : field.alignment === 'right' ? 'translate(-100%, -100%)' : 'translate(0, -100%)',
                    color: field.color,
                    fontSize: `${field.fontSize * pdfScale}px`,
                    fontFamily: 'sans-serif'
                  }}
                  draggable
                  onDragEnd={(e) => {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const dropX = e.clientX - rect.left;
                    const dropY = e.clientY - rect.top;
                    const pdfPos = toPdfCoords(dropX, dropY);
                    handleUpdateField({ ...field, x: pdfPos.x, y: pdfPos.y });
                  }}
                >
                  {field.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-white/10 shrink-0 overflow-y-auto">
          {selectedFieldId ? (
            <FieldConfigPanel 
              field={fields.find(f => f.id === selectedFieldId)!}
              onUpdate={handleUpdateField}
              onDelete={() => handleDeleteField(selectedFieldId)}
            />
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Selecciona o añade un campo para editar sus propiedades.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
