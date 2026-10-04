/**
 * YOLO Building Segmentation Types
 * =================================
 * Types for YOLO-based instance segmentation of buildings from satellite/aerial imagery,
 * and fusion with OSM footprints, real LiDAR point clouds, and 3D reconstructed meshes.
 *
 * Design: YOLO is a VALIDATION/REFINEMENT layer — LiDAR remains source of truth for 3D,
 * OSM remains geographic footprint reference.
 */

/** Raw YOLO instance segmentation detection from a single image tile */
export interface YoloBuildingDetection {
  /** Unique detection ID within the processed tile, e.g. "YOLO-DET-001" */
  detectionId: string;

  /** YOLO model class ID (0 = building for our trained model) */
  classId: number;

  /** Class label string */
  classLabel: string;

  /** Detection confidence score from YOLO model (0.0 – 1.0) */
  confidence: number;

  /** Bounding box in normalized image coordinates [x_center, y_center, width, height] (0–1) */
  bboxNormalized: [number, number, number, number];

  /** Bounding box in pixel coordinates [x_min, y_min, x_max, y_max] */
  bboxPixels: [number, number, number, number];

  /** Segmentation mask contour points in pixel coordinates [[x,y], ...] */
  maskPixelCoords: [number, number][];

  /** Segmentation mask contour points converted to WGS84 geographic coordinates [[lon, lat], ...] */
  maskGeoCoords: [number, number][];

  /** Mask area in pixels */
  maskAreaPixels: number;

  /** Estimated footprint area in square meters (from geographic mask) */
  maskAreaSqM: number;

  /** Centroid of the mask in WGS84 [lon, lat] */
  centroidGeo: [number, number];

  /** Source image tile extent used for geo-referencing [minLon, minLat, maxLon, maxLat] */
  imageTileExtent: [number, number, number, number];

  /** Image resolution in pixels [width, height] */
  imageSize: [number, number];
}

/** Result of matching a YOLO detection to an OSM building footprint */
export interface YoloBuildingMatch {
  /** YOLO detection ID */
  yoloDetectionId: string;

  /** Matched OSM building ID (from LABuildingRecord.id), null if no match found */
  osmBuildingId: string | null;

  /** Matched OSM Way ID (from LABuildingRecord.osmWayId) */
  osmWayId: number | null;

  /** LiDAR building index (from LABuildingRecord.buildingIndex) */
  lidarBuildingIndex: number | null;

  /** Intersection over Union between YOLO mask polygon and OSM footprint */
  iou: number;

  /** Distance between YOLO centroid and OSM centroid in meters */
  centroidOffsetMeters: number;

  /** Match confidence (0.0 – 1.0) combining YOLO confidence, IoU, and proximity */
  matchConfidence: number;

  /** Match status */
  matchStatus: 'MATCHED' | 'PARTIAL' | 'NO_MATCH' | 'AMBIGUOUS';
}

/** Per-building alignment validation across all 5 layers */
export interface AlignmentValidation {
  /** Shared Building ID this validation refers to */
  buildingId: string;

  /** IoU between YOLO mask and OSM footprint (0.0 – 1.0) */
  yoloOsmIoU: number;

  /** IoU between OSM footprint and LiDAR XY extent (0.0 – 1.0) */
  osmLidarIoU: number;

  /** Distance between OSM centroid and YOLO centroid in meters */
  osmYoloCentroidOffset: number;

  /** Distance between OSM centroid and LiDAR centroid in meters */
  osmLidarCentroidOffset: number;

  /** Height difference: LiDAR-derived height minus OSM tag height, in meters */
  heightDeltaMeters: number | null;

  /** Fraction of building's LiDAR points that fall inside OSM footprint (0.0 – 1.0) */
  lidarContainmentRatio: number;

  /** Fraction of building's LiDAR points that fall inside YOLO mask (0.0 – 1.0) */
  yoloLidarContainmentRatio: number;

  /** Overall alignment status */
  alignmentStatus: 'ALIGNED' | 'MINOR_OFFSET' | 'SIGNIFICANT_MISMATCH' | 'CRITICAL_MISMATCH';

  /** Composite alignment confidence score (0 – 100) */
  alignmentScore: number;

  /** Human-readable diagnostic explanation */
  diagnosis: string;

