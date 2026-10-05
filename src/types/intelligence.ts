export type ProvenanceStatus =
  | 'REAL'
  | 'DERIVED'
  | 'ESTIMATED'
  | 'DEMO'
  | 'UNAVAILABLE';

export type ValidationStatus =
  | 'PASS'
  | 'WARNING'
  | 'REVIEW REQUIRED'
  | 'UNAVAILABLE';

export type PrototypeRole =
  | 'survey_officer'
  | 'reviewer'
  | 'authority'
  | 'planner'
  | 'citizen';

export interface RoleDefinition {
  id: PrototypeRole;
  title: string;
  badge: string;
  description: string;
  canValidate: boolean;
  canExport: boolean;
}

export interface EvidenceItem {
  id: string;
  category: string;
  source: string;
  status: ProvenanceStatus;
  detail: string;
  crs?: string;
  datasetId?: string;
  pointCount?: number;
  timestamp?: string;
  cloudCover?: number;
  reasonUnavailable?: string;
}

export interface ConfidenceRule {
  name: string;
  points: number;
  maxPoints: number;
  description: string;
  passed: boolean;
  status: ProvenanceStatus;
}

export interface ConfidenceBreakdown {
  score: number; // 0 - 100
  quality: 'HIGH' | 'MEDIUM' | 'LOW';
  rules: ConfidenceRule[];
  explanation: string;
}

export interface GeometricValidationCheck {
  id: string;
  name: string;
  status: ValidationStatus;
  detail: string;
  metric?: string;
  recommendation?: string;
}

export interface ValidationSummary3D {
  overallStatus: ValidationStatus;
  checks: GeometricValidationCheck[];
  timestamp: string;
}

export interface EstimatedFloor {
  floorNumber: number;
  name: string;
  elevationAMSL: number; // in meters
  heightAGL: number;     // in meters
  estimatedAreaSqM?: number;
  status: ProvenanceStatus;
  derivationMethod: string;
}

export interface TimelineEntry {
  date: string;
  title: string;
  detail: string;
  source: string;
  status: ProvenanceStatus;
}

export interface PropertyPassportData {
  bhu3dReference: string;
  officialUlpin: string; // "UNAVAILABLE"
  buildingId: string;
  buildingName: string;
  locality: string;
  coordinates: {
    latitude: number;
    longitude: number;
    altitudeAMSL: number;
    heightAGL: number;
  };
  footprintAreaSqM: number;
  heightMeters: number;
  estimatedFloors: number;
  calculatedVolumeM3?: number;
  parcelId?: string;
  surveyNumber?: string;
  confidence: ConfidenceBreakdown;
  validation: ValidationSummary3D;
  evidence: EvidenceItem[];
  generatedTimestamp: string;
  version: string;
  verificationUrl: string;

  // 1. PROPERTY IDENTITY
  identity: {
    osmBuildingId: number | string;
    buildingName: string;
    wgs84Coordinates: { latitude: number; longitude: number };
    aoiStatus: string;
    bhu3dPropertyId: string;
    officialUlpin: 'UNAVAILABLE';
    ulpinLabel: string;
  };

  // 2. GEOMETRY
  geometry: {
    footprintAreaSqM: number;
    lidarHeightMeters: number;
    demGroundAMSL: number;
    dsmRoofAMSL: number;
    ndsmHeightMeters: number;
    meshStatus: string;
  };

  // 3. VERTICAL STRUCTURE
  verticalStructure: {
    estimatedFloorCount: number;
    floorElevations: { baseGroundAMSL: number; roofAMSL: number };
    averageFloorHeight: number;
    floorProvenance: 'ESTIMATED';
    floors: {
      id: string;
      floorNumber: number;
      baseElevation: number;
      topElevation: number;
      height: number;
      volume: number;
      confidence: number;
      provenance: 'ESTIMATED';
      syntheticUnitId: string;
      unitStatus: 'DEMO / PROTOTYPE';
    }[];
  };

  // 4. UNIT INFORMATION
  unitInformation: {
    selectedUnitId: string;
    unitStatus: 'DEMO / PROTOTYPE';
    boundaryStatus: 'UNAVAILABLE';
    disclaimer: string;
  };

  // 5. OWNERSHIP
  ownership: {
    owner: 'UNAVAILABLE';
    apn: 'UNAVAILABLE';
    title: 'UNAVAILABLE';
    disclaimer: string;
  };

  // 6. UNDERGROUND INFRASTRUCTURE
  underground: {
    source: string;
    featureCount: number;
    realCount: number;
    provenance: ProvenanceStatus;
    depthAvailability: 'AVAILABLE' | 'UNAVAILABLE' | 'ESTIMATED';
  };

  // 7. VALIDATION
  validationMetrics: {
    footprintIoU: number;
    centroidOffsetMeters: number;
    heightDifferenceMeters: number;
    geometryStatus: string;
    lidarCoverageStatus: string;
    coverageRatio: number;
  };

  // 8. PROVENANCE SUMMARY
  provenanceSummary: Record<string, ProvenanceStatus>;

  undergroundInfrastructure?: {
    source: string;
    featuresCount: number;
    realCount: number;
    depthStatus: 'AVAILABLE' | 'UNAVAILABLE' | 'ESTIMATED';
    nearestInfrastructureDistanceMeters?: number;
    nearestInfrastructureType?: string;
    provenance: 'REAL' | 'DERIVED' | 'ESTIMATED' | 'DEMO' | 'UNAVAILABLE';
    statusText: string;
  };
  verticalFloors?: {
    totalFloors: number;
    floorCountStatus: 'ESTIMATED';
    floorGeometryStatus: 'DERIVED';
    sourceAuthority: string;
    floorHeightAverageMeters: number;
    baseGroundAMSL: number;
    roofAMSL: number;
    disclaimer: string;
    floors: {
      id: string;
      floorNumber: number;
      baseElevation: number;
      topElevation: number;
      height: number;
      volume: number;
      confidence: number;
      provenance: 'ESTIMATED';
      syntheticUnitId: string;
      unitStatus: 'DEMO / PROTOTYPE';
    }[];
  };
}

export type MeasurementType = 'distance' | 'height' | 'area' | 'volume';
