import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { Users, Award } from 'lucide-react';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeZoomIn } from '../../components/animations/AnimeWrappers';
import MagneticButton from '../../components/animations/MagneticButton';

const stripHtmlAndTruncate = (html: string, maxLength: number = 120) => {
  if (!html) return '';
  const plainText = html.replace(/<[^>]*>/g, '');
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength) + '...';
};

const MinistriesOverview = () => {
  const [ministries, setMinistries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMinistries = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('ministries')
          .select('*')
          .order('name');
        if (data && !error) {
          setMinistries(data);
        }
      } catch (err) {
        console.error('Error loading ministries:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMinistries();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-16">
      
      {/* HEADER HERO */}
      <div className="bg-gradient-to-r from-primary to-blue-900 rounded-2xl p-8 md:p-12 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
          <Users size={200} />
        </div>
        <AnimeZoomIn 
          className="relative z-10 max-w-3xl space-y-4"
        >
          <span className="bg-gold/20 text-gold border border-gold/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            Iglesia Activa
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mt-2">Nuestros Ministerios</h1>
          <p className="text-gray-200 text-base md:text-lg leading-relaxed font-light">
            Encuentra tu lugar de crecimiento, comunión y servicio. Hay un ministerio diseñado especialmente para ti y cada miembro de tu familia.
          </p>
        </AnimeZoomIn>
      </div>

      {/* LISTA DE MINISTERIOS (GRID) */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm font-medium">Cargando ministerios...</p>
        </div>
      ) : ministries.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-8">
          <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600" />
          <h3 className="font-serif font-bold text-xl text-primary dark:text-white mt-4">No se encontraron ministerios</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Pronto agregaremos más información sobre nuestras actividades.</p>
        </div>
      ) : (
        <AnimeStaggerGrid 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {ministries.map((min) => (
            <div key={min.id} className="h-full">
              <Link 
                to={`/ministerios/${min.slug}`}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group h-full"
              >
                <div>
                  {/* Banner de Imagen o Fallback */}
                  <div className="h-44 w-full relative overflow-hidden bg-primary flex-shrink-0">
                    {min.image_url ? (
                      <img 
                        src={min.image_url} 
                        alt={min.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center text-white/10">
                        <Users size={80} />
                      </div>
                    )}
                    <span className={`absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white ${
                      min.category === 'departamento' ? 'bg-gold/80 backdrop-blur-xs' : 'bg-accent-blue/80 backdrop-blur-xs'
                    }`}>
                      {min.category}
                    </span>
                  </div>

                  <div className="p-6 space-y-3">
                    <h3 className="font-serif font-bold text-xl text-gray-800 dark:text-gray-100 group-hover:text-accent-red transition-colors line-clamp-1">
                      {min.name}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed line-clamp-3">
                      {stripHtmlAndTruncate(min.description)}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-4 border-t border-gray-100 dark:border-slate-800 text-xs text-gray-400 dark:text-gray-500 space-y-2 font-medium bg-gray-50/50 dark:bg-slate-800/50">
                  <div className="flex justify-between items-center gap-4">
                    <span>Horarios:</span>
                    <span className="text-gray-700 dark:text-gray-200 font-bold truncate max-w-[70%]" title={min.schedule}>{min.schedule || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span>Responsable:</span>
                    <span className="text-gray-600 dark:text-gray-300 truncate max-w-[70%]" title={min.leader_name}>{min.leader_name || 'No especificado'}</span>
                  </div>
                  {min.anniversary_date && (
                    <div className="flex justify-between items-center gap-4">
                      <span>Aniversario:</span>
                      <span className="text-gray-700 dark:text-gray-200 font-bold flex items-center gap-1">
                        <span>🎂</span>
                        {(() => {
                          try {
                            const [year, month, day] = min.anniversary_date.split('-').map(Number);
                            const date = new Date(year, month - 1, day);
                            return date.toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long'
                            });
                          } catch (e) {
                            return min.anniversary_date;
                          }
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </AnimeStaggerGrid>
      )}

      {/* INVITACION A SERVIR */}
      <AnimeFadeUp>
        <section className="max-w-4xl mx-auto bg-base/50 dark:bg-slate-900/50 p-8 rounded-3xl border border-gray-200 dark:border-white/10 text-center space-y-6">
          <div className="w-12 h-12 bg-primary/10 dark:bg-blue-900/30 text-primary dark:text-blue-300 rounded-full flex items-center justify-center mx-auto">
            <Award size={24} />
          </div>
          <h3 className="font-serif font-bold text-2xl text-primary dark:text-white">¿Deseas Servir a Dios con tus Dones?</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-xl mx-auto">
            Dios nos ha llamado a ser administradores de los dones que nos ha dado. Si sientes el deseo de integrarte a algún ministerio como colaborador activo, acércate a los líderes correspondientes o contáctanos directamente.
          </p>
          <div className="pt-2">
            <MagneticButton>
              <Link 
                to="/contacto" 
                className="px-6 py-2.5 bg-primary dark:bg-blue-600 dark:hover:bg-blue-700 hover:bg-blue-900 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-xs inline-block"
              >
                Ponte en Contacto
              </Link>
            </MagneticButton>
          </div>
        </section>
      </AnimeFadeUp>

    </div>
  );
};

export default MinistriesOverview;
