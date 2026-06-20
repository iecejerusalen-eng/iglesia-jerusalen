import { useState, useEffect, useRef } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useSearchStore } from '../../store/useSearchStore';
import { 
  Search, BookOpen, Music, Calendar, MapPin, 
  Globe, Heart, ShoppingBag, Send, ArrowRight, Loader2
} from 'lucide-react';
import { AnimeScaleIn } from '../animations/AnimeWrappers';

const cmdkStyles = `
  [cmdk-root] {
    max-width: 640px;
    width: 100%;
    border-radius: 24px;
    padding: 8px;
    font-family: inherit;
    overflow: hidden;
    transition: all 300ms ease;
  }
  .dark [cmdk-root] {
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  }
  .light [cmdk-root] {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  }
  [cmdk-input] {
    font-family: inherit;
    width: 100%;
    font-size: 15px;
    padding: 14px;
    outline: none;
    border: none;
    background: transparent;
  }
  .dark [cmdk-input] {
    color: #f8fafc;
  }
  .light [cmdk-input] {
    color: #0f172a;
  }
  .dark [cmdk-input]::placeholder {
    color: #64748b;
  }
  .light [cmdk-input]::placeholder {
    color: #94a3b8;
  }
  [cmdk-item] {
    cursor: pointer;
    height: 52px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 16px;
    user-select: none;
    transition: all 150ms ease;
  }
  .dark [cmdk-item] {
    color: #94a3b8;
  }
  .light [cmdk-item] {
    color: #475569;
  }
  .dark [cmdk-item][data-selected='true'] {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }
  .light [cmdk-item][data-selected='true'] {
    background: rgba(0, 0, 0, 0.05);
    color: #0f172a;
  }
  .dark [cmdk-group-heading] {
    user-select: none;
    font-size: 11px;
    font-weight: 700;
    color: #475569;
    padding: 10px 16px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .light [cmdk-group-heading] {
    user-select: none;
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    padding: 10px 16px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  [cmdk-empty] {
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 72px;
  }
  .dark [cmdk-empty] {
    color: #64748b;
  }
  .light [cmdk-empty] {
    color: #94a3b8;
  }
`;

