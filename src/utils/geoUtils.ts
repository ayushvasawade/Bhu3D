/**
 * Geospatial Utility Module for TerraID 3D
 * Standardized on WGS84 / EPSG:4326
 */
import {
  LABuildingRecord,
  BuildingFloor,
  FloorGenerationResult,
  FloorInspectionOptions,
  LidarCoverageStatus
} from '../types/lidar';

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

export const USGS_3DEP_LIDAR_BOUNDS = {
  west: -118.263944,
  south: 34.035205,
  east: -118.257861,
  north: 34.038985
};

export function checkLidarBoundaryCoverage(
  coordinates: [number, number][],
  existingStatus?: import('../types/lidar').LidarCoverageStatus,
  existingRatio?: number,
  existingNote?: string
): {
  status: import('../types/lidar').LidarCoverageStatus;
  coverageRatio: number;
  note: string;
} {
  if (existingStatus) {
    return {
      status: existingStatus,
      coverageRatio: existingRatio ?? (existingStatus === 'FULLY_COVERED' ? 1.0 : 0.5),
      note:
        existingNote ??
        (existingStatus === 'BOUNDARY_CLIPPED'
          ? 'OSM footprint extends beyond available USGS LiDAR tile.'
          : 'Building footprint is 100% within USGS LiDAR coverage.')
    };
  }

  if (!coordinates || coordinates.length < 3) {
    return { status: 'OUTSIDE_LIDAR', coverageRatio: 0, note: 'Coordinates unavailable' };
  }

  let insideCount = 0;
  for (const [lon, lat] of coordinates) {
    if (
      lon >= USGS_3DEP_LIDAR_BOUNDS.west &&
      lon <= USGS_3DEP_LIDAR_BOUNDS.east &&
      lat >= USGS_3DEP_LIDAR_BOUNDS.south &&
      lat <= USGS_3DEP_LIDAR_BOUNDS.north
    ) {
      insideCount++;
    }
  }

  const ratio = insideCount / coordinates.length;
  if (ratio >= 0.99) {
    return {
      status: 'FULLY_COVERED',
      coverageRatio: 1.0,
      note: 'Building footprint is 100% within USGS LiDAR coverage.'
    };
  } else if (ratio > 0) {
    return {
      status: 'BOUNDARY_CLIPPED',
      coverageRatio: Number(ratio.toFixed(2)),
      note: `OSM footprint extends beyond available USGS LiDAR tile (${Math.round(ratio * 100)}% inside tile). Truncation at tile edge causes apparent IoU and centroid offset.`
    };
  } else {
    return {
      status: 'OUTSIDE_LIDAR',
      coverageRatio: 0,
      note: 'Building footprint lies outside available USGS LiDAR tile.'
    };
  }
}

/**
 * Approximate polygon ground footprint area in square meters (spherical projection)
 */
export function calculatePolygonAreaSqM(coords: number[][]): number {
  if (!coords || coords.length < 3) return 0;

  let area = 0;
  const n = coords.length;
  const toRad = Math.PI / 180;
  const R = 6378137; // WGS84 Earth authalic radius in meters

  for (let i = 0; i < n; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % n];
    const lon1 = p1[0] * toRad;
    const lat1 = p1[1] * toRad;
    const lon2 = p2[0] * toRad;
    const lat2 = p2[1] * toRad;

    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = (Math.abs(area) * R * R) / 4.0;
  return Math.round(area * 10) / 10;
}

/**
 * Authoritative Vertical Floor Decomposition Engine
 * Computes physically consistent 3D floor volumes using real USGS LiDAR DEM/DSM/nDSM and OSM footprints.
 *
 * DO NOT claim that LiDAR detected internal floor slabs or actual apartment unit boundaries.
 * Floor count: ESTIMATED
 * Floor geometry: DERIVED
 * Source: REAL LiDAR + OSM
 */
