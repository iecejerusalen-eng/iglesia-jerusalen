import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { AnimeFadeUp, AnimeFlipIn } from '../../components/animations/AnimeWrappers';
import { GraduationCap, BookOpen, ArrowRight } from 'lucide-react';
import type { Program } from '../../types';

const ProgramsOverview = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      const { data } = await supabase.from('programs').select('*').order('created_at', { ascending: false });
      if (data) setPrograms(data);
      setLoading(false);
    };
    fetchPrograms();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 to-white dark:from-slate-950 dark:to-slate-950 transition-colors duration-200">
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <AnimeFadeUp delay={0} duration={600}>
            <GraduationCap size={48} className="mx-auto mb-4 opacity-80" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3">Programas de Estudio</h1>
            <p className="text-indigo-200 text-lg max-w-xl mx-auto">Planes de lectura y estudios bíblicos para crecer en la fe</p>
          </AnimeFadeUp>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <BookOpen size={56} className="mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">No hay programas disponibles</p>
            <p className="text-sm">Pronto se publicarán nuevos estudios</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <AnimeFlipIn key={program.id} delay={0} duration={800} axis="Y">
                <Link to={`/programas/${program.id}`} className="block group">
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-lg transition-all h-full">
                    {/* Cover Image */}
                    {program.cover_image ? (
                      <img src={program.cover_image} alt={program.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-950 dark:to-indigo-900/50 flex items-center justify-center">
                        <BookOpen size={48} className="text-indigo-300 dark:text-indigo-700" />
                      </div>
                    )}

                    <div className="p-5">
                      <h3 className="font-serif font-bold text-lg text-gray-800 dark:text-gray-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-450 transition-colors line-clamp-2">{program.title}</h3>
                      {program.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-3">{program.description}</p>
                      )}
                      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-sm font-semibold mt-4 group-hover:gap-2 transition-all">
                        Ver programa <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              </AnimeFlipIn>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramsOverview;
