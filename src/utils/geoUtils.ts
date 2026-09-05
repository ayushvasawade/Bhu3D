/**
 * Geospatial Utility Module for TerraID 3D
 * Standardized on WGS84 / EPSG:4326
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  featuresCount: number;
}

/**
 * Validates GeoJSON FeatureCollection structure and coordinates
 */
export function validateGeoJson(data: any, expectedType: 'Polygon' | 'MultiPolygon' | 'Any' = 'Any'): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid GeoJSON: Root must be an object'], featuresCount: 0 };
  }

  if (data.type !== 'FeatureCollection') {
    errors.push(`Expected FeatureCollection, received type: ${data.type}`);
  }

  if (!Array.isArray(data.features)) {
    errors.push('FeatureCollection missing features array');
    return { isValid: false, errors, featuresCount: 0 };
  }

  let validCount = 0;
  data.features.forEach((feature: any, index: number) => {
    if (!feature || typeof feature !== 'object') {
      errors.push(`Feature [${index}] is malformed`);
      return;
    }

    if (feature.type !== 'Feature') {
      errors.push(`Feature [${index}] has invalid type: ${feature.type}`);
    }

    const geometry = feature.geometry;
    if (!geometry || typeof geometry !== 'object') {
      errors.push(`Feature [${index}] missing geometry object`);
      return;
    }

    if (expectedType !== 'Any' && geometry.type !== expectedType && geometry.type !== 'MultiPolygon') {
      errors.push(`Feature [${index}] geometry type mismatch: expected ${expectedType}, found ${geometry.type}`);
    }

    // Validate coordinate bounds for WGS84 (lon: -180 to 180, lat: -90 to 90)
    if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
      errors.push(`Feature [${index}] has empty coordinates array`);
      return;
    }

    // Inspect first ring
    const ring = geometry.type === 'MultiPolygon' ? geometry.coordinates[0]?.[0] : geometry.coordinates[0];
    if (Array.isArray(ring)) {
      for (const pt of ring) {
        if (Array.isArray(pt) && pt.length >= 2) {
          const [lon, lat] = pt;
          if (typeof lon !== 'number' || typeof lat !== 'number' || isNaN(lon) || isNaN(lat)) {
            errors.push(`Feature [${index}] has non-numeric coordinates: [${lon}, ${lat}]`);
            break;
          }
          if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
            errors.push(`Feature [${index}] coordinates out of WGS84 range: [${lon}, ${lat}]`);
            break;
          }
        }
      }
    }

    validCount++;
  });

  return {
    isValid: errors.length === 0,
    errors,
    featuresCount: validCount
  };
}

/**
 * Calculates centroid of a polygon ring using geometric average [lon, lat]
 */
export function calculatePolygonCentroid(ring: number[][]): [number, number] {
  if (!ring || ring.length === 0) return [0, 0];

  let sumLon = 0;
  let sumLat = 0;
  const count = ring.length;

  for (let i = 0; i < count; i++) {
    sumLon += ring[i][0];
    sumLat += ring[i][1];
  }

  return [sumLon / count, sumLat / count];
}

/**
 * Calculates WGS84 bounding box [minLon, minLat, maxLon, maxLat]
 */
export function calculateBoundingBox(coordinates: number[][]): [number, number, number, number] {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (const [lon, lat] of coordinates) {
    if (lon < minLon) minLon = lon;
    if (lat < minLat) minLat = lat;
    if (lon > maxLon) maxLon = lon;
    if (lat > maxLat) maxLat = lat;
  }

  return [minLon, minLat, maxLon, maxLat];
}

/**
 * Calculates Haversine distance in meters between two [lon, lat] points
 */
export function calculateDistanceMeters(coord1: [number, number], coord2: [number, number]): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimates number of floors based on height (standard residential floor-to-floor: ~3.1 meters)
 */
export function estimateFloorsFromHeight(heightMeters: number, floorHeightMeters = 3.1): number {
  if (!heightMeters || heightMeters <= 0) return 1;
  return Math.max(1, Math.round(heightMeters / floorHeightMeters));
}