export default function SearchPalette() {
  const { isOpen, close } = useSearchStore();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    songs: any[];
    events: any[];
    ministries: any[];
    products: any[];
    schedules: any[];
  }>({ songs: [], events: [], ministries: [], products: [], schedules: [] });

  const navigate = useNavigate();
  const paletteRef = useRef<HTMLDivElement>(null);

  // Esc / Shortcut Listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) close(); else useSearchStore.getState().open();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, close]);

  // Reset search when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setResults({ songs: [], events: [], ministries: [], products: [], schedules: [] });
    }
  }, [isOpen]);

  // Debounced search query
  useEffect(() => {
    if (!search.trim()) {
      setResults({ songs: [], events: [], ministries: [], products: [], schedules: [] });
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const q = search.trim();

        const [songsRes, eventsRes, ministriesRes, productsRes, schedulesRes] = await Promise.all([
          supabase.from('songs').select('*').or(`title.ilike.%${q}%,lyrics.ilike.%${q}%`).limit(4),
          supabase.from('events').select('*, ministries(name)').or(`title.ilike.%${q}%,description.ilike.%${q}%`).limit(4),
          supabase.from('ministries').select('*').or(`name.ilike.%${q}%,description.ilike.%${q}%`).limit(4),
          supabase.from('products').select('*').is('deleted_at', null).or(`name.ilike.%${q}%,description.ilike.%${q}%`).limit(4),
          supabase.from('schedules').select('*').or(`title.ilike.%${q}%,day.ilike.%${q}%,description.ilike.%${q}%`).limit(4)
        ]);

        setResults({
          songs: songsRes.data || [],
          events: eventsRes.data || [],
          ministries: ministriesRes.data || [],
          products: productsRes.data || [],
          schedules: schedulesRes.data || []
        });
      } catch (err) {
        console.error('Error executing global search:', err);
      } finally {
        setLoading(false);
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
  return (
    <>
      <style>{cmdkStyles}</style>
      
      <div 
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 dark:bg-black/85 backdrop-blur-md p-4 md:pt-[10vh] animate-fadeIn"
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
            <div className="flex items-center border-b border-gray-100 dark:border-slate-800 px-4">
              {loading ? (
                <Loader2 size={20} className="text-primary dark:text-gold animate-spin shrink-0" />
              ) : (
                <Search size={20} className="text-gray-400 dark:text-slate-500 shrink-0" />
              )}
              <Command.Input 
                value={search}
                onValueChange={setSearch}
                placeholder="¿Qué deseas buscar? (Ej. Culto Familiar, Letra de canto, Ubicación...)" 
                autoFocus
              />
              <button
                onClick={close}
                className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 p-1.5 rounded-lg text-[10px] font-bold font-mono border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 cursor-pointer"
              >
                ESC
              </button>
            </div>

            <Command.List className="max-h-[60vh] overflow-y-auto p-3 custom-scrollbar space-y-4">
              <Command.Empty>No se encontraron resultados específicos.</Command.Empty>

              {/* INTENTS / ACTION SHORTCUTS */}
              {(showLocation || showSocials || showPetition || showDonation || showStore) && (
                <Command.Group heading="Accesos Directos y Ayuda">
                  {showLocation && (
                    <Command.Item 
                      value="ubicación dirección dónde queda mapa milagro cómo llegar" 
                      onSelect={() => handleSelect('/contacto')}
                    >
                      <MapPin className="text-blue-500" size={18} />
                      <div className="flex-1 text-left">
                        <span className="font-bold text-gray-800 dark:text-slate-100 block">Ubicación de la Iglesia</span>
                        <span className="text-xs text-gray-400 dark:text-slate-400">Ver mapa y dirección física en Milagro, Ecuador</span>
                      </div>
                      <ArrowRight size={14} className="text-gray-300 dark:text-slate-600" />
                    </Command.Item>
                  )}
                  {showSocials && (
                    <Command.Item 
                      value="redes sociales facebook youtube instagram canal video transmisión en vivo" 
                      onSelect={() => {
                        window.open('https://youtube.com', '_blank'); // Replace with actual church link if needed
                        close();
                      }}
                    >
                      <Globe className="text-indigo-500" size={18} />
                      <div className="flex-1 text-left">
                        <span className="font-bold text-gray-800 dark:text-slate-100 block">Canal de YouTube y Redes</span>
                        <span className="text-xs text-gray-400 dark:text-slate-400">Mira nuestras transmisiones de cultos en vivo</span>
                      </div>
                      <ArrowRight size={14} className="text-gray-300 dark:text-slate-600" />
                    </Command.Item>
                  )}
                  {showPetition && (
                    <Command.Item 
                      value="petición orar oración pedido ayuda rezar" 
                      onSelect={() => handleSelect('/peticiones')}
                    >
                      <Send className="text-pink-500" size={18} />
                      <div className="flex-1 text-left">
                        <span className="font-bold text-gray-800 dark:text-slate-100 block">Enviar Petición de Oración</span>
                        <span className="text-xs text-gray-400 dark:text-slate-400">Comparte tu necesidad para interceder por ti</span>
                      </div>
                      <ArrowRight size={14} className="text-gray-300 dark:text-slate-600" />
                    </Command.Item>
                  )}
                  {showDonation && (
                    <Command.Item 
                      value="donación ofrenda diezmo dar apoyar diezmos donaciones" 
                      onSelect={() => handleSelect('/donaciones')}
                    >
                      <Heart className="text-red-500" size={18} />
                      <div className="flex-1 text-left">
                        <span className="font-bold text-gray-800 dark:text-slate-100 block">Diezmos y Ofrendas</span>
                        <span className="text-xs text-gray-400 dark:text-slate-400">Apoya el ministerio local y la obra misionera</span>
                      </div>
                      <ArrowRight size={14} className="text-gray-300 dark:text-slate-600" />
                    </Command.Item>
                  )}
                  {showStore && (
                    <Command.Item 
                      value="tienda comprar productos libros biblias camisetas" 
                      onSelect={() => handleSelect('/tienda')}
                    >
                      <ShoppingBag className="text-amber-500" size={18} />
                      <div className="flex-1 text-left">
                        <span className="font-bold text-gray-800 dark:text-slate-100 block">Ir a la Tienda</span>
                        <span className="text-xs text-gray-400 dark:text-slate-400">Ver biblias, agendas y recursos disponibles</span>
                      </div>
                      <ArrowRight size={14} className="text-gray-300 dark:text-slate-600" />
                    </Command.Item>
                  )}
                </Command.Group>
              )}

              {/* SONGS RESULTS */}
              {results.songs.length > 0 && (
                <Command.Group heading="Alabanzas e Himnos">
                  {results.songs.map(song => (
                    <Command.Item 
                      key={song.id} 
                      value={`letra cancion himno musica ${song.title} ${song.artist || ''} ${song.lyrics.slice(0, 50)}`}
                      onSelect={() => handleSelect('/recursos/alabanzas')}
                    >
                      <Music size={18} className="text-emerald-500 shrink-0" />
                      <div className="flex-1 text-left truncate">
                        <span className="font-bold text-gray-800 dark:text-slate-100 block">{song.title}</span>
                        <span className="text-xs text-gray-400 dark:text-slate-400 truncate block">
                          {song.artist ? `Por ${song.artist} — ` : ''} {song.lyrics.replace(/\[.*?\]/g, '').slice(0, 70)}...
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-gray-300 dark:text-slate-600 shrink-0" />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* EVENTS RESULTS */}
              {results.events.length > 0 && (
                <Command.Group heading="Eventos y Actividades">
                  {results.events.map(event => (
                    <Command.Item 
                      key={event.id} 
                      value={`evento reunion fecha horario ${event.title} ${event.description || ''}`}
                      onSelect={() => handleSelect('/eventos')}
                    >
                      <Calendar size={18} className="text-violet-500 shrink-0" />
                      <div className="flex-1 text-left truncate">
                        <span className="font-bold text-gray-800 dark:text-slate-100 block">
                          {event.emoji && <span className="mr-1.5">{event.emoji}</span>}
                          {event.title}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-slate-400 block truncate">
                          {new Date(event.start_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                          {event.start_time && ` - ${event.start_time.slice(0, 5)}`}
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-gray-300 dark:text-slate-600 shrink-0" />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* SCHEDULES RESULTS */}
              {results.schedules.length > 0 && (
                <Command.Group heading="Horarios de Cultos y Reuniones">
                  {results.schedules.map(sch => (
                    <Command.Item 
                      key={sch.id} 
                      value={`horario culto reunion servicio dia hora ${sch.title} ${sch.day} ${sch.description || ''}`}
                      onSelect={() => handleSelect('/#schedules')}
                    >
                      <Calendar size={18} className="text-amber-500 shrink-0" />
                      <div className="flex-1 text-left truncate">
                        <span className="font-bold text-gray-800 dark:text-slate-100 block">
                          {sch.title}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-slate-400 block truncate">
                          {sch.day} — {sch.time_range}
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-gray-300 dark:text-slate-600 shrink-0" />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* MINISTRIES RESULTS */}
              {results.ministries.length > 0 && (
                <Command.Group heading="Ministerios y Departamentos">
                  {results.ministries.map(min => (
                    <Command.Item 
                      key={min.id} 
                      value={`ministerio departamento directiva ${min.name} ${min.description || ''}`}
                      onSelect={() => handleSelect(`/ministerio/${min.slug}`)}
                    >
                      <BookOpen size={18} className="text-sky-500 shrink-0" />
                      <div className="flex-1 text-left truncate">
                        <span className="font-bold text-gray-800 dark:text-slate-100 block">{min.name}</span>
                        <span className="text-xs text-gray-400 dark:text-slate-400 block truncate" dangerouslySetInnerHTML={{ __html: min.description?.replace(/<[^>]*>/g, '') || '' }} />
                      </div>
                      <ArrowRight size={14} className="text-gray-300 dark:text-slate-600 shrink-0" />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* PRODUCTS RESULTS */}
              {results.products.length > 0 && (
                <Command.Group heading="Productos de la Tienda">
                  {results.products.map(prod => (
                    <Command.Item 
                      key={prod.id} 
                      value={`tienda comprar precio ${prod.name} ${prod.description || ''} ${prod.category || ''}`}
                      onSelect={() => handleSelect('/tienda')}
                    >
                      <ShoppingBag size={18} className="text-amber-500 shrink-0" />
                      <div className="flex-1 text-left truncate">
                        <span className="font-bold text-gray-800 dark:text-slate-100 block">{prod.name}</span>
                        <span className="text-xs text-gray-400 dark:text-slate-400 block truncate">
                          ${prod.price.toFixed(2)} — {prod.category}
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-gray-300 dark:text-slate-600 shrink-0" />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* GENERAL PUBLIC PAGES */}
              {search.length === 0 && (
                <Command.Group heading="Secciones del Sitio">
                  <Command.Item value="inicio home principal" onSelect={() => handleSelect('/')}>
                    <BookOpen size={18} className="text-slate-400" />
                    <span>Inicio</span>
                  </Command.Item>
                  <Command.Item value="nosotros historia doctrina pastores" onSelect={() => handleSelect('/nosotros')}>
                    <BookOpen size={18} className="text-slate-400" />
                    <span>Nosotros (Doctrina e Historia)</span>
                  </Command.Item>
                  <Command.Item value="reuniones horarios cultos" onSelect={() => handleSelect('/#schedules')}>
                    <Calendar size={18} className="text-slate-400" />
                    <span>Horarios de Cultos</span>
                  </Command.Item>
                  <Command.Item value="contacto correo telefono oficina" onSelect={() => handleSelect('/contacto')}>
                    <Globe size={18} className="text-slate-400" />
                    <span>Contacto y Oficinas</span>
                  </Command.Item>
                </Command.Group>
              )}
            </Command.List>
          </Command>
          </div>
        </AnimeScaleIn>
      </div>
    </>
  );
}
