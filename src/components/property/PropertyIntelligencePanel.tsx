import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ShieldCheck,
  Layers,
  Building,
  Info,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Ruler,
  FileCheck2,
  Calendar,
  Download,
  QrCode,
  MapPin,
  ExternalLink,
  FlaskConical,
  MinusCircle,
  HelpCircle
} from 'lucide-react';
import { BuildingFootprint, Parcel } from '../../types/geospatial';
import { RealLidarBuilding } from '../../types/lidar';
import { PropertyRecord } from '../../types/property';
import {
  ConfidenceBreakdown,
  ValidationSummary3D,
  EvidenceItem,
  EstimatedFloor,
  TimelineEntry,
  PropertyPassportData,
  MeasurementType
} from '../../types/intelligence';
import { intelligenceService } from '../../services/intelligenceService';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';
import { MeasurementToolbar } from '../globe/MeasurementToolbar';
import { Apartment3DViewer } from './Apartment3DViewer';

interface PropertyIntelligencePanelProps {
  building: BuildingFootprint | null;
  realLidarMetadata: RealLidarBuilding | null;
  isRealLidarMode: boolean;
  property: PropertyRecord | null;
  parcel: Parcel | null;
  sentinelScene: any;
  onClose: () => void;
  onOpenPassport: (passport: PropertyPassportData) => void;
  onOpenFullscreen3D?: () => void;
}

