import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { CheckCircle, XCircle, Award, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface CertificateDetails {
  issue_date: string;
  student_name: string;
  course_name: string;
  validation_hash: string;
}

export function CertificateVerification() {
  const { hash } = useParams<{ hash: string }>();
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [details, setDetails] = useState<CertificateDetails | null>(null);

  useEffect(() => {
    async function verifyCertificate() {
      if (!hash) {
        setStatus('invalid');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('lms_certificates_issued')
          .select(`
            issue_date,
            validation_hash,
            profiles (first_name, last_name),
            lms_courses (title)
          `)
          .eq('validation_hash', hash)
          .single();

        if (error || !data) {
          throw new Error('Certificado no encontrado');
        }

        // Parse joined data
        const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
        const course = Array.isArray(data.lms_courses) ? data.lms_courses[0] : data.lms_courses;

        setDetails({
          issue_date: data.issue_date,
          student_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
          course_name: course?.title || 'Curso Desconocido',
          validation_hash: data.validation_hash
        });

        setStatus('valid');
      } catch (error) {
        console.error('Error verificando certificado:', error);
        setStatus('invalid');
      }
    }

    verifyCertificate();
  }, [hash]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-slate-900 transition-colors font-medium">
        <ArrowLeft size={20} />
        Volver al inicio
      </Link>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-gray-150 text-center relative overflow-hidden"
      >
        {status === 'loading' && (
          <div className="py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Verificando autenticidad del certificado...</p>
          </div>
        )}

        {status === 'valid' && details && (
          <>
            <div className="absolute top-0 inset-x-0 h-2 bg-green-500"></div>
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-3xl font-black font-serif text-slate-900 mb-2">
              Certificado Válido
            </h2>
            <p className="text-green-600 font-medium mb-8">
              Este certificado es auténtico y fue emitido por Iglesia Jerusalén.
            </p>

            <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Otorgado a</p>
                <p className="font-bold text-lg text-slate-900">{details.student_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Por completar el curso</p>
                <p className="font-bold text-lg text-primary">{details.course_name}</p>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-2">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Fecha de emisión</p>
                  <p className="font-medium text-slate-800">
                    {new Date(details.issue_date).toLocaleDateString()}
                  </p>
                </div>
                <Award className="text-gold opacity-50" size={32} />
              </div>
            </div>

            <p className="mt-8 text-xs font-mono text-gray-400">
              ID de Verificación: {details.validation_hash}
            </p>
          </>
        )}

        {status === 'invalid' && (
          <>
            <div className="absolute top-0 inset-x-0 h-2 bg-red-500"></div>
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={40} />
            </div>
            <h2 className="text-3xl font-black font-serif text-slate-900 mb-2">
              Certificado Inválido
            </h2>
            <p className="text-gray-500 mb-8">
              No se pudo encontrar ningún certificado asociado a este código de verificación. Puede que el código sea incorrecto o el certificado haya sido revocado.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 font-mono text-sm text-gray-600 break-all">
              Hash buscado: {hash || 'N/A'}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
