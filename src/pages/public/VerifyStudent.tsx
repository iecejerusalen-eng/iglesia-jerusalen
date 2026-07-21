import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, XCircle, Loader2, ArrowLeft, User, ShieldAlert } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';

interface VerificationResult {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  email: string;
  is_active: boolean;
  verified_at: string;
}

export default function VerifyStudent() {
  const { studentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      if (!studentId) {
        setError('No se proporcionó un ID válido.');
        setLoading(false);
        return;
      }

      try {
        // We use the custom RPC function designed for public verification
        const { data, error: rpcError } = await supabase.rpc('verify_student_status', {
          p_student_id: studentId
        });

        if (rpcError) throw rpcError;

        if (data && data.success) {
          setResult(data.data);
        } else {
          setError(data?.error || 'No se pudo verificar el estudiante o el perfil no existe.');
        }
      } catch (err: any) {
        console.error('Error verifying student:', err);
        setError('Error de conexión o el ID proporcionado es inválido.');
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [studentId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] pt-24 pb-12 flex flex-col items-center justify-center p-4">
      <Link 
        to="/"
        className="absolute top-24 left-4 md:left-8 inline-flex items-center gap-2 text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={20} /> Volver al Inicio
      </Link>

      <AnimeFadeUp className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-white/10 shadow-2xl relative overflow-hidden">
          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <img src="/logo.png" alt="Logo" className="h-16 mx-auto mb-4" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            <h1 className="text-2xl font-black font-serif text-slate-900 dark:text-white">Verificación Oficial</h1>
            <p className="text-sm text-gray-500 mt-1">Sistema de Autenticidad de Credenciales</p>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="animate-spin text-gold w-12 h-12" />
                <p className="text-sm font-bold text-gray-400">Verificando credencial...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900/50 rounded-2xl p-6 text-center space-y-3">
                <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                <h3 className="text-lg font-black text-red-800 dark:text-red-400">Verificación Fallida</h3>
                <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                <div className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-3 ${
                  result.is_active 
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400'
                    : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50 text-orange-800 dark:text-orange-400'
                }`}>
                  {result.is_active ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
                  <div className="text-left">
                    <h3 className="font-black text-lg">{result.is_active ? 'Estudiante Activo' : 'Estudiante Inactivo'}</h3>
                    <p className="text-xs font-semibold opacity-80">
                      Verificado el {new Date(result.verified_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-gray-100 dark:border-white/5 text-center">
                  <div className="mb-4">
                    {result.avatar_url ? (
                      <img 
                        src={result.avatar_url} 
                        alt={result.full_name} 
                        className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white dark:border-slate-700 shadow-md"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full mx-auto bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-400 border-4 border-white dark:border-slate-800 shadow-md">
                        <User size={40} />
                      </div>
                    )}
                  </div>
                  
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-1">{result.full_name}</h4>
                  <p className="text-sm text-gray-500 font-medium mb-3">{result.email}</p>
                  
                  <span className="inline-block px-3 py-1 bg-gold/10 text-gold font-bold text-xs uppercase tracking-wider rounded-full">
                    {result.role === 'student' ? 'Estudiante' : result.role}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
          
          <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest mt-8">
            Iglesia Jerusalén © {new Date().getFullYear()}
          </p>
        </div>
      </AnimeFadeUp>
    </div>
  );
}
