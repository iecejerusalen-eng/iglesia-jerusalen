import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Church, ShieldCheck, Wrench, LayoutDashboard, Globe, ShoppingBag, Server, CheckCircle2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface PresentationSlide {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  icon: React.ElementType;
  image_url: string;
  layout: 'split' | 'grid';
  features: string[];
}

const slides: PresentationSlide[] = [
  {
    id: 'intro',
    title: 'Iglesia Jerusalén',
    subtitle: 'Plataforma Web Integral',
    content: 'Un proyecto innovador diseñado para proporcionar una plataforma en línea moderna, rápida y escalable, fortaleciendo la conexión y gestión de toda la comunidad de la iglesia.',
    icon: Church,
    image_url: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&q=80',
    layout: 'split',
    features: ['Modernidad', 'Escalabilidad', 'Comunidad en línea']
  },
  {
    id: 'caracteristicas',
    title: 'Características y Funciones',
    subtitle: 'Todo lo que necesitas en un solo lugar',
    content: 'El sistema integra múltiples módulos diseñados para cubrir cada necesidad de la congregación.',
    icon: ShieldCheck,
    image_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80',
    layout: 'grid',
    features: [
      'Gestión de usuarios y roles',
      'Panel de administración completo',
      'Vista pública interactiva',
      'Tienda en línea integrada',
      'Infraestructura moderna y robusta'
    ]
  },
  {
    id: 'tecnologias',
    title: 'Herramientas y Tecnologías',
    subtitle: 'Stack tecnológico de vanguardia',
    content: 'Construido con las mejores y más modernas herramientas del desarrollo web para asegurar rendimiento y fiabilidad.',
    icon: Wrench,
    image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80',
    layout: 'split',
    features: [
      'Frontend: React, Tailwind CSS, JS',
      'Backend y BD: Supabase',
      'Despliegue y Hosting: Vercel',
      'Multimedia: Cloudinary'
    ]
  },
  {
    id: 'dashboard',
    title: 'Dashboard y Panel Admin',
    subtitle: 'Control total de la plataforma',
    content: 'Una interfaz administrativa potente para gestionar cada aspecto del sitio web y la comunidad.',
    icon: LayoutDashboard,
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80',
    layout: 'split',
    features: [
      'Visión general y métricas del sitio web',
      'Gestión avanzada de usuarios y roles',
      'Configuración dinámica del sistema',
      'Control total de todos los módulos'
    ]
  },
  {
    id: 'public',
    title: 'Vista Pública',
    subtitle: 'El rostro digital de la Iglesia',
    content: 'Una experiencia de usuario atractiva, rápida y accesible para que todos los miembros y visitantes puedan informarse.',
    icon: Globe,
    image_url: 'https://images.unsplash.com/photo-1497215848147-386f784e1832?auto=format&fit=crop&q=80',
    layout: 'grid',
    features: [
      'Página de inicio dinámica',
      'Sección de noticias y anuncios',
      'Calendario y sección de eventos',
      'Recursos, ministerios y prédicas'
    ]
  },
  {
    id: 'tienda',
    title: 'Tienda en Línea',
    subtitle: 'Comercio electrónico integrado',
    content: 'Facilitamos el acceso a recursos, libros y materiales a través de una tienda virtual segura y fácil de usar.',
    icon: ShoppingBag,
    image_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80',
    layout: 'split',
    features: [
      'Catálogo de productos organizado',
      'Carrito de compras intuitivo',
      'Gestión de pedidos y envíos',
      'Pagos en línea rápidos y seguros'
    ]
  },
  {
    id: 'detalles',
    title: 'Detalles Técnicos',
    subtitle: 'Arquitectura de Software',
    content: 'La infraestructura del proyecto está pensada para ser altamente disponible, segura y fácil de mantener.',
    icon: Server,
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80',
    layout: 'grid',
    features: [
      'Base de datos PostgreSQL vía Supabase',
      'Servidor Edge y CDN provisto por Vercel',
      'Gestión de imágenes optimizada con Cloudinary',
      'Versionamiento y CI/CD integrado con GitHub'
    ]
  },
  {
    id: 'conclusion',
    title: 'Conclusión',
    subtitle: 'Un proyecto transformador',
    content: 'La página web de Iglesia Jerusalén es un proyecto complejo que busca proporcionar una plataforma en línea integral. Con sus características y funciones, es una herramienta invaluable para la gestión y el crecimiento de nuestra comunidad.',
    icon: CheckCircle2,
    image_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80',
    layout: 'split',
    features: [
      'Gestión centralizada de recursos',
      'Crecimiento escalable y medible',
      'Comunidad más conectada e informada'
    ]
  }
];

