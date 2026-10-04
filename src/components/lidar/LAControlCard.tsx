import React from 'react';
import {
  Building2,
  Box,
  Layers,
  Compass,
  Sliders,
  Eye,
  Camera,
  RotateCcw,
  Search,
  CheckCircle2,
  Activity,
  MapPin,
  Sparkles,
  Scan,
  Cpu
} from 'lucide-react';
import {
  LADatasetMetadata,
  LABuildingRecord,
  LidarViewMode,
  PointCloudRenderOptions,
  LidarDatasetId
} from '../../types/lidar';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';

interface LAControlCardProps {
  metadata: LADatasetMetadata | null;
  selectedBuilding: LABuildingRecord | null;
  onSelectBuilding: (building: LABuildingRecord | null) => void;
  activeDataset: LidarDatasetId;
  onSelectDataset: (dataset: LidarDatasetId) => void;
  isRealLidarMode?: boolean;
  onToggleMode?: (mode: boolean) => void;
  cameraPreset?: string;
  onSelectCameraPreset?: (preset: any) => void;
  lidarViewMode: LidarViewMode;
  onChangeViewMode: (mode: LidarViewMode) => void;
  compareSubMode?: string;
  onChangeCompareSubMode?: (subMode: any) => void;
  pointCloudOptions: PointCloudRenderOptions;
  onChangePointCloudOptions: (options: Partial<PointCloudRenderOptions>) => void;
  onFlyToPreset?: (preset: 'overview' | 'laPublicWorks' | 'theEden' | 'topDown' | 'street') => void;
  onResetCamera?: () => void;
  onRunYoloSegmentation?: () => void;
  onOpenAlignmentPanel?: () => void;
  onOpenDebugValidation?: () => void;
  isYoloRunning?: boolean;
}

