import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import Map, { Marker, NavigationControl, Layer, Source } from 'react-map-gl/maplibre';
import Supercluster from 'supercluster';
import { Search, Ruler, Camera, MapPin, Compass, Phone } from 'lucide-react';
import { generateCoverageGeoJSON } from '../../../utils/geoUtils';
import type { Member, Cell } from '../../../types';


interface MapVisualsProps {
  mapRef: React.RefObject<any>;
  viewState: any;
  setViewState: (vs: any) => void;
  mapStyle: string;
  isMeasuring: boolean;
  setIsMeasuring: (val: boolean) => void;
  measurePoints: [number, number][];
  setMeasurePoints: (val: [number, number][]) => void;
  isCreatingCell: boolean;
  handleMapClick: (e: any) => void;
  showChurch: boolean;
  showCells: boolean;
  showCoverage: boolean;
  showMembers: boolean;
  showHeatmap: boolean;
  showOtherChurches: boolean;
  members: Member[];
  cells: Cell[];
  locations: any[];
  CHURCH_COORDS: { lat: number; lng: number };
  setSelectedItem: (item: any) => void;
  focusLocation: (lat: number, lng: number) => void;
  handleScreenshot: () => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  handleGeocodeSearch: () => void;
  geocoding: boolean;
  calculateTotalDistance: (pts: [number, number][]) => number;
}