export const Presentation = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

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
  }, [currentSlide]);

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

  const slide = slides[currentSlide];
  const IconComponent = slide.icon;

  const animationProps = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 }
  };

  return (
    <div className="fixed inset-0 bg-gray-950 overflow-hidden text-white font-sans selection:bg-indigo-500/30">
      <Helmet>
        <title>Presentación del Proyecto | Iglesia Jerusalén</title>
      </Helmet>
      
      {/* Background with parallax/blur effect */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${slide.id}`}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.25, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${slide.image_url})`, filter: 'blur(20px) brightness(0.4)' }}
        />
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5 z-50">
        <motion.div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-full w-full max-w-7xl mx-auto px-6 py-12 md:px-12 md:py-20 lg:py-24">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            {...animationProps}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={`flex-1 flex flex-col h-full ${slide.layout === 'split' ? 'md:flex-row items-center gap-10 lg:gap-16' : 'justify-center items-center text-center'}`}
          >
            {/* Split Layout: Text */}
            <div className={`flex-1 w-full ${slide.layout !== 'split' ? 'max-w-4xl mx-auto' : ''}`}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className={`inline-flex items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl mb-8 ${slide.layout === 'split' ? '' : 'mx-auto flex'}`}
              >
                <IconComponent className="w-10 h-10 text-indigo-400" />
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300 drop-shadow-sm leading-tight"
              >
                {slide.title}
              </motion.h1>

              {slide.subtitle && (
                <motion.h2
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-2xl md:text-3xl font-medium text-indigo-300 mb-8 tracking-wide"
                >
                  {slide.subtitle}
                </motion.h2>
              )}

              {slide.content && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className={`text-lg md:text-xl text-gray-300 mb-12 leading-relaxed ${slide.layout === 'split' ? 'max-w-2xl' : 'max-w-3xl mx-auto'}`}
                >
                  {slide.content}
                </motion.p>
              )}

              {slide.features && slide.features.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, staggerChildren: 0.1 }}
                  className={`grid gap-4 w-full ${slide.layout === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto'}`}
                >
                  {slide.features.map((feature, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 bg-white/5 p-4 lg:p-5 rounded-2xl border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors group"
                    >
                      <div className="min-w-10 min-h-10 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/40 transition-colors">
                        <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                      </div>
                      <span className="text-gray-200 font-medium text-base lg:text-lg leading-tight">{feature}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Split Layout: Image */}
            {slide.layout === 'split' && slide.image_url && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ delay: 0.4, duration: 0.8, type: 'spring' }}
                className="flex-1 w-full max-w-2xl relative perspective-1000 hidden lg:block"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl blur-3xl opacity-30 transform rotate-6 scale-105 animate-pulse"></div>
                <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent z-10"></div>
                  <img 
                    src={slide.image_url} 
                    alt={slide.title} 
                    className="w-full h-[450px] xl:h-[550px] object-cover transform hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-6 md:bottom-10 left-0 right-0 flex justify-center items-center gap-6 md:gap-12 z-50">
        <button 
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className={`p-3 md:p-4 rounded-full backdrop-blur-xl transition-all shadow-lg ${currentSlide === 0 ? 'opacity-30 cursor-not-allowed bg-black/20' : 'hover:bg-white/20 hover:scale-110 text-white cursor-pointer bg-white/10 border border-white/20'}`}
        >
          <ChevronUp className="w-6 h-6 md:w-7 md:h-7 transform -rotate-90" />
        </button>
        
        <div className="flex gap-2 md:gap-3 px-4 md:px-6 py-2.5 md:py-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
          {slides.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 md:h-2.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 md:w-8 bg-indigo-400' : 'w-2 md:w-2.5 bg-white/30 hover:bg-white/60'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button 
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className={`p-3 md:p-4 rounded-full backdrop-blur-xl transition-all shadow-lg ${currentSlide === slides.length - 1 ? 'opacity-30 cursor-not-allowed bg-black/20' : 'hover:bg-white/20 hover:scale-110 text-white cursor-pointer bg-white/10 border border-white/20'}`}
        >
          <ChevronDown className="w-6 h-6 md:w-7 md:h-7 transform -rotate-90" />
        </button>
      </div>

    </div>
  );
};

