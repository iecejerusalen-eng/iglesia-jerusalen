import { useState, useEffect } from 'react';
import { ScrollReveal, StaggerContainer, StaggerItem, HoverCard } from '../../components/animations/MotionWrappers';
import { Landmark, Compass, Sparkles, Cross, Flame, Droplet, Crown, Activity, MapPin, X } from 'lucide-react';
import { supabase } from '../../config/supabase';
import BlockRenderer from '../../components/public/BlockRenderer';
import { ImageGallerySection } from '../../components/public/ImageGallerySection';
import PrinciplesOfFaith from '../../components/public/PrinciplesOfFaith';

import OptimizedMedia from '../../components/common/OptimizedMedia';
import HistoryTabs from '../../components/public/about/HistoryTabs';

import pastorDavidImg from '../../assets/Jerusalén/Pastor David.png';
import pastoraCorinaImg from '../../assets/Jerusalén/Pastora Corina.png';
import pastoresAgrupadosImg from '../../assets/Jerusalén/Pastores.jpg';
import aimeeImg from '../../assets/Imágenes Cuadrangular/Imagen Aime Semple Mcpherson.webp';

const AnimatedFoursquareLogo = () => (
  <div className="flex justify-center my-8 relative">
    <div className="absolute inset-0 bg-gold/10 blur-3xl rounded-full" />
    <svg viewBox="0 0 200 200" className="w-48 h-48 md:w-64 md:h-64 drop-shadow-2xl relative z-10">
      <style>
        {`
          .foursquare-draw {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            animation: draw 2.5s ease-in-out forwards;
          }
          @keyframes draw {
            to { stroke-dashoffset: 0; }
          }
          .foursquare-fade {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
            animation: fadeUpScale 0.8s ease-out forwards;
          }
          @keyframes fadeUpScale {
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}
      </style>
      
      {/* Outer shield/square */}
      <rect x="10" y="10" width="180" height="180" rx="24" fill="none" stroke="currentColor" strokeWidth="6" className="foursquare-draw text-primary dark:text-gold" />
      
      {/* Inner lines */}
      <line x1="100" y1="10" x2="100" y2="190" stroke="currentColor" strokeWidth="4" className="foursquare-draw text-primary dark:text-gold" style={{ animationDelay: '0.3s' }} />
      <line x1="10" y1="100" x2="190" y2="100" stroke="currentColor" strokeWidth="4" className="foursquare-draw text-primary dark:text-gold" style={{ animationDelay: '0.3s' }} />
      
      {/* 1. Cross (Red) - Top Left */}
      <g className="foursquare-fade text-red-500" style={{ animationDelay: '1.2s' }}>
        <path d="M55 35 L55 75 M40 45 L70 45" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      </g>
      
      {/* 2. Flame (Yellow) - Top Right */}
      <g className="foursquare-fade text-yellow-500" style={{ animationDelay: '1.6s' }}>
        <path d="M150 80 C 130 80 135 50 150 30 C 165 50 170 80 150 80 Z" fill="currentColor" />
        <path d="M150 75 C 140 75 145 55 150 45 C 155 55 160 75 150 75 Z" fill="#ffffff" className="dark:fill-slate-900" />
      </g>
      
      {/* 3. Cup/Droplet (Blue) - Bottom Left */}
      <g className="foursquare-fade text-blue-500" style={{ animationDelay: '2.0s' }}>
        <path d="M55 170 C 35 170 40 140 55 120 C 70 140 75 170 55 170 Z" fill="currentColor" />
        <path d="M50 160 Q 45 150 55 140" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" className="dark:stroke-slate-900" />
      </g>
      
      {/* 4. Crown (Purple) - Bottom Right */}
      <g className="foursquare-fade text-purple-500" style={{ animationDelay: '2.4s' }}>
        <path d="M125 130 L135 165 L165 165 L175 130 L160 145 L150 115 L140 145 Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="125" cy="125" r="4" fill="currentColor" />
        <circle cx="150" cy="110" r="4" fill="currentColor" />
        <circle cx="175" cy="125" r="4" fill="currentColor" />
      </g>
    </svg>
  </div>
);

interface AboutSection {
  id: string;
  section_type: string;
  name?: string;
  title?: string;
  subtitle?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content_blocks?: any[];
  cover_image_url?: string;
}

const DEFAULT_ABOUT_SECTIONS: AboutSection[] = [
  { id: 'about_hero', section_type: 'custom', name: 'Héroe Principal', title: 'Quiénes Somos', subtitle: 'Conoce la historia, misión, principios de fe y las personas llamadas por Dios a guiar a la Iglesia del Evangelio Cuadrangular Jerusalén.', content_blocks: [] },
  { id: 'about_vision_mission', section_type: 'custom', name: 'Misión y Visión', title: 'Misión & Visión', subtitle: 'Nuestra guía en la expansión del evangelio.', content_blocks: [] },
  { id: 'about_history', section_type: 'custom', name: 'Nuestra Historia', title: 'Nuestra Historia', subtitle: 'La trayectoria y cimientos de la congregación.', content_blocks: [] },
  { id: 'about_pillars', section_type: 'system_about_pillars', name: 'Los 4 Pilares Cuadrangulares', title: 'Los 4 Pilares Cuadrangulares', subtitle: 'Fundamentados firmemente en el mensaje bíblico de la verdad eterna.' },
  { id: 'about_principles', section_type: 'system_about_principles', name: 'Principios de Fe', title: 'Principios de Fe', subtitle: 'Doctrinas fundamentales de la Iglesia del Evangelio Cuadrangular.' },
  { id: 'about_pastoral', section_type: 'custom', name: 'Liderazgo Pastoral', title: 'Liderazgo Pastoral', subtitle: 'Nuestros pastores principales llamados a guiar y cuidar espiritualmente a la congregación.', content_blocks: [] }
];

const About = () => {
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    const fetchDynamicContent = async () => {
      try {
        const { data, error } = await supabase
          .from('page_contents')
          .select('*')
          .eq('page', 'about')
          .order('order_index', { ascending: true });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setSections(data);
        } else {
          setSections(DEFAULT_ABOUT_SECTIONS);
        }
      } catch (err) {
        console.error('Error fetching about page contents:', err);
        setSections(DEFAULT_ABOUT_SECTIONS);
      } finally {
        setLoading(false);
      }
    };
    fetchDynamicContent();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 dark:border-indigo-450 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-500 dark:text-gray-400 mt-4 text-xs font-semibold uppercase tracking-wider">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-16">
      {sections.map((sectionData) => {
        const { id, section_type, title, subtitle, content_blocks, cover_image_url } = sectionData;

        switch (section_type) {
          case 'custom':
            // 1. HERO SECTION
            if (id === 'about_hero') {
              return (
                <div 
                  key={id} 
                  id={id}
                  className="relative rounded-[2.5rem] p-8 md:p-16 shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden min-h-[55vh] flex items-center group"
                >
                  <div className="absolute inset-0 z-0 bg-slate-900">
                    <img loading="lazy" 
                      src={cover_image_url || "/images/about/hero.png"} 
                      alt="Portada" 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[3s] ease-out opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/60 to-transparent"></div>
                  </div>
                  <ScrollReveal 
                    direction="up"
                    distance={30}
                    duration={1.3}
                    delay={0}
                    className="relative z-10 max-w-2xl space-y-6 text-left bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-[2rem] shadow-2xl"
                  >
                    <div className="inline-flex items-center space-x-2 bg-gold/10 text-gold border border-gold/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                      <Sparkles size={14} className="mr-1" /> Nuestra Identidad
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif font-extrabold text-white tracking-tight leading-tight drop-shadow-lg">
                      {title || 'Quiénes Somos'}
                    </h1>
                    <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light">
                      {subtitle || 'Conoce la historia, misión, principios de fe y las personas llamadas por Dios a guiar a la Iglesia del Evangelio Cuadrangular Jerusalén.'}
                    </p>
                    {content_blocks && content_blocks.length > 0 && (
                      <div className="pt-6 border-t border-white/10 mt-6 text-gray-200">
                        <BlockRenderer blocks={content_blocks} />
                      </div>
                    )}
                  </ScrollReveal>
                </div>
              );
            }

            // 2. VISION & MISSION
            if (id === 'about_vision_mission') {
              return (
                <div key={id} id={id}>
                  {content_blocks && content_blocks.length > 0 ? (
                    <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs text-left">
                      {title && <h2 className="text-3xl font-serif font-bold text-primary dark:text-white mb-2">{title}</h2>}
                      {subtitle && <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{subtitle}</p>}
                      <BlockRenderer blocks={content_blocks} />
                    </div>
                  ) : (
                      <StaggerContainer 
                        className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto"
                      >
                        <StaggerItem className="h-full">
                          <HoverCard 
                            className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-10 rounded-[2rem] border border-gray-200/50 dark:border-white/5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)] flex flex-col justify-between text-left h-full overflow-hidden group hover:border-indigo-500/30 transition-all duration-500"
                          >
                            <div className="absolute -top-24 -right-24 w-56 h-56 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-colors duration-700"></div>
                            <div className="relative z-10 space-y-6">
                              <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-800/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-inner ring-1 ring-indigo-500/20 transform group-hover:-translate-y-1 transition-transform duration-500">
                                <Compass size={32} />
                              </div>
                              <h2 className="font-serif font-bold text-3xl text-slate-800 dark:text-white tracking-tight">Nuestra Misión</h2>
                              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                                Predicar el Evangelio de Nuestro Señor Jesucristo como Salvador, Bautizador con el Espíritu Santo, Sanador y Rey que viene pronto, formar discípulos llenos de santidad, amor fraternal y servicio.
                              </p>
                            </div>
                          </HoverCard>
                        </StaggerItem>

                        <StaggerItem className="h-full">
                          <HoverCard 
                            className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-10 rounded-[2rem] border border-gray-200/50 dark:border-white/5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)] flex flex-col justify-between text-left h-full overflow-hidden group hover:border-amber-500/30 transition-all duration-500"
                          >
                            <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-500/30 transition-colors duration-700"></div>
                            <div className="relative z-10 space-y-6">
                              <div className="w-16 h-16 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-inner ring-1 ring-amber-500/20 transform group-hover:-translate-y-1 transition-transform duration-500">
                                <Sparkles size={32} />
                              </div>
                              <h2 className="font-serif font-bold text-3xl text-slate-800 dark:text-white tracking-tight">Nuestra Visión</h2>
                              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                                Ser una iglesia que evangeliza y discípula en el Ecuador y el mundo, estableciendo comunidades cristianas saludables y multiplicadoras.
                              </p>
                            </div>
                          </HoverCard>
                        </StaggerItem>
                      </StaggerContainer>
                  )}
                </div>
              );
            }

            // 3. HISTORY
            if (id === 'about_history') {
              return (
                <div key={id} id={id}>
                  <div className="space-y-16">
                    {/* Pestañas de Historia Internacional y Nacional */}
                    <HistoryTabs />

                    {/* Historia Local */}
                    <ScrollReveal direction="up" distance={30} duration={1.3} delay={0.4} className="bg-gradient-to-br from-slate-900 to-primary text-white rounded-[3rem] p-8 md:p-16 shadow-[0_20px_50px_rgba(0,0,0,0.3)] space-y-12 text-left relative overflow-hidden group border border-white/5">
                      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-1000 ease-out">
                        <Landmark size={320} />
                      </div>
                      <div className="relative z-10 space-y-10">
                        <div className="inline-flex items-center space-x-2 bg-white/10 px-5 py-2 rounded-full text-white font-medium text-sm backdrop-blur-md border border-white/20 shadow-inner">
                          <MapPin className="w-4 h-4 text-gold" />
                          <span>Nuestra Congregación</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-serif font-extrabold tracking-tight drop-shadow-md">
                          Historia de la Iglesia "Jerusalén"
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                          <div className="lg:col-span-6 space-y-6 text-slate-300 text-base md:text-lg leading-relaxed">
                            <p>
                              Siguiendo el espíritu fundacional y misionero que caracteriza a nuestra denominación, nació la <strong className="text-white">Iglesia Jerusalén</strong> en nuestra amada ciudad. Fundada en la fe y bajo los mismos principios cuadrangulares, fue establecida para ser un refugio de paz, sanidad y restauración.
                            </p>
                            <p>
                              A lo largo de los años, con la guía incondicional del Espíritu Santo y el esfuerzo perseverante de nuestros pastores y líderes, la Iglesia Jerusalén ha florecido. Nos hemos convertido en un centro de discipulado profundo, donde el servicio constante y el amor fraternal son nuestra mejor carta de presentación.
                            </p>
                            <p className="font-medium text-gold/90 text-xl font-serif italic mt-6 border-l-4 border-gold pl-6 py-2">
                              Hoy, continuamos firmes y arraigados en el amor de Dios. Con la mirada siempre puesta en expandir el reino, formamos nuevas generaciones que viven los cuatro pilares del Evangelio Cuadrangular cada día.
                            </p>
                          </div>
                          <div className="lg:col-span-6 relative">
                            <div className="absolute -inset-4 bg-gold/10 rounded-[3rem] blur-2xl transform group-hover:scale-105 transition-transform duration-700"></div>
                            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/20 transform group-hover:-translate-y-2 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-700 ease-out">
                              <OptimizedMedia 
                                src={pastoresAgrupadosImg} 
                                alt="Pastores Iglesia Jerusalén"
                                className="w-full h-80 md:h-[28rem] object-cover object-top hover:scale-105 transition-transform duration-[2s]"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent flex items-end p-8">
                                <p className="text-white font-serif font-medium text-lg leading-snug drop-shadow-lg">Nuestros pastores y líderes guiando la congregación hacia el propósito de Dios.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  </div>
                </div>
              );
            }

            // 5. PASTORAL / LIDERAZGO
            if (id === 'about_pastoral') {
              return (
                <div key={id} id={id}>
                  <section className="space-y-8 text-left">
                    <ScrollReveal 
                      direction="up"
                      distance={20}
                      duration={1.3}
                      delay={0}
                      className="text-center max-w-xl mx-auto space-y-2"
                    >
                      <h2 className="text-3xl font-serif font-bold text-primary dark:text-white">Liderazgo Pastoral</h2>
                      <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
                        Nuestros pastores principales llamados a guiar y cuidar espiritualmente a la congregación.
                      </p>
                    </ScrollReveal>

                    {content_blocks && content_blocks.length > 0 && (
                      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-white/10 p-8 md:p-12 shadow-xs mb-8">
                        <BlockRenderer blocks={content_blocks} />
                      </div>
                    )}

                    <StaggerContainer 
                      className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto"
                    >
                      <StaggerItem className="h-full">
                        <HoverCard 
                          className="relative h-[28rem] md:h-[32rem] rounded-[2.5rem] overflow-hidden group border border-gray-200/50 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                        >
                          <OptimizedMedia 
                            src={pastorDavidImg} 
                            alt="Pastor David Nicola" 
                            className="absolute inset-0 w-full h-full object-cover object-top transform group-hover:scale-110 transition-transform duration-[3s] ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent"></div>
                          
                          <div className="absolute bottom-0 inset-x-0 p-8 backdrop-blur-xl bg-slate-950/60 border-t border-white/10 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 rounded-b-[2.5rem]">
                            <h3 className="text-3xl font-serif font-bold text-white drop-shadow-md">Ps. David Nicola</h3>
                            <p className="text-gold font-medium uppercase tracking-widest text-xs mt-2 mb-4">Pastor Principal</p>
                            <p className="text-gray-300 text-sm leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                              Guiando a la congregación con pasión por la Palabra de Dios y un corazón dedicado a la enseñanza y el cuidado espiritual de las familias.
                            </p>
                          </div>
                        </HoverCard>
                      </StaggerItem>

                      <StaggerItem className="h-full">
                        <HoverCard 
                          className="relative h-[28rem] md:h-[32rem] rounded-[2.5rem] overflow-hidden group border border-gray-200/50 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                        >
                          <OptimizedMedia 
                            src={pastoraCorinaImg} 
                            alt="Pastora Corina Miranda" 
                            className="absolute inset-0 w-full h-full object-cover object-top transform group-hover:scale-110 transition-transform duration-[3s] ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent"></div>
                          
                          <div className="absolute bottom-0 inset-x-0 p-8 backdrop-blur-xl bg-slate-950/60 border-t border-white/10 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 rounded-b-[2.5rem]">
                            <h3 className="text-3xl font-serif font-bold text-white drop-shadow-md">Psa. Corina Miranda</h3>
                            <p className="text-gold font-medium uppercase tracking-widest text-xs mt-2 mb-4">Pastora Co-Principal</p>
                            <p className="text-gray-300 text-sm leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                              Dedicada a la consejería pastoral, la restauración familiar y el fortalecimiento de los ministerios internos de la iglesia.
                            </p>
                          </div>
                        </HoverCard>
                      </StaggerItem>
                    </StaggerContainer>
                    </section>
                </div>
              );
            }

            // OTHER GENERIC CUSTOM SECTIONS (added by user)
            return (
              <section key={id} id={id} className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 animate-fadeIn text-left">
                {(title || subtitle) && (
                  <div className="text-center max-w-2xl mx-auto space-y-3">
                    {title && <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary dark:text-white">{title}</h2>}
                    {subtitle && <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed">{subtitle}</p>}
                  </div>
                )}
                <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl border border-gray-150 dark:border-white/10 shadow-xs">
                  <BlockRenderer blocks={content_blocks} />
                </div>
              </section>
            );

          case 'system_about_pillars':
            // 4. DECLARACIÓN DOCTRINAL (LOS 4 PUNTOS CUADRANGULARES)
            return (
              <section key={id} id={id} className="space-y-8 text-left">
                <ScrollReveal 
                  direction="up"
                  distance={20}
                  duration={1.3}
                  delay={0}
                  className="text-center max-w-xl mx-auto space-y-2"
                >
                  <h2 className="text-3xl font-serif font-bold text-primary dark:text-white">{title || 'Los 4 Pilares Cuadrangulares'}</h2>
                  {subtitle && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">{subtitle}</p>
                  )}
                </ScrollReveal>

                <StaggerContainer 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                  <StaggerItem className="h-full">
                    <HoverCard 
                      className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2rem] border border-gray-200/50 dark:border-white/5 shadow-sm hover:shadow-[0_10px_40px_-10px_rgba(220,38,38,0.3)] hover:border-red-500/30 transition-all duration-500 flex flex-col justify-between h-full group"
                    >
                      <div className="space-y-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center font-bold shadow-inner ring-1 ring-red-500/20 transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                          <Cross size={32} className="text-red-600 drop-shadow-sm" />
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-xl text-slate-800 dark:text-gray-100 mb-3">Jesucristo, el Salvador</h3>
                          <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">
                            Representado por el <strong>rostro de hombre</strong>. Él pagó el precio de nuestros pecados en la cruz y nos trajo redención eterna.
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center space-x-2 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider mt-8 w-max">
                        <span>Juan 3:16</span>
                      </span>
                    </HoverCard>
                  </StaggerItem>

                  <StaggerItem className="h-full">
                    <HoverCard 
                      className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2rem] border border-gray-200/50 dark:border-white/5 shadow-sm hover:shadow-[0_10px_40px_-10px_rgba(234,179,8,0.3)] hover:border-yellow-500/30 transition-all duration-500 flex flex-col justify-between h-full group"
                    >
                      <div className="space-y-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-600 dark:text-yellow-400 rounded-2xl flex items-center justify-center font-bold shadow-inner ring-1 ring-yellow-500/20 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                          <Flame size={32} className="text-yellow-500 drop-shadow-sm" />
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-xl text-slate-800 dark:text-gray-100 mb-3">Jesucristo, el Bautizador</h3>
                          <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">
                            Representado por el <strong>rostro de león</strong>. Él nos llena de poder y fuego con el Espíritu Santo para el servicio.
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center space-x-2 text-[10px] font-bold text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider mt-8 w-max">
                        <span>Hechos 1:8</span>
                      </span>
                    </HoverCard>
                  </StaggerItem>

                  <StaggerItem className="h-full">
                    <HoverCard 
                      className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2rem] border border-gray-200/50 dark:border-white/5 shadow-sm hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.3)] hover:border-blue-500/30 transition-all duration-500 flex flex-col justify-between h-full group"
                    >
                      <div className="space-y-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-bold shadow-inner ring-1 ring-blue-500/20 transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                          <Droplet size={32} className="text-blue-600 drop-shadow-sm" />
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-xl text-slate-800 dark:text-gray-100 mb-3">Jesucristo, el Sanador</h3>
                          <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">
                            Representado por el <strong>rostro de buey</strong>. Él llevó nuestras enfermedades y nos provee sanidad en cuerpo, alma y espíritu.
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center space-x-2 text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider mt-8 w-max">
                        <span>Marcos 16:18</span>
                      </span>
                    </HoverCard>
                  </StaggerItem>

                  <StaggerItem className="h-full">
                    <HoverCard 
                      className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2rem] border border-gray-200/50 dark:border-white/5 shadow-sm hover:shadow-[0_10px_40px_-10px_rgba(147,51,234,0.3)] hover:border-purple-500/30 transition-all duration-500 flex flex-col justify-between h-full group"
                    >
                      <div className="space-y-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center font-bold shadow-inner ring-1 ring-purple-500/20 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                          <Crown size={32} className="text-purple-600 drop-shadow-sm" />
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-xl text-slate-800 dark:text-gray-100 mb-3">Jesucristo, el Rey que Viene</h3>
                          <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">
                            Representado por el <strong>rostro de águila</strong>. Nuestra esperanza gloriosa de que Él regresará con majestad por su pueblo.
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center space-x-2 text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider mt-8 w-max">
                        <span>1 Tesalonicenses 4:16</span>
                      </span>
                    </HoverCard>
                  </StaggerItem>
                </StaggerContainer>
              </section>
            );

          case 'system_about_principles':
            return (
              <section key={id} id={id} className="max-w-7xl mx-auto px-4 md:px-8 py-4">
                <PrinciplesOfFaith />
              </section>
            );

          case 'system_gallery':
            // GALERIA DE DIAPOSITIVAS TAMBIÉN DISPONIBLE EN NOSOTROS
            return (
              <div key={id} id={id}>
                <ImageGallerySection 
                  title={title || ''}
                  subtitle={subtitle || ''}
                  slides={content_blocks || []}
                />
              </div>
            );

          default:
            return null;
        }
      })}

      {/* Modal de Historia Completa */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-zoomIn">
            <div className="flex justify-between items-center p-6 md:p-8 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary dark:text-white flex items-center gap-3">
                <Landmark className="w-8 h-8 text-gold" />
                Historia de la Iglesia Cuadrangular
              </h2>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 hover:text-red-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed space-y-6 text-left">
              <AnimatedFoursquareLogo />
              
              <p>
                La <strong>Iglesia Internacional del Evangelio Cuadrangular</strong>, comúnmente conocida como la Iglesia Cuadrangular, es una denominación cristiana pentecostal fundada en 1923 por la evangelista <strong>Aimee Semple McPherson</strong> mediante el establecimiento del Templo del Ángelus en Los Ángeles, California. Su nombre deriva del "Evangelio Cuadrangular", un marco teológico que representa a Jesucristo en cuatro roles: como <strong>Salvador, Bautizador con el Espíritu Santo, Sanador y Rey que pronto vendrá</strong>. Constituida formalmente en 1927, la iglesia enfatiza el evangelismo, las curaciones milagrosas y las misiones globales, con raíces en el avivamiento pentecostal de principios del siglo XX.
              </p>
              
              <div className="my-8 rounded-2xl overflow-hidden shadow-md">
                <OptimizedMedia src={aimeeImg} alt="Aimee Semple McPherson" className="w-full max-h-[400px] object-cover object-top" />
              </div>

              <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-8 mb-4">La declaración de fe</h3>
              <p>
                La denominación se inspira y adhiere al cristianismo evangélico en gran medida alineado con las asambleas pentecostales convencionales. Afirma la inspiración de la Biblia y la validez universal y la exactitud inerrante de sus narrativas, milagros y enseñanzas teológicas. Define a Dios de manera trinitaria, con el Espíritu Santo derramado sobre los creyentes para darles poder y testimonio. Afirma la divinidad de Jesucristo, su vida impecable, su muerte expiatoria en la cruz por la humanidad, su resurrección física, su ascensión al cielo, su regreso prometido y su papel final como el Juez amoroso pero justo. Enseña que los creyentes caen de manera única e ineludible bajo la gracia divina y, en última instancia, son restaurados y glorificados. Al mismo tiempo, defiende la curación de los enfermos y valora la labor y los dones del Espíritu en las vidas santificadas, al tiempo que advierte que todos se enfrentarán finalmente al juicio divino. El nombre Cuadrangular se inspiró en el libro de Ezequiel, en el que se revela el carácter de Dios mediante cuatro caras, y en Hebreos 13:8: «Jesucristo es el mismo ayer, hoy y por los siglos».
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
                <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                  <h4 className="font-bold text-red-600 flex items-center gap-2 mb-2"><Cross className="w-5 h-5"/> Jesucristo es el Salvador</h4>
                  <p className="text-sm m-0">Vino a este mundo y murió en la cruz por nuestros pecados.</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                  <h4 className="font-bold text-yellow-500 flex items-center gap-2 mb-2"><Flame className="w-5 h-5"/> Jesucristo es el Bautizador con el Espíritu Santo</h4>
                  <p className="text-sm m-0">Bautiza al creyente con el Espíritu Santo dando poder para testificar y vivir una vida abundante.</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                  <h4 className="font-bold text-blue-500 flex items-center gap-2 mb-2"><Activity className="w-5 h-5"/> Jesucristo es el Sanador</h4>
                  <p className="text-sm m-0">Al morir por nosotros llevó nuestros dolores y enfermedades.</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                  <h4 className="font-bold text-purple-500 flex items-center gap-2 mb-2"><Crown className="w-5 h-5"/> Jesucristo es el Rey que Viene</h4>
                  <p className="text-sm m-0">Regresará a la tierra como Rey de Reyes y Señor de Señores.</p>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-8 mb-4">Historia: Aimee Semple McPherson</h3>
              <p>
                En 1922, Aimee Semple McPherson (1890-1944), una evangelista conocida como la "hermana Aimee", explicó por primera vez su concepto del Evangelio Cuadrangular en un sermón en Oakland, California. Se centraba en el mensaje de Cristo como Salvador, Bautizador del Espíritu Santo, Sanador y Rey venidero. Dedicó su vida a predicar este evangelio de esperanza a una generación necesitada de amor y sanidad física y espiritual.
              </p>

              <p>
                Con gran dedicación fundó en 1923 el <strong>Templo del Ángelus</strong> en Los Ángeles, California, con un aforo de 5300 personas. Tras la apertura y con el rápido crecimiento de creyentes, comenzó la apertura de un instituto bíblico (Lighthouse of International Foursquare Evangelism) para capacitar pastores y el envío y nombramiento de ministros a varias regiones y países. En 1927 se fundó oficialmente la <em>Iglesia Internacional del Evangelio Cuadrangular</em>.
              </p>
              
              <div className="my-8 rounded-2xl overflow-hidden shadow-md">
                <OptimizedMedia src="/images/history/foursquare_expansion.png" alt="Expansión Global" className="w-full max-h-[400px] object-cover" />
              </div>

              <p>
                En 1948, The Foursquare Gospel Church of Canada (La Iglesia del Evangelio Cuadrangular de Canadá) fue fundada por Anna D. Britton en Vancouver.
              </p>

              <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-8 mb-4">Expansión Global</h3>
              <p>
                La iglesia creció inmensamente en todo el mundo. Solo en Estados Unidos y Canadá hay cerca de 1900 iglesias cuadrangulares. Al inicio del siglo XXI, la iglesia se ha diseminado, y se han organizado iglesias en una docena de países. Es pionera en la ordenación de mujeres al ministerio desde su fundación y en la labor misionera en todos los continentes.
              </p>
            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex justify-end">
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-6 py-2.5 bg-primary hover:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-all text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default About;
