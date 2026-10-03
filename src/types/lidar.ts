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
  buildingIndices?: Uint8Array; // uint8 building index matching LABuildingRecord.buildingIndex
  centerLon?: number;
  centerLat?: number;
  centerAlt?: number;
}

export type LidarDatasetId = 'la_south_park' | 'utah_capitol';

export interface FloorInspectionOptions {
  isInspectionMode: boolean; // hide roof/ghost exterior
  isExplodedView: boolean; // separate floors vertically
  explodeSpacingMeters: number; // 2.0 to 6.0m
  floorHeightAssumption: number; // 3.0, 3.5, 4.0m
}

export interface LABuildingLevel {
  level: number;
  floorName: string;
  zMinAMSL: number;
  zMaxAMSL: number;
  heightMeters: number;
}

export interface LABuildingRecord {
  id: string;
  osmWayId: number;
  buildingIndex?: number;
  name: string;
  buildingType: string;
  footprintAreaSqM: number;
  pointCount: number;
  localGroundAMSL: number;
  peakElevationAMSL: number;
  mainRoofAMSL?: number;
  derivedHeightMeters: number;
  tagHeight: number | null;
  tagLevels: number | null;
  inferredFloors: number;
  center: { latitude: number; longitude: number };
  levels: LABuildingLevel[];
  footprintCoordinates: [number, number][];
}

export interface LADatasetMetadata {
  datasetName: string;
  location: {
    city: string;
    state: string;
    country: string;
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
    center: { latitude: number; longitude: number; elevation: number };
  };
  crs: {
    sourceCRS: string;
    targetCRS: string;
    verticalDatum: string;
  };
  lidarSource: {
    provider: string;
    collection: string;
    resolution: string;
    totalRawPoints: number;
    visualizedPoints: number;
    globalGroundDatumAMSL: number;
    elevationRange: { min: number; max: number };
  };
  reconstruction: {
    status: string;
    method: string;
    buildingsReconstructed: number;
    meshVertices: number;
    meshFaces: number;
    modelFile: string;
    pointsFile: string;
  };
  buildings: LABuildingRecord[];
}
