export interface GeographicCoordinates {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  country: string;
  bounds: {
    southWest: [number, number];
    northEast: [number, number];
  };
}

export interface LidarSourceDetails {
  provider: string;
  datasetName: string;
  datasetId: string;
  datasetUrl: string;
  sampleDownloadUrl?: string;
  attribution: string;
  dataCollectionPeriod: string;
  instrument: string;
}

export interface PointCloudMetrics {
  totalSurveyPoints: number;
  buildingExtractedPoints: number;
  pointDensity: number;
  groundPoints: number;
  noisePoints: number;
  originalCrs: string;
  originalCrsName: string;
  targetCrs: string;
  utmCenter: [number, number];
}

export interface ElevationMetrics {
  baseGroundElevationMeters: number;
  domePeakElevationMeters: number;
  derivedBuildingHeightMeters: number;
  derivedBuildingHeightFeet: number;
  meanRoofElevationMeters?: number;
  footprintAreaSqM?: number;
  footprintPerimeterMeters?: number;
  footprintLengthMeters: number;
  footprintWidthMeters: number;
}

export interface ReconstructionPipelineDetails {
  stages: string[];
  qualityStatus: 'HIGH' | 'MEDIUM' | 'LOW';
  gridResolutionMeters: number;
  verticesCount: number;
  facesCount: number;
  lidarHeightMeters?: number;
  meshHeightMeters?: number;
  heightDifferenceMeters?: number;
  footprintDifferenceSqM?: number;
  rmseErrorMeters: number;
  pointToMeshRmseMeters?: number;
  maeErrorMeters: number;
  maxErrorMeters?: number;
  isWatertight: boolean;
  outputModelFormat: string;
  outputModelFile: string;
  pointCloudStreamFile?: string;
  modelSizeKb: number;
  facadeLimitation: string;
}

export interface EvidenceLayerInfo {
  label: string;
  status: 'REAL' | 'DERIVED' | 'ESTIMATED' | 'DEMO' | 'UNAVAILABLE';
  provider?: string;
  resolution?: string;
  points?: number;
  density?: string;
  method?: string;
  vertices?: number;
  faces?: number;
  quality?: string;
  role: string;
}

export interface EvidenceLayers {
  aerialSatellite: EvidenceLayerInfo;
  lidarScan: EvidenceLayerInfo;
  derivedMesh: EvidenceLayerInfo;
}

export interface RealLidarBuilding {
  buildingName: string;
  description: string;
  geographicLocation: GeographicCoordinates;
  lidarSource: LidarSourceDetails;
  pointCloudMetrics: PointCloudMetrics;
  elevationMetrics: ElevationMetrics;
  reconstructionPipeline: ReconstructionPipelineDetails;
  evidenceLayers?: EvidenceLayers;
  provenanceStatus: 'REAL_DATA';
  dataNotice: string;
}

export type LidarViewMode = 'scan' | 'reconstruction' | 'compare' | 'inspector';
export type LidarCompareSubMode = 'overlay' | 'lidar_only' | 'mesh_only' | 'side_by_side';
export type LidarCameraPreset = 'overview' | 'domeCloseUp' | 'grandSouthPortico' | 'aerialTopDown' | 'frontElevation' | 'sideElevation';
export type PointCloudColorMode = 'rgb' | 'elevation' | 'classification' | 'intensity';

export interface PointCloudRenderOptions {
  pointSize: number;
  colorMode: PointCloudColorMode;
  densityPercentage: number;
  buildingOnly: boolean;
  meshOpacity: number;
}

export interface LidarPointCloudData {
  count: number;
  buildingCount: number;
  positions: Float32Array; // [x, y, z, ...] local ENU
  amslElevations: Float32Array;
  colorsRgb: Uint8Array; // [r, g, b, ...]
  intensities: Uint8Array;
  classifications: Uint8Array;
  isBuilding: Uint8Array;
}
