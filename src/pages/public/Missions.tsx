import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../config/supabase';
import type { Mission } from '../../types';
import { Globe as GlobeIcon, Heart, Target, Users, MapPin, Globe2, Church, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeHoverCard } from '../../components/animations/AnimeWrappers';
import { Globe } from '@/components/ui/globe';
import { type COBEOptions } from 'cobe';

// ── Static mission locations for the globe ────────────────────────────────────
const GLOBE_MISSION_POINTS = [
  { lat: -0.1807,  lng: -78.4678, size: 0.07, label: 'Ecuador' },
  { lat:  4.7110,  lng: -74.0721, size: 0.05, label: 'Colombia' },
  { lat: -12.0464, lng: -77.0428, size: 0.04, label: 'Perú' },
  { lat: 25.7617,  lng: -80.1918, size: 0.04, label: 'EEUU' },
  { lat: 40.4168,  lng:  -3.7038, size: 0.04, label: 'España' },
  { lat: -33.4489, lng: -70.6693, size: 0.04, label: 'Chile' },
  { lat: 19.4326,  lng: -99.1332, size: 0.04, label: 'México' },
  { lat: -34.6037, lng: -58.3816, size: 0.03, label: 'Argentina' },
];

const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 1.2,
  theta: 0.18,
  dark: 0,
  diffuse: 0.5,
  mapSamples: 16000,
  mapBrightness: 1.4,
  baseColor: [0.97, 0.97, 0.99],
  markerColor: [220 / 255, 38 / 255, 38 / 255],
  glowColor: [0.96, 0.93, 0.88],
  markers: GLOBE_MISSION_POINTS.map((p) => ({
    location: [p.lat, p.lng] as [number, number],
    size: p.size,
  })),
};

