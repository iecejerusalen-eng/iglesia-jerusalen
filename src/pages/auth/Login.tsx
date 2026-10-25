import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import { validateNewPassword } from '../../lib/passwordPolicy';

const authSchema = z.object({
  email: z.string().email('Por favor ingresa un correo válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type AuthForm = z.infer<typeof authSchema>;

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { checkSession } = useAuthStore();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AuthForm>({
    resolver: zodResolver(authSchema)
  });

  const onSubmit = async (data: AuthForm) => {
    setLoading(true);
    setErrorMsg('');

    if (isRegister) {
      try { await validateNewPassword(data.password); }
      catch (error) { setErrorMsg(error instanceof Error ? error.message : 'No se pudo verificar la contraseña.'); setLoading(false); return; }
      // Sign Up validation
      if (!data.firstName?.trim() || !data.lastName?.trim()) {
        setErrorMsg('El nombre y el apellido son obligatorios para el registro.');
        setLoading(false);
        return;
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          }
        }
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      } else {
        if (signUpData.session) {
          toast.success('¡Registro e ingreso exitoso!');
          await checkSession();
          const params = new URLSearchParams(window.location.search);
          const rawRedirect = params.get('redirectTo');
          const to = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : null;
          if (to) {
            navigate(to);
          } else {
            const resolvedRole = useAuthStore.getState().role;
            if (resolvedRole === 'guest' || resolvedRole === 'member') {
              navigate('/lms/estudiante');
            } else {
              navigate('/admin');
            }
          }
        } else {
          toast.success('¡Registro exitoso! Verifica tu correo para activar tu cuenta.');
          setIsRegister(false);
          reset();
          setLoading(false);
        }
      }
    } else {
      // Sign In validation
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      } else {
        await checkSession();
        const params = new URLSearchParams(window.location.search);
        const rawRedirect = params.get('redirectTo');
        const to = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : null;
        if (to) {
          navigate(to);
        } else {
          const resolvedRole = useAuthStore.getState().role;
          if (resolvedRole === 'guest' || resolvedRole === 'member') {
            navigate('/lms/estudiante');
          } else {
            navigate('/admin');
          }
        }
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      if (error) throw error;
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-gray-900 px-4 py-8 sm:py-12">
      <div className="bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-md w-full max-w-md">
        <h1 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-100 text-center">
          Accede a tu cuenta
        </h1>
        <p className="mt-2 mb-5 text-center text-sm leading-5 text-gray-500 dark:text-gray-400">
          Ingresa con Google en un paso. Si tu cuenta tiene permisos, podrás abrir el panel de administración.
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full min-h-12 border border-gray-250 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <svg aria-hidden="true" className="h-5 w-5 flex-shrink-0" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z" />
            <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.8 1.2-4 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H5.9v5.2A20 20 0 0 0 24 44Z" />
            <path fill="#FBBC05" d="M12.8 27.7a12 12 0 0 1 0-7.4v-5.2H5.9a20 20 0 0 0 0 17.8l6.9-5.2Z" />
            <path fill="#EA4335" d="M24 12.1c3 0 5.7 1 7.8 3.1l5.8-5.8A19.3 19.3 0 0 0 24 4 20 20 0 0 0 5.9 15.1l6.9 5.2c1.6-4.7 6-8.2 11.2-8.2Z" />
          </svg>
          {loading ? 'Conectando con Google…' : 'Ingresar con Google'}
        </button>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-100 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-gray-800 px-3 text-gray-400 dark:text-gray-500 font-semibold">O ingresa con tu correo</span>
          </div>
        </div>
        
        {/* Auth Toggle Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700 mb-6">
          <button
            onClick={() => {
              setIsRegister(false);
              setErrorMsg('');
            }}
            className={`flex-1 pb-3 text-sm font-semibold text-center transition-colors cursor-pointer ${
              !isRegister ? 'text-primary border-b-2 border-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            Ingresar
          </button>
          <button
            onClick={() => {
              setIsRegister(true);
              setErrorMsg('');
            }}
            className={`flex-1 pb-3 text-sm font-semibold text-center transition-colors cursor-pointer ${
              isRegister ? 'text-primary border-b-2 border-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            Registrarse
          </button>
        </div>

        <h2 className="text-xl font-serif font-bold text-gray-800 dark:text-gray-100 mb-5 text-center">
          {isRegister ? 'Crear Cuenta Nueva' : 'Ingresar con correo'}
        </h2>
        
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/20 text-accent-red dark:text-red-400 p-3.5 rounded-xl mb-4 text-xs font-semibold text-center border border-red-100 dark:border-red-900/50">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="overflow-hidden transition-all duration-300">
            {isRegister && (
              <AnimeFadeUp
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <label htmlFor="firstName" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Nombre</label>
                  <input 
                    id="firstName"
                    autoComplete="given-name"
                    {...register('firstName')}
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="Ej. Juan"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Apellido</label>
                  <input 
                    id="lastName"
                    autoComplete="family-name"
                    {...register('lastName')}
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="Ej. Pérez"
                  />
                </div>
              </AnimeFadeUp>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Correo Electrónico</label>
            <input 
              id="email"
              autoComplete="email"
              {...register('email')}
              type="email" 
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              placeholder="correo@ejemplo.com"
            />
            {errors.email && <p className="text-accent-red dark:text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Contraseña</label>
            <input 
              id="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              {...register('password')}
              type="password" 
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-accent-red dark:text-red-400 text-xs mt-1">{errors.password.message}</p>}
            {isRegister && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Usa al menos 12 caracteres. Comprobamos filtraciones mediante un prefijo de la huella; tu contraseña nunca se envía al comprobador.</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-blue-900 dark:hover:bg-blue-800 text-white py-3 px-4 rounded-xl font-semibold transition-colors mt-6 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 cursor-pointer shadow-sm"
          >
            {loading 
              ? (isRegister ? 'Registrando...' : 'Ingresando...') 
              : (isRegister ? 'Registrarse y Crear Cuenta' : 'Entrar al Panel')
            }
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;
