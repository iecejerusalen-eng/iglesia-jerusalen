import { useState, useEffect } from 'react';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeHoverCard, AnimeZoomIn } from '../../components/animations/AnimeWrappers';
import { Landmark, Compass, Sparkles, Cross, Flame, Droplet, Crown, BookOpen, Globe, Activity, Dove, MapPin } from 'lucide-react';
import { supabase } from '../../config/supabase';
import BlockRenderer from '../../components/public/BlockRenderer';
import { ImageGallerySection } from '../../components/public/ImageGallerySection';

import OptimizedMedia from '../../components/common/OptimizedMedia';

import pastorDavidImg from '../../assets/Jerusalén/Pastor David.png';
import pastoraCorinaImg from '../../assets/Jerusalén/Pastora Corina.png';
import pastoresAgrupadosImg from '../../assets/Jerusalén/Pastores.jpg';

const DEFAULT_ABOUT_SECTIONS = [
  { id: 'about_hero', section_type: 'custom', name: 'Héroe Principal', title: 'Quiénes Somos', subtitle: 'Conoce la historia, misión, principios de fe y las personas llamadas por Dios a guiar a la Iglesia del Evangelio Cuadrangular Jerusalén.', content_blocks: [] },
  { id: 'about_vision_mission', section_type: 'custom', name: 'Misión y Visión', title: 'Misión & Visión', subtitle: 'Nuestra guía en la expansión del evangelio.', content_blocks: [] },
  { id: 'about_history', section_type: 'custom', name: 'Nuestra Historia', title: 'Nuestra Historia', subtitle: 'La trayectoria y cimientos de la congregación.', content_blocks: [] },
  { id: 'about_pillars', section_type: 'system_about_pillars', name: 'Los 4 Pilares Cuadrangulares', title: 'Los 4 Pilares Cuadrangulares', subtitle: 'Fundamentados firmemente en el mensaje bíblico de la verdad eterna.' },
  { id: 'about_pastoral', section_type: 'custom', name: 'Liderazgo Pastoral', title: 'Liderazgo Pastoral', subtitle: 'Nuestros pastores principales llamados a guiar y cuidar espiritualmente a la congregación.', content_blocks: [] }
];