export default function Missions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMissions = async () => {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMissions(data || []);
    } catch (err) {
      console.error('Error loading missions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.resolve().then(() => {
      loadMissions();
    });
  }, []);

  const activeMissions = missions.filter(m => m.status === 'active');
  const completedMissions = missions.filter(m => m.status === 'completed');

  return (
    <>
      <Helmet>
        <title>Misiones | Iglesia Jerusalén</title>
        <meta name="description" content="Conoce nuestros proyectos misioneros y cómo estamos impactando al mundo con el mensaje del Evangelio." />
      </Helmet>

      <div className="bg-surface dark:bg-slate-950 min-h-screen pb-20">
        
        {/* Hero Section — Interactive Globe */}
        <section className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-rose-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

          {/* Globe — decorative background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <div className="relative w-[min(95vw,680px)] aspect-square opacity-90 dark:opacity-60">
              <Globe config={GLOBE_CONFIG} />
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white dark:from-slate-950 to-transparent pointer-events-none" />

          {/* Hero text */}
          <div className="relative z-10 text-center px-4 pt-16 pb-6 max-w-3xl">
            <AnimeFadeUp>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-sm mb-6 uppercase tracking-widest border border-rose-500/20 backdrop-blur-md">
                <Globe2 className="w-4 h-4" /> Misiones Globales
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-slate-900 dark:text-white mb-6">
                Llevando Luz a<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">
                  Todas las Naciones
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                La iglesia no es un edificio, es un movimiento. Descubre nuestros proyectos activos y únete a la visión de transformar vidas a través del amor y el evangelio.
              </p>
            </AnimeFadeUp>
          </div>

          {/* Stats */}
          <AnimeFadeUp delay={0.25} className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 max-w-3xl w-full mt-4">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl px-4 py-4 text-center border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
              <Target className="w-5 h-5 mx-auto mb-2 text-rose-600" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeMissions.length || '—'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Proyectos activos</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl px-4 py-4 text-center border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
              <Globe2 className="w-5 h-5 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{GLOBE_MISSION_POINTS.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Países alcanzados</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl px-4 py-4 text-center border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
              <Church className="w-5 h-5 mx-auto mb-2 text-amber-600" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">11</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Iglesias plantadas</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl px-4 py-4 text-center border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
              <Users className="w-5 h-5 mx-auto mb-2 text-emerald-600" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">1,180+</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Miembros globales</p>
            </div>
          </AnimeFadeUp>
        </section>

        {/* Proyectos Activos */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-4">
              Proyectos Activos
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
              Conoce las iniciativas actuales que estamos apoyando. Tu donación hace la diferencia directamente en el campo misionero.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
            </div>
          ) : activeMissions.length > 0 ? (
            <AnimeStaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeMissions.map((mission) => {
                const goal = Number(mission.goal_amount) || 0;
                const current = Number(mission.current_amount) || 0;
                const percent = goal > 0 ? Math.min(Math.round((current / goal) * 100), 100) : 0;

                return (
                  <AnimeHoverCard key={mission.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
                    <div className="relative h-56 overflow-hidden">
                      <img 
                        src={mission.image_url || 'https://images.unsplash.com/photo-1593113580436-1eaf23ce1b9c?auto=format&fit=crop&w=800&q=80'} 
                        alt={mission.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                        <div className="flex items-center gap-1.5 text-xs font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          {mission.location || 'Internacional'}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
                        {mission.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 line-clamp-3">
                        {mission.description}
                      </p>

                      {goal > 0 && (
                        <div className="mt-auto bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex justify-between items-end mb-2">
                            <div>
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Recaudado</div>
                              <div className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                                ${current.toLocaleString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Meta</div>
                              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-none">
                                ${goal.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-rose-400 to-rose-600 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          <Link 
                            to={`/donations?mission=${mission.id}`}
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mt-4"
                          >
                            <Heart className="w-4 h-4" /> Donar a este proyecto
                          </Link>
                        </div>
                      )}
                      
                      {goal === 0 && (
                         <Link 
                           to={`/donations?mission=${mission.id}`}
                           className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mt-auto"
                         >
                           <Heart className="w-4 h-4" /> Apoyar Misión
                         </Link>
                      )}
                    </div>
                  </AnimeHoverCard>
                );
              })}
            </AnimeStaggerGrid>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
              <GlobeIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hay proyectos activos</h3>
              <p className="text-slate-500">Actualmente no tenemos proyectos misioneros en curso, pero puedes apoyar el fondo general de misiones.</p>
              <Link to="/donations" className="inline-block mt-6 px-6 py-2 bg-rose-500 text-white rounded-full font-bold hover:bg-rose-600 transition-colors">
                Donar al fondo general
              </Link>
            </div>
          )}
        </section>

        {/* Proyectos Completados */}
        {completedMissions.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-16">
            <div className="mb-10 flex items-center gap-4">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white">
                Misiones Cumplidas
              </h2>
              <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {completedMissions.map((mission) => (
                <div key={mission.id} className="bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex items-center p-3 gap-4 hover:border-amber-500/30 transition-colors">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative">
                    <img src={mission.image_url || ''} alt={mission.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">LOGRADO</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug mb-1">{mission.title}</h4>
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <MapPin className="w-3 h-3" /> {mission.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA Apoyo */}
        <section className="bg-gradient-to-br from-rose-600 via-rose-700 to-amber-600 dark:from-rose-900 dark:via-rose-900 dark:to-amber-900 py-20 px-4 mx-4 mb-10 rounded-3xl">
          <div className="max-w-3xl mx-auto text-center">
            <Heart className="w-10 h-10 text-rose-200 mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
              ¿Quieres apoyar las misiones?
            </h2>
            <p className="text-rose-100 text-lg mb-8 max-w-xl mx-auto">
              Con tu ofrenda y oración, más familias en el mundo pueden escuchar el Evangelio
              y ser parte de la familia de Dios.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/donations"
                className="inline-flex items-center gap-2 bg-white text-rose-700 font-bold px-7 py-3.5 rounded-xl hover:bg-rose-50 transition-colors shadow-lg"
              >
                <Heart className="w-4 h-4" />
                Apoyar con una ofrenda
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/peticiones"
                className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white font-bold px-7 py-3.5 rounded-xl hover:bg-white/25 transition-colors"
              >
                Enviar petición de oración
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
