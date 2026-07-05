import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { Award, Printer, Share2, CheckCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface CertificateData {
  id: string;
  grade?: number;
  issued_at: string;
  courses?: {
    title: string;
    description: string;
    schools?: {
      name: string;
      color: string;
      cover_image_url: string;
    };
  };
  profiles?: {
    full_name: string;
    doc_id: string;
  };
}

export default function CertificateViewer() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCertificate = async (certId: string) => {
      try {
        // Intentionally allowing unauthenticated access based on RLS
        const { data, error } = await supabase
          .from('lms_certificates')
          .select(`
            *,
            courses:course_id (
              title, 
              description,
              schools:school_id (name, color, cover_image_url)
            ),
            profiles:user_id (full_name, doc_id)
          `)
          .eq('id', certId)
          .single();
          
        if (error) throw error;
        setCertificate(data);
      } catch (err) {
        console.error(err);
        toast.error('Certificado no encontrado o inválido');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCertificate(id);
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!certificate) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Certificado de Aprobación',
          text: `Mira mi certificado de ${certificate.courses?.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-pulse flex flex-col items-center">
          <Award size={48} className="text-gold mb-4 opacity-50" />
          <p className="text-gray-500 font-serif">Verificando credencial...</p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-6 text-center">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl max-w-md">
          <ShieldCheck size={64} className="mx-auto text-red-500 mb-6" />
          <h2 className="text-2xl font-bold font-serif mb-2">Certificado Inválido</h2>
          <p className="text-gray-500 mb-6">El código proporcionado no corresponde a ningún certificado válido emitido por nuestra institución.</p>
          <Link to="/" className="inline-block px-6 py-3 bg-gold text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors">
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  const schoolColor = certificate.courses?.schools?.color || '#D4AF37';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950 py-12 px-4 sm:px-6 flex flex-col items-center font-sans print:bg-white print:p-0 print:m-0">
      
      {/* Barra de Controles (Oculta al imprimir) */}
      <div className="max-w-5xl w-full mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
        <Link to="/" className="text-gray-500 hover:text-gold font-bold flex items-center gap-2">
          ← Volver a la plataforma
        </Link>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-wider">
            <CheckCircle size={14} /> Credencial Verificada
          </span>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl hover:border-gold transition-colors font-bold text-sm shadow-sm"
          >
            <Share2 size={16} /> Compartir
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-xl hover:bg-yellow-600 transition-colors font-bold text-sm shadow-md"
          >
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Certificado (Lo que se imprime) */}
      <div 
        ref={printRef}
        className="relative w-full max-w-[1100px] aspect-[1.414/1] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col items-center text-center print:shadow-none print:w-full print:h-screen print:max-w-none print:aspect-auto print:rounded-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='bg' x='0' y='0' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40' fill='%23f8fafc' fill-opacity='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23bg)'/%3E%3C/svg%3E")`
        }}
      >
        {/* Bordes Decorativos */}
        <div className="absolute inset-4 border-2 border-gray-200 print:inset-8 print:border-[4px]"></div>
        <div className="absolute inset-6 border border-gray-100 print:inset-10"></div>
        
        {/* Esquinas (Ribbons) */}
        <div className="absolute top-0 left-0 w-32 h-32" style={{ background: `linear-gradient(135deg, ${schoolColor} 50%, transparent 50.1%)` }}></div>
        <div className="absolute bottom-0 right-0 w-32 h-32" style={{ background: `linear-gradient(-45deg, ${schoolColor} 50%, transparent 50.1%)` }}></div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-12 md:px-24 w-full h-full py-16">
          
          <div className="mb-8 print:mb-12">
            {certificate.courses?.schools?.cover_image_url ? (
               <img src={certificate.courses.schools.cover_image_url} alt="Logo Institución" className="h-20 md:h-28 object-contain" />
            ) : (
               <Award size={64} className="text-gold mx-auto" />
            )}
            <h1 className="text-xl md:text-2xl font-serif font-bold text-gray-800 mt-4 tracking-widest uppercase" style={{ color: schoolColor }}>
              {certificate.courses?.schools?.name || 'Iglesia Jerusalén'}
            </h1>
          </div>

          <p className="text-gray-500 uppercase tracking-widest text-sm md:text-base font-medium mb-4 print:text-xl">Otorga el presente certificado a:</p>
          
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 mb-6 border-b border-gray-300 pb-2 inline-block px-12 print:text-7xl">
            {certificate.profiles?.full_name}
          </h2>

          <div className="max-w-3xl">
            <p className="text-gray-600 text-lg md:text-xl mb-4 print:text-2xl">
              Por haber aprobado satisfactoriamente el curso:
            </p>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 print:text-4xl">
              "{certificate.courses?.title}"
            </h3>
            {certificate.grade && (
              <p className="text-gray-600 font-serif italic text-lg print:text-xl">
                Con una calificación de <strong className="text-gold font-sans">{certificate.grade} / 100</strong>
              </p>
            )}
          </div>

          <div className="mt-16 w-full flex justify-between items-end px-12">
            <div className="text-center w-48">
              <div className="border-b border-gray-400 mb-2 h-12 flex items-end justify-center">
                <span className="font-serif italic text-gray-400 text-sm">Firma digital</span>
              </div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Dirección Académica</p>
            </div>

            <div className="flex flex-col items-center">
              {/* QR Code Placeholder - In a real app we'd use a QR library */}
              <div className="w-24 h-24 bg-white border border-gray-200 p-1 mb-2 flex items-center justify-center">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`} alt="QR Code" className="w-full h-full opacity-80" />
              </div>
              <p className="text-[10px] text-gray-400">Escanea para verificar</p>
            </div>

            <div className="text-center w-48 text-right">
              <p className="text-gray-500 text-sm mb-1">Emitido el:</p>
              <p className="font-bold text-gray-800">{new Date(certificate.issued_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-[10px] text-gray-400 mt-2 font-mono">ID: {certificate.id}</p>
            </div>
          </div>

        </div>
      </div>
      
      {/* Print Specific CSS included via Tailwind print classes, but forcing Landscape is tricky */}
      <style>{`
        @media print {
          @page { size: landscape; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
        }
      `}</style>
    </div>
  );
}
