import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Command } from 'cmdk';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, BookOpen, Music, Calendar, Heart, 
  ShoppingBag, ArrowRight, Loader2, Send, Globe,
  MapPin, Megaphone, Sparkles, ShieldCheck
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { supabase } from '../../config/supabase';
import { useSearchStore } from '../../store/useSearchStore';
import { useAuthStore } from '../../store/useAuthStore';
import { usePermissions } from '../../hooks/usePermissions';
import { ADMIN_MODULES, getAdminModulePermission } from '../../config/adminModules';
import { AnimeFadeUp, AnimeScaleIn } from '../animations/AnimeWrappers';
import { slugifySongTitle } from '../../features/songs/utils/musicEngine';

// Types for search results
interface SearchSong {
  id: string;
  title: string;
  artist: string | null;
  lyrics: string;
  slug?: string;
}

interface SearchEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  start_time: string | null;
  emoji: string | null;
  ministries?: { name: string } | null;
}

interface SearchMinistry {
  id: string;
  name: string;
  description: string | null;
  slug: string;
}

interface SearchProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
}

interface SearchSchedule {
  id: string;
  title: string;
  day: string;
  time_range: string;
  description: string | null;
}

interface SearchAnnouncement {
  id: string;
  title: string;
  summary: string | null;
  body: string;
}

interface SearchChangelog {
  id: string;
  version: string;
  titulo: string;
  resumen: string | null;
  fecha_lanzamiento: string;
}

interface ParsedVerse {
  bookName: string;
  bookId: string;
  chapter: number;
  verses: string;
}

interface SearchResults {
  songs: SearchSong[];
  events: SearchEvent[];
  ministries: SearchMinistry[];
  products: SearchProduct[];
  schedules: SearchSchedule[];
  announcements: SearchAnnouncement[];
  changelog: SearchChangelog[];
  bibleRef: ParsedVerse | null;
}

const EMPTY_RESULTS: SearchResults = {
  songs: [],
  events: [],
  ministries: [],
  products: [],
  schedules: [],
  announcements: [],
  changelog: [],
  bibleRef: null,
};

