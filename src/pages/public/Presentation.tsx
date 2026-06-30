import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, Church, ShieldCheck, Wrench, LayoutDashboard, Globe, 
  ShoppingBag, Server, CheckCircle2, GraduationCap, Users, Gamepad2, CreditCard, 
  Radio, HardDrive, Smartphone, Code, PlaySquare, Presentation as PresentationIcon
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../config/supabase';

interface PresentationSlide {
  id: string;
  order_index: number;
  title: string;
  subtitle: string;
  content: string;
  icon: string | React.ElementType; // Can be string from DB or Component in fallback
  image_url: string;
  layout: string;
  features: string[];
  animation_type?: string;
  theme_color?: string;
}

// ============================================================================
// DATOS POR DEFECTO SÚPER DETALLADOS (EXPLICANDO TODA LA PLATAFORMA)
// ============================================================================
const defaultSlides: PresentationSlide[] = [
  {
    id: 'intro',
    order_index: 1,
    title: 'Iglesia Jerusalén',
    subtitle: 'La Plataforma Web Definitiva',
    content: 'Bienvenido al sistema integral de gestión eclesial más avanzado. No es solo una página web; es un Ecosistema Digital Completo que unifica la administración, el discipulado, el comercio y la comunidad en una sola plataforma en la nube.',
    icon: Church,
    image_url: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&q=80',
    layout: 'split',
    features: ['Ecosistema Unificado', 'Arquitectura Modular', 'Escalabilidad Global']
  },
  {
    id: 'tecnologias',
    order_index: 2,
    title: 'Arquitectura de Vanguardia',
    subtitle: 'El Stack Tecnológico',
    content: 'Diseñado bajo una arquitectura robusta y moderna, garantizando tiempos de carga milimétricos y disponibilidad del 99.99%. Todo construido con las herramientas estándar de la industria Tech.',
    icon: Server,
    image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80',
    layout: 'grid',
    features: [
      'React 18 + Vite (Frontend Ultra Rápido)',
      'TypeScript Estricto (Seguridad de Código)',
      'Supabase (PostgreSQL + Auth + Realtime)',
      'Zustand (Estado Global Offline-First)',
      'Tailwind CSS (Diseño Premium)',
      'Cloudinary (Optimización Multimedia)'
    ]
  },
  {
    id: 'crm',
    order_index: 3,
    title: 'CRM y Gestión de Usuarios',
    subtitle: 'Control Absoluto de Membresía',
    content: 'El corazón del sistema. Un módulo de gestión de relaciones que administra los perfiles de los congregantes, sus roles y sus niveles de acceso a cada rincón de la plataforma.',
    icon: Users,
    image_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80',
    layout: 'split',
    features: [
      'Perfiles dinámicos y roles jerárquicos',
      'Permisos Override (Excepciones por usuario)',
      'Gestión de Ministerios y Departamentos',
      'Sistema de Baneo de Cuentas en tiempo real',
      'Autenticación Segura (Supabase Auth)'
    ]
  },
  {
    id: 'lms',
    order_index: 4,
    title: 'Aula Virtual (LMS)',
    subtitle: 'Discipulado y Aprendizaje Online',
    content: 'Una academia digital completa integrada directamente en la página. Los estudiantes pueden tomar cursos, ver lecciones en video y seguir su progreso académico minuto a minuto.',
    icon: GraduationCap,
    image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80',
    layout: 'grid',
    features: [
      'Dashboard interactivo del estudiante',
      'Cálculo de progreso matemático en tiempo real',
      'Gamificación: Sistema de insignias (Badges)',
      'Estructura: Cursos > Módulos > Lecciones',
      'Calificaciones (Gradebook) para docentes'
    ]
  },
  {
    id: 'ecommerce',
    order_index: 5,
    title: 'Tienda Jerusalén',
    subtitle: 'E-commerce Inteligente',
    content: 'Un módulo comercial completo para distribuir recursos de la iglesia. Soporta tanto productos físicos como descargables digitales, gestionado completamente con persistencia local.',
    icon: ShoppingBag,
    image_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80',
    layout: 'split',
    features: [
      'Carrito de compras (Offline persistente)',
      'Productos físicos y e-Books (Digitales)',
      'Gestión de Variantes (Tallas y colores)',
      'Ajustes dinámicos de precios por variante',
      'Integración con Checkout y pagos seguros'
    ]
  },
  {
    id: 'juegos',
    order_index: 6,
    title: 'Juegos y Gamificación',
    subtitle: 'Módulo de Entretenimiento: Biblionario',
    content: 'El aprendizaje bíblico transformado en un desafío divertido. Un completo motor de minijuegos diseñado para interactuar con todas las edades de la iglesia.',
    icon: Gamepad2,
    image_url: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80',
    layout: 'grid',
    features: [
      'Niveles de dificultad escalables (1 al 15)',
      'Soporte nativo de Emojis e Imágenes',
      'Tabla de Clasificación (Leaderboard global)',
      'Editor de preguntas intuitivo en el Admin',
      'Explicaciones y referencias bíblicas al fallar'
    ]
  },
  {
    id: 'multimedia',
    order_index: 7,
    title: 'Recursos Multimedia',
    subtitle: 'Prédicas, Canciones y Peticiones',
    content: 'Administra todo el material audiovisual y las necesidades espirituales de la congregación con flujos de trabajo especializados y categorización dinámica.',
    icon: PlaySquare,
    image_url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80',
    layout: 'split',
    features: [
      'Biblioteca de Prédicas con filtros y búsqueda',
      'Repertorio de Canciones y acordes',
      'Gestión de Peticiones de Oración anónimas',
      'Vault de Recursos Abiertos para creativos',
      'Almacenamiento Cloudinary sin pérdida de calidad'
    ]
  },
  {
    id: 'admin',
    order_index: 8,
    title: 'Panel de Administración',
    subtitle: 'El Centro de Mando',
    content: 'Una vista protegida donde los líderes pueden monitorear, crear y modificar absolutamente todos los aspectos del sistema sin escribir una sola línea de código.',
    icon: LayoutDashboard,
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80',
    layout: 'grid',
    features: [
      'Gráficos y Métricas (Analytics Dashboard)',
      'CMS (Sistema de Gestión de Contenido)',
      'Gestor de Plugins y Ajustes del sistema',
      'Editor de Páginas Dinámicas',
      'Diseño Glassmorphism Premium'
    ]
  },
  {
    id: 'offline',
    order_index: 9,
    title: 'Diseño Resiliente',
    subtitle: 'Conexión y Sincronización',
    content: 'Sabemos que la conexión a internet puede fallar. Por eso, el sistema cuenta con "Offline First capabilities", almacenando el carrito, preferencias de tema y progreso hasta que la conexión vuelve.',
    icon: HardDrive,
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80',
    layout: 'split',
    features: [
      'Zustand Persist Middleware',
      'Lógica de Sincronización en Background',
      'Tema Claro/Oscuro guardado localmente',
      'Optimizaciones para dispositivos móviles',
      'Carga diferida (Lazy Loading)'
    ]
  },
  {
    id: 'conclusion',
    order_index: 10,
    title: 'Conclusión',
    subtitle: 'El Futuro de Iglesia Jerusalén',
    content: 'No es un MVP; es una aplicación empresarial (SaaS) adaptada al contexto de la iglesia, lista para crecer, recibir tráfico masivo y unir a la congregación en la era digital.',
    icon: Globe,
    image_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80',
    layout: 'grid',
    features: [
      'Despliegue contínuo y Edge Network (Vercel)',
      'Protección de Rutas (Auth Guards)',
      'Preparado para integraciones futuras',
      'Una congregación verdaderamente conectada'
    ]
  }
];

