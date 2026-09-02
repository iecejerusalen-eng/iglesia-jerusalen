import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import type { Petition, PetitionCategory } from '../../types';
import { Send, Clock, BookOpen, CheckCircle, Flame, Plus, Globe, Lock, Heart, Users, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AnimeStaggerGrid } from '../../components/animations/AnimeWrappers';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import PetitionsHeroPremium from './components/PetitionsHeroPremium';

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
        .select('id, name, created_at')
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
        .select('id, user_id, category_id, content, status, is_public, prayer_count, created_at, petition_categories(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyPetitions((data || []).map((petition) => ({
        ...petition,
        petition_categories: Array.isArray(petition.petition_categories) ? petition.petition_categories[0] ?? null : petition.petition_categories,
      })) as Petition[]);
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
        .select('id, user_id, category_id, content, status, is_public, prayer_count, created_at, petition_categories(name)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPublicPetitions((data || []).map((petition) => ({
        ...petition,
        petition_categories: Array.isArray(petition.petition_categories) ? petition.petition_categories[0] ?? null : petition.petition_categories,
      })) as Petition[]);
      
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 backdrop-blur-md">
            <Clock size={12} />
            Recibido
          </span>
        );
      case 'en_oracion':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/30 backdrop-blur-md">
            <Flame size={12} className="text-amber-500 animate-pulse motion-reduce:animate-none" />
            En Oración
          </span>
        );
      case 'respondida':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/30 backdrop-blur-md">
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
      <div className="relative min-h-screen overflow-hidden bg-[#f8fafc] transition-colors dark:bg-[#020817] text-slate-950 dark:text-white">
        <PetitionsHeroPremium isAuthenticated={false} />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:px-10 lg:gap-12">
          <section id="petitions_form" className="scroll-mt-24 rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/40 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] sm:p-12">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-blue-700/5 text-blue-800 dark:bg-white/5 dark:text-blue-200 border border-blue-900/10 dark:border-white/10 shadow-sm"><Lock size={28} aria-hidden="true" /></div>
            <h2 className="mt-6 font-serif text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">Tu espacio comienza con una sesión</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">Inicia sesión para enviar una petición, elegir quién puede verla y recibir acompañamiento pastoral.</p>
            <a href="/login" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-800 px-6 py-3.5 text-sm font-black text-white shadow-[0_12px_24px_-12px_rgba(30,58,138,.8)] transition duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-[0_16px_32px_-12px_rgba(30,58,138,.9)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 dark:bg-blue-600 dark:hover:bg-blue-500">Iniciar sesión <Send size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
          </section>

          <section id="petitions_wall" className="scroll-mt-24 rounded-3xl border border-amber-200/50 bg-amber-50/70 p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-2xl dark:border-amber-500/20 dark:bg-amber-950/10 sm:p-12">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-600/10 dark:border-amber-400/20 shadow-sm"><Users size={28} aria-hidden="true" /></div>
            <h2 className="mt-6 font-serif text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">Una comunidad que intercede</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-300">El muro comunitario está disponible para quienes han iniciado sesión y deciden compartir su petición.</p>
            <a href="/login" className="mt-8 inline-flex items-center gap-2 rounded-xl border border-amber-700/20 bg-white/70 px-6 py-3.5 text-sm font-black text-amber-900 shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/25 dark:border-amber-300/20 dark:bg-white/5 dark:text-amber-200 dark:hover:bg-white/10">Conocer el muro <MessageCircle size={16} aria-hidden="true" /></a>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-[#f8fafc] dark:bg-[#020817] min-h-screen transition-colors duration-700 overflow-hidden text-slate-950 dark:text-white">
      
      {/* Sutil efecto de partículas CSS en el fondo (Opcional, muy suave) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-30">
        <div className="absolute top-1/4 left-1/4 w-[36rem] h-[36rem] bg-blue-300/20 rounded-full blur-[120px] animate-pulse motion-reduce:animate-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[40rem] h-[40rem] bg-amber-300/20 rounded-full blur-[130px] animate-pulse motion-reduce:animate-none" style={{ animationDelay: '2s' }}></div>
      </div>

      <PetitionsHeroPremium />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 py-12 space-y-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-[.95fr_1.05fr] gap-8 lg:gap-12 items-start">
          
          {/* Form Column */}
          <div id="petitions_form" className="lg:order-none bg-white/80 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-white/10 p-7 sm:p-9 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] space-y-7 scroll-mt-24">
            <div>
              <h2 className="text-xl font-serif font-black text-blue-950 dark:text-white flex items-center gap-2">
                <Plus className="text-amber-500" size={20} />
                Nueva Petición
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Escribe tu petición con total libertad.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="categoryId" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Categoría de Oración</label>
                <select
                  id="categoryId"
                  {...register('categoryId')}
                  aria-invalid={Boolean(errors.categoryId)}
                  aria-describedby={errors.categoryId ? 'categoryId-error' : undefined}
                  className="w-full text-sm border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-3 bg-white/60 dark:bg-white/5 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/30 focus:outline-none shadow-sm text-slate-800 dark:text-slate-100 cursor-pointer transition-all duration-300 hover:bg-white/80 dark:hover:bg-white/10"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="text-slate-900 dark:text-slate-900">{cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p id="categoryId-error" role="alert" className="text-red-500 text-xs mt-1 font-medium">{errors.categoryId.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="content" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Tu Petición</label>
                <textarea
                  id="content"
                  rows={5}
                  {...register('content')}
                  aria-invalid={Boolean(errors.content)}
                  aria-describedby={errors.content ? 'content-error' : undefined}
                  placeholder="Describe aquí tu necesidad o acción de gracias..."
                  className="w-full text-sm border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-3 bg-white/60 dark:bg-white/5 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/30 focus:outline-none shadow-sm text-slate-800 dark:text-slate-100 resize-none transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:bg-white/80 dark:hover:bg-white/10"
                />
                {errors.content && (
                  <p id="content-error" role="alert" className="text-red-500 text-xs mt-1 font-medium">{errors.content.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl border border-blue-900/5 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.04]">
                <div className="flex items-center h-5">
                  <input
                    id="isPublic"
                    type="checkbox"
                    {...register('isPublic')}
                    className="size-4 text-blue-700 bg-white border-slate-300 rounded focus:ring-blue-600 focus:ring-offset-0 focus:ring-2 dark:bg-slate-800 dark:border-slate-600 cursor-pointer shadow-sm"
                  />
                </div>
                <div className="text-sm flex-1">
                  <label htmlFor="isPublic" className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-1.5">
                    {isPublicWatch ? <Globe size={15} className="text-blue-600 dark:text-blue-400"/> : <Lock size={15} className="text-slate-400 dark:text-slate-500"/>}
                    Hacer petición pública
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {isPublicWatch 
                      ? "La congregación podrá verla en el muro de oración." 
                      : "Solo el equipo pastoral podrá ver esta petición."}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                aria-label={isSubmitting ? 'Enviando petición' : 'Enviar petición'}
                className="group relative flex w-full items-center justify-center gap-3 rounded-xl bg-blue-800 px-6 py-3.5 text-sm font-black text-white shadow-[0_12px_24px_-12px_rgba(30,58,138,.8)] transition duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-[0_16px_32px_-12px_rgba(30,58,138,.9)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] motion-reduce:animate-none bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"></div>
                  
                  {isSubmitting ? (
                    <><span aria-hidden="true" className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white motion-reduce:animate-none"></span><span className="sr-only">Enviando petición</span></>
                  ) : (
                    <>
                      Enviar Petición
                      <Send size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </>
                  )}
              </button>
            </form>
          </div>

          {/* List/History Column */}
          <div id="petitions_wall" className="space-y-6 scroll-mt-24">
            
            {/* Tabs */}
            <div role="tablist" aria-label="Tus peticiones y el muro comunitario" className="flex bg-slate-200/50 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 p-1.5 rounded-2xl w-full sm:w-fit mx-auto lg:mx-0 shadow-sm">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'mine'}
                aria-controls="petitions-panel"
                onClick={() => setActiveTab('mine')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  activeTab === 'mine' 
                    ? 'bg-white dark:bg-slate-800 text-blue-900 dark:text-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-none'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen size={16} />
                Mis Peticiones
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'public'}
                aria-controls="petitions-panel"
                onClick={() => setActiveTab('public')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  activeTab === 'public' 
                    ? 'bg-white dark:bg-slate-800 text-blue-900 dark:text-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-none'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Users size={16} />
                Muro Comunitario
              </button>
            </div>

            <div id="petitions-panel" role="tabpanel" aria-label={activeTab === 'mine' ? 'Mis peticiones' : 'Muro comunitario'} className="outline-none">
            {loading ? (
              <div className="space-y-4 pt-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="bg-white/60 dark:bg-slate-900/40 p-6 rounded-2xl border border-white/60 dark:border-white/10 animate-pulse motion-reduce:animate-none space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md">
                    <div className="flex justify-between">
                      <div className="h-6 w-28 bg-slate-200/60 dark:bg-slate-800 rounded-md"></div>
                      <div className="h-6 w-24 bg-slate-200/60 dark:bg-slate-800 rounded-full"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-slate-200/60 dark:bg-slate-800 rounded"></div>
                      <div className="h-4 w-4/5 bg-slate-200/60 dark:bg-slate-800 rounded"></div>
                    </div>
                    <div className="h-4 w-32 bg-slate-200/60 dark:bg-slate-800 rounded mt-4"></div>
                  </div>
                ))}
              </div>
            ) : (activeTab === 'mine' ? myPetitions : publicPetitions).length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/80 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl mt-4"
              >
                <div className="p-4 bg-blue-700/5 dark:bg-blue-400/10 rounded-2xl">
                  <Heart size={40} strokeWidth={1.5} className="text-blue-700/40 dark:text-blue-300/60" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xl font-serif font-black text-slate-800 dark:text-white">
                    {activeTab === 'mine' ? 'Aún no hay peticiones' : 'El muro está en paz'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
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
                      className={`relative bg-white/85 dark:bg-white/5 backdrop-blur-xl p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_15px_40px_-15px_rgb(0,0,0,0.08)] dark:shadow-none ${
                        pet.status === 'en_oracion' 
                          ? 'border-amber-200/60 dark:border-amber-500/30'
                          : 'border-white/80 dark:border-white/10'
                      }`}
                    >
                      {/* Borde brillante si está en oración */}
                      {pet.status === 'en_oracion' && (
                        <div className="absolute inset-0 rounded-3xl border-2 border-amber-400/20 dark:border-amber-500/20 pointer-events-none animate-pulse motion-reduce:animate-none"></div>
                      )}

                      <div className="flex justify-between items-start gap-3 relative z-10">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-700/5 dark:bg-blue-400/10 text-blue-800 dark:text-blue-200 border border-blue-900/10 dark:border-blue-300/20 w-fit flex items-center gap-1">
                            {pet.petition_categories?.name || 'Necesidades varias'}
                          </span>
                          {activeTab === 'public' && (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Globe size={10} /> Petición Anónima
                            </span>
                          )}
                        </div>
                        {getStatusBadge(pet.status)}
                      </div>
                      
                      <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base whitespace-pre-line leading-relaxed font-medium relative z-10">
                        "{pet.content}"
                      </p>

                      <div className="flex items-center justify-between border-t border-slate-100/50 dark:border-white/5 pt-4 mt-2 relative z-10">
                        <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(pet.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                        </span>

                        {activeTab === 'public' ? (
                          <button
                            onClick={() => handlePrayClick(pet.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 hover:-translate-y-0.5 ${
                              isPraying 
                                ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-sm dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/30'
                                : 'bg-slate-100 text-slate-600 border border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:border-white/10'
                            }`}
                          >
                            <Heart size={14} className={isPraying ? 'fill-current text-rose-500' : ''} />
                            {isPraying ? 'Orando' : 'Me uno'} 
                            {pet.prayer_count > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/50 dark:bg-black/20 rounded-full text-[10px]">{pet.prayer_count}</span>}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <Heart size={14} className={pet.prayer_count > 0 ? 'text-rose-500 fill-rose-500/20' : 'text-slate-300'} />
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
        </div>
      </div>
    </div>
  );
};

export default Petitions;
