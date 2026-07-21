import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, CheckCircle, Award } from 'lucide-react';

interface CertificateData {
  studentName: string;
  courseName: string;
  issueDate: string;
  validationHash: string;
}

interface CertificateTemplate {
  type: 'html' | 'image_overlay';
  backgroundImageUrl?: string;
  overlayConfig?: {
    name_pos?: { x: number, y: number, fontSize?: number, color?: string };
    date_pos?: { x: number, y: number, fontSize?: number, color?: string };
    hash_pos?: { x: number, y: number, fontSize?: number, color?: string };
  };
}

interface CertificateGeneratorProps {
  data: CertificateData;
  template: CertificateTemplate;
}

export function CertificateGenerator({ data, template }: CertificateGeneratorProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const generatePDF = async () => {
    if (!certificateRef.current) return;
    setIsGenerating(true);

    try {
      const element = certificateRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // A4 Landscape: 297mm x 210mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      pdf.save(`Certificado_${data.courseName.replace(/\s+/g, '_')}_${data.studentName.replace(/\s+/g, '_')}.pdf`);
      
      setIsDone(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Hidden container for rendering the certificate to canvas */}
      <div className="overflow-hidden h-0 w-0 absolute opacity-0 pointer-events-none">
        <div 
          ref={certificateRef} 
          className="relative bg-white" 
          style={{ width: '1122px', height: '793px' }} // A4 landscape at 96 DPI
        >
          {template.type === 'image_overlay' ? (
            <>
              {template.backgroundImageUrl && (
                <img 
                  src={template.backgroundImageUrl} 
                  alt="Certificate Background" 
                  className="absolute inset-0 w-full h-full object-cover" 
                  crossOrigin="anonymous"
                />
              )}
              {/* Overlays */}
              <div 
                className="absolute font-serif font-bold text-center"
                style={{ 
                  left: template.overlayConfig?.name_pos?.x || 561, 
                  top: template.overlayConfig?.name_pos?.y || 400,
                  transform: 'translateX(-50%)',
                  fontSize: `${template.overlayConfig?.name_pos?.fontSize || 48}px`,
                  color: template.overlayConfig?.name_pos?.color || '#000'
                }}
              >
                {data.studentName}
              </div>
              <div 
                className="absolute font-sans"
                style={{ 
                  left: template.overlayConfig?.date_pos?.x || 561, 
                  top: template.overlayConfig?.date_pos?.y || 600,
                  transform: 'translateX(-50%)',
                  fontSize: `${template.overlayConfig?.date_pos?.fontSize || 18}px`,
                  color: template.overlayConfig?.date_pos?.color || '#666'
                }}
              >
                {new Date(data.issueDate).toLocaleDateString()}
              </div>
              <div 
                className="absolute font-mono"
                style={{ 
                  left: template.overlayConfig?.hash_pos?.x || 100, 
                  top: template.overlayConfig?.hash_pos?.y || 700,
                  fontSize: `${template.overlayConfig?.hash_pos?.fontSize || 12}px`,
                  color: template.overlayConfig?.hash_pos?.color || '#999'
                }}
              >
                ID: {data.validationHash}
              </div>
            </>
          ) : (
            // Type 2: Modern HTML Template
            <div className="w-full h-full p-16 flex flex-col items-center justify-center border-[20px] border-double border-gold bg-amber-50">
              <Award size={120} className="text-gold mb-8" />
              <h1 className="text-6xl font-black font-serif text-slate-900 mb-4 tracking-wider uppercase">
                Certificado de Aprobación
              </h1>
              <p className="text-2xl text-gray-600 mb-8 font-serif italic">
                Se otorga el presente diploma a:
              </p>
              <h2 className="text-5xl font-bold text-primary mb-8 border-b-2 border-gold pb-4 px-12">
                {data.studentName}
              </h2>
              <p className="text-2xl text-gray-600 mb-4">
                Por haber completado satisfactoriamente el curso:
              </p>
              <h3 className="text-4xl font-bold text-slate-800 mb-16 text-center max-w-4xl leading-tight">
                {data.courseName}
              </h3>
              
              <div className="w-full flex justify-between items-end px-16 mt-auto">
                <div className="text-center">
                  <div className="border-b border-slate-900 w-64 mb-2"></div>
                  <p className="font-bold text-lg text-slate-800">Dirección Académica</p>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-800 mb-1">
                    Fecha: {new Date(data.issueDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-mono text-gray-500">
                    ID Verificación: {data.validationHash}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visible UI */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-150 dark:border-white/10 shadow-sm text-center max-w-md w-full">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
          <Award className="w-10 h-10 text-gold" />
        </div>
        <h3 className="text-2xl font-bold font-serif mb-2">¡Felicidades!</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Tu certificado por el curso <strong>{data.courseName}</strong> está listo para ser descargado.
        </p>
        
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-colors ${
            isDone 
              ? 'bg-green-500 text-white' 
              : 'bg-primary text-white hover:bg-primary-dark shadow-lg'
          } disabled:opacity-75`}
        >
          {isGenerating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
          ) : isDone ? (
            <CheckCircle size={20} />
          ) : (
            <Download size={20} />
          )}
          {isGenerating ? 'Generando PDF...' : isDone ? '¡Descargado!' : 'Descargar Certificado PDF'}
        </button>
      </div>
    </div>
  );
}
