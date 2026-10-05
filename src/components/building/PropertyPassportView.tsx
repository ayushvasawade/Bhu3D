import React, { useState } from 'react';
import {
  FileText,
  Building2,
  MapPin,
  Box,
  Layers,
  ShieldCheck,
  Compass,
  CheckCircle2,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { LABuildingRecord } from '../../types/lidar';
import { PropertyPassportData } from '../../types/intelligence';
import { intelligenceService } from '../../services/intelligenceService';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';
import { checkLidarBoundaryCoverage, generateBuildingFloors } from '../../utils/geoUtils';

interface PropertyPassportViewProps {
  building: LABuildingRecord;
  undergroundData?: import('../../types/underground').UndergroundQueryResult | null;
  selectedFloor?: number | null;
  onSelectFloor?: (floor: number | null) => void;
  className?: string;
  isCollapsible?: boolean;
}

export const PropertyPassportView: React.FC<PropertyPassportViewProps> = ({
  building,
  undergroundData = null,
  selectedFloor = 1,
  onSelectFloor,
  className = '',
  isCollapsible = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [showAllFloors, setShowAllFloors] = useState<boolean>(false);

  const currentFloorNum = selectedFloor || 1;

  // Generate authoritative Property Passport data
  const passport: PropertyPassportData = intelligenceService.generatePropertyPassport(
    building,
    undergroundData,
    currentFloorNum
  );

  const cleanBldId = building.id.replace(/[^a-zA-Z0-9]/g, '');
  const floorCode = `F${String(currentFloorNum).padStart(2, '0')}`;
  const derivedPropertyId = `BH3D-SPARK-${cleanBldId}-${floorCode}-U01`;

  const handleCopyId = () => {
    navigator.clipboard.writeText(derivedPropertyId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(passport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Bhu3D_Property_Passport_${building.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const coverageInfo = checkLidarBoundaryCoverage(
    building.footprintCoordinates,
    building.lidarCoverageStatus,
    building.coverageRatio,
    building.lidarCoverageNote
  );

  const floors = passport.verticalStructure.floors;
  const displayedFloors = showAllFloors ? floors : floors.slice(0, 5);

  return (
    <div
      className={`rounded-3xl bg-zinc-950/95 border-2 border-cyan-800/80 shadow-2xl backdrop-blur-2xl transition-all duration-300 font-mono text-zinc-200 overflow-hidden ${className}`}
      id="property-passport-root"
    >
      {/* 1. PASSPORT OFFICIAL HEADER */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-black p-4 sm:p-6 border-b border-cyan-900/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/90 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-950/60 shrink-0">
            <Building2 className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                CENTRAL PROPERTY RECORD
              </span>
              <span className="text-[10px] text-zinc-500 font-sans">
                Doc Ref: {passport.version} • {new Date(passport.generatedTimestamp).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-0.5">
              <span>Bhu3D 3D Property Passport</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Export complete Property Passport JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export Passport</span>
          </button>

          {isCollapsible && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse Passport' : 'Expand Passport'}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* CENTRAL IDENTIFIER CALLOUT BANNER */}
          <div className="p-4 sm:p-5 rounded-2xl bg-black/90 border border-cyan-800/80 shadow-xl space-y-4">
            {/* Top Identity Grid: Official ULPIN vs Bhu3D 3D Property ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Official ULPIN (Honest UNAVAILABLE status) */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-rose-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase text-zinc-400 font-bold tracking-wider">
                    Official Government ULPIN
                  </span>
                  <DataProvenanceBadge status="UNAVAILABLE" label="UNAVAILABLE" size="sm" />
                </div>
                <div className="text-base sm:text-lg font-bold text-rose-300 font-mono tracking-wide">
                  UNAVAILABLE
                </div>
                <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                  The current Los Angeles validation dataset is based on USGS 3DEP LiDAR and OSM, <strong>NOT an Indian cadastral dataset</strong>. Official ULPIN requires integration with the Department of Land Resources (DoLR).
                </p>
              </div>

              {/* Bhu3D 3D Property ID */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-cyan-700/80 space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase text-cyan-400 font-bold tracking-wider">
                    Bhu3D 3D Property ID
                  </span>
                  <DataProvenanceBadge status="DERIVED" label="DERIVED" size="sm" />
                </div>
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black border border-cyan-900/60">
                  <span className="text-xs sm:text-sm font-bold text-white tracking-wider select-all truncate">
                    {derivedPropertyId}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
                    <span>{copiedId ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
                <div className="text-[10.5px] font-bold text-amber-300 tracking-wide uppercase">
                  Derived Bhu3D 3D Property ID — NOT Official ULPIN
                </div>
                <p className="text-[10px] text-zinc-400 font-sans leading-tight">
                  Deterministic spatial identifier formulated from AOI + OSM Way ID + Floor Level ({floorCode}) + Synthetic Unit (U01).
                </p>
              </div>
            </div>
          </div>

          {/* 8 CONSOLIDATED SECTIONS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. PROPERTY IDENTITY */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Property Identity</span>
                </span>
                <DataProvenanceBadge status="DERIVED" label="DERIVED / REAL" size="sm" />
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-zinc-850">
                  <span className="text-zinc-400">Building Name:</span>
                  <span className="text-white font-bold truncate max-w-[220px]">
                    {passport.identity.buildingName}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-zinc-850">
                  <span className="text-zinc-400">OSM Building ID:</span>
                  <span className="text-cyan-300 font-bold">{passport.identity.osmBuildingId}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-zinc-850">
                  <span className="text-zinc-400">WGS84 Coordinates:</span>
                  <span className="text-white">
                    {passport.identity.wgs84Coordinates.latitude.toFixed(6)}°N,{' '}
                    {passport.identity.wgs84Coordinates.longitude.toFixed(6)}°W
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-zinc-850">
                  <span className="text-zinc-400">AOI Tile Coverage:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      coverageInfo.status === 'FULLY_COVERED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {passport.identity.aoiStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-zinc-400">Locality:</span>
                  <span className="text-zinc-300">{passport.locality}</span>
                </div>
              </div>
            </div>

            {/* 2. GEOMETRY */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Geometry & Elevation Surfaces</span>
                </span>
                <DataProvenanceBadge status="REAL" label="REAL LiDAR" size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Footprint Area:</span>
                  <span className="font-bold text-white text-sm">
                    {Math.round(passport.geometry.footprintAreaSqM).toLocaleString()} m²
                  </span>
                  <span className="text-[9px] text-emerald-400 block font-sans">OSM Verified</span>
                </div>

                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">LiDAR Height:</span>
                  <span className="font-bold text-cyan-300 text-sm">
                    {passport.geometry.lidarHeightMeters.toFixed(2)} m
                  </span>
                  <span className="text-[9px] text-emerald-400 block font-sans">USGS 3DEP Return</span>
                </div>

                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">DEM Bare-Earth:</span>
                  <span className="font-bold text-white">
                    {passport.geometry.demGroundAMSL.toFixed(2)} m AMSL
                  </span>
                  <span className="text-[9px] text-emerald-400 block font-sans">Ground Return DTM</span>
                </div>

                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">DSM Top Surface:</span>
                  <span className="font-bold text-white">
                    {passport.geometry.dsmRoofAMSL.toFixed(2)} m AMSL
                  </span>
                  <span className="text-[9px] text-emerald-400 block font-sans">First Return DSM</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400">nDSM (DSM - DEM):</span>{' '}
                  <span className="text-cyan-300 font-bold">{passport.geometry.ndsmHeightMeters.toFixed(2)} m</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400">3D Mesh:</span>{' '}
                  <span className="text-emerald-400 font-bold">{passport.geometry.meshStatus}</span>
                </div>
              </div>
            </div>

            {/* 3. VERTICAL STRUCTURE */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-amber-950 text-amber-300 border border-amber-800 flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>Vertical Structure & Strata</span>
                </span>
                <DataProvenanceBadge status="ESTIMATED" label="ESTIMATED" size="sm" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block">Floor Count</span>
                  <span className="font-bold text-amber-300 text-base">{passport.verticalStructure.estimatedFloorCount}</span>
                  <span className="text-[8px] text-zinc-400 block">ESTIMATED</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block">Floor Height</span>
                  <span className="font-bold text-white text-base">{passport.verticalStructure.averageFloorHeight.toFixed(2)}m</span>
                  <span className="text-[8px] text-zinc-400 block">AVERAGE</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block">Total Volume</span>
                  <span className="font-bold text-cyan-300 text-base">
                    {(passport.calculatedVolumeM3 ? Math.round(passport.calculatedVolumeM3) : 0).toLocaleString()}
                  </span>
                  <span className="text-[8px] text-zinc-400 block">m³</span>
                </div>
              </div>

              {/* Quick Floor Plates Selector */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Elevation Range AMSL:</span>
                  <span className="text-white font-bold">
                    {passport.verticalStructure.floorElevations.baseGroundAMSL.toFixed(1)}m –{' '}
                    {passport.verticalStructure.floorElevations.roofAMSL.toFixed(1)}m
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {displayedFloors.map((fl) => {
                    const isSelected = currentFloorNum === fl.floorNumber;
                    return (
                      <button
                        key={fl.id}
                        onClick={() => onSelectFloor?.(fl.floorNumber)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 text-black shadow-md'
                            : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                        }`}
                      >
                        <span>{fl.syntheticUnitId.split('-')[3] || `F${fl.floorNumber}`}</span>
                        <span className="opacity-70 text-[9px]">{fl.baseElevation.toFixed(0)}m</span>
                      </button>
                    );
                  })}
                  {floors.length > 5 && (
                    <button
                      onClick={() => setShowAllFloors(!showAllFloors)}
                      className="px-2 py-1 rounded-lg text-[10px] text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 cursor-pointer"
                    >
                      {showAllFloors ? 'Fewer' : `+${floors.length - 5} More`}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 4. UNIT INFORMATION */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-purple-950 text-purple-300 border border-purple-800 flex items-center justify-center text-[10px]">
                    4
                  </span>
                  <span>Unit Information & Demarcations</span>
                </span>
                <DataProvenanceBadge status="DEMO" label="DEMO / PROTOTYPE" size="sm" />
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Active Unit ID:</span>
                  <span className="text-purple-300 font-bold">{passport.unitInformation.selectedUnitId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Unit Boundary Status:</span>
                  <span className="text-rose-400 font-bold px-1.5 py-0.2 rounded bg-rose-950 border border-rose-900 text-[10px]">
                    {passport.unitInformation.boundaryStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Unit Verification:</span>
                  <span className="text-amber-400 font-bold">{passport.unitInformation.unitStatus}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/60 text-[10px] text-amber-200/90 font-sans leading-relaxed">
                <strong>Explicit Cadastral Notice:</strong> {passport.unitInformation.disclaimer}
              </div>
            </div>

            {/* 5. OWNERSHIP */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-rose-950 text-rose-300 border border-rose-800 flex items-center justify-center text-[10px]">
                    5
                  </span>
                  <span>Ownership & Cadastral Registry</span>
                </span>
                <DataProvenanceBadge status="UNAVAILABLE" label="UNAVAILABLE" size="sm" />
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-400">Title Holder / Owner:</span>
                  <span className="text-rose-400 font-bold">{passport.ownership.owner}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-400">APN (Assessor's Parcel Number):</span>
                  <span className="text-rose-400 font-bold">{passport.ownership.apn}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-400">Deed / Land Registry:</span>
                  <span className="text-rose-400 font-bold">{passport.ownership.title}</span>
                </div>
              </div>

              <p className="text-[10px] text-zinc-500 font-sans leading-tight">
                {passport.ownership.disclaimer}
              </p>
            </div>

            {/* 6. UNDERGROUND INFRASTRUCTURE */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-amber-950 text-amber-300 border border-amber-800 flex items-center justify-center text-[10px]">
                    6
                  </span>
                  <span>UNDERGROUND INFRASTRUCTURE</span>
                </span>
                <DataProvenanceBadge
                  status="DEMO"
                  label="DEMO — NOT AUTHORITATIVE"
                  size="sm"
                />
              </div>

              {/* Exact Specification Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Authoritative data for this building:</span>
                  <span className="text-rose-400 font-bold text-xs tracking-wide mt-1">UNAVAILABLE</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Visualization:</span>
                  <span className="text-amber-400 font-bold text-xs tracking-wide mt-1">DEMO</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Depth:</span>
                  <span className="text-cyan-400 font-bold text-xs tracking-wide mt-1">ESTIMATED</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Feature Provenance:</span>
                  <span className="text-amber-300 font-bold text-[11px] tracking-tight mt-1">DEMO — NOT AUTHORITATIVE</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs">
                <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-0.5">Source:</span>
                <span className="text-zinc-300 font-medium">No authoritative feature available for current AOI</span>
              </div>

              {/* Mandatory Explanation */}
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/50 flex gap-2.5 items-start">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-200/90 font-sans leading-relaxed">
                  Airborne LiDAR does not detect underground infrastructure. Underground visualization is a prototype representation pending authoritative utility/GPR/BIM data.
                </p>
              </div>
            </div>

            {/* 7. VALIDATION METRICS */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 lg:col-span-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center text-[10px]">
                    7
                  </span>
                  <span>Multi-Source Validation & Geometric Alignment</span>
                </span>
                <DataProvenanceBadge status="DERIVED" label="DERIVED METRICS" size="sm" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Footprint IoU</span>
                  <span className="font-bold text-white text-base">
                    {(passport.validationMetrics.footprintIoU * 100).toFixed(1)}%
                  </span>
                  <span className="text-[9px] text-cyan-400 block font-sans">OSM ↔ Mesh</span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Centroid Offset</span>
                  <span className="font-bold text-white text-base">
                    {passport.validationMetrics.centroidOffsetMeters.toFixed(2)}m
                  </span>
                  <span className="text-[9px] text-emerald-400 block font-sans">Planar Drift</span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Height Error</span>
                  <span className="font-bold text-cyan-300 text-base">
                    ±{passport.validationMetrics.heightDifferenceMeters.toFixed(2)}m
                  </span>
                  <span className="text-[9px] text-zinc-400 block font-sans">DSM - DEM vs LiDAR</span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Geometry Status</span>
                  <span className="font-bold text-emerald-400 text-sm block truncate">
                    {passport.validationMetrics.geometryStatus}
                  </span>
                  <span className="text-[9px] text-zinc-400 block font-sans">Topology Check</span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-zinc-500 block">LiDAR Coverage</span>
                  <span
                    className={`font-bold text-sm block ${
                      passport.validationMetrics.lidarCoverageStatus === 'FULLY_COVERED'
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {Math.round(passport.validationMetrics.coverageRatio * 100)}%
                  </span>
                  <span className="text-[9px] text-zinc-400 block font-sans truncate">
                    {passport.validationMetrics.lidarCoverageStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* 8. CONSOLIDATED PROVENANCE MATRIX */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 lg:col-span-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center justify-center text-[10px]">
                    8
                  </span>
                  <span>Consolidated Spatial Provenance Matrix</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-sans">
                  Honest multi-source audit across all 12 building layers
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
                {Object.entries(passport.provenanceSummary).map(([layerKey, provStatus]) => (
                  <div
                    key={layerKey}
                    className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-1.5"
                  >
                    <span className="text-[10px] text-zinc-400 capitalize font-mono truncate">
                      {layerKey.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div>
                      <DataProvenanceBadge status={provStatus} label={provStatus} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
