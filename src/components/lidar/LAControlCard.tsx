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
  Sparkles
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
  onResetCamera
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
          <option value="">-- Choose a Building to Inspect --</option>
          {buildings.slice(0, 40).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.derivedHeightMeters}m · {b.inferredFloors} lvls)
            </option>
          ))}
        </select>
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