export const LAControlCard: React.FC<LAControlCardProps> = ({
  metadata,
  selectedBuilding,
  onSelectBuilding,
  activeDataset,
  onSelectDataset,
  isRealLidarMode,
  onToggleMode,
  cameraPreset,
  onSelectCameraPreset,
  lidarViewMode,
  onChangeViewMode,
  compareSubMode,
  onChangeCompareSubMode,
  pointCloudOptions,
  onChangePointCloudOptions,
  onFlyToPreset,
  onResetCamera,
  onRunYoloSegmentation,
  onOpenAlignmentPanel,
  onOpenDebugValidation,
  isYoloRunning = false
}) => {
  const buildings = metadata?.buildings || [];

  return (
    <div className="gis-glass-panel rounded-3xl p-3.5 w-full shadow-2xl pointer-events-auto border border-zinc-800 transition-all duration-300 select-text">
      {/* 1. Dataset Switcher (Los Angeles vs Utah Capitol) */}
      <div className="mb-2.5 pb-2.5 border-b border-zinc-800">
        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-1 font-bold">
          ACTIVE REAL LiDAR DATASET
        </span>
        <div className="grid grid-cols-2 gap-1 p-1 bg-black rounded-2xl border border-zinc-800 text-[10px] font-mono">
          <button
            onClick={() => onSelectDataset('la_south_park')}
            className={`py-1.5 px-2 rounded-xl transition-all flex flex-col items-center justify-center text-center leading-tight gap-0.5 ${
              activeDataset === 'la_south_park'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span className="flex items-center gap-1 font-bold">
              <MapPin className="w-3 h-3 shrink-0" />
              <span>Los Angeles, CA</span>
            </span>
            <span className="text-[8px] opacity-75">USGS 3DEP · 129 Bldgs</span>
          </button>

          <button
            onClick={() => onSelectDataset('utah_capitol')}
            className={`py-1.5 px-2 rounded-xl transition-all flex flex-col items-center justify-center text-center leading-tight gap-0.5 ${
              activeDataset === 'utah_capitol'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span className="flex items-center gap-1 font-bold">
              <Building2 className="w-3 h-3 shrink-0" />
              <span>Utah Capitol, UT</span>
            </span>
            <span className="text-[8px] opacity-75">OpenTopo · Dome TIN</span>
          </button>
        </div>
      </div>

      {/* 2. Header Info */}
      <div className="space-y-1 mb-2.5">
        <div className="flex items-center justify-between">
          <DataProvenanceBadge status="REAL" label="USGS 3DEP LiDAR" size="sm" />
          <span className="text-[9px] font-mono text-zinc-400">EPSG:3857 → WGS84</span>
        </div>
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-white" />
          <span>Downtown Los Angeles (South Park)</span>
        </h3>
        <p className="text-[10px] text-zinc-400 font-sans leading-tight">
          3.5M Laser Returns · 129 Reconstructed Real Buildings
        </p>
      </div>

      {/* 3. Three View Modes (Requirement 7): LiDAR Point Cloud / Reconstructed 3D Buildings / Both */}
      <div className="mb-2.5">
        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-1 font-bold">
          LAYER VISUALIZATION (REQ 7)
        </span>
        <div className="grid grid-cols-3 gap-1 p-1 bg-black rounded-2xl border border-zinc-800">
          <button
            onClick={() => onChangeViewMode('scan')}
            className={`py-1 px-1 rounded-xl text-[10px] font-mono font-bold transition-all text-center leading-tight ${
              lidarViewMode === 'scan'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            LiDAR Only
          </button>

          <button
            onClick={() => onChangeViewMode('reconstruction')}
            className={`py-1 px-1 rounded-xl text-[10px] font-mono font-bold transition-all text-center leading-tight ${
              lidarViewMode === 'reconstruction'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            3D Mesh
          </button>

          <button
            onClick={() => onChangeViewMode('compare')}
            className={`py-1 px-1 rounded-xl text-[10px] font-mono font-bold transition-all text-center leading-tight ${
              lidarViewMode === 'compare'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Both (Overlay)
          </button>
        </div>
      </div>

      {/* 4. Controls: Point Size & Opacity */}
      <div className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 mb-2.5">
        {(lidarViewMode === 'scan' || lidarViewMode === 'compare') && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400">
              <span>Point Size:</span>
              <span className="text-white font-bold">{pointCloudOptions.pointSize} px</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={pointCloudOptions.pointSize}
              onChange={(e) => onChangePointCloudOptions({ pointSize: Number(e.target.value) })}
              className="w-full accent-white h-1 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {(lidarViewMode === 'reconstruction' || lidarViewMode === 'compare') && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400">
              <span>Mesh Opacity:</span>
              <span className="text-white font-bold">{Math.round(pointCloudOptions.meshOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={pointCloudOptions.meshOpacity}
              onChange={(e) => onChangePointCloudOptions({ meshOpacity: Number(e.target.value) })}
              className="w-full accent-white h-1 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Color Mapping Mode */}
        {(lidarViewMode === 'scan' || lidarViewMode === 'compare') && (
          <div className="space-y-1 pt-1 border-t border-zinc-850">
            <span className="text-[10px] font-mono text-zinc-400 block">LiDAR Colormap:</span>
            <div className="grid grid-cols-3 gap-1 text-[9px] font-mono">
              {[
                { id: 'elevation', label: 'Elevation' },
                { id: 'classification', label: 'Class' },
                { id: 'intensity', label: 'Intensity' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => onChangePointCloudOptions({ colorMode: m.id as any })}
                  className={`py-1 px-1 rounded-lg border text-center transition-all ${
                    pointCloudOptions.colorMode === m.id
                      ? 'bg-white text-black font-bold border-white'
                      : 'bg-black text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Selectable Building Dropdown (Requirement 8) */}
      <div className="mb-2.5">
        <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-zinc-400 mb-1 font-bold">
          <span>SELECTABLE BUILDINGS (129)</span>
          <span className="text-white">{buildings.length} total</span>
        </div>

        <select
          value={selectedBuilding?.id || ''}
          onChange={(e) => {
            const b = buildings.find((bld) => bld.id === e.target.value);
            onSelectBuilding(b || null);
          }}
          className="w-full bg-black text-white text-[11px] font-mono p-2 rounded-xl border border-zinc-800 hover:border-zinc-700 focus:outline-none focus:border-white transition-colors"
        >
          <option value="">-- Choose a Building to Inspect ({buildings.length}) --</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.derivedHeightMeters}m · {b.inferredFloors} lvls)
            </option>
          ))}
        </select>
      </div>

      {/* 5b. YOLOv8 Segmentation & Convergence Matrix */}
      <div className="mb-2.5 p-2 rounded-2xl bg-gradient-to-r from-pink-950/30 to-indigo-950/30 border border-pink-500/30 space-y-1.5">
        <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-pink-300 font-bold">
          <span className="flex items-center gap-1">
            <Scan className="w-3 h-3 text-pink-400" />
            <span>YOLOv8 Aerial Fusion</span>
          </span>
          <span className="px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[8px]">
            AI VALIDATION
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px] font-semibold">
          {onRunYoloSegmentation && (
            <button
              onClick={onRunYoloSegmentation}
              disabled={isYoloRunning}
              className="py-1.5 px-2 rounded-xl bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/40 text-pink-200 flex items-center justify-center gap-1 transition-all disabled:opacity-50"
            >
              <Scan className="w-3 h-3 text-pink-300" />
              <span>{isYoloRunning ? 'Segmenting...' : 'Segment View'}</span>
            </button>
          )}
          {onOpenAlignmentPanel && (
            <button
              onClick={onOpenAlignmentPanel}
              className="py-1.5 px-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 flex items-center justify-center gap-1 transition-all"
            >
              <Layers className="w-3 h-3 text-indigo-300" />
              <span>5-Layer Matrix</span>
            </button>
          )}
        </div>
        {onOpenDebugValidation && (
          <button
            onClick={onOpenDebugValidation}
            className="w-full py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-mono text-[9px] flex items-center justify-center gap-1.5 transition-all font-semibold"
          >
            <Activity className="w-3 h-3 text-amber-400" />
            <span>Open E2E Validation &amp; Debug Mode</span>
          </button>
        )}
      </div>

      {/* 6. Camera Viewpoints */}
      <div>
        <div className="text-[9px] font-mono uppercase text-zinc-400 mb-1 flex items-center justify-between font-bold">
          <span className="flex items-center gap-1">
            <Camera className="w-3 h-3 text-white" />
            <span>Precinct Viewpoints</span>
          </span>
          <button
            onClick={() => (onResetCamera ? onResetCamera() : onFlyToPreset?.('overview'))}
            className="text-[9px] text-zinc-400 hover:text-white flex items-center gap-0.5"
            title="Reset to Overview"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Reset</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
          <button
            onClick={() => {
              if (onSelectCameraPreset) onSelectCameraPreset('overview');
              onFlyToPreset?.('overview');
            }}
            className="px-2 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 text-left truncate transition-all"
          >
            South Park (750m)
          </button>
          <button
            onClick={() => {
              if (onSelectCameraPreset) onSelectCameraPreset('domeCloseUp');
              onFlyToPreset?.('laPublicWorks');
            }}
            className="px-2 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 text-left truncate transition-all"
          >
            Public Works (56m)
          </button>
          <button
            onClick={() => {
              if (onSelectCameraPreset) onSelectCameraPreset('sideElevation');
              onFlyToPreset?.('theEden');
            }}
            className="px-2 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 text-left truncate transition-all"
          >
            The Eden &amp; WREN
          </button>
          <button
            onClick={() => {
              if (onSelectCameraPreset) onSelectCameraPreset('frontElevation');
              onFlyToPreset?.('street');
            }}
            className="px-2 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 text-left truncate transition-all"
          >
            Street Oblique (35°)
          </button>
        </div>
      </div>
    </div>
  );
};
