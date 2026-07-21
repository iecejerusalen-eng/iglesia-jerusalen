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
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

export const JERUSALEN_CHURCH_COORDS = {
  lat: -2.139188,
  lng: -79.5949891,
  name: 'Iglesia Jerusalén (Milagro)',
  address: 'Av. 17 de Septiembre y Milagro, Guayas, Ecuador',
};

export interface RoutePoint {
  lat: number;
  lng: number;
  name: string;
  address?: string;
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
  initialOrigin = JERUSALEN_CHURCH_COORDS,
  height = '480px',
  showControls = true,
  className = '',
  title,
}: ChurchRouteMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [origin, setOrigin] = useState<RoutePoint>(initialOrigin);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [styleKey, setStyleKey] = useState<StyleKey>('bright');
  const [copied, setCopied] = useState(false);
  const [isUsingGPS, setIsUsingGPS] = useState(false);

  // Fetch routes from OSRM
  const fetchRouteData = useCallback(async (orig: RoutePoint, dest: RoutePoint) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${orig.lng},${orig.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson&alternatives=true`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const parsedRoutes: RouteData[] = data.routes.map((r: any) => ({
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
    fetchRouteData(origin, destination);
  }, [origin, destination, fetchRouteData]);

  // Fit map bounds when routes change
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
          { padding: 70, maxZoom: 15, duration: 1000 }
        );
      } catch (e) {
        // ignore bounds fit error on unmounted map
      }
    }
  }, [origin, destination, routes]);

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
    toast.info('Origen restablecido a Iglesia Jerusalén');
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
    <div className={`flex flex-col rounded-2xl border bg-card text-card-foreground shadow-md overflow-hidden ${className}`}>
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary animate-pulse" />
            <h3 className="font-semibold text-lg leading-tight">
              {title || `Ruta hacia ${destination.name}`}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Desde <span className="font-medium text-foreground">{origin.name}</span> hasta{' '}
            <span className="font-medium text-foreground">{destination.name}</span>
          </p>
        </div>

        {/* Origin Selector */}
        <div className="flex items-center gap-2">
          {isUsingGPS ? (
            <button
              onClick={handleResetToChurch}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition"
              title="Volver a Iglesia Jerusalén"
            >
              <Church className="h-3.5 w-3.5 text-primary" />
              <span>Desde Iglesia</span>
            </button>
          ) : (
            <button
              onClick={handleUseCurrentLocation}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition text-primary"
              title="Usar mi ubicación actual"
            >
              <LocateFixed className="h-3.5 w-3.5" />
              <span>Desde Mi Ubicación</span>
            </button>
          )}

          {/* Style Selector */}
          <select
            value={styleKey}
            onChange={(e) => setStyleKey(e.target.value as StyleKey)}
            className="rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="bright">Mapa Claro</option>
            <option value="liberty">Mapa Detallado</option>
            <option value="positron">Mapa Elegante</option>
          </select>
        </div>
      </div>

      {/* Map Body Container */}
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

          {/* Origin Marker */}
          <MapMarker longitude={origin.lng} latitude={origin.lat}>
            <MarkerContent>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-xl hover:scale-110 transition">
                <Church className="h-5 w-5" />
              </div>
              <MarkerLabel position="top" className="bg-emerald-700 text-white border-emerald-800">
                {origin.name}
              </MarkerLabel>
            </MarkerContent>
            <MarkerPopup>
              <div className="space-y-1">
                <p className="font-semibold text-sm text-emerald-700">{origin.name}</p>
                <p className="text-xs text-muted-foreground">{origin.address || 'Punto de partida'}</p>
              </div>
            </MarkerPopup>
          </MapMarker>

          {/* Destination Marker */}
          <MapMarker longitude={destination.lng} latitude={destination.lat}>
            <MarkerContent>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-rose-600 text-white shadow-xl hover:scale-110 transition">
                <MapPin className="h-5 w-5" />
              </div>
              <MarkerLabel position="bottom" className="bg-rose-700 text-white border-rose-800">
                {destination.name}
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

        {/* Floating Route Options & Stats (Top-Left overlay) */}
        {routes.length > 0 && selectedRoute && (
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 max-w-[260px]">
            <div className="rounded-xl border bg-background/90 p-3 shadow-lg backdrop-blur space-y-2">
              <div className="flex items-center justify-between border-b pb-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Detalles de Viaje
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  <RouteIcon className="h-3 w-3" />
                  Conducción
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-muted/60 p-2">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Tiempo</span>
                  </div>
                  <p className="font-bold text-sm text-foreground mt-0.5">
                    {selectedRoute.duration > 0 ? formatDuration(selectedRoute.duration) : 'N/A'}
                  </p>
                </div>

                <div className="rounded-lg bg-muted/60 p-2">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Compass className="h-3.5 w-3.5 text-primary" />
                    <span>Distancia</span>
                  </div>
                  <p className="font-bold text-sm text-foreground mt-0.5">
                    {selectedRoute.distance > 0 ? formatDistance(selectedRoute.distance) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Alternative Route Selectors */}
              {routes.length > 1 && (
                <div className="pt-1">
                  <p className="text-[11px] text-muted-foreground mb-1">Rutas alternativas disponibles:</p>
                  <div className="flex gap-1.5 overflow-x-auto">
                    {routes.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedIndex(i)}
                        className={`text-xs px-2.5 py-1 rounded-md border transition ${
                          i === selectedIndex
                            ? 'bg-primary text-primary-foreground font-semibold border-primary'
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

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-xs">
            <div className="flex items-center gap-2.5 rounded-xl border bg-background px-4 py-3 shadow-lg">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-xs font-medium">Trazando la mejor ruta...</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation App Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 p-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Navigation className="h-4 w-4 text-primary" />
          <span>Abrir GPS en tu celular:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Google Maps Button */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-blue-700 transition"
          >
            <span>Google Maps</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          {/* Waze Button */}
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-sky-600 transition"
          >
            <span>Waze</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          {/* Apple Maps Button */}
          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800 dark:bg-gray-700 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-gray-900 transition"
          >
            <span>Apple Maps</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          {/* Share / Copy Link */}
          <button
            onClick={handleShareLink}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition text-foreground"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Copiado</span>
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
