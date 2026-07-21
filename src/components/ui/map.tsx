import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from 'react';
import ReactMap, {
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  GeolocateControl,
  Source,
  Layer,
  type MapRef as ReactMapGlRef,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { cn } from '@/lib/utils';
import type { FeatureCollection } from 'geojson';

export type MapRef = ReactMapGlRef;

export interface MapStyles {
  light?: string;
  dark?: string;
}

export interface MapProps {
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  styles?: MapStyles;
  projection?: unknown;
  blank?: boolean;
  fadeDuration?: number;
  className?: string;
  children?: React.ReactNode;
  onLoad?: (event: unknown) => void;
  onClick?: (event: unknown) => void;
}

const DEFAULT_MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright';

// Map Context
interface MapContextType {
  mapRef: React.RefObject<ReactMapGlRef | null>;
}
const MapContext = createContext<MapContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useMapInstance = () => {
  const context = useContext(MapContext);
  return context?.mapRef?.current ?? null;
};

// --- Map Component ---
export const Map = forwardRef<MapRef, MapProps>(
  (
    {
      center = [-79.5949891, -2.139188], // Default: Milagro, Ecuador
      zoom = 13,
      pitch = 0,
      bearing = 0,
      styles,
      projection,
      blank = false,
      className,
      children,
      onLoad,
      onClick,
      ...rest
    },
    ref
  ) => {
    const internalRef = useRef<ReactMapGlRef | null>(null);

    useImperativeHandle(ref, () => internalRef.current!, []);

    const mapStyle = blank
      ? {
          version: 8,
          sources: {},
          layers: [
            {
              id: 'background',
              type: 'background',
              paint: { 'background-color': '#111827' },
            },
          ],
        }
      : styles?.light || DEFAULT_MAP_STYLE;

    return (
      <MapContext.Provider value={{ mapRef: internalRef }}>
        <div className={cn('relative h-full w-full overflow-hidden rounded-xl border bg-background shadow-sm', className)}>
          <ReactMap
            ref={internalRef}
            initialViewState={{
              longitude: center[0],
              latitude: center[1],
              zoom,
              pitch,
              bearing,
            }}
            mapStyle={mapStyle as unknown as React.ComponentProps<typeof ReactMap>['mapStyle']}
            projection={projection as unknown as React.ComponentProps<typeof ReactMap>['projection']}
            style={{ width: '100%', height: '100%' }}
            onLoad={onLoad}
            onClick={onClick}
            {...rest}
          >
            {children}
          </ReactMap>
        </div>
      </MapContext.Provider>
    );
  }
);
Map.displayName = 'Map';

// --- MapControls Component ---
export interface MapControlsProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showZoom?: boolean;
  showCompass?: boolean;
  showLocate?: boolean;
  showFullscreen?: boolean;
}

export function MapControls({
  position = 'top-right',
  showZoom = true,
  showCompass = true,
  showLocate = true,
  showFullscreen = true,
}: MapControlsProps) {
  return (
    <>
      {(showZoom || showCompass) && (
        <NavigationControl
          position={position}
          showZoom={showZoom}
          showCompass={showCompass}
        />
      )}
      {showLocate && <GeolocateControl position={position} trackUserLocation />}
      {showFullscreen && <FullscreenControl position={position} />}
    </>
  );
}

// --- MapMarker & Children ---
export interface MapMarkerProps {
  longitude: number;
  latitude: number;
  draggable?: boolean;
  onDrag?: (lngLat: { lng: number; lat: number }) => void;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function MapMarker({
  longitude,
  latitude,
  draggable = false,
  onDrag,
  onClick,
  children,
}: MapMarkerProps) {
  const handleDragEnd = useCallback(
    (e: { lngLat?: { lng: number; lat: number } }) => {
      if (onDrag && e.lngLat) {
        onDrag({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      }
    },
    [onDrag]
  );

  return (
    <Marker
      longitude={longitude}
      latitude={latitude}
      draggable={draggable}
      onDragEnd={handleDragEnd}
      onClick={onClick}
    >
      {children}
    </Marker>
  );
}

export function MarkerContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('relative flex items-center justify-center cursor-pointer', className)}>{children}</div>;
}

export function MarkerLabel({
  position = 'bottom',
  children,
  className,
}: {
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}) {
  const positionClasses = {
    top: '-top-6 left-1/2 -translate-x-1/2 -translate-y-full',
    bottom: '-bottom-6 left-1/2 -translate-x-1/2 translate-y-full',
    left: 'top-1/2 -left-2 -translate-x-full -translate-y-1/2',
    right: 'top-1/2 -right-2 translate-x-full -translate-y-1/2',
  };

  return (
    <div
      className={cn(
        'absolute whitespace-nowrap rounded bg-background/90 px-2 py-0.5 text-xs font-semibold text-foreground shadow-md backdrop-blur border',
        positionClasses[position],
        className
      )}
    >
      {children}
    </div>
  );
}

export function MarkerTooltip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-100 dark:text-gray-900',
        className
      )}
    >
      {children}
    </div>
  );
}

