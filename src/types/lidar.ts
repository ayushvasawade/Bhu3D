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
  buildingIndices?: Uint8Array;
  centerLon?: number;
  centerLat?: number;
  centerAlt?: number;
}

export interface FloorInspectionOptions {
  isInspectionMode: boolean;
  isExplodedView: boolean;
  explodeSpacingMeters: number;
  floorHeightAssumption: number;
}

export interface LABuildingLevel {
  level: number;
  floorName: string;
  zMinAMSL: number;
  zMaxAMSL: number;
  heightMeters: number;
}

/**
 * Authoritative 3D Floor Volume representing vertical strata
 */
export interface BuildingFloor {
  id: string;
  buildingId: string;
  floorNumber: number;
  floorCode: string;
  floorName: string;
  baseElevation: number; // Base elevation in meters AMSL
  topElevation: number;  // Ceiling elevation in meters AMSL
  height: number;        // Floor-to-floor height in meters
  footprint: [number, number][]; // [lon, lat][]
  volume: number;        // Footprint area * height in m³
  confidence: number;    // Multi-source confidence score (0 - 100)
  provenance: 'ESTIMATED' | 'DERIVED' | 'REAL';
  syntheticUnitId: string; // DEMO / PROTOTYPE unit reference
  unitStatus: 'DEMO / PROTOTYPE';
}

export interface FloorGenerationResult {
  floors: BuildingFloor[];
  floorCount: number;
  floorCountStatus: 'ESTIMATED';
  floorGeometryStatus: 'DERIVED';
  source: 'REAL LiDAR + OSM';
  averageFloorHeight: number;
  baseGroundAMSL: number;
  roofAMSL: number;
  lidarHeightMeters: number;
  ndsmP95Height?: number;
  confidenceScore: number;
  methodology: string;
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

  // True LiDAR-Driven 3D Fidelity Metrics & Morphology
  architecture?: BuildingArchitecture;
  fidelity3D?: LidarMesh3DFidelity;
  heightErrorMap25D?: HeightErrorMap25D;
  topology?: BuildingTopology;

  // Real geometric validation metrics
  validation?: LABuildingValidation;

  // Real LiDAR DEM / DSM / nDSM Elevation Foundation Metrics
  elevationMetrics?: BuildingElevationMetrics;

  // YOLO segmentation & fusion properties (actual runtime inference results only)
  yoloMaskCoordinates?: [number, number][];
  yoloConfidence?: number;
  yoloIoU?: number;
  alignmentScore?: number;
  dataFusionStatus?: 'ALIGNED' | 'MINOR_OFFSET' | 'MISMATCH' | 'YOLO_ONLY' | 'OSM_ONLY' | 'BOUNDARY_CLIPPED';
  // LiDAR Tile Coverage Status (boundary clipping detection)
  lidarCoverageStatus?: LidarCoverageStatus;
  coverageRatio?: number;
  lidarCoverageNote?: string;
}

export type LidarCoverageStatus = 'FULLY_COVERED' | 'BOUNDARY_CLIPPED' | 'OUTSIDE_LIDAR';

export type ElevationMode = 'none' | 'dem' | 'dsm' | 'ndsm';

export interface BuildingElevationMetrics {
  demGroundAMSL: number;
  dsmRoofAMSL: number;
  lidarHeightMeters: number;
  ndsmMinHeight: number;
  ndsmMedianHeight: number;
  ndsmMaxHeight: number;
  ndsmP95Height: number;
  heightDifference: number;
  elevationSource: string;
  elevationProvenance: string;
  confidence: number;
  sampledCells: number;
}

export interface LidarMesh3DFidelity {
  meanDistanceMeters: number;
  medianDistanceMeters: number;
  rmseMeters: number;
  p90DistanceMeters: number;
  p95DistanceMeters: number;
  maxDistanceMeters: number;
  pctWithin025m: number;
  pctWithin050m: number;
  pctWithin100m: number;
  pctWithin200m: number;
  totalValidLidarPoints: number;
}

export interface HeightErrorMap25D {
  meanDeltaZMeters: number;
  rmseDeltaZMeters: number;
  p95AbsDeltaZMeters: number;
  pctFaithfulGreen: number;
  pctModerateYellow: number;
  pctLargeRed: number;
  totalGridCells: number;
}

export interface DetectedRoofPlane {
  planeIndex: number;
  elevationAMSL: number;
  heightAboveGroundMeters: number;
  areaSqM: number;
  pointCount: number;
  tiltDegrees: number;
  normal: [number, number, number];
  residualRMSE: number;
  isSloped: boolean;
}

export interface BuildingArchitecture {
  classification: 'COMPLEX_SLOPED_FACETS' | 'MULTI_TIER_STEPPED_DECKS' | 'MONOLITHIC_PLANAR_DECK';
  detectedPlaneCount: number;
  planes: DetectedRoofPlane[];
}

export interface BuildingTopology {
  isWatertight: boolean;
  meshVertices: number;
  meshFaces: number;
  volumeCubicMeters?: number | null;
}

export interface LABuildingTierInfo {
  tierName: string;
  elevationAMSL: number;
  heightAboveGroundMeters: number;
  areaSqM: number;
  pointCount: number;
  residualRMSE: number;
}

export interface LABuildingValidation {
  osmAreaSqM: number;
  meshAreaSqM: number;
  osmMeshIoU: number;
  centroidOffsetMeters: number;
  lidarMeasuredHeightMeters: number;
  meshHeightMeters: number;
  heightErrorMeters: number;
  lidarRoofPoints: number;
  lidarPointsUsed: number;
  roofElevationRMSE: number;
  roofClassification: 'FLAT_MONOLITHIC' | 'FLAT_STEPPED_TIERS' | 'SLOPED_RANSAC';
  isWatertight: boolean;
  tierCount: number;
  tiers: LABuildingTierInfo[];
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
  elevationPipeline?: ElevationPipelineMetadata;
  lidarCoverageSummary?: {
    boundingBox: { west: number; south: number; east: number; north: number };
    totalBuildings: number;
    fullyCovered: number;
    boundaryClipped: number;
    outsideLidar: number;
  };
  buildings: LABuildingRecord[];
}

export interface ElevationPipelineMetadata {
  status: string;
  pipelineVersion: string;
  method: string;
  groundClassification: string;
  demResolutionMeters: number;
  dsmResolutionMeters: number;
  verticalDatum: string;
  provenance: string;
  disclaimer: string;
  updatedAt: string;
}
