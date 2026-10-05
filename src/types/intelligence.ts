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
  officialUlpin: string; // "Not connected" if unavailable
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
}

export type MeasurementType = 'distance' | 'height' | 'area' | 'volume';
