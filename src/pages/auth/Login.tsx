import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';

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
          const to = params.get('redirectTo');
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
        const to = params.get('redirectTo');
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
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="bg-white p-8 rounded-2xl border border-gray-150 shadow-md w-full max-w-md">
        
        {/* Auth Toggle Tabs */}
        <div className="flex border-b border-gray-100 mb-6">
          <button
            onClick={() => {
              setIsRegister(false);
              setErrorMsg('');
            }}
            className={`flex-1 pb-3 text-sm font-semibold text-center transition-colors cursor-pointer ${
              !isRegister ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-600'
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
              isRegister ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Registrarse
          </button>
        </div>

        <h2 className="text-2xl font-serif font-bold text-gray-800 mb-6 text-center">
          {isRegister ? 'Crear Cuenta Nueva' : 'Ingresar al Panel'}
        </h2>
        
        {errorMsg && (
          <div className="bg-red-50 text-accent-red p-3.5 rounded-xl mb-4 text-xs font-semibold text-center border border-red-100">
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
                  <label htmlFor="firstName" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre</label>
                  <input 
                    id="firstName"
                    autoComplete="given-name"
                    {...register('firstName')}
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="Ej. Juan"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Apellido</label>
                  <input 
                    id="lastName"
                    autoComplete="family-name"
                    {...register('lastName')}
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="Ej. Pérez"
                  />
                </div>
              </AnimeFadeUp>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Correo Electrónico</label>
            <input 
              id="email"
              autoComplete="email"
              {...register('email')}
              type="email" 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              placeholder="correo@ejemplo.com"
            />
            {errors.email && <p className="text-accent-red text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contraseña</label>
            <input 
              id="password"
              autoComplete="current-password"
              {...register('password')}
              type="password" 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-accent-red text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-blue-900 text-white py-3 px-4 rounded-xl font-semibold transition-colors mt-6 disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer shadow-sm"
          >
            {loading 
              ? (isRegister ? 'Registrando...' : 'Ingresando...') 
              : (isRegister ? 'Registrarse y Crear Cuenta' : 'Entrar al Panel')
            }
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-gray-400 font-bold">O también</span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full border border-gray-250 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-xs hover:shadow-sm"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.1.14-.14 1.51-1.14 2.27-3.48 3.86-6.55 3.86-4.52 0-8.21-3.69-8.21-8.21s3.69-8.21 8.21-8.21c2.19 0 4.18.8 5.73 2.23l2.84-2.84C18.6 2.44 15.52 1 12 1 5.92 1 1 5.92 1 12s4.92 11 11 11c6.3 0 11.23-4.43 11.75-10.73z"
            />
          </svg>
          Iniciar sesión con Google
        </button>
      </div>
    </div>
  );
};

export default Login;
