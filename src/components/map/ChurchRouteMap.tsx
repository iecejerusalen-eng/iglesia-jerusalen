import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
  MapRoute,
  type MapRef,
} from '@/components/ui/map';
import {
  Navigation,
  MapPin,
  Clock,
  Route as RouteIcon,
  Loader2,
  ExternalLink,
  LocateFixed,
  Church,
  Share2,
  Check,
  Compass,
  Search,
  X,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';

// eslint-disable-next-line react-refresh/only-export-components
export const JERUSALEN_CHURCH_COORDS: RoutePoint = {
  lat: -2.139188,
  lng: -79.5949891,
  name: 'Iglesia Jerusalén Central (Milagro)',
  address: 'Av. 17 de Septiembre y Milagro, Guayas, Ecuador',
};

// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_ORIGIN_FALLBACK: RoutePoint = {
  lat: -2.1308,
  lng: -79.5912,
  name: 'Parque Central de Milagro',
  address: 'Parque Central, Milagro, Ecuador',
};

export interface RoutePoint {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

export interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export interface ChurchRouteMapProps {
  destination: RoutePoint;
  initialOrigin?: RoutePoint;
  height?: string;
  showControls?: boolean;
  className?: string;
  title?: string;
}

interface RouteData {
  coordinates: [number, number][];
  duration: number; // seconds
  distance: number; // meters
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

const mapStyles = {
  bright: 'https://tiles.openfreemap.org/styles/bright',
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
  positron: 'https://tiles.openfreemap.org/styles/positron',
};

type StyleKey = keyof typeof mapStyles;

export function ChurchRouteMap({
  destination,
  initialOrigin,
  height = '520px',
  showControls = true,
  className = '',
  title,
}: ChurchRouteMapProps) {
  const mapRef = useRef<MapRef | null>(null);

  // Compute safe initial origin so origin != destination by default
  const getInitialOrigin = useCallback((): RoutePoint => {
    if (
      initialOrigin &&
      (Math.abs(initialOrigin.lat - destination.lat) > 0.0001 ||
        Math.abs(initialOrigin.lng - destination.lng) > 0.0001)
    ) {
      return initialOrigin;
    }
    return DEFAULT_ORIGIN_FALLBACK;
  }, [initialOrigin, destination]);

  const [origin, setOrigin] = useState<RoutePoint>(getInitialOrigin);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [styleKey, setStyleKey] = useState<StyleKey>('bright');
  const [copied, setCopied] = useState(false);
  const [isUsingGPS, setIsUsingGPS] = useState(false);

  // Search input state for origin place lookup
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch routes from OSRM
  const fetchRouteData = useCallback(async (orig: RoutePoint, dest: RoutePoint) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${orig.lng},${orig.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson&alternatives=true`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const parsedRoutes: RouteData[] = data.routes.map((r: { geometry: { coordinates: [number, number][] }; duration: number; distance: number }) => ({
          coordinates: r.geometry.coordinates as [number, number][],
          duration: r.duration,
          distance: r.distance,
        }));
        setRoutes(parsedRoutes);
        setSelectedIndex(0);
      } else {
        // Fallback straight line
        setRoutes([
          {
            coordinates: [
              [orig.lng, orig.lat],
              [dest.lng, dest.lat],
            ],
            duration: 0,
            distance: 0,
          },
        ]);
      }
    } catch (err) {
      console.warn('Error al calcular ruta OSRM, usando línea directa:', err);
      setRoutes([
        {
          coordinates: [
            [orig.lng, orig.lat],
            [dest.lng, dest.lat],
          ],
          duration: 0,
          distance: 0,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchRouteData(origin, destination);
    });
  }, [origin, destination, fetchRouteData]);

  // Fit map bounds when origin/destination changes
  useEffect(() => {
    if (mapRef.current && origin && destination) {
      const minLng = Math.min(origin.lng, destination.lng);
      const maxLng = Math.max(origin.lng, destination.lng);
      const minLat = Math.min(origin.lat, destination.lat);
      const maxLat = Math.max(origin.lat, destination.lat);

      try {
        mapRef.current.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          { padding: 80, maxZoom: 15, duration: 800 }
        );
      } catch {
        // ignore bounds fit error on unmounted map
      }
    }
  }, [origin, destination]);

  // Handle GPS location trigger
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLoc: RoutePoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: 'Mi Ubicación Actual',
        };
        setOrigin(userLoc);
        setIsUsingGPS(true);
        toast.success('Origen actualizado a tu ubicación actual');
      },
      (err) => {
        setIsLoading(false);
        toast.error('No se pudo obtener tu ubicación. Verifica los permisos.');
        console.error(err);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleResetToChurch = () => {
    setOrigin(JERUSALEN_CHURCH_COORDS);
    setIsUsingGPS(false);
    toast.info('Origen establecido en Iglesia Jerusalén');
  };

  // Nominatim Search Handler
  const handleSearchOrigin = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + ', Milagro, Ecuador'
        )}&limit=5`
      );
      const data = await res.json();
      setSearchResults(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item: NominatimResult) => {
    const newOrigin: RoutePoint = {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      name: item.display_name.split(',')[0],
      address: item.display_name,
    };
    setOrigin(newOrigin);
    setSearchQuery(newOrigin.name);
    setSearchResults([]);
    setIsUsingGPS(false);
    toast.success(`Origen cambiado a ${newOrigin.name}`);
  };

  // Drag Handler for Origin Pin
  const handleOriginDrag = (coords: { lng: number; lat: number }) => {
    setOrigin({
      lat: coords.lat,
      lng: coords.lng,
      name: 'Punto Personalizado',
      address: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
    });
    setIsUsingGPS(false);
  };

  // External Navigation Links
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
  const wazeUrl = `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${destination.lat},${destination.lng}&saddr=${origin.lat},${origin.lng}`;

  const handleShareLink = () => {
    navigator.clipboard.writeText(googleMapsUrl);
    setCopied(true);
    toast.success('¡Enlace de Google Maps copiado al portapapeles!');
    setTimeout(() => setCopied(false), 3000);
  };

  const selectedRoute = routes[selectedIndex];

  // Render routes order: non-selected first, selected last (top layer)
  const sortedRoutes = routes
    .map((route, idx) => ({ route, idx }))
    .sort((a, b) => {
      if (a.idx === selectedIndex) return 1;
      if (b.idx === selectedIndex) return -1;
      return 0;
    });

  return (
    <div className={`flex flex-col rounded-2xl border bg-card text-card-foreground shadow-xl overflow-hidden ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col gap-3 border-b bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 backdrop-blur-md">
              <Navigation className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg leading-tight text-white">
                {title || `Ruta hacia ${destination.name}`}
              </h3>
              <p className="text-xs text-rose-200/80 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                <span className="truncate max-w-xs">{destination.address || destination.name}</span>
              </p>
            </div>
          </div>

          {/* Quick Origin Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isUsingGPS ? (
              <button
                onClick={handleResetToChurch}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/20 transition cursor-pointer"
              >
                <Church className="h-3.5 w-3.5 text-amber-400" />
                <span>Desde Jerusalén</span>
              </button>
            ) : (
              <button
                onClick={handleUseCurrentLocation}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 backdrop-blur-md hover:bg-rose-500/30 transition cursor-pointer"
              >
                <LocateFixed className="h-3.5 w-3.5" />
                <span>Mi GPS</span>
              </button>
            )}

            {/* Map Style Selector */}
            <select
              value={styleKey}
              onChange={(e) => setStyleKey(e.target.value as StyleKey)}
              className="rounded-lg border border-white/20 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
            >
              <option value="bright">Mapa Claro</option>
              <option value="liberty">Mapa Detallado</option>
              <option value="positron">Mapa Elegante</option>
            </select>
          </div>
        </div>

        {/* Search Bar for Origin */}
        <div className="relative w-full max-w-lg">
          <div className="flex items-center gap-2 bg-slate-800/90 border border-white/15 rounded-xl px-3 py-1.5 shadow-inner">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar punto de origen (ej. Parque Central, Terminal, Barrio)..."
              value={searchQuery}
              onChange={(e) => handleSearchOrigin(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder-gray-400 focus:outline-none"
            />
            {isSearching && <Loader2 className="w-3.5 h-3.5 text-rose-400 animate-spin" />}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-30 mt-1 rounded-xl border border-white/20 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-1 max-h-48 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-rose-500/20 hover:text-white rounded-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full" style={{ height }}>
        <Map
          ref={mapRef}
          center={[destination.lng, destination.lat]}
          zoom={13}
          styles={{ light: mapStyles[styleKey], dark: mapStyles[styleKey] }}
        >
          {/* Render Route Polyline */}
          {sortedRoutes.map(({ route, idx }) => {
            const isSelected = idx === selectedIndex;
            return (
              <MapRoute
                key={idx}
                id={`route-line-${idx}`}
                coordinates={route.coordinates}
                color={isSelected ? '#2563eb' : '#94a3b8'}
                width={isSelected ? 6 : 4}
                opacity={isSelected ? 0.95 : 0.5}
                onClick={() => setSelectedIndex(idx)}
              />
            );
          })}

          {/* Draggable Origin Marker */}
          <MapMarker
            longitude={origin.lng}
            latitude={origin.lat}
            draggable={true}
            onDrag={handleOriginDrag}
          >
            <MarkerContent className="group">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-2xl hover:scale-110 active:scale-95 transition cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5" />
              </div>
              <MarkerLabel position="top" className="bg-emerald-700 text-white border-emerald-800 shadow-lg">
                📍 {origin.name} (Arrastra me)
              </MarkerLabel>
            </MarkerContent>
            <MarkerPopup>
              <div className="space-y-1">
                <p className="font-semibold text-sm text-emerald-700">{origin.name}</p>
                <p className="text-xs text-muted-foreground">
                  Arrastra este marcador azul/verde a cualquier punto para cambiar la ruta.
                </p>
              </div>
            </MarkerPopup>
          </MapMarker>

          {/* Destination Marker */}
          <MapMarker longitude={destination.lng} latitude={destination.lat}>
            <MarkerContent>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-rose-600 text-white shadow-2xl hover:scale-110 transition">
                <Church className="h-5 w-5" />
              </div>
              <MarkerLabel position="bottom" className="bg-rose-700 text-white border-rose-800 shadow-lg">
                ⛪ {destination.name}
              </MarkerLabel>
            </MarkerContent>
            <MarkerPopup>
              <div className="space-y-1">
                <p className="font-semibold text-sm text-rose-700">{destination.name}</p>
                {destination.address && (
                  <p className="text-xs text-muted-foreground">{destination.address}</p>
                )}
              </div>
            </MarkerPopup>
          </MapMarker>

          {showControls && <MapControls position="top-right" />}
        </Map>

        {/* Drag Instruction Badge */}
        <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 bg-slate-900/90 border border-white/20 text-white backdrop-blur-md px-3 py-1.5 rounded-full text-xs shadow-lg pointer-events-none">
          <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
          <span>💡 Arrastra el marcador verde 📍 para mover tu origen</span>
        </div>

        {/* Floating Route Options & Stats (Top-Left overlay) */}
        {routes.length > 0 && selectedRoute && (
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 max-w-[270px]">
            <div className="rounded-2xl border bg-background/95 p-3.5 shadow-2xl backdrop-blur-md space-y-2.5">
              <div className="flex items-center justify-between border-b pb-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Detalles del Trayecto
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <RouteIcon className="h-3 w-3" />
                  Conducción
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-muted/70 p-2 border border-slate-200/50 dark:border-white/5">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground font-medium">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Tiempo</span>
                  </div>
                  <p className="font-extrabold text-base text-foreground mt-0.5">
                    {selectedRoute.duration > 0 ? formatDuration(selectedRoute.duration) : 'N/A'}
                  </p>
                </div>

                <div className="rounded-xl bg-muted/70 p-2 border border-slate-200/50 dark:border-white/5">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground font-medium">
                    <Compass className="h-3.5 w-3.5 text-primary" />
                    <span>Distancia</span>
                  </div>
                  <p className="font-extrabold text-base text-foreground mt-0.5">
                    {selectedRoute.distance > 0 ? formatDistance(selectedRoute.distance) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Alternative Route Selectors */}
              {routes.length > 1 && (
                <div className="pt-1 border-t border-slate-200/50 dark:border-white/10">
                  <p className="text-[11px] text-muted-foreground mb-1">Rutas alternativas disponibles:</p>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                    {routes.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedIndex(i)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          i === selectedIndex
                            ? 'bg-primary text-primary-foreground font-semibold border-primary shadow-sm'
                            : 'bg-background hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        Ruta {i + 1} ({formatDuration(r.duration)})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Spinner Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-xs">
            <div className="flex items-center gap-2.5 rounded-2xl border bg-background px-4 py-3 shadow-2xl">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-xs font-semibold">Trazando ruta OSRM en tiempo real...</span>
            </div>
          </div>
        )}
      </div>

      {/* External GPS Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/30 p-3.5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Navigation className="h-4 w-4 text-primary shrink-0" />
          <span>Abrir GPS en celular:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700 transition cursor-pointer"
          >
            <span>Google Maps</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-sky-600 transition cursor-pointer"
          >
            <span>Waze</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 dark:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-slate-900 transition cursor-pointer"
          >
            <span>Apple Maps</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <button
            onClick={handleShareLink}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted transition text-foreground cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copiado</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>Compartir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