export function generateBuildingFloors(
  building: LABuildingRecord,
  options?: Partial<FloorInspectionOptions>
): FloorGenerationResult {
  // STEP 1: Use existing DEM / DSM / nDSM metrics
  const demGroundAMSL = building.elevationMetrics?.demGroundAMSL ?? building.localGroundAMSL;
  const dsmRoofAMSL = building.elevationMetrics?.dsmRoofAMSL ?? (building.mainRoofAMSL || building.peakElevationAMSL);
  const lidarHeightMeters = building.elevationMetrics?.lidarHeightMeters ?? building.derivedHeightMeters;
  const ndsmP95Height = building.elevationMetrics?.ndsmP95Height;

  // Actual building height: calibrate with nDSM P95 or derived height (filtering local roof spikes)
  const actualHeight = Math.max(
    2.5,
    ndsmP95Height && ndsmP95Height > 2.0
      ? ndsmP95Height
      : lidarHeightMeters && lidarHeightMeters > 2.0
      ? lidarHeightMeters
      : building.derivedHeightMeters || Math.max(2.5, dsmRoofAMSL - demGroundAMSL)
  );

  const baseGround = demGroundAMSL;
  const roofAMSL = Number((baseGround + actualHeight).toFixed(2));

  // STEP 2: Intelligent floor count determination based on building metrics (not blindly 3.5m)
  let count: number;
  let derivationMethod = '';

  const customFloorH = options?.floorHeightAssumption;
  const hasUserCustomFloorH =
    customFloorH !== undefined && customFloorH > 0 && Math.abs(customFloorH - 3.5) > 0.05;

  if (hasUserCustomFloorH) {
    // User explicitly customized the floor height assumption
    count = Math.max(1, Math.round(actualHeight / customFloorH));
    derivationMethod = `User custom floor height (${customFloorH.toFixed(2)}m/floor)`;
  } else if (building.tagLevels && building.tagLevels > 0) {
    // Authoritative OSM building:levels tag exists (e.g. 10 levels for LA Public Works)
    count = building.tagLevels;
    const avgH = actualHeight / count;
    derivationMethod = `OSM verified story count (${count} levels @ ${avgH.toFixed(2)}m/floor)`;
  } else if (building.inferredFloors && building.inferredFloors > 0) {
    // Pre-computed inferred floors
    count = building.inferredFloors;
    const avgH = actualHeight / count;
    derivationMethod = `LiDAR height & morphological classification (${count} floors @ ${avgH.toFixed(2)}m/floor)`;
  } else {
    // Adaptive architectural floor height based on building type
    const bldType = (building.buildingType || '').toLowerCase();
    let targetH = 3.3; // Default residential/commercial baseline
    if (
      bldType.includes('commercial') ||
      bldType.includes('retail') ||
      bldType.includes('office') ||
      bldType.includes('public')
    ) {
      targetH = 3.8;
    } else if (bldType.includes('industrial') || bldType.includes('warehouse')) {
      targetH = 5.0;
    } else if (bldType.includes('apartments') || bldType.includes('residential')) {
      targetH = 3.1;
    }
    count = Math.max(1, Math.round(actualHeight / targetH));
    const avgH = actualHeight / count;
    derivationMethod = `Estimated from building type (${bldType || 'urban structure'}) & LiDAR height (${avgH.toFixed(2)}m/floor)`;
  }

  const averageFloorHeight = Number((actualHeight / count).toFixed(2));
  const explodeSpacing = options?.isExplodedView ? (options.explodeSpacingMeters || 2.0) : 0;

  // Confidence calculation (LiDAR coverage + DEM/DSM foundation + OSM verification)
  const pointDensityScore = building.pointCount > 200 ? 30 : building.pointCount > 50 ? 20 : 10;
  const elevationMetricScore = building.elevationMetrics ? 30 : 20;
  const tagLevelsScore = (building.tagLevels && building.tagLevels > 0) ? 25 : 15;
  const clippingPenalty = building.lidarCoverageStatus === 'BOUNDARY_CLIPPED' ? -15 : 0;
  const baseConfidence = Math.min(
    95,
    Math.max(50, 10 + pointDensityScore + elevationMetricScore + tagLevelsScore + clippingPenalty)
  );

  // Footprint coordinates & area
  const footprint = building.footprintCoordinates || [];
  const footprintArea = building.footprintAreaSqM || calculatePolygonAreaSqM(footprint);
  const cleanBldId = building.id.replace(/[^a-zA-Z0-9]/g, '');

  // STEP 3: Generate each floor strata (Building ├── Floor 1 ... └── Floor N)
  const floors: BuildingFloor[] = [];

  for (let i = 0; i < count; i++) {
    const floorNumber = i + 1;
    const floorCode = `F${String(floorNumber).padStart(2, '0')}`;
    const floorName = floorNumber === 1 ? 'Floor 1 (Ground)' : `Floor ${floorNumber}`;

    const baseElevation = Number((baseGround + i * averageFloorHeight + i * explodeSpacing).toFixed(2));
    const topElevation = Number((baseGround + (i + 1) * averageFloorHeight + i * explodeSpacing).toFixed(2));
    const height = Number((topElevation - baseElevation).toFixed(2));
    const volume = Math.round(footprintArea * height);

    // Floor-specific confidence variation: Ground & roof have direct laser return anchors
    let floorConfidence = baseConfidence;
    if (floorNumber === 1 || floorNumber === count) {
      floorConfidence = Math.min(95, baseConfidence + 2);
    } else {
      floorConfidence = Math.max(50, baseConfidence - 2);
    }

    const syntheticUnitId = `BH3D-SPARK-${cleanBldId}-${floorCode}-U01`;

    floors.push({
      id: `${building.id}-${floorCode}`,
      buildingId: building.id,
      floorNumber,
      floorCode,
      floorName,
      baseElevation,
      topElevation,
      height,
      footprint,
      volume,
      confidence: floorConfidence,
      provenance: 'ESTIMATED',
      syntheticUnitId,
      unitStatus: 'DEMO / PROTOTYPE'
    });
  }

  return {
    floors,
    floorCount: count,
    floorCountStatus: 'ESTIMATED',
    floorGeometryStatus: 'DERIVED',
    source: 'REAL LiDAR + OSM',
    averageFloorHeight,
    baseGroundAMSL: baseGround,
    roofAMSL,
    lidarHeightMeters: actualHeight,
    ndsmP95Height,
    confidenceScore: baseConfidence,
    methodology: derivationMethod
  };
}

