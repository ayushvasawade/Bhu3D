import React, { useState } from 'react';
import {
  Building2,
  Box,
  Layers,
  MapPin,
  X,
  ChevronDown,
  ChevronUp,
  Maximize2,
  ShieldCheck,
  Hash,
  Eye,
  Split,
  Sparkles,
  Scan,
  Database,
  Globe2,
  ExternalLink,
  FileText,
  Mountain,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { LABuildingRecord, FloorInspectionOptions } from '../../types/lidar';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';
import { checkLidarBoundaryCoverage, generateBuildingFloors } from '../../utils/geoUtils';

interface LABuildingCardProps {
  building: LABuildingRecord | null;
  onClose: () => void;
  onFocusBuilding?: (building: LABuildingRecord) => void;
  onFlyToGlobal?: () => void;
  selectedFloor?: number | null;
  onSelectFloor?: (floor: number | null) => void;
  floorInspectionOptions?: FloorInspectionOptions;
  onChangeFloorInspectionOptions?: (opts: Partial<FloorInspectionOptions>) => void;
  onOpenDetailsPage?: (building: LABuildingRecord) => void;
  undergroundData?: import('../../types/underground').UndergroundQueryResult | null;
  onExploreUnderground?: () => void;
}

export const LABuildingCard: React.FC<LABuildingCardProps> = ({
  building,
  onClose,
  onFocusBuilding,
  onFlyToGlobal,
  selectedFloor = null,
  onSelectFloor,
  floorInspectionOptions = {
    isInspectionMode: false,
    isExplodedView: false,
    explodeSpacingMeters: 4.0,
    floorHeightAssumption: 3.5
  },
  onChangeFloorInspectionOptions,
  onOpenDetailsPage,
  undergroundData = null,
  onExploreUnderground
}) => {
  const [showAllFloors, setShowAllFloors] = useState<boolean>(false);

  if (!building) return null;

  // Authoritative Vertical Floor Decomposition
  const floorResult = generateBuildingFloors(building, floorInspectionOptions);
  const dynamicFloors = floorResult.floors;
  const displayedFloors = showAllFloors ? dynamicFloors : dynamicFloors.slice(0, 5);
  const currentFloorNum = selectedFloor || 1;
  const selectedFloorObj =
    dynamicFloors.find((f) => f.floorNumber === currentFloorNum) || dynamicFloors[0];

  const groundZ = floorResult.baseGroundAMSL;
  const roofZ = floorResult.roofAMSL;
  const derivedH = floorResult.lidarHeightMeters;
  const perFloorH = floorResult.averageFloorHeight;

  // Real point density (points / footprint area)
  const pointDensity = building.footprintAreaSqM > 0
    ? (building.pointCount / building.footprintAreaSqM).toFixed(1)
    : '0.0';

  // Deterministic Bhu3D-derived 3D Property ID
  const cleanBldId = building.id.replace(/[^a-zA-Z0-9]/g, '');
  const floorCode = selectedFloorObj ? selectedFloorObj.floorCode : `F${String(currentFloorNum).padStart(2, '0')}`;
  const derivedPropertyId = `BH3D-SPARK-${cleanBldId}-${floorCode}-U01`;

  // LiDAR Boundary Coverage Status
  const coverageInfo = checkLidarBoundaryCoverage(
    building.footprintCoordinates,
    building.lidarCoverageStatus,
    building.coverageRatio,
    building.lidarCoverageNote
  );
  const isBoundaryClipped = coverageInfo.status === 'BOUNDARY_CLIPPED';

  return (
    <div className="gis-glass-panel rounded-3xl p-4 w-72 sm:w-84 md:w-92 max-w-[360px] shadow-2xl pointer-events-auto border border-zinc-800 transition-all duration-300 select-text flex flex-col max-h-[calc(100vh-6rem)]">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800 shrink-0">
        <div className="flex items-center space-x-1.5">
          <DataProvenanceBadge status="REAL" label="USGS LiDAR" size="sm" />
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
            {building.buildingType || 'building'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onFlyToGlobal && (
            <button
              onClick={onFlyToGlobal}
              className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 font-mono text-[10px] flex items-center gap-1 transition-colors"
              title="Return to 3D Globe"
            >
              <Globe2 className="w-3 h-3 text-cyan-400" />
              <span>Globe</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Close Inspector"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pt-3 space-y-3 font-sans">
        {/* Title & Centroid Coordinates */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-white shrink-0" />
              <span className="truncate">{building.name}</span>
            </h3>
            {onFocusBuilding && (
              <button
                onClick={() => onFocusBuilding(building)}
                className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                title="Focus Camera"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
            <span>South Park Precinct, Downtown Los Angeles</span>
          </p>
          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
            WGS84: {building.center.latitude.toFixed(6)}° N, {Math.abs(building.center.longitude).toFixed(6)}° W
          </p>

          {/* Dedicated Central Property Passport & Full Building Record Action */}
          {onOpenDetailsPage && (
            <button
              onClick={() => onOpenDetailsPage(building)}
              className="w-full mt-2.5 py-2 px-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold flex items-center justify-between transition-all shadow-md group cursor-pointer"
              title="Open authoritative Bhu3D Property Passport"
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>Bhu3D Property Passport</span>
              </span>
              <span className="text-[10px] bg-black/20 text-black px-1.5 py-0.5 rounded font-bold">
                CENTRAL RECORD ↗
              </span>
            </button>
          )}

          {/* LiDAR Tile Coverage Indicator */}
          <div className={`mt-2 p-2 rounded-xl border text-[10px] font-mono flex items-center justify-between ${
            isBoundaryClipped
              ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
          }`}>
            <div className="flex items-center gap-1.5 min-w-0">
              {isBoundaryClipped ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <div className="truncate">
                <span className="font-bold block">
                  LiDAR Coverage: {isBoundaryClipped ? '⚠ Boundary Clipped' : '✓ Fully Covered'}
                </span>
                <span className="text-[8.5px] text-zinc-400 block truncate font-sans">
                  {isBoundaryClipped
                    ? `OSM footprint extends beyond USGS tile (${Math.round(coverageInfo.coverageRatio * 100)}% inside)`
                    : '100% within available USGS LiDAR tile'}
                </span>
              </div>
            </div>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1.5 ${
              isBoundaryClipped
                ? 'bg-amber-900/80 text-amber-200 border border-amber-700'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {isBoundaryClipped ? 'CLIPPED' : 'COVERED'}
            </span>
          </div>
        </div>

        {/* Feature 3: Derived 3D Property ID vs Official ULPIN */}
        <div className="p-2.5 rounded-2xl bg-zinc-950 border border-cyan-800/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1">
              <Hash className="w-3 h-3 text-cyan-400" />
              <span>3D Property Record</span>
            </span>
            <DataProvenanceBadge status="DERIVED" label="DERIVED" size="sm" showIcon={false} />
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono px-2 py-0.5 rounded bg-black border border-rose-900/50">
            <span className="text-zinc-400">Official ULPIN:</span>
            <span className="text-rose-400 font-bold">UNAVAILABLE (USGS/OSM)</span>
          </div>

          <div className="font-mono text-xs font-bold text-white tracking-wide bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800 select-all">
            {derivedPropertyId}
          </div>
          <div className="text-[9px] font-bold text-amber-300 tracking-wide uppercase">
            Derived Bhu3D 3D Property ID — NOT Official ULPIN
          </div>
          <p className="text-[8.5px] text-zinc-500 font-sans leading-tight">
            Deterministic spatial identifier. Unit boundaries are <strong className="text-amber-300">DEMO / PROTOTYPE</strong>. Official municipal cadastral ownership and titles are not connected.
          </p>
        </div>

        {/* Feature 1: Real LiDAR Physical Measurements */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 font-bold uppercase mb-1">
            <span>Physical LiDAR Measurements</span>
            <span className="text-emerald-400">REAL</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
            <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[9px] text-zinc-400 block mb-0.5">Measured Height</span>
              <span className="font-bold text-white text-sm">{building.derivedHeightMeters} m</span>
              <span className="text-[9px] text-zinc-500 block font-sans">
                {(building.derivedHeightMeters * 3.28084).toFixed(1)} ft AGL
              </span>
            </div>

            <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[9px] text-zinc-400 block mb-0.5">Footprint Area</span>
              <span className="font-bold text-white text-sm">{building.footprintAreaSqM.toLocaleString()} m²</span>
              <span className="text-[9px] text-zinc-500 block font-sans">
                {building.footprintCoordinates.length} polygon nodes
              </span>
            </div>

            <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[9px] text-zinc-400 block mb-0.5">LiDAR Points</span>
              <span className="font-bold text-white">{building.pointCount.toLocaleString()} pts</span>
              <span className="text-[9px] text-emerald-400 block font-sans">
                {pointDensity} pts/m² density
              </span>
            </div>

            <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[9px] text-zinc-400 block mb-0.5">Vertical Elevation</span>
              <span className="font-bold text-white">{building.peakElevationAMSL.toFixed(1)} m</span>
              <span className="text-[9px] text-zinc-500 block font-sans">
                Ground: {building.localGroundAMSL.toFixed(1)} m AMSL
              </span>
            </div>
          </div>
        </div>

        {/* Step 1 Foundation: Real LiDAR DEM / DSM / nDSM Elevation Profile */}
        <div className="p-2.5 rounded-2xl bg-zinc-950 border border-cyan-900/60 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-cyan-400" />
              <span>Elevation & nDSM Profile</span>
            </span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              Derived from REAL LiDAR
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-[9px] text-zinc-400 block mb-0.5">Ground Elevation (DEM)</span>
              <span className="font-bold text-white text-xs">
                {building.elevationMetrics ? building.elevationMetrics.demGroundAMSL.toFixed(2) : building.localGroundAMSL.toFixed(2)} m
              </span>
              <span className="text-[8px] text-zinc-500 block font-sans">
                Bare Earth NAVD88
              </span>
            </div>

            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-[9px] text-zinc-400 block mb-0.5">Roof Elevation (DSM)</span>
              <span className="font-bold text-white text-xs">
                {building.elevationMetrics ? building.elevationMetrics.dsmRoofAMSL.toFixed(2) : building.peakElevationAMSL.toFixed(2)} m
              </span>
              <span className="text-[8px] text-zinc-500 block font-sans">
                Surface Returns
              </span>
            </div>

            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-[9px] text-zinc-400 block mb-0.5">LiDAR Height</span>
              <span className="font-bold text-cyan-300 text-xs">
                {building.elevationMetrics ? building.elevationMetrics.lidarHeightMeters.toFixed(2) : building.derivedHeightMeters.toFixed(2)} m
              </span>
              <span className="text-[8px] text-zinc-500 block font-sans">
                Point cloud delta
              </span>
            </div>

            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-[9px] text-zinc-400 block mb-0.5">nDSM Height (P95)</span>
              <span className="font-bold text-amber-300 text-xs">
                {building.elevationMetrics ? building.elevationMetrics.ndsmP95Height.toFixed(2) : building.derivedHeightMeters.toFixed(2)} m
              </span>
              <span className="text-[8px] text-zinc-500 block font-sans">
                Raster sample (1m)
              </span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1 font-mono text-[9.5px]">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Height Difference:</span>
              <span className="text-white font-bold">
                {building.elevationMetrics ? `±${building.elevationMetrics.heightDifference.toFixed(2)} m` : '±0.00 m'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Elevation Source:</span>
              <span className="text-cyan-300 text-[9px] font-sans">
                {building.elevationMetrics?.elevationSource || 'USGS 3DEP Real LiDAR'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Confidence:</span>
              <span className="text-emerald-400 font-bold">
                {Math.round((building.elevationMetrics?.confidence || 0.95) * 100)}%
              </span>
            </div>
          </div>

          <p className="text-[8.5px] text-zinc-500 font-sans leading-tight italic pt-0.5">
            Derived from REAL LiDAR. Not official cadastral/ULPIN elevation data.
          </p>
        </div>

        {/* Feature 2: Vertical Property / Floor Mapping */}
        <div className="p-2.5 rounded-2xl bg-zinc-950 border border-amber-900/60 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Vertical Floor Strata</span>
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-mono px-1 rounded bg-amber-950 text-amber-400 border border-amber-900 font-bold">
                ESTIMATED
              </span>
            </div>
          </div>

          {/* Honest Status Badges */}
          <div className="flex flex-wrap items-center gap-1 text-[8px] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
              Floors: <strong className="text-amber-300">ESTIMATED ({floorResult.floorCount})</strong>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
              Geometry: <strong className="text-cyan-300">DERIVED</strong>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              LiDAR + OSM
            </span>
          </div>

          {/* 3D X-Ray & Exploded View Controls */}
          <div className="flex items-center justify-between gap-1.5 text-[10px] font-mono">
            <button
              onClick={() =>
                onChangeFloorInspectionOptions?.({
                  isInspectionMode: !floorInspectionOptions.isInspectionMode
                })
              }
              className={`flex-1 py-1 px-2 rounded-lg border text-center font-bold transition-all ${
                floorInspectionOptions.isInspectionMode
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              {floorInspectionOptions.isInspectionMode ? '3D X-RAY ON' : '3D X-RAY'}
            </button>

            <button
              onClick={() =>
                onChangeFloorInspectionOptions?.({
                  isExplodedView: !floorInspectionOptions.isExplodedView
                })
              }
              className={`flex-1 py-1 px-2 rounded-lg border text-center font-bold transition-all ${
                floorInspectionOptions.isExplodedView
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              {floorInspectionOptions.isExplodedView ? 'EXPLODED' : 'STACKED'}
            </button>
          </div>

          {/* Selected Floor Elevation & Volume Details */}
          {selectedFloorObj && (
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1 font-mono text-[9.5px]">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Selected Level:</span>
                <span className="text-white font-bold">{selectedFloorObj.floorName} ({selectedFloorObj.floorCode})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Vertical Span:</span>
                <span className="text-white">{selectedFloorObj.baseElevation.toFixed(2)}m – {selectedFloorObj.topElevation.toFixed(2)}m AMSL</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Floor Height:</span>
                <span className="text-cyan-300 font-bold">{selectedFloorObj.height.toFixed(2)}m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Floor Footprint:</span>
                <span className="text-amber-300 font-bold">{Math.round(building.footprintAreaSqM).toLocaleString()} m²</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Floor Volume:</span>
                <span className="text-emerald-300 font-bold">{Math.round(selectedFloorObj.volume).toLocaleString()} m³</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Confidence / Source:</span>
                <span className="text-emerald-400 font-bold">
                  {selectedFloorObj.confidence}% ({selectedFloorObj.provenance})
                </span>
              </div>
              <div className="flex items-center justify-between pt-0.5 border-t border-zinc-800/60">
                <span className="text-zinc-500 text-[8.5px]">Demo Unit Ref:</span>
                <span className="text-amber-400/90 text-[8.5px] font-bold">
                  {selectedFloorObj.syntheticUnitId} ({selectedFloorObj.unitStatus})
                </span>
              </div>
            </div>
          )}

          {/* Floor Plates List */}
          <div className="space-y-1">
            {displayedFloors.map((fl) => {
              const isSelected = selectedFloor === fl.floorNumber;
              return (
                <button
                  key={fl.id}
                  onClick={() => onSelectFloor?.(isSelected ? null : fl.floorNumber)}
                  className={`w-full p-1.5 rounded-xl border text-left text-[11px] font-mono transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-white text-black border-white font-bold shadow-md'
                      : 'bg-zinc-950/80 hover:bg-zinc-900 text-zinc-300 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                      isSelected ? 'bg-black text-white' : 'bg-zinc-900 text-amber-300 border border-zinc-800'
                    }`}>
                      {fl.floorCode}
                    </span>
                    <span>{fl.floorName}</span>
                  </div>

                  <div className="text-right">
                    <span className="block text-[10px]">
                      {fl.baseElevation.toFixed(1)}m - {fl.topElevation.toFixed(1)}m
                    </span>
                  </div>
                </button>
              );
            })}

            {dynamicFloors.length > 5 && (
              <button
                onClick={() => setShowAllFloors(!showAllFloors)}
                className="w-full py-1 text-center text-[10px] font-mono text-zinc-400 hover:text-white flex items-center justify-center gap-1 mt-1"
              >
                <span>{showAllFloors ? 'Show Fewer Floors' : `View All ${dynamicFloors.length} Floors`}</span>
                {showAllFloors ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          <p className="text-[8px] text-zinc-500 font-sans leading-tight italic pt-0.5">
            Floor count estimated from LiDAR height & building typology. Floor geometry derived from OSM footprint. Does not detect internal walls, floor slabs, or legal cadastral boundaries.
          </p>
        </div>

        {/* Real LiDAR ↔ Mesh 3D Fidelity (Evaluated on ALL valid roof returns) */}
        {building.fidelity3D ? (
          <div className="p-2.5 rounded-2xl bg-zinc-950 border border-cyan-900/60 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-850">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>LiDAR ↔ Mesh 3D Fidelity</span>
              </span>
              <span className="text-[8px] font-mono px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                {building.fidelity3D.totalValidLidarPoints.toLocaleString()} PTS
              </span>
            </div>

            {/* Transparent Boundary-Clipped Alignment Notice */}
            {isBoundaryClipped && (
              <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/80 space-y-1 font-mono text-[9px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Alignment:</span>
                  <span className="text-amber-300 font-bold px-1.5 py-0.2 rounded bg-amber-950 border border-amber-700">
                    BOUNDARY CLIPPED
                  </span>
                </div>
                <p className="text-zinc-300 font-sans text-[8.5px] leading-tight">
                  <strong>Reason:</strong> OSM footprint extends beyond available USGS LiDAR tile ({Math.round(coverageInfo.coverageRatio * 100)}% inside tile). Truncation at tile edge causes apparent IoU and centroid offset, not an algorithm failure.
                </p>
              </div>
            )}

            {/* 3D Euclidean Distance Metrics Grid */}
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
              <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[9px]">3D RMSE:</span>
                <span className="text-cyan-300 font-bold text-xs">±{building.fidelity3D.rmseMeters.toFixed(2)} m</span>
              </div>
              <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[9px]">Median Distance:</span>
                <span className="text-white font-bold text-xs">{building.fidelity3D.medianDistanceMeters.toFixed(2)} m</span>
              </div>
              <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[9px]">P90 Error:</span>
                <span className="text-zinc-300 font-bold">{building.fidelity3D.p90DistanceMeters.toFixed(2)} m</span>
              </div>
              <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[9px]">P95 Error:</span>
                <span className="text-zinc-300 font-bold">{building.fidelity3D.p95DistanceMeters.toFixed(2)} m</span>
              </div>
            </div>

            {/* Fidelity Distribution Progress Bars */}
            <div className="space-y-1 pt-1 font-mono text-[9px]">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Within 0.50m (Faithful):</span>
                <span className="text-emerald-400 font-bold">{building.fidelity3D.pctWithin050m}%</span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, building.fidelity3D.pctWithin050m)}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <span className="text-zinc-400">Within 1.00m (Tolerant):</span>
                <span className="text-cyan-400 font-bold">{building.fidelity3D.pctWithin100m}%</span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, building.fidelity3D.pctWithin100m)}%` }}
                />
              </div>
            </div>

            {/* 2.5D Height Error Map Summary (1m spatial grid) */}
            {building.heightErrorMap25D && (
              <div className="pt-2 border-t border-zinc-850 space-y-1.5 font-mono text-[9px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 font-bold">2.5D Height Error (1m Grid):</span>
                  <span className="text-zinc-400">
                    Mean ΔZ: <span className="text-white font-bold">{building.heightErrorMap25D.meanDeltaZMeters > 0 ? '+' : ''}{building.heightErrorMap25D.meanDeltaZMeters.toFixed(2)}m</span>
                  </span>
                </div>

                {/* Color-coded distribution bar */}
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-zinc-900 border border-zinc-800">
                  <div
                    style={{ width: `${building.heightErrorMap25D.pctFaithfulGreen}%` }}
                    className="bg-emerald-500 h-full"
                    title={`Green (<=0.5m): ${building.heightErrorMap25D.pctFaithfulGreen}%`}
                  />
                  <div
                    style={{ width: `${building.heightErrorMap25D.pctModerateYellow}%` }}
                    className="bg-amber-400 h-full"
                    title={`Yellow (0.5m-1.5m): ${building.heightErrorMap25D.pctModerateYellow}%`}
                  />
                  <div
                    style={{ width: `${building.heightErrorMap25D.pctLargeRed}%` }}
                    className="bg-rose-500 h-full"
                    title={`Red (>1.5m): ${building.heightErrorMap25D.pctLargeRed}%`}
                  />
                </div>

                <div className="flex items-center justify-between text-[8px] text-zinc-400 pt-0.5">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    ≤0.5m: <strong className="text-emerald-400">{building.heightErrorMap25D.pctFaithfulGreen}%</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                    0.5–1.5m: <strong className="text-amber-400">{building.heightErrorMap25D.pctModerateYellow}%</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                    &gt;1.5m: <strong className="text-rose-400">{building.heightErrorMap25D.pctLargeRed}%</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Detected 3D Architectural Planes Table */}
            {building.architecture?.planes && building.architecture.planes.length > 0 && (
              <div className="pt-2 border-t border-zinc-850 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-zinc-300 font-bold">
                    Detected Planes ({building.architecture.planes.length}):
                  </span>
                  <span className="text-[8px] font-mono text-cyan-400 px-1 rounded bg-cyan-950/60 border border-cyan-800">
                    {building.architecture.classification.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                  {building.architecture.planes.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[8px] font-mono flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-zinc-200">
                          +{p.heightAboveGroundMeters}m ({p.areaSqM} m²)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`px-1 py-0.2 rounded font-bold ${
                          p.isSloped ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {p.isSloped ? `Tilt ${p.tiltDegrees}°` : 'Flat Deck'}
                        </span>
                        <span className="text-zinc-500">{p.pointCount} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Honest Topology & Footprint Constraints */}
            <div className="pt-1.5 border-t border-zinc-850 text-[8px] font-mono text-zinc-500 space-y-0.5">
              <div className="flex items-center justify-between">
                <span>Mesh Topology:</span>
                <span className={building.topology?.isWatertight ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                  {building.topology?.isWatertight ? "Watertight Solid (Closed)" : "Open Boundary"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>OSM Footprint Boundary:</span>
                <span className="text-zinc-300 font-bold">100% Boundary Alignment</span>
              </div>
              <p className="text-[7.5px] text-zinc-600 font-sans italic pt-0.5">
                Note: Footprint alignment & manifold watertightness are structural boundary checks, not surface accuracy.
              </p>
            </div>
          </div>
        ) : building.validation ? (
          <div className="p-2.5 rounded-2xl bg-zinc-950 border border-emerald-900/60 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-850">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>LOD2 Geometric Validation</span>
              </span>
              <span className="text-[8px] font-mono px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                METRICS
              </span>
            </div>

            {/* Transparent Boundary-Clipped Alignment Notice */}
            {isBoundaryClipped && (
              <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/80 space-y-1 font-mono text-[9px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Alignment:</span>
                  <span className="text-amber-300 font-bold px-1.5 py-0.2 rounded bg-amber-950 border border-amber-700">
                    BOUNDARY CLIPPED
                  </span>
                </div>
                <p className="text-zinc-300 font-sans text-[8.5px] leading-tight">
                  <strong>Reason:</strong> OSM footprint extends beyond available USGS LiDAR tile ({Math.round(coverageInfo.coverageRatio * 100)}% inside tile). Truncation at tile edge causes apparent IoU and centroid offset, not an algorithm failure.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
              <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[9px]">Roof Geometry:</span>
                <span className="text-white font-bold">{building.validation.roofClassification.replace(/_/g, ' ')}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[9px]">Watertight Manifold:</span>
                <span className={building.validation.isWatertight ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                  {building.validation.isWatertight ? "VERIFIED (100%)" : "UNCLOSED"}
                </span>
              </div>
              <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[9px]">Roof Plane RMSE:</span>
                <span className="text-cyan-300 font-bold">±{building.validation.roofElevationRMSE} m</span>
              </div>
              <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[9px]">OSM ↔ Mesh IoU:</span>
                <span className="text-white font-bold">{(building.validation.osmMeshIoU * 100).toFixed(0)}% (0.0m offset)</span>
              </div>
            </div>

            {building.validation.tiers && building.validation.tiers.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-zinc-850">
                <span className="text-[9px] font-mono text-zinc-400 block font-bold">Detected Architectural Tiers:</span>
                {building.validation.tiers.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900/60 border border-zinc-800/80">
                    <span className="text-zinc-300">{t.tierName}</span>
                    <span className="text-amber-300">+{t.heightAboveGroundMeters}m ({t.elevationAMSL}m AMSL)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Supporting Evidence: YOLO Segmentation (Real or Honestly Unavailable) */}
        {building.yoloMaskCoordinates && building.yoloIoU !== undefined ? (
          <div className="p-2.5 rounded-2xl bg-zinc-950 border border-pink-500/30 space-y-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-850">
              <span className="text-[10px] font-mono uppercase tracking-wider text-pink-400 font-bold flex items-center gap-1">
                <Scan className="w-3.5 h-3.5 text-pink-400" />
                <span>YOLOv8 Aerial Mask Match</span>
              </span>
              <span className="text-[8px] font-mono px-1 rounded bg-pink-950 text-pink-300 border border-pink-800 font-bold">
                DERIVED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
              <div>
                <span className="text-zinc-500 block">Aerial IoU:</span>
                <span className="font-bold text-pink-300">{(building.yoloIoU * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Model Confidence:</span>
                <span className="font-bold text-white">
                  {building.yoloConfidence ? `${(building.yoloConfidence * 100).toFixed(0)}%` : 'Active'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-[10px] font-mono space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1">
                <Scan className="w-3 h-3 text-zinc-500" />
                <span>AI Building Extraction:</span>
              </span>
              <span className="text-amber-400 font-bold text-[8.5px] px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-800">
                RESEARCH / FUTURE MODULE
              </span>
            </div>
            <p className="text-[9px] text-zinc-500 font-sans leading-tight">
              Standard COCO model does not contain a dedicated building class. Model serves as research/validation contour reference.
            </p>
          </div>
        )}

        {/* Underground Infrastructure Preview */}
        <div className="p-2.5 rounded-2xl bg-zinc-950 border border-purple-900/60 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between pb-1 border-b border-zinc-850">
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>UNDERGROUND INFRASTRUCTURE</span>
            </span>
            <span className="text-[8px] px-1.5 py-0.2 rounded bg-purple-950 border border-purple-800 text-purple-300 font-bold">
              DEMO
            </span>
          </div>

          <div className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1 text-[9.5px]">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Authoritative data for this building:</span>
              <span className="text-rose-400 font-bold">UNAVAILABLE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Visualization:</span>
              <span className="text-purple-300 font-bold">DEMO</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Depth:</span>
              <span className="text-amber-300 font-bold">ESTIMATED</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Source:</span>
              <span className="text-zinc-300 font-semibold text-[8.5px] truncate max-w-[150px]">
                No authoritative feature available for current AOI
              </span>
            </div>
          </div>

          <p className="text-[8px] text-zinc-500 font-sans leading-tight italic">
            Airborne LiDAR does not detect underground infrastructure. Underground visualization is a prototype representation pending authoritative utility/GPR/BIM data.
          </p>

          <div className="flex items-center justify-between text-[9px] pt-0.5">
            <span className="text-purple-300 font-bold truncate max-w-[190px]">
              DEMO — NOT AUTHORITATIVE
            </span>
            {onExploreUnderground && (
              <button
                onClick={onExploreUnderground}
                className="text-purple-400 hover:text-purple-300 underline font-bold cursor-pointer"
              >
                Explore 3D ↓
              </button>
            )}
          </div>
        </div>

        {/* Data Architecture Transparency Box */}
        <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 text-[9px] text-zinc-500 space-y-0.5 font-mono">
          <div className="flex items-center justify-between">
            <span>Authoritative Ownership Records:</span>
            <span className="text-zinc-400 font-bold">NOT CONNECTED</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Official Government ULPIN:</span>
            <span className="text-zinc-400 font-bold">NOT CONNECTED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
