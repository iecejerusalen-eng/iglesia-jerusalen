import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { ChevronDown, ChevronUp, Church, Users, GraduationCap, DollarSign, Gamepad2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

// Fallback icons map
const IconMap: Record<string, React.ElementType> = {
  Church: Church,
  Users: Users,
  GraduationCap: GraduationCap,
  DollarSign: DollarSign,
  Gamepad2: Gamepad2,
};

interface PresentationSlide {
  id: string;
  order_index: number;
  title: string;
  subtitle: string | null;
  content: string | null;
  department: string | null;
  icon: string | null;
  image_url: string | null;
  theme_color: string;
  animation_type: string;
  layout: string;
  features: string[];
}

export const Presentation = () => {
  const [slides, setSlides] = useState<PresentationSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlides();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, slides.length]);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('presentation_slides')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        throw error;
      }
      setSlides(data || []);
    } catch (err) {
      console.error('Error fetching presentation slides:', err);
      // Fallback data
      setSlides([
        {
          id: '1',
          order_index: 1,
          title: 'Iglesia Jerusalén',
          subtitle: 'Sistema Integral de Gestión',
          content: 'Una plataforma unificada para administrar todos los aspectos de nuestra congregación.',
          department: 'General',
          icon: 'Church',
          image_url: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&q=80',
          theme_color: 'indigo',
          animation_type: 'fade',
          layout: 'full-image',
          features: ['CRM', 'Aula Virtual (LMS)', 'Gestión Financiera', 'Juegos y Recursos']
        },
        {
          id: '2',
          order_index: 2,
          title: 'Aula Virtual (LMS)',
          subtitle: 'Formación Continua',
          content: 'Plataforma educativa para la escuela dominical y discipulado.',
          department: 'Educación',
          icon: 'GraduationCap',
          image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80',
          theme_color: 'blue',
          animation_type: 'slide',
          layout: 'split',
          features: ['Cursos Interactivos', 'Progreso de Estudiantes', 'Evaluaciones']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-2xl font-bold">
        Presentación no disponible en este momento.
      </div>
    );
  }

  const slide = slides[currentSlide];
  const IconComponent = slide.icon && IconMap[slide.icon] ? IconMap[slide.icon] : Church;

  const getAnimationProps = () => {
    switch (slide.animation_type) {
      case 'slide':
        return {
          initial: { opacity: 0, x: 100 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -100 }
        };
      case 'zoom':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.2 }
        };
      default: // fade
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 overflow-hidden text-white font-sans selection:bg-indigo-500/30">
      <Helmet>
        <title>Presentación | Iglesia Jerusalén</title>
      </Helmet>
      
      {/* Background with parallax/blur effect */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${slide.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${slide.image_url || 'https://images.unsplash.com/photo-1548625361-ec85375c3db0?auto=format&fit=crop&q=80'})`, filter: 'blur(10px) brightness(0.4)' }}
        />
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/10 z-50">
        <motion.div 
          className="h-full bg-indigo-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-full w-full max-w-7xl mx-auto px-6 py-12 md:px-12 md:py-24">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            {...getAnimationProps()}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className={`flex-1 flex flex-col ${slide.layout === 'split' ? 'md:flex-row items-center gap-12' : 'justify-center items-center text-center'}`}
          >
            {/* Split Layout: Image on Right, Text on Left */}
            <div className={`flex-1 ${slide.layout !== 'split' ? 'max-w-4xl' : ''}`}>
              {slide.department && (
                <motion.span 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium tracking-wide mb-6 uppercase text-indigo-300"
                >
                  <IconComponent className="w-4 h-4" />
                  {slide.department}
                </motion.span>
              )}
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200"
              >
                {slide.title}
              </motion.h1>

              {slide.subtitle && (
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl md:text-3xl font-light text-indigo-100 mb-6"
                >
                  {slide.subtitle}
                </motion.h2>
              )}

              {slide.content && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl leading-relaxed"
                >
                  {slide.content}
                </motion.p>
              )}

              {slide.features && slide.features.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, staggerChildren: 0.1 }}
                  className={`grid gap-4 ${slide.layout === 'split' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto'}`}
                >
                  {slide.features.map((feature, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md"
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                      <span className="text-gray-200 font-medium">{feature}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {slide.layout === 'split' && slide.image_url && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex-1 w-full max-w-lg relative"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl blur-2xl opacity-30 transform rotate-3"></div>
                <img 
                  src={slide.image_url} 
                  alt={slide.title} 
                  className="relative z-10 rounded-2xl shadow-2xl border border-white/10 object-cover w-full h-[400px]"
                />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8 z-50">
        <button 
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className={`p-3 rounded-full backdrop-blur-md transition-all ${currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 text-white cursor-pointer bg-white/5 border border-white/10'}`}
        >
          <ChevronUp className="w-6 h-6 transform -rotate-90" />
        </button>
        <div className="flex gap-2">
          {slides.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all ${idx === currentSlide ? 'bg-indigo-500 scale-125' : 'bg-white/30 hover:bg-white/50'}`}
            />
          ))}
        </div>
        <button 
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className={`p-3 rounded-full backdrop-blur-md transition-all ${currentSlide === slides.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 text-white cursor-pointer bg-white/5 border border-white/10'}`}
        >
          <ChevronDown className="w-6 h-6 transform -rotate-90" />
        </button>
      </div>

    </div>
  );
};
