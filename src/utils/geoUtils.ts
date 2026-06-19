import type { Cell } from '../types';

/**
 * Generates a GeoJSON Polygon Feature representing a circle on the Earth's surface.
 * @param center The [longitude, latitude] coordinates of the circle's center.
 * @param radiusInMeters The radius of the circle in meters.
 * @param steps The number of coordinates to generate for the polygon boundary (default 64).
 */
export function createGeoJSONCircle(
  center: [number, number],
  radiusInMeters: number,
  steps: number = 64
): any {
  const [longitude, latitude] = center;
  const coordinates: [number, number][] = [];
  const earthRadius = 6371000; // Earth's mean radius in meters

  const latRad = (latitude * Math.PI) / 180;
  const lonRad = (longitude * Math.PI) / 180;
  const dByR = radiusInMeters / earthRadius;

  for (let i = 0; i <= steps; i++) {
    const bearing = (i * 2 * Math.PI) / steps;

    const latStepRad = Math.asin(
      Math.sin(latRad) * Math.cos(dByR) +
        Math.cos(latRad) * Math.sin(dByR) * Math.cos(bearing)
    );

    const lonStepRad =
      lonRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(dByR) * Math.cos(latRad),
        Math.cos(dByR) - Math.sin(latRad) * Math.sin(latStepRad)
      );

    const latStepDeg = (latStepRad * 180) / Math.PI;
    const lonStepDeg = (lonStepRad * 180) / Math.PI;

    coordinates.push([lonStepDeg, latStepDeg]);
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates]
    }
  };
}

/**
 * Generates a GeoJSON FeatureCollection containing circular polygons representing the coverage areas
 * of the growth cells.
 * @param cells The list of growth cells.
 * @param radiusInMeters The coverage radius (defaults to 500m).
 */
export function generateCoverageGeoJSON(cells: Cell[], radiusInMeters: number = 500): any {
  const features = cells
    .filter(c => c.latitude !== null && c.longitude !== null && c.latitude !== undefined && c.longitude !== undefined)
    .map(c => {
      const circleFeature = createGeoJSONCircle([c.longitude, c.latitude], radiusInMeters);
      return {
        ...circleFeature,
        properties: {
          cellId: c.id,
          cellName: c.name,
          sector: c.sector || 'General'
        }
      };
    });

  return {
    type: 'FeatureCollection',
    features
  };
}
