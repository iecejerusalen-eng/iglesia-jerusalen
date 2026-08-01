import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import type { Speaker } from '../../types';
import { Link } from 'react-router-dom';
import { Users, ChevronRight, BookOpen } from 'lucide-react';
import { AnimeFadeUp, AnimeHoverCard, AnimeStaggerGrid } from '../../components/animations/AnimeWrappers';


export default function Expositores() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpeakers = async () => {
      try {
        const { data, error } = await supabase
          .from('speakers')
          .select('*, sermons(id)')
          .order('first_name');
        
        if (error) throw error;
        setSpeakers(data || []);
      } catch (error) {
        console.error('Error fetching speakers', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSpeakers();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/30">


      <main className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <AnimeFadeUp className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold font-serif mb-6 text-slate-900 dark:text-white">
              Nuestros <span className="text-primary dark:text-gold">Expositores</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Conoce al equipo pastoral y maestros que nos edifican cada semana a través de la predicación y enseñanza de la Palabra de Dios.
            </p>
          </AnimeFadeUp>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-slate-800 rounded-3xl h-[400px]"></div>
              ))}
            </div>
          ) : speakers.length === 0 ? (
            <div className="text-center py-20">
              <Users size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-xl font-medium text-slate-500 dark:text-slate-400">Aún no hay expositores registrados</h3>
            </div>
          ) : (
            <AnimeStaggerGrid>
              {speakers.map((speaker) => (
                <AnimeHoverCard key={speaker.id} className="h-full">
                  <div className="bg-white dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-glass flex flex-col h-full group relative z-10 transition-colors">
                    <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900">
                      {speaker.photo_url ? (
                        <img 
                          src={speaker.photo_url} 
                          alt={`${speaker.first_name} ${speaker.last_name}`}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users size={64} className="text-slate-300 dark:text-slate-700" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <span className="inline-block px-3 py-1 bg-primary/90 backdrop-blur-md text-white text-xs font-bold rounded-full mb-2 uppercase tracking-wide">
                          {speaker.role}
                        </span>
                        <h2 className="text-2xl font-bold text-white font-serif leading-tight">
                          {speaker.first_name} {speaker.last_name}
                        </h2>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      {speaker.bio ? (
                        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                          {speaker.bio}
                        </p>
                      ) : (
                        <p className="text-slate-400 dark:text-slate-600 text-sm italic mb-6 flex-1">
                          Sin biografía disponible.
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                          <BookOpen size={16} className="text-primary dark:text-gold" />
                          {/* @ts-expect-error type inference from join */}
                          <span>{speaker.sermons?.length || 0} mensajes</span>
                        </div>
                        <Link 
                          to={`/predicas?speaker=${speaker.id}`}
                          className="flex items-center gap-1 text-sm font-bold text-primary dark:text-gold group-hover:gap-2 transition-all"
                        >
                          Ver todas <ChevronRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </AnimeHoverCard>
              ))}
            </AnimeStaggerGrid>
          )}

        </div>
      </main>


    </div>
  );
}
