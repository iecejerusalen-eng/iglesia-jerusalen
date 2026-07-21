import { useState, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { supabase } from '../../config/supabase';
import type { Sermon } from '../../types';
import { Calendar, User, Video, RefreshCw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimeFadeUp, AnimeStaggerGrid, AnimeHoverCard } from '../../components/animations/AnimeWrappers';
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

  const fetchSermons = async () => {
    setSermons(prev => {
      if (prev.length === 0) setLoading(true);
      return prev;
    });
    try {
      const { data, error } = await supabase
        .from('sermons')
        .select('*')
        .order('created_at', { ascending: false });

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

  const filteredSermons = sermons.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.pastor_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      <AnimeFadeUp delay={100} duration={800}>
        
      {/* HEADER HERO */}
      <div className="bg-gradient-to-r from-primary to-blue-900 rounded-2xl p-8 md:p-12 text-white mb-10 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
          <Video size={200} />
        </div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="bg-gold/20 text-gold border border-gold/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            Enseñanzas & Mensajes
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mt-2">Prédicas y Devocionales</h1>
          <p className="text-gray-200 text-base md:text-lg leading-relaxed font-light">
            Repasa las prédicas dominicales, series doctrinales y mensajes de edificación compartidos por nuestros pastores y líderes invitados.
          </p>
        </div>
      </div>

      {/* Buscador inteligente con Autocomplete */}
      <div className="max-w-md mb-10">
        <Autocomplete
          items={autocompleteItems}
          value={searchQuery}
          onValueChange={(val) => setSearchQuery(val)}
          onSelect={(item) => setSearchQuery(item.label)}
        >
          <AutocompleteInput
            placeholder="Buscar sermón por título, contenido o pastor..."
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

      {/* Grid predicas */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="animate-spin text-primary dark:text-white" size={32} />
        </div>
      ) : filteredSermons.length > 0 ? (
        <AnimeStaggerGrid delay={200} staggerDelay={100} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {filteredSermons.map((sermon) => {
            return (
              <AnimeHoverCard key={sermon.id}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-6 md:p-8 shadow-sm flex flex-col space-y-4 h-full">
                  {/* Embedded Video Reproductor Sincronizado */}
                  {sermon.youtube_url && (
                    <VideoPlayer
                      youtubeUrl={sermon.youtube_url}
                      title={sermon.title}
                      className="mb-2"
                    />
                  )}

                <div className="space-y-2">
                  <h2 className="text-2xl font-serif font-bold text-gray-800 dark:text-white hover:text-primary dark:hover:text-gold transition-colors">
                    <Link to={`/predicas/${sermon.id}`}>{sermon.title}</Link>
                  </h2>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <User size={12} />
                      {sermon.pastor_name}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar size={12} />
                      {new Date(sermon.created_at).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>

                {/* Contenido HTML de TipTap / Vista Previa */}
                <div className="prose prose-sm text-slate-600 dark:text-slate-300 max-w-none leading-relaxed border-t border-gray-100 dark:border-white/10 pt-4 font-medium">
                  {sermon.content && sermon.content.trim().startsWith('[') ? (
                    <p>{sermon.description || 'Sermón interactivo por bloques. Haz clic en el enlace de abajo para ver la enseñanza completa.'}</p>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sermon.content || '') }} />
                  )}
                </div>

                <div className="flex justify-end items-center border-t border-gray-100 dark:border-white/10 pt-4 mt-2">
                  <Link 
                    to={`/predicas/${sermon.id}`}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-gold hover:text-blue-800 dark:hover:text-gold/80 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-md px-1.5 py-0.5"
                  >
                    Ver prédica y tomar notas
                    <ArrowRight size={14} />
                  </Link>
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