const About = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
                  className="relative rounded-2xl p-8 md:p-12 text-white shadow-lg overflow-hidden bg-primary min-h-[40vh] flex items-center"
                >
                  <div className="absolute inset-0 z-0">
                    {cover_image_url ? (
                      <img 
                        src={cover_image_url} 
                        alt="Portada" 
                        className="w-full h-full object-cover opacity-20"
                      />
                    ) : (
                      <img 
                        src="/images/about/hero.png" 
                        alt="Quiénes Somos" 
                        className="w-full h-full object-cover opacity-30 mix-blend-overlay"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent"></div>
                  </div>
                  <AnimeZoomIn 
                    className="relative z-10 max-w-3xl space-y-4 text-left"
                  >
                    <span className="bg-gold/20 text-gold border border-gold/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                      Nuestra Identidad
                    </span>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold mt-2">{title || 'Quiénes Somos'}</h1>
                    <p className="text-gray-200 text-base md:text-lg leading-relaxed font-light">
                      {subtitle || 'Conoce la historia, misión, principios de fe y las personas llamadas por Dios a guiar a la Iglesia del Evangelio Cuadrangular Jerusalén.'}
                    </p>
                    {content_blocks && content_blocks.length > 0 && (
                      <div className="pt-4 border-t border-white/10 mt-4">
                        <BlockRenderer blocks={content_blocks} />
                      </div>
                    )}
                  </AnimeZoomIn>
                </div>
              );
            }

            // 2. VISION & MISSION
            if (id === 'about_vision_mission') {
              return (
                <div key={id}>
                  {content_blocks && content_blocks.length > 0 ? (
                    <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs text-left">
                      {title && <h2 className="text-3xl font-serif font-bold text-primary dark:text-white mb-2">{title}</h2>}
                      {subtitle && <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{subtitle}</p>}
                      <BlockRenderer blocks={content_blocks} />
                    </div>
                  ) : (
                      <AnimeStaggerGrid 
                        className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch"
                      >
                        <AnimeHoverCard 
                          className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs flex flex-col justify-between text-left h-full"
                        >
                          <div className="space-y-4">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                              <Compass size={24} />
                            </div>
                            <h2 className="font-serif font-bold text-2xl text-primary dark:text-white">Nuestra Misión</h2>
                            <p className="text-gray-655 dark:text-gray-300 text-sm leading-relaxed">
                              Predicar el Evangelio de Nuestro Señor Jesucristo como Salvador, Bautizador con el Espíritu Santo, Sanador y Rey que viene pronto, formar discípulos llenos de santidad, amor fraternal y servicio.
                            </p>
                          </div>
                        </AnimeHoverCard>

                        <AnimeHoverCard 
                          className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs flex flex-col justify-between text-left h-full"
                        >
                          <div className="space-y-4">
                            <div className="w-12 h-12 bg-gold/10 dark:bg-gold/20 text-gold dark:text-yellow-400 rounded-xl flex items-center justify-center">
                              <Sparkles size={24} />
                            </div>
                            <h2 className="font-serif font-bold text-2xl text-primary dark:text-white">Nuestra Visión</h2>
                            <p className="text-gray-655 dark:text-gray-300 text-sm leading-relaxed">
                              Ser una iglesia que evangeliza y discípula en el Ecuador y el mundo, estableciendo comunidades cristianas saludables y multiplicadoras.
                            </p>
                          </div>
                        </AnimeHoverCard>
                      </AnimeStaggerGrid>
                  )}
                </div>
              );
            }

            // 3. HISTORY
            if (id === 'about_history') {
              return (
                <div key={id}>
                  {content_blocks && content_blocks.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-8 md:p-12 shadow-xs space-y-4 text-left mb-12">
                      <h2 className="text-3xl font-serif font-bold text-primary dark:text-white border-b border-gray-100 dark:border-white/5 pb-4">
                        {title || 'Nuestra Historia'}
                      </h2>
                      {subtitle && <p className="text-gray-500 dark:text-gray-400 text-sm">{subtitle}</p>}
                      <BlockRenderer blocks={content_blocks} />
                    </div>
                  )}
                  
                  <div className="space-y-16">
                    {/* Historia Denominacional - Paso a Paso */}
                    <div className="space-y-12">
                      <div className="text-center max-w-2xl mx-auto space-y-4">
                        <AnimeFadeUp>
                          <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary dark:text-white">
                            Historia de la Iglesia Cuadrangular
                          </h2>
                          <p className="text-gray-500 dark:text-gray-400 mt-4">
                            Un viaje de fe, pasión y misiones que comenzó en Los Ángeles y se extendió por todo el mundo hasta llegar a nuestra congregación.
                          </p>
                        </AnimeFadeUp>
                      </div>

                      <div className="relative border-l-2 border-primary/20 ml-4 md:ml-8 space-y-12 pb-8">
                        {/* Paso 1: Fundación */}
                        <AnimeFadeUp delay={100} className="relative pl-8 md:pl-12">
                          <div className="absolute -left-[17px] top-2 bg-white dark:bg-slate-900 rounded-full border-4 border-primary p-1">
                            <Cross className="w-5 h-5 text-primary" />
                          </div>
                          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-white/10 p-6 md:p-10 shadow-sm hover:shadow-lg transition-shadow duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                              <div className="space-y-4 text-left">
                                <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-semibold text-sm">1923 - Los Comienzos</span>
                                <h3 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-100">
                                  El Ministerio de Aimee Semple McPherson
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed">
                                  La <strong>Iglesia Internacional del Evangelio Cuadrangular</strong> fue fundada en 1923 por la evangelista Aimee Semple McPherson, una mujer adelantada a su tiempo. Con un ministerio marcado por compasión, sanidades milagrosas y una predicación ferviente, inauguró el histórico Templo del Ángelus en Los Ángeles, California. Constituida formalmente en 1927, la iglesia nació bajo el fuego del avivamiento pentecostal.
                                </p>
                              </div>
                              <div className="relative group overflow-hidden rounded-2xl shadow-md">
                                <OptimizedMedia 
                                  src="/images/history/aimee_mcpherson.png"
                                  alt="Aimee Semple McPherson"
                                  className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                  <p className="text-white text-sm">Hermana Aimee predicando el Evangelio Cuadrangular.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </AnimeFadeUp>

                        {/* Paso 2: La Doctrina */}
                        <AnimeFadeUp delay={200} className="relative pl-8 md:pl-12">
                          <div className="absolute -left-[17px] top-2 bg-white dark:bg-slate-900 rounded-full border-4 border-secondary p-1">
                            <BookOpen className="w-5 h-5 text-secondary" />
                          </div>
                          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-white/10 p-6 md:p-10 shadow-sm hover:shadow-lg transition-shadow duration-500">
                            <div className="space-y-4 text-left">
                              <span className="inline-block py-1 px-3 rounded-full bg-secondary/10 text-secondary font-semibold text-sm">La Doctrina Central</span>
                              <h3 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-100">
                                Jesucristo: El Mismo Ayer, Hoy y por los Siglos
                              </h3>
                              <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed">
                                El corazón de nuestra denominación es la visión que Dios le dio a nuestra fundadora, basada en Hebreos 13:8 y el libro de Ezequiel. Este marco teológico 100% cristocéntrico declara que Jesucristo cumple cuatro roles inmutables para la humanidad:
                              </p>
                              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-gray-700 dark:text-gray-300">
                                <li className="flex items-start space-x-3 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                                  <Cross className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                  <span><strong>Jesucristo, el Salvador:</strong> Murió en la cruz por nuestros pecados, perdonando y transformando vidas.</span>
                                </li>
                                <li className="flex items-start space-x-3 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                                  <Dove className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                  <span><strong>Jesucristo, el Bautizador:</strong> Llena a los creyentes con el Espíritu Santo para darles poder y servir.</span>
                                </li>
                                <li className="flex items-start space-x-3 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                                  <Activity className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                  <span><strong>Jesucristo, el Sanador:</strong> Su sacrificio también nos proveyó sanidad física, emocional y espiritual.</span>
                                </li>
                                <li className="flex items-start space-x-3 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                                  <Crown className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                                  <span><strong>Jesucristo, el Rey que Viene:</strong> La gloriosa promesa de Su inminente regreso para buscar a su Iglesia.</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </AnimeFadeUp>

                        {/* Paso 3: Expansión y Ecuador */}
                        <AnimeFadeUp delay={300} className="relative pl-8 md:pl-12">
                          <div className="absolute -left-[17px] top-2 bg-white dark:bg-slate-900 rounded-full border-4 border-primary p-1">
                            <Globe className="w-5 h-5 text-primary" />
                          </div>
                          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-white/10 p-6 md:p-10 shadow-sm hover:shadow-lg transition-shadow duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                              <div className="space-y-4 text-left order-2 lg:order-1">
                                <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-semibold text-sm">1956 - Misiones Globales</span>
                                <h3 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-100">
                                  Expansión Global y Llegada al Ecuador
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed">
                                  La gran pasión de Aimee Semple McPherson no se limitó a Estados Unidos. Rápidamente, la Iglesia Cuadrangular se convirtió en una poderosa fuerza misionera global, estableciendo obras en cada continente con un fuerte énfasis en el evangelismo y la labor social.
                                </p>
                                <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed">
                                  En <strong>1956</strong>, este mensaje salvador llegó a <strong>Ecuador</strong> gracias a valientes misioneros pioneros. A través de la fe, el sacrificio y la dedicación incansable, comenzaron a establecer las primeras congregaciones en el país. Con el pasar de las décadas, la iglesia en Ecuador ha crecido enormemente, formando una gran familia de iglesias unidas que continúan llevando la esperanza de Jesús a cada ciudad y provincia.
                                </p>
                              </div>
                              <div className="relative group overflow-hidden rounded-2xl shadow-md order-1 lg:order-2">
                                <OptimizedMedia 
                                  src="/images/history/foursquare_expansion.png"
                                  alt="Expansión Global Cuadrangular"
                                  className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                  <p className="text-white text-sm">Un mensaje de fe que cruzó fronteras.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </AnimeFadeUp>
                      </div>
                    </div>

                    {/* Historia Local */}
                    <AnimeFadeUp delay={400} className="bg-primary text-white rounded-[2.5rem] p-8 md:p-14 shadow-2xl space-y-8 text-left relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-1000 ease-out">
                        <Landmark size={240} />
                      </div>
                      <div className="relative z-10 space-y-8">
                        <div className="inline-flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full text-white font-medium text-sm backdrop-blur-sm">
                          <MapPin className="w-4 h-4" />
                          <span>Nuestra Congregación</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold">
                          Historia de la Iglesia "Jerusalén"
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                          <div className="lg:col-span-6 space-y-6 text-white/90 text-base md:text-lg leading-relaxed">
                            <p>
                              Siguiendo el espíritu fundacional y misionero que caracteriza a nuestra denominación, nació la <strong>Iglesia Jerusalén</strong> en nuestra amada ciudad. Fundada en la fe y bajo los mismos principios cuadrangulares, fue establecida para ser un refugio de paz, sanidad y restauración.
                            </p>
                            <p>
                              A lo largo de los años, con la guía incondicional del Espíritu Santo y el esfuerzo perseverante de nuestros pastores y líderes, la Iglesia Jerusalén ha florecido. Nos hemos convertido en un centro de discipulado profundo, donde el servicio constante y el amor fraternal son nuestra mejor carta de presentación.
                            </p>
                            <p className="font-medium text-white">
                              Hoy, continuamos firmes y arraigados en el amor de Dios. Con la mirada siempre puesta en expandir el reino, formamos nuevas generaciones que viven los cuatro pilares del Evangelio Cuadrangular cada día.
                            </p>
                          </div>
                          <div className="lg:col-span-6">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/20 transform group-hover:-translate-y-2 transition-transform duration-500 ease-out">
                              <OptimizedMedia 
                                src={pastoresAgrupadosImg} 
                                alt="Pastores Iglesia Jerusalén"
                                className="w-full h-80 md:h-96 object-cover object-top hover:scale-105 transition-transform duration-700"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1e3f]/80 to-transparent flex items-end p-6">
                                <p className="text-white font-serif font-medium text-lg">Nuestros pastores y líderes guiando la congregación hacia el propósito de Dios.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AnimeFadeUp>
                  </div>
                </div>
              );
            }

            // 5. PASTORAL / LIDERAZGO
            if (id === 'about_pastoral') {
              return (
                <div key={id}>
                  {content_blocks && content_blocks.length > 0 ? (
                    <section className="space-y-8 animate-fadeIn text-left">
                      <div className="text-center max-w-xl mx-auto space-y-2">
                        <h2 className="text-3xl font-serif font-bold text-primary dark:text-white font-serif">
                          {title || 'Liderazgo Pastoral'}
                        </h2>
                        {subtitle && <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">{subtitle}</p>}
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-white/10 p-8 md:p-12 shadow-xs">
                        <BlockRenderer blocks={content_blocks} />
                      </div>
                    </section>
                  ) : (
                    <section className="space-y-8 text-left">
                      <AnimeFadeUp 
                        className="text-center max-w-xl mx-auto space-y-2"
                      >
                        <h2 className="text-3xl font-serif font-bold text-primary dark:text-white">Liderazgo Pastoral</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
                          Nuestros pastores principales llamados a guiar y cuidar espiritualmente a la congregación.
                        </p>
                      </AnimeFadeUp>

                      <AnimeStaggerGrid 
                        className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
                      >
                        <AnimeHoverCard 
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row h-full"
                        >
                          <div className="w-full sm:w-44 h-56 bg-gray-50 dark:bg-slate-950 flex-shrink-0">
                            <OptimizedMedia 
                              src={pastorDavidImg} 
                              alt="Pastor David Nicola"
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <div className="p-6 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-gold uppercase tracking-wider block mb-1">Pastor Principal</span>
                              <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-gray-100">Pastor David Daniel Nicola Olvera</h3>
                              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed mt-3">
                                Guiando a la congregación con pasión por la Palabra de Dios y un corazón dedicado a la enseñanza y el cuidado espiritual de las familias.
                              </p>
                            </div>
                          </div>
                        </AnimeHoverCard>

                        <AnimeHoverCard 
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row h-full"
                        >
                          <div className="w-full sm:w-44 h-56 bg-gray-50 dark:bg-slate-950 flex-shrink-0">
                            <OptimizedMedia 
                              src={pastoraCorinaImg} 
                              alt="Pastora Corina Miranda"
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <div className="p-6 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-gold uppercase tracking-wider block mb-1">Pastora</span>
                              <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-gray-100">Pastora Bertha Corina Miranda Sánchez</h3>
                              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed mt-3">
                                Dedicada a la consejería pastoral, la restauración familiar y el fortalecimiento de los ministerios internos de la iglesia.
                              </p>
                            </div>
                          </div>
                        </AnimeHoverCard>
                      </AnimeStaggerGrid>
                    </section>
                  )}
                </div>
              );
            }

            // OTHER GENERIC CUSTOM SECTIONS (added by user)
            return (
              <section key={id} className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 animate-fadeIn text-left">
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
              <section key={id} className="space-y-8 text-left">
                <AnimeFadeUp 
                  className="text-center max-w-xl mx-auto space-y-2"
                >
                  <h2 className="text-3xl font-serif font-bold text-primary dark:text-white">{title || 'Los 4 Pilares Cuadrangulares'}</h2>
                  {subtitle && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">{subtitle}</p>
                  )}
                </AnimeFadeUp>

                <AnimeStaggerGrid 
                  className="grid grid-cols-2 lg:grid-cols-4 gap-6"
                >
                  <AnimeHoverCard 
                    className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full"
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center font-bold">
                        <Cross size={24} className="text-red-600" />
                      </div>
                      <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-gray-100">Jesucristo, el Salvador</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                        Representado por el <strong>rostro de hombre</strong>. Él pagó el precio de nuestros pecados en la cruz y nos trajo redención eterna.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-6 block">Juan 3:16</span>
                  </AnimeHoverCard>

                  <AnimeHoverCard 
                    className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full"
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 rounded-xl flex items-center justify-center font-bold">
                        <Flame size={24} className="text-yellow-500" />
                      </div>
                      <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-gray-100">Jesucristo, el Bautizador</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                        Representado por el <strong>rostro de león</strong>. Él nos llena de poder y fuego con el Espíritu Santo para el servicio.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider mt-6 block">Hechos 1:8</span>
                  </AnimeHoverCard>

                  <AnimeHoverCard 
                    className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full"
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold">
                        <Droplet size={24} className="text-blue-600" />
                      </div>
                      <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-gray-100">Jesucristo, el Sanador</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                        Representado por el <strong>rostro de buey</strong>. Él llevó nuestras enfermedades y nos provee sanidad en cuerpo, alma y espíritu.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-6 block">Marcos 16:18</span>
                  </AnimeHoverCard>

                  <AnimeHoverCard 
                    className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-white/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full"
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center font-bold">
                        <Crown size={24} className="text-purple-600" />
                      </div>
                      <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-gray-100">Jesucristo, el Rey que Viene</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                        Representado por el <strong>rostro de águila</strong>. Nuestra esperanza gloriosa de que Él regresará con majestad por su pueblo.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mt-6 block">1 Tesalonicenses 4:16</span>
                  </AnimeHoverCard>
                </AnimeStaggerGrid>
              </section>
            );

          case 'system_gallery':
            // GALERIA DE DIAPOSITIVAS TAMBIÉN DISPONIBLE EN NOSOTROS
            return (
              <ImageGallerySection 
                key={id}
                title={title || ''}
                subtitle={subtitle || ''}
                slides={content_blocks || []}
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
};

export default About;
