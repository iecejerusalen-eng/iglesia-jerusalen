import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Sparkles, 
  Search, 
  BookOpen, 
  Layers, 
  FileText, 
  Calendar, 
  X, 
  ArrowRight, 
  Heart, 
  Building2, 
  Church, 
  GraduationCap 
} from 'lucide-react';
import { AnimeFadeUp, AnimeStaggerGrid } from '../../components/animations/AnimeWrappers';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EditorialSpace {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  accent_color: string;
  cover_image: string | null;
  is_published: boolean;
  document_count?: number;
}

interface EditorialDocument {
  id: string;
  space_id: string;
  title: string;
  excerpt: string;
  cover_image: string | null;
  published_at: string;
  editorial_spaces: {
    name: string;
    slug: string;
    accent_color: string;
  };
}

const CATEGORY_MAP: Record<string, { label: string; icon: React.ElementType }> = {
  'department': { label: 'Departamentos', icon: Building2 },
  'ministry': { label: 'Ministerios de Servicio', icon: Heart },
  'program': { label: 'Programas de Formación', icon: GraduationCap },
  'general': { label: 'General', icon: Church },
};

export default function PublicationsHub() {
  const [spaces, setSpaces] = useState<EditorialSpace[]>([]);
  const [recentArticles, setRecentArticles] = useState<EditorialDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch spaces with document count
      const { data: spacesData, error: spacesError } = await supabase
        .from('editorial_spaces')
        .select(`
          id, name, slug, description, category, accent_color, cover_image, is_published,
          editorial_documents(count)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (spacesError) throw spacesError;

      const formattedSpaces = (spacesData || []).map((space: any) => ({
        ...space,
        document_count: space.editorial_documents?.[0]?.count || 0
      }));

      // Fetch recent published documents
      const { data: docsData, error: docsError } = await supabase
        .from('editorial_documents')
        .select(`
          id, space_id, title, excerpt, cover_image, published_at,
          editorial_spaces!inner(name, slug, accent_color)
        `)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('published_at', { ascending: false })
        .limit(12);

      if (docsError) throw docsError;

      setSpaces(formattedSpaces);
      setRecentArticles((docsData as unknown) as EditorialDocument[]);
    } catch (error) {
      console.error('Error fetching publications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSpaces = useMemo(() => {
    return spaces.filter(space => {
      const matchesSearch = space.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           space.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || space.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [spaces, searchQuery, activeCategory]);

  const filteredArticles = useMemo(() => {
    if (!searchQuery) return recentArticles;
    return recentArticles.filter(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.editorial_spaces.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recentArticles, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030817] text-slate-900 dark:text-slate-100 font-sans pb-24">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        {/* Radial Gradient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-slate-50 to-slate-50 dark:from-indigo-900/20 dark:via-[#030817] dark:to-[#030817] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimeFadeUp>
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Centro Editorial & Bitácoras</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white">
                Publicaciones & Bitácoras de la Iglesia
              </h1>
              
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400">
                Reflexiones, devocionales, guías de estudio y comunicados oficiales de nuestros departamentos y ministerios.
              </p>
            </div>
          </AnimeFadeUp>

          {/* Search and Filters */}
          <AnimeFadeUp delay={0.1}>
            <div className="mt-10 max-w-3xl mx-auto">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar espacios, artículos, devocionales..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-11 pr-10 py-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm backdrop-blur-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === 'all'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Todos
                </button>
                {Object.entries(CATEGORY_MAP).map(([key, { label, icon: Icon }]) => (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeCategory === key
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </AnimeFadeUp>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* Spaces Grid */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Layers className="w-6 h-6 text-indigo-500" />
              Espacios Editoriales
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-slate-800/50 rounded-2xl h-64 border border-slate-200 dark:border-slate-700" />
              ))}
            </div>
          ) : filteredSpaces.length > 0 ? (
            <AnimeStaggerGrid>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSpaces.map((space) => {
                  const categoryInfo = CATEGORY_MAP[space.category] || CATEGORY_MAP['general'];
                  const CategoryIcon = categoryInfo.icon;
                  
                  return (
                    <Link 
                      key={space.id} 
                      to={`/publicaciones/${space.slug}`}
                      className="group relative flex flex-col bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Cover/Header */}
                      <div 
                        className="h-32 w-full relative overflow-hidden"
                        style={{ backgroundColor: space.accent_color || '#4f46e5' }}
                      >
                        {space.cover_image && (
                          <img 
                            src={space.cover_image} 
                            alt={space.name}
                            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md text-white text-xs font-medium border border-white/20">
                            <CategoryIcon className="w-3.5 h-3.5" />
                            {categoryInfo.label}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 text-white group-hover:bg-white group-hover:text-slate-900 transition-colors">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {space.name}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-6 flex-1">
                          {space.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            {space.document_count} artículos
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </AnimeStaggerGrid>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-800/20 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No se encontraron espacios</h3>
              <p className="text-slate-500 dark:text-slate-400">Intenta ajustar tus filtros o término de búsqueda.</p>
            </div>
          )}
        </section>

        {/* Recent Articles Feed */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Calendar className="w-6 h-6 text-indigo-500" />
              Últimas Publicaciones
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-slate-800/50 rounded-2xl h-80 border border-slate-200 dark:border-slate-700" />
              ))}
            </div>
          ) : filteredArticles.length > 0 ? (
            <AnimeStaggerGrid>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredArticles.map((article) => (
                  <Link 
                    key={article.id}
                    to={`/publicaciones/${article.editorial_spaces.slug}/${article.id}`}
                    className="group flex flex-col bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    <div className="aspect-[16/10] relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {article.cover_image ? (
                        <img 
                          src={article.cover_image} 
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center opacity-80"
                          style={{ backgroundColor: `${article.editorial_spaces.accent_color}20` }}
                        >
                          <BookOpen className="w-10 h-10 opacity-40" style={{ color: article.editorial_spaces.accent_color }} />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="mb-3">
                        <span 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          style={{ 
                            backgroundColor: `${article.editorial_spaces.accent_color}15`,
                            color: article.editorial_spaces.accent_color 
                          }}
                        >
                          {article.editorial_spaces.name}
                        </span>
                      </div>
                      
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      
                      {article.excerpt && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-4 flex-1">
                          {article.excerpt}
                        </p>
                      )}
                      
                      <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
                        <time dateTime={article.published_at}>
                          {format(new Date(article.published_at), "d 'de' MMMM, yyyy", { locale: es })}
                        </time>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </AnimeStaggerGrid>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-800/20 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No hay publicaciones recientes</h3>
              <p className="text-slate-500 dark:text-slate-400">Las publicaciones aparecerán aquí una vez que sean compartidas.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
