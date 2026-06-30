import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Gamepad2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { Helmet } from 'react-helmet-async';

interface Game {
  id: string;
  title: string;
  description: string;
  image_url: string;
  slug: string;
  is_active: boolean;
}

export const GamesHub = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (err) {
      console.error('Error fetching games:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Juegos Bíblicos | Iglesia Jerusalén</title>
        <meta name="description" content="Aprende la palabra de Dios mientras te diviertes con nuestros juegos bíblicos." />
      </Helmet>
      
      <div className="pt-24 pb-16 min-h-[80vh]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          
          <motion.div 
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-6">
              <Gamepad2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-6">
              Juegos Bíblicos
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Diviértete y desafía tus conocimientos sobre la Biblia. ¡Aprende jugando!
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {games.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <p>Próximamente agregaremos juegos nuevos. ¡Mantente atento!</p>
                </div>
              ) : (
                games.map((game) => (
                  <motion.div 
                    key={game.id} 
                    variants={fadeInUp}
                    className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 flex flex-col h-full"
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={game.image_url || 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=800&auto=format&fit=crop'} 
                        alt={game.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-2xl font-bold text-white mb-2">{game.title}</h3>
                      </div>
                    </div>
                    
                    <div className="p-6 flex flex-col flex-grow">
                      <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
                        {game.description}
                      </p>
                      
                      <Link 
                        to={`/recursos/juegos/${game.slug}`}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-center transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-indigo-500/30"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        Jugar Ahora
                      </Link>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};
