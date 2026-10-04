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

  // YOLO segmentation & fusion properties (actual runtime inference results only)
  yoloMaskCoordinates?: [number, number][];
  yoloConfidence?: number;
  yoloIoU?: number;
  alignmentScore?: number;
  dataFusionStatus?: 'ALIGNED' | 'MINOR_OFFSET' | 'MISMATCH' | 'YOLO_ONLY' | 'OSM_ONLY';
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
