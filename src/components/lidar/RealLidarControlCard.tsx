import React, { useState } from 'react';
import {
  Box,
  Layers,
  Compass,
  Camera,
  CheckCircle2,
  FlaskConical,
  Database,
  Info,
  Sliders,
  Maximize2,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Eye,
  Activity,
  ShieldCheck,
  Scale
} from 'lucide-react';
import {
  RealLidarBuilding,
  LidarViewMode,
  LidarCompareSubMode,
  LidarCameraPreset,
  PointCloudColorMode,
  PointCloudRenderOptions
} from '../../types/lidar';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';

interface RealLidarControlCardProps {
  metadata: RealLidarBuilding | null;
  isRealLidarMode: boolean;
  onToggleMode: (isLidar: boolean) => void;
  cameraPreset: LidarCameraPreset;
  onSelectCameraPreset: (preset: LidarCameraPreset) => void;
  onOpenProvenance: () => void;
  lidarViewMode: LidarViewMode;
  onChangeViewMode: (mode: LidarViewMode) => void;
  compareSubMode: LidarCompareSubMode;
  onChangeCompareSubMode: (subMode: LidarCompareSubMode) => void;
  pointCloudOptions: PointCloudRenderOptions;
  onChangePointCloudOptions: (options: Partial<PointCloudRenderOptions>) => void;
  onOpenSideBySide: () => void;
  onOpenInspector: () => void;
  onResetCamera?: () => void;
}