function escapeIlikeTerm(value: string): string {
  return value.trim().slice(0, 80).replace(/[(),]/g, ' ').replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

const cmdkStyles = `
  [cmdk-root] {
    max-width: 640px;
    width: 100%;
    border-radius: 24px;
    padding: 8px;
    font-family: inherit;
    overflow: hidden;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
    color: #0f172a;
    transition: all 300ms ease;
  }
  .dark [cmdk-root],
  html.dark [cmdk-root] {
    background: #0f172a;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05);
    color: #f8fafc;
  }
  [cmdk-input] {
    font-family: inherit;
    width: 100%;
    font-size: 16px;
    padding: 16px 12px;
    outline: none;
    border: none;
    background: transparent;
    color: #0f172a;
    font-weight: 500;
  }
  .dark [cmdk-input],
  html.dark [cmdk-input] {
    color: #f8fafc;
  }
  [cmdk-input]::placeholder {
    color: #64748b;
  }
  .dark [cmdk-input]::placeholder,
  html.dark [cmdk-input]::placeholder {
    color: #94a3b8;
  }
  [cmdk-item] {
    cursor: pointer;
    min-height: 54px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    user-select: none;
    transition: all 150ms ease;
    color: #334155;
  }
  .dark [cmdk-item],
  html.dark [cmdk-item] {
    color: #cbd5e1;
  }
  [cmdk-item][data-selected='true'] {
    background: #f1f5f9;
    color: #0f172a;
  }
  .dark [cmdk-item][data-selected='true'],
  html.dark [cmdk-item][data-selected='true'] {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }
  [cmdk-group-heading] {
    user-select: none;
    font-size: 11px;
    font-weight: 800;
    color: #475569;
    padding: 12px 16px 6px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .dark [cmdk-group-heading],
  html.dark [cmdk-group-heading] {
    color: #94a3b8;
  }
  [cmdk-empty] {
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 96px;
    color: #64748b;
    font-weight: 500;
  }
  .dark [cmdk-empty],
  html.dark [cmdk-empty] {
    color: #94a3b8;
  }
`;

export default function SearchPalette() {
  const { isOpen, close } = useSearchStore();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);

  const navigate = useNavigate();
  const location = useLocation();
  const paletteRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  const { user, role } = useAuthStore();
  const { hasPermission } = usePermissions();

  const roleLower = role?.toLowerCase();
  const isAdminOrLeader = !!user && (
    roleLower === 'admin' ||
    roleLower === 'superadmin' ||
    roleLower === 'pastor' ||
    roleLower === 'lider' ||
    roleLower === 'leader' ||
    hasPermission('dashboard', 'view')
  );

  const accessibleAdminModules = useMemo(() => {
    if (!isAdminOrLeader) return [];
    return ADMIN_MODULES.filter(m => 
      m.available !== false && hasPermission(getAdminModulePermission(m), 'view')
    );
  }, [isAdminOrLeader, hasPermission]);

  // Esc / Shortcut Listener & Custom Events
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (location.pathname.startsWith('/admin')) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) close(); else useSearchStore.getState().open();
      }
    };

    const handleCustomOpen = () => {
      useSearchStore.getState().open();
    };

    document.addEventListener('keydown', down);
    window.addEventListener('open-command-palette', handleCustomOpen);
    window.addEventListener('search:open', handleCustomOpen);

    return () => {
      document.removeEventListener('keydown', down);
      window.removeEventListener('open-command-palette', handleCustomOpen);
      window.removeEventListener('search:open', handleCustomOpen);
    };
  }, [isOpen, close, location.pathname]);

  // Reset search when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      const resetTimer = window.setTimeout(() => {
        setSearch('');
        setResults(EMPTY_RESULTS);
        setSearchError(null);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }
    return undefined;
  }, [isOpen]);

  // Debounced search query
  useEffect(() => {
    if (!search.trim()) {
      const resetTimer = window.setTimeout(() => {
        setResults(EMPTY_RESULTS);
        setSearchError(null);
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const timer = setTimeout(async () => {
      setLoading(true);
      setSearchError(null);
      try {
        const q = escapeIlikeTerm(search);

        const parsedBible = parseBibleReferences(q);
        let bibleRefResult = null;
        if (parsedBible.length > 0 && parsedBible[0].bookId) {
          bibleRefResult = parsedBible[0];
        }

        const [songsRes, eventsRes, ministriesRes, productsRes, schedulesRes, announcementsRes, changelogRes] = await Promise.all([
          supabase.from('songs').select('id, title, artist, lyrics, slug').or(`title.ilike.%${q}%,lyrics.ilike.%${q}%`).limit(4),
          supabase.from('events').select('id, title, description, start_date, start_time, emoji, ministries(name)').or(`title.ilike.%${q}%,description.ilike.%${q}%`).limit(4),
          supabase.from('ministries').select('id, name, description, slug').or(`name.ilike.%${q}%,description.ilike.%${q}%`).limit(4),
          supabase.from('products').select('id, name, description, price, category').or(`name.ilike.%${q}%,description.ilike.%${q}%`).limit(4),
          supabase.from('schedules').select('id, title, day, time_range, description').or(`title.ilike.%${q}%,description.ilike.%${q}%`).limit(3),
          supabase.from('church_announcements').select('id, title, summary, body').eq('status', 'published').or(`title.ilike.%${q}%,summary.ilike.%${q}%,body.ilike.%${q}%`).limit(3),
          supabase.from('changelog_versiones').select('id, version, titulo, resumen, fecha_lanzamiento').eq('estado', 'publicado').or(`version.ilike.%${q}%,titulo.ilike.%${q}%,resumen.ilike.%${q}%`).order('fecha_lanzamiento', { ascending: false }).limit(3)
        ]);

        if (requestId !== requestIdRef.current) return;

        setResults({
          songs: (songsRes.data ?? []) as SearchSong[],
          events: (eventsRes.data ?? []).map((event) => ({
            ...event,
            ministries: Array.isArray(event.ministries) ? event.ministries[0] ?? null : event.ministries,
          })) as SearchEvent[],
          ministries: (ministriesRes.data ?? []) as SearchMinistry[],
          products: (productsRes.data ?? []) as SearchProduct[],
          schedules: (schedulesRes.data ?? []) as SearchSchedule[],
          announcements: (announcementsRes.data ?? []) as SearchAnnouncement[],
          changelog: (changelogRes.data ?? []) as SearchChangelog[],
          bibleRef: bibleRefResult
        });
      } catch (err: unknown) {
        console.error('Error executing global search:', err);
        if (requestId === requestIdRef.current) setSearchError('No pudimos completar la búsqueda. Intenta de nuevo en unos segundos.');
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    navigate(path);
    close();
  };

  // Intent classification
  const normalizedSearch = search.toLowerCase();
  
  const showLocation = /ubica|direc|dónde|mapa|milagro|llegar/i.test(normalizedSearch) || search.length === 0;
  const showSocials = /redes|social|facebook|youtube|instagram|canal|video|vivo|transmi/i.test(normalizedSearch) || search.length === 0;
  const showPetition = /peti|orar|orac|pedido|ayuda|rezar|necesi/i.test(normalizedSearch) || search.length === 0;
  const showDonation = /dona|ofren|diez|pagar|dinero|dar|apoyar/i.test(normalizedSearch) || search.length === 0;
  const showStore = /tienda|produ|comprar|venta|libro|biblia|camisa|agenda|precio/i.test(normalizedSearch);
  const showAnnouncements = /anun|aviso|comunic|actividad|importante/i.test(normalizedSearch);
  const showChangelog = /change|novedad|versio|actualiz|release|historial|mejora/i.test(normalizedSearch) || search.length === 0;

  return (
    <>
      <style>{cmdkStyles}</style>
      
      <div 
        className="fixed inset-0 z-[150] flex items-start justify-center bg-slate-950/70 dark:bg-black/85 backdrop-blur-md p-4 pt-16 md:pt-[10vh] animate-fadeIn"
        onClick={close}
      >
        <AnimeScaleIn className="w-full max-w-2xl">
          <div 
            ref={paletteRef}
            onClick={(e) => e.stopPropagation()} 
            className="w-full"
          >
            <Command label="Buscador inteligente de la iglesia">
              {/* Input Header */}
              <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 bg-slate-50/70 dark:bg-slate-900/50">
                {loading ? (
                  <Loader2 size={20} className="text-primary dark:text-gold animate-spin shrink-0" />
                ) : (
                  <Search size={20} className="text-slate-500 dark:text-slate-400 shrink-0" />
                )}
                <Command.Input 
                  value={search}
                  onValueChange={setSearch}
                  placeholder="¿Qué deseas buscar? (Ej. Culto Familiar, Letra de canto, Ubicación...)" 
                  autoFocus
                />
                <button
                  type="button"
                  onClick={close}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-1.5 rounded-lg text-[10px] font-bold font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm cursor-pointer"
                >
                  ESC
                </button>
              </div>

            <Command.List className="max-h-[60vh] overflow-y-auto p-3 custom-scrollbar space-y-4">
              <Command.Empty>No se encontraron resultados específicos.</Command.Empty>

              {searchError && <div role="alert" className="mx-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{searchError}</div>}

              {results.bibleRef && (
                <AnimeFadeUp delay={0.05}>
                  <Command.Group heading="Referencia bíblica detectada">
                    <Command.Item
                      value={`biblia ${results.bibleRef.bookName} ${results.bibleRef.chapter} ${results.bibleRef.verses}`}
                      onSelect={() => handleSelect(`/recursos/biblia?libro=${encodeURIComponent(results.bibleRef?.bookId ?? '')}&capitulo=${encodeURIComponent(results.bibleRef?.chapter ?? '')}`)}
                    >
                      <BookOpen size={18} className="text-indigo-500 shrink-0" />
                      <div className="flex-1 text-left">
                        <span className="font-bold text-slate-900 dark:text-white block">Abrir {results.bibleRef.bookName} {results.bibleRef.chapter}:{results.bibleRef.verses}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ir directamente al lector bíblico</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 dark:text-slate-500" />
                    </Command.Item>
                  </Command.Group>
                </AnimeFadeUp>
              )}

              {/* ADMIN WORKSPACE MODULES (FOR AUTHORIZED LEADERS & PASTORS) */}
              {accessibleAdminModules.length > 0 && (
                <AnimeFadeUp delay={0.08}>
                  <Command.Group heading="Módulos de Administración (Panel)">
                    {accessibleAdminModules.map((mod) => (
                      <Command.Item
                        key={mod.id}
                        value={`admin panel modulo gestion ${mod.name} ${mod.label} ${mod.group} ${mod.path} ${(mod.keywords || []).join(' ')}`}
                        onSelect={() => handleSelect(mod.path)}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                          <ShieldCheck size={16} />
                        </div>
                        <div className="flex-1 text-left truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white truncate">{mod.name}</span>
                            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                              ADMIN
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block truncate">
                            {mod.path} {mod.label !== mod.name ? `— ${mod.label}` : ''}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0">
                          Abrir <ArrowRight size={13} />
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                </AnimeFadeUp>
              )}

              {/* INTENTS / ACTION SHORTCUTS */}
              {(showLocation || showSocials || showPetition || showDonation || showStore || showAnnouncements || showChangelog) && (
                <AnimeFadeUp delay={0.1}>
                  <Command.Group heading="Accesos Directos y Ayuda">
                  {showChangelog && (
                    <Command.Item 
                      value="novedades changelog actualizaciones versiones cambios notas de lanzamiento mejoras" 
                      onSelect={() => handleSelect('/novedades')}
                    >
                      <Sparkles className="text-amber-500 shrink-0" size={18} />
                      <div className="flex-1 text-left">
                        <span className="font-bold text-slate-900 dark:text-white block">Novedades y Actualizaciones (Changelog)</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ver mejoras, notas de versiones y nuevas funciones del sistema</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 dark:text-slate-500" />
                    </Command.Item>
                  )}
                  {showLocation && (
                    <Command.Item 
                      value="ubicación dirección dónde queda mapa milagro cómo llegar" 
                      onSelect={() => handleSelect('/contacto')}
                    >
                      <MapPin className="text-blue-500 shrink-0" size={18} />
                      <div className="flex-1 text-left">
                        <span className="font-bold text-slate-900 dark:text-white block">Ubicación de la Iglesia</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ver mapa y dirección física en Milagro, Ecuador</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 dark:text-slate-500" />
                    </Command.Item>
                  )}
                  {showSocials && (
                    <Command.Item 
                      value="redes sociales facebook youtube instagram canal video transmisión en vivo" 
                      onSelect={() => {
                        window.open('https://youtube.com', '_blank');
                        close();
                      }}
                    >
                      <Globe className="text-indigo-500 shrink-0" size={18} />
                      <div className="flex-1 text-left">
                        <span className="font-bold text-slate-900 dark:text-white block">Canal de YouTube y Redes</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mira nuestras transmisiones de cultos en vivo</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 dark:text-slate-500" />
                    </Command.Item>
                  )}
                  {showPetition && (
                    <Command.Item 
                      value="petición orar oración pedido ayuda rezar" 
                      onSelect={() => handleSelect('/peticiones')}
                    >
                      <Send className="text-pink-500 shrink-0" size={18} />
                      <div className="flex-1 text-left">
                        <span className="font-bold text-slate-900 dark:text-white block">Enviar Petición de Oración</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Comparte tu necesidad para interceder por ti</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 dark:text-slate-500" />
                    </Command.Item>
                  )}
                  {showDonation && (
                    <Command.Item 
                      value="donación ofrenda diezmo dar apoyar diezmos donaciones" 
                      onSelect={() => handleSelect('/donaciones')}
                    >
                      <Heart className="text-rose-500 shrink-0" size={18} />
                      <div className="flex-1 text-left">
                        <span className="font-bold text-slate-900 dark:text-white block">Diezmos y Ofrendas</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Apoya el ministerio local y la obra misionera</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 dark:text-slate-500" />
                    </Command.Item>
                  )}
                  {showStore && (
                    <Command.Item 
                      value="tienda comprar productos libros biblias camisetas" 
                      onSelect={() => handleSelect('/tienda')}
                    >
                      <ShoppingBag className="text-amber-500 shrink-0" size={18} />
                      <div className="flex-1 text-left">
                        <span className="font-bold text-slate-900 dark:text-white block">Ir a la Tienda</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ver biblias, agendas y recursos disponibles</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 dark:text-slate-500" />
                    </Command.Item>
                  )}
                  {showAnnouncements && (
                    <Command.Item
                      value="anuncios avisos comunicados actividades iglesia general"
                      onSelect={() => handleSelect('/anuncios')}
                    >
                      <Megaphone className="text-amber-500 shrink-0" size={18} />
                      <div className="flex-1 text-left">
                        <span className="font-bold text-slate-900 dark:text-white block">Anuncios importantes</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Actividades y comunicados de la Iglesia general</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 dark:text-slate-500" />
                    </Command.Item>
                  )}
                </Command.Group>
                </AnimeFadeUp>
              )}

              {/* SONGS RESULTS */}
              {results.songs.length > 0 && (
                <AnimeFadeUp delay={0.15}>
                  <Command.Group heading="Alabanzas e Himnos">
                  {results.songs.map(song => (
                    <Command.Item 
                      key={song.id} 
                      value={`letra cancion himno musica ${song.title} ${song.artist || ''} ${song.lyrics.slice(0, 50)}`}
                      onSelect={() => handleSelect(`/recursos/alabanzas/${song.slug || slugifySongTitle(song.title)}`)}
                    >
                      <Music size={18} className="text-emerald-500 shrink-0" />
                      <div className="flex-1 text-left truncate">
                        <span className="font-bold text-slate-900 dark:text-white block">{song.title}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate block">
                          {song.artist ? `Por ${song.artist} — ` : ''} {song.lyrics.replace(/\[.*?\]/g, '').slice(0, 70)}...
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    </Command.Item>
                  ))}
                </Command.Group>
                </AnimeFadeUp>
              )}

              {/* EVENTS RESULTS */}
              {results.events.length > 0 && (
                <AnimeFadeUp delay={0.2}>
                  <Command.Group heading="Eventos y Actividades">
                  {results.events.map(event => (
                    <Command.Item 
                      key={event.id} 
                      value={`evento reunion fecha horario ${event.title} ${event.description || ''}`}
                      onSelect={() => handleSelect(`/eventos#${event.id}`)}
                    >
                      <Calendar size={18} className="text-violet-500 shrink-0" />
                      <div className="flex-1 text-left truncate">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {event.emoji && <span className="mr-1.5">{event.emoji}</span>}
                          {event.title}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">
                          {new Date(event.start_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                          {event.start_time && ` - ${event.start_time.slice(0, 5)}`}
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    </Command.Item>
                  ))}
                </Command.Group>
                </AnimeFadeUp>
              )}

              {/* ANNOUNCEMENTS RESULTS */}
              {results.announcements.length > 0 && (
                <AnimeFadeUp delay={0.22}>
                  <Command.Group heading="Anuncios importantes">
                  {results.announcements.map((announcement) => (
                    <Command.Item
                      key={announcement.id}
                      value={`anuncio aviso comunicado actividad ${announcement.title} ${announcement.summary} ${announcement.body.slice(0, 80)}`}
                      onSelect={() => handleSelect(`/anuncios#${announcement.id}`)}
                    >
                      <Megaphone size={18} className="text-amber-500 shrink-0" />
                      <div className="flex-1 text-left truncate">
                        <span className="font-bold text-slate-900 dark:text-white block">{announcement.title}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">{announcement.summary || announcement.body.replace(/<[^>]*>/g, '').slice(0, 90)}</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    </Command.Item>
                  ))}
                  </Command.Group>
                </AnimeFadeUp>
              )}

              {/* CHANGELOG RESULTS */}
              {results.changelog.length > 0 && (
                <AnimeFadeUp delay={0.24}>
                  <Command.Group heading="Novedades y Versiones (Changelog)">
                    {results.changelog.map((ver) => (
                      <Command.Item
                        key={ver.id}
                        value={`changelog version novedades ${ver.version} ${ver.titulo} ${ver.resumen || ''}`}
                        onSelect={() => handleSelect(`/novedades/${encodeURIComponent(ver.version)}`)}
                      >
                        <Sparkles size={18} className="text-amber-500 shrink-0" />
                        <div className="flex-1 text-left truncate">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            <span className="mr-1.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">{ver.version}</span>
                            {ver.titulo}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">
                            {ver.resumen || `Lanzamiento: ${new Date(ver.fecha_lanzamiento + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                          </span>
                        </div>
                        <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                </AnimeFadeUp>
              )}

              {/* SCHEDULES RESULTS */}
              {results.schedules.length > 0 && (
                <AnimeFadeUp delay={0.25}>
                  <Command.Group heading="Horarios de Cultos y Reuniones">
                  {results.schedules.map(sch => (
                    <Command.Item 
                      key={sch.id} 
                      value={`horario culto reunion servicio dia hora ${sch.title} ${sch.day} ${sch.description || ''}`}
                      onSelect={() => handleSelect('/#schedules')}
                    >
                      <Calendar size={18} className="text-amber-500 shrink-0" />
                      <div className="flex-1 text-left truncate">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {sch.title}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">
                          {sch.day} — {sch.time_range}
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    </Command.Item>
                  ))}
                </Command.Group>
                </AnimeFadeUp>
              )}

              {/* MINISTRIES RESULTS */}
              {results.ministries.length > 0 && (
                <AnimeFadeUp delay={0.3}>
                  <Command.Group heading="Ministerios y Departamentos">
                  {results.ministries.map(min => (
                    <Command.Item 
                      key={min.id} 
                      value={`ministerio departamento directiva ${min.name} ${min.description || ''}`}
                      onSelect={() => handleSelect(`/ministerios/${min.slug}`)}
                    >
                      <BookOpen size={18} className="text-sky-500 shrink-0" />
                      <div className="flex-1 text-left truncate">
                        <span className="font-bold text-slate-900 dark:text-white block">{min.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(min.description?.replace(/<[^>]*>/g, '') || '') }} />
                      </div>
                      <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    </Command.Item>
                  ))}
                </Command.Group>
                </AnimeFadeUp>
              )}

              {/* PRODUCTS RESULTS */}
              {results.products.length > 0 && (
                <AnimeFadeUp delay={0.35}>
                  <Command.Group heading="Productos de la Tienda">
                  {results.products.map(prod => (
                    <Command.Item 
                      key={prod.id} 
                      value={`tienda comprar precio ${prod.name} ${prod.description || ''} ${prod.category || ''}`}
                      onSelect={() => handleSelect('/tienda')}
                    >
                      <ShoppingBag size={18} className="text-amber-500 shrink-0" />
                      <div className="flex-1 text-left truncate">
                        <span className="font-bold text-slate-900 dark:text-white block">{prod.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">
                          ${prod.price.toFixed(2)} — {prod.category}
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    </Command.Item>
                  ))}
                </Command.Group>
                </AnimeFadeUp>
              )}

              {/* GENERAL PUBLIC PAGES */}
              <AnimeFadeUp delay={0.4}>
                <Command.Group heading="Secciones del Sitio">
                  <Command.Item value="inicio home principal portal iglesia jerusalen" onSelect={() => handleSelect('/')}>
                    <BookOpen size={18} className="text-primary dark:text-gold shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Inicio</span>
                  </Command.Item>
                  <Command.Item value="novedades changelog actualizaciones versiones mejoras notas de version cambios lanzamientos" onSelect={() => handleSelect('/novedades')}>
                    <Sparkles size={18} className="text-amber-500 shrink-0" />
                    <div className="flex-1 text-left">
                      <span className="font-semibold text-slate-800 dark:text-slate-100 block">Novedades y Actualizaciones (Changelog)</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Historial de versiones y nuevas funciones de la iglesia</span>
                    </div>
                  </Command.Item>
                  <Command.Item value="nosotros historia doctrina pastores iglesia jerusalen mision vision" onSelect={() => handleSelect('/nosotros')}>
                    <BookOpen size={18} className="text-primary dark:text-gold shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Nosotros (Doctrina e Historia)</span>
                  </Command.Item>
                  <Command.Item value="reuniones horarios cultos servicios domingos servicios milagro" onSelect={() => handleSelect('/#schedules')}>
                    <Calendar size={18} className="text-primary dark:text-gold shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Horarios de Cultos</span>
                  </Command.Item>
                  <Command.Item value="contacto correo telefono oficina milagro direccion ubicacion whatsapp" onSelect={() => handleSelect('/contacto')}>
                    <Globe size={18} className="text-primary dark:text-gold shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Contacto y Oficinas</span>
                  </Command.Item>
                  <Command.Item value="anuncios avisos comunicados actividades importantes boletin parroquial" onSelect={() => handleSelect('/anuncios')}>
                    <Megaphone size={18} className="text-amber-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Anuncios importantes</span>
                  </Command.Item>
                  <Command.Item value="publicaciones articulos devocionales blog noticias reflexiones" onSelect={() => handleSelect('/publicaciones')}>
                    <BookOpen size={18} className="text-indigo-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Publicaciones</span>
                  </Command.Item>
                  <Command.Item value="visita planifica bienvenida primera vez llegar como llegar ubicacion" onSelect={() => handleSelect('/visita')}>
                    <Globe size={18} className="text-amber-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Planifica tu Visita</span>
                  </Command.Item>
                  <Command.Item value="predicas sermones videos ensenanzas mensajes pastor bosquejos" onSelect={() => handleSelect('/predicas')}>
                    <BookOpen size={18} className="text-primary dark:text-gold shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Prédicas y Sermones en Video</span>
                  </Command.Item>
                  <Command.Item value="misiones campos evangelismo obras misioneras alcance misionero" onSelect={() => handleSelect('/misiones')}>
                    <Globe size={18} className="text-emerald-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Misiones y Campos Misioneros</span>
                  </Command.Item>
                  <Command.Item value="biblia lectura capitulos versiculos concordancia lector biblico reina valera" onSelect={() => handleSelect('/recursos/biblia')}>
                    <BookOpen size={18} className="text-indigo-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Lector Bíblico</span>
                  </Command.Item>
                  <Command.Item value="peticiones oracion orar necesidad intercesion rezar peticion" onSelect={() => handleSelect('/peticiones')}>
                    <Send size={18} className="text-pink-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Peticiones de Oración</span>
                  </Command.Item>
                  <Command.Item value="ministerios departamentos equipos liderazgo grupos directivas" onSelect={() => handleSelect('/ministerios')}>
                    <Heart size={18} className="text-rose-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Ministerios y departamentos</span>
                  </Command.Item>
                  <Command.Item value="alabanzas canciones himnos acordes biblioteca letras musica coro" onSelect={() => handleSelect('/recursos/alabanzas')}>
                    <Music size={18} className="text-emerald-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Biblioteca de alabanzas</span>
                  </Command.Item>
                  <Command.Item value="podcast audio predicas mensajes sermones reflexiones pastor" onSelect={() => handleSelect('/podcast')}>
                    <Sparkles size={18} className="text-violet-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Podcast y Mensajes</span>
                  </Command.Item>
                  <Command.Item value="juegos biblicos educativos biblionario trivias crucigramas" onSelect={() => handleSelect('/recursos/juegos')}>
                    <Sparkles size={18} className="text-cyan-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Juegos Bíblicos Educativos</span>
                  </Command.Item>
                  <Command.Item value="plan de lectura biblica biblia año lectura devocional" onSelect={() => handleSelect('/plan-lectura')}>
                    <BookOpen size={18} className="text-teal-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Plan de Lectura Bíblica</span>
                  </Command.Item>
                  <Command.Item value="donaciones diezmos ofrendas sembrar dar aportes finanzas" onSelect={() => handleSelect('/donaciones')}>
                    <Heart size={18} className="text-pink-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Donaciones y Diezmos</span>
                  </Command.Item>
                  <Command.Item value="tienda biblia libros agendas productos recuerdos venta comprar" onSelect={() => handleSelect('/tienda')}>
                    <ShoppingBag size={18} className="text-amber-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Tienda de la Iglesia</span>
                  </Command.Item>
                  <Command.Item value="comunidad muro testimonios fotos publicaciones hermanos" onSelect={() => handleSelect('/comunidad')}>
                    <Heart size={18} className="text-rose-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Muro de la Comunidad</span>
                  </Command.Item>
                  <Command.Item value="en vivo transmision culto live streaming directo youtube" onSelect={() => handleSelect('/en-vivo')}>
                    <Sparkles size={18} className="text-red-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Culto en Vivo y Streaming</span>
                  </Command.Item>
                  <Command.Item value="aula virtual discipulado cursos escuela formacion instituto" onSelect={() => handleSelect('/aula-virtual')}>
                    <BookOpen size={18} className="text-sky-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Aula Virtual de Formación</span>
                  </Command.Item>
                  <Command.Item value="reservas espacios auditorio salon solicitud evento" onSelect={() => handleSelect('/reservas')}>
                    <Calendar size={18} className="text-indigo-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Reserva de Espacios</span>
                  </Command.Item>
                </Command.Group>
              </AnimeFadeUp>
            </Command.List>

            {/* FOOTER SHORTCUTS BAR */}
            <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium select-none">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↑</kbd><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↓</kbd> Navegar</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↵</kbd> Abrir</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">ESC</kbd> Cerrar</span>
              </div>
              <a 
                href="https://www.iecejerusalen.com" 
                target="_blank" 
                rel="noreferrer" 
                className="font-semibold text-amber-600 dark:text-amber-400 hover:underline hidden sm:inline"
              >
                iecejerusalen.com
              </a>
            </div>
          </Command>
          </div>
        </AnimeScaleIn>
      </div>
    </>
  );
}

function parseBibleReferences(term: string): ParsedVerse[] {
  const booksMap: Record<string, string> = {
    'gen': 'GEN', 'genesis': 'GEN', 'génesis': 'GEN',
    'exo': 'EXO', 'exodo': 'EXO', 'éxodo': 'EXO',
    'sal': 'PSA', 'salmo': 'PSA', 'salmos': 'PSA',
    'pro': 'PRO', 'proverbios': 'PRO',
    'mat': 'MAT', 'mateo': 'MAT',
    'mar': 'MRK', 'marcos': 'MRK',
    'luc': 'LUK', 'lucas': 'LUK',
    'juan': 'JHN', 'jn': 'JHN',
    'hch': 'ACT', 'hechos': 'ACT',
    'rom': 'ROM', 'romanos': 'ROM',
    '1cor': '1CO', '1 cor': '1CO', '1 corintios': '1CO',
    '2cor': '2CO', '2 cor': '2CO', '2 corintios': '2CO',
    'fil': 'PHP', 'filipenses': 'PHP',
    'apoc': 'REV', 'apocalipsis': 'REV'
  };

  const match = term.match(/^(\d?\s*[a-záéíóúñ]+)\s+(\d+)(?::(\d+(?:-\d+)?))?/i);
  if (!match) return [];

  const rawBook = match[1].toLowerCase().replace(/\s+/g, '');
  const chapter = parseInt(match[2], 10);
  const verses = match[3] || '1';

  let foundBookId = '';
  let foundBookName = match[1].trim();

  for (const [alias, id] of Object.entries(booksMap)) {
    if (rawBook.startsWith(alias) || alias.startsWith(rawBook)) {
      foundBookId = id;
      foundBookName = alias.charAt(0).toUpperCase() + alias.slice(1);
      break;
    }
  }

  if (!foundBookId) return [];

  return [{
    bookId: foundBookId,
    bookName: foundBookName,
    chapter: isNaN(chapter) ? 1 : chapter,
    verses
  }];
}
