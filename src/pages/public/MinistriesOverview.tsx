import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { Users, Award, LayoutGrid, List as ListIcon, Calendar, User as UserIcon } from 'lucide-react';
import { AnimeFadeUp, AnimeZoomIn } from '../../components/animations/AnimeWrappers';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Persist view mode preference
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('iglesia_ministries_view_mode');
    return (saved === 'list') ? 'list' : 'grid';
  });

  useEffect(() => {
    localStorage.setItem('iglesia_ministries_view_mode', viewMode);
  }, [viewMode]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-500 overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-0 left-[-10%] w-[50%] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[400px] rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 space-y-12 relative z-10">
        
        {/* HEADER HERO */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-14 border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center gap-10">
          
          <AnimeZoomIn className="flex-1 space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
              <Users size={16} />
              <span>Iglesia Activa</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Nuestros Ministerios
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto md:mx-0">
              Encuentra tu lugar de crecimiento, comunión y servicio. Hay un ministerio diseñado especialmente para ti y cada miembro de tu familia.
            </p>
          </AnimeZoomIn>

          <div className="hidden md:flex w-48 h-48 lg:w-64 lg:h-64 relative shrink-0">
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-20 dark:opacity-30"></div>
            <div className="absolute inset-4 bg-white dark:bg-slate-800 rounded-[2.5rem] rotate-12 border border-slate-100 dark:border-slate-700 shadow-xl flex items-center justify-center">
              <Users size={80} className="text-indigo-500 dark:text-indigo-400 opacity-80 -rotate-12" />
            </div>
          </div>
        </div>

        {/* CONTROLES / TOOLBAR */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/60 dark:border-white/10 shadow-sm">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Mostrando <span className="text-indigo-600 dark:text-indigo-400">{ministries.length}</span> ministerios
          </p>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg flex items-center justify-center transition-all duration-300 ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              aria-label="Vista de cuadrícula"
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg flex items-center justify-center transition-all duration-300 ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              aria-label="Vista de lista"
            >
              <ListIcon size={20} />
            </button>
          </div>
        </div>

        {/* LISTA DE MINISTERIOS */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm font-medium">Cargando ministerios...</p>
          </div>
        ) : ministries.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10 p-8">
            <Users size={48} className="mx-auto text-slate-300 dark:text-slate-600" />
            <h3 className="font-serif font-bold text-xl text-slate-800 dark:text-white mt-4">No se encontraron ministerios</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Pronto agregaremos más información sobre nuestras actividades.</p>
          </div>
        ) : (
          <motion.div 
            layout
            className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" 
              : "flex flex-col gap-6"
            }
          >
            <AnimatePresence>
              {ministries.map((min, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  key={min.id} 
                  className="h-full"
                >
                  <Link 
                    to={`/ministerios/${min.slug}`}
                    className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] border border-white/60 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300 group flex ${viewMode === 'grid' ? 'flex-col h-full' : 'flex-col sm:flex-row'}`}
                  >
                    {/* Banner de Imagen */}
                    <div className={`relative overflow-hidden shrink-0 ${viewMode === 'grid' ? 'h-52 w-full' : 'h-52 sm:h-auto sm:w-72'}`}>
                      {min.image_url ? (
                        <img loading="lazy" 
                          src={min.image_url} 
                          alt={min.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                          <Users size={64} />
                        </div>
                      )}
                      {/* Gradiente sutil inferior */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <span className={`absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full text-white shadow-sm ${
                        min.category === 'departamento' ? 'bg-amber-500/90 backdrop-blur-md' : 'bg-indigo-500/90 backdrop-blur-md'
                      }`}>
                        {min.category}
                      </span>
                    </div>

                    {/* Contenido */}
                    <div className={`flex flex-col flex-grow ${viewMode === 'list' ? 'justify-center p-8' : ''}`}>
                      <div className={`p-6 sm:p-8 space-y-3 ${viewMode === 'grid' ? 'flex-grow' : ''}`}>
                        <h3 className="font-serif font-black text-2xl text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {min.name}
                        </h3>
                        <p className={`text-slate-500 dark:text-slate-400 leading-relaxed font-medium ${viewMode === 'grid' ? 'text-sm line-clamp-3' : 'text-base line-clamp-2 md:line-clamp-3'}`}>
                          {stripHtmlAndTruncate(min.description, viewMode === 'list' ? 180 : 120)}
                        </p>
                      </div>

                      {/* Footer Infos */}
                      <div className={`px-6 sm:px-8 pb-6 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 ${viewMode === 'list' ? 'sm:bg-transparent sm:dark:bg-transparent sm:border-t-0 sm:pt-0' : ''}`}>
                        
                        <div className="flex items-center gap-2">
                          <UserIcon size={14} className="text-indigo-500 dark:text-indigo-400" />
                          <span className="truncate max-w-[150px]">{min.leader_name || 'No especificado'}</span>
                        </div>
                        
                        {min.schedule && (
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-amber-500" />
                            <span className="truncate max-w-[150px]">{min.schedule}</span>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* INVITACION A SERVIR */}
      <div className="mt-24 pb-20 relative max-w-4xl mx-auto text-center px-4">
        <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-600/10 blur-[100px] rounded-full -z-10"></div>
        <AnimeFadeUp className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] p-10 md:p-16 border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
          <Award size={48} className="mx-auto text-amber-500 mb-6 drop-shadow-md" />
          <h2 className="text-3xl md:text-4xl font-serif font-black text-slate-900 dark:text-white mb-6">
            ¡Te invitamos a servir!
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Tus dones y talentos son valiosos para el cuerpo de Cristo. Si deseas integrarte a alguno de estos ministerios, acércate al líder correspondiente o déjanos un mensaje.
          </p>
          <MagneticButton>
            <Link 
              to="/contacto"
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 inline-flex items-center gap-2"
            >
              Contactar a un líder
            </Link>
          </MagneticButton>
        </AnimeFadeUp>
      </div>

    </div>
  );
};

export default MinistriesOverview;
