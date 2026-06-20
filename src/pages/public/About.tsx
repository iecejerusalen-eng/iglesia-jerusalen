import { useState, useEffect } from 'react';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeHoverCard, AnimeZoomIn } from '../../components/animations/AnimeWrappers';
import { Landmark, Compass, Sparkles, Cross, Flame, Droplet, Crown } from 'lucide-react';
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
                      <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none z-10">
                        <Landmark size={200} />
                      </div>
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
                  {content_blocks && content_blocks.length > 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-8 md:p-12 shadow-xs space-y-4 text-left">
                      <h2 className="text-3xl font-serif font-bold text-primary dark:text-white border-b border-gray-100 dark:border-white/5 pb-4">
                        {title || 'Nuestra Historia'}
                      </h2>
                      {subtitle && <p className="text-gray-500 dark:text-gray-400 text-sm">{subtitle}</p>}
                      <BlockRenderer blocks={content_blocks} />
                    </div>
                  ) : (
                    <AnimeFadeUp 
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-8 md:p-12 shadow-xs space-y-6 text-left"
                    >
                      <h2 className="text-3xl font-serif font-bold text-primary dark:text-white border-b border-gray-100 dark:border-white/10 pb-4">Nuestra Historia</h2>
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-7 space-y-4 text-gray-655 dark:text-gray-300 text-sm leading-relaxed">
                          <p>
                            La Iglesia del Evangelio Cuadrangular tiene sus raíces en el gran avivamiento del siglo XX, fundado oficialmente en **1922** en Los Ángeles, California, por la evangelista **Aimee Semple McPherson**. Aimee proclamó un mensaje centrado en las cuatro verdades del evangelio reveladas en las escrituras, sentando las bases doctrinales de un movimiento global.
                          </p>
                          <p>
                            Con el paso de las décadas, este dinámico movimiento misionero se extendió por toda América Latina, llegando a establecerse con fuerza en el Ecuador. Fue a través del esfuerzo abnegado de pastores y misioneros comprometidos que nació nuestra congregación local, la **Iglesia Jerusalén**, con el propósito de ser un pilar de paz, sanidad y restauración para las familias locales.
                          </p>
                          <p>
                            Hoy en día, la Iglesia Jerusalén continúa firme en esa visión fundacional, sirviendo activamente como un faro de luz comunitaria y espiritual para todo aquel que busca la presencia restauradora de Dios.
                          </p>
                        </div>
                        <div className="lg:col-span-5">
                          <OptimizedMedia 
                            src={pastoresAgrupadosImg} 
                            alt="Pastores Iglesia Jerusalén"
                            className="w-full h-72 object-cover rounded-2xl shadow-lg border border-gray-100 dark:border-white/5"
                          />
                        </div>
                      </div>
                    </AnimeFadeUp>
                  )}
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