export const MapVisuals = ({
  mapRef, viewState, setViewState, mapStyle,
  isMeasuring, setIsMeasuring, measurePoints, setMeasurePoints,
  isCreatingCell, handleMapClick,
  showChurch, showCells, showCoverage, showMembers, showHeatmap, showOtherChurches,
  members, cells, locations, CHURCH_COORDS,
  setSelectedItem, focusLocation, handleScreenshot,
  searchQuery, setSearchQuery, handleGeocodeSearch, geocoding,
  calculateTotalDistance
}: MapVisualsProps) => {
  
  const [superclusterInstance, setSuperclusterInstance] = useState<Supercluster<any, any> | null>(null);
  const [visiblePoints, setVisiblePoints] = useState<any[]>([]);

  // Initialize Supercluster
  useEffect(() => {
    const validMembers = members.filter(
      m => m.latitude !== null && m.longitude !== null && m.latitude !== undefined && m.longitude !== undefined
    );

    if (validMembers.length === 0) {
      setSuperclusterInstance(null);
      setVisiblePoints([]);
      return;
    }

    const points = validMembers.map(m => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [Number(m.longitude), Number(m.latitude)] as [number, number],
      },
      properties: {
        cluster: false,
        memberId: m.id,
        member: m,
      },
    }));

    const sc = new Supercluster({ radius: 50, maxZoom: 15 });
    sc.load(points);
    setSuperclusterInstance(sc);
  }, [members]);

  // Update clusters when viewport or supercluster changes
  useEffect(() => {
    if (!superclusterInstance) {
      setVisiblePoints([]);
      return;
    }

    const handler = setTimeout(() => {
      let bbox: [number, number, number, number];
      if (mapRef.current) {
        try {
          const bounds = mapRef.current.getMap().getBounds();
          bbox = [
            bounds.getWest(), bounds.getSouth(),
            bounds.getEast(), bounds.getNorth(),
          ];
        } catch (err) {
          const zoom = viewState.zoom;
          const lat = viewState.latitude;
          const lng = viewState.longitude;
          const lngDiff = 360 / Math.pow(2, zoom);
          const latDiff = 180 / Math.pow(2, zoom);
          bbox = [lng - lngDiff, lat - latDiff, lng + lngDiff, lat + latDiff];
        }
      } else {
        const zoom = viewState.zoom;
        const lat = viewState.latitude;
        const lng = viewState.longitude;
        const lngDiff = 360 / Math.pow(2, zoom);
        const latDiff = 180 / Math.pow(2, zoom);
        bbox = [lng - lngDiff, lat - latDiff, lng + lngDiff, lat + latDiff];
      }

      try {
        const zoom = Math.round(viewState.zoom);
        const clusters = superclusterInstance.getClusters(bbox, zoom);
        setVisiblePoints(clusters);
      } catch (err) {
        console.error('Error updating visible clusters:', err);
      }
    }, 100);

    return () => clearTimeout(handler);
  }, [superclusterInstance, viewState.zoom, viewState.latitude, viewState.longitude, mapRef]);

  // GeoJSON data structures
  const memberGeoJSON = {
    type: 'FeatureCollection' as const,
    features: members
      .filter(m => m.latitude !== null && m.longitude !== null && m.latitude !== undefined && m.longitude !== undefined)
      .map(m => ({
        type: 'Feature' as const,
        properties: { id: m.id },
        geometry: {
          type: 'Point' as const,
          coordinates: [Number(m.longitude), Number(m.latitude)]
        }
      }))
  };

  const heatmapLayer: any = {
    id: 'member-heatmap',
    type: 'heatmap',
    maxzoom: 15,
    paint: {
      'heatmap-weight': 1,
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0, 0, 255, 0)',
        0.2, 'rgba(59, 130, 246, 0.45)',
        0.4, 'rgba(34, 211, 238, 0.6)',
        0.6, 'rgba(52, 211, 153, 0.7)',
        0.8, 'rgba(251, 191, 36, 0.8)',
        1, 'rgba(251, 113, 133, 0.9)'
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 3, 9, 20],
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.95, 15, 0.15]
    }
  };

  const coverageGeoJSON = generateCoverageGeoJSON(cells, 500);

  const coverageFillLayer: any = {
    id: 'cell-coverage-fill',
    type: 'fill',
    paint: { 'fill-color': '#1E3A8A', 'fill-opacity': 0.15 }
  };

  const coverageLineLayer: any = {
    id: 'cell-coverage-line',
    type: 'line',
    paint: { 'line-color': '#D4AF37', 'line-width': 1.5, 'line-opacity': 0.5 }
  };

  return (
    <>
      {/* Floating Geocoding Search Box */}
      <div className="absolute top-5 left-5 z-10 w-72 max-w-[calc(100vw-40px)] flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleGeocodeSearch() }}
          placeholder="Buscar ubicación (ej: Guayaquil)..."
          className="flex-1 bg-white/95 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-gray-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary backdrop-blur-md shadow-lg min-w-0 font-medium"
        />
        <button
          type="button"
          onClick={handleGeocodeSearch}
          disabled={geocoding}
          className="p-2.5 bg-primary hover:bg-blue-800 disabled:bg-blue-900 text-white rounded-xl shadow-lg border border-primary/20 transition-all shrink-0 flex items-center justify-center cursor-pointer"
          title="Buscar dirección"
        >
          {geocoding ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Search size={18} />
          )}
        </button>
      </div>

      {/* Map Tools Sidebar (Right) */}
      <div className="absolute top-5 right-5 flex flex-col gap-3 z-10">
        <button
          type="button"
          onClick={() => { setIsMeasuring(!isMeasuring); setMeasurePoints([]) }}
          className={`p-3 rounded-2xl transition-all shadow-lg backdrop-blur-md border flex items-center justify-center cursor-pointer ${isMeasuring ? 'bg-primary text-white border-primary shadow-primary/20' : 'bg-white/95 border-slate-200 text-slate-600 hover:text-primary hover:bg-slate-50'}`}
          title="Medir distancia en km"
        >
          <Ruler size={18} />
        </button>
        <button
          type="button"
          onClick={handleScreenshot}
          className="bg-white/95 backdrop-blur-md border border-slate-200 dark:border-white/10 p-3 rounded-2xl text-slate-600 dark:text-gray-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center cursor-pointer"
          title="Capturar pantalla del mapa"
        >
          <Camera size={18} />
        </button>
      </div>

      {/* Measuring Distance Tooltip overlay */}
      {isMeasuring && measurePoints.length > 0 && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3 z-10 animate-fadeIn text-xs font-semibold">
          <div className="text-slate-800 dark:text-gray-100">
            Distancia Medida: <span className="text-primary dark:text-church-gold-bright font-mono font-bold">{calculateTotalDistance(measurePoints).toFixed(2)} km</span>
          </div>
          <button
            onClick={() => setMeasurePoints([])}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-all cursor-pointer"
            title="Limpiar medición"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hint Overlay Banner */}
      <div className="absolute bottom-5 left-5 z-10 bg-white/90 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-[10px] font-semibold text-slate-600 dark:text-gray-400 select-none flex items-center gap-2 pointer-events-none shadow-lg backdrop-blur-xs">
        {isMeasuring ? (
          <span className="text-primary dark:text-church-gold-bright animate-pulse font-bold">Modo Medidor: Clic en el mapa para fijar puntos y calcular distancia</span>
        ) : isCreatingCell ? (
          <span className="text-emerald-600 dark:text-emerald-400 animate-pulse font-bold">Modo Célula: Clic en el mapa para ubicar la nueva célula</span>
        ) : (
          <span>Usa el buscador o arrastra el mapa para analizar las zonas geográficas</span>
        )}
      </div>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        preserveDrawingBuffer={true}
        cursor={isMeasuring || isCreatingCell ? 'crosshair' : 'grab'}
      >
        <NavigationControl position="bottom-right" showCompass visualizePitch />

        {isMeasuring && measurePoints.length > 1 && (
          <Source type="geojson" data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: measurePoints } }}>
            <Layer id="measure-line" type="line" paint={{ 'line-color': '#1e3a8a', 'line-width': 3.5, 'line-dasharray': [2, 2] }} />
          </Source>
        )}

        {isMeasuring && measurePoints.map((pt, i) => (
          <Marker key={`measure-pt-${i}`} longitude={pt[0]} latitude={pt[1]} anchor="center">
            <div className="w-3.5 h-3.5 bg-primary rounded-full border-2 border-white shadow-md flex items-center justify-center text-[8px] font-bold text-white font-mono leading-none">
              {i + 1}
            </div>
          </Marker>
        ))}

        {showCoverage && showCells && coverageGeoJSON.features.length > 0 && (
          <Source type="geojson" data={coverageGeoJSON}>
            <Layer {...coverageFillLayer} />
            <Layer {...coverageLineLayer} />
          </Source>
        )}

        {showHeatmap && memberGeoJSON.features.length > 0 && (
          <Source type="geojson" data={memberGeoJSON}>
            <Layer {...heatmapLayer} />
          </Source>
        )}

        {showChurch && (
          <Marker longitude={CHURCH_COORDS.lng} latitude={CHURCH_COORDS.lat} anchor="bottom">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                focusLocation(CHURCH_COORDS.lat, CHURCH_COORDS.lng);
                setSelectedItem({
                  type: 'church',
                  data: {
                    name: 'Iglesia Jerusalén Central',
                    latitude: CHURCH_COORDS.lat,
                    longitude: CHURCH_COORDS.lng,
                    address: 'E25 y Av. 17 de Septiembre, Milagro, Ecuador',
                    description: 'Sede principal de la congregación de la Iglesia Jerusalén. Centro de adoración, comunión, discipulado y desarrollo de ministerios estratégicos.'
                  }
                });
              }}
              className="w-11 h-11 bg-primary rounded-full border-2 border-gold shadow-xl shadow-gold/30 flex items-center justify-center cursor-pointer transition-all hover:scale-115 group relative z-10"
            >
              <MapPin size={22} className="text-gold fill-gold/20" />
              <div className="absolute top-12 bg-slate-900 border border-slate-800 text-[10px] px-2.5 py-1 rounded-xl shadow-xl text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                Iglesia Jerusalén Central
              </div>
            </div>
          </Marker>
        )}

        {showCells && cells.filter(c => c.latitude != null && c.longitude != null).map(cell => (
          <Marker key={cell.id} longitude={cell.longitude} latitude={cell.latitude} anchor="bottom">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                focusLocation(cell.latitude, cell.longitude);
                setSelectedItem({ type: 'cell', data: cell });
              }}
              className="w-9 h-9 bg-white dark:bg-slate-900 rounded-full border-2 border-emerald-500 shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-115 group relative"
            >
              <Compass size={16} className="text-emerald-600 animate-spin-slow" />
              <div className="absolute top-10 bg-slate-900 border border-slate-850 text-[10px] p-2.5 rounded-xl shadow-xl text-slate-200 font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 space-y-0.5 pointer-events-none">
                <p className="font-bold text-white leading-none">{cell.name}</p>
                <p className="text-[9px] text-slate-400">Sector: {cell.sector || 'General'}</p>
                {cell.profiles && (
                  <p className="text-[9px] text-emerald-400 font-bold">Líder: {cell.profiles.first_name} {cell.profiles.last_name}</p>
                )}
              </div>
            </div>
          </Marker>
        ))}

        {showMembers && visiblePoints.map((point, idx) => {
          const [longitude, latitude] = point.geometry.coordinates;
          const { cluster, point_count: pointCount, member } = point.properties;

          if (cluster) {
            let sizeClass = 'w-9 h-9 bg-blue-500/90 ring-4 ring-blue-500/35';
            if (pointCount > 50) sizeClass = 'w-12 h-12 bg-rose-600/95 ring-4 ring-rose-600/35';
            else if (pointCount > 15) sizeClass = 'w-10 h-10 bg-amber-500/95 ring-4 ring-amber-500/35';

            return (
              <Marker key={`cluster-${point.id || idx}`} longitude={longitude} latitude={latitude} anchor="center">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (superclusterInstance) {
                      try {
                        const nextZoom = superclusterInstance.getClusterExpansionZoom(point.properties.cluster_id);
                        const targetZoom = Math.min(Math.max(nextZoom, Math.ceil(viewState.zoom + 1)), 20);
                        mapRef.current?.flyTo({ center: [longitude, latitude], zoom: targetZoom, duration: 1000, essential: true });
                      } catch (err) {
                        mapRef.current?.flyTo({ center: [longitude, latitude], zoom: Math.min(viewState.zoom + 2, 20), duration: 1000, essential: true });
                      }
                    }
                  }}
                  className={`${sizeClass} rounded-full text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-lg transition-all hover:scale-110 select-none border border-white/20`}
                >
                  {pointCount}
                </div>
              </Marker>
            );
          }

          return (
            <Marker key={`member-${member.id}`} longitude={longitude} latitude={latitude} anchor="bottom">
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem({ type: 'member', data: member });
                  mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 16, duration: 1000, essential: true });
                }}
                className="w-7.5 h-7.5 bg-white dark:bg-slate-900 rounded-full border-2 border-blue-500 dark:border-church-gold shadow-md flex items-center justify-center cursor-pointer transition-all hover:scale-120 group relative"
              >
                {member.photo_url ? (
                  <img loading="lazy" src={member.photo_url} alt="" className="w-full h-full rounded-full object-cover animate-fadeIn" />
                ) : (
                  <span className="text-[9px] font-bold text-blue-600 dark:text-church-gold-bright uppercase">
                    {member.first_name[0]}{member.last_name[0]}
                  </span>
                )}
                <div className="absolute top-7 bg-slate-900 border border-slate-850 text-[10px] p-2.5 rounded-xl shadow-xl text-slate-350 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  <p className="font-bold text-white">{member.first_name} {member.last_name}</p>
                  {member.phone && (
                    <p className="text-[9px] flex items-center gap-1 mt-0.5 text-emerald-400 font-semibold">
                      <Phone size={8} /> {member.phone}
                    </p>
                  )}
                </div>
              </div>
            </Marker>
          );
        })}

        {showOtherChurches && locations.filter(l => l.lat != null && l.lng != null).map(loc => (
          <Marker key={loc.id} longitude={loc.lng} latitude={loc.lat} anchor="bottom">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                focusLocation(loc.lat, loc.lng);
                setSelectedItem({ type: 'location', data: loc });
              }}
              className="w-9 h-9 bg-white dark:bg-slate-900 rounded-full border-2 border-indigo-500 shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-115 group relative"
            >
              {loc.icon_type === 'emoji' ? (
                <span className="text-lg">{loc.icon_value}</span>
              ) : (
                <div
                  className="w-5 h-5 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full text-indigo-600"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(loc.icon_value, { USE_PROFILES: { svg: true } }) }}
                />
              )}
              <div className="absolute top-10 bg-slate-900 border border-slate-850 text-[10px] p-2 rounded-xl shadow-xl text-slate-200 font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                <p className="font-bold text-white leading-none">{loc.name}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{loc.address_street || 'Sin dirección'}</p>
              </div>
            </div>
          </Marker>
        ))}
      </Map>
    </>
  );
};