// Helper to map string icon names to Lucide components if needed
const IconMap: Record<string, React.ElementType> = {
  Church, ShieldCheck, Wrench, LayoutDashboard, Globe, ShoppingBag, Server, CheckCircle2,
  GraduationCap, Users, Gamepad2, CreditCard, Radio, HardDrive, Smartphone, Code, PlaySquare,
  Presentation: PresentationIcon
};

export const Presentation = () => {
  const [slides, setSlides] = useState<PresentationSlide[]>(defaultSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  // Intentar cargar las diapositivas desde Supabase si existen
  useEffect(() => {
    const fetchCustomSlides = async () => {
      try {
        const { data, error } = await supabase
          .from('presentation_slides')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true });
          
        if (error && error.code !== '42P01') {
          console.warn('Supabase fetch error, using defaults:', error);
        } else if (data && data.length > 0) {
          setSlides(data);
        }
      } catch (err) {
        console.warn('Failed to load slides, using default massive presentation');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomSlides();
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
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const slide = slides[currentSlide];
  
  // Resolve icon
  let IconComponent: React.ElementType = Church;
  if (typeof slide.icon === 'string' && IconMap[slide.icon]) {
    IconComponent = IconMap[slide.icon];
  } else if (typeof slide.icon !== 'string' && slide.icon) {
    IconComponent = slide.icon as React.ElementType;
  }

  // Animation Maps
  const getAnimationProps = (type?: string) => {
    switch (type) {
      case 'slide_up':
        return { initial: { opacity: 0, y: 100 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -100 } };
      case 'zoom':
        return { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.2 } };
      case 'spring':
        return { initial: { opacity: 0, x: 100 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -100 }, transition: { type: 'spring', bounce: 0.4 } };
      case 'fade':
      default:
        return { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -30 } };
    }
  };

  const animProps = getAnimationProps(slide.animation_type);

  return (
    <div className="fixed inset-0 bg-gray-950 overflow-hidden text-white font-sans selection:bg-indigo-500/30">
      <Helmet>
        <title>Presentación Integral | Iglesia Jerusalén</title>
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
            {...animProps}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={`flex-1 flex flex-col h-full ${slide.layout === 'split' ? 'md:flex-row items-center gap-10 lg:gap-16' : 'justify-center items-center text-center'}`}
          >
            {/* Texto */}
            <div className={`flex-1 w-full ${slide.layout !== 'split' ? 'max-w-4xl mx-auto' : ''}`}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className={`inline-flex items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl mb-8 ${slide.layout === 'split' ? '' : 'mx-auto flex'}`}
              >
                <IconComponent className="w-12 h-12 text-indigo-400" />
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300 drop-shadow-sm leading-tight"
              >
                {slide.title}
              </motion.h1>

              {slide.subtitle && (
                <motion.h2
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-2xl md:text-3xl font-bold text-indigo-400 mb-8 tracking-wide drop-shadow-sm uppercase"
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
                      className="flex items-center gap-4 bg-white/5 p-4 lg:p-5 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg hover:bg-white/10 hover:-translate-y-1 transition-all group"
                    >
                      <div className="min-w-10 min-h-10 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/40 transition-colors">
                        <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                      </div>
                      <span className="text-gray-100 font-medium text-base lg:text-lg leading-tight">{feature}</span>
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
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl blur-3xl opacity-40 transform rotate-6 scale-105 animate-pulse"></div>
                <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent z-10"></div>
                  <img 
                    src={slide.image_url} 
                    alt={slide.title} 
                    className="w-full h-[450px] xl:h-[600px] object-cover transform hover:scale-105 transition-transform duration-1000"
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
              className={`h-2 md:h-2.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 md:w-10 bg-indigo-400' : 'w-2 md:w-2.5 bg-white/30 hover:bg-white/60'}`}
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
