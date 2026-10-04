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
  Globe2
} from 'lucide-react';
import { LABuildingRecord, FloorInspectionOptions } from '../../types/lidar';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';

interface LABuildingCardProps {
  building: LABuildingRecord | null;
  onClose: () => void;
  onFocusBuilding?: (building: LABuildingRecord) => void;
  onFlyToGlobal?: () => void;
  selectedFloor?: number | null;
  onSelectFloor?: (floor: number | null) => void;
  floorInspectionOptions?: FloorInspectionOptions;
  onChangeFloorInspectionOptions?: (opts: Partial<FloorInspectionOptions>) => void;
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
  onChangeFloorInspectionOptions
}) => {
  const [showAllFloors, setShowAllFloors] = useState<boolean>(false);

  if (!building) return null;

  const floorH = floorInspectionOptions.floorHeightAssumption || 3.5;
  const groundZ = building.localGroundAMSL;
  const roofZ = building.mainRoofAMSL || building.peakElevationAMSL;
  const derivedH = Math.max(2.5, roofZ - groundZ);
  const computedCount = Math.max(1, Math.round(derivedH / floorH));
  const perFloorH = derivedH / computedCount;

  // Real point density (points / footprint area)
  const pointDensity = building.footprintAreaSqM > 0
    ? (building.pointCount / building.footprintAreaSqM).toFixed(1)
    : '0.0';

  const dynamicLevels = Array.from({ length: computedCount }, (_, i) => {
    const lvl = i + 1;
    const zMin = groundZ + i * perFloorH;
    const zMax = lvl === computedCount ? roofZ : groundZ + (i + 1) * perFloorH;
    return {
      level: lvl,
      floorName: lvl === 1 ? 'Floor 1 (Ground)' : `Floor ${lvl}`,
      zMinAMSL: Number(zMin.toFixed(2)),
      zMaxAMSL: Number(zMax.toFixed(2)),
      heightMeters: Number((zMax - zMin).toFixed(2))
    };
  });

  const displayedLevels = showAllFloors ? dynamicLevels : dynamicLevels.slice(0, 5);
  const currentFloorNum = selectedFloor || 1;
  const selectedFloorObj = dynamicLevels.find((l) => l.level === currentFloorNum) || dynamicLevels[0];

  // Deterministic Bhu3D-derived 3D Property ID
  const cleanBldId = building.id.replace(/[^a-zA-Z0-9]/g, '');
  const floorCode = `F${String(currentFloorNum).padStart(2, '0')}`;
  const derivedPropertyId = `BH3D-SPARK-${cleanBldId}-${floorCode}-U01`;

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
        </div>

        {/* Feature 3: Derived 3D Property ID / ULPIN-Compatible Identifier */}
        <div className="p-2.5 rounded-2xl bg-zinc-950 border border-cyan-800/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1">
              <Hash className="w-3 h-3 text-cyan-400" />
              <span>Bhu3D Derived 3D Property ID</span>
            </span>
            <span className="text-[8px] font-mono px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
              DERIVED
            </span>
          </div>
          <div className="font-mono text-xs font-bold text-white tracking-wide bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800 select-all">
            {derivedPropertyId}
          </div>
          <p className="text-[9px] text-zinc-500 font-sans leading-tight">
            Deterministic spatial identifier based on precinct + building centroid + floor level + unit index. Not an official government deed record.
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

        {/* Feature 2: Vertical Property / Floor Mapping */}
        <div className="p-2.5 rounded-2xl bg-zinc-950 border border-amber-900/60 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-850">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Vertical Floor Cadastre</span>
            </span>
            <span className="text-[8px] font-mono px-1 rounded bg-amber-950 text-amber-400 border border-amber-900 font-bold">
              INFERRED FLOORS
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
          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1 font-mono text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Selected Level:</span>
              <span className="text-white font-bold">{selectedFloorObj.floorName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Vertical Span:</span>
              <span className="text-white">{selectedFloorObj.zMinAMSL}m – {selectedFloorObj.zMaxAMSL}m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Floor Height:</span>
              <span className="text-cyan-300 font-bold">{selectedFloorObj.heightMeters}m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Floor Footprint:</span>
              <span className="text-amber-300 font-bold">{building.footprintAreaSqM.toLocaleString()} m²</span>
            </div>
          </div>

          {/* Floor Plates List */}
          <div className="space-y-1">
            {displayedLevels.map((lvl) => {
              const isSelected = selectedFloor === lvl.level;
              return (
                <button
                  key={lvl.level}
                  onClick={() => onSelectFloor?.(isSelected ? null : lvl.level)}
                  className={`w-full p-1.5 rounded-xl border text-left text-[11px] font-mono transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-white text-black border-white font-bold shadow-md'
                      : 'bg-zinc-950/80 hover:bg-zinc-900 text-zinc-300 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                      isSelected ? 'bg-black text-white' : 'bg-zinc-900 text-zinc-300'
                    }`}>
                      {lvl.level}
                    </span>
                    <span>{lvl.floorName}</span>
                  </div>

                  <div className="text-right">
                    <span className="block text-[10px]">
                      {lvl.zMinAMSL}m - {lvl.zMaxAMSL}m
                    </span>
                  </div>
                </button>
              );
            })}

            {dynamicLevels.length > 5 && (
              <button
                onClick={() => setShowAllFloors(!showAllFloors)}
                className="w-full py-1 text-center text-[10px] font-mono text-zinc-400 hover:text-white flex items-center justify-center gap-1 mt-1"
              >
                <span>{showAllFloors ? 'Show Fewer Floors' : `View All ${dynamicLevels.length} Floors`}</span>
                {showAllFloors ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Supporting Evidence: YOLO Segmentation (Only Real Runtime Results) */}
        {building.yoloMaskCoordinates && building.yoloIoU !== undefined && (
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
        )}

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
