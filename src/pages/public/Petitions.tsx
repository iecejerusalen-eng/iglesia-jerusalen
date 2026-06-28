import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import type { Petition, PetitionCategory } from '../../types';
import { Send, Clock, BookOpen, CheckCircle, Flame, Plus, HeartHandshake } from 'lucide-react';
import { toast } from 'sonner';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeRubberBandHover } from '../../components/animations/AnimeWrappers';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const petitionSchema = z.object({
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  content: z.string().min(10, 'La petición debe tener al menos 10 caracteres').max(1000, 'La petición es muy larga')
});
type PetitionFormValues = z.infer<typeof petitionSchema>;

const Petitions = () => {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<PetitionCategory[]>([]);
  const [myPetitions, setMyPetitions] = useState<Petition[]>([]);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue } = useForm<PetitionFormValues>({
    resolver: zodResolver(petitionSchema),
    defaultValues: {
      categoryId: '',
      content: ''
    }
  });

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('petition_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      setCategories(data || []);
      if (data && data.length > 0) {
        setValue('categoryId', data[0].id);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('Error al cargar categorías');
    }
  }, []);

  const fetchMyPetitions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('petitions')
        .select(`
          *,
          petition_categories(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyPetitions(data || []);
    } catch (err) {
      console.error('Error fetching my petitions:', err);
      toast.error('Error al cargar tus peticiones');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        fetchCategories();
        fetchMyPetitions();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, fetchCategories, fetchMyPetitions]);

  const onSubmit = async (values: PetitionFormValues) => {
    if (!user) {
      toast.error('Debes iniciar sesión para enviar peticiones');
      return;
    }

    try {
      // Call rate-limiter Edge Function to protect public prayer request endpoint
      const { data: limitData, error: limitError } = await supabase.functions.invoke('rate-limiter', {
        body: { endpoint: 'peticiones' }
      });

      if (limitError) {
        const status = limitError.context?.status;
        if (status === 429) {
          toast.error('Límite de solicitudes excedido (5 peticiones cada 15 min). Por favor intenta de nuevo más tarde.');
          return;
        }
        console.warn('Rate limiter check failed or not deployed, proceeding:', limitError);
      } else if (!limitData || !limitData.success) {
        toast.error('Límite de solicitudes excedido (5 peticiones cada 15 min). Por favor intenta de nuevo más tarde.');
        return;
      }

      // Proceed with inserting the petition
      const { error } = await supabase
        .from('petitions')
        .insert({
          user_id: user.id,
          category_id: values.categoryId || null,
          content: values.content.trim(),
          status: 'pendiente'
        });

      if (error) throw error;

      toast.success('Petición de oración enviada con éxito. Estaremos orando por ti.');
      reset({ categoryId: values.categoryId, content: '' });
      fetchMyPetitions();
    } catch (err: any) {
      console.error('Error submitting petition:', err);
      if (err.context?.status === 429 || err.message?.includes('429')) {
        toast.error('Límite de solicitudes excedido (5 peticiones cada 15 min). Por favor intenta de nuevo más tarde.');
      } else {
        const errMsg = err instanceof Error ? err.message : 'Error desconocido';
        toast.error('No se pudo enviar la petición: ' + errMsg);
      }
    }
  };

  const getStatusBadge = (status: 'pendiente' | 'en_oracion' | 'respondida') => {
    switch (status) {
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-slate-700">
            <Clock size={12} />
            Recibido
          </span>
        );
      case 'en_oracion':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/30 animate-pulse">
            <Flame size={12} className="text-amber-500" />
            En Oración
          </span>
        );
      case 'respondida':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-350 border border-emerald-200 dark:border-emerald-800/30">
            <CheckCircle size={12} className="text-emerald-500" />
            Respondido
          </span>
        );
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-gray-50 dark:bg-slate-950 transition-colors">
        <HeartHandshake size={64} className="text-gold mb-4 animate-bounce" />
        <h2 className="text-2xl font-serif font-bold text-primary dark:text-white mb-2">Peticiones de Oración</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
          Para poder enviar una petición de oración o ver tu historial de peticiones, por favor inicia sesión en tu cuenta.
        </p>
        <a 
          href="/login" 
          className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark shadow-lg hover:shadow-xl transition-all cursor-pointer"
        >
          Iniciar Sesión
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <AnimeFadeUp delay={100} duration={800} className="max-w-5xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex p-3 bg-primary/5 rounded-full text-gold border border-gold/10">
            <HeartHandshake size={32} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-primary dark:text-white">Peticiones de Oración</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
            "Clama a mí, y yo te responderé, y te enseñaré cosas grandes y ocultas que tú no conoces." — Jeremías 33:3. 
            Comparte tu necesidad; nuestro equipo pastoral y cuerpo de intercesores estará orando por ti.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Column */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-serif font-bold text-primary dark:text-white flex items-center gap-2">
                <Plus className="text-gold" size={20} />
                Nueva Petición
              </h2>
              <p className="text-xs text-gray-400 mt-1">Escribe tu petición con total libertad y confianza.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="categoryId" className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Categoría de Oración</label>
                <select
                  id="categoryId"
                  {...register('categoryId')}
                  className="w-full text-sm border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="content" className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Tu Petición</label>
                <textarea
                  id="content"
                  rows={5}
                  {...register('content')}
                  placeholder="Describe aquí tu petición o acción de gracias..."
                  className="w-full text-sm border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs text-gray-750 dark:text-gray-200 resize-none"
                />
                {errors.content && (
                  <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>
                )}
              </div>

              <AnimeRubberBandHover>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-55 cursor-pointer text-sm"
                >
                  {isSubmitting ? (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                  ) : (
                    <>
                      <Send size={16} />
                      Enviar Petición de Oración
                    </>
                  )}
                </button>
              </AnimeRubberBandHover>
            </form>
          </div>

          {/* List/History Column */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="text-lg font-serif font-bold text-primary dark:text-white flex items-center gap-2">
                <BookOpen className="text-gold" size={20} />
                Mis Peticiones Enviadas
              </h2>
              <p className="text-xs text-gray-400 mt-1">Historial y estado de tus peticiones personales.</p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-150 dark:border-white/10 animate-pulse space-y-3 shadow-xs">
                    <div className="flex justify-between">
                      <div className="h-5 w-24 bg-gray-150 dark:bg-slate-800 rounded"></div>
                      <div className="h-5 w-20 bg-gray-150 dark:bg-slate-800 rounded"></div>
                    </div>
                    <div className="h-4 w-full bg-gray-100 dark:bg-slate-855 rounded"></div>
                    <div className="h-4 w-4/5 bg-gray-100 dark:bg-slate-855 rounded"></div>
                    <div className="h-3.5 w-32 bg-gray-100 dark:bg-slate-855 rounded pt-2"></div>
                  </div>
                ))}
              </div>
            ) : myPetitions.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl p-10 text-center text-gray-400 flex flex-col items-center justify-center space-y-3 shadow-xs">
                <HeartHandshake size={40} className="text-gray-300" />
                <p className="text-sm font-medium">Aún no has registrado peticiones de oración.</p>
                <p className="text-xs text-gray-400 max-w-xs">Escribe tu primera petición a la izquierda para que comencemos a interceder por ti.</p>
              </div>
            ) : (
              <AnimeStaggerGrid delay={100} staggerDelay={50} className="space-y-4">
                {myPetitions.map((pet) => (
                  <div 
                    key={pet.id} 
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/5 dark:bg-primary/20 text-primary dark:text-white border border-primary/10 dark:border-primary/30 w-fit">
                          {pet.petition_categories?.name || 'Necesidades varias'}
                        </span>
                      </div>
                      {getStatusBadge(pet.status)}
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-250 text-sm whitespace-pre-line leading-relaxed font-medium">
                      {pet.content}
                    </p>

                    <div className="text-gray-400 text-[10px] flex items-center justify-between border-t border-gray-50 dark:border-white/5 pt-3">
                      <span>Enviado el {new Date(pet.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                ))}
              </AnimeStaggerGrid>
            )}
          </div>
        </div>
      </AnimeFadeUp>
    </div>
  );
};

export default Petitions;
