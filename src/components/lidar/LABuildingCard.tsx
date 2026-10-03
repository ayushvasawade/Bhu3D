import React, { useState } from 'react';
import {
  Building2,
  Box,
  Layers,
  Compass,
  MapPin,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Activity,
  Maximize2,
  ExternalLink,
  ShieldCheck,
  Hash
} from 'lucide-react';
import { LABuildingRecord } from '../../types/lidar';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';

interface LABuildingCardProps {
  building: LABuildingRecord | null;
  onClose: () => void;
  onFocusBuilding?: (building: LABuildingRecord) => void;
  selectedFloor?: number | null;
  onSelectFloor?: (floor: number | null) => void;
}

export const LABuildingCard: React.FC<LABuildingCardProps> = ({
  building,
  onClose,
  onFocusBuilding,
  selectedFloor = null,
  onSelectFloor
}) => {
  const [showAllFloors, setShowAllFloors] = useState<boolean>(false);

  if (!building) return null;

  const displayedLevels = showAllFloors ? building.levels : building.levels.slice(0, 5);

  return (
    <div className="gis-glass-panel rounded-3xl p-4 w-72 sm:w-80 md:w-88 max-w-[340px] shadow-2xl pointer-events-auto border border-zinc-800 transition-all duration-300 select-text animate-fadeIn flex flex-col max-h-[calc(100vh-12rem)]">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800 shrink-0">
        <div className="flex items-center space-x-1.5">
          <DataProvenanceBadge status="REAL" label="USGS LiDAR" size="sm" />
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
            {building.buildingType}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Close Card"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pt-3 space-y-3 font-sans">
        {/* Building Title & Address */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-white shrink-0" />
              <span className="truncate">{building.name}</span>
            </h3>
            {onFocusBuilding && (
              <button
                onClick={() => onFocusBuilding(building)}
                className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                title="Focus Camera on Building"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
            <span>South Park, Downtown Los Angeles, CA</span>
          </p>
          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
            {building.center.latitude.toFixed(6)}° N, {Math.abs(building.center.longitude).toFixed(6)}° W
          </p>
        </div>

        {/* Observed vs Inferred Metrics Grid */}
        <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
          <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-[9px] text-zinc-400 mb-0.5">
              <span>LiDAR Height</span>
              <span className="text-[8px] px-1 rounded bg-zinc-900 text-emerald-400 font-bold border border-emerald-900">REAL</span>
            </div>
            <span className="font-bold text-white text-sm">{building.derivedHeightMeters} m</span>
            <span className="text-[10px] text-zinc-400 block font-sans">
              {(building.derivedHeightMeters * 3.28084).toFixed(1)} ft
            </span>
          </div>

          <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-[9px] text-zinc-400 mb-0.5">
              <span>Footprint Area</span>
              <span className="text-[8px] px-1 rounded bg-zinc-900 text-emerald-400 font-bold border border-emerald-900">REAL</span>
            </div>
            <span className="font-bold text-white text-sm">{building.footprintAreaSqM.toLocaleString()} m²</span>
            <span className="text-[10px] text-zinc-400 block font-sans">
              {building.pointCount.toLocaleString()} laser pts
            </span>
          </div>

          <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[9px] text-zinc-400 block mb-0.5 font-sans">Peak Z (AMSL)</span>
            <span className="font-bold text-white">{building.peakElevationAMSL} m</span>
            <span className="text-[9px] text-zinc-500 block font-sans">Ground: {building.localGroundAMSL}m</span>
          </div>

          <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-[9px] text-zinc-400 mb-0.5">
              <span>Inferred Floors</span>
              <span className="text-[8px] px-1 rounded bg-zinc-900 text-amber-400 font-bold border border-amber-900">INFERRED</span>
            </div>
            <span className="font-bold text-white text-sm">{building.inferredFloors} Levels</span>
            <span className="text-[9px] text-zinc-400 block font-sans">
              {building.tagLevels ? `OSM: ${building.tagLevels} lvls` : '~3.5m/floor'}
            </span>
          </div>
        </div>

        {/* Vertical Floor Stratification (Requirement 6) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold flex items-center gap-1">
              <Layers className="w-3 h-3 text-white" />
              <span>Vertical Floor Slices ({building.inferredFloors})</span>
            </span>
            <span className="text-[9px] font-mono text-amber-400">
              INFERRED
            </span>
          </div>

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
                    <span className={`text-[9px] ${isSelected ? 'text-zinc-700' : 'text-zinc-500'}`}>
                      Δh = {lvl.heightMeters}m
                    </span>
                  </div>
                </button>
              );
            })}

            {building.levels.length > 5 && (
              <button
                onClick={() => setShowAllFloors(!showAllFloors)}
                className="w-full py-1 text-center text-[10px] font-mono text-zinc-400 hover:text-white flex items-center justify-center gap-1 mt-1"
              >
                <span>{showAllFloors ? 'Show Fewer Floors' : `View All ${building.levels.length} Floors`}</span>
                {showAllFloors ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* 3D Cadastral Unit Identifier (Conceptual 3D ULPIN) */}
        <div className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold flex items-center gap-1">
              <Hash className="w-3 h-3 text-white" />
              <span>3D Cadastral Unit ULPIN</span>
            </span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-700">
              PROPOSED
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-black border border-zinc-850 font-mono text-[10px] text-zinc-200 truncate">
            {selectedFloor
              ? `US-CA-LA-${building.osmWayId}-L${String(selectedFloor).padStart(2, '0')}`
              : `US-CA-LA-${building.osmWayId}-PARCEL`}
          </div>
          <p className="text-[9px] text-zinc-400 leading-relaxed font-sans">
            Demonstrates 3D cadastral indexing linking 2D footprint to vertical volume slice.
          </p>
        </div>

        {/* Distinction Disclosure (Requirement 6) */}
        <div className="p-2 rounded-xl bg-black border border-zinc-800 text-[10px] text-zinc-400 leading-snug flex items-start space-x-1.5">
          <AlertTriangle className="w-3 h-3 text-zinc-400 shrink-0 mt-0.5" />
          <span>
            <strong>Data Honesty:</strong> Building height ({building.derivedHeightMeters}m) and footprint ({building.footprintAreaSqM}m²) are directly derived from USGS LiDAR. Vertical floor slabs are algorithmically inferred.
          </span>
        </div>
      </div>
    </div>
  );
};