  /** Specific mismatches detected */
  mismatches: AlignmentMismatch[];
}

/** A specific mismatch between two layers */
export interface AlignmentMismatch {
  /** Which layers are compared */
  layers: [string, string];

  /** Type of mismatch */
  type: 'FOOTPRINT_SHAPE' | 'CENTROID_OFFSET' | 'HEIGHT_DELTA' | 'COVERAGE_GAP' | 'BOUNDARY_TRUNCATION';

  /** Severity: how bad is this mismatch */
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  /** Metric value (e.g. offset in meters, IoU difference) */
  metricValue: number;

  /** Unit for the metric */
  metricUnit: string;

  /** Human-readable description */
  description: string;
}

/**
 * Fused Building Identity — the shared ID linking all 5 layers.
 * This is the core data structure that satisfies Requirement 6:
 * OSM ↔ YOLO mask ↔ LiDAR points ↔ 3D mesh ↔ floor levels
 */
export interface FusedBuildingIdentity {
  /** Primary building ID (from LABuildingRecord.id, e.g. "LA-491697758") */
  buildingId: string;

  /** OSM Way ID for geographic footprint reference */
  osmWayId: number;

  /** Building name from OSM tags */
  buildingName: string;

  /** OSM footprint polygon in WGS84 [[lon, lat], ...] */
  osmFootprintCoords: [number, number][];

  /** YOLO segmentation mask polygon in WGS84 [[lon, lat], ...], null if not detected */
  yoloMaskCoords: [number, number][] | null;

  /** YOLO detection confidence (0.0 – 1.0), null if not detected */
  yoloConfidence: number | null;

  /** LiDAR building index for point cloud extraction */
  lidarBuildingIndex: number | null;

  /** Number of real LiDAR points for this building */
  lidarPointCount: number;

  /** LiDAR-derived building height in meters */
  lidarHeightMeters: number;

  /** Peak elevation AMSL from LiDAR */
  lidarPeakAMSL: number;

  /** Local ground elevation AMSL from LiDAR */
  lidarGroundAMSL: number;

  /** 3D mesh file reference (shared GLB, building is identified by its mesh within the scene) */
  meshModelFile: string;

  /** Inferred floor levels (from LABuildingRecord.levels) */
  inferredFloors: {
    level: number;
    floorName: string;
    zMinAMSL: number;
    zMaxAMSL: number;
    heightMeters: number;
    /** Always INFERRED unless actual floor-plan data exists */
    dataSource: 'INFERRED' | 'ACTUAL_FLOORPLAN';
  }[];

  /** Building center in WGS84 */
  center: { latitude: number; longitude: number };

  /** Alignment validation results */
  alignment: AlignmentValidation | null;

  /** Overall data fusion status */
  fusionStatus: 'FULLY_FUSED' | 'PARTIAL' | 'OSM_ONLY' | 'LIDAR_ONLY' | 'YOLO_ONLY';

  /** Composite confidence score across all layers (0 – 100) */
  fusionConfidence: number;
}

/** Processing state for the YOLO pipeline */
export type YoloProcessingStage =
  | 'IDLE'
  | 'LOADING_MODEL'
  | 'CAPTURING_TILE'
  | 'PREPROCESSING'
  | 'INFERENCING'
  | 'POSTPROCESSING'
  | 'GEOREFERENCING'
  | 'MATCHING'
  | 'VALIDATING'
  | 'COMPLETE'
  | 'ERROR';

export interface YoloProcessingStatus {
  stage: YoloProcessingStage;
  progress: number; // 0.0 – 1.0
  message: string;
  detectionCount: number;
  matchedCount: number;
  processingTimeMs: number;
  error: string | null;
}

/** Configuration for the YOLO segmentation service */
export interface YoloServiceConfig {
  /** Path to ONNX model file */
  modelPath: string;

  /** Confidence threshold for detections (0.0 – 1.0) */
  confidenceThreshold: number;

  /** NMS IoU threshold */
  nmsThreshold: number;

  /** Input image size for the model [width, height] */
  inputSize: [number, number];

  /** Minimum IoU to consider an OSM match */
  matchIoUThreshold: number;

  /** Maximum centroid distance in meters for matching */
  maxCentroidDistanceMeters: number;
}