export const RealLidarControlCard: React.FC<RealLidarControlCardProps> = ({
  metadata,
  isRealLidarMode,
  onToggleMode,
  cameraPreset,
  onSelectCameraPreset,
  onOpenProvenance,
  lidarViewMode,
  onChangeViewMode,
  compareSubMode,
  onChangeCompareSubMode,
  pointCloudOptions,
  onChangePointCloudOptions,
  onOpenSideBySide,
  onOpenInspector,
  onResetCamera
}) => {
  return (
    <div className="gis-glass-panel rounded-3xl p-3.5 w-full shadow-2xl pointer-events-auto border border-zinc-800 transition-all duration-300">
      {/* 1. Mode Switcher (Real Data vs Demo / Lab) */}
      <div className="mb-3 pb-3 border-b border-zinc-800">
        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5 font-bold">
          SYSTEM WORKFLOW MODE
        </span>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/80 rounded-2xl border border-zinc-800">
          <button
            onClick={() => onToggleMode(true)}
            className={`py-2 px-2 rounded-xl text-[11px] font-semibold transition-all flex flex-col items-center justify-center text-center leading-tight gap-1 ${
              isRealLidarMode
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>Real Data</span>
            </span>
            <span className="text-[9px] font-mono opacity-70">LiDAR & OSM</span>
          </button>

          <button
            onClick={() => onToggleMode(false)}
            className={`py-2 px-2 rounded-xl text-[11px] font-semibold transition-all flex flex-col items-center justify-center text-center leading-tight gap-1 ${
              !isRealLidarMode
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span className="flex items-center gap-1">
              <FlaskConical className="w-3 h-3 shrink-0" />
              <span>Demo / Lab</span>
            </span>
            <span className="text-[9px] font-mono opacity-70">Vertical Volume</span>
          </button>
        </div>
      </div>

      {/* 2. Real LiDAR Reconstruction & Scanning Workflow */}
      {isRealLidarMode ? (
        <div className="space-y-3">
          {/* Header Title & Provenance Badges */}
          <div>
            <div className="flex items-center justify-between">
              <DataProvenanceBadge status="REAL" label="REAL LIDAR DATASET" size="sm" />
              <span className="text-[10px] font-mono text-zinc-400">
                OpenTopography
              </span>
            </div>

            <h3 className="text-base font-bold text-white tracking-tight mt-1 flex items-center gap-1.5">
              <Box className="w-4 h-4 text-white" />
              <span>Utah State Capitol</span>
            </h3>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5 font-sans">
              <Compass className="w-3 h-3 text-zinc-500 shrink-0" />
              <span>Salt Lake City, Utah, USA</span>
            </p>
          </div>

          {/* Three View Modes: [ REAL LiDAR SCAN ] [ 3D RECONSTRUCTION ] [ COMPARE ] */}
          <div className="pt-1">
            <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-1 font-bold">
              VIEW / RECONSTRUCTION MODE
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-black rounded-2xl border border-zinc-800">
              <button
                onClick={() => onChangeViewMode('scan')}
                className={`py-1.5 px-1 rounded-xl text-[10px] font-mono font-bold transition-all text-center leading-tight ${
                  lidarViewMode === 'scan'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                REAL SCAN
              </button>

              <button
                onClick={() => onChangeViewMode('reconstruction')}
                className={`py-1.5 px-1 rounded-xl text-[10px] font-mono font-bold transition-all text-center leading-tight ${
                  lidarViewMode === 'reconstruction'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                3D MESH
              </button>

              <button
                onClick={() => onChangeViewMode('compare')}
                className={`py-1.5 px-1 rounded-xl text-[10px] font-mono font-bold transition-all text-center leading-tight ${
                  lidarViewMode === 'compare'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                COMPARE
              </button>
            </div>
          </div>

          {/* MODE-SPECIFIC CONTROLS & METRICS */}

          {/* Mode 1: REAL LiDAR SCAN CONTROLS (Requirement 5) */}
          {lidarViewMode === 'scan' && (
            <div className="p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-300 font-bold flex items-center gap-1">
                  <Activity className="w-3 h-3 text-white" />
                  <span>Real Point Cloud</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  129,568 pts @ 19.8/m²
                </span>
              </div>

              {/* Point Size Control */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>Point Size:</span>
                  <span className="text-white font-bold">{pointCloudOptions.pointSize} px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={pointCloudOptions.pointSize}
                  onChange={(e) => onChangePointCloudOptions({ pointSize: Number(e.target.value) })}
                  className="w-full accent-white h-1 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Colormap Switcher */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 block">Color Mapping:</span>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                  {(
                    [
                      { id: 'rgb', label: 'Survey RGB' },
                      { id: 'elevation', label: 'Elevation' },
                      { id: 'classification', label: 'ASPRS Class' },
                      { id: 'intensity', label: 'Intensity' }
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onChangePointCloudOptions({ colorMode: m.id })}
                      className={`px-2 py-1 rounded-lg border transition-all text-left truncate ${
                        pointCloudOptions.colorMode === m.id
                          ? 'bg-white text-black border-white font-bold'
                          : 'bg-black/60 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Point Density Filter */}
              <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                <span className="text-zinc-400">Density:</span>
                <div className="flex items-center gap-1">
                  {[100, 75, 50, 25].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => onChangePointCloudOptions({ densityPercentage: pct })}
                      className={`px-1.5 py-0.5 rounded text-[9px] border transition-all ${
                        pointCloudOptions.densityPercentage === pct
                          ? 'bg-white text-black font-bold border-white'
                          : 'bg-black text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Building Only Toggle */}
              <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-zinc-800">
                <span className="text-zinc-400">Points Scope:</span>
                <button
                  onClick={() => onChangePointCloudOptions({ buildingOnly: !pointCloudOptions.buildingOnly })}
                  className="px-2 py-0.5 rounded-lg bg-black text-white border border-zinc-700 hover:border-zinc-500 text-[10px]"
                >
                  {pointCloudOptions.buildingOnly ? 'Building Only (130k)' : 'Precinct (183k)'}
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: 3D RECONSTRUCTION DETAILS (Requirement 6) */}
          {lidarViewMode === 'reconstruction' && (
            <div className="p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <DataProvenanceBadge status="DERIVED" size="sm" />
                  <span className="text-[10px] text-zinc-300 font-sans">Generated from REAL LiDAR</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white text-black">
                  HIGH FIDELITY
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="p-1.5 rounded-xl bg-black border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block font-sans">Derived Height</span>
                  <span className="font-bold text-white">74.07 m</span>
                  <span className="text-[9px] text-zinc-400 block font-sans">243.0 ft</span>
                </div>
                <div className="p-1.5 rounded-xl bg-black border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block font-sans">Dome Peak Z</span>
                  <span className="font-bold text-white">1,458.57 m</span>
                  <span className="text-[9px] text-zinc-400 block font-sans">AMSL</span>
                </div>
                <div className="p-1.5 rounded-xl bg-black border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block font-sans">Mesh Topology</span>
                  <span className="font-bold text-white">Watertight</span>
                  <span className="text-[9px] text-zinc-400 block font-sans">222k faces</span>
                </div>
                <div className="p-1.5 rounded-xl bg-black border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block font-sans">Footprint Area</span>
                  <span className="font-bold text-white">6,739 m²</span>
                  <span className="text-[9px] text-zinc-400 block font-sans">OSM polygon</span>
                </div>
              </div>

              {/* Action Button: Open LiDAR -> Mesh Inspector */}
              <button
                onClick={onOpenInspector}
                className="w-full py-1.5 px-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[11px] border border-zinc-700 transition-all flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                <span>Open LiDAR → Mesh QA Inspector</span>
              </button>
            </div>
          )}

          {/* Mode 3: COMPARE CONTROLS (Requirement 7 & 8) */}
          {lidarViewMode === 'compare' && (
            <div className="p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-300 font-bold">
                  Comparison Controls
                </span>
                <span className="text-[9px] font-mono text-zinc-400">
                  Residual RMSE: 0.43m
                </span>
              </div>

              {/* Sub-mode Buttons: LiDAR Only / Mesh Only / Overlay */}
              <div className="grid grid-cols-3 gap-1 text-[9px] font-mono">
                {(
                  [
                    { id: 'overlay', label: 'Overlay' },
                    { id: 'lidar_only', label: 'LiDAR Only' },
                    { id: 'mesh_only', label: 'Mesh Only' }
                  ] as const
                ).map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => onChangeCompareSubMode(sub.id)}
                    className={`py-1 px-1 rounded-lg border transition-all text-center ${
                      compareSubMode === sub.id
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-black/60 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {/* Mesh Opacity Slider for Overlay Mode */}
              {compareSubMode === 'overlay' && (
                <div className="space-y-1 pt-1 border-t border-zinc-800">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>Mesh Opacity:</span>
                    <span className="text-white font-bold">
                      {Math.round(pointCloudOptions.meshOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={pointCloudOptions.meshOpacity}
                    onChange={(e) =>
                      onChangePointCloudOptions({ meshOpacity: Number(e.target.value) })
                    }
                    className="w-full accent-white h-1 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>
              )}

              {/* Dual Actions: Side-by-Side & Side/Elevation Inspector */}
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                <button
                  onClick={onOpenSideBySide}
                  className="w-full py-1.5 px-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-black" />
                  <span>Side-by-Side 3D Viewport</span>
                </button>

                <button
                  onClick={onOpenInspector}
                  className="w-full py-1.5 px-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-[11px] border border-zinc-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5 text-white" />
                  <span>Side / Elevation Profile Inspector</span>
                </button>
              </div>
            </div>
          )}

          {/* Camera Viewpoints for Utah Capitol (Requirement 5, 7, 8: Top, Front, Side Views) */}
          <div>
            <div className="text-[10px] font-mono uppercase text-zinc-400 mb-1.5 flex items-center justify-between font-bold">
              <span className="flex items-center gap-1">
                <Camera className="w-3 h-3 text-white" />
                <span>Camera Viewpoints</span>
              </span>
              {onResetCamera && (
                <button
                  onClick={onResetCamera}
                  className="text-[9px] text-zinc-400 hover:text-white flex items-center gap-0.5"
                  title="Reset Camera to Overview"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
              <button
                onClick={() => onSelectCameraPreset('overview')}
                className={`px-2 py-1 rounded-lg transition-all text-left truncate ${
                  cameraPreset === 'overview'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                }`}
              >
                South Lawn
              </button>

              <button
                onClick={() => onSelectCameraPreset('domeCloseUp')}
                className={`px-2 py-1 rounded-lg transition-all text-left truncate ${
                  cameraPreset === 'domeCloseUp'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                }`}
              >
                Dome &amp; Cupola
              </button>

              <button
                onClick={() => onSelectCameraPreset('frontElevation')}
                className={`px-2 py-1 rounded-lg transition-all text-left truncate ${
                  cameraPreset === 'frontElevation'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                }`}
              >
                Front View (0°)
              </button>

              <button
                onClick={() => onSelectCameraPreset('sideElevation')}
                className={`px-2 py-1 rounded-lg transition-all text-left truncate ${
                  cameraPreset === 'sideElevation'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                }`}
              >
                Side View (90°)
              </button>

              <button
                onClick={() => onSelectCameraPreset('aerialTopDown')}
                className={`px-2 py-1 rounded-lg transition-all text-left truncate ${
                  cameraPreset === 'aerialTopDown'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                }`}
              >
                Top Nadir (90°)
              </button>

              <button
                onClick={() => onSelectCameraPreset('grandSouthPortico')}
                className={`px-2 py-1 rounded-lg transition-all text-left truncate ${
                  cameraPreset === 'grandSouthPortico'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                }`}
              >
                Grand Portico
              </button>
            </div>
          </div>

          {/* Action button: Provenance Dossier */}
          <button
            onClick={onOpenProvenance}
            className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs border border-zinc-700 transition-all flex items-center justify-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5 text-white" />
            <span>Open Provenance Dossier</span>
          </button>

          {/* Honest Technical Limitation Disclosure */}
          <div className="p-2 rounded-xl bg-black border border-zinc-800 text-[10px] text-zinc-400 leading-snug flex items-start space-x-1.5 font-sans">
            <AlertTriangle className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
            <span>
              <strong>Survey Limitation:</strong> Facade geometry limited by LiDAR point density. Windows and column recesses are not resolved by airborne source LiDAR.
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-700 text-xs text-zinc-300 space-y-1 font-sans">
            <div className="font-bold text-white flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-zinc-300" />
              <span>Bhu3D Demonstration / Lab</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Synthetically exploring 3D vertical property volumes, floor plan room extrusions, and proposed vertical cadastral identifiers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
