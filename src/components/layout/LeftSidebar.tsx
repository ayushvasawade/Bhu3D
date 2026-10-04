import React from 'react';
import {
  Layers,
  Satellite,
  Database,
  Building,
  Box,
  ShieldCheck,
  Building2,
  Scan,
  Compass,
  CheckCircle2,
  Ruler
} from 'lucide-react';
import { LABuildingRecord } from '../../types/lidar';

export interface LayerVisibilityState {
  satellite: boolean;
  lidar: boolean;
  osm: boolean;
  reconstruction: boolean;
  yolo: boolean;
  validation: boolean;
  floorVolumes: boolean;
  terrain: boolean;
}

interface LeftSidebarProps {
  layers: LayerVisibilityState;
  onToggleLayer: (layer: keyof LayerVisibilityState) => void;
  buildings: LABuildingRecord[];
  selectedBuilding: LABuildingRecord | null;
  onSelectBuilding: (building: LABuildingRecord | null) => void;
  onToggleDebugPanel: () => void;
  isDebugPanelOpen: boolean;
  onRunYolo?: () => void;
  isYoloRunning?: boolean;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  layers,
  onToggleLayer,
  buildings,
  selectedBuilding,
  onSelectBuilding,
  onToggleDebugPanel,
  isDebugPanelOpen,
  onRunYolo,
  isYoloRunning = false
}) => {
  return (
    <aside className="gis-glass-panel rounded-3xl p-4 w-72 sm:w-80 shadow-2xl pointer-events-auto border border-zinc-800 transition-all duration-300 flex flex-col gap-4 select-none max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
      {/* Header / Dataset Scope */}
      <div className="pb-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>USGS 3DEP LiDAR ACTIVE</span>
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-700">
            {buildings.length} Bldgs
          </span>
        </div>
        <h2 className="text-sm font-bold text-white tracking-tight">
          Downtown LA South Park
        </h2>
        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
          EPSG:4326 · NAVD88 Datum · 0.00m Normalized
        </p>
      </div>

      {/* SECTION 1: DATA (Primary Real Observations) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold px-1">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-zinc-400" />
            <span>DATA</span>
          </span>
          <span className="text-[9px] text-emerald-400 font-bold">REAL</span>
        </div>

        {/* 1.1 Satellite */}
        <button
          onClick={() => onToggleLayer('satellite')}
          className={`w-full p-2 rounded-2xl border text-left text-xs font-mono transition-all flex items-center justify-between ${
            layers.satellite
              ? 'bg-zinc-900 text-white border-zinc-700 shadow-sm'
              : 'bg-zinc-950/60 text-zinc-500 border-zinc-850 hover:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Satellite className={`w-4 h-4 ${layers.satellite ? 'text-blue-400' : 'text-zinc-600'}`} />
            <div>
              <span className="font-semibold block leading-tight">Satellite</span>
              <span className="text-[9px] text-zinc-400 font-sans">High-Res Earth Observation</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            layers.satellite ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-zinc-900 text-zinc-600'
          }`}>
            {layers.satellite ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* 1.2 LiDAR */}
        <button
          onClick={() => onToggleLayer('lidar')}
          className={`w-full p-2 rounded-2xl border text-left text-xs font-mono transition-all flex items-center justify-between ${
            layers.lidar
              ? 'bg-zinc-900 text-white border-zinc-700 shadow-sm'
              : 'bg-zinc-950/60 text-zinc-500 border-zinc-850 hover:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 flex items-center justify-center font-bold text-[10px] ${layers.lidar ? 'text-emerald-400' : 'text-zinc-600'}`}>
              ⁖
            </div>
            <div>
              <span className="font-semibold block leading-tight">LiDAR</span>
              <span className="text-[9px] text-zinc-400 font-sans">281K Point Cloud Stream</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            layers.lidar ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-zinc-900 text-zinc-600'
          }`}>
            {layers.lidar ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* 1.3 OSM */}
        <button
          onClick={() => onToggleLayer('osm')}
          className={`w-full p-2 rounded-2xl border text-left text-xs font-mono transition-all flex items-center justify-between ${
            layers.osm
              ? 'bg-zinc-900 text-white border-zinc-700 shadow-sm'
              : 'bg-zinc-950/60 text-zinc-500 border-zinc-850 hover:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building className={`w-4 h-4 ${layers.osm ? 'text-amber-400' : 'text-zinc-600'}`} />
            <div>
              <span className="font-semibold block leading-tight">OSM</span>
              <span className="text-[9px] text-zinc-400 font-sans">Orange Vector Footprints</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            layers.osm ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-zinc-900 text-zinc-600'
          }`}>
            {layers.osm ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* SECTION 2: ANALYSIS (Derived Geometric Models) */}
      <div className="space-y-1.5 pt-2 border-t border-zinc-850">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold px-1">
          <span className="flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-zinc-400" />
            <span>ANALYSIS</span>
          </span>
          <span className="text-[9px] text-cyan-400 font-bold">DERIVED</span>
        </div>

        {/* 2.1 3D Reconstruction */}
        <button
          onClick={() => onToggleLayer('reconstruction')}
          className={`w-full p-2 rounded-2xl border text-left text-xs font-mono transition-all flex items-center justify-between ${
            layers.reconstruction
              ? 'bg-zinc-900 text-white border-cyan-700 shadow-sm'
              : 'bg-zinc-950/60 text-zinc-500 border-zinc-850 hover:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Box className={`w-4 h-4 ${layers.reconstruction ? 'text-cyan-400' : 'text-zinc-600'}`} />
            <div>
              <span className="font-semibold block leading-tight">3D Reconstruction</span>
              <span className="text-[9px] text-zinc-400 font-sans">Watertight Cyan Mesh (GLB)</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            layers.reconstruction ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-zinc-900 text-zinc-600'
          }`}>
            {layers.reconstruction ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* 2.2 YOLO Segmentation */}
        <button
          onClick={() => onToggleLayer('yolo')}
          className={`w-full p-2 rounded-2xl border text-left text-xs font-mono transition-all flex items-center justify-between ${
            layers.yolo
              ? 'bg-zinc-900 text-white border-pink-700 shadow-sm'
              : 'bg-zinc-950/60 text-zinc-500 border-zinc-850 hover:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Scan className={`w-4 h-4 ${layers.yolo ? 'text-pink-400' : 'text-zinc-600'}`} />
            <div>
              <span className="font-semibold block leading-tight">YOLOv8 Segmentation</span>
              <span className="text-[9px] text-zinc-400 font-sans">Magenta Aerial Contour</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            layers.yolo ? 'bg-pink-950 text-pink-300 border border-pink-800' : 'bg-zinc-900 text-zinc-600'
          }`}>
            {layers.yolo ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* 2.3 Validation */}
        <button
          onClick={() => onToggleLayer('validation')}
          className={`w-full p-2 rounded-2xl border text-left text-xs font-mono transition-all flex items-center justify-between ${
            layers.validation
              ? 'bg-zinc-900 text-white border-zinc-700 shadow-sm'
              : 'bg-zinc-950/60 text-zinc-500 border-zinc-850 hover:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${layers.validation ? 'text-emerald-400' : 'text-zinc-600'}`} />
            <div>
              <span className="font-semibold block leading-tight">Geometry Validation</span>
              <span className="text-[9px] text-zinc-400 font-sans">Containment & Overlap Bounds</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            layers.validation ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-zinc-900 text-zinc-600'
          }`}>
            {layers.validation ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* SECTION 3: CADASTRE (Vertical Properties & 3D Property ID) */}
      <div className="space-y-1.5 pt-2 border-t border-zinc-850">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold px-1">
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>CADASTRE</span>
          </span>
          <span className="text-[9px] text-amber-400 font-bold">INFERRED</span>
        </div>

        {/* 3.1 Vertical Properties */}
        <button
          onClick={() => onToggleLayer('floorVolumes')}
          className={`w-full p-2 rounded-2xl border text-left text-xs font-mono transition-all flex items-center justify-between ${
            layers.floorVolumes
              ? 'bg-zinc-900 text-white border-amber-700 shadow-sm'
              : 'bg-zinc-950/60 text-zinc-500 border-zinc-850 hover:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className={`w-4 h-4 ${layers.floorVolumes ? 'text-amber-400' : 'text-zinc-600'}`} />
            <div>
              <span className="font-semibold block leading-tight">Vertical Properties</span>
              <span className="text-[9px] text-zinc-400 font-sans">Transparent Stacked Floors</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            layers.floorVolumes ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-zinc-900 text-zinc-600'
          }`}>
            {layers.floorVolumes ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* 3.2 3D Terrain */}
        <button
          onClick={() => onToggleLayer('terrain')}
          className={`w-full p-2 rounded-2xl border text-left text-xs font-mono transition-all flex items-center justify-between ${
            layers.terrain
              ? 'bg-zinc-900 text-white border-zinc-700 shadow-sm'
              : 'bg-zinc-950/60 text-zinc-500 border-zinc-850 hover:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Compass className={`w-4 h-4 ${layers.terrain ? 'text-emerald-400' : 'text-zinc-600'}`} />
            <div>
              <span className="font-semibold block leading-tight">3D Terrain</span>
              <span className="text-[9px] text-zinc-400 font-sans">Cesium World Elevation</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            layers.terrain ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-zinc-900 text-zinc-600'
          }`}>
            {layers.terrain ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Building Quick Selector */}
      <div className="pt-2 border-t border-zinc-850">
        <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
          Select Building ({buildings.length})
        </label>
        <select
          value={selectedBuilding?.id || ''}
          onChange={(e) => {
            const b = buildings.find((x) => x.id === e.target.value) || null;
            onSelectBuilding(b);
          }}
          className="w-full p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
        >
          <option value="">-- Click on Map or Select --</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.derivedHeightMeters}m · {b.inferredFloors}F)
            </option>
          ))}
        </select>
      </div>

      {/* Vertical Placement Audit Debug Button */}
      <div className="pt-1">
        <button
          onClick={onToggleDebugPanel}
          className={`w-full py-1.5 px-2.5 rounded-xl border text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
            isDebugPanelOpen
              ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
          }`}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Vertical Placement Audit {isDebugPanelOpen ? '(Active)' : ''}</span>
        </button>
      </div>
    </aside>
  );
};
