/**
 * Real Underground Infrastructure Types
 * =====================================
 * Models municipal subsurface infrastructure (sewer, storm drain, water, electrical, gas, telecom, etc.)
 * queried from authoritative sources (LA County Public Works, City of LA GeoHub) with strict provenance tracking.
 */

export type UndergroundType =
  | 'SEWER'
  | 'STORM_DRAIN'
  | 'WATER'
  | 'ELECTRIC'
  | 'GAS'
  | 'TELECOM'
  | 'TUNNEL'
  | 'SUBWAY'
  | 'BASEMENT'
  | 'PARKING'
  | 'OTHER';

export type UndergroundProvenance =
  | 'REAL'
  | 'DERIVED'
  | 'ESTIMATED'
  | 'DEMO'
  | 'UNAVAILABLE';

export type SpatialRelationship =
  | 'INTERSECTS_BUILDING'
  | 'WITHIN_AOI'
  | 'NEAR_BUILDING'
  | 'OUTSIDE_AOI';

export interface UndergroundFeature {
  id: string;
  type: UndergroundType;
  name?: string;
  geometry: GeoJSON.Geometry;
  depth?: number; // In meters below ground (ONLY populated if authoritatively known)
  elevation?: number; // In meters AMSL
  diameter?: number; // In inches or millimeters
  material?: string;
  status?: string;
  source: string;
  sourceAuthority: string;
  sourceUrl: string;
  sourceCrs: string;
  targetCrs: string;
  confidence: number;
  provenance: UndergroundProvenance;
  verticalAccuracy?: 'AVAILABLE' | 'ESTIMATED' | 'UNAVAILABLE';
  verticalNote?: string;
  estimatedVisualDepth?: number;
  relationship: SpatialRelationship;
  distanceToBuildingMeters?: number;
  nearestBuildingPoint?: [number, number];
  nearestFeaturePoint?: [number, number];
  attributes?: Record<string, unknown>;
}

export interface UndergroundQueryResult {
  aoiBounds: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  buildingId: string;
  buildingCenter: {
    latitude: number;
    longitude: number;
  };
  sourceAuthority: string;
  sourceService: string;
  sourceUrl: string;
  sourceCrs: string;
  targetCrs: string;
  queryTimestamp: string;
  featuresRequested: number;
  featuresReturned: number;
  featuresIntersectingAoi: number;
  featuresRendered: number;
  realCount: number;
  estimatedCount: number;
  demoCount: number;
  unavailableCount: number;
  hasRealFeaturesAtAoi: boolean;
  statusText: string;
  nearestRealDistanceMeters?: number;
  nearestRealAssetId?: string;
  nearestFeatureDistanceMeters?: number;
  features: UndergroundFeature[];
}

export interface UndergroundInspectionState {
  isUndergroundMode: boolean;
  activeFeature: UndergroundFeature | null;
  filterType: UndergroundType | 'ALL';
  showLabels: boolean;
  showBuildingReference: boolean;
  cameraSubterranean: boolean;
}
