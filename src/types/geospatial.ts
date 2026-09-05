export type HeightSource =
  | 'LiDAR'
  | 'DSM'
  | 'Photogrammetry'
  | 'OSM'
  | 'Estimated / Demo';

export interface BuildingFootprint {
  id: string; // e.g. "BLD-PUN-00027"
  name?: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  height: number;
  heightSource: HeightSource;
  floors?: number;
  source: string; // "OpenStreetMap — Building Footprints"
  confidence?: number;
  centroid: [number, number]; // [lon, lat] in WGS84
  properties?: Record<string, any>;
  associatedPropertyId?: string; // links to demo property like "prop-pune-01"
}

export interface Parcel {
  id: string; // e.g. "PRC-PUN-0042-1A"
  surveyNumber: string;
  subDivision?: string;
  geometry: GeoJSON.Polygon;
  ulpin?: string;
  source: string; // "Government GIS / Cadastral Map (Demo)"
  status: 'DEMO' | 'OFFICIAL';
  areaSqM?: number;
  wardNumber?: string;
}

export interface ElevationPoint {
  latitude: number;
  longitude: number;
  elevation: number;
  source: string;
}

export type DataSourceStatus =
  | 'CONNECTED'
  | 'NOT_INTEGRATED'
  | 'REFERENCE'
  | 'DEMO'
  | 'PLANNED'
  | 'SIMULATED'
  | 'FAILED'
  | 'NOT_CONFIGURED';

export interface DataSourceMetadata {
  id: string;
  name: string;
  provider: string;
  purpose: string;
  dataType: string;
  status: DataSourceStatus;
  attribution: string;
  description: string;
  isOfficialGovt: boolean;
}

export type PipelineStageStatus =
  | 'LOADED'
  | 'AVAILABLE'
  | 'DEMO'
  | 'NOT_INTEGRATED'
  | 'PLANNED'
  | 'CONNECTED'
  | 'FAILED';

export interface PipelineStage {
  id: string;
  name: string;
  status: PipelineStageStatus;
  detail: string;
  icon: string;
}

export interface PipelineStatus {
  validationStatus: 'PASS' | 'FAIL';
  buildingsCount: number;
  parcelsCount: number;
  coordinateReference: string;
  stages: PipelineStage[];
}

export interface DataProvenance {
  buildingId: string;
  buildingName?: string;
  geometrySource: string;
  heightSource: string;
  elevationSource: string;
  parcelSource: string;
  ownershipSource: string;
  satelliteScene?: SentinelScene;
}

export interface SentinelScene {
  id: string;
  name: string;
  collection: string;
  acquisitionDate: string;
  originDate?: string;
  cloudCover?: number;
  footprint?: GeoJSON.Geometry;
  tileId?: string;
}

export interface BhuvanLayerConfig {
  name: string;
  url: string;
  layer: string;
  format: string;
  visible: boolean;
}

export interface ApiHealth {
  provider: string;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'FAILED' | 'NOT_INTEGRATED' | 'REFERENCE' | 'DEMO' | 'PLANNED' | 'SIMULATED';
  lastChecked?: string;
  message?: string;
  responseTimeMs?: number;
}
