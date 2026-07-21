import { useState } from 'react';
import { JERUSALEN_CHURCH_COORDS, ChurchRouteMap, type RoutePoint } from './ChurchRouteMap';
import {
  MapPin,
  Church,
  Search,
  Trash2,
  Plus,
  LocateFixed,
  Route as RouteIcon,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export interface RouteConfig {
  has_route: boolean;
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
}

export interface RoutePickerSectionProps {
  value: RouteConfig;
  onChange: (config: RouteConfig) => void;
  eventTitle?: string;
}

export function RoutePickerSection({ value, onChange, eventTitle }: RoutePickerSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Toggle Route On/Off
  const handleToggleRoute = (enabled: boolean) => {
    if (enabled) {
      onChange({
        ...value,
        has_route: true,
        origin_name: value.origin_name || JERUSALEN_CHURCH_COORDS.name,
        origin_lat: value.origin_lat || JERUSALEN_CHURCH_COORDS.lat,
        origin_lng: value.origin_lng || JERUSALEN_CHURCH_COORDS.lng,
        destination_name: value.destination_name || eventTitle || 'Lugar del Evento',
        destination_lat: value.destination_lat || -2.1322,
        destination_lng: value.destination_lng || -79.5912,
      });
      toast.success('Mapa de ruta activado para este evento');
    } else {
      onChange({
        ...value,
        has_route: false,
      });
      toast.info('Ruta eliminada del evento');
    }
  };

  // Reset origin to Iglesia Jerusalen
  const handleResetOriginToChurch = () => {
    onChange({
      ...value,
      origin_name: JERUSALEN_CHURCH_COORDS.name,
      origin_lat: JERUSALEN_CHURCH_COORDS.lat,
      origin_lng: JERUSALEN_CHURCH_COORDS.lng,
    });
    toast.success('Punto de partida cambiado a Iglesia Jerusalén');
  };

  // Set origin to user GPS
  const handleUseGPSForOrigin = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          ...value,
          origin_name: 'Mi Ubicación Actual',
          origin_lat: pos.coords.latitude,
          origin_lng: pos.coords.longitude,
        });
        toast.success('Origen actualizado a tu ubicación GPS');
      },
      (err) => {
        toast.error('No se pudo obtener tu ubicación GPS');
        console.error(err);
      }
    );
  };

  // Search destination via Nominatim Geocoding API
  const handleSearchDestination = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          `${searchQuery}, Ecuador`
        )}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const topResult = data[0];
        const lat = parseFloat(topResult.lat);
        const lon = parseFloat(topResult.lon);
        onChange({
          ...value,
          destination_name: searchQuery,
          destination_lat: lat,
          destination_lng: lon,
        });
        toast.success(`Ubicación encontrada: ${topResult.display_name.split(',')[0]}`);
      } else {
        toast.error('No se encontraron coordenadas para esa dirección');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error al buscar la ubicación');
    } finally {
      setIsSearching(false);
    }
  };

  if (!value.has_route) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-250 dark:border-white/10 bg-gray-50/50 dark:bg-slate-800/40 p-4 text-center space-y-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
          <RouteIcon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-foreground">¿Agregar Mapa de Ruta a este evento?</h4>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-md mx-auto">
            Muestra a los hermanos la ruta exacta para llegar al evento desde la iglesia o un punto personalizado.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleToggleRoute(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Añadir Mapa de Ruta</span>
        </button>
      </div>
    );
  }

  const originPoint: RoutePoint = {
    lat: value.origin_lat,
    lng: value.origin_lng,
    name: value.origin_name,
  };

  const destinationPoint: RoutePoint = {
    lat: value.destination_lat,
    lng: value.destination_lng,
    name: value.destination_name || eventTitle || 'Destino',
  };

  return (
    <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-slate-800/80 p-4 shadow-sm">
      {/* Header with Title and Delete Route Button */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <RouteIcon className="h-5 w-5 text-primary" />
          <h4 className="font-bold text-sm text-foreground">Configuración de Ruta del Evento</h4>
        </div>
        <button
          type="button"
          onClick={() => handleToggleRoute(false)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 px-2.5 py-1 rounded-lg transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Eliminar Ruta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Origin Configuration */}
        <div className="space-y-3 rounded-xl border bg-background p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
              <Church className="h-4 w-4" />
              Punto de Partida (Origen)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetOriginToChurch}
                title="Usar Iglesia Jerusalén"
                className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Iglesia</span>
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={handleUseGPSForOrigin}
                title="Usar GPS"
                className="text-[11px] font-medium text-emerald-600 hover:underline flex items-center gap-1"
              >
                <LocateFixed className="h-3 w-3" />
                <span>GPS</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
              Nombre del Origen
            </label>
            <input
              type="text"
              value={value.origin_name}
              onChange={(e) => onChange({ ...value, origin_name: e.target.value })}
              placeholder="Ej. Iglesia Jerusalén (Milagro)"
              className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-muted-foreground">Latitud Origen</label>
              <input
                type="number"
                step="any"
                value={value.origin_lat}
                onChange={(e) => onChange({ ...value, origin_lat: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border bg-background px-2.5 py-1 text-xs tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground">Longitud Origen</label>
              <input
                type="number"
                step="any"
                value={value.origin_lng}
                onChange={(e) => onChange({ ...value, origin_lng: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border bg-background px-2.5 py-1 text-xs tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Destination Configuration */}
        <div className="space-y-3 rounded-xl border bg-background p-3 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            Punto de Llegada (Destino)
          </span>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
              Nombre del Lugar / Destino
            </label>
            <input
              type="text"
              value={value.destination_name}
              onChange={(e) => onChange({ ...value, destination_name: e.target.value })}
              placeholder="Ej. Parque Central de Milagro"
              className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Location Search Bar */}
          <div className="flex gap-1.5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchDestination())}
              placeholder="Buscar dirección en Milagro..."
              className="flex-1 rounded-lg border bg-background px-2.5 py-1 text-xs focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSearchDestination}
              disabled={isSearching}
              className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium hover:bg-secondary/80 transition"
            >
              {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              <span>Buscar</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-muted-foreground">Latitud Destino</label>
              <input
                type="number"
                step="any"
                value={value.destination_lat}
                onChange={(e) => onChange({ ...value, destination_lat: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border bg-background px-2.5 py-1 text-xs tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground">Longitud Destino</label>
              <input
                type="number"
                step="any"
                value={value.destination_lng}
                onChange={(e) => onChange({ ...value, destination_lng: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border bg-background px-2.5 py-1 text-xs tabular-nums"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Route Map Preview */}
      <div className="space-y-1.5 pt-1">
        <span className="text-xs font-semibold text-muted-foreground block">
          Vista Previa de la Ruta en Tiempo Real:
        </span>
        <ChurchRouteMap
          destination={destinationPoint}
          initialOrigin={originPoint}
          height="280px"
          showControls={false}
          title={`Vista Previa: ${originPoint.name} ➔ ${destinationPoint.name}`}
        />
      </div>
    </div>
  );
}
