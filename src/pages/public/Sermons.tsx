import { useState, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { supabase } from '../../config/supabase';
import type { Sermon } from '../../types';
import { Calendar, User, Video, RefreshCw, ArrowRight, Edit3, ChevronDown, Check, Filter, LayoutGrid, List, AlignJustify, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeHoverCard } from '../../components/animations/AnimeWrappers';
import type { SermonCategory, Speaker } from '../../types';
import {
  Autocomplete,
  AutocompleteInput,
  AutocompletePopup,
  AutocompleteList,
  AutocompleteItem,
  AutocompleteEmpty,
  AutocompleteGroup,
  type AutocompleteItemType,
} from '@/components/ui/autocomplete';
import VideoPlayer from '@/components/ui/video-player';

const MOCK_SERMONS: Sermon[] = [
  {
    id: 's-1',
    title: 'El Ancla de Nuestra Alma',
    content: '<p>Una reflexión profunda en <strong>Hebreos 6</strong> sobre cómo la esperanza en Cristo nos mantiene firmes en medio de las tormentas de la vida diaria.</p><p>El autor de Hebreos nos recuerda que la esperanza es un ancla del alma, segura y firme, que penetra hasta detrás del velo. Cuando las circunstancias externas se agiten, recuerda fijar tus ojos en el Salvador, quien ya venció al mundo y nos garantiza una herencia incorruptible.</p>',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    pastor_name: 'Pastor Roberto Gómez',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
  },
  {
    id: 's-2',
    title: 'Caminando en Amor y Unidad',
    content: '<p>Serie de enseñanzas sobre <strong>Efesios</strong> y cómo la unidad y el amor fraternal fortalecen a la iglesia local como cuerpo de Cristo.</p><p>Pablo nos exhorta a andar como es digno de la vocación con que fuimos llamados, con toda humildad y mansedumbre, soportándonos con paciencia los unos a los unos en amor, solícitos en guardar la unidad del Espíritu en el vínculo de la paz.</p>',
    youtube_url: null,
    pastor_name: 'Pastora Elizabeth de Gómez',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
  }
];

const Sermons = () => {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Categorias y Pastores para los filtros
  const [categories, setCategories] = useState<SermonCategory[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  
  // Filtros seleccionados
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('');
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [isPastorsOpen, setIsPastorsOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  type SortOption = 'newest' | 'oldest' | 'az' | 'za';
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Vista actual (Grid, List, Compact)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>(() => {
    const saved = localStorage.getItem('sermons_view_mode');
    return (saved as 'grid' | 'list' | 'compact') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('sermons_view_mode', viewMode);
  }, [viewMode]);
  const fetchSermons = async () => {
    setSermons(prev => {
      if (prev.length === 0) setLoading(true);
      return prev;
    });
    try {
      const { data, error } = await supabase
        .from('sermons')
        .select('*, sermon_categories(*), speakers(*)')
        .order('date', { ascending: false });

      // Cargar también categorías y oradores para los filtros
      const [catsRes, speakersRes] = await Promise.all([
        supabase.from('sermon_categories').select('*').order('name'),
        supabase.from('speakers').select('*').order('first_name')
      ]);
      if (catsRes.data) setCategories(catsRes.data);
      if (speakersRes.data) setSpeakers(speakersRes.data);

      if (error) throw error;

      if (data && data.length > 0) {
        setSermons(data);
      } else {
        setSermons(MOCK_SERMONS);
      }
    } catch (err) {
      console.error('Error fetching sermons from Supabase, using mock fallback:', err);
      setSermons(prev => prev.length > 0 ? prev : MOCK_SERMONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSermons();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const autocompleteItems: AutocompleteItemType[] = useMemo(() => {
    return sermons.map((sermon) => ({
      value: sermon.id,
      label: sermon.title,
      category: "Prédicas y Devocionales",
      description: `${sermon.pastor_name || "Pastor"} • ${
        sermon.created_at
          ? new Date(sermon.created_at).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : ""
      }`,
      icon: <Video className="w-4 h-4 text-blue-400" />,
    }));
  }, [sermons]);

  const filteredSermons = useMemo(() => {
    const result = sermons.filter(s => {
      const matchesSearch = 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.pastor_name.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesCategory = selectedCategory ? s.category_id === selectedCategory : true;
      const matchesSpeaker = selectedSpeaker ? s.speaker_id === selectedSpeaker || s.pastor_name === selectedSpeaker : true;
      
      return matchesSearch && matchesCategory && matchesSpeaker;
    });

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'az') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'za') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

    return result;
  }, [sermons, searchQuery, selectedCategory, selectedSpeaker, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      <AnimeFadeUp delay={100} duration={800}>
        
      {/* HEADER HERO */}
      <div id="sermons_hero" className="relative bg-slate-900 rounded-[2.5rem] p-8 md:p-16 mb-12 shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden group border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-slate-900 to-slate-950"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] group-hover:bg-blue-500/30 transition-colors duration-1000"></div>
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-[3s] ease-out">
          <Video size={320} />
        </div>
        
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-gold shadow-inner">
            <Video size={14} className="mr-1" /> Enseñanzas & Mensajes
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-extrabold text-white tracking-tight leading-tight drop-shadow-lg">
            Prédicas y Devocionales
          </h1>
          <p className="text-slate-300 text-base md:text-xl leading-relaxed font-light max-w-2xl">
            Repasa las prédicas dominicales, series doctrinales y mensajes de edificación compartidos por nuestros pastores y líderes invitados.
          </p>
        </div>
      </div>

      {/* PANEL DE CONTROL: Buscador y Filtros */}
      <div id="sermons_latest" className="relative z-50 w-full mb-12 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] p-6 border border-gray-200/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex flex-col gap-6">
        
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          {/* Buscador inteligente con Autocomplete */}
          <div className="w-full lg:w-[28rem] shrink-0 relative z-30">
            <Autocomplete
              items={autocompleteItems}
              value={searchQuery}
              onValueChange={(val) => setSearchQuery(val)}
              onSelect={(item) => setSearchQuery(item.label)}
            >
              <AutocompleteInput
                placeholder="Buscar por título, contenido..."
                showClear
                showTrigger
                size="default"
              />
              <AutocompletePopup>
                <AutocompleteEmpty>No se encontraron prédicas con esa búsqueda.</AutocompleteEmpty>
                <AutocompleteList>
                  <AutocompleteGroup label="Prédicas Sugeridas">
                    {autocompleteItems.map((item) => (
                      <AutocompleteItem key={item.value} value={item}>
                        {item.label}
                      </AutocompleteItem>
                    ))}
                  </AutocompleteGroup>
                </AutocompleteList>
              </AutocompletePopup>
            </Autocomplete>
          </div>
          
          {/* Filtros Izquierda */}
          <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto relative z-20">
            <button 
              onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between gap-3 focus:outline-none shadow-sm hover:shadow-md transition-all ${isCategoriesExpanded ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
            >
              <span className="flex items-center gap-2"><Filter size={16} /> Categorías</span>
              <motion.div animate={{ rotate: isCategoriesExpanded ? 180 : 0 }}>
                <ChevronDown size={16} className={isCategoriesExpanded ? 'text-white' : 'text-gray-400'} />
              </motion.div>
            </button>

            {/* Custom Dropdown para Pastores */}
            <div className="relative w-full sm:w-64 z-50">
              <button 
                onClick={() => setIsPastorsOpen(!isPastorsOpen)}
                className="w-full px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold flex items-center justify-between gap-3 focus:outline-none shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-all text-gray-700 dark:text-gray-200"
              >
                <span className="flex items-center gap-2 truncate">
                  <User size={16} className="text-primary/70 dark:text-gold shrink-0" /> 
                  {selectedSpeaker ? (speakers.find(s => s.id === selectedSpeaker)?.first_name + ' ' + speakers.find(s => s.id === selectedSpeaker)?.last_name) : "Todos los Pastores"}
                </span>
                <ChevronDown size={16} className="text-gray-400 shrink-0" />
              </button>
              
              <AnimatePresence>
                {isPastorsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 w-full mt-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl border border-gray-100 dark:border-white/10 shadow-2xl py-1 max-h-60 overflow-y-auto"
                  >
                    <button 
                      onClick={() => { setSelectedSpeaker(''); setIsPastorsOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${!selectedSpeaker ? 'text-primary dark:text-gold font-bold' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                      Todos los Pastores
                      {!selectedSpeaker && <Check size={16} />}
                    </button>
                    {speakers.map(s => (
                      <button 
                        key={s.id}
                        onClick={() => { setSelectedSpeaker(s.id); setIsPastorsOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${selectedSpeaker === s.id ? 'text-primary dark:text-gold font-bold' : 'text-gray-600 dark:text-gray-300'}`}
                      >
                        {s.first_name} {s.last_name}
                        {selectedSpeaker === s.id && <Check size={16} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Custom Dropdown para Ordenar */}
            <div className="relative w-full sm:w-56 z-50">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="w-full px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold flex items-center justify-between gap-3 focus:outline-none shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-all text-gray-700 dark:text-gray-200"
              >
                <span className="flex items-center gap-2 truncate">
                  <ArrowUpDown size={16} className="text-primary/70 dark:text-gold shrink-0" /> 
                  {sortBy === 'newest' ? 'Más recientes' : sortBy === 'oldest' ? 'Más antiguos' : sortBy === 'az' ? 'A - Z' : 'Z - A'}
                </span>
                <ChevronDown size={16} className="text-gray-400 shrink-0" />
              </button>
              
              <AnimatePresence>
                {isSortOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 w-full mt-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl border border-gray-100 dark:border-white/10 shadow-2xl py-1 overflow-hidden z-50"
                  >
                    {[
                      { id: 'newest', label: 'Más recientes' },
                      { id: 'oldest', label: 'Más antiguos' },
                      { id: 'az', label: 'Alfabético (A-Z)' },
                      { id: 'za', label: 'Alfabético (Z-A)' },
                    ].map(option => (
                      <button 
                        key={option.id}
                        onClick={() => { setSortBy(option.id as SortOption); setIsSortOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${sortBy === option.id ? 'text-primary dark:text-gold font-bold' : 'text-gray-600 dark:text-gray-300'}`}
                      >
                        {option.label}
                        {sortBy === option.id && <Check size={16} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800/50 p-1.5 rounded-xl border border-gray-200 dark:border-white/5 w-full sm:w-auto justify-center sm:justify-start">
              <button 
                onClick={() => setViewMode('grid')} 
                title="Vista Cuadrícula"
                className={`p-2 rounded-lg transition-all flex-1 sm:flex-none flex justify-center ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-primary dark:text-gold shadow-sm' : 'text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-gold'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                title="Vista Lista"
                className={`p-2 rounded-lg transition-all flex-1 sm:flex-none flex justify-center ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-primary dark:text-gold shadow-sm' : 'text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-gold'}`}
              >
                <List size={16} />
              </button>
              <button 
                onClick={() => setViewMode('compact')} 
                title="Vista Compacta"
                className={`p-2 rounded-lg transition-all flex-1 sm:flex-none flex justify-center ${viewMode === 'compact' ? 'bg-white dark:bg-slate-700 text-primary dark:text-gold shadow-sm' : 'text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-gold'}`}
              >
                <AlignJustify size={16} />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isCategoriesExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200/50 dark:border-white/10 mt-2">
                <button 
                  onClick={() => setSelectedCategory('')}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all border ${!selectedCategory ? 'bg-primary text-white border-primary shadow-md' : 'bg-white/50 dark:bg-slate-800/50 text-gray-500 border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-700 hover:-translate-y-0.5'}`}
                >
                  Todas
                </button>
                {categories.map(c => (
                  <button 
                    key={c.id}
                    onClick={() => setSelectedCategory(selectedCategory === c.id ? '' : c.id)}
                    className={`px-5 py-2 rounded-full text-xs font-bold transition-all border hover:-translate-y-0.5 shadow-sm`}
                    style={{ 
                      backgroundColor: selectedCategory === c.id ? c.color : 'rgba(255,255,255,0.05)', 
                      color: selectedCategory === c.id ? '#ffffff' : c.color, 
                      borderColor: selectedCategory === c.id ? c.color : `${c.color}40` 
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid predicas */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="animate-spin text-primary dark:text-white" size={32} />
        </div>
      ) : filteredSermons.length > 0 ? (
        <AnimeStaggerGrid 
          id="sermons_archive"
          delay={200} 
          staggerDelay={100} 
          className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 lg:grid-cols-2 gap-8 items-start" 
              : viewMode === 'list'
                ? "flex flex-col gap-6"
                : "flex flex-col gap-3"
          }
        >
          {filteredSermons.map((sermon) => {
            const speakerName = sermon.speakers ? `${sermon.speakers.first_name} ${sermon.speakers.last_name}` : sermon.pastor_name;
            const dateString = sermon.date || new Date(sermon.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

            if (viewMode === 'compact') {
              return (
                <AnimeHoverCard key={sermon.id}>
                  <Link to={`/predicas/${sermon.id}`} className="group relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-white/5 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] flex items-center justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    {sermon.sermon_categories && (
                      <div 
                        className="absolute -left-10 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none" 
                        style={{ backgroundColor: sermon.sermon_categories.color }}
                      ></div>
                    )}
                    <div className="relative z-10 flex items-center gap-5">
                      {sermon.sermon_categories ? (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white/20 shadow-sm" style={{ backgroundColor: `${sermon.sermon_categories.color}15` }}>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sermon.sermon_categories.color, boxShadow: `0 0 10px ${sermon.sermon_categories.color}` }}></div>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-white/5">
                          <Video size={16} className="text-slate-400" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-base sm:text-lg font-serif font-bold text-slate-800 dark:text-white group-hover:text-primary dark:group-hover:text-gold transition-colors line-clamp-1">{sermon.title}</h2>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><User size={12}/>{speakerName}</span>
                          <span className="flex items-center gap-1"><Calendar size={12}/>{dateString}</span>
                        </div>
                      </div>
                    </div>
                    <div className="relative z-10 bg-gray-50 dark:bg-white/5 p-2 rounded-full text-slate-400 group-hover:bg-primary group-hover:text-white dark:group-hover:bg-gold dark:group-hover:text-slate-900 transition-all duration-300 flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transform group-hover:scale-110">
                      <ArrowRight size={16} />
                    </div>
                  </Link>
                </AnimeHoverCard>
              );
            }

            // Para Grid y List (se ven igual, solo cambia el layout del contenedor padre y el orden)
            return (
              <AnimeHoverCard key={sermon.id}>
                <div className={`relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] border border-gray-200/50 dark:border-white/5 p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgb(0,0,0,0.4)] hover:-translate-y-2 transition-all duration-500 flex ${viewMode === 'list' ? 'flex-col md:flex-row gap-8' : 'flex-col space-y-6'} h-full group overflow-hidden`}>
                  
                  {/* Glowing Aura in the background */}
                  {sermon.sermon_categories && (
                    <div 
                      className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" 
                      style={{ backgroundColor: sermon.sermon_categories.color }}
                    ></div>
                  )}

                  {/* Contenedor de Video (Opcional) */}
                  {sermon.youtube_url && (
                    <div className={`relative z-10 ${viewMode === 'list' ? 'w-full md:w-5/12 shrink-0 flex flex-col' : 'w-full flex flex-col'}`}>
                      <div className="relative rounded-[1.5rem] overflow-hidden shadow-inner ring-1 ring-black/5 dark:ring-white/10 bg-slate-100 dark:bg-slate-950 aspect-video group-hover:shadow-lg transition-shadow duration-500">
                        <div className="absolute inset-0">
                          <VideoPlayer
                            youtubeUrl={sermon.youtube_url}
                            title={sermon.title}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contenido Texto */}
                  <div className={`relative z-10 ${(viewMode === 'list' && sermon.youtube_url) ? 'w-full md:w-7/12 flex flex-col' : 'w-full flex flex-col flex-1'}`}>
                    <div className="space-y-4 flex-1">
                      {sermon.sermon_categories && (
                        <span 
                          className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm"
                          style={{ backgroundColor: `${sermon.sermon_categories.color}15`, color: sermon.sermon_categories.color, border: `1px solid ${sermon.sermon_categories.color}30` }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: sermon.sermon_categories.color, boxShadow: `0 0 6px ${sermon.sermon_categories.color}` }}></span>
                          {sermon.sermon_categories.name}
                        </span>
                      )}
                      
                      <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 dark:text-white group-hover:text-primary dark:group-hover:text-gold transition-colors leading-tight">
                        <Link to={`/predicas/${sermon.id}`} className="focus:outline-none">{sermon.title}</Link>
                      </h2>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-white/5 py-1 px-3 rounded-full border border-slate-200 dark:border-white/5 shadow-sm">
                          {sermon.speakers?.photo_url ? (
                            <img src={sermon.speakers.photo_url} alt={sermon.speakers.first_name} className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <User size={14} className="text-primary dark:text-gold" />
                          )}
                          {speakerName}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium bg-slate-50 dark:bg-white/5 py-1 px-3 rounded-full border border-slate-200 dark:border-white/5 shadow-sm">
                          <Calendar size={14} className="text-primary/70 dark:text-gold/70" />
                          {dateString}
                        </span>
                      </div>
                    </div>

                    {/* Contenido HTML de TipTap / Vista Previa */}
                    <div className="prose prose-sm text-slate-600 dark:text-slate-300 max-w-none leading-relaxed border-t border-gray-100 dark:border-white/10 pt-5 mt-5 font-medium line-clamp-3">
                      {sermon.content && sermon.content.trim().startsWith('[') ? (
                        <p>{(sermon.description || 'Sermón interactivo por bloques. Haz clic en el enlace de abajo para ver la enseñanza completa.').replace(/&nbsp;/g, ' ').replace(/&nbsp/g, ' ')}</p>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((sermon.content || '').replace(/&nbsp;/g, ' ').replace(/&nbsp/g, ' ')) }} />
                      )}
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-100 dark:border-white/10 pt-5 mt-5">
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        {sermon.editors && sermon.editors.length > 0 && (
                          <span className="flex items-center gap-1" title={`Editado por: ${sermon.editors.join(', ')}`}>
                            <Edit3 size={12} /> Editado
                          </span>
                        )}
                      </div>
                      <Link 
                        to={`/predicas/${sermon.id}`}
                        className="group/btn flex items-center gap-2 text-xs font-bold text-white bg-primary dark:bg-gold dark:text-slate-900 hover:bg-blue-800 dark:hover:bg-yellow-400 transition-colors focus:outline-none rounded-full px-5 py-2.5 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        Profundizar
                        <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </AnimeHoverCard>
            );
          })}
        </AnimeStaggerGrid>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
          <Video className="mx-auto text-slate-400 mb-4" size={48} />
          <h3 className="text-lg font-serif font-bold text-slate-800 dark:text-white">No se encontraron prédicas</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Prueba con otras palabras clave.</p>
        </div>
      )}
      </AnimeFadeUp>
    </div>
  );
};

export default Sermons;
