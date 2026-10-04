import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Maximize2,
  Globe2,
  Compass,
  Layers,
  ChevronRight,
  X,
  Eye,
  Sliders,
  Sparkles,
  MapPin,
  RotateCcw
} from 'lucide-react';
import { LABuildingRecord } from '../../types/lidar';

interface BuildingNavigatorProps {
  buildings: LABuildingRecord[];
  selectedBuilding: LABuildingRecord | null;
  onSelectBuilding: (building: LABuildingRecord) => void;
  onFlyToPrecinct: () => void;
  onFlyToGlobal: () => void;
  onSetCameraPreset: (preset: 'overview' | 'street' | 'ortho' | 'orbit') => void;
  isOpen: boolean;
  onClose: () => void;
  isGlobalMode: boolean;
  activePreset?: 'overview' | 'street' | 'ortho' | 'orbit';
  isOrbiting?: boolean;
}

export const BuildingNavigator: React.FC<BuildingNavigatorProps> = ({
  buildings,
  selectedBuilding,
  onSelectBuilding,
  onFlyToPrecinct,
  onFlyToGlobal,
  onSetCameraPreset,
  isOpen,
  onClose,
  isGlobalMode,
  activePreset = 'overview',
  isOrbiting = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [heightFilter, setHeightFilter] = useState<'all' | 'high' | 'mid' | 'low'>('all');

  // Filtered and sorted buildings list
  const filteredBuildings = useMemo(() => {
    return buildings
      .filter((b) => {
        const matchesQuery =
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(b.osmWayId).includes(searchQuery);

        if (!matchesQuery) return false;

        if (heightFilter === 'high') return b.derivedHeightMeters >= 40;
        if (heightFilter === 'mid') return b.derivedHeightMeters >= 15 && b.derivedHeightMeters < 40;
        if (heightFilter === 'low') return b.derivedHeightMeters < 15;
        return true;
      })
      .sort((a, b) => b.derivedHeightMeters - a.derivedHeightMeters);
  }, [buildings, searchQuery, heightFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 sm:w-96 bg-zinc-950/95 backdrop-blur-2xl border-l border-zinc-800 shadow-2xl flex flex-col text-white animate-slideInRight select-none pointer-events-auto">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>3D Construction Navigator</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                {buildings.length}
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400 font-mono">
              DTLA South Park · USGS 3DEP Survey
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Close Navigator"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Action Buttons: Globe vs 3D Precinct Flight */}
      <div className="p-3 border-b border-zinc-850 bg-black/40 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onFlyToGlobal}
            className={`py-2 px-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition-all ${
              isGlobalMode
                ? 'bg-white text-black border-white shadow-sm'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>3D Earth Globe</span>
          </button>

          <button
            onClick={onFlyToPrecinct}
            className={`py-2 px-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition-all ${
              !isGlobalMode && !selectedBuilding
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                : 'bg-zinc-900/80 text-cyan-400 border-cyan-900/60 hover:bg-cyan-950/60'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Precinct 3D</span>
          </button>
        </div>

        {/* Camera Angle Quick Presets */}
        <div className="pt-1.5 border-t border-zinc-900">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold block mb-1.5">
            Camera Angles (3D Construction)
          </span>
          <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
            <button
              onClick={() => onSetCameraPreset('overview')}
              className={`py-1.5 rounded-lg border text-center transition-all ${
                activePreset === 'overview'
                  ? 'bg-zinc-800 text-white border-zinc-600 font-bold'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:text-white'
              }`}
              title="Aerial Perspective"
            >
              🦅 Aerial
            </button>
            <button
              onClick={() => onSetCameraPreset('street')}
              className={`py-1.5 rounded-lg border text-center transition-all ${
                activePreset === 'street'
                  ? 'bg-zinc-800 text-white border-zinc-600 font-bold'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:text-white'
              }`}
              title="Street Pedestrian View"
            >
              🏙️ Street
            </button>
            <button
              onClick={() => onSetCameraPreset('ortho')}
              className={`py-1.5 rounded-lg border text-center transition-all ${
                activePreset === 'ortho'
                  ? 'bg-zinc-800 text-white border-zinc-600 font-bold'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:text-white'
              }`}
              title="Top-Down Orthogonal"
            >
              📐 Ortho
            </button>
            <button
              onClick={() => onSetCameraPreset('orbit')}
              className={`py-1.5 rounded-lg border text-center transition-all flex items-center justify-center gap-1 ${
                isOrbiting
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold animate-pulse'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:text-white'
              }`}
              title="Smooth 360° Orbit"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Orbit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="p-3 border-b border-zinc-800 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 128 buildings by name or ID..."
            className="w-full pl-8.5 pr-8 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Height Classification Pills */}
        <div className="flex items-center gap-1 text-[10px] font-mono overflow-x-auto pb-0.5 custom-scrollbar">
          <button
            onClick={() => setHeightFilter('all')}
            className={`px-2 py-0.5 rounded-full border transition-all ${
              heightFilter === 'all'
                ? 'bg-zinc-800 text-white border-zinc-600 font-bold'
                : 'bg-zinc-950 text-zinc-500 border-zinc-850 hover:text-zinc-300'
            }`}
          >
            All ({buildings.length})
          </button>
          <button
            onClick={() => setHeightFilter('high')}
            className={`px-2 py-0.5 rounded-full border transition-all ${
              heightFilter === 'high'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-bold'
                : 'bg-zinc-950 text-zinc-500 border-zinc-850 hover:text-zinc-300'
            }`}
          >
            &gt;40m High-Rise
          </button>
          <button
            onClick={() => setHeightFilter('mid')}
            className={`px-2 py-0.5 rounded-full border transition-all ${
              heightFilter === 'mid'
                ? 'bg-amber-950 text-amber-300 border-amber-700 font-bold'
                : 'bg-zinc-950 text-zinc-500 border-zinc-850 hover:text-zinc-300'
            }`}
          >
            15–40m Mid
          </button>
          <button
            onClick={() => setHeightFilter('low')}
            className={`px-2 py-0.5 rounded-full border transition-all ${
              heightFilter === 'low'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700 font-bold'
                : 'bg-zinc-950 text-zinc-500 border-zinc-850 hover:text-zinc-300'
            }`}
          >
            &lt;15m Low
          </button>
        </div>
      </div>

      {/* Buildings List with Instant Fly-To */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1 mb-1">
          <span>MATCHING BUILDINGS</span>
          <span>{filteredBuildings.length} RESULTS</span>
        </div>

        {filteredBuildings.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500 font-mono">
            No buildings found matching &quot;{searchQuery}&quot;
          </div>
        ) : (
          filteredBuildings.map((bld) => {
            const isSelected = selectedBuilding?.id === bld.id;
            return (
              <div
                key={bld.id}
                onClick={() => onSelectBuilding(bld)}
                className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 group flex items-center justify-between ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-500 shadow-md text-white'
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        bld.derivedHeightMeters >= 40
                          ? 'bg-cyan-400'
                          : bld.derivedHeightMeters >= 15
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                      {bld.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                    <span className="text-cyan-400 font-bold">
                      {bld.derivedHeightMeters}m
                    </span>
                    <span>·</span>
                    <span>{bld.inferredFloors} Floors</span>
                    <span>·</span>
                    <span>{Math.round(bld.footprintAreaSqM).toLocaleString()} m²</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBuilding(bld);
                    }}
                    className={`py-1 px-2 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-white text-black shadow-sm'
                        : 'bg-zinc-800 text-zinc-300 group-hover:bg-cyan-900/80 group-hover:text-cyan-300'
                    }`}
                  >
                    <span>Fly</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Summary */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-cyan-400" />
          <span>34.037° N, 118.261° W</span>
        </span>
        <span className="text-zinc-500">
          NAVD88 · 72.17m AMSL
        </span>
      </div>
    </div>
  );
};