export function MarkerPopup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('p-2 max-w-xs', className)}>{children}</div>;
}

// --- Standalone MapPopup ---
export interface MapPopupProps {
  longitude: number;
  latitude: number;
  onClose?: () => void;
  closeButton?: boolean;
  focusAfterOpen?: boolean;
  closeOnClick?: boolean;
  offset?: number;
  className?: string;
  children?: React.ReactNode;
}

export function MapPopup({
  longitude,
  latitude,
  onClose,
  closeButton = true,
  closeOnClick = false,
  offset = 10,
  className,
  children,
}: MapPopupProps) {
  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      onClose={onClose}
      closeButton={closeButton}
      closeOnClick={closeOnClick}
      offset={offset}
      className={cn('z-20', className)}
    >
      {children}
    </Popup>
  );
}

// --- MapRoute Component ---
export interface MapRouteProps {
  coordinates: [number, number][];
  color?: string;
  width?: number;
  opacity?: number;
  onClick?: () => void;
  id?: string;
}

export function MapRoute({
  coordinates,
  color = '#2563eb',
  width = 5,
  opacity = 0.9,
  id = 'map-route-line',
}: MapRouteProps) {
  const geojsonData: FeatureCollection = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        },
      ],
    }),
    [coordinates]
  );

  if (!coordinates || coordinates.length < 2) return null;

  return (
    <Source id={`${id}-source`} type="geojson" data={geojsonData}>
      <Layer
        id={id}
        type="line"
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
        }}
        paint={{
          'line-color': color,
          'line-width': width,
          'line-opacity': opacity,
        }}
      />
    </Source>
  );
}

// --- MapArc Datum & Component ---
export type MapLayerPaint = Record<string, unknown>;

export interface MapArcDatum {
  id: string | number;
  from: [number, number];
  to: [number, number];
  [key: string]: unknown;
}

export interface MapArcProps<T extends MapArcDatum = MapArcDatum> {
  data: T[];
  paint?: MapLayerPaint;
  hoverPaint?: MapLayerPaint;
  onHover?: (event: { arc: T; longitude: number; latitude: number } | null) => void;
  interactive?: boolean;
}

export function MapArc<T extends MapArcDatum = MapArcDatum>({
  data,
  paint = { 'line-color': '#3b82f6', 'line-width': 2 },
}: MapArcProps<T>) {
  const geojson: FeatureCollection = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: data.map((d) => ({
        type: 'Feature',
        properties: { ...d },
        geometry: {
          type: 'LineString',
          coordinates: [d.from, d.to],
        },
      })),
    };
  }, [data]);

  return (
    <Source type="geojson" data={geojson}>
      <Layer id="map-arc-layer" type="line" paint={paint as unknown as MapLayerPaint} />
    </Source>
  );
}

// --- MapGeoJSON Component ---
export interface MapGeoJSONProps {
  data: FeatureCollection | string;
  fillPaint?: MapLayerPaint;
  linePaint?: MapLayerPaint;
}

export function MapGeoJSON({
  data,
  fillPaint = { 'fill-color': '#3b82f6', 'fill-opacity': 0.2 },
  linePaint = { 'line-color': '#2563eb', 'line-width': 1.5 },
}: MapGeoJSONProps) {
  return (
    <Source type="geojson" data={data}>
      {fillPaint && <Layer id="geojson-fill" type="fill" paint={fillPaint as unknown as MapLayerPaint} />}
      {linePaint && <Layer id="geojson-line" type="line" paint={linePaint as unknown as MapLayerPaint} />}
    </Source>
  );
}

// --- MapClusterLayer Component ---
export interface MapClusterLayerProps {
  data: FeatureCollection | string;
  clusterRadius?: number;
  clusterMaxZoom?: number;
  onPointClick?: (feature: unknown, coordinates: [number, number]) => void;
}

export function MapClusterLayer({
  data,
  clusterRadius = 50,
  clusterMaxZoom = 14,
}: MapClusterLayerProps) {
  return (
    <Source
      type="geojson"
      data={data}
      cluster={true}
      clusterMaxZoom={clusterMaxZoom}
      clusterRadius={clusterRadius}
    >
      <Layer
        id="clusters"
        type="circle"
        filter={['has', 'point_count']}
        paint={{
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            10,
            '#f1f075',
            30,
            '#f28cb1',
          ],
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 30, 40],
        }}
      />
      <Layer
        id="cluster-count"
        type="symbol"
        filter={['has', 'point_count']}
        layout={{
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        }}
      />
      <Layer
        id="unclustered-point"
        type="circle"
        filter={['!', ['has', 'point_count']]}
        paint={{
          'circle-color': '#11b4da',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        }}
      />
    </Source>
  );
}
