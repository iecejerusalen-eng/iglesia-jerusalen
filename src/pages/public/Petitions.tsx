import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import type { Petition, PetitionCategory } from '../../types';
import { Send, Clock, BookOpen, CheckCircle, Flame, Plus, HeartHandshake, Globe, Lock, Heart, Users } from 'lucide-react';
import { toast } from 'sonner';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeRubberBandHover } from '../../components/animations/AnimeWrappers';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';

const petitionSchema = z.object({
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  content: z.string().min(10, 'La petición debe tener al menos 10 caracteres').max(1000, 'La petición es muy larga'),
  isPublic: z.boolean()
});
type PetitionFormValues = z.infer<typeof petitionSchema>;

const Petitions = () => {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<PetitionCategory[]>([]);
  const [myPetitions, setMyPetitions] = useState<Petition[]>([]);
  
  // Public Wall States
  const [activeTab, setActiveTab] = useState<'mine' | 'public'>('mine');
  const [publicPetitions, setPublicPetitions] = useState<Petition[]>([]);
  const [prayingFor, setPrayingFor] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, control } = useForm<PetitionFormValues>({
    resolver: zodResolver(petitionSchema),
    defaultValues: {
      categoryId: '',
      content: '',
      isPublic: false
    }
  });
  
  const isPublicWatch = useWatch({
    control,
    name: 'isPublic',
    defaultValue: false,
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
  }, [setValue]);

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

  const fetchPublicPetitions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('petitions')
        .select(`
          *,
          petition_categories(name)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPublicPetitions(data || []);
      
      const { data: myPrayers } = await supabase
        .from('petition_prayers')
        .select('petition_id')
        .eq('user_id', user.id);
      
      if (myPrayers) {
        setPrayingFor(new Set(myPrayers.map(p => p.petition_id)));
      }
    } catch (err) {
      console.error('Error fetching public petitions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        fetchCategories();
        if (activeTab === 'mine') {
          fetchMyPetitions();
        } else {
          fetchPublicPetitions();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, activeTab, fetchCategories, fetchMyPetitions, fetchPublicPetitions]);

  const onSubmit = async (values: PetitionFormValues) => {
    if (!user) {
      toast.error('Debes iniciar sesión para enviar peticiones');
      return;
    }

    try {
      const { data: limitData, error: limitError } = await supabase.functions.invoke('rate-limiter', {
        body: { endpoint: 'peticiones' }
      });

      if (limitError) {
        const status = limitError.context?.status;
        if (status === 429) {
          toast.error('Límite de solicitudes excedido (5 peticiones cada 15 min). Por favor intenta de nuevo más tarde.');
          return;
        }
      } else if (!limitData || !limitData.success) {
        toast.error('Límite de solicitudes excedido (5 peticiones cada 15 min). Por favor intenta de nuevo más tarde.');
        return;
      }

      const { error } = await supabase
        .from('petitions')
        .insert({
          user_id: user.id,
          category_id: values.categoryId || null,
          content: values.content.trim(),
          is_public: values.isPublic,
          status: 'pendiente'
        });

      if (error) throw error;

      toast.success(values.isPublic ? 'Petición publicada en el muro de oración.' : 'Petición enviada al equipo pastoral.');
      reset({ categoryId: values.categoryId, content: '', isPublic: false });
      
      if (activeTab === 'mine') fetchMyPetitions();
      else fetchPublicPetitions();
      
    } catch (err) {
      console.error('Error submitting petition:', err);
      const errMsg = err instanceof Error ? err.message : 'Error desconocido';
      toast.error('No se pudo enviar la petición: ' + errMsg);
    }
  };

  const handlePrayClick = async (petitionId: string) => {
    if (!user) return;
    const isCurrentlyPraying = prayingFor.has(petitionId);
    
    // Optimistic UI update
    setPrayingFor(prev => {
      const next = new Set(prev);
      if (isCurrentlyPraying) next.delete(petitionId);
      else next.add(petitionId);
      return next;
    });

    setPublicPetitions(prev => prev.map(p => {
      if (p.id === petitionId) {
        return {
          ...p,
          prayer_count: Math.max(0, (p.prayer_count || 0) + (isCurrentlyPraying ? -1 : 1))
        };
      }
      return p;
    }));

    try {
      if (isCurrentlyPraying) {
        await supabase.from('petition_prayers').delete().eq('petition_id', petitionId).eq('user_id', user.id);
      } else {
        await supabase.from('petition_prayers').insert({ petition_id: petitionId, user_id: user.id });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar');
      fetchPublicPetitions(); // Revert on error
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/30">
            <Flame size={12} className="text-amber-500 animate-pulse" />
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
    <div className="relative bg-gray-50 dark:bg-slate-950 min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200 overflow-hidden">
      
      {/* Sutil efecto de partículas CSS en el fondo (Opcional, muy suave) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <AnimeFadeUp delay={100} duration={800} className="relative z-10 max-w-5xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div id="petitions_hero" className="text-center space-y-4 scroll-mt-24">
          <div className="inline-flex p-3 bg-primary/5 rounded-full text-gold border border-gold/10 relative">
            <HeartHandshake size={32} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-primary dark:text-white">Orando Juntos</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
            "Clama a mí, y yo te responderé, y te enseñaré cosas grandes y ocultas que tú no conoces." — Jeremías 33:3. 
            Comparte tu necesidad; estamos aquí para interceder por ti.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Column */}
          <div id="petitions_form" className="lg:col-span-5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-white/10 p-6 sm:p-8 shadow-glass space-y-6 scroll-mt-24">
            <div>
              <h2 className="text-xl font-serif font-bold text-primary dark:text-white flex items-center gap-2">
                <Plus className="text-gold" size={20} />
                Nueva Petición
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Escribe tu petición con total libertad.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="categoryId" className="text-xs font-semibold text-gray-600 dark:text-gray-300 block">Categoría de Oración</label>
                <select
                  id="categoryId"
                  {...register('categoryId')}
                  className="w-full text-sm border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-white/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs text-gray-700 dark:text-gray-200 cursor-pointer transition-colors"
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
                <label htmlFor="content" className="text-xs font-semibold text-gray-600 dark:text-gray-300 block">Tu Petición</label>
                <textarea
                  id="content"
                  rows={5}
                  {...register('content')}
                  placeholder="Describe aquí tu necesidad o acción de gracias..."
                  className="w-full text-sm border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-white/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs text-gray-750 dark:text-gray-100 resize-none transition-colors"
                />
                {errors.content && (
                  <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200/60 dark:border-white/5 bg-gray-50/50 dark:bg-slate-800/30">
                <div className="flex items-center h-5">
                  <input
                    id="isPublic"
                    type="checkbox"
                    {...register('isPublic')}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                  />
                </div>
                <div className="text-sm flex-1">
                  <label htmlFor="isPublic" className="font-medium text-gray-800 dark:text-gray-200 cursor-pointer flex items-center gap-1.5">
                    {isPublicWatch ? <Globe size={14} className="text-primary"/> : <Lock size={14} className="text-gray-400"/>}
                    Hacer petición pública
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {isPublicWatch 
                      ? "La congregación podrá verla en el muro de oración." 
                      : "Solo el equipo pastoral podrá ver esta petición."}
                  </p>
                </div>
              </div>

              <AnimeRubberBandHover>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-55 cursor-pointer text-sm overflow-hidden group"
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"></div>
                  
                  {isSubmitting ? (
                    <span className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
                  ) : (
                    <>
                      <Send size={18} />
                      Enviar Petición
                    </>
                  )}
                </button>
              </AnimeRubberBandHover>
            </form>
          </div>

          {/* List/History Column */}
          <div id="petitions_wall" className="lg:col-span-7 space-y-6 scroll-mt-24">
            
            {/* Tabs */}
            <div className="flex bg-gray-200/50 dark:bg-slate-900 p-1 rounded-xl w-full sm:w-fit mx-auto lg:mx-0 shadow-inner">
              <button
                onClick={() => setActiveTab('mine')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'mine' 
                    ? 'bg-white dark:bg-slate-800 text-primary dark:text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <BookOpen size={16} />
                Mis Peticiones
              </button>
              <button
                onClick={() => setActiveTab('public')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'public' 
                    ? 'bg-white dark:bg-slate-800 text-primary dark:text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Users size={16} />
                Muro Comunitario
              </button>
            </div>

            {loading ? (
              <div className="space-y-4 pt-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="bg-white/60 dark:bg-slate-900/60 p-6 rounded-2xl border border-white/50 dark:border-white/5 animate-pulse space-y-4 shadow-sm">
                    <div className="flex justify-between">
                      <div className="h-6 w-28 bg-gray-200 dark:bg-slate-800 rounded-md"></div>
                      <div className="h-6 w-24 bg-gray-200 dark:bg-slate-800 rounded-full"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gray-200 dark:bg-slate-800 rounded"></div>
                      <div className="h-4 w-4/5 bg-gray-200 dark:bg-slate-800 rounded"></div>
                    </div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-slate-800 rounded mt-4"></div>
                  </div>
                ))}
              </div>
            ) : (activeTab === 'mine' ? myPetitions : publicPetitions).length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/60 dark:bg-slate-900/60 border border-white/50 dark:border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-glass mt-4"
              >
                <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-full">
                  <Heart size={48} className="text-primary/40 dark:text-primary/60" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-serif font-bold text-gray-800 dark:text-white">
                    {activeTab === 'mine' ? 'No tienes peticiones' : 'El muro está en paz'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    {activeTab === 'mine' 
                      ? 'Escribe tu primera petición a la izquierda para que comencemos a interceder por ti.'
                      : 'Actualmente no hay peticiones públicas. Únete a orar por tu prójimo pronto.'}
                  </p>
                </div>
              </motion.div>
            ) : (
              <AnimeStaggerGrid delay={100} staggerDelay={50} className="space-y-5 pt-2">
                {(activeTab === 'mine' ? myPetitions : publicPetitions).map((pet) => {
                  const isPraying = prayingFor.has(pet.id);
                  
                  return (
                    <div 
                      key={pet.id} 
                      className={`relative bg-white dark:bg-slate-900 p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-5 shadow-sm hover:shadow-md ${
                        pet.status === 'en_oracion' 
                          ? 'border-amber-200/50 dark:border-amber-500/30' 
                          : 'border-gray-150 dark:border-white/10'
                      }`}
                    >
                      {/* Borde brillante si está en oración */}
                      {pet.status === 'en_oracion' && (
                        <div className="absolute inset-0 rounded-2xl border-2 border-amber-400/20 dark:border-amber-500/20 pointer-events-none animate-pulse"></div>
                      )}

                      <div className="flex justify-between items-start gap-3 relative z-10">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-primary/5 dark:bg-primary/20 text-primary dark:text-white border border-primary/10 dark:border-primary/30 w-fit flex items-center gap-1">
                            {pet.petition_categories?.name || 'Necesidades varias'}
                          </span>
                          {activeTab === 'public' && (
                            <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                              <Globe size={10} /> Petición Anónima
                            </span>
                          )}
                        </div>
                        {getStatusBadge(pet.status)}
                      </div>
                      
                      <p className="text-gray-750 dark:text-gray-200 text-sm sm:text-base whitespace-pre-line leading-relaxed font-medium relative z-10">
                        "{pet.content}"
                      </p>

                      <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-4 mt-2 relative z-10">
                        <span className="text-gray-400 text-xs flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(pet.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                        </span>

                        {activeTab === 'public' ? (
                          <button
                            onClick={() => handlePrayClick(pet.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                              isPraying 
                                ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/30' 
                                : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
                            }`}
                          >
                            <Heart size={14} className={isPraying ? 'fill-current text-rose-500' : ''} />
                            {isPraying ? 'Orando' : 'Me uno'} 
                            {pet.prayer_count > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/50 dark:bg-black/20 rounded-full text-[10px]">{pet.prayer_count}</span>}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                            <Heart size={14} className={pet.prayer_count > 0 ? 'text-rose-500 fill-rose-500/20' : 'text-gray-300'} />
                            {pet.prayer_count > 0 ? `${pet.prayer_count} orando por ti` : '0 personas'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </AnimeStaggerGrid>
            )}
          </div>
        </div>
      </AnimeFadeUp>
    </div>
  );
};

export default Petitions;