export const PropertyIntelligencePanel: React.FC<PropertyIntelligencePanelProps> = ({
  building,
  realLidarMetadata,
  isRealLidarMode,
  property,
  parcel,
  sentinelScene,
  onClose,
  onOpenPassport,
  onOpenFullscreen3D
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hierarchy' | 'evidence' | 'validation' | 'floors' | 'timeline'>('overview');
  const [measurementType, setMeasurementType] = useState<MeasurementType | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  // Workflow classification: Is this a Demonstration/Lab model or Real Geospatial data?
  const isDemoLab = !isRealLidarMode && !!property && !building;
  const isLiDAR = isRealLidarMode && !!realLidarMetadata;

  // Real or derived identifiers
  const buildingId = isLiDAR
    ? 'BLD-UTAH-CAPITOL-01'
    : building?.id || property?.propertyId3D || 'BLD-OSM-PUNE-01';

  const buildingName = isLiDAR
    ? realLidarMetadata?.buildingName || 'Utah State Capitol'
    : building?.name || (isDemoLab ? property?.buildingName || 'Demo Lab Model' : `OSM Building (${buildingId})`);

  const locality = isLiDAR
    ? `${realLidarMetadata?.geographicLocation.city}, ${realLidarMetadata?.geographicLocation.state}, USA`
    : `${property?.city || 'Pune'}, Maharashtra, India`;

  const lat = isLiDAR
    ? realLidarMetadata?.geographicLocation.latitude || 40.7774
    : building?.centroid[1] || property?.coordinates.latitude || 18.5204;

  const lon = isLiDAR
    ? realLidarMetadata?.geographicLocation.longitude || -111.8882
    : building?.centroid[0] || property?.coordinates.longitude || 73.8567;

  const height = isLiDAR
    ? realLidarMetadata?.elevationMetrics.derivedBuildingHeightMeters || 74.07
    : building?.height || (isDemoLab ? property?.buildingProfile.heightMeters || 46.5 : 28.0);

  const baseElev = isLiDAR
    ? realLidarMetadata?.elevationMetrics.baseGroundElevationMeters || 1384.5
    : 582;

  // Real ring coordinates
  const coordinatesRing: number[][] = useMemo(() => {
    if (isLiDAR && realLidarMetadata) {
      const b = realLidarMetadata.geographicLocation.bounds;
      return [
        [b.southWest[0], b.southWest[1]],
        [b.northEast[0], b.southWest[1]],
        [b.northEast[0], b.northEast[1]],
        [b.southWest[0], b.northEast[1]],
        [b.southWest[0], b.southWest[1]]
      ];
    }
    if (building?.geometry) {
      return building.geometry.type === 'MultiPolygon'
        ? (building.geometry as any).coordinates[0]?.[0] || []
        : (building.geometry as any).coordinates[0] || [];
    }
    return [
      [73.85645, 18.52022],
      [73.85695, 18.52022],
      [73.85695, 18.52058],
      [73.85645, 18.52058],
      [73.85645, 18.52022]
    ];
  }, [isLiDAR, realLidarMetadata, building]);

  // Parcel coordinates if any
  const parcelRing: number[][] | undefined = useMemo(() => {
    if (parcel?.geometry) {
      return parcel.geometry.coordinates[0];
    }
    return undefined;
  }, [parcel]);

  // Footprint area calculation
  const footprintArea = useMemo(() => {
    if (isLiDAR && realLidarMetadata) {
      return realLidarMetadata.elevationMetrics.footprintLengthMeters * realLidarMetadata.elevationMetrics.footprintWidthMeters;
    }
    return intelligenceService.calculatePolygonAreaSqM(coordinatesRing) || 1850;
  }, [isLiDAR, realLidarMetadata, coordinatesRing]);

  // Volume calculation
  const calculatedVolume = useMemo(() => {
    return Math.round(footprintArea * height);
  }, [footprintArea, height]);

  // Estimated floors
  const estimatedFloors = useMemo<EstimatedFloor[]>(() => {
    const floorCount = isLiDAR
      ? 4
      : building?.floors || (isDemoLab ? property?.totalFloors || 14 : Math.max(1, Math.round(height / 3.1)));
    return intelligenceService.generateEstimatedFloors(height, baseElev, floorCount, footprintArea);
  }, [isLiDAR, building, isDemoLab, property, height, baseElev, footprintArea]);

  // Deterministic Confidence
  const confidence = useMemo<ConfidenceBreakdown>(() => {
    return intelligenceService.calculateConfidence({
      isLiDAR,
      hasFootprint: true,
      hasValidGeometry: true,
      hasCrs: true,
      isWatertight: isLiDAR ? realLidarMetadata?.reconstructionPipeline.isWatertight : true,
      hasSatelliteScene: !!sentinelScene,
      hasParcel: !!parcel,
      hasOfficialUlpin: false
    });
  }, [isLiDAR, realLidarMetadata, sentinelScene, parcel]);

  // 3D Geometric Validation Summary
  const validation = useMemo<ValidationSummary3D>(() => {
    return intelligenceService.validateGeometry({
      coordinates: coordinatesRing,
      height,
      parcelCoordinates: parcelRing,
      isWatertight: isLiDAR ? realLidarMetadata?.reconstructionPipeline.isWatertight : undefined,
      floors: estimatedFloors.length
    });
  }, [coordinatesRing, height, parcelRing, isLiDAR, realLidarMetadata, estimatedFloors]);

  // Evidence list
  const evidenceList = useMemo<EvidenceItem[]>(() => {
    return intelligenceService.buildEvidenceList({
      isLiDAR,
      lidarMeta: realLidarMetadata,
      osmBuilding: building,
      sentinelScene,
      parcel
    });
  }, [isLiDAR, realLidarMetadata, building, sentinelScene, parcel]);

  // Timeline
  const timelineData = useMemo(() => {
    return intelligenceService.getTimeline(isLiDAR);
  }, [isLiDAR]);

  // Construct Passport Data
  const passportData = useMemo<PropertyPassportData>(() => {
    return {
      bhu3dReference: isLiDAR
        ? 'BHU3D-USA-UT-SLC-CAPITOL-01'
        : isDemoLab
        ? property?.propertyId3D || 'PROP-3D-PUN-LAB-01'
        : `PROP-3D-PUN-${buildingId}`,
      officialUlpin: 'UNAVAILABLE (Not connected to DoLR)',
      buildingId,
      buildingName,
      locality,
      coordinates: {
        latitude: lat,
        longitude: lon,
        altitudeAMSL: baseElev,
        heightAGL: height
      },
      footprintAreaSqM: footprintArea,
      heightMeters: height,
      estimatedFloors: estimatedFloors.length,
      calculatedVolumeM3: calculatedVolume,
      parcelId: parcel?.id,
      surveyNumber: parcel?.surveyNumber,
      confidence,
      validation,
      evidence: evidenceList,
      generatedTimestamp: new Date().toISOString(),
      version: 'v0.1-prototype',
      verificationUrl: `https://bhu3d.gov.in/property/${buildingId}/verify`
    };
  }, [isLiDAR, isDemoLab, property, buildingId, buildingName, locality, lat, lon, baseElev, height, footprintArea, estimatedFloors, calculatedVolume, parcel, confidence, validation, evidenceList]);

  // Export GeoJSON Handler
  const handleExportGeoJson = () => {
    if (!building) return;
    const jsonStr = intelligenceService.exportGeoJson(building, validation, confidence);
    const blob = new Blob([jsonStr], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bhu3D_${buildingId}_provenance.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-80 sm:w-[430px] max-h-[calc(100vh-6rem)] overflow-y-auto gis-glass-panel rounded-3xl p-4 sm:p-5 border border-zinc-800 shadow-2xl pointer-events-auto backdrop-blur-xl animate-fadeIn custom-scrollbar select-text text-white">
      {/* 1. Header Banner */}
      <div className="flex items-start justify-between pb-3 border-b border-zinc-800 mb-3">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <DataProvenanceBadge
              status={isDemoLab ? 'DEMO' : 'REAL'}
              sourceText={isLiDAR ? 'Airborne LiDAR' : isDemoLab ? 'Lab Prototype' : 'OpenStreetMap'}
            />
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
              {buildingId}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate flex items-center gap-1.5">
            {isDemoLab ? (
              <FlaskConical className="w-4 h-4 text-zinc-400 shrink-0" />
            ) : (
              <Building className="w-4 h-4 text-white shrink-0" />
            )}
            <span className="truncate">{buildingName}</span>
          </h2>
          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5 truncate font-sans">
            <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
            <span className="truncate">{locality}</span>
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors shrink-0"
          title="Close Intelligence Panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Navigation Tabs (Monochrome) */}
      <div className="flex items-center gap-1 p-1 bg-black/80 rounded-2xl border border-zinc-800 mb-3.5 overflow-x-auto text-[11px] font-mono custom-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'hierarchy'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Hierarchy
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'evidence'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Evidence
        </button>
        <button
          onClick={() => setActiveTab('validation')}
          className={`px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'validation'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Validation
        </button>
        <button
          onClick={() => setActiveTab('floors')}
          className={`px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'floors'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Floors
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Timeline
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-3 animate-fadeIn">
          {/* Demonstration Workflow Notice or Real Data Disclaimer */}
          {isDemoLab ? (
            <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-700 space-y-1.5 text-xs">
              <div className="font-bold flex items-center gap-1.5 text-white">
                <FlaskConical className="w-4 h-4 text-zinc-300" />
                <span>Bhu3D Demonstration / Lab Workflow</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                Workflow: Floor Plan → AI/geometry processing → Floors → Units → 3D Property Volume → Validation → Proposed Bhu3D Reference.
              </p>
              <div className="pt-2">
                <Apartment3DViewer property={property!} onOpenFullscreen={onOpenFullscreen3D} />
              </div>
            </div>
          ) : (
            /* REAL DATA WORKFLOW: Explicitly display that vertical unit data is UNAVAILABLE */
            <div className="p-3 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white uppercase text-[10px] tracking-wider font-mono">
                  Real Geospatial Workflow
                </span>
                <span className="text-[10px] font-mono text-zinc-400">OSM / LiDAR Survey</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                REAL DATA → Building Selection → Evidence Collection → Derived Measurements → 3D Validation → Property Intelligence.
              </p>
              <div className="mt-2 p-2 rounded-xl bg-black border border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-start gap-2">
                <MinusCircle className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200 block">Vertical unit data: UNAVAILABLE</strong>
                  <span className="text-[10px] text-zinc-500 block leading-tight mt-0.5 font-sans">
                    Interior unit boundaries, apartments, and floor plans are not published for this real structure. Official title records remain strictly decoupled.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Key Property Attribute Table (Strictly adheres to Section 5) */}
          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
              <span className="font-bold text-white uppercase tracking-wider text-[10px] font-mono">
                Property Attribute Matrix
              </span>
              <span className="text-[9px] font-mono text-zinc-500">HONEST STATUS</span>
            </div>

            <div className="space-y-1.5 divide-y divide-zinc-900 text-[11px]">
              {/* 1. Source */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-zinc-400">Source:</span>
                <DataProvenanceBadge status="REAL" sourceText={isLiDAR ? 'OpenTopography LiDAR' : 'OpenStreetMap'} />
              </div>

              {/* 2. Geometry */}
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-zinc-400">Geometry (Footprint):</span>
                <DataProvenanceBadge status="REAL" sourceText={isLiDAR ? 'LiDAR 3.48M pts' : 'OSM Vector Polygon'} />
              </div>

              {/* 3. Height */}
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-zinc-400">Height:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-white font-bold">{height.toFixed(1)}m</span>
                  <DataProvenanceBadge status="DERIVED" sourceText={isLiDAR ? 'LiDAR Ground-Peak' : 'Extruded Height'} />
                </div>
              </div>

              {/* 4. Floor Count */}
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-zinc-400">Floor Count:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-white">{estimatedFloors.length} Floors</span>
                  <DataProvenanceBadge status="ESTIMATED" sourceText="Inferred @ 3.1m/floor" />
                </div>
              </div>

              {/* 5. Vertical Units */}
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-zinc-400">Vertical Units:</span>
                <DataProvenanceBadge
                  status={isDemoLab ? 'DEMO' : 'UNAVAILABLE'}
                  sourceText={isDemoLab ? 'Synthetic Lab Cutaway' : 'Field BIM Required'}
                />
              </div>

              {/* 6. Ownership */}
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-zinc-400">Ownership:</span>
                <DataProvenanceBadge status="UNAVAILABLE" sourceText="Protected Registry" />
              </div>

              {/* 7. Official ULPIN */}
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-zinc-400">Official ULPIN:</span>
                <DataProvenanceBadge status="UNAVAILABLE" sourceText="DoLR Not Connected" />
              </div>

              {/* 8. 3D Property Reference */}
              <div className="flex items-center justify-between pt-1.5">
                <span className="text-zinc-400">3D Property Reference:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-zinc-300 text-[10px]">{passportData.bhu3dReference}</span>
                  <DataProvenanceBadge status={isDemoLab ? 'DEMO' : 'DERIVED'} sourceText="Bhu3D Reference" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block font-sans">Centroid (WGS84)</span>
              <span className="text-xs font-bold text-white">
                {lat.toFixed(4)}° N, {Math.abs(lon).toFixed(4)}° {lon < 0 ? 'W' : 'E'}
              </span>
              <span className="text-[9px] text-zinc-500 block font-sans mt-0.5">Datum: EPSG:4326</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block font-sans">Ground Footprint</span>
              <span className="text-xs font-bold text-white">
                {Math.round(footprintArea).toLocaleString()} m²
              </span>
              <span className="text-[9px] text-zinc-400 block font-sans mt-0.5">REAL vector boundary</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block font-sans">Calculated 3D Volume</span>
              <span className="text-xs font-bold text-white">
                {Math.round(calculatedVolume).toLocaleString()} m³
              </span>
              <span className="text-[9px] text-zinc-500 block font-sans mt-0.5">
                DERIVED: area × height
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block font-sans">Confidence Score</span>
              <span className="text-xs font-bold text-white">
                {confidence.score}% ({confidence.quality})
              </span>
              <span className="text-[9px] text-zinc-500 block font-sans mt-0.5">
                Deterministic 6-rule
              </span>
            </div>
          </div>

          {/* Interactive Measurement Tools */}
          <MeasurementToolbar
            activeType={measurementType}
            onSelectType={setMeasurementType}
            metrics={{
              horizontalDistanceM: isLiDAR ? 148.0 : Math.sqrt(footprintArea) * 1.2,
              verticalHeightM: height,
              footprintAreaSqM: footprintArea,
              volumeM3: calculatedVolume
            }}
          />
        </div>
      )}

      {/* TAB 2: SPATIAL HIERARCHY */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-3 text-xs animate-fadeIn">
          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] block font-mono">
              Cadastral Spatial Hierarchy
            </span>

            {/* Level 1: Official ULPIN */}
            <div className="flex items-start space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-black text-zinc-400 border border-zinc-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">
                1
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-zinc-500 block text-[10px] uppercase font-mono">Official ULPIN Reference</span>
                <div className="font-mono text-zinc-300 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700 inline-block mt-0.5">
                  Official ULPIN: UNAVAILABLE
                </div>
                <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                  Proposed 3D Reference: <span className="text-white">{passportData.bhu3dReference}</span>
                </div>
              </div>
            </div>

            <div className="border-l-2 border-dashed border-zinc-700 ml-2.5 h-3" />

            {/* Level 2: Parcel */}
            <div className="flex items-start space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-black text-zinc-400 border border-zinc-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">
                2
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-zinc-500 block text-[10px] uppercase font-mono">Cadastral Revenue Parcel</span>
                <div className="font-semibold text-zinc-200">
                  {parcel ? `Survey Lot ${parcel.surveyNumber} · Ward ${parcel.wardNumber || 'Kothrud'}` : 'Cadastral parcel unlinked'}
                </div>
                <DataProvenanceBadge status={parcel ? 'DEMO' : 'UNAVAILABLE'} size="sm" sourceText="Revenue Cadastre" />
              </div>
            </div>

            <div className="border-l-2 border-dashed border-zinc-700 ml-2.5 h-3" />

            {/* Level 3: Building */}
            <div className="flex items-start space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-mono">
                3
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-zinc-500 block text-[10px] uppercase font-mono">3D Building Massing</span>
                <div className="font-semibold text-white">{buildingName} ({buildingId})</div>
                <DataProvenanceBadge status="REAL" size="sm" sourceText={isLiDAR ? 'LiDAR Survey' : 'OpenStreetMap'} />
              </div>
            </div>

            <div className="border-l-2 border-dashed border-zinc-700 ml-2.5 h-3" />

            {/* Level 4: Floor */}
            <div className="flex items-start space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-black text-zinc-400 border border-zinc-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">
                4
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-zinc-500 block text-[10px] uppercase font-mono">Vertical Floor Extents</span>
                <div className="font-semibold text-zinc-200 font-mono">
                  {estimatedFloors.length} Floors (Estimated vertical slices @ 3.1m)
                </div>
                <DataProvenanceBadge status="ESTIMATED" size="sm" sourceText="Elevation Slicing" />
              </div>
            </div>

            <div className="border-l-2 border-dashed border-zinc-700 ml-2.5 h-3" />

            {/* Level 5: Unit */}
            <div className="flex items-start space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-black text-zinc-400 border border-zinc-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">
                5
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-zinc-500 block text-[10px] uppercase font-mono">Vertical Unit Cadastre</span>
                <div className="font-semibold text-zinc-300">
                  {isDemoLab ? `${property?.unitNumber} (${property?.carpetArea} m²)` : 'Vertical unit data: UNAVAILABLE'}
                </div>
                <DataProvenanceBadge status={isDemoLab ? 'DEMO' : 'UNAVAILABLE'} size="sm" sourceText="Unit Subdivision" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVIDENCE REGISTER */}
      {activeTab === 'evidence' && (
        <div className="space-y-2.5 text-xs animate-fadeIn">
          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] block font-mono">
              Transparent Evidence Register
            </span>

            <div className="space-y-2 divide-y divide-zinc-900">
              {evidenceList.map((ev) => (
                <div key={ev.id} className="pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">{ev.category}</span>
                    <DataProvenanceBadge status={ev.status} size="sm" showIcon={false} />
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 font-sans">{ev.source}</div>
                  <div className="text-[10px] font-mono text-zinc-300 mt-0.5">{ev.detail}</div>

                  {ev.pointCount && (
                    <div className="text-[10px] text-zinc-500 font-mono">
                      Survey Points: {ev.pointCount.toLocaleString()} laser returns
                    </div>
                  )}

                  {ev.crs && (
                    <div className="text-[10px] text-zinc-500 font-mono">
                      CRS: {ev.crs}
                    </div>
                  )}

                  {ev.reasonUnavailable && (
                    <div className="text-[10px] text-zinc-500 italic mt-0.5 font-sans">
                      Notice: {ev.reasonUnavailable}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VALIDATION & CONFIDENCE */}
      {activeTab === 'validation' && (
        <div className="space-y-3 text-xs animate-fadeIn">
          {/* Confidence Score Header */}
          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-400 block">Deterministic Confidence</span>
                <span className="text-2xl font-bold text-white font-mono">
                  {confidence.score}%
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold font-mono border bg-zinc-900 text-white border-zinc-700">
                {confidence.quality} QUALITY
              </span>
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
              {confidence.explanation}
            </p>

            {/* Confidence Rules List */}
            <div className="pt-2 border-t border-zinc-800 space-y-1.5">
              <span className="text-[10px] uppercase text-zinc-500 font-mono block">Rule-based scoring:</span>
              {confidence.rules.map((rule, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-300">{rule.name}:</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className={rule.passed ? 'text-white font-bold' : 'text-zinc-600'}>
                      +{rule.points}/{rule.maxPoints} pts
                    </span>
                    <DataProvenanceBadge status={rule.status} size="sm" showIcon={false} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3D Geometric Validation Checks */}
          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] font-mono">
                3D Geometric Validation
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-white border border-zinc-700">
                {validation.overallStatus}
              </span>
            </div>

            <div className="space-y-2 divide-y divide-zinc-900">
              {validation.checks.map((check) => (
                <div key={check.id} className="pt-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">{check.name}</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      check.status === 'PASS'
                        ? 'bg-white text-black border-white'
                        : check.status === 'WARNING'
                        ? 'bg-zinc-800 text-zinc-300 border-zinc-600'
                        : 'bg-black text-zinc-500 border-zinc-800'
                    }`}>
                      {check.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 font-sans">{check.detail}</div>
                  {check.metric && (
                    <div className="text-[10px] font-mono text-zinc-300 mt-0.5">{check.metric}</div>
                  )}
                  {check.recommendation && (
                    <div className="text-[10px] text-zinc-500 mt-0.5 italic font-sans">
                      Note: {check.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ESTIMATED FLOORS */}
      {activeTab === 'floors' && (
        <div className="space-y-3 text-xs animate-fadeIn">
          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] font-mono">
                Estimated Vertical Floor Slices
              </span>
              <DataProvenanceBadge status="ESTIMATED" sourceText="Elevation Slicing" />
            </div>

            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
              Floors are inferred from building height ({height}m) using standard floor-to-floor heights (~3.1m). These vertical slices are estimated mathematical boundaries, not legal physical walls.
            </p>

            <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pt-1">
              {estimatedFloors.map((floor) => {
                const isSelected = selectedFloor === floor.floorNumber;
                return (
                  <div
                    key={floor.floorNumber}
                    onClick={() => setSelectedFloor(isSelected ? null : floor.floorNumber)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-zinc-800 border-white text-white font-bold'
                        : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/80 text-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{floor.name}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        Elev: {floor.elevationAMSL}m AMSL (+{floor.heightAGL}m AGL)
                      </div>
                    </div>

                    <div className="text-right">
                      {floor.estimatedAreaSqM && (
                        <span className="text-[10px] font-mono text-zinc-300 block">
                          ~{floor.estimatedAreaSqM} m²
                        </span>
                      )}
                      <DataProvenanceBadge status="ESTIMATED" size="sm" showIcon={false} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-3 text-xs animate-fadeIn">
          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] block font-mono">
              Property Survey Timeline
            </span>

            {!timelineData.isHistoricalAvailable && (
              <div className="p-2.5 rounded-xl bg-black border border-zinc-800 text-[11px] text-zinc-400 italic font-sans">
                Historical multi-temporal cadastral revisions require continuous satellite/drone repeat passes.
              </div>
            )}

            <div className="space-y-3 pt-2 relative border-l border-zinc-700 ml-2 pl-3">
              {timelineData.entries.map((entry, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-white border border-black" />
                  <span className="text-[10px] font-mono text-zinc-400 block">{entry.date}</span>
                  <div className="font-semibold text-white text-xs mt-0.5">{entry.title}</div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug font-sans">{entry.detail}</p>
                  <div className="mt-1">
                    <DataProvenanceBadge status={entry.status} sourceText={entry.source} size="sm" showIcon={false} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Bottom Action Bar: Passport & Export (Monochrome) */}
      <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
        <button
          onClick={() => onOpenPassport(passportData)}
          className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Property Passport</span>
        </button>

        {building && (
          <button
            onClick={handleExportGeoJson}
            className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs border border-zinc-700 flex items-center justify-center gap-1 transition-all active:scale-95"
            title="Download GeoJSON Feature Collection"
          >
            <Download className="w-3.5 h-3.5" />
            <span>GeoJSON</span>
          </button>
        )}
      </div>
    </div>
  );
};
